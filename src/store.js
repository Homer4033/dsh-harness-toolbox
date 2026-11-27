import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_LEVEL, compactLevel } from './levels.js'
import { normalizeRoutes } from './routes.js'
import { normalizeToolsPath } from './tools-path.js'

/**
 * Plugin-owned state. The selected tier and the optional per-route overrides
 * live in the DSH home so they survive profile rebuilds and DSH upgrades:
 *
 * `<home>/compression-tiers/settings.json`
 *
 * The file is the single source of truth; the live compaction engines are a
 * derived cache that the reconciler rewrites.
 */

export function defaultGithubSettings() {
  return {
    // Which remote the publishing tool pushes to; hand-editable in settings.
    remote: 'origin',
    // Empty means "the branch HEAD is on".
    branch: '',
    // Empty means "detect": git's http.proxy, then the system proxy.
    proxy: '',
  }
}

export function defaultSettings() {
  return {
    level: DEFAULT_LEVEL,
    modelRoutes: [],
    lastCompact: null,
    github: defaultGithubSettings(),
    // Session id → `owner/name` of the online repository that session publishes
    // to. Bound from the session header; the file is the only place it lives.
    sessionRepos: {},
    // Shared download root for the managed gh and ffmpeg installs. Empty means
    // `<DSH home>/compression-tiers`, which is where earlier versions put them.
    toolsPath: '',
  }
}

/** `owner/name` as GitHub renders it, or null. */
export function normalizeRepoName(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(text) && text.length <= 200 ? text : null
}

/** Session bindings: valid entries only, oldest dropped past the cap. */
export function normalizeSessionRepos(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const entries = []
  for (const [rawId, rawRepo] of Object.entries(value)) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    const repo = normalizeRepoName(rawRepo)
    if (!id || id.length > 200 || !repo) continue
    entries.push([id, repo])
  }
  return Object.fromEntries(entries.slice(-200))
}

function text(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function normalizeSettings(value) {
  const base = defaultSettings()
  const next = { ...base, ...(value && typeof value === 'object' ? value : {}) }
  next.level = compactLevel(next.level)
  next.modelRoutes = normalizeRoutes(next.modelRoutes)
  next.lastCompact = next.lastCompact && typeof next.lastCompact === 'object' ? next.lastCompact : null
  const github = value && typeof value === 'object' && value.github && typeof value.github === 'object' ? value.github : {}
  next.github = {
    // `repos` (1.4.x) and `repoPath` (<= 1.5.0) are dropped on the next write:
    // publishing belongs to the github_push tool, which uses the session's own
    // working directory instead of a configured default repository.
    remote: text(github.remote, base.github.remote),
    branch: text(github.branch, base.github.branch),
    proxy: text(github.proxy, base.github.proxy),
  }
  next.sessionRepos = normalizeSessionRepos(next.sessionRepos)
  // 2.8.2 removed the appearance page (and with it the palette / motion / art
  // settings). An upgraded install may still carry the object; it is dropped on
  // read so the next write never resurrects a control that no longer exists.
  delete next.appearance
  // A relative or unparsable toolsPath would resolve against the process CWD;
  // drop it so the shared root falls back to the default directory.
  next.toolsPath = normalizeToolsPath(next.toolsPath)
  return next
}

export function settingsPaths(home) {
  const dir = join(home, 'compression-tiers')
  return {
    home,
    dir,
    settings: join(dir, 'settings.json'),
  }
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback
  try {
    // Hand edits often carry a UTF-8 BOM; strip it before parsing.
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  } catch {
    return fallback
  }
}

/** Same-directory temp file + rename: a reader never sees a half-written file. */
export function writeText(path, text) {
  mkdirSync(join(path, '..'), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  try {
    writeFileSync(tmp, text)
    renameSync(tmp, path)
  } catch (error) {
    try {
      unlinkSync(tmp)
    } catch {
      // The temp file may not have been created at all.
    }
    throw error
  }
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

export function readSettings(home) {
  const paths = settingsPaths(home)
  const raw = readJson(paths.settings, undefined)
  return {
    paths,
    exists: raw !== undefined,
    settings: normalizeSettings(raw),
  }
}

export function writeSettings(home, patch) {
  const current = readSettings(home)
  const settings = normalizeSettings({
    ...current.settings,
    ...(patch && patch.settings ? patch.settings : {}),
  })
  writeJson(current.paths.settings, settings)
  return { ...readSettings(home), settings }
}
