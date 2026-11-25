import { chmodSync, copyFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { basename, dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { proxyEnv } from './publish.js'
import { moveIntoPlace } from './swap.js'

/**
 * GitHub CLI (`gh`) management, merged in from `homerdsh-workbench`. The
 * official change-request / worktree bundle shells out to `gh`, so this
 * plugin can install a pinned managed copy, find one already on PATH, and run
 * the `gh auth login --web` device flow from the settings page.
 *
 * The first argument of every file-touching export is the shared download root
 * (`settings.toolsPath`, see `src/tools-path.js`), not the DSH home: the
 * managed copy lives in `<toolsPath>/gh/{bin,download,src}` next to the managed
 * ffmpeg, so both tools move together.
 */

/**
 * Pinned GitHub CLI release. Keep the four assets in step with the version:
 * they are the official per-platform archives from cli/cli.
 */
export const GH_VERSION = '2.76.2'
const GH_RELEASE = `https://github.com/cli/cli/releases/download/v${GH_VERSION}`

/** Where the managed copy comes from; shown next to the version. */
export const GH_SOURCE = 'https://cli.github.com/'

/**
 * Archive integrity: the release host publishes archives over HTTPS, but this
 * plugin pins URLs, not a SHA-256 per asset. Download size and a `gh --version`
 * probe are validated after install; that catches truncated or broken
 * binaries, not a compromised response.
 */

const DOWNLOAD_TIMEOUT_MS = 10 * 60_000
const COMMAND_TIMEOUT_MS = 120_000
const EXTRACT_TIMEOUT_MS = 10 * 60_000
const VERIFY_TIMEOUT_MS = 30_000

const GH_ASSETS = {
  'win32-x64': { file: `gh_${GH_VERSION}_windows_amd64.zip`, kind: 'zip' },
  'win32-arm64': { file: `gh_${GH_VERSION}_windows_arm64.zip`, kind: 'zip' },
  'linux-x64': { file: `gh_${GH_VERSION}_linux_amd64.tar.gz`, kind: 'tar.gz' },
  'linux-arm64': { file: `gh_${GH_VERSION}_linux_arm64.tar.gz`, kind: 'tar.gz' },
}

/** `<toolsPath>/gh`: the managed component's own directory. */
export function ghRoot(root) {
  return join(root, 'gh')
}

export function ghBinDir(root) {
  return join(ghRoot(root), 'bin')
}

export function ghBinaryName(platform = process.platform) {
  return platform === 'win32' ? 'gh.exe' : 'gh'
}

/** The pinned archive for one platform/arch, or null when no build exists. */
export function ghAsset(platform = process.platform, arch = process.arch) {
  const asset = GH_ASSETS[`${platform}-${arch}`]
  if (!asset) return null
  return { ...asset, url: `${GH_RELEASE}/${asset.file}` }
}

function downloadDir(root) {
  return join(ghRoot(root), 'download')
}

function partPath(root, asset) {
  return join(downloadDir(root), `${asset.file}.part`)
}

/** Find an executable on PATH without spawning it. */
export function systemGh(platform = process.platform, envPath = process.env.PATH) {
  const binary = ghBinaryName(platform)
  const dirs = String(envPath || '').split(platform === 'win32' ? ';' : ':')
  for (const raw of dirs) {
    const dir = raw.trim().replace(/^"(.*)"$/, '$1')
    if (!dir) continue
    const candidate = join(dir, binary)
    try {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    } catch {
      // Ignore unreadable PATH entries and keep looking.
    }
  }
  return null
}

/** The managed binary, then a system one, then null. */
export function resolveGh(root, platform = process.platform, envPath = process.env.PATH) {
  const managed = join(ghBinDir(root), ghBinaryName(platform))
  if (existsSync(managed)) return managed
  return systemGh(platform, envPath)
}

/** Live progress for the running download, keyed by the shared tools root. */
const jobs = new Map()

function jobKey(root) {
  return root
}

/** Whether a managed install is in flight; migration refuses to move a live job. */
export function ghDownloadRunning(root) {
  return jobs.get(jobKey(root))?.running === true
}

/**
 * Everything the settings panel needs about the managed component: how far a
 * download got, whether a binary is installed, and what PATH already offers.
 */
export function ghStatus(root, { platform = process.platform, arch = process.arch, envPath = process.env.PATH } = {}) {
  const asset = ghAsset(platform, arch)
  const job = jobs.get(jobKey(root))
  const bin = join(ghBinDir(root), ghBinaryName(platform))
  const hasBinary = existsSync(bin)
  // A failed job keeps the component "not installed" even if a binary is still
  // on disk: the panel then offers a retry instead of a broken install.
  const installed = hasBinary && !job?.error
  const systemPath = installed ? null : systemGh(platform, envPath)
  const partBytes = asset && existsSync(partPath(root, asset)) ? statSync(partPath(root, asset)).size : 0
  let state = 'missing'
  if (job?.running) state = 'downloading'
  else if (installed) state = 'installed'
  else if (job?.error) state = 'error'
  else if (systemPath) state = 'system'
  else if (partBytes > 0) state = 'partial'
  const received = job?.running ? job.received : partBytes
  const total = job?.running ? job.total ?? null : null
  return {
    id: 'gh',
    name: 'GitHub CLI',
    version: GH_VERSION,
    source: GH_SOURCE,
    supported: Boolean(asset),
    url: asset?.url || null,
    file: asset?.file || null,
    kind: asset?.kind || null,
    state,
    installed,
    system: systemPath !== null,
    systemPath,
    binaryPath: installed ? bin : systemPath,
    sourceKind: installed ? 'managed' : systemPath ? 'system' : null,
    received,
    total,
    percent: total ? Math.min(100, Math.round((received / total) * 100)) : null,
    error: job?.error || null,
    installDir: ghRoot(root),
  }
}

async function fetchKeepingRange(url, headers, signal, fetchImpl, hops = 0) {
  const response = await fetchImpl(url, { headers, signal, redirect: 'manual' })
  if ([301, 302, 303, 307, 308].includes(response.status) && hops < 5) {
    const location = response.headers.get('location')
    if (!location) throw new Error('redirect had no Location header')
    return fetchKeepingRange(new URL(location, url).href, headers, signal, fetchImpl, hops + 1)
  }
  return response
}

/** Defaults for {@link downloadWithResume}'s automatic retries. */
const DOWNLOAD_RETRIES = 3
const DOWNLOAD_RETRY_DELAY_MS = 1500

/** HTTP statuses that are worth another attempt; other 4xx answers are final. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

/** Socket / fetch error codes a retry can plausibly fix. */
const RETRYABLE_CODE = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'EPIPE', 'ETIMEDOUT', 'ENETUNREACH',
  'ENETDOWN', 'EHOSTUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
])

/**
 * Whether the failure is a dropped connection rather than a real answer: a 404
 * or an aborted signal will fail exactly the same way next time, so retrying it
 * only delays the error the page has to show.
 */
function isRetryableDownloadError(error, signal) {
  if (!error || signal?.aborted) return false
  if (error.name === 'AbortError') return false
  // A body that ended before its advertised length: the next attempt resumes
  // from the bytes already on disk, so this is worth retrying.
  if (error.shortRead === true) return true
  if (typeof error.status === 'number') return RETRYABLE_STATUS.has(error.status)
  if (RETRYABLE_CODE.has(String(error.code || ''))) return true
  return /fetch failed|socket hang up|other side closed|premature|network|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(String(error.message || ''))
}

/** `setTimeout` that rejects as soon as the download is aborted. */
function waitForRetry(delayMs, signal) {
  return new Promise((resolve, reject) => {
    const abortError = () => (signal.reason instanceof Error ? signal.reason : new Error('download aborted'))
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort)
      resolve()
    }, delayMs)
    function onAbort() {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener?.('abort', onAbort, { once: true })
  })
}

/**
 * One download attempt. The `.part` file is the resume point, so a previous
 * attempt's bytes are counted from disk every time this runs.
 *
 * `expectedBytes` is for servers that answer chunked (no `content-length`, no
 * `content-range` total): without a declared length there is nothing to compare
 * a short body against, so a pinned size lets the caller keep the short-read
 * check instead of silently promoting a truncated file.
 */
async function downloadAttempt({ url, partPath: target, fetchImpl, onProgress, signal, expectedBytes = null }) {
  mkdirSync(dirname(target), { recursive: true })
  let existing = existsSync(target) ? statSync(target).size : 0
  const request = (resume) => fetchKeepingRange(
    url,
    resume && existing > 0 ? { Range: `bytes=${existing}-` } : {},
    signal,
    fetchImpl,
  )
  let response = await request(true)
  if (response.status === 416) {
    rmSync(target, { force: true })
    existing = 0
    response = await request(false)
  }
  if (response.status !== 200 && response.status !== 206) {
    const error = new Error(`download failed HTTP ${response.status}`)
    error.status = response.status
    throw error
  }
  const restart = response.status === 200
  const contentRange = response.headers.get('content-range') || ''
  const lengthHeader = response.headers.get('content-length')
  // `Number(null)` is 0, not NaN: a chunked answer with no `content-length` used
  // to look like a zero-byte file and every such download failed as a short read.
  const declaredLength = lengthHeader === null ? null : Number(lengthHeader)
  const rangeTotal = /\/(\d+)\s*$/.exec(contentRange)
  const knownTotal = rangeTotal
    ? Number(rangeTotal[1])
    : (Number.isFinite(declaredLength) ? (restart ? declaredLength : existing + declaredLength) : null)
  const total = knownTotal === null ? (expectedBytes === null ? null : expectedBytes) : knownTotal
  let received = restart ? 0 : existing
  onProgress?.({ received, total, resumedFrom: restart ? 0 : existing })
  const body = response.body
  if (!body) throw new Error('download response had no body')
  const file = createWriteStream(target, { flags: restart ? 'w' : 'a' })
  const source = typeof body.getReader === 'function' ? Readable.fromWeb(body) : body
  source.on('data', (chunk) => {
    received += chunk.length
    onProgress?.({ received, total, resumedFrom: restart ? 0 : existing })
  })
  await pipeline(source, file)
  // A body that just stops (a proxy answering 200 with an HTML page, a chunked
  // response cut short) still resolves the pipeline. Promoting that file to the
  // archive path would make every later "retry" import the same broken archive,
  // so a short read is a retryable error instead.
  if (total !== null && received !== total) {
    const error = new Error(`download ended at ${received} of ${total} bytes`)
    error.shortRead = true
    throw error
  }
  return { received, total, resumedFrom: restart ? 0 : existing }
}

/**
 * Download with HTTP `Range` resume: an interrupted run keeps its `.part`
 * file and the next attempt continues from its byte offset. A `416` means the
 * partial file belongs to another version, so it is dropped and refetched.
 *
 * A dropped connection is retried automatically (`retries` extra attempts with
 * an exponential backoff) and every retry resumes from the `.part` file, so a
 * flaky link costs seconds instead of the whole archive. Answers that will not
 * change (404 and friends) and an aborted signal fail at once — the page then
 * offers 「继续下载」 on the kept `.part` file.
 */
export async function downloadWithResume({
  url,
  partPath: target,
  fetchImpl = fetch,
  onProgress,
  onRetry,
  signal,
  retries = DOWNLOAD_RETRIES,
  retryDelayMs = DOWNLOAD_RETRY_DELAY_MS,
  expectedBytes = null,
}) {
  let attempts = 0
  for (;;) {
    attempts += 1
    try {
      return await downloadAttempt({ url, partPath: target, fetchImpl, onProgress, signal, expectedBytes })
    } catch (error) {
      if (attempts > retries || !isRetryableDownloadError(error, signal)) {
        if (attempts > 1 && error instanceof Error) {
          error.message = `${error.message} (gave up after ${attempts} attempts)`
        }
        throw error
      }
      const delayMs = retryDelayMs * 2 ** (attempts - 1)
      onRetry?.({ attempt: attempts, retries, delayMs, error })
      await waitForRetry(delayMs, signal)
    }
  }
}

/** Run a command with a deadline, capturing both streams; shared with the ffmpeg manager. */
export function runCommand(command, args, { timeoutMs = COMMAND_TIMEOUT_MS, env = process.env } = {}) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env })
    } catch (error) {
      // On Windows an invalid executable can throw from spawn() itself.
      resolve({ code: 127, stdout: '', stderr: error && error.message ? error.message : String(error) })
      return
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    let timer = null
    const finish = (result) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(result)
    }
    timer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        // A child that already exited has nothing to kill.
      }
      finish({ code: 124, stdout, stderr: `${stderr}\ncommand timed out after ${timeoutMs} ms: ${command}`.trim() })
    }, timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => finish({ code: 127, stdout, stderr: error.message }))
    child.on('close', (code) => finish({ code: code ?? 1, stdout, stderr }))
  })
}

/** Extract a zip with the platform `tar` (bsdtar reads zip), then PowerShell. */
export async function extractArchive(archivePath, destDir, kind, platform = process.platform, run = runCommand) {
  mkdirSync(destDir, { recursive: true })
  if (kind === 'tar.gz') {
    const extracted = await run('tar', ['-xzf', archivePath, '-C', destDir], { timeoutMs: EXTRACT_TIMEOUT_MS })
    if (extracted.code === 0) return
    throw new Error(extracted.stderr.slice(-400) || 'extract failed')
  }
  if (kind === 'zip') {
    const extracted = await run('tar', ['-xf', archivePath, '-C', destDir], { timeoutMs: EXTRACT_TIMEOUT_MS })
    if (extracted.code === 0) return
    if (platform === 'win32') {
      // `-Command 'verb $args[0]'` does not receive arguments (PowerShell parses
      // the trailing tokens as part of the command line, leaving `$args` empty),
      // so the parameters are declared on a script block and bound positionally.
      const powershell = await run('powershell.exe', [
        '-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
        '& { param($a, $b) Expand-Archive -LiteralPath $a -DestinationPath $b -Force }',
        archivePath, destDir,
      ], { timeoutMs: EXTRACT_TIMEOUT_MS })
      if (powershell.code === 0) return
      // Report both attempts: the tar failure is usually the informative one.
      const detail = [powershell.stderr.slice(-400), extracted.stderr.slice(-400)]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' | ')
      throw new Error(detail || 'extract failed')
    }
    throw new Error(extracted.stderr.slice(-400) || 'extract failed')
  }
  throw new Error(`unsupported archive kind: ${kind}`)
}

/** First file with this name anywhere below `dir`. */
export function findBinary(dir, name) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = findBinary(path, name)
      if (found) return found
    } else if (entry.name === name) return path
  }
  return null
}

function pruneDownload(root) {
  const staging = join(ghRoot(root), 'src')
  if (existsSync(staging)) rmSync(staging, { recursive: true, force: true })
  if (existsSync(downloadDir(root))) rmSync(downloadDir(root), { recursive: true, force: true })
}

function stagedPath(destination) {
  return `${destination}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function stageBinary(source, destination, platform) {
  const temp = stagedPath(destination)
  try {
    copyFileSync(source, temp)
    if (platform !== 'win32') chmodSync(temp, 0o755)
    const staged = statSync(temp)
    const original = statSync(source)
    if (!staged.isFile() || staged.size === 0 || staged.size !== original.size) {
      throw new Error(`staged copy of ${basename(destination)} is incomplete`)
    }
    return temp
  } catch (error) {
    try {
      rmSync(temp, { force: true })
    } catch {
      // A temp file that never got created needs no cleanup.
    }
    throw error
  }
}

/**
 * Rename the staged binary into place and probe it. The previous binary is
 * backed up first and restored on any failure, so an install either fully
 * replaces `gh` or leaves the previous state untouched.
 */
async function installBinary(temp, final, platform) {
  let backup = null
  let installed = false
  try {
    const stagedCheck = await runCommand(temp, ['--version'], { timeoutMs: VERIFY_TIMEOUT_MS })
    if (stagedCheck.code !== 0) {
      const detail = `${stagedCheck.stderr}${stagedCheck.stdout}`.trim().slice(-400)
      throw new Error(`GitHub CLI staged probe failed: ${detail || `exit ${stagedCheck.code}`}`)
    }
    if (existsSync(final)) {
      backup = `${final}.old-${process.pid}-${Date.now()}`
      await moveIntoPlace(final, backup)
    }
    await moveIntoPlace(temp, final)
    installed = true
    const check = await runCommand(final, ['--version'], { timeoutMs: VERIFY_TIMEOUT_MS })
    if (check.code !== 0) {
      const detail = `${check.stderr}${check.stdout}`.trim().slice(-400)
      throw new Error(`GitHub CLI probe after install failed: ${detail || `exit ${check.code}`}`)
    }
    if (backup) {
      try {
        rmSync(backup, { force: true })
      } catch {
        // A leftover backup is harmless; the installed binary already verified.
      }
    }
  } catch (error) {
    try {
      if (installed) rmSync(final, { force: true })
    } catch {
      // Keep restoring the older copy even if the new file is locked.
    }
    try {
      if (backup && existsSync(backup)) await moveIntoPlace(backup, final)
    } catch {
      // Best effort; the caller still reports the install error.
    }
    try {
      if (existsSync(temp)) rmSync(temp, { force: true })
    } catch {
      // Temp cleanup must not hide the install result.
    }
    throw error
  }
}

/**
 * Start the managed download in the background and return the current status
 * immediately: the panel polls {@link ghStatus} for progress and the outcome.
 */
export function startGhDownload(root, { platform = process.platform, arch = process.arch } = {}) {
  const asset = ghAsset(platform, arch)
  if (!asset) throw new Error(`GitHub CLI has no build for ${platform}/${arch}`)
  const current = jobs.get(jobKey(root))
  if (current?.running) return ghStatus(root, { platform, arch })
  const job = { running: true, received: 0, total: null, error: null }
  jobs.set(jobKey(root), job)
  const target = partPath(root, asset)
  // A stalled connection must not leave the job "downloading" forever.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new Error('download timed out after 10 minutes'))
  }, DOWNLOAD_TIMEOUT_MS)
  if (typeof timer.unref === 'function') timer.unref()
  // A renamed archive only exists once a download finished, so retrying after a
  // failed install (locked binary, probe failure) reuses it instead of pulling
  // the whole release again.
  const archivePath = join(downloadDir(root), asset.file)
  const ready = existsSync(archivePath)
    ? Promise.resolve()
    : downloadWithResume({
      url: asset.url,
      partPath: target,
      signal: controller.signal,
      onProgress: (progress) => {
        job.received = progress.received
        job.total = progress.total
      },
    }).then(() => moveIntoPlace(target, archivePath))
  ready.then(async () => {
    clearTimeout(timer)
    const staging = join(ghRoot(root), 'src')
    const binaryName = ghBinaryName(platform)
    let binary
    try {
      await extractArchive(archivePath, staging, asset.kind, platform)
      binary = findBinary(staging, binaryName)
      if (!binary) throw new Error(`archive did not contain ${binaryName}`)
    } catch (error) {
      // The archive is the suspect here (a truncated body, an HTML page served
      // with 200): drop it so "retry" downloads again instead of unpacking the
      // same broken file forever.
      try {
        rmSync(archivePath, { force: true })
      } catch {
        // Best effort; the caller still reports the extraction error.
      }
      throw error
    }
    const binDir = ghBinDir(root)
    mkdirSync(binDir, { recursive: true })
    const final = join(binDir, binaryName)
    const temp = stageBinary(binary, final, platform)
    await installBinary(temp, final, platform)
    try {
      pruneDownload(root)
    } catch {
      // Cleanup is best effort: a leftover archive must not fail the install.
    }
    prependGhPath(root, platform)
  }).catch((error) => {
    job.error = timedOut
      ? 'download timed out after 10 minutes; the partial file was kept for resume'
      : error instanceof Error ? error.message : String(error)
  }).finally(() => {
    clearTimeout(timer)
    job.running = false
  })
  return ghStatus(root, { platform, arch })
}

/**
 * Put the managed `bin` directory first on PATH so the official change-request
 * bundle finds the managed `gh`. Returns whether any managed binary exists.
 */
export function prependGhPath(root, platform = process.platform) {
  const dir = ghBinDir(root)
  if (!existsSync(join(dir, ghBinaryName(platform)))) return false
  const current = process.env.PATH || ''
  const separator = platform === 'win32' ? ';' : ':'
  if (current.split(separator).includes(dir)) return true
  process.env.PATH = `${dir}${separator}${current}`
  return true
}

/** Text output of `gh auth status` → account and token scopes. */
export function parseGhAuthStatus(output) {
  const text = String(output || '')
  const account = /Logged in to github\.com account ([^\s(]+)/i.exec(text)?.[1] || null
  const scopeLine = /Token scopes:\s*(.+)/i.exec(text)
  const scopes = scopeLine ? [...scopeLine[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : []
  return { authenticated: Boolean(account), account, scopes }
}

/**
 * `gh auth status --json hosts` → the active github.com account and its scopes.
 * Older releases lack `--json`; the caller falls back to the text parser.
 */
export function parseGhAuthJson(output) {
  let parsed
  try {
    parsed = JSON.parse(String(output || ''))
  } catch {
    return { authenticated: false, account: null, scopes: [] }
  }
  const hosts = parsed && typeof parsed === 'object' ? parsed.hosts : null
  const entries = hosts && typeof hosts === 'object' ? hosts['github.com'] : null
  const entry = Array.isArray(entries) && entries.length
    ? (entries.find((item) => item && item.active && item.state !== 'failed') || entries.find((item) => item && item.state !== 'failed') || null)
    : null
  if (!entry) return { authenticated: false, account: null, scopes: [] }
  const scopes = Array.isArray(entry.scopes)
    ? entry.scopes.filter((scope) => typeof scope === 'string')
    : typeof entry.scopes === 'string' ? entry.scopes.split(/[,\s]+/).filter(Boolean) : []
  return {
    authenticated: entry.state !== 'failed' && (entry.state === 'success' || Boolean(entry.login)),
    account: typeof entry.login === 'string' ? entry.login : null,
    scopes,
  }
}

/**
 * Ask `gh` whether github.com is logged in and which scopes the token carries.
 * Private repositories need `repo`; a token without it fails at push time with a
 * bare 403, so the panel warns as soon as the state is read.
 */
export async function ghAuthStatus(root, { platform = process.platform, arch = process.arch, envPath = process.env.PATH } = {}) {
  const gh = resolveGh(root, platform, envPath)
  if (!gh) return { available: false, authenticated: false, account: null, scopes: [], missingRepoScope: false, path: null, version: null, detail: '', source: 'none' }
  const asJson = await runCommand(gh, ['auth', 'status', '--json', 'hosts'], { timeoutMs: VERIFY_TIMEOUT_MS })
  const version = await runCommand(gh, ['--version'], { timeoutMs: VERIFY_TIMEOUT_MS })
  let parsed = asJson.code === 0 ? parseGhAuthJson(asJson.stdout) : { authenticated: false, account: null, scopes: [] }
  let source = 'json'
  let detail = `${asJson.stdout}${asJson.stderr}`.trim()
  if (!parsed.account) {
    const asText = await runCommand(gh, ['auth', 'status'], { timeoutMs: VERIFY_TIMEOUT_MS })
    parsed = parseGhAuthStatus(`${asText.stdout}${asText.stderr}`)
    source = 'text'
    detail = `${asText.stdout}${asText.stderr}`.trim()
  }
  const firstLine = `${version.stdout}${version.stderr}`.trim().split(/\r?\n/)[0] || ''
  const versionText = /gh version (\S+)/i.exec(firstLine)?.[1] || null
  return {
    available: true,
    authenticated: parsed.authenticated,
    account: parsed.account,
    scopes: parsed.scopes,
    missingRepoScope: Boolean(parsed.authenticated && parsed.scopes.length > 0 && !parsed.scopes.includes('repo')),
    path: gh,
    version: versionText,
    detail,
    source,
  }
}

/**
 * `gh repo list --json nameWithOwner,isPrivate,updatedAt,pushedAt` output →
 * sorted rows. A row that does not look like `owner/name` is dropped: the value
 * ends up in a git command line.
 */
export function parseRepoList(output) {
  let parsed
  try {
    parsed = JSON.parse(String(output || ''))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const seen = new Set()
  const repos = []
  for (const row of parsed) {
    const name = typeof row?.nameWithOwner === 'string' ? row.nameWithOwner.trim() : ''
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name) || name.length > 200) continue
    if (seen.has(name)) continue
    seen.add(name)
    repos.push({
      nameWithOwner: name,
      private: row.isPrivate === true,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : null,
      pushedAt: typeof row.pushedAt === 'string' ? row.pushedAt : null,
    })
  }
  return repos
}

/**
 * The signed-in account's repositories, so a session can be bound to one.
 * `gh` inherits the proxy from the environment; a missing login is reported as
 * such instead of an empty list.
 */
export async function listRepos(root, { limit = 100, proxy = null, platform = process.platform, envPath = process.env.PATH, env = process.env } = {}) {
  const gh = resolveGh(root, platform, envPath)
  if (!gh) return { ok: false, error: 'gh-not-installed', repos: [], detail: '' }
  const result = await runCommand(gh, [
    'repo', 'list',
    '--limit', String(limit),
    '--json', 'nameWithOwner,isPrivate,updatedAt,pushedAt',
  ], { timeoutMs: 30_000, env: proxy ? { ...env, ...proxyEnv(proxy) } : env })
  const detail = `${result.stdout}${result.stderr}`.trim().slice(-400)
  if (result.code !== 0) {
    const failure = /not logged in|authentication|gh auth login/i.test(detail)
      ? 'not-authenticated'
      : /dial tcp|timeout|connection|proxy/i.test(detail) ? 'network' : 'failed'
    return { ok: false, error: failure, repos: [], detail }
  }
  return { ok: true, error: null, repos: parseRepoList(result.stdout), detail }
}

/** Device-code page `gh` sends the user to once the flow starts. */
const GH_DEVICE_URL = 'https://github.com/login/device'
/** One-time code `gh` prints, e.g. `ABCD-1234`. */
const GH_CODE = /\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/

/**
 * The one-time device code in `gh auth login --web` output, uppercased, or `''`
 * when the output does not carry one yet. Pure so the panel's dialog can be
 * tested without spawning `gh`.
 */
export function parseDeviceCode(output) {
  const code = GH_CODE.exec(String(output || '').toUpperCase())
  return code ? code[1] : ''
}

/**
 * Live `gh auth login --web` child. `gh` prints a one-time device code first
 * and then waits for Enter before it opens the browser, so the dialog shows the
 * code and clicks through instead of sending the user to a terminal.
 */
let loginSession = null

function loginSnapshot() {
  if (!loginSession) {
    return { active: false, state: 'idle', code: null, url: null, note: '', error: null, startedAt: null }
  }
  return {
    active: loginSession.state === 'starting' || loginSession.state === 'waiting',
    state: loginSession.state,
    code: loginSession.code,
    url: loginSession.url,
    note: loginSession.note,
    error: loginSession.error,
    startedAt: loginSession.startedAt,
  }
}

export function githubLoginStatus() {
  return loginSnapshot()
}

/** Stop the device-flow child; its state is dropped so a fresh code can start. */
export function cancelGithubLogin() {
  const session = loginSession
  loginSession = null
  if (!session) return { canceled: false, ...loginSnapshot() }
  try {
    session.child.kill()
  } catch {
    // A child that already exited needs no cleanup.
  }
  return { canceled: true, ...loginSnapshot() }
}

/**
 * Start `gh auth login --web` for github.com over HTTPS. The child runs in the
 * background: it prints the code, receives Enter so it opens the browser, then
 * polls GitHub. Callers poll {@link githubLoginStatus} for the outcome.
 */
export function beginGithubLogin(root, { platform = process.platform, envPath = process.env.PATH } = {}) {
  const live = loginSession
  if (live && (live.state === 'starting' || live.state === 'waiting')) {
    return { started: false, reused: true, command: live.command, ...loginSnapshot() }
  }
  const gh = resolveGh(root, platform, envPath)
  if (!gh) throw new Error('GitHub CLI is not installed yet; download it first')
  const args = ['auth', 'login', '--web', '--hostname', 'github.com', '--git-protocol', 'https']
  const command = `"${gh}" ${args.join(' ')}`
  const child = spawn(gh, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  const session = {
    child,
    command,
    state: 'starting',
    code: null,
    url: GH_DEVICE_URL,
    note: '',
    error: null,
    startedAt: Date.now(),
  }
  loginSession = session
  let output = ''
  let advanced = false
  /** gh waits on stdin; send the Enter that continues the flow exactly once. */
  const pressEnter = () => {
    if (advanced) return
    advanced = true
    try {
      child.stdin.end('\n')
    } catch {
      // A closed stdin means the flow already moved on or the child exited.
    }
  }
  const collect = (chunk) => {
    output += chunk
    if (!session.code) {
      const code = parseDeviceCode(output)
      if (code) {
        session.code = code
        session.state = 'waiting'
        session.note = 'copy the one-time code, then paste it on the GitHub page'
        pressEnter()
      }
    }
  }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  // gh still needs Enter when its wording changes; never leave it hanging.
  const fallback = setTimeout(pressEnter, 2500)
  if (typeof fallback.unref === 'function') fallback.unref()
  child.on('error', (error) => {
    clearTimeout(fallback)
    if (loginSession !== session) return
    session.state = 'error'
    session.error = error instanceof Error ? error.message : String(error)
    session.note = ''
  })
  child.on('close', (exitCode) => {
    clearTimeout(fallback)
    if (loginSession !== session) return
    if (exitCode === 0) {
      session.state = 'success'
      session.note = 'authorization finished; gh stored the credential in its own store'
      return
    }
    session.state = 'error'
    session.note = ''
    const tail = output.trim().split(/\r?\n/).filter(Boolean).slice(-3).join('\n')
    session.error = tail || `gh auth login exited with code ${exitCode ?? 1}`
  })
  return { started: true, reused: false, command, ...loginSnapshot() }
}
