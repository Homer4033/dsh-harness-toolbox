import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { isAbsolute, join, normalize, resolve, sep } from 'node:path'

/**
 * One configurable download root for every managed binary.
 *
 * `gh` and ffmpeg used to be two hardcoded directories inside the DSH home.
 * They now share `<toolsPath>`: `gh` installs into `<toolsPath>/gh`, ffmpeg into
 * `<toolsPath>/ffmpeg`, git into `<toolsPath>/git`, Python into
 * `<toolsPath>/python`. The setting lives in `settings.json` as `toolsPath`;
 * empty means the default `<DSH home>/compression-tiers`, which is exactly where
 * earlier versions put `gh` and ffmpeg, so upgrading moves nothing.
 *
 * `toolsPath` is the only place a managed binary's location comes from; nothing
 * else may hardcode a user-visible install directory.
 */

/** Subdirectories of the root, one per managed component. */
export const TOOL_DIRS = ['gh', 'git', 'ffmpeg', 'python']

/** Local diffusion models get their own folder, never mixed with the tools. */
export const MODELS_DIR = 'models'

export function defaultToolsPath(home) {
  return join(home, 'compression-tiers')
}

/**
 * Strict parse: a configured download root must be absolute (a relative path
 * would resolve against whatever the DSH process happens to sit in) and is
 * returned normalized, without a trailing separator.
 */
export function parseToolsPath(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new Error('toolsPath is empty')
  if (!isAbsolute(text)) throw new Error(`toolsPath must be an absolute path: ${text}`)
  const cleaned = normalize(resolve(text))
  // `resolve` can already be a drive root (`D:\`); joining keeps that valid.
  return cleaned
}

/** Lenient form for hand-edited settings: anything unusable means "default". */
export function normalizeToolsPath(value) {
  try {
    return parseToolsPath(value)
  } catch {
    return ''
  }
}

/** The root every managed component installs below. */
export function resolveToolsPath(home, settings) {
  try {
    return parseToolsPath(settings && settings.toolsPath)
  } catch {
    return defaultToolsPath(home)
  }
}

function samePath(a, b, platform = process.platform) {
  return platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

/**
 * What the settings page shows: the configured root, the default one, and which
 * components already live there (so "migrate" can say what it will move).
 */
export function toolsStatus(home, settings, { running = {}, platform = process.platform, fs = {} } = {}) {
  const exists = fs.existsSync || existsSync
  const path = resolveToolsPath(home, settings)
  const fallback = defaultToolsPath(home)
  return {
    path,
    defaultPath: fallback,
    isDefault: samePath(path, fallback, platform),
    components: TOOL_DIRS.map((id) => {
      const dir = join(path, id)
      return { id, path: dir, exists: Boolean(exists(dir)) }
    }),
    // Local models share the root but live in their own `models` folder; they
    // migrate with the components and are reported separately from them.
    models: { path: join(path, MODELS_DIR), exists: Boolean(exists(join(path, MODELS_DIR))) },
    running: Object.fromEntries([...TOOL_DIRS, MODELS_DIR].map((id) => [id, running[id] === true])),
  }
}

/**
 * Move the managed components from the current root to `target`.
 *
 * Pre-flight runs before anything is touched: a component whose target already
 * exists is refused (two installs would overwrite each other), a component that
 * is only at the target counts as already migrated so a failed run can be
 * retried. Cross-volume moves fall back to copy + delete, because `rename`
 * answers `EXDEV` there. A running download blocks the move outright.
 */
export function migrateTools({ home, settings, target, running = {}, platform = process.platform, fs = {} } = {}) {
  const rename = fs.renameSync || renameSync
  const copy = fs.cpSync || cpSync
  const remove = fs.rmSync || rmSync
  const exists = fs.existsSync || existsSync
  const mkdir = fs.mkdirSync || mkdirSync

  const from = resolveToolsPath(home, settings)
  const to = parseToolsPath(target)
  const report = { from, to, moved: [], skipped: [], failed: [] }
  if (samePath(from, to, platform)) return report
  const busy = [...TOOL_DIRS, MODELS_DIR].filter((id) => running[id] === true)
  if (busy.length > 0) {
    const error = new Error(`${busy.join(', ')} is downloading; wait for it to finish, then migrate`)
    error.status = 409
    throw error
  }

  const plan = []
  const planItem = (name) => {
    const source = join(from, name)
    const destination = join(to, name)
    const hasSource = Boolean(exists(source))
    const hasDestination = Boolean(exists(destination))
    if (!hasSource && !hasDestination) return
    // Already at the target: a previous run moved it and then failed.
    if (!hasSource && hasDestination) return
    if (hasSource && hasDestination) {
      const error = new Error(`${destination} already exists; move or delete it first`)
      error.status = 409
      throw error
    }
    if (destination.startsWith(source + sep) || samePath(destination, source, platform)) {
      const error = new Error(`toolsPath must not point inside ${source}`)
      error.status = 400
      throw error
    }
    plan.push({ name, source, destination })
  }
  for (const name of TOOL_DIRS) planItem(name)
  // Models are never PATH entries, but they sit under the root and would be
  // stranded (or silently re-downloaded) if a migration skipped them.
  planItem(MODELS_DIR)

  mkdir(to, { recursive: true })
  for (const item of plan) {
    // `partial` tracks "the destination may hold a half-copied tree": a failed
    // copy leaves one behind, and the next run's pre-flight would then refuse
    // with "destination already exists" forever while the source is still
    // intact. Rolling it back keeps the retry possible.
    let partial = false
    try {
      try {
        rename(item.source, item.destination)
      } catch (error) {
        if (!error || error.code !== 'EXDEV') throw error
        partial = true
        copy(item.source, item.destination, { recursive: true })
        remove(item.source, { recursive: true, force: true })
        partial = false
      }
      report.moved.push(item.name)
    } catch (error) {
      if (partial) {
        try {
          remove(item.destination, { recursive: true, force: true })
        } catch {
          // Keeping the partial copy only affects the next retry's pre-flight.
        }
      }
      report.failed.push({ name: item.name, error: error instanceof Error ? error.message : String(error) })
    }
  }
  if (report.failed.length > 0) {
    const detail = report.failed.map((item) => `${item.name}: ${item.error}`).join('; ')
    const error = new Error(`could not move ${detail}`)
    error.status = 500
    error.report = report
    throw error
  }
  return report
}
