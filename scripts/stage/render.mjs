// Offline render stage: runs this repo's own client bundle in a bare VM and
// serialises the real panel / dock / heat / vial trees to HTML, so the
// screenshots under docs/screenshots cannot drift from client.js.
//
//   node scripts/stage/render.mjs        # zh
//   node scripts/stage/render.mjs en     # en
//
// Output: temp/ct-preview/styles.css (the bundle's own CSS) plus
// temp/ct-preview/<lang>/*.html. Only this plugin's surfaces and the minimum
// DSH chrome (conversation column, input card) appear in these pages.
import vm from 'node:vm'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(ROOT, 'temp', 'ct-preview')
const LANG = process.argv[2] === 'en' ? 'en' : 'zh'
const source = readFileSync(join(ROOT, 'client.js'), 'utf8')

/* ---- the stylesheet, taken verbatim from the bundle ---------------------- */
const CSS_MARK = 'const CSS = `'
const cssStart = source.indexOf(CSS_MARK) + CSS_MARK.length
const cssEnd = source.indexOf('`', cssStart)
const css = source.slice(cssStart, cssEnd).replace(/\r\n/g, '\n')
mkdirSync(join(OUT, LANG), { recursive: true })
writeFileSync(join(OUT, 'styles.css'), css)

/* ---- vnode → HTML ------------------------------------------------------- */
const SELF_CLOSING = new Set(['br', 'hr', 'img', 'input', 'path', 'rect', 'line', 'circle', 'ellipse', 'polygon', 'polyline', 'use'])

function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
function attrName(name) {
  if (name === 'className') return 'class'
  if (name === 'htmlFor') return 'for'
  if (name === 'viewBox' || name === 'preserveAspectRatio' || name === 'gradientUnits') return name
  return name.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())
}
function styleText(value) {
  return Object.keys(value)
    .filter((key) => value[key] !== null && value[key] !== undefined && value[key] !== '')
    .map((key) => {
      const name = key.startsWith('--') ? key : key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())
      return name + ':' + value[key]
    })
    .join(';')
}
function serialize(node) {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return escapeText(node)
  if (Array.isArray(node)) return node.map(serialize).join('')
  if (typeof node !== 'object') return ''
  if (node.__portal) return '<div class="stage-portal">' + serialize(node.node) + '</div>'
  if (typeof node.type === 'function') return serialize(node.type(node.props || {}))
  if (typeof node.type !== 'string') return ''
  const tag = node.type
  const props = node.props || {}
  const children = Array.isArray(props.children) ? props.children : [props.children]
  const open = ['<' + tag]
  for (const key of Object.keys(props)) {
    if (key === 'children' || key === 'key' || key === 'ref' || key === 'value') continue
    if (/^on[A-Z]/.test(key)) continue
    const value = props[key]
    if (value === null || value === undefined || value === false) continue
    if (key === 'style') {
      const text = typeof value === 'string' ? value : value && styleText(value)
      if (text) open.push(' style="' + escapeAttr(text) + '"')
      continue
    }
    open.push(' ' + attrName(key) + (value === true ? '' : '="' + escapeAttr(value) + '"'))
  }
  if (tag === 'input' && typeof props.value === 'string') open.push(' value="' + escapeAttr(props.value) + '"')
  open.push('>')
  if (SELF_CLOSING.has(tag)) return open.join('')
  let inner = children.map(serialize).join('')
  if (tag === 'textarea' && props.value !== undefined && props.value !== null) inner = escapeText(props.value)
  return open.join('') + inner + '</' + tag + '>'
}

/* ---- load the bundle in a bare VM --------------------------------------- */
function fakeDocument() {
  const head = {
    appendChild(element) { element.parentNode = head },
    removeChild(element) { element.parentNode = null },
  }
  return {
    body: { setAttribute() {}, removeAttribute() {}, appendChild() {}, style: { setProperty() {}, removeProperty() {} } },
    documentElement: { style: { setProperty() {}, removeProperty() {} }, clientHeight: 900 },
    head,
    createElement() { return { dataset: {}, setAttribute() {}, textContent: '', style: {}, parentNode: null } },
    createTextNode() { return {} },
    querySelector() { return null },
    querySelectorAll() { return [] },
    addEventListener() {},
    removeEventListener() {},
  }
}

/**
 * Run the bundle with a queue-backed hook implementation: every `useState` takes
 * the next seeded value, so a render can start from any state a real session
 * could be in without a browser. `locale.bind` resolves through the real
 * dictionaries, which is what the host does.
 */
function loadScope(states, refs) {
  const queue = Array.isArray(states) ? states.slice() : [states]
  const refQueue = Array.isArray(refs) ? refs.slice() : []
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
    useState: (initial) => (queue.length ? [queue.shift(), () => {}] : [initial, () => {}]),
    useEffect: () => {},
    useLayoutEffect: () => {},
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useRef: (value) => ({ current: refQueue.length ? refQueue.shift() : value }),
  }
  const ReactDOM = { createPortal: (node, target) => ({ __portal: true, node, target }) }
  let module = null
  const sandbox = {
    window: { __ModuleLoader__: { load(m) { module = m } }, addEventListener() {}, removeEventListener() {}, innerWidth: 1440, innerHeight: 940 },
    document: fakeDocument(),
    fetch: () => Promise.resolve({ ok: true, json: async () => ({}) }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    ResizeObserver: function ResizeObserver() { this.observe = () => {}; this.disconnect = () => {} },
    console,
  }
  sandbox.globalThis = sandbox
  vm.runInContext(source, vm.createContext(sandbox))
  const plugin = module.factory((specifier) => (specifier === 'react-dom' ? ReactDOM : React))

  const dictionaries = {}
  const registrations = []
  const lookup = (key) => {
    const dict = dictionaries[LANG] || dictionaries.zh || {}
    return key in dict ? dict[key] : key
  }
  const ctx = {
    effect(fn) { fn(); return () => {} },
    locale: {
      register(namespace, dicts) { if (dicts) Object.assign(dictionaries, dicts); return () => {} },
      bind() { return lookup },
    },
    slots: {
      inject(_slot, callback) { return callback() },
      register(options, component) { registrations.push({ options, component }); return () => {} },
    },
  }
  plugin.apply(ctx)
  return { plugin, registrations, t: lookup }
}

/* ---- fixtures — every number below is invented, never a real session ---- */
const SETTINGS = {
  level: 'standard',
  levels: [
    { id: 'gentle', thresholdRatio: 0.8, retainRatio: 0.2 },
    { id: 'light', thresholdRatio: 0.7, retainRatio: 0.18 },
    { id: 'standard', thresholdRatio: 0.6, retainRatio: 0.16 },
    { id: 'aggressive', thresholdRatio: 0.5, retainRatio: 0.1 },
    { id: 'max', thresholdRatio: 0.4, retainRatio: 0.06 },
  ],
  engines: 2,
  lastCompact: null,
  paths: { settings: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\settings.json' },
}

const RULES_TEXT = [
  '回答用中文；动手前先读完仓库的 AGENTS.md。',
  '改完代码跑 npm test，再更新 docs/CHANGELOG.md。',
  '不确定业务边界时先问，不要自己扩大范围。',
].join('\n')

const RULES = {
  ok: true,
  path: 'C:\\Users\\Administrator\\.dsh\\AGENTS.md',
  exists: true,
  text: RULES_TEXT,
  chars: RULES_TEXT.length,
  lines: 3,
  updatedAt: '2026-11-27T09:00:00.000Z',
  maxChars: 100000,
}

const ROOT_INFO = {
  path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers',
  defaultPath: 'C:\\Users\\Administrator\\.dsh\\compression-tiers',
  isDefault: true,
  components: [],
  running: {},
}

function componentRow(id, fields) {
  return {
    id,
    name: fields.name || id,
    version: fields.version || null,
    toolVersion: fields.toolVersion || null,
    state: fields.state || 'missing',
    supported: true,
    ready: fields.state === 'installed' || fields.state === 'system',
    managed: fields.state === 'installed',
    system: fields.state === 'system',
    path: fields.path || null,
    percent: fields.percent === undefined ? null : fields.percent,
    error: null,
    running: false,
    installDir: fields.installDir || null,
    tools: fields.tools || null,
  }
}

const COMPONENTS = {
  ok: true,
  root: ROOT_INFO,
  components: [
    componentRow('gh', {
      name: 'GitHub CLI',
      version: '2.76.2',
      state: 'installed',
      path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\gh\\bin\\gh.exe',
      installDir: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\gh',
    }),
    componentRow('git', {
      name: 'git',
      version: '2.56.1',
      toolVersion: '2.56.1',
      state: 'installed',
      path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\git\\cmd\\git.exe',
      installDir: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\git',
    }),
    componentRow('ffmpeg', {
      name: 'ffmpeg',
      toolVersion: '7.1.1',
      state: 'partial',
      percent: 47,
      path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\ffmpeg\\bin\\ffmpeg.exe',
      installDir: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\ffmpeg',
      tools: [
        { name: 'ffmpeg', path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\ffmpeg\\bin\\ffmpeg.exe', version: '7.1.1', managed: true },
        { name: 'ffprobe', path: null, version: null, managed: false },
      ],
    }),
    componentRow('python', {
      name: 'Python',
      version: '3.11.18',
      toolVersion: '3.13.1',
      state: 'system',
      path: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
    }),
    componentRow('comfyui', {
      name: 'ComfyUI',
      version: '0.46.0',
      state: 'installed',
      path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\comfyui',
      installDir: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\comfyui',
    }),
    componentRow('comfy-mcp', { name: 'ComfyUI MCP', version: 'commit 6c43880', state: 'missing' }),
  ],
}

const TOTAL_BYTES = 17160390000
const MODELS = {
  ok: true,
  models: [{
    id: 'flux2-klein-4b',
    name: 'FLUX.2 [klein] 4B',
    detail: '4-step distilled · guidance 1.0 · Apache-2.0',
    installed: true,
    state: 'installed',
    bytes: TOTAL_BYTES,
    total: TOTAL_BYTES,
    percent: 100,
    files: 18,
    dir: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\models\\flux2-klein-4b',
    running: false,
    error: null,
  }],
}

const AUTH = {
  available: true,
  authenticated: true,
  account: 'Homer4033',
  path: 'C:\\Users\\Administrator\\.dsh\\compression-tiers\\gh\\bin\\gh.exe',
  version: '2.76.2',
  scopes: ['repo', 'read:org', 'workflow'],
  missingRepoScope: false,
}

/*
 * The sign-in block is shown idle on purpose: a device code looks like a real
 * credential in a screenshot, and the idle state is the one that shows the rule
 * "every action button is always rendered" (the three buttons stay, disabled,
 * with the reason in `title`).
 */
const LOGIN = {
  active: false,
  state: 'idle',
  code: null,
  url: null,
  note: '',
  error: null,
  startedAt: null,
}

const NETWORK = { verdict: 'direct', proxy: null, dns: { resolved: ['140.82.113.4'], knownGithub: true } }

const WORKSPACE_TEXT = '本仓库只改 src/ 与 client.js。\n提交前跑 npm test，按版本打 tag。'
const WORKSPACES = {
  ok: true,
  workspaces: [
    {
      id: 'ws-compress',
      title: LANG === 'en' ? 'context-compression' : '压缩上下文',
      path: 'D:\\DSH插件\\压缩上下文',
      file: 'D:\\DSH插件\\压缩上下文\\AGENTS.md',
      exists: true,
      text: WORKSPACE_TEXT,
    },
    {
      id: 'ws-quant',
      title: LANG === 'en' ? 'dividend-quant' : '红利量化',
      path: 'D:\\红利量化',
      file: 'D:\\红利量化\\AGENTS.md',
      exists: true,
      text: '',
    },
    { id: 'ws-dsh', title: LANG === 'en' ? 'dsh-workspace' : 'DSH工作区', path: 'D:\\DSH工作区', file: 'D:\\DSH工作区\\AGENTS.md', exists: false, text: '' },
  ],
}

/* A 26 × 7 board shaped like `/compression-tiers/api/usage` answers. */
const HEAT = (() => {
  const levels = [2, 3, 1, 4, 5, 0, 2]
  const columns = Array.from({ length: 26 }, (unused, week) => ({
    start: '2026-06-' + String(week + 1).padStart(2, '0'),
    days: Array.from({ length: 7 }, (unusedDay, day) => {
      const future = week === 25 && day > 3
      const active = !future && !(week < 2 && day === 6)
      const level = active ? levels[(week * 3 + day) % levels.length] : 0
      const month = 6 + Math.floor((week * 7 + day) / 30)
      const dom = ((week * 7 + day) % 30) + 1
      return {
        date: '2026-' + String(month).padStart(2, '0') + '-' + String(dom).padStart(2, '0'),
        tokens: level * 260000000,
        sessions: level,
        level,
        future,
        active,
      }
    }),
  }))
  return {
    ok: true,
    weeks: 26,
    range: 'all',
    firstDay: '2026-06-01',
    lastDay: '2026-11-30',
    totalTokens: 5120000000,
    maxDayTokens: 1300000000,
    activeDays: 24,
    sessions: 95,
    streak: 6,
    peakDay: '2026-11-20',
    models: [
      { id: 'deepseek-account/deepseek-flash', provider: 'deepseek-account', model: 'deepseek-flash', tokens: 3400000000, sessions: 60, share: 0.664 },
      { id: 'deepseek-account/deepseek-pro', provider: 'deepseek-account', model: 'deepseek-pro', tokens: 1200000000, sessions: 25, share: 0.234 },
      { id: 'local/qwen3', provider: 'local', model: 'qwen3', tokens: 520000000, sessions: 10, share: 0.102 },
    ],
    columns,
  }
})()

/* The official `contextPressure` projection shape: the host reports the
   projected token count and the model's window. */
const PRESSURE = { projectedTokens: 268000, contextWindow: 512000 }

const BREAKDOWN = { systemTokens: 41000, toolsTokens: 62000, messageTokens: 165000 }
const TOKEN_USAGE = { uncachedInputTokens: 120000, outputTokens: 41000, cacheReadTokens: 96000, cacheWriteTokens: 12000 }
const SESSION_STATS = { turns: 14, steps: 38, tokensPerSecond: 42.6 }

/* ---- panel pages -------------------------------------------------------- */
const HOOK_ORDER = [
  'state', 'message', 'busy',
  'rules', 'rulesText', 'rulesMessage', 'rulesBusy',
  'components', 'componentsMessage', 'componentsBusy',
  'models', 'modelsMessage', 'modelsBusy',
  'pathDraft', 'pathBusy',
  'login', 'auth', 'ghMessage', 'ghBusy', 'network',
  'workspaceRules', 'workspaceId', 'workspaceText', 'workspaceMessage', 'workspaceBusy',
  'section',
]

const BASE_PAGE = {
  state: SETTINGS,
  message: '',
  busy: false,
  rules: RULES,
  rulesText: RULES_TEXT,
  rulesMessage: '',
  rulesBusy: false,
  components: COMPONENTS,
  componentsMessage: '',
  componentsBusy: false,
  models: MODELS,
  modelsMessage: '',
  modelsBusy: false,
  pathDraft: null,
  pathBusy: false,
  login: LOGIN,
  auth: AUTH,
  ghMessage: '',
  ghBusy: false,
  network: NETWORK,
  workspaceRules: WORKSPACES,
  workspaceId: 'ws-compress',
  workspaceText: WORKSPACE_TEXT,
  workspaceMessage: '',
  workspaceBusy: false,
  section: 'levels',
}

/** The real shell tree for one page, as HTML. */
function renderPanel(section) {
  const merged = { ...BASE_PAGE, section }
  const { registrations } = loadScope(HOOK_ORDER.map((key) => merged[key]))
  const panel = registrations.find((item) => item.options.name === 'main')
  const element = panel.component()
  return serialize(element.type(element.props))
}

/* ---- the composer dock row --------------------------------------------- */
const REPOS = [
  { nameWithOwner: 'Homer4033/dsh-harness-toolbox', private: false },
  { nameWithOwner: 'Homer4033/private-notes', private: true },
]

/** Pill refs, then the vial's: trigger, panel, canvas, four runtime refs, placement. */
const VIAL_REFS = [
  null, null, null, null,
  null, null, null, null, null, null,
  { up: true, left: 393, width: 392, bottom: 166, maxHeight: 380 },
  null, null,
]

function projectionOf(key) {
  if (key === 'contextPressure') return PRESSURE
  if (key === 'contextBreakdown') return BREAKDOWN
  if (key === 'tokenUsage') return TOKEN_USAGE
  if (key === 'sessionStats') return SESSION_STATS
  return undefined
}

function renderDock(options) {
  const { settings, extraStates, session } = options
  const states = [REPOS, 'Homer4033/dsh-harness-toolbox', '', false, false, 0, settings, options.heat || null]
    .concat(extraStates || [])
  const { registrations, t } = loadScope(states, VIAL_REFS)
  const dock = registrations.find((item) => item.options.name === 'conversation.input.dock')
  const tree = dock.component({
    sessionId: 'stage-session',
    session: session || { id: 'stage-session', blank: false, awaitingFirstTurn: false },
    t,
    useProjection: projectionOf,
  })
  return serialize(tree)
}

const renderDockRow = (settings) => renderDock({ settings })
const renderVialOpen = (settings) => renderDock({ settings, extraStates: [true, false] })
const renderHeatCard = (settings) => renderDock({
  settings,
  heat: HEAT,
  session: { id: 'stage-blank', blank: true, awaitingFirstTurn: false },
})

/* ---- host token sets (DSH neutral, before our single skin layers over) --- */
const HOST_DARK = {
  '--dsw-alias-bg-base': '#151517',
  '--dsw-alias-bg-layer-1': '#1c1c1e',
  '--dsw-alias-bg-layer-2': '#232324',
  '--dsw-alias-bg-layer-3': '#2c2c2e',
  '--dsw-alias-bg-module-platform': '#353638',
  '--dsw-alias-bg-skeleton': '#26262a',
  '--dsw-alias-bg-overlay': 'rgba(10, 10, 12, 0.72)',
  '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.06)',
  '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.12)',
  '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.2)',
  '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.26)',
  '--dsw-alias-border-selected': '#adb2b8',
  '--dsw-alias-label-primary': '#f2f3f5',
  '--dsw-alias-label-secondary': '#c3c7cc',
  '--dsw-alias-label-tertiary': '#9aa0a6',
  '--dsw-alias-label-caption': '#8b9198',
  '--dsw-alias-label-dimmed': '#767c84',
  '--dsw-alias-label-on-color': '#0b0b0d',
  '--dsw-alias-link': '#7aaaff',
  '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.08)',
  '--dsw-alias-interactive-bg-active': 'rgba(255, 255, 255, 0.12)',
  '--dsw-alias-interactive-bg-hover-solid': '#2a2a2e',
  '--dsw-alias-button-primary-fill': '#7aaaff',
  '--dsw-alias-button-primary-hover': '#93baff',
  '--dsw-alias-button-elevated-fill': '#26262a',
  '--dsw-alias-card-fill': 'rgba(44, 44, 46, 0.6)',
  '--dsw-alias-card-fill-hover': 'rgba(53, 54, 56, 0.72)',
  '--dsw-alias-state-business-primary': '#7aaaff',
  '--dsw-alias-state-done-primary': '#7aaaff',
  '--dsw-alias-state-success-primary': '#4fd6a8',
  '--dsw-alias-state-success-secondary': 'rgba(79, 214, 168, 0.16)',
  '--dsw-alias-chart-system': '#7aaaff',
  '--dsw-alias-chart-tools': '#9db8ff',
  '--dsw-alias-chart-messages': '#5fe3d0',
  '--dsw-alias-chart-1': '#7aaaff',
  '--dsw-alias-chart-2': '#9db8ff',
  '--dsw-alias-chart-3': '#5fe3d0',
  '--dsw-alias-chart-4': '#f0b36b',
  '--dsw-alias-chart-5': '#c79bff',
  '--dsw-alias-chart-6': '#6bd2f0',
  '--dsw-alias-markdown-code-block': '#111112',
  '--dsw-alias-markdown-code-block-banner': '#1b1b1d',
  '--dsw-alias-markdown-citation': 'rgba(122, 170, 255, 0.16)',
  '--dsw-specific-menu': '#232324',
  '--dsw-specific-sidebar-fill': '#1a1a1c',
  '--dsw-specific-bubble': 'rgba(44, 44, 46, 0.9)',
  '--dsw-specific-input-major': '#232324',
  '--dsw-specific-selector': '#2c2c2e',
  '--dsw-alias-tooltip-bg': '#353638',
  '--dsw-alias-toast-bg': '#353638',
  '--dsw-focus-ring-color': '#7aaaff',
  '--dsw-focus-ring-width': '2px',
}

const HOST_LIGHT = {
  '--dsw-alias-bg-base': '#f7f8fa',
  '--dsw-alias-bg-layer-1': '#ffffff',
  '--dsw-alias-bg-layer-2': '#f2f3f5',
  '--dsw-alias-bg-layer-3': '#ffffff',
  '--dsw-alias-bg-module-platform': '#e9eaee',
  '--dsw-alias-bg-skeleton': '#eceef2',
  '--dsw-alias-bg-overlay': 'rgba(247, 248, 250, 0.72)',
  '--dsw-alias-border-l1': 'rgba(16, 20, 28, 0.06)',
  '--dsw-alias-border-l2': 'rgba(16, 20, 28, 0.12)',
  '--dsw-alias-border-l3': 'rgba(16, 20, 28, 0.18)',
  '--dsw-alias-border-l4': 'rgba(16, 20, 28, 0.24)',
  '--dsw-alias-border-selected': '#3c4f76',
  '--dsw-alias-label-primary': '#1a1d23',
  '--dsw-alias-label-secondary': '#4a5060',
  '--dsw-alias-label-tertiary': '#6d7482',
  '--dsw-alias-label-caption': '#7a818e',
  '--dsw-alias-label-dimmed': '#8a919d',
  '--dsw-alias-label-on-color': '#ffffff',
  '--dsw-alias-link': '#2f6bff',
  '--dsw-alias-interactive-bg-hover': 'rgba(16, 20, 28, 0.06)',
  '--dsw-alias-interactive-bg-active': 'rgba(16, 20, 28, 0.1)',
  '--dsw-alias-interactive-bg-hover-solid': '#eceef2',
  '--dsw-alias-button-primary-fill': '#2f6bff',
  '--dsw-alias-button-primary-hover': '#4d82ff',
  '--dsw-alias-button-elevated-fill': '#ffffff',
  '--dsw-alias-card-fill': 'rgba(255, 255, 255, 0.72)',
  '--dsw-alias-card-fill-hover': 'rgba(255, 255, 255, 0.86)',
  '--dsw-alias-state-business-primary': '#2f6bff',
  '--dsw-alias-state-done-primary': '#2f6bff',
  '--dsw-alias-state-success-primary': '#0f9d73',
  '--dsw-alias-state-success-secondary': 'rgba(15, 157, 115, 0.14)',
  '--dsw-alias-chart-system': '#2f6bff',
  '--dsw-alias-chart-tools': '#6f7cff',
  '--dsw-alias-chart-messages': '#0e9f8f',
  '--dsw-alias-chart-1': '#2f6bff',
  '--dsw-alias-chart-2': '#6f7cff',
  '--dsw-alias-chart-3': '#0e9f8f',
  '--dsw-alias-chart-4': '#d98634',
  '--dsw-alias-chart-5': '#8b5cf6',
  '--dsw-alias-chart-6': '#0e9fc4',
  '--dsw-alias-markdown-code-block': '#f4f6fa',
  '--dsw-alias-markdown-code-block-banner': '#e9ecf2',
  '--dsw-alias-markdown-citation': 'rgba(47, 107, 255, 0.12)',
  '--dsw-specific-menu': '#ffffff',
  '--dsw-specific-sidebar-fill': '#f2f3f6',
  '--dsw-specific-bubble': 'rgba(255, 255, 255, 0.94)',
  '--dsw-specific-input-major': '#ffffff',
  '--dsw-specific-selector': '#f2f3f5',
  '--dsw-alias-tooltip-bg': '#1a1d23',
  '--dsw-alias-toast-bg': '#1a1d23',
  '--dsw-focus-ring-color': '#2f6bff',
  '--dsw-focus-ring-width': '2px',
}

const COMPOSER_TOKENS = {
  '--dsh-composer-card-max-width': '720px',
  '--dsh-composer-side-clearance': '16px',
  '--dsh-composer-dock-inset': '8px',
  '--dsh-composer-stack-gap': '8px',
}

function tokenBlock(map) {
  return Object.keys(map).map((name) => '  ' + name + ': ' + map[name] + ';').join('\n')
}

/**
 * One page is one theme deep: the tokens land on `:root` (which is what the
 * host's `overrideTokens` layer does) and the body carries the same switches the
 * live app has — `data-ds-dark-theme` for the theme, `data-ct-*` for our art.
 * The plugin ships exactly one palette (`auto`), so every page gets that one
 * layer: its light half on a light page, its dark half on a dark one.
 */
function shell(options) {
  const { body, dark, extraCss, scripts, bodyAttrs } = options
  const { plugin } = loadScope([])
  const spec = plugin.__test.skinSpec('auto')
  const skin = {}
  for (const name of Object.keys(spec.tokens)) skin[name] = dark ? spec.tokens[name].dark : spec.tokens[name].light
  const tokens = { ...(dark ? HOST_DARK : HOST_LIGHT), ...skin }
  const attrs = [
    dark ? 'data-ds-dark-theme' : '',
    'data-ct-palette="auto"',
    "data-ct-art='on'",
    "data-ct-motion='full'",
    bodyAttrs || '',
  ].filter(Boolean).join(' ')
  return `<!doctype html>
<html lang="${LANG}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="../styles.css">
<style>
:root {
${tokenBlock(tokens)}
${tokenBlock(COMPOSER_TOKENS)}
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}
.ct-page { height: 100%; }
.ct-content { animation: none !important; }
.stage-portal { display: contents; }
${extraCss || ''}
</style>
</head>
<body ${attrs}>
${body}
${scripts || ''}
</body>
</html>
`
}

/* ---- the conversation column ------------------------------------------- */
const DEMO_MESSAGES = [
  ['user', LANG === 'en'
    ? 'The context vial is real: the liquid level is the occupancy, and everything above the tick is the compact zone.'
    : '把上下文用量做成了试管，液面就是占用；刻度线以上是压缩区。'],
  ['assistant', LANG === 'en'
    ? 'Right now it reads 268K / 512K — threshold 307K, retained tail 81.9K, so 39.2K left before the compact fires.'
    : '好的。当前 268K / 512K，压缩阈值 307K、保留原文 81.9K，到阈值前还有 39.2K。'],
  ['user', LANG === 'en'
    ? 'Can the popover split that into system / tools / conversation?'
    : '可以按系统 / 工具 / 对话三段看占用吗？试管里也会按比例染色。'],
  ['assistant', LANG === 'en'
    ? 'Yes — the three segments sit under the numbers and share the ramp with the track. The tier control is still five tiers, and picking one writes into every mounted compaction engine at once.'
    : '可以，三段构成在浮窗底部，颜色跟轨道一致。压缩档位仍是五档，切换会立刻写进所有已挂载的压缩引擎。'],
]

const CONVERSATION_CSS = `
.stage-window { display: grid; grid-template-rows: minmax(0, 1fr) auto; height: 100%; }
.stage-chat { min-height: 0; display: flex; flex-direction: column; justify-content: flex-start; padding: 44px 56px 0; }
.stage-chat-inner { width: min(720px, 100%); margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding-bottom: 26px; }
.stage-msg { display: flex; }
.stage-msg-user { justify-content: flex-end; }
.stage-msg-assistant { justify-content: flex-start; }
.stage-msg > [data-message-bubble] {
  max-width: 90%;
  padding: 11px 16px;
  border-radius: 16px;
  line-height: 1.72;
  font-size: 14px;
  background: var(--dsw-specific-bubble);
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
}
.stage-msg-assistant > [data-message-bubble] {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: var(--dsw-alias-label-secondary);
}
.stage-quote { margin: 2px 0; padding: 2px 0 2px 14px; border-left: 1.5px solid var(--dsw-alias-state-business-primary); color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.7; }
.stage-rule { border: 0; height: 1px; width: 84%; margin: 2px auto; background: linear-gradient(90deg, transparent, var(--dsw-alias-border-l2) 10%, var(--dsw-alias-border-l2) 90%, transparent); }
[data-conversation-region='composer'] { position: relative; }
[data-conversation-region='composer'] > * { position: relative; }
.stage-composer { padding: 0 56px 26px; }
.stage-composer-stack { display: flex; flex-direction: column; gap: var(--dsh-composer-stack-gap); width: 100%; }
.stage-card {
  width: min(720px, calc(100% - 2 * var(--dsh-composer-side-clearance)));
  margin: 0 auto;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 18px;
  background: var(--dsw-specific-input-major);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.3);
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
body:not([data-ds-dark-theme]) .stage-card { box-shadow: 0 14px 34px rgba(24, 40, 70, 0.12); }
.stage-card-line { display: flex; align-items: flex-end; gap: 10px; }
.stage-card-text { flex: 1; min-height: 44px; color: var(--dsw-alias-label-tertiary); font-size: 14px; line-height: 1.5; }
.stage-send { width: 30px; height: 30px; border-radius: 999px; background: var(--dsw-alias-state-business-primary); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24); }
.stage-card-meta { display: flex; align-items: center; justify-content: space-between; color: var(--dsw-alias-label-dimmed); font-size: 12px; }
`

function conversationBody(dock, options) {
  const opts = options || {}
  const shown = DEMO_MESSAGES.slice(0, opts.count || DEMO_MESSAGES.length)
  const messages = shown.map(([role, text]) => (
    `<div class="stage-msg stage-msg-${role}"><div data-message-bubble>${escapeText(text)}</div></div>`
  )).join('\n      ')
  const quote = opts.quote
    ? `<blockquote class="stage-quote">${escapeText(LANG === 'en'
      ? 'Native UI that belongs next to the input card comes first; plugin surfaces come after.'
      : '「与原版输入卡亲密性强的 UI 优先靠近输入卡，插件次之。」')}</blockquote>`
    : ''
  const rule = opts.rule ? '<hr class="stage-rule" />' : ''
  return `<div class="stage-window">
  <div class="stage-chat" data-conversation-region="chat" data-content-phase="active">
    <div class="stage-chat-inner">
      ${messages}
      ${quote}
      ${rule}
    </div>
  </div>
  <div data-conversation-region="composer">
    <div class="stage-composer">
      <div class="stage-composer-stack">
        ${dock}
        <div class="stage-card" data-composer-card>
          <div class="stage-card-line">
            <div class="stage-card-text">${LANG === 'en' ? 'Message the agent…' : '给智能体发送消息…'}</div>
            <div class="stage-send"></div>
          </div>
          <div class="stage-card-meta" data-composer-dock>
            <span data-composer-stat>${LANG === 'en' ? '14 turns · 38 steps · 42.6 tok/s · cache hit 71%' : '14 轮 · 38 步 · 42.6 tok/s · 缓存命中 71%'}</span>
            <span>${LANG === 'en' ? 'context 52%' : '上下文 52%'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`
}

const HEAT_CSS = `
/* The host's empty-state block (greeting + input card) has been shifted to the
   bottom of the chat area; the board floats above it, 16px clear of the block. */
.stage-blank .stage-chat { padding: 0; }
.stage-blank-copy { width: min(720px, 100%); margin: 0 auto 26px; text-align: center; }
.stage-blank-copy h1 { margin: 0 0 8px; font-size: 26px; font-weight: 600; letter-spacing: 0.01em; }
.stage-blank-copy p { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.stage-blank .ct-heat-layer { left: 50%; transform: translateX(-50%); top: auto; bottom: 190px; width: 900px; }
`

function heatBody(card) {
  return `<div class="stage-window stage-blank">
  <div class="stage-chat" data-conversation-region="chat"></div>
  <div data-conversation-region="composer">
    <div class="stage-composer">
      <div class="stage-composer-stack">
        <div class="stage-blank-copy">
          <h1>${LANG === 'en' ? 'What can I help you with?' : '有什么可以帮你的？'}</h1>
          <p>${LANG === 'en' ? 'No context reading yet — the local usage trail goes here.' : '新建会话还没有上下文读数，这里先放本机的用量轨迹。'}</p>
        </div>
        <div class="stage-card" data-composer-card>
          <div class="stage-card-line">
            <div class="stage-card-text">${LANG === 'en' ? 'Message the agent…' : '给智能体发送消息…'}</div>
            <div class="stage-send"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${card}
</div>`
}

/* ---- write the pages ---------------------------------------------------- */
const panelPage = (section, dark) => shell({
  dark,
  body: renderPanel(section),
  extraCss: '.ct-page { height: 100%; }',
})

/*
 * The vial's liquid is a canvas: the real vendor module draws it, so the stage
 * page loads vendor/obsidian-prism/vial-core.js and mounts it with the same
 * options the component passes. The ratios are the three parts of the fixture
 * breakdown over their sum (the component's own `breakdownRatios`).
 */
const VIAL_SCRIPT = `
<script src="../../../vendor/obsidian-prism/vial-core.js"></script>
<script>
(function () {
  var canvas = document.querySelector('.ct-vial-canvas')
  if (!canvas || !window.__agVialCore || typeof window.__agVialCore.mountPhysicalWaterVial !== 'function') return
  var used = 268000
  var state = {
    fill: used / 512000,
    maxTokens: 512000,
    isDark: document.body.hasAttribute('data-ds-dark-theme'),
    critical: false,
    streaming: false,
    hoveredSlice: -1,
    ratios: [41000 / used, 62000 / used, 165000 / used],
    accentTone: 'cobalt',
    lightPreset: 'crystal'
  }
  window.__agVialCore.mountPhysicalWaterVial(canvas, {
    fill: state.fill,
    maxTokens: state.maxTokens,
    isDark: state.isDark,
    accentTone: 'cobalt',
    camp: 'gemini',
    streaming: false,
    reducedMotion: false,
    getState: function () { return state },
    onWake: function () {}
  })
})()
</script>
`

/* The effort slider is a plain DOM controller, so the stage page runs the real
 * bundle through the module loader shim and calls the same seam the tests use.
 * The menu around it is the host's own chrome, drawn from its tokens. */
const EFFORT_CSS = `
.stage-menu-wrap { display: flex; align-items: center; justify-content: center; height: 100%; }
.stage-menu {
  width: 340px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid var(--dsw-alias-border-l3);
  background: var(--dsw-alias-bg-layer-3);
  box-shadow: 0 28px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stage-menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
}
.stage-menu-row + .stage-menu-row { border-top: 1px solid var(--dsw-alias-border-l2); border-radius: 0; }
.stage-menu-row strong { display: flex; align-items: center; gap: 6px; font-weight: 500; color: var(--dsw-alias-label-primary); }
.stage-menu-row svg { width: 14px; height: 14px; color: var(--dsw-alias-label-tertiary); }
.stage-effort-slot { padding: 10px 10px 12px; }
`

const EFFORT_SCRIPT = `
<script>window.__ModuleLoader__ = { load: function (mod) { window.__ctModule = mod } };</script>
<script src="../../../client.js"></script>
<script>
(function () {
  var mod = window.__ctModule
  if (!mod || typeof mod.factory !== 'function') return
  var stub = {
    createElement: function () { return {} },
    useState: function (value) { return [value, function () {}] },
    useEffect: function () {},
    useLayoutEffect: function () {},
    useRef: function (value) { return { current: value } }
  }
  var plugin = mod.factory(function () { return stub })
  var slot = document.querySelector('.stage-effort-slot')
  if (!slot || !plugin.__test || !plugin.__test.effort) return
  var slider = plugin.__test.effort.createSlider(document, { ariaLabel: document.body.getAttribute('data-effort-label') || '' })
  slider.update({
    levels: [
      { id: 'low', name: document.body.getAttribute('data-level-low') || '低' },
      { id: 'medium', name: document.body.getAttribute('data-level-medium') || '中' },
      { id: 'high', name: document.body.getAttribute('data-level-high') || '高' }
    ],
    index: 2,
    busy: false,
    motion: 'full'
  })
  slot.appendChild(slider.element)
})()
</script>
`

const effortBody = `<div class="stage-menu-wrap">
  <div class="stage-menu" role="menu">
    <div class="stage-menu-row"><span>${LANG === 'en' ? 'Model' : '模型'}</span><strong>DeepSeek-V3.2<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.25 4.5 9.75 8l-3.5 3.5"/></svg></strong></div>
    <div class="stage-menu-row"><span>${LANG === 'en' ? 'Effort' : '推理等级'}</span><strong>${LANG === 'en' ? 'High' : '高'}<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.25 4.5 9.75 8l-3.5 3.5"/></svg></strong></div>
    <div class="stage-effort-slot"></div>
  </div>
</div>`

const files = {
  'panel-levels.html': panelPage('levels', true),
  'panel-levels-light.html': panelPage('levels', false),
  'panel-rules.html': panelPage('rules', true),
  'panel-components.html': panelPage('components', true),
  'panel-github.html': panelPage('github', true),
  'conversation.html': shell({
    dark: true,
    body: conversationBody(renderDockRow(SETTINGS), { quote: true, rule: true }),
    extraCss: CONVERSATION_CSS,
  }),
  'conversation-light.html': shell({
    dark: false,
    body: conversationBody(renderDockRow(SETTINGS), { quote: true, rule: true }),
    extraCss: CONVERSATION_CSS,
  }),
  'conversation-vial.html': shell({
    dark: true,
    body: conversationBody(renderVialOpen(SETTINGS), { quote: true, count: 4 }),
    extraCss: CONVERSATION_CSS,
    scripts: VIAL_SCRIPT,
  }),
  'heat.html': shell({
    dark: true,
    body: heatBody(renderHeatCard(SETTINGS)),
    extraCss: CONVERSATION_CSS + HEAT_CSS,
  }),
  'effort.html': shell({
    dark: true,
    body: effortBody,
    extraCss: EFFORT_CSS,
    scripts: EFFORT_SCRIPT,
    bodyAttrs: 'data-effort-label="' + (LANG === 'en' ? 'Reasoning effort' : '推理档位') + '" data-level-low="低" data-level-medium="中" data-level-high="高"',
  }),
}

for (const name of Object.keys(files)) writeFileSync(join(OUT, LANG, name), files[name])
console.log('rendered ' + Object.keys(files).length + ' pages into ' + join(OUT, LANG))
