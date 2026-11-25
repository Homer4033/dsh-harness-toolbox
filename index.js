import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { COMPRESSION_LEVELS, compressionSpec, levelForPolicy, parseLevel } from './src/levels.js'
import { presetCompactionEntries, presetEnginePolicies, syncPresetCompaction } from './src/presets.js'
import { attachContextMeter, compactionWindowNote, contextReportText, readContextWindow, readMeter } from './src/context-meter.js'
import { attachCompactQueue, COMPACT_TOOL_NAME, resolveCompaction } from './src/manual-compact.js'
import { readSettings, writeSettings, normalizeRepoName, APPEARANCE_MOTIONS, APPEARANCE_PALETTES, normalizeAppearance } from './src/store.js'
import { MAX_RULES_CHARS, readRules, rulesPromptBlock, saveRules } from './src/rules.js'
import { saveWorkspaceRules, workspacesPayload } from './src/workspace-rules.js'
import { beginGithubLogin, cancelGithubLogin, ghAuthStatus, ghDownloadRunning, ghStatus, githubLoginStatus, listRepos, prependGhPath, resolveGh, startGhDownload } from './src/gh.js'
import { networkReport, detectProxy } from './src/publish.js'
import { ffmpegDownloadRunning, ffmpegStatus, prependFfmpegPath, startFfmpegDownload } from './src/ffmpeg.js'
import { COMPONENT_IDS, componentBinDirs, componentDownloadRunning, componentStatus, prependComponentPath, startComponentDownload } from './src/components.js'
import { COMPONENT_ORDER, componentRows } from './src/component-rows.js'
import { MODEL_IDS, modelDownloadRunning, modelsStatus, startModelDownload } from './src/models.js'
import { migrateTools, parseToolsPath, resolveToolsPath, toolsStatus } from './src/tools-path.js'
import { pushFlow, pushReportText, resolvePushCwd, sessionTarget } from './src/push-flow.js'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { formatRouteLines, parseRouteLines } from './src/routes.js'
import { errorStatus, guard, httpError, queryParam, readBody, sendJson } from './src/http.js'

export const name = 'compression-tiers'
export const inject = ['tools', 'systemPrompt']

function safeGet(ctx, key) {
  try {
    return typeof ctx.get === 'function' ? ctx.get(key) : undefined
  } catch {
    return undefined
  }
}

function homeDir() {
  return resolveDshHome()
}

/** This package's checkout: the git working directory the network probe runs from. */
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url))

/**
 * The vendored Obsidian Prism modules are classic UMD scripts, not ESM: the
 * client loads them same-origin and reads their `window.__ag*` globals. Only
 * these three names are served; nothing else below `vendor/` is reachable.
 */
const VENDOR_SCRIPTS = new Set(['vial-core.js'])
const vendorCache = new Map()

function vendorScript(name) {
  if (!VENDOR_SCRIPTS.has(name)) throw httpError(404, 'unknown vendor script')
  if (vendorCache.has(name)) return vendorCache.get(name)
  const file = join(PLUGIN_ROOT, 'vendor', 'obsidian-prism', name)
  const body = readFileSync(file, 'utf8')
  vendorCache.set(name, body)
  return body
}

function githubSettings() {
  return readSettings(homeDir()).settings.github
}

/** The one download root both managed tools install below. */
function toolsRoot() {
  return resolveToolsPath(homeDir(), readSettings(homeDir()).settings)
}

/** Whether any managed install is in flight (migration refuses to move one). */
function toolsRunning(root = toolsRoot()) {
  const running = { gh: ghDownloadRunning(root), ffmpeg: ffmpegDownloadRunning(root), models: modelDownloadRunning(root) }
  for (const id of COMPONENT_IDS) running[id] = componentDownloadRunning(root, id)
  return running
}

/** Every directory the managed components put on PATH below one root. */
function toolPathDirs(root) {
  const dirs = [join(root, 'gh', 'bin'), join(root, 'ffmpeg', 'bin')]
  for (const id of COMPONENT_IDS) dirs.push(...componentBinDirs(root, id))
  return dirs
}

/**
 * After the managed tools move, the PATH entries for the old directories must go
 * as well; otherwise the process keeps resolving the binaries that are no
 * longer there.
 */
function repointToolsPath(previous, target) {
  const separator = process.platform === 'win32' ? ';' : ':'
  const fold = (dir) => (process.platform === 'win32' ? dir.toLowerCase() : dir)
  const stale = new Set(toolPathDirs(previous).map(fold))
  process.env.PATH = String(process.env.PATH || '')
    .split(separator)
    .filter((dir) => dir && !stale.has(fold(dir)))
    .join(separator)
  try {
    prependGhPath(target)
  } catch (error) {
    trace('gh:path-failed', error instanceof Error ? error.message : String(error))
  }
  try {
    prependFfmpegPath(target)
  } catch (error) {
    trace('ffmpeg:path-failed', error instanceof Error ? error.message : String(error))
  }
  for (const id of COMPONENT_IDS) {
    try {
      prependComponentPath(target, id)
    } catch (error) {
      trace(`${id}:path-failed`, error instanceof Error ? error.message : String(error))
    }
  }
}

/** The directory the calling session lives in; empty when unavailable. */
function sessionDirectory(ctx, exec) {
  const session = exec && exec.agent ? exec.agent.session : undefined
  const service = safeGet(ctx, 'workingDirectory')
  if (!session || !service || typeof service.get !== 'function') return ''
  try {
    const directory = service.get(session)
    return typeof directory === 'string' ? directory : ''
  } catch {
    return ''
  }
}

/** Durable session id, the key of the online-repository binding. */
function sessionIdOf(exec) {
  const session = exec && exec.agent ? exec.agent.session : undefined
  const header = session && session.header
  return header && typeof header.id === 'string' ? header.id : ''
}

/** The repository this session publishes to, or null. */
function sessionRepoBinding(sessionId, settings = readSettings(homeDir()).settings) {
  if (!sessionId) return null
  const repos = settings && settings.sessionRepos ? settings.sessionRepos : {}
  // Own keys only: `constructor` / `toString` would otherwise resolve to the
  // prototype and build a nonsense remote.
  return Object.hasOwn(repos, sessionId) ? repos[sessionId] : null
}

function trace(stage, detail) {  // Keep the console quiet: only failures, skipped work and adoption matter.
  if (!/failed|error|skip|stale|adopt/i.test(stage)) return
  console.error('[compression-tiers]', stage, detail === undefined ? '' : typeof detail === 'string' ? detail : JSON.stringify(detail))
}

/** Current stored tier policy; falls back to the plugin default before seeding. */
function readPolicy() {
  return compressionSpec(readSettings(homeDir()).settings.level)
}

/**
 * First run adopts whatever policy the mounted engines already use when it
 * matches a tier, so a matching install does not change the effective tier.
 * A policy outside the five tiers falls back to `standard`. Returns `null`
 * while no preset engine is mounted yet; the reconciler retries.
 */
function ensuredState(ctx) {
  const state = readSettings(homeDir())
  if (state.exists) return state
  const entries = presetCompactionEntries(safeGet(ctx, 'agentPresets'))
  if (entries.length === 0) return null
  let adopted = 'standard'
  for (const entry of entries) {
    const config = entry.options && entry.options.config
    const level = levelForPolicy(config)
    if (level) {
      adopted = level
      break
    }
  }
  const saved = writeSettings(homeDir(), { settings: { level: adopted } })
  console.error(`[compression-tiers] first run: adopted "${adopted}" from the mounted compaction policy`)
  return saved
}

async function reconcileOnce(ctx) {
  const state = ensuredState(ctx)
  if (!state) return null
  const service = safeGet(ctx, 'agentPresets')
  return syncPresetCompaction(service, compressionSpec(state.settings.level), state.settings.modelRoutes)
}

/**
 * Apply a tier immediately: persist it, then push it into every mounted preset
 * engine. The periodic reconciler catches presets mounted after activation.
 */
async function applyLevel(ctx, level, routes) {
  const spec = compressionSpec(level)
  const saved = writeSettings(homeDir(), {
    settings: {
      level,
      ...(routes === undefined ? {} : { modelRoutes: routes }),
    },
  })
  const result = await syncPresetCompaction(safeGet(ctx, 'agentPresets'), spec, saved.settings.modelRoutes)
  return { saved, spec, result }
}

function enginePolicy(agent, ctx) {
  const engine = resolveCompaction(agent, ctx)
  const config = engine && engine.config
  if (!config) return null
  return {
    auto: config.auto !== false,
    thresholdRatio: config.thresholdRatio,
    ...(config.retainTokens === undefined ? { retainRatio: config.retainRatio } : { retainTokens: config.retainTokens }),
    modelPolicies: Array.isArray(config.modelPolicies) ? config.modelPolicies.length : 0,
  }
}

function engineSummary(ctx) {
  const presets = safeGet(ctx, 'agentPresets')
  return {
    engines: presetCompactionEntries(presets).length,
    engineConfigs: presetEnginePolicies(presets),
  }
}

function recordCompact(payload) {
  const at = new Date().toISOString()
  if (payload.ok && payload.result) {
    writeSettings(homeDir(), {
      settings: {
        lastCompact: { at, compacted: true, replaced: payload.replaced ?? null, tokensSaved: payload.tokens ?? null },
      },
    })
    return
  }
  if (payload.ok && payload.skipped === 'host') {
    writeSettings(homeDir(), { settings: { lastCompact: { at, compacted: true, by: 'automatic' } } })
    return
  }
  const detail = payload.error ? { error: payload.error } : { note: payload.note || payload.skipped || 'not compacted' }
  writeSettings(homeDir(), { settings: { lastCompact: { at, compacted: false, ...detail } } })
}

function promptText(home) {
  const state = readSettings(home)
  const spec = compressionSpec(state.settings.level)
  return [
    'Context compression tiers.',
    `Current tier: ${state.settings.level}. Automatic pressure compaction fires at about ${Math.round(spec.thresholdRatio * 100)}% of the model window, and about ${Math.round(spec.retainRatio * 100)}% of recent history stays verbatim after it. Every tier keeps automatic compaction on. The five tiers are designed for long windows (>= 256k tokens); below that the official 65,536-token headroom caps the trigger and the tiers mostly differ in retain size.`,
    'Proactive compaction is the agent\'s call. The [context] line at the tail reports live occupancy; call compression_context for the same numbers on demand. When the remaining room is short or you still expect to read a lot more, first write the conclusions you must keep to disk, then call compression_compact once and end the turn. It runs after the turn ends and the conversation resumes automatically with the summary. Do not wait for automatic pressure compaction; /compact remains available to the human. compression_tiers reads or changes the tier, and accepts optional per-route overrides as "provider model headroomTokens [retainTokens]" lines.',
    rulesPromptBlock(home),
  ].join('\n\n')
}

function toolOutput() {
  return {
    schema: { type: 'object', additionalProperties: true },
    render: (_args, value) => [{ type: 'text', text: value && value.text ? value.text : JSON.stringify(value, null, 2) }],
  }
}

function statePayload(ctx) {
  const state = readSettings(homeDir())
  return {
    level: state.settings.level,
    levels: COMPRESSION_LEVELS.map((id) => ({ id, ...compressionSpec(id) })),
    modelRoutes: state.settings.modelRoutes,
    routeLines: formatRouteLines(state.settings.modelRoutes),
    lastCompact: state.settings.lastCompact,
    appearance: state.settings.appearance,
    paths: { settings: state.paths.settings, tools: resolveToolsPath(homeDir(), state.settings) },
    github: state.settings.github,
    ...engineSummary(ctx),
  }
}

function rulesPayload(rules) {
  return {
    ok: true,
    path: rules.path,
    exists: rules.exists,
    text: rules.text,
    chars: rules.chars,
    lines: rules.lines,
    updatedAt: rules.updatedAt,
    maxChars: MAX_RULES_CHARS,
  }
}

/**
 * One row per managed component, in the order the settings page renders them.
 * The mapping lives in `src/component-rows.js` so the page contract is testable
 * without the host services this file needs.
 */
const MANAGED_COMPONENTS = new Set(COMPONENT_ORDER)

/** The four managed components plus the shared download root, for one load. */
async function componentsPayload(root) {
  const [ffmpeg, git, python] = await Promise.all([
    ffmpegStatus(root),
    componentStatus(root, 'git'),
    componentStatus(root, 'python'),
  ])
  return {
    root: toolsStatus(homeDir(), readSettings(homeDir()).settings, { running: toolsRunning(root) }),
    components: componentRows(root, { gh: ghStatus(root), git, ffmpeg, python }),
  }
}

async function startManagedDownload(root, id) {
  if (!MANAGED_COMPONENTS.has(id)) {
    throw httpError(400, `unknown component: ${id || '(empty)'}; pass one of ${COMPONENT_ORDER.join(', ')}`)
  }
  if (id === 'gh') {
    startGhDownload(root)
    return
  }
  if (id === 'ffmpeg') {
    startFfmpegDownload(root)
    return
  }
  await startComponentDownload(root, id)
}

export function apply(ctx) {
  const compactQueue = attachCompactQueue(ctx, { trace, onFinished: recordCompact })
  ctx.effect(() => compactQueue.dispose, 'compression-tiers: compact queue')
  attachContextMeter(ctx, {
    readService: (serviceName) => safeGet(ctx, serviceName),
    readPolicy,
    trace,
  })
  // The official change-request bundle shells out to `gh`; a managed copy goes
  // first on PATH so the bundle finds the version this page installed.
  try {
    prependGhPath(toolsRoot())
  } catch (error) {
    trace('gh:path-failed', error instanceof Error ? error.message : String(error))
  }
  // ffmpeg/ffprobe: the managed copy, when present, also goes first on PATH so
  // video tooling in this process finds the version this page installed.
  try {
    if (prependFfmpegPath(toolsRoot())) trace('ffmpeg:path-ready', '')
  } catch (error) {
    trace('ffmpeg:path-failed', error instanceof Error ? error.message : String(error))
  }
  // git and Python behave the same way: a managed copy, when one was installed
  // from the settings page, wins over whatever PATH already carries.
  for (const id of COMPONENT_IDS) {
    try {
      if (prependComponentPath(toolsRoot(), id)) trace(`${id}:path-ready`, '')
    } catch (error) {
      trace(`${id}:path-failed`, error instanceof Error ? error.message : String(error))
    }
  }

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'compression-tiers',
    order: 245,
    interpolate: false,
    text: () => promptText(homeDir()),
  }), 'compression-tiers: prompt')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: COMPACT_TOOL_NAME,
    description: 'Queue a proactive compaction of this session\'s history. Call compression_context first; when the remaining room is short, save important conclusions to disk, then call this once and end the turn immediately without calling more tools. The compaction runs right after the turn ends (even below the automatic threshold) and this conversation resumes automatically with the summary.',
    parameters: {},
    output: toolOutput(),
    async execute(_args, exec) {
      const agent = exec.agent
      const session = agent && agent.session
      return compactQueue.request(session, agent)
    },
  })), 'compression-tiers: compact tool')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'compression_context',
    description: 'Read this session\'s live context occupancy: tokens used against the model window, this tier\'s automatic compaction threshold, and how much room is left before history is rewritten. Read-only, no side effects. Call it before reading more large files or when the [context] tail line says the threshold is near.',
    parameters: {},
    output: toolOutput(),
    async execute(_args, exec) {
      const agent = exec.agent
      const session = agent && agent.session
      const spec = readPolicy()
      const meter = readMeter((serviceName) => safeGet(ctx, serviceName), session, spec)
      if (!meter) {
        const windowTokens = readContextWindow((serviceName) => safeGet(ctx, serviceName), session)
        const windowNote = windowTokens ? compactionWindowNote(windowTokens) : ''
        return {
          ok: false,
          level: readSettings(homeDir()).settings.level,
          windowTokens,
          windowNote,
          text: windowNote
            ? `compression_context could not read a measurement. ${windowNote}`
            : 'compression_context is unavailable: the token meter returned no measurement.',
        }
      }
      const windowNote = compactionWindowNote(meter.windowTokens)
      const level = readSettings(homeDir()).settings.level
      return {
        ok: true,
        level,
        text: contextReportText(meter, spec, level),
        windowNote,
        windowTokens: meter.windowTokens,
        usedTokens: meter.usedTokens,
        thresholdTokens: meter.thresholdTokens,
        retainTokens: meter.retainTokens,
        untilCompaction: meter.untilCompaction,
        percent: Number((meter.percent * 100).toFixed(2)),
        thresholdPercent: Number((meter.thresholdPercent * 100).toFixed(2)),
      }
    },
  })), 'compression-tiers: context tool')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'compression_tiers',
    description: 'Read or set the five-tier context compression policy: gentle, light, standard, aggressive, or max. Every tier keeps automatic pressure compaction on; proactive compaction is agent-driven through compression_context plus compression_compact, while /compact stays available to the human. Setting a tier updates every mounted agent preset compaction engine immediately, and optional route overrides pass headroomTokens (and an optional absolute retainTokens) for an exact provider/model pair.',
    parameters: {
      level: { type: 'string', description: `One of ${COMPRESSION_LEVELS.join(', ')}. Omit to read the current tier.` },
      routeLines: {
        type: 'string',
        description: 'Optional per-route overrides, one "provider model headroomTokens [retainTokens]" per line. Pass an empty string to clear them.',
      },
    },
    output: toolOutput(),
    async execute(args, exec) {
      const session = exec && exec.agent ? exec.agent.session : undefined
      const windowTokens = session ? readContextWindow((serviceName) => safeGet(ctx, serviceName), session) : null
      const windowNote = windowTokens ? compactionWindowNote(windowTokens) : ''
      const setting = args.level !== undefined && args.level !== null && String(args.level).trim() !== ''
      const routesGiven = typeof args.routeLines === 'string'
      if (setting || routesGiven) {
        let level
        try {
          level = setting ? parseLevel(args.level) : readSettings(homeDir()).settings.level
        } catch (error) {
          return { ok: false, text: error instanceof Error ? error.message : String(error) }
        }
        let routes
        try {
          routes = routesGiven ? parseRouteLines(args.routeLines) : readSettings(homeDir()).settings.modelRoutes
        } catch (error) {
          return { ok: false, text: `route overrides rejected: ${error instanceof Error ? error.message : String(error)}` }
        }
        try {
          const applied = await applyLevel(ctx, level, routes)
          return {
            ok: true,
            level,
            ...applied.spec,
            updatedEngines: applied.result.updated,
            ...engineSummary(ctx),
            windowTokens,
            windowNote,
            routeLines: formatRouteLines(routes),
            currentEngine: enginePolicy(exec.agent, ctx),
          }
        } catch (error) {
          return { ok: false, text: `could not update the compaction engines: ${error instanceof Error ? error.message : String(error)}` }
        }
      }
      const payload = statePayload(ctx)
      return { ok: true, ...payload, windowTokens, windowNote, currentEngine: enginePolicy(exec.agent, ctx), choices: COMPRESSION_LEVELS }
    },
  })), 'compression-tiers: tiers tool')

  // Publishing, as a tool instead of a sidebar panel: the official change
  // request bundle already owns the repository UI, and an agent that just
  // finished a piece of work is the one that knows a commit should leave the
  // machine. The flow itself is shared with the settings page.
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'github_push',
    description: 'Publish the current work over git: probe how GitHub is reachable, scan tracked files for credentials, then push with a 60s deadline and report the failure family plus whatever is still local. Defaults to this session\'s working directory and, when the session header binds an online repository, pushes there instead of the configured remote; pass repo to publish a checkout somewhere else. A secret-scan hit blocks the push unless force is true.',
    parameters: {
      repo: {
        type: 'string',
        description: 'Absolute path of the repository to publish. Omit to use the session\'s working directory.',
      },
      force: {
        type: 'boolean',
        description: 'Publish even when the secret scan finds tracked credentials. Only after a human has looked at the findings.',
      },
    },
    output: toolOutput(),
    async execute(args, exec) {
      // `sessionRepos` lives on the plugin settings; `githubSettings()` only
      // returns the `github` block, so indexing it for a session id throws.
      const stored = readSettings(homeDir()).settings
      const settings = stored.github
      const sessionId = sessionIdOf(exec)
      const bound = sessionId ? sessionRepoBinding(sessionId, stored) : null
      const target = sessionTarget(stored, sessionId)
      const explicit = typeof args.repo === 'string' ? args.repo.trim() : ''
      const resolved = resolvePushCwd({ explicit, sessionDirectory: sessionDirectory(ctx, exec) })
      if (!resolved.cwd) {
        const failed = {
          ok: false,
          failure: resolved.error,
          path: explicit,
          target: target || null,
          proxy: null,
          secrets: null,
          push: null,
          repo: null,
          forced: false,
        }
        return { ...failed, source: resolved.source, binding: bound, text: pushReportText(failed, { path: explicit }) }
      }
      const flow = await pushFlow({ cwd: resolved.cwd, settings, target, force: args.force === true })
      return { ...flow, source: resolved.source, binding: bound, text: pushReportText(flow, { path: resolved.cwd }) }
    },
  })), 'compression-tiers: github push tool')

  ctx.inject(['webServer', 'connection'], (child) => {
    child.effect(() => child.webServer.register({
      kind: 'exact',
      path: '/compression-tiers/api/settings',
      handler: async (req, res) => {
        if (guard(child, req, res)) return
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, statePayload(ctx))
            return
          }
          if (req.method === 'POST') {
            const body = await readBody(req)
            const levelGiven = body.level !== undefined && body.level !== null && String(body.level).trim() !== ''
            const routesGiven = typeof body.routeLines === 'string'
            const appearanceGiven = body.appearance !== undefined && body.appearance !== null
            if (!levelGiven && !routesGiven && !appearanceGiven) {
              sendJson(res, 400, { error: 'nothing to update: pass level, routeLines and/or appearance' })
              return
            }
            let level
            try {
              level = levelGiven ? parseLevel(body.level) : readSettings(homeDir()).settings.level
            } catch (error) {
              sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
              return
            }
            // Appearance is cosmetic but still validated before it is written:
            // an unknown palette must be a 400, not a silent reset to `host`.
            if (appearanceGiven) {
              const patch = body.appearance
              if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
                sendJson(res, 400, { error: 'appearance must be an object' })
                return
              }
              if (patch.palette !== undefined && !APPEARANCE_PALETTES.includes(patch.palette)) {
                sendJson(res, 400, { error: `unknown palette: ${String(patch.palette)}; pass one of ${APPEARANCE_PALETTES.join(', ')}` })
                return
              }
              if (patch.motion !== undefined && !APPEARANCE_MOTIONS.includes(patch.motion)) {
                sendJson(res, 400, { error: `unknown motion tier: ${String(patch.motion)}; pass one of ${APPEARANCE_MOTIONS.join(', ')}` })
                return
              }
              if (patch.art !== undefined && typeof patch.art !== 'boolean') {
                sendJson(res, 400, { error: 'art must be a boolean' })
                return
              }
            }
            const routes = routesGiven
              ? parseRouteLines(body.routeLines)
              : readSettings(homeDir()).settings.modelRoutes
            const applied = levelGiven || routesGiven ? await applyLevel(ctx, level, routes) : null
            if (appearanceGiven) {
              const current = readSettings(homeDir()).settings
              writeSettings(homeDir(), {
                settings: { appearance: normalizeAppearance({ ...current.appearance, ...body.appearance }) },
              })
            }
            sendJson(res, 200, {
              ...statePayload(ctx),
              updatedEngines: applied ? applied.result.updated : 0,
            })
            return
          }
          sendJson(res, 405, { error: 'GET or POST' })
        } catch (error) {
          sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
        }
      },
    }))
  })

  // The optical modules are served from the plugin checkout so the client can
  // use the vendored canvas engines without copying 300KB into client.js. The
  // route is same-origin, guarded by the same connection check as every other
  // /compression-tiers/* route, and only the three fixed names resolve.
  ctx.inject(['webServer', 'connection'], (child) => {
    for (const name of VENDOR_SCRIPTS) {
      child.effect(() => child.webServer.register({
        kind: 'exact',
        path: `/compression-tiers/vendor/${name}`,
        handler: async (req, res) => {
          if (guard(child, req, res)) return
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            sendJson(res, 405, { error: 'GET or HEAD' })
            return
          }
          let body
          try {
            body = vendorScript(name)
          } catch {
            sendJson(res, 404, { error: 'vendor script not found' })
            return
          }
          const payload = Buffer.from(body, 'utf8')
          res.writeHead(200, {
            'content-type': 'text/javascript; charset=utf-8',
            'cache-control': 'public, max-age=3600',
            'content-length': payload.length,
          })
          res.end(req.method === 'HEAD' ? undefined : payload)
        },
      }))
    }
  })

  // Global rules: the same `$DSH_HOME/AGENTS.md` the official instruction
  // loader reads, so a save applies to later sessions without a restart.
  ctx.inject(['webServer', 'connection'], (child) => {
    child.effect(() => child.webServer.register({
      kind: 'exact',
      path: '/compression-tiers/api/rules',
      handler: async (req, res) => {
        if (guard(child, req, res)) return
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, rulesPayload(readRules(homeDir())))
            return
          }
          if (req.method === 'POST') {
            const body = await readBody(req)
            if (typeof body.rules !== 'string') {
              sendJson(res, 400, { error: 'nothing to update: pass rules as a string' })
              return
            }
            sendJson(res, 200, rulesPayload(saveRules(homeDir(), body.rules)))
            return
          }
          sendJson(res, 405, { error: 'GET or POST' })
        } catch (error) {
          sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
        }
      },
    }))
  })

  // Workspace rules: one `AGENTS.md` per registered workspace. The registry
  // file is the allow list, so an id that is not in it is refused before any
  // path is touched.
  ctx.inject(['webServer', 'connection'], (child) => {
    child.effect(() => child.webServer.register({
      kind: 'exact',
      path: '/compression-tiers/api/workspace-rules',
      handler: async (req, res) => {
        if (guard(child, req, res)) return
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, workspacesPayload(homeDir()))
            return
          }
          if (req.method === 'POST') {
            const body = await readBody(req)
            if (typeof body.rules !== 'string') {
              sendJson(res, 400, { error: 'nothing to update: pass rules as a string' })
              return
            }
            if (typeof body.workspaceId !== 'string' || !body.workspaceId.trim()) {
              sendJson(res, 400, { error: 'pass workspaceId of a registered workspace' })
              return
            }
            sendJson(res, 200, {
              ok: true,
              maxChars: MAX_RULES_CHARS,
              workspace: saveWorkspaceRules(homeDir(), body.workspaceId, body.rules),
            })
            return
          }
          sendJson(res, 405, { error: 'GET or POST' })
        } catch (error) {
          sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
        }
      },
    }))
  })

  // GitHub CLI: managed download, PATH detection and the gh device-code login.
  ctx.inject(['webServer', 'connection'], (child) => {
    const register = (path, handler, label) => child.effect(() => child.webServer.register({ kind: 'exact', path, handler }), `compression-tiers: ${label}`)

    register('/compression-tiers/api/github', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, gh: ghStatus(toolsRoot()), login: githubLoginStatus() })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const action = typeof body.action === 'string' ? body.action : ''
          if (action === 'download') {
            sendJson(res, 202, { ok: true, gh: startGhDownload(toolsRoot()) })
            return
          }
          if (action === 'login') {
            sendJson(res, 200, { ok: true, ...beginGithubLogin(toolsRoot()) })
            return
          }
          if (action === 'cancel') {
            sendJson(res, 200, { ok: true, ...cancelGithubLogin() })
            return
          }
          sendJson(res, 400, { error: 'unknown action: download, login, cancel' })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'github route')

    register('/compression-tiers/api/github/auth', async (req, res) => {
      if (guard(child, req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'GET' })
        return
      }
      try {
        sendJson(res, 200, { ok: true, auth: await ghAuthStatus(toolsRoot()) })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'github auth route')

    // Is GitHub reachable at all, and through which proxy? DNS, TCP and the
    // configured proxies are all reported, because a stale `http.proxy` and a
    // poisoned name are the two failures that look identical from git's output.
    register('/compression-tiers/api/github/network', async (req, res) => {
      if (guard(child, req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'GET' })
        return
      }
      try {
        const settings = githubSettings()
        sendJson(res, 200, { ok: true, network: await networkReport({ cwd: PLUGIN_ROOT, override: settings.proxy }) })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'github network route')

    // The repositories the signed-in account can push to, for the session
    // header's online-repository selector.
    register('/compression-tiers/api/github/online', async (req, res) => {
      if (guard(child, req, res)) return
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'GET' })
        return
      }
      try {
        const settings = githubSettings()
        const detected = await detectProxy({ cwd: PLUGIN_ROOT, override: settings.proxy })
        const listed = await listRepos(toolsRoot(), { proxy: detected.proxy })
        sendJson(res, 200, { ok: listed.ok, repos: listed.repos, error: listed.error, detail: listed.detail })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'github online route')

    // Session header binding: which online repository this session publishes to.
    register('/compression-tiers/api/github/binding', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        if (req.method === 'GET') {
          const session = queryParam(req, 'session') || ''
          if (!session) {
            sendJson(res, 400, { error: 'session is required' })
            return
          }
          const settings = readSettings(homeDir()).settings
          sendJson(res, 200, { ok: true, session, repo: sessionRepoBinding(session, settings) })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const session = typeof body.session === 'string' ? body.session.trim() : ''
          if (!session || session.length > 200) {
            sendJson(res, 400, { error: 'session is required' })
            return
          }
          const requested = typeof body.repo === 'string' ? body.repo.trim() : ''
          let repo = null
          if (requested) {
            repo = normalizeRepoName(requested)
            if (!repo) {
              sendJson(res, 400, { error: 'repo must be owner/name' })
              return
            }
          }
          const state = readSettings(homeDir()).settings
          const sessionRepos = { ...state.sessionRepos }
          if (repo) sessionRepos[session] = repo
          else delete sessionRepos[session]
          writeSettings(homeDir(), { settings: { ...state, sessionRepos } })
          sendJson(res, 200, { ok: true, session, repo })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'github binding route')

    // Shared download location: one root for both managed tools, and the one
    // place that moves them. A running download blocks the move (409), and a
    // component already sitting at the target counts as migrated so a failed
    // run can be retried.
    register('/compression-tiers/api/tools', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        const status = () => toolsStatus(homeDir(), readSettings(homeDir()).settings, { running: toolsRunning() })
        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, ...status() })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const action = typeof body.action === 'string' ? body.action : ''
          if (action !== 'migrate') {
            sendJson(res, 400, { error: 'unknown action: migrate' })
            return
          }
          const settings = readSettings(homeDir()).settings
          let target
          try {
            target = parseToolsPath(body.path)
          } catch (error) {
            sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
            return
          }
          let report
          try {
            report = migrateTools({ home: homeDir(), settings, target, running: toolsRunning() })
          } catch (error) {
            sendJson(res, errorStatus(error, 500), {
              error: error instanceof Error ? error.message : String(error),
              report: error && error.report ? error.report : null,
            })
            return
          }
          writeSettings(homeDir(), { settings: { toolsPath: target } })
          // PATH still points at the old directories; move it with the files.
          repointToolsPath(report.from, report.to)
          sendJson(res, 200, { ok: true, ...status(), report })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'tools path route')

    // Managed ffmpeg + ffprobe: detection, resumable download, atomic install.
    register('/compression-tiers/api/ffmpeg', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, ...(await ffmpegStatus(toolsRoot())) })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const action = typeof body.action === 'string' ? body.action : ''
          if (action === 'download') {
            sendJson(res, 202, { ok: true, ...(await startFfmpegDownload(toolsRoot())) })
            return
          }
          sendJson(res, 400, { error: 'unknown action: download' })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'ffmpeg route')

    // Component management: every managed binary in one place (GitHub CLI, git,
    // ffmpeg, Python) plus the shared download root they all install below. One
    // GET feeds the whole panel and one POST starts any of the four installs.
    register('/compression-tiers/api/components', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        const root = toolsRoot()
        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, ...(await componentsPayload(root)) })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const action = typeof body.action === 'string' ? body.action : ''
          if (action !== 'download') {
            sendJson(res, 400, { error: 'unknown action: download' })
            return
          }
          await startManagedDownload(root, typeof body.id === 'string' ? body.id : '')
          sendJson(res, 202, { ok: true, ...(await componentsPayload(root)) })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'components route')

    // Local models: one pinned pipeline (FLUX.2 [klein] 4B, 4-step distilled)
    // below `<root>/models`, fetched with the same Range-resume downloader the
    // components use. The job runs in the background — 16GB must not hold the
    // request open — and the panel polls this route for progress.
    register('/compression-tiers/api/models', async (req, res) => {
      if (guard(child, req, res)) return
      try {
        const root = toolsRoot()
        if (req.method === 'GET') {
          sendJson(res, 200, { ok: true, ...modelsStatus(root) })
          return
        }
        if (req.method === 'POST') {
          const body = await readBody(req)
          const action = typeof body.action === 'string' ? body.action : ''
          const id = typeof body.id === 'string' ? body.id : ''
          if (action !== 'download' && action !== 'probe') {
            sendJson(res, 400, { error: 'unknown action: download or probe' })
            return
          }
          if (!MODEL_IDS.includes(id)) {
            sendJson(res, 400, { error: `unknown model: ${id}` })
            return
          }
          if (action === 'probe') {
            sendJson(res, 200, { ok: true, ...modelsStatus(root) })
            return
          }
          if (modelDownloadRunning(root)) {
            sendJson(res, 409, { error: 'a model is already downloading' })
            return
          }
          startModelDownload(root, id).catch(() => {})
          sendJson(res, 202, { ok: true, ...modelsStatus(root) })
          return
        }
        sendJson(res, 405, { error: 'GET or POST' })
      } catch (error) {
        sendJson(res, errorStatus(error), { error: error instanceof Error ? error.message : String(error) })
      }
    }, 'models route')

  })

  // Presets mount after this plugin in the official composition and live in
  // isolated groups. Retry quickly at first, then reconcile once a minute so a
  // session that mounts a preset later still gets the selected tier.
  ctx.effect(() => {
    let stopped = false
    let timer = null
    let chain = Promise.resolve()
    let attempts = 0
    const tick = () => {
      chain = chain
        .then(() => reconcileOnce(ctx))
        .then((result) => {
          if (result && result.updated > 0) {
            trace('reconcile:updated', { updated: result.updated, presets: result.presets })
          }
        })
        .catch((error) => {
          trace('reconcile:failed', error instanceof Error ? error.message : String(error))
        })
      return chain
    }
    const schedule = (delay) => {
      if (stopped) return
      timer = setTimeout(async () => {
        timer = null
        attempts += 1
        await tick()
        schedule(attempts < 40 ? 500 : 60_000)
      }, delay)
      timer.unref?.()
    }
    schedule(600)
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      timer = null
    }
  }, 'compression-tiers: engine reconciler')
}
