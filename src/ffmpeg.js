import { chmodSync, copyFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { downloadWithResume, extractArchive, findBinary, runCommand } from './gh.js'
import { moveIntoPlace } from './swap.js'

/**
 * Managed ffmpeg + ffprobe, next to the managed `gh`.
 *
 * The tools are wanted by video work (ffprobe reads durations and codecs,
 * ffmpeg cuts and transcodes), but a "please install ffmpeg and add it to PATH"
 * note costs more time than the install. This module detects a PATH copy, keeps
 * a managed copy in `<toolsPath>/ffmpeg/bin` next to the managed `gh`, and
 * downloads the release build with HTTP Range resume so an interrupted 110 MB
 * download continues instead of restarting.
 *
 * The archive is a floating "release essentials" build rather than a pinned
 * version: gyan.dev only serves the current release at a stable URL, so the
 * exact build is verified by running `-version` on the staged copies before
 * they replace anything.
 */

const DOWNLOAD_TIMEOUT_MS = 20 * 60_000
const EXTRACT_TIMEOUT_MS = 10 * 60_000
const VERIFY_TIMEOUT_MS = 30_000

/** The archive URL and the binaries it must contain, per platform. */
const SOURCES = {
  win32: {
    url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    file: 'ffmpeg-release-essentials.zip',
    kind: 'zip',
    binaries: { ffmpeg: 'ffmpeg.exe', ffprobe: 'ffprobe.exe' },
  },
}

/** `<toolsPath>/ffmpeg`: the managed component's own directory. */
export function ffmpegRoot(root) {
  return join(root, 'ffmpeg')
}

export function ffmpegBinDir(root) {
  return join(ffmpegRoot(root), 'bin')
}

export function ffmpegSource(platform = process.platform) {
  return SOURCES[platform] || null
}

/** First `name` on PATH, without touching the filesystem beyond that. */
export function systemTool(name, platform = process.platform, envPath = process.env.PATH) {
  const file = platform === 'win32' ? `${name}.exe` : name
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

/** Managed copy first, then PATH: the same precedence the managed `gh` uses. */
export function resolveTool(root, name, { platform = process.platform, envPath = process.env.PATH } = {}) {
  const source = ffmpegSource(platform)
  const managed = source ? join(ffmpegBinDir(root), source.binaries[name]) : null
  if (managed) {
    try {
      if (existsSync(managed) && statSync(managed).isFile()) return { path: managed, managed: true }
    } catch {
      // Fall through to the PATH copy.
    }
  }
  const found = systemTool(name, platform, envPath)
  return found ? { path: found, managed: false } : null
}

/** `ffmpeg version 7.1.1-…` → `7.1.1`; anything else → null. */
export function parseToolVersion(output) {
  const text = String(output || '')
  const match = /(?:ffmpeg|ffprobe) version (\S+)/i.exec(text)
  return match ? match[1] : null
}

const versionCache = new Map()

async function toolVersion(path, { run = runCommand, timeoutMs = VERIFY_TIMEOUT_MS } = {}) {
  let stamp = null
  try {
    const info = statSync(path)
    stamp = `${info.size}:${info.mtimeMs}`
  } catch {
    return null
  }
  const cached = versionCache.get(path)
  if (cached && cached.stamp === stamp) return cached.version
  const result = await run(path, ['-version'], { timeoutMs })
  if (result.code !== 0) return null
  const version = parseToolVersion(`${result.stdout}${result.stderr}`)
  versionCache.set(path, { stamp, version })
  return version
}

const jobs = new Map()

function jobKey(root) {
  return join(ffmpegRoot(root))
}

function jobFor(root) {
  return jobs.get(jobKey(root)) || null
}

/** Whether a managed ffmpeg install is in flight; migration refuses to move it. */
export function ffmpegDownloadRunning(root) {
  return jobFor(root)?.running === true
}

/**
 * What the page shows: whether the tools are usable, where they came from, and
 * the state of the last managed download.
 */
export async function ffmpegStatus(root, {
  platform = process.platform,
  arch = process.arch,
  envPath = process.env.PATH,
  run = runCommand,
} = {}) {
  const source = ffmpegSource(platform)
  const ffmpeg = resolveTool(root, 'ffmpeg', { platform, envPath })
  const ffprobe = resolveTool(root, 'ffprobe', { platform, envPath })
  const [ffmpegVersion, ffprobeVersion] = await Promise.all([
    ffmpeg ? toolVersion(ffmpeg.path, { run }) : null,
    ffprobe ? toolVersion(ffprobe.path, { run }) : null,
  ])
  const job = jobFor(root)
  const installed = Boolean(ffmpeg && ffprobe)
  return {
    // The host platform either has a managed source or the tools must come from PATH.
    supported: Boolean(source),
    platform,
    arch,
    state: installed ? 'installed' : ffmpeg || ffprobe ? 'partial' : 'missing',
    ffmpeg: ffmpeg ? { path: ffmpeg.path, managed: ffmpeg.managed, version: ffmpegVersion } : null,
    ffprobe: ffprobe ? { path: ffprobe.path, managed: ffprobe.managed, version: ffprobeVersion } : null,
    version: ffmpegVersion || ffprobeVersion || null,
    download: {
      running: Boolean(job && job.running),
      received: job ? job.received : 0,
      total: job ? job.total : null,
      percent: job && job.total ? Math.min(100, Math.round((job.received / job.total) * 1000) / 10) : null,
      error: job ? job.error : null,
    },
  }
}

function prune(root) {
  for (const dir of [join(ffmpegRoot(root), 'src'), join(ffmpegRoot(root), 'download')]) {
    try {
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
    } catch {
      // Leftovers are harmless; the next install overwrites them.
    }
  }
}

/**
 * Move the staged `bin` directory into place. The previous directory is kept
 * until the new binaries answer `-version`, then removed. Renames go through
 * `moveIntoPlace` so a lingering lock (antivirus scanning the freshly probed
 * binaries) retries and, if needed, copies instead of failing the install.
 */
async function swapBinDir(root, stagedBin, platform) {
  const binDir = ffmpegBinDir(root)
  const backup = `${binDir}.old-${process.pid}-${Date.now()}`
  let moved = false
  try {
    if (existsSync(binDir)) await moveIntoPlace(binDir, backup)
    await moveIntoPlace(stagedBin, binDir)
    moved = true
    const names = ffmpegSource(platform).binaries
    for (const name of Object.values(names)) {
      const check = await runCommand(join(binDir, name), ['-version'], { timeoutMs: VERIFY_TIMEOUT_MS })
      if (check.code !== 0) {
        throw new Error(`${name} failed its probe after install: ${`${check.stderr}${check.stdout}`.trim().slice(-300) || `exit ${check.code}`}`)
      }
    }
    // A leftover backup is harmless; the installed binaries already passed
    // their probe. Failing here would roll the verified install back.
    if (existsSync(backup)) {
      try {
        rmSync(backup, { recursive: true, force: true })
      } catch {
        // Keep the new install; the next install replaces the stale backup.
      }
    }
  } catch (error) {
    try {
      if (moved && existsSync(binDir)) rmSync(binDir, { recursive: true, force: true })
    } catch {
      // Keep restoring the old directory even if the new one is locked.
    }
    try {
      if (existsSync(backup)) await moveIntoPlace(backup, binDir)
    } catch {
      // Best effort; the caller still reports the install error.
    }
    throw error
  }
}

/**
 * Download, extract and install in the background; return the current status
 * at once. The page polls {@link ffmpegStatus} for progress and the outcome.
 */
export function startFfmpegDownload(root, { platform = process.platform, arch = process.arch } = {}) {
  const source = ffmpegSource(platform)
  if (!source) throw new Error(`no managed ffmpeg build for ${platform}/${arch}; install it on PATH instead`)
  const key = jobKey(root)
  const current = jobs.get(key)
  if (current?.running) return current.status()
  const job = {
    running: true,
    received: 0,
    total: null,
    error: null,
    status: () => ffmpegStatus(root, { platform, arch }),
  }
  jobs.set(key, job)
  const downloadDir = join(ffmpegRoot(root), 'download')
  const part = join(downloadDir, `${source.file}.part`)
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new Error('download timed out after 20 minutes'))
  }, DOWNLOAD_TIMEOUT_MS)
  if (typeof timer.unref === 'function') timer.unref()

  void (async () => {
    mkdirSync(downloadDir, { recursive: true })
    const archive = join(downloadDir, source.file)
    // The archive only carries this name after a finished download, so a retry
    // after a failed install (locked bin, probe failure) reuses it instead of
    // pulling 110+ MB again.
    if (!existsSync(archive)) {
      await downloadWithResume({
        url: source.url,
        partPath: part,
        signal: controller.signal,
        onProgress: (progress) => {
          job.received = progress.received
          job.total = progress.total
        },
      })
      await moveIntoPlace(part, archive)
    }
    const staging = join(ffmpegRoot(root), 'src')
    const stagedBin = join(ffmpegRoot(root), 'staged-bin')
    try {
      await extractArchive(archive, staging, source.kind, platform)
      rmSync(stagedBin, { recursive: true, force: true })
      mkdirSync(stagedBin, { recursive: true })
      for (const [name, file] of Object.entries(source.binaries)) {
        const found = findBinary(staging, file)
        if (!found) throw new Error(`the archive did not contain ${file}`)
        const target = join(stagedBin, file)
        copyFileSync(found, target)
        if (platform !== 'win32') chmodSync(target, 0o755)
        const check = await runCommand(target, ['-version'], { timeoutMs: VERIFY_TIMEOUT_MS })
        if (check.code !== 0) {
          throw new Error(`${name} failed its probe before install: ${`${check.stderr}${check.stdout}`.trim().slice(-300) || `exit ${check.code}`}`)
        }
      }
    } catch (error) {
      // The archive is the suspect (truncated body, wrong file behind a proxy):
      // drop it so the next attempt downloads instead of unpacking it again.
      try {
        rmSync(archive, { force: true })
      } catch {
        // Best effort; the caller still reports the extraction error.
      }
      throw error
    }
    await swapBinDir(root, stagedBin, platform)
    prune(root)
    prependFfmpegPath(root, platform)
  })().catch((error) => {
    job.error = timedOut
      ? 'download timed out after 20 minutes; the partial file was kept for resume'
      : error instanceof Error ? error.message : String(error)
  }).finally(() => {
    clearTimeout(timer)
    job.running = false
  })
  return job.status()
}

/** Put the managed `bin` directory first on PATH; true when both tools exist. */
export function prependFfmpegPath(root, platform = process.platform) {
  const source = ffmpegSource(platform)
  if (!source) return false
  const dir = ffmpegBinDir(root)
  for (const file of Object.values(source.binaries)) {
    if (!existsSync(join(dir, file))) return false
  }
  const current = process.env.PATH || ''
  const separator = platform === 'win32' ? ';' : ':'
  if (current.split(separator).includes(dir)) return true
  process.env.PATH = `${dir}${separator}${current}`
  return true
}
