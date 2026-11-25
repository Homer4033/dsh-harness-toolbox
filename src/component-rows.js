import { ffmpegRoot } from './ffmpeg.js'

/**
 * The settings page renders every managed component the same way: one row with
 * a name, a pinned version, the version actually installed, a state, a path and
 * one download / one re-check button. The modules that know a component
 * (`src/gh.js`, `src/ffmpeg.js`, `src/components.js`) report three different
 * shapes, so this module is the single place that turns them into that row.
 */

/** Render order of the component panel. */
export const COMPONENT_ORDER = ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp']

/**
 * The shared row shape:
 *
 * - `state`: one of `downloading` / `installed` / `system` / `error` /
 *   `partial` / `missing`, the same set `src/gh.js` already used.
 * - `ready`: the component can be used right now (managed or PATH copy).
 * - `managed` / `system`: where the used copy comes from.
 * - `path`: the binary that is actually used, for the panel's path line.
 * - `tools`: the individual binaries of a multi-binary component (ffmpeg +
 *   ffprobe), or null.
 */
export function componentRow({ id, name, version, toolVersion, state, supported, managed, system, path, percent, error, installDir, tools }) {
  return {
    id,
    name,
    version: version || null,
    toolVersion: toolVersion || null,
    state,
    supported: supported === true,
    ready: state === 'installed' || state === 'system',
    managed: managed === true,
    system: system === true,
    path: path || null,
    percent: percent ?? null,
    error: error || null,
    running: state === 'downloading',
    installDir: installDir || null,
    tools: Array.isArray(tools) && tools.length > 0 ? tools : null,
  }
}

/** `ghStatus` → row. `gh` never probes `--version`, so only the pin is known. */
export function ghComponentRow(status) {
  return componentRow({
    id: status.id,
    name: status.name,
    version: status.version,
    state: status.state,
    supported: status.supported,
    managed: status.sourceKind === 'managed',
    system: status.system,
    path: status.binaryPath,
    percent: status.percent,
    error: status.error,
    installDir: status.installDir,
  })
}

/** `ffmpegStatus` → row, keeping ffmpeg and ffprobe as its two binaries. */
export function ffmpegComponentRow(root, status) {
  // Both binaries are always listed, found or not: the pair is what the row is
  // about, and "ffprobe is missing" has to stay visible.
  const tools = ['ffmpeg', 'ffprobe'].map((name) => {
    const info = status[name] || null
    return {
      name,
      path: info && info.path ? info.path : null,
      version: info && info.version ? info.version : null,
      managed: Boolean(info && info.managed === true),
    }
  })
  const found = tools.filter((tool) => tool.path)
  const download = status.download || {}
  // `ffmpegStatus` reports `installed` / `partial` / `missing` only, so a job in
  // flight or a failed one has to win over the binary state here.
  const state = download.running ? 'downloading' : download.error ? 'error' : status.state
  return componentRow({
    id: 'ffmpeg',
    name: 'ffmpeg',
    toolVersion: status.version,
    state,
    supported: status.supported,
    // The managed copies are what make this a managed install; a PATH copy is
    // reported as `system` so the page offers the same forced download.
    managed: tools.some((tool) => tool.managed),
    system: found.length > 0 && tools.every((tool) => tool.managed !== true),
    path: found[0] ? found[0].path : null,
    percent: download.percent,
    error: download.error,
    installDir: ffmpegRoot(root),
    tools,
  })
}

/** `componentStatus` (git, Python) → row: it already reports the managed shape. */
export function managedComponentRow(status) {
  return componentRow({
    id: status.id,
    name: status.name,
    version: status.version,
    toolVersion: status.toolVersion,
    state: status.state,
    supported: status.supported,
    managed: status.sourceKind === 'managed',
    system: status.system,
    path: status.binaryPath,
    percent: status.percent,
    error: status.error,
    installDir: status.installDir,
  })
}

/** Every row, in render order; a missing status simply drops its row. */
export function componentRows(root, statuses) {
  const rows = {}
  for (const id of COMPONENT_ORDER) {
    const status = statuses[id]
    if (!status) continue
    if (id === 'gh') rows[id] = ghComponentRow(status)
    else if (id === 'ffmpeg') rows[id] = ffmpegComponentRow(root, status)
    else rows[id] = managedComponentRow(status)
  }
  return COMPONENT_ORDER.filter((id) => rows[id]).map((id) => rows[id])
}
