import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, rmdirSync, statSync } from 'node:fs'

import { join } from 'node:path'
import { downloadWithResume, extractArchive, runCommand } from './gh.js'
import { moveIntoPlace } from './swap.js'

/**
 * Managed components beyond `gh` and ffmpeg: two compiled tools (git, Python)
 * and two source trees (ComfyUI, its official MCP server).
 *
 * Every one installs a whole extracted tree below the shared download root, next
 * to `<root>/gh` and `<root>/ffmpeg`, so one configured `toolsPath` covers all of
 * them:
 *
 *   <root>/git        MinGit zip        binary <root>/git/cmd/git.exe
 *   <root>/python     python-build-*    binary <root>/python/python.exe
 *   <root>/comfyui    GitHub archive    marker <root>/comfyui/main.py
 *   <root>/comfy-mcp  GitHub archive    marker <root>/comfy-mcp/pyproject.toml
 *
 * Versions are pinned here together with the exact release asset (or, for a
 * source tree, the Git ref the archive was cut from). The probe after extraction
 * — running the binary, or finding the marker file — is what makes a broken or
 * truncated archive fail before it replaces a working install.
 */

const DOWNLOAD_TIMEOUT_MS = 20 * 60_000
const VERIFY_TIMEOUT_MS = 30_000

const GIT_VERSION = '2.56.1'
const GIT_TAG = `v${GIT_VERSION}.windows.1`
const GIT_RELEASE = `https://github.com/git-for-windows/git/releases/download/${GIT_TAG}`

const PYTHON_VERSION = '3.11.18'
const PYTHON_TAG = '20261110'
const PYTHON_RELEASE = `https://github.com/astral-sh/python-build-standalone/releases/download/${PYTHON_TAG}`
const PYTHON_ASSET = `cpython-${PYTHON_VERSION}+${PYTHON_TAG}-x86_64-pc-windows-msvc-install_only.tar.gz`

// Source trees, pinned by Git ref. ComfyUI publishes releases (the tag below) and
// the official MCP server does not, so it is pinned to a commit: a branch name
// would silently install something else tomorrow.
const COMFYUI_VERSION = '0.46.0'
const COMFYUI_TAG = `v${COMFYUI_VERSION}`
const COMFYUI_REPO = 'Comfy-Org/ComfyUI'
const COMFY_MCP_REPO = 'Comfy-Org/comfy-mcp'
const COMFY_MCP_COMMIT = '6c438809aca588e9b1cf31ab023d148399338d10'
const COMFY_MCP_SHORT = COMFY_MCP_COMMIT.slice(0, 7)

/**
 * One entry per component. `binary` is relative to the installed tree and is
 * what the post-install probe runs; `binDirs` are the directories that go on
 * PATH (`.` means the install root itself). A source tree has no binary — it is
 * checked against `marker` instead and puts nothing on PATH.
 */
export const COMPONENTS = {
  git: {
    id: 'git',
    name: 'git',
    version: GIT_VERSION,
    source: 'https://git-scm.com/',
    assets: {
      'win32-x64': { url: `${GIT_RELEASE}/MinGit-${GIT_VERSION}-64-bit.zip`, file: `MinGit-${GIT_VERSION}-64-bit.zip`, kind: 'zip' },
      'win32-arm64': { url: `${GIT_RELEASE}/MinGit-${GIT_VERSION}-arm64.zip`, file: `MinGit-${GIT_VERSION}-arm64.zip`, kind: 'zip' },
    },
    binary: join('cmd', 'git.exe'),
    binDirs: ['cmd'],
    args: ['--version'],
    versionPattern: /git version (\S+)/i,
  },
  python: {
    id: 'python',
    name: 'Python',
    version: PYTHON_VERSION,
    source: 'https://github.com/astral-sh/python-build-standalone',
    assets: {
      'win32-x64': {
        // The `+` of the release file name must stay percent-encoded in the URL.
        url: `${PYTHON_RELEASE}/${PYTHON_ASSET.replace('+', '%2B')}`,
        file: PYTHON_ASSET,
        kind: 'tar.gz',
      },
    },
    // The archive carries one top-level `python/` directory.
    subdir: 'python',
    binary: 'python.exe',
    binDirs: ['.', 'Scripts'],
    args: ['--version'],
    versionPattern: /Python (\d+\.\d+\.\d+)/i,
  },
  comfyui: {
    id: 'comfyui',
    name: 'ComfyUI',
    version: COMFYUI_VERSION,
    source: `https://github.com/${COMFYUI_REPO}`,
    // A Git archive instead of a release asset: the same zip on every platform,
    // and GitHub wraps the tree in one `<repo>-<ref>/` directory (see
    // `archiveTree`), which is why `archiveTree: true` is set.
    assets: {
      any: {
        url: `https://github.com/${COMFYUI_REPO}/archive/refs/tags/${COMFYUI_TAG}.zip`,
        file: `ComfyUI-${COMFYUI_TAG}.zip`,
        kind: 'zip',
        archiveTree: true,
      },
    },
    marker: 'main.py',
    binary: null,
    binDirs: [],
    args: null,
  },
  'comfy-mcp': {
    id: 'comfy-mcp',
    name: 'ComfyUI MCP',
    // A commit, not a version: the pin is what the archive is cut from.
    version: `commit ${COMFY_MCP_SHORT}`,
    source: `https://github.com/${COMFY_MCP_REPO}`,
    assets: {
      any: {
        url: `https://github.com/${COMFY_MCP_REPO}/archive/${COMFY_MCP_COMMIT}.zip`,
        file: `comfy-mcp-${COMFY_MCP_SHORT}.zip`,
        kind: 'zip',
        archiveTree: true,
      },
    },
    marker: 'pyproject.toml',
    binary: null,
    binDirs: [],
    args: null,
  },
}

export const COMPONENT_IDS = Object.keys(COMPONENTS)

export function componentSpec(id) {
  return COMPONENTS[id] || null
}

export function componentRoot(root, id) {
  return join(root, id)
}

/**
 * The release asset for this platform, or null when there is no managed build.
 *
 * A compiled component names the platform it was built for; a Git archive (key
 * `any`) is the same bytes everywhere, so a machine without a specific build
 * still gets one.
 */
export function componentAsset(id, platform = process.platform, arch = process.arch) {
  const spec = componentSpec(id)
  if (!spec) return null
  const asset = spec.assets[`${platform}-${arch}`] || spec.assets.any
  return asset ? { ...asset } : null
}

/** The managed binary's path (independent of whether it exists yet). */
export function componentBinaryPath(root, id) {
  const spec = componentSpec(id)
  if (!spec || !spec.binary) return null
  return join(componentRoot(root, id), spec.binary)
}

/**
 * What an install is checked against: the binary of a compiled component, the
 * marker file of a source tree (`ComfyUI/main.py`, the MCP server's
 * `pyproject.toml`). Null for an unknown component.
 */
export function componentEntryPath(root, id) {
  const spec = componentSpec(id)
  if (!spec) return null
  return spec.binary ? componentBinaryPath(root, id) : join(componentRoot(root, id), spec.marker)
}

/** Directories to put on PATH for this component. */
export function componentBinDirs(root, id) {
  const spec = componentSpec(id)
  if (!spec) return []
  return spec.binDirs.map((dir) => (dir === '.' ? componentRoot(root, id) : join(componentRoot(root, id), dir)))
}

/** First `file` on PATH, without running anything. */
export function systemComponentFile(file, platform = process.platform, envPath = process.env.PATH) {
  const separator = platform === 'win32' ? ';' : ':'
  for (const dir of String(envPath || '').split(separator)) {
    if (!dir) continue
    const candidate = join(dir, file)
    try {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    } catch {
      // An unreadable PATH entry is not a candidate.
    }
  }
  return null
}

/** `git version 2.56.1.windows.1` / `Python 3.11.18` → the version, or null. */
export function parseComponentVersion(id, output) {
  const spec = componentSpec(id)
  // A source tree reports no version line; the pin is all there is to show.
  if (!spec || !spec.versionPattern) return null
  return spec.versionPattern.exec(String(output || ''))?.[1] || null
}

const versionCache = new Map()

async function probeVersion(path, spec, run) {
  let stamp
  try {
    const info = statSync(path)
    stamp = `${info.size}:${info.mtimeMs}`
  } catch {
    return null
  }
  const key = `${path}:${spec.id}`
  const cached = versionCache.get(key)
  if (cached && cached.stamp === stamp) return cached.version
  const result = await run(path, spec.args, { timeoutMs: VERIFY_TIMEOUT_MS })
  if (result.code !== 0) return null
  const version = parseComponentVersion(spec.id, `${result.stdout}${result.stderr}`)
  versionCache.set(key, { stamp, version })
  return version
}

const jobs = new Map()

function jobKey(root, id) {
  return `${root}::${id}`
}

/** The `.part` file a resumed download continues from. */
function partPath(root, id, asset) {
  return join(componentRoot(root, id), 'download', `${asset.file}.part`)
}

/** Whether an install for this component is in flight. */
export function componentDownloadRunning(root, id) {
  return jobs.get(jobKey(root, id))?.running === true
}

/**
 * What the settings page shows for one component: managed or PATH copy, its
 * version, and the state of the last managed download.
 */
export async function componentStatus(root, id, { platform = process.platform, arch = process.arch, envPath = process.env.PATH, run = runCommand } = {}) {
  const spec = componentSpec(id)
  if (!spec) throw new Error(`unknown component: ${id}`)
  const asset = componentAsset(id, platform, arch)
  const job = jobs.get(jobKey(root, id)) || null
  const managed = componentEntryPath(root, id)
  const hasManaged = existsSync(managed)
  // A failed job keeps the component "not installed" even if a binary is still
  // on disk, so the page offers a retry instead of a broken install.
  const installed = hasManaged && !job?.error
  // A source tree has no executable to look for on PATH: it is managed or absent.
  const system = !installed && spec.binary
    ? systemComponentFile(spec.binary.split(/[\\/]/).pop(), platform, envPath)
    : null
  const version = installed
    ? spec.binary ? await probeVersion(managed, spec, run) : null
    : system ? await probeVersion(system, spec, run) : null
  const partBytes = asset && existsSync(partPath(root, id, asset)) ? statSync(partPath(root, id, asset)).size : 0
  let state = 'missing'
  if (job?.running) state = 'downloading'
  else if (installed) state = 'installed'
  else if (job?.error) state = 'error'
  else if (system) state = 'system'
  else if (partBytes > 0) state = 'partial'
  const received = job?.running ? job.received : partBytes
  const total = job?.running ? job.total ?? null : null
  return {
    id,
    name: spec.name,
    version: spec.version,
    source: spec.source,
    supported: Boolean(asset),
    url: asset?.url || null,
    file: asset?.file || null,
    state,
    installed,
    system: system !== null,
    systemPath: system,
    // The install root is what a source tree's path line should show; for a
    // compiled component it stays the binary that is actually used.
    binaryPath: installed ? (spec.binary ? managed : componentRoot(root, id)) : system,
    sourceKind: installed ? 'managed' : system ? 'system' : null,
    toolVersion: version,
    received,
    total,
    percent: total ? Math.min(100, Math.round((received / total) * 100)) : null,
    error: job?.error || null,
    installDir: componentRoot(root, id),
  }
}

/** Put the component's directories first on PATH; true when the binary exists. */
export function prependComponentPath(root, id, platform = process.platform) {
  const spec = componentSpec(id)
  if (!spec) return false
  const binary = componentBinaryPath(root, id)
  // A source tree (ComfyUI, the MCP server) contributes nothing to PATH.
  if (!binary || !existsSync(binary)) return false
  const separator = platform === 'win32' ? ';' : ':'
  const current = String(process.env.PATH || '')
  const parts = current.split(separator)
  const dirs = componentBinDirs(root, id).filter((dir) => !parts.includes(dir))
  if (dirs.length === 0) return true
  process.env.PATH = [...dirs, ...parts].join(separator)
  return true
}

/**
 * Where an install unpacks and stages a tree. This must sit beside the
 * component directory, never inside it: the last step renames the staged tree
 * onto `<root>/<id>`, which cannot work while the tree lives below it.
 */
function stagingRoot(root, id) {
  return join(root, '.staging', id)
}

/** Drop what an install needed; a `.part` file is kept until it succeeds. */
function prune(root, id) {
  for (const path of [stagingRoot(root, id), join(componentRoot(root, id), 'download')]) {
    try {
      if (existsSync(path)) rmSync(path, { recursive: true, force: true })
    } catch {
      // Leftovers are harmless; the next install overwrites them.
    }
  }
  // Drop the empty `.staging` parent as well, but never a directory still
  // holding another component's half-finished install.
  try {
    const parent = join(root, '.staging')
    if (existsSync(parent) && readdirSync(parent).length === 0) rmdirSync(parent)
  } catch {
    // An empty parent directory is harmless.
  }
}

/**
 * The directory an archive actually unpacks to.
 *
 * GitHub's `/archive/<ref>.zip` wraps the whole repository in one
 * `<repo>-<ref>/` directory whose name is not part of the pin (`ComfyUI-0.46.0`,
 * `ComfyUI-<sha>`), so that wrapper must be dropped — otherwise the component
 * would install as `<root>/comfyui/ComfyUI-0.46.0/main.py`. Anything that is not
 * a single directory is left alone, so an unexpected layout surfaces as a
 * missing marker instead of a silently nested install.
 */
export function archiveTree(unpacked, asset) {
  if (!asset.archiveTree) return unpacked
  try {
    const entries = readdirSync(unpacked, { withFileTypes: true })
    if (entries.length === 1 && entries[0].isDirectory()) return join(unpacked, entries[0].name)
  } catch {
    // Let the marker check below report the missing tree.
  }
  return unpacked
}

/**
 * Move the staged tree into place and verify it. The previous install is kept
 * until the check passes, then dropped; on failure it is restored, so an install
 * either fully replaces the component or changes nothing. Both renames go
 * through `moveIntoPlace`: Windows reports a tree that is still being scanned (or
 * whose probe process has not fully exited) as `EPERM`, so the swap retries and
 * finally copies instead of failing.
 */
async function swapTree(finalDir, stagedDir, spec, platform, run) {
  const backup = `${finalDir}.old-${process.pid}-${Date.now()}`
  let moved = false
  try {
    if (existsSync(finalDir)) await moveIntoPlace(finalDir, backup)
    await moveIntoPlace(stagedDir, finalDir)
    moved = true
    // A source tree has nothing to execute; its marker file is the whole check.
    if (!spec.binary) {
      if (!existsSync(join(finalDir, spec.marker))) {
        throw new Error(`${spec.name} is missing ${spec.marker} after install`)
      }
    } else {
      const binary = join(finalDir, spec.binary)
      const check = await run(binary, spec.args, { timeoutMs: VERIFY_TIMEOUT_MS })
      if (check.code !== 0) {
        const detail = `${check.stderr}${check.stdout}`.trim().slice(-300)
        throw new Error(`${spec.name} failed its probe after install: ${detail || `exit ${check.code}`}`)
      }
      if (platform !== 'win32') {
        try {
          chmodSync(binary, 0o755)
        } catch {
          // Already executable; the probe above is the real check.
        }
      }
    }
    // A stale backup is harmless; the new tree already answered its probe.
    // Failing here would roll back a verified install because of a locked file.
    if (existsSync(backup)) {
      try {
        rmSync(backup, { recursive: true, force: true })
      } catch {
        // Keep the new install; a later install replaces the stale backup.
      }
    }
  } catch (error) {
    try {
      if (moved && existsSync(finalDir)) rmSync(finalDir, { recursive: true, force: true })
    } catch {
      // Keep restoring the old tree even if the new one is locked.
    }
    try {
      if (existsSync(backup)) await moveIntoPlace(backup, finalDir)
    } catch {
      // Best effort; the caller still reports the install error.
    }
    throw error
  }
}

/**
 * Download, extract and install one component in the background; the page
 * polls {@link componentStatus} for progress. Returns that status at once.
 */
export async function startComponentDownload(root, id, { platform = process.platform, arch = process.arch, run = runCommand } = {}) {
  const spec = componentSpec(id)
  if (!spec) throw new Error(`unknown component: ${id}`)
  const asset = componentAsset(id, platform, arch)
  if (!asset) throw new Error(`${spec.name} has no managed build for ${platform}/${arch}`)
  const key = jobKey(root, id)
  if (jobs.get(key)?.running) return componentStatus(root, id, { platform, arch })
  const job = { running: true, received: 0, total: null, error: null }
  jobs.set(key, job)
  const dir = componentRoot(root, id)
  const part = partPath(root, id, asset)
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new Error('download timed out after 20 minutes'))
  }, DOWNLOAD_TIMEOUT_MS)
  if (typeof timer.unref === 'function') timer.unref()

  void (async () => {
    const downloadDir = join(dir, 'download')
    mkdirSync(downloadDir, { recursive: true })
    const archive = join(downloadDir, asset.file)
    // A finished download is what puts the archive there, so a retry after a
    // failed install reuses it instead of downloading the release again.
    if (!existsSync(archive)) {
      await downloadWithResume({
        url: asset.url,
        partPath: part,
        signal: controller.signal,
        onProgress: (progress) => {
          job.received = progress.received
          job.total = progress.total
        },
      })
      await moveIntoPlace(part, archive)
    }
    const staging = stagingRoot(root, id)
    rmSync(staging, { recursive: true, force: true })
    const unpacked = join(staging, 'unpacked')
    let tree = unpacked
    try {
      await extractArchive(archive, unpacked, asset.kind, platform)
      tree = spec.subdir ? join(unpacked, spec.subdir) : archiveTree(unpacked, asset)
      // Binary or marker: an archive that did not deliver the pinned tree must
      // never replace a working install.
      const stagedEntry = spec.binary ? join(tree, spec.binary) : join(tree, spec.marker)
      if (!existsSync(stagedEntry)) {
        throw new Error(`the archive did not contain ${spec.binary || spec.marker}`)
      }
      if (spec.binary) {
        // Probe the staged copy first: a broken binary must never replace a working one.
        const stagedCheck = await run(stagedEntry, spec.args, { timeoutMs: VERIFY_TIMEOUT_MS })
        if (platform !== 'win32') {
          try {
            chmodSync(stagedEntry, 0o755)
          } catch {
            // Non-fatal; the probe already ran.
          }
        }
        if (stagedCheck.code !== 0) {
          const detail = `${stagedCheck.stderr}${stagedCheck.stdout}`.trim().slice(-300)
          throw new Error(`${spec.name} staged probe failed: ${detail || `exit ${stagedCheck.code}`}`)
        }
      }
    } catch (error) {
      // The archive is the suspect (truncated body, an HTML page served with
      // 200): drop it so the next attempt downloads again instead of unpacking
      // the same broken file forever.
      try {
        rmSync(archive, { force: true })
      } catch {
        // Best effort; the caller still reports the extraction error.
      }
      throw error
    }
    const staged = join(staging, 'tree')
    if (tree !== unpacked) {
      // `subdir` and the Git-archive wrapper both sit below the extraction root.
      cpSync(tree, staged, { recursive: true })
      rmSync(unpacked, { recursive: true, force: true })
    } else {
      await moveIntoPlace(unpacked, staged)
    }
    await swapTree(dir, staged, spec, platform, run)
    prune(root, id)
    prependComponentPath(root, id, platform)
  })().catch((error) => {
    job.error = timedOut
      ? 'download timed out after 20 minutes; the partial file was kept for resume'
      : error instanceof Error ? error.message : String(error)
  }).finally(() => {
    clearTimeout(timer)
    job.running = false
  })
  return componentStatus(root, id, { platform, arch })
}
