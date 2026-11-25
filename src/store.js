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

/**
 * The host theme plus the two optical palettes. Both palettes carry a light and
 * a dark token set, so neither of them pins the colour scheme: whichever one is
 * picked, the app follows whatever light/dark the user has DSH on.
 */
export const APPEARANCE_PALETTES = ['host', 'obsidian', 'crystal']

/**
 * 2.0.0 shipped 深空黑曜 / 暖炭玄岩 / 白昼冷晶 / 暖白画册. 2.2.0 keeps the two
 * cool ones (the warm pair was dropped by request), and the retired ids map to
 * the survivor with the same character — deep to deep, bright to bright — so an
 * upgraded install keeps a skin instead of silently reverting to the host theme.
 */
export const LEGACY_PALETTES = { warm: 'obsidian', alabaster: 'crystal' }

/** Motion tiers, from the full optical choreography to reduced motion. */
export const APPEARANCE_MOTIONS = ['full', 'subtle', 'off']

export function defaultAppearance() {
  return {
    // `host` keeps the official theme tokens the panel always used; the other
    // two scope a complete light/dark palette to the plugin's own surfaces
    // (panel, dock, portalled popovers) and repaint the app through the theme
    // service — always in the host's own light/dark mode.
    palette: 'host',
    motion: 'full',
    // Pixel companions above the composer. Opt-out, not opt-in: the 2.0.0
    // appearance page shows the switch next to the palettes.
    mascots: true,
  }
}

/**
 * Appearance is cosmetic state, so a hand-edited unknown value falls back to
 * the default instead of failing the whole settings read. The HTTP route
 * rejects unknown values explicitly before they get here.
 */
export function normalizeAppearance(value) {
  const base = defaultAppearance()
  const next = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const legacy = LEGACY_PALETTES[next.palette]
  const palette = APPEARANCE_PALETTES.includes(next.palette)
    ? next.palette
    : (legacy || base.palette)
  return {
    palette,
    motion: APPEARANCE_MOTIONS.includes(next.motion) ? next.motion : base.motion,
    mascots: next.mascots === false ? false : true,
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
    // Palette, motion tier and the pixel companions. Cosmetic only: the
    // compaction engines never read it.
    appearance: defaultAppearance(),
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
  next.appearance = normalizeAppearance(next.appearance)
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
