import { existsSync, statSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { detectProxy, pushRepo, repoSnapshot, scanSecrets } from './publish.js'

/**
 * The publishing half of the GitHub panel, kept as one reusable flow:
 *
 *   pick a directory → detect the proxy → scan tracked files for secrets →
 *   push with a deadline → report the failure family and what is left behind.
 *
 * The settings page and the `github_push` tool both call this, so the safety
 * rules cannot drift apart: a token that the panel refuses to publish is also
 * refused when an agent tries to publish it.
 */

/**
 * The push target an online-repository binding implies: the `sessionRepos` map
 * lives on the plugin settings themselves (not under `github`), so this reads
 * the top-level object and tolerates a missing map.
 */
export function sessionTarget(settings, sessionId) {
  const repos = settings && settings.sessionRepos ? settings.sessionRepos : null
  // Own keys only: an inherited `constructor` / `toString` must not become a
  // remote URL.
  if (!repos || !sessionId || !Object.hasOwn(repos, sessionId)) return ''
  const name = repos[sessionId]
  return name ? `https://github.com/${name}.git` : ''
}

/** A path that could be a checkout: absolute and an existing directory. */
export function isRepoDir(path) {  if (typeof path !== 'string' || !path.trim()) return false
  const value = path.trim()
  if (!isAbsolute(value)) return false
  try {
    return existsSync(value) && statSync(value).isDirectory()
  } catch {
    return false
  }
}

/** A directory with a `.git` entry: a clone, or a worktree with a `.git` file. */
export function hasGitEntry(path) {
  if (!isRepoDir(path)) return false
  try {
    return existsSync(join(path.trim(), '.git'))
  } catch {
    return false
  }
}

/**
 * Which directory a push targets, in order:
 *
 * 1. an explicit absolute path the caller passed;
 * 2. the session's own working directory, when it is a checkout.
 *
 * There is no configured fallback: a plugin that published some default
 * repository whenever a session had no checkout would be a surprise, not a
 * default. The plugin's own checkout is never a candidate.
 */
export function resolvePushCwd({ explicit = '', sessionDirectory = '', git = hasGitEntry } = {}) {
  const wanted = typeof explicit === 'string' ? explicit.trim() : ''
  if (wanted) {
    if (!isRepoDir(wanted)) return { cwd: null, source: 'explicit', error: 'repository-path-invalid' }
    return { cwd: wanted, source: 'explicit', error: null }
  }
  const session = typeof sessionDirectory === 'string' ? sessionDirectory.trim() : ''
  if (session && git(session)) return { cwd: session, source: 'session', error: null }
  return { cwd: null, source: 'none', error: 'no-repository' }
}

function proxyText(proxy) {
  if (!proxy) return ''
  return ` via ${proxy.url}`
}

function findingsText(secrets) {
  const findings = secrets && Array.isArray(secrets.findings) ? secrets.findings : []
  return findings.slice(0, 5).map((item) => `${item.file}${item.line ? `:${item.line}` : ''} (${item.kind})`).join(', ')
}

function pendingText(repo) {
  const count = repo && Number.isFinite(repo.pendingCount) ? repo.pendingCount : null
  if (!count) return ''
  return `; ${count} commit(s) still local`
}

/** The human summary shared by the tool output and the panel message. */
export function pushReportText(flow, { path = '' } = {}) {
  const where = path || (flow && flow.path) || ''
  if (!flow) return 'push: no result'
  if (flow.ok) {
    if (flow.target) return `Pushed to ${flow.target} from ${where}${proxyText(flow.proxy)}.`
    const head = flow.repo && flow.repo.localHead ? ` at ${flow.repo.localHead}` : ''
    return `Pushed${head ? ` ${flow.repo.branch || ''}${head}` : ''} from ${where}${proxyText(flow.proxy)}.`
  }
  if (flow.failure === 'secret-scan') {
    return `Push blocked: the secret scan found ${flow.secrets.findings.length} finding(s) in tracked files of ${where} — ${findingsText(flow.secrets)}. Nothing was published. Review them and re-run with force to publish anyway.`
  }
  if (flow.failure === 'no-repository') {
    return 'No repository to push: pass an absolute repository path, or open a session whose working directory is a checkout.'
  }
  if (flow.failure === 'repository-path-invalid') {
    return `Not a usable repository path: ${where || '(empty)'}. It must be an existing absolute directory.`
  }
  const push = flow.push || {}
  const timedOut = push.timedOut === true
  const destination = flow.target ? ` ${flow.target}` : ` ${where}`
  const head = timedOut
    ? `Push to${destination} timed out after ${Math.round((push.timeoutMs || 60_000) / 1000)}s and the git process tree was killed`
    : `Push failed (${push.failure || 'unknown'}) from ${where}${flow.target ? ` to ${flow.target}` : ''}`
  const detail = push.output ? `: ${String(push.output).split(/\r?\n/).filter(Boolean).slice(-3).join(' | ')}` : ''
  const pending = flow.repo && Array.isArray(flow.repo.pending) && flow.repo.pending.length
    ? `. Still local: ${flow.repo.pending.slice(0, 5).join(', ')}`
    : ''
  return `${head}${proxyText(flow.proxy)}${detail}${pendingText(flow.repo)}${pending}.`
}

/**
 * One guarded push. `deps` exists for tests: production passes nothing.
 *
 * The secret scan runs before the push and blocks it unless `force` is set; a
 * caller that wants to publish anyway is expected to have shown the findings
 * to a human first.
 */
export async function pushFlow({ cwd, settings = {}, force = false, target = '', deps = {} } = {}) {
  const detect = deps.detectProxy || detectProxy
  const scan = deps.scanSecrets || scanSecrets
  const pushImpl = deps.pushRepo || pushRepo
  const snapshot = deps.repoSnapshot || repoSnapshot
  // A session bound to an online repository pushes to that URL instead of the
  // configured remote name; git accepts either where a remote is expected.
  const remote = target || settings.remote || 'origin'
  const branch = settings.branch || ''
  if (!cwd) {
    return { ok: false, failure: 'no-repository', path: '', target: target || null, proxy: null, secrets: null, push: null, repo: null, forced: false }
  }
  if (!isRepoDir(cwd)) {
    return { ok: false, failure: 'repository-path-invalid', path: cwd, target: target || null, proxy: null, secrets: null, push: null, repo: null, forced: false }
  }
  const detected = await detect({ cwd, override: settings.proxy || '' })
  const proxy = detected.proxy || null
  const secrets = await scan(cwd)
  if (!secrets.ok && force !== true) {
    return {
      ok: false,
      failure: 'secret-scan',
      path: cwd,
      target: target || null,
      proxy,
      secrets,
      push: { ok: false, failure: 'secret-scan', findings: secrets.findings },
      repo: null,
      forced: false,
    }
  }
  const pushed = await pushImpl({ cwd, remote, branch, proxy })
  // A URL is not a remote name: snapshot only what a named remote can answer.
  const repo = target ? null : await snapshot({ cwd, remote, branch, proxy })
  return {
    ok: pushed.ok === true,
    failure: pushed.ok === true ? null : (pushed.failure || 'unknown'),
    path: cwd,
    target: target || null,
    proxy,
    secrets,
    push: pushed,
    repo,
    forced: force === true,
  }
}
