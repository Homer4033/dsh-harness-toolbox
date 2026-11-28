import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

/** Evaluate the browser module without touching a real ModuleLoader. */
function loadClient(options = {}) {
  const loaded = []
  const styles = []
  const sandbox = vm.createContext({
    window: {
      __ModuleLoader__: {
        load(module) {
          loaded.push(module)
        },
      },
    },
    document: {
      createElement: () => ({ dataset: {}, setAttribute() {}, textContent: '', parentNode: null }),
      head: {
        appendChild(element) {
          element.parentNode = this
          styles.push(element)
        },
        removeChild(element) {
          element.parentNode = null
        },
      },
      querySelector: () => null,
    },
    fetch: options.fetch || (() => Promise.resolve({ ok: true, json: async () => ({}) })),
    setTimeout: options.setTimeout || setTimeout,
    console,
  })
  vm.runInContext(source, sandbox)
  assert.equal(loaded.length, 1)
  return { module: loaded[0], styles, sandbox }
}

/**
 * Feed the page a fixed sequence of `useState` values. A single value becomes
 * the first state, which is the settings payload; everything else keeps its
 * initial value, so a render may start before the fetches resolve.
 * `refValues` seeds the `useRef` calls in order (the repository pill uses the
 * third ref for its menu placement).
 */
function fakeReact(states, refValues) {
  const queue = Array.isArray(states) ? states.slice() : [states]
  const refs = Array.isArray(refValues) ? refValues.slice() : []
  return {
    createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children } }),
    useState: (initial) => (queue.length ? [queue.shift(), () => {}] : [initial, () => {}]),
    useEffect: () => {},
    useLayoutEffect: () => {},
    useRef: (value) => ({ current: refs.length ? refs.shift() : value }),
  }
}

function collect(node, out = []) {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out)
    return out
  }
  out.push(node)
  collect(node.props && node.props.children, out)
  return out
}

function sectionContext(registrations, dictionaries) {
  return {
    effect(fn) {
      const dispose = fn()
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    },
    locale: {
      register(namespace, dicts) {
        if (dictionaries) Object.assign(dictionaries, { namespace, dicts })
        return () => {}
      },
      bind() {
        return (key) => key
      },
    },
    slots: {
      inject(_slot, callback) {
        return callback()
      },
      register(options, component) {
        registrations.push({ options, component })
        return () => {}
      },
    },
  }
}

function render(states, refValues) {
  const { module } = loadClient()
  const registrations = []
  const dictionaries = {}
  module.factory((specifier) => (specifier === 'react-dom' ? { createPortal: (node) => node } : fakeReact(states, refValues))).apply(sectionContext(registrations, dictionaries))
  const panel = registrations.find((item) => item.options.name === 'main')
  assert.ok(panel, 'the toolbox main panel is registered')
  const element = panel.component()
  const tree = element.type(element.props)
  return { nodes: collect(tree), dictionaries, options: panel.options }
}

/** Render the registered composer-dock action with the given hook values. */
function renderDock(states, props, refValues) {
  const { module } = loadClient()
  const registrations = []
  module.factory((specifier) => (specifier === 'react-dom' ? { createPortal: (node) => node } : fakeReact(states, refValues))).apply(sectionContext(registrations))
  const dock = registrations.find((item) => item.options.name === 'conversation.input.dock')
  assert.ok(dock, 'the composer dock action is registered')
  return collect(dock.component(props))
}

/** The concatenated string children of one element. */
function textOf(node) {
  const children = node && Array.isArray(node.props.children) ? node.props.children : []
  return children.flat(Infinity).filter((child) => typeof child === 'string' || typeof child === 'number').join('')
}

/** Whether an element carries one class in its class list. */
function hasClass(node, name) {
  return String((node && node.props && node.props.className) || '').split(/\s+/).includes(name)
}

/** Every string inside an element subtree, in order. */
function deepText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(deepText).join('')
  if (!node || typeof node !== 'object') return ''
  const children = node.props && Array.isArray(node.props.children) ? node.props.children : []
  return children.map(deepText).join('')
}

const settingsState = {
  level: 'standard',
  levels: ['gentle', 'light', 'standard', 'aggressive', 'max'].map((id) => ({
    id,
    thresholdRatio: 0.6,
    retainRatio: 0.16,
  })),
  engines: 2,
  lastCompact: null,
  paths: { settings: 'C:/dsh/compression-tiers/settings.json' },
}

function rulesState(text) {
  return {
    ok: true,
    path: 'C:/dsh/AGENTS.md',
    exists: true,
    text,
    chars: text.length,
    lines: text.split('\n').length,
    updatedAt: '2026-11-17T12:00:00.000Z',
    maxChars: 100000,
  }
}

/**
 * The page calls `useState` in this order; every render below names the values
 * it cares about and leaves the rest at their initial value.
 */
const HOOK_ORDER = [
  'state', 'message', 'busy',
  'rules', 'rulesText', 'rulesMessage', 'rulesBusy',
  'components', 'componentsMessage', 'componentsBusy',
  'models', 'modelsMessage', 'modelsBusy',
  'pathDraft', 'pathBusy',
  'login', 'auth', 'ghMessage', 'ghBusy', 'network',
  'workspaceRules', 'workspaceId', 'workspaceText', 'workspaceMessage', 'workspaceBusy',
  'memory', 'memoryWorkspace', 'memoryMessage', 'memoryBusy',
  'memoryDream', 'dreamEnabled', 'dreamInterval', 'dreamMessage', 'dreamBusy', 'dreamCancelSent',
  'section',
]

const BASE_PAGE = {
  state: settingsState,
  message: '',
  busy: false,
  rules: null,
  rulesText: '',
  rulesMessage: '',
  rulesBusy: false,
  components: null,
  componentsMessage: '',
  componentsBusy: false,
  models: null,
  modelsMessage: '',
  modelsBusy: false,
  pathDraft: null,
  pathBusy: false,
  login: null,
  auth: null,
  ghMessage: '',
  ghBusy: false,
  network: null,
  workspaceRules: null,
  workspaceId: '',
  workspaceText: '',
  workspaceMessage: '',
  workspaceBusy: false,
  memory: null,
  memoryWorkspace: '',
  memoryMessage: '',
  memoryBusy: false,
  memoryDream: null,
  dreamEnabled: false,
  dreamInterval: '24',
  dreamMessage: '',
  dreamBusy: false,
  dreamCancelSent: false,
  section: 'levels',
}

/** One `useState` value per hook, in call order. */
function pageStates(overrides) {
  const merged = { ...BASE_PAGE, ...(overrides || {}) }
  return HOOK_ORDER.map((key) => merged[key])
}

function renderPage(overrides) {
  return render(pageStates(overrides)).nodes
}

/** Render one page of the shell, with the nav rail for that state. */
function renderSection(section, overrides) {
  return renderPage({ ...(overrides || {}), section })
}

/** The self-drawn workspace picker element, wherever the page puts it. */
function pickerOf(nodes) {
  return nodes.find((node) => typeof node.type === 'function' && node.props && Array.isArray(node.props.items)) || null
}

/**
 * Render the picker itself. The page render leaves the component element
 * unexpanded, so the picker's own hook values are appended to the page queue
 * (open, active) and its refs are seeded in call order (trigger, menu,
 * placement).
 */
function renderPicker(overrides, pickerStates, refValues) {
  const nodes = render(pageStates(overrides).concat(pickerStates || []), refValues).nodes
  const picker = pickerOf(nodes)
  assert.ok(picker, 'the workspace picker is a self-drawn component')
  return collect(picker.type(picker.props))
}

const ROOT = {
  path: 'C:/dsh/compression-tiers',
  defaultPath: 'C:/dsh/compression-tiers',
  isDefault: true,
  components: [],
  running: { gh: false, git: false, ffmpeg: false, python: false },
}

const componentRow = (id, state, extra) => ({
  id,
  name: id === 'gh'
    ? 'GitHub CLI'
    : id === 'python' ? 'Python'
    : id === 'comfyui' ? 'ComfyUI'
    : id === 'comfy-mcp' ? 'ComfyUI MCP'
    : id,
  version: id === 'gh'
    ? '2.76.2'
    : id === 'git' ? '2.56.1'
    : id === 'python' ? '3.11.18'
    : id === 'comfyui' ? '0.46.0'
    : id === 'comfy-mcp' ? 'commit 6c43880'
    : null,
  toolVersion: null,
  state,
  supported: true,
  ready: state === 'installed' || state === 'system',
  managed: state === 'installed',
  system: state === 'system',
  path: null,
  percent: null,
  error: null,
  running: state === 'downloading',
  installDir: null,
  tools: null,
  ...(extra || {}),
})

function componentsPayload(rows, root) {
  return { ok: true, root: root || ROOT, components: rows }
}

const authState = {
  available: true,
  authenticated: false,
  account: null,
  path: 'C:/dsh/compression-tiers/gh/bin/gh.exe',
  version: '2.76.2',
}

const idleLogin = { active: false, state: 'idle', code: null, url: null, note: '', error: null, startedAt: null }

function buttonOf(nodes, action) {
  return nodes.filter((node) => node.type === 'button' && node.props['data-action'] === action)[0] || null
}

function buttonByText(nodes, text) {
  return nodes.filter((node) => node.type === 'button' && textOf(node) === text)
}

/** The action row that holds one component's download button. */
function actionRowOf(nodes, action) {
  const flatten = (value) => (Array.isArray(value) ? value.flat(Infinity) : [value])
  return nodes
    .filter((node) => node.props.className === 'ct-actions')
    .map((row) => flatten(row.props.children).filter((child) => child && child.type === 'button'))
    .find((buttons) => buttons.some((button) => button.props['data-action'] === action)) || null
}

test('the client factory registers a sidebar panel and a composer dock entry', () => {
  const { module, styles } = loadClient()
  const registrations = []
  let dictionaries
  const ctx = {
    effect(fn) {
      const dispose = fn()
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    },
    locale: {
      register(namespace, dicts) {
        dictionaries = { namespace, dicts }
        return () => {}
      },
      bind(namespace) {
        return (key) => `${namespace}:${key}`
      },
    },
    slots: {
      inject(_slot, callback) {
        return callback()
      },
      register(options, component) {
        registrations.push({ options, component })
        return () => {}
      },
    },
  }
  module.factory(() => fakeReact(null)).apply(ctx)

  assert.deepEqual(
    registrations.map((item) => item.options.name).sort(),
    ['conversation.input.dock', 'main', 'sidebar.panellist'],
  )
  // The toolbox is a sidebar row plus its main panel; the Settings section it
  // used to register is gone on purpose.
  const row = registrations.find((item) => item.options.name === 'sidebar.panellist')
  assert.equal(row.options.id, 'compression-tiers')
  assert.equal(row.options.order, 47)
  assert.equal(row.options.label(), 'compressionTiers:sectionLabel')
  assert.equal(registrations.some((item) => item.options.name === 'settings.section'), false)
  const main = registrations.find((item) => item.options.name === 'main')
  assert.equal(main.options.key, 'compression-tiers')
  // The panel icon is a sized SVG, not text: the sidebar row renders it at 16
  // or 18px through `sidebar.panel.icon`.
  const icon = collect(row.component({ size: 18, active: true }))
    .find((node) => node.type === 'svg')
  assert.ok(icon, 'the sidebar row registers an icon')
  assert.equal(icon.props.width, 18)
  assert.equal(icon.props.height, 18)
  assert.equal(icon.props['aria-hidden'], 'true')
  // The repository pill rides the composer dock: present in a blank Session,
  // and it renders in place instead of being portaled into the tab strip.
  const dock = registrations.find((item) => item.options.name === 'conversation.input.dock')
  assert.equal(dock.options.id, 'compression-repo')
  // The dock is a list slot sorted by ascending `order`: rows that belong to
  // the conversation itself stay closest to the input card (the agent's task
  // bar `todo` is 0, the worktree strip 5, the goal bar 10, the queue 20). A
  // plugin row comes after the host's own UI, so this one is negative and
  // renders above every host row: 仓库栏和试管 → 任务栏 → 输入卡.
  assert.equal(dock.options.order, -1000)
  assert.ok(dock.options.order < 0)
  assert.equal(dock.options.locale, 'compressionTiers')
  // The sheet is injected once, globally: the dock pill renders outside the
  // toolbox panel and must not depend on that panel having been opened.
  assert.equal(styles.length, 1)
  assert.match(styles[0].textContent, /\.ct-repo-pill \{/)
  const dockCss = String(styles[0].textContent).match(/\.ct-repo-dock \{[^}]*\}/)
  assert.ok(dockCss, 'the dock row keeps its own rule')
  // 2.5.0 removed the companions: the row only holds the tools and is aligned
  // to the dock grid, with no container query left behind.
  assert.match(dockCss[0], /justify-content: flex-end/)
  assert.doesNotMatch(dockCss[0], /container-type: inline-size/)
  assert.doesNotMatch(String(styles[0].textContent), /ct-dock-mascots/)
  assert.match(dockCss[0], /--dsh-composer-side-clearance/)
  // The row mirrors the host's own composer dock box: the card is centered on
  // `--dsh-composer-card-max-width`, and the host's rows (todo bar, goal bar,
  // queue) are inset once more by `--dsh-composer-dock-inset` per side. A row
  // that hugged the card overhung the task bar by 16px on the right.
  assert.match(dockCss[0], /--dsh-composer-card-max-width/)
  assert.match(dockCss[0], /--dsh-composer-dock-inset/)
  assert.match(dockCss[0], /max-width: calc\(var\(--dsh-composer-card-max-width/)
  assert.match(dockCss[0], /margin: 0 auto/)
  // The vial chip shares the surface of the host's dock rows: at layer-2 it
  // read darker than the task bar and the input card next to it.
  const vialCss = String(styles[0].textContent).match(/\.ct-vial \{[^}]*\}/)
  assert.ok(vialCss, 'the vial trigger keeps its own rule')
  assert.match(vialCss[0], /background: var\(--dsw-specific-menu/)
  // No tab-strip slot survives: the pill is no longer appended to the header.
  assert.doesNotMatch(styles[0].textContent, /\.ct-repo-slot/)
  // The main panel is its own scrollport, so the page cannot grow the frame.
  const pageCss = String(styles[0].textContent).match(/\.ct-page \{[^}]*\}/)
  assert.ok(pageCss, 'the panel page keeps its own rule')
  assert.match(pageCss[0], /overflow-y: auto/)
  assert.match(pageCss[0], /flex: 1 1 auto/)
  // A stable gutter keeps the content box the same width on every page: an
  // appearing scrollbar used to narrow it and shift the centered shell.
  assert.match(pageCss[0], /scrollbar-gutter: stable/)
  // Liquid-glass recipe shared by the rail and the cards.
  assert.match(pageCss[0], /--ct-glass-fill:/)
  assert.match(pageCss[0], /--ct-glass-sheen:/)
  // The page is the query container, not the shell: a container query cannot
  // style its own container, so a shell-level query left the shell in two
  // columns and only flipped the rail inside a 196px slot.
  assert.match(pageCss[0], /container-type: inline-size/)
  // The shell is one nav rail plus one page at a time, queried on the panel's
  // own width (the sidebar eats a fixed slice of the window).
  const shellCss = String(styles[0].textContent).match(/\.ct-shell \{[^}]*\}/)
  assert.ok(shellCss, 'the panel is a shell')
  assert.match(shellCss[0], /grid-template-columns: 196px minmax\(0, 1fr\)/)
  assert.equal(/container-type/.test(shellCss[0]), false, 'the query container is the page')
  assert.match(shellCss[0], /max-width: 980px/)
  assert.match(styles[0].textContent, /\.ct-nav \{/)
  assert.match(styles[0].textContent, /\.ct-nav-item \{/)
  assert.match(styles[0].textContent, /\.ct-nav-item\[aria-current='page'\]/)
  assert.match(styles[0].textContent, /\.ct-content \{/)
  assert.match(styles[0].textContent, /@keyframes ct-page-in/)
  // The rail's sticky offset must be 0: a positive one displaced it downward
  // at rest, so it never lined up with the card on the right.
  const navCss = String(styles[0].textContent).match(/\.ct-nav \{[^}]*\}/)
  assert.ok(navCss, 'the rail keeps its own rule')
  assert.match(navCss[0], /position: sticky/)
  assert.match(navCss[0], /top: 0;/)
  assert.equal(/top: 18px/.test(navCss[0]), false, 'the rail is not inset from the scrollport')
  // The page switch fades only: a translate made the page slide on every click.
  const pageIn = String(styles[0].textContent).match(/@keyframes ct-page-in \{[^}]*\}[^}]*\}/)
  assert.ok(pageIn, 'the page keeps its entrance animation')
  assert.equal(/transform/.test(pageIn[0]), false, 'the page fades instead of sliding')
  assert.match(styles[0].textContent, /@container \(max-width: 720px\)/)
  // The narrow rail wraps its items; clipped pages are not an option.
  assert.match(styles[0].textContent, /flex-wrap: wrap/)
  const panelCss = String(styles[0].textContent).match(/\.ct-panel \{[^}]*\}/)
  assert.match(panelCss[0], /border-radius: 20px/)
  assert.match(panelCss[0], /--ct-glass-fill/)
  // Cards stay un-blurred on purpose: every page switch re-creates them, and one
  // blurred surface per card is what made the switch stutter.
  assert.equal(/backdrop-filter: blur/.test(panelCss[0]), false, 'cards do not blur the page behind them')
  assert.match(panelCss[0], /contain: paint/)
  assert.match(styles[0].textContent, /\.ct-nav \{[^}]*backdrop-filter: blur/s)
  // The old single-scroll two-column page is gone on purpose.
  assert.equal(/\.ct-page-inner|\.ct-columns|\.ct-col \{/.test(styles[0].textContent), false, 'the two-column page is gone')
  // The removed license page leaves no stylesheet or dictionary behind.
  assert.equal(/\.ct-license/.test(styles[0].textContent), false, 'the license page is gone')
  // Menus share one surface, one step above the card fill, and the workspace
  // picker is self-drawn: a native select popup paints light-on-light.
  assert.match(styles[0].textContent, /\.ct-menu \{/)
  assert.match(styles[0].textContent, /\.ct-menu\[data-side='down'\]/)
  assert.match(styles[0].textContent, /@keyframes ct-menu-rise/)
  assert.match(styles[0].textContent, /\.ct-menu-option-active/)
  assert.match(styles[0].textContent, /\.ct-select \{/)
  assert.equal(/\.ct-repo-option|\.ct-repo-menu/.test(styles[0].textContent), false, 'the old menu classes are gone')
  // Components and local models are one list, not one card per item: the page
  // owns the only card and every row keeps its actions on the trailing edge.
  assert.match(styles[0].textContent, /\.ct-item \{/)
  assert.match(styles[0].textContent, /\.ct-item > \.ct-actions/)
  assert.match(styles[0].textContent, /\.ct-list-head \+ \.ct-list > \.ct-item:first-child/)
  assert.equal(/\.ct-component/.test(styles[0].textContent), false, 'the per-component blocks are gone')
  // Empty status/note lines must collapse instead of leaving a gap in the panel.
  assert.match(styles[0].textContent, /\.ct-status:empty,\s*\.ct-note:empty \{/)
  assert.match(styles[0].textContent, /display: none;/)
  assert.equal(dictionaries.namespace, 'compressionTiers')
  assert.deepEqual(Object.keys(dictionaries.dicts).sort(), ['en', 'zh'])
  for (const locale of ['zh', 'en']) {
    const keys = Object.keys(dictionaries.dicts[locale])
    for (const key of [
      'title', 'sectionLabel', 'levelGentle', 'currentLabel', 'rulesTitle', 'rulesSave', 'rulesMissing',
      'workspaceRulesTitle', 'workspaceSelectLabel', 'workspaceRulesLabel',
      'workspaceRulesPlaceholder',
      'workspaceRulesMissing', 'workspaceRulesLoadFailed', 'workspaceRulesSaveFailed',
      'workspaceRulesSaved',
      'componentsTitle', 'componentsListLabel', 'componentsLoadFailed', 'componentsActionFailed',
      'toolsPathLabel', 'toolsPathSave', 'toolsPathReset', 'toolsPathRunning',
      'ghAuthTitle', 'ghLogin', 'ghCopy', 'ghOpenDevice', 'ghCancel',
      'toolsNotFound', 'toolsManaged', 'toolsSystem', 'pathLabel',
      'probe', 'downloadIdle', 'downloadKeep', 'downloadContinue', 'downloadRetry',
      'downloadRunning', 'downloadDone', 'downloadUnsupported',
      'stateMissing', 'statePartial', 'stateFailed', 'stateSystem',
      'repoSelectLabel', 'repoNone', 'repoTitle',
      'navAria', 'navLevels', 'navMemory', 'navRules', 'navComponents', 'navGithub',
      'memoryTitle', 'memoryWorkspaceLabel', 'memoryNone', 'memoryDir', 'memoryEntries',
      'memoryIndex', 'memoryPromises', 'memoryRecent', 'memoryNoEntries', 'memoryOver',
      'memoryReload', 'memoryRebuild', 'memoryDream', 'memoryFailed', 'memoryLoadFailed',
      'memoryForeign', 'memoryDrift', 'memoryQuarantine',
      'memoryDreamTitle', 'memoryDreamEnabled', 'memoryDreamDisabled', 'memoryDreamEnable',
      'memoryDreamDisable', 'memoryDreamInterval', 'memoryDreamNext', 'memoryDreamLast',
      'memoryDreamNever', 'memoryDreamRunning', 'memoryDreamSave', 'memoryDreamRun',
      'memoryDreamCancel', 'memoryDreamCancelSent', 'memoryDreamSaved', 'memoryDreamClean', 'memoryDreamFailed',
      'memoryDreamRoots', 'memoryDreamMerged', 'memoryDreamExpired', 'memoryDreamCompute',
      'vialTitle', 'vialAria', 'vialUsed', 'vialWindow', 'vialThreshold', 'vialRetain',
      'vialUntil', 'vialLevel', 'vialSystem', 'vialTools', 'vialMessages', 'vialUnavailable',
      'vialLoading', 'vialClose',
      'levelsTitle', 'ghScopesLabel', 'ghScopesNone',
    ]) {
      assert.ok(keys.includes(key), `${locale} is missing ${key}`)
    }
    // The license page is gone: its labels must not come back.
    for (const key of ['navLicense', 'licenseTitle', 'licenseOwn', 'licenseComponentsTitle', 'licenseNotice']) {
      assert.equal(keys.includes(key), false, `${locale} still carries ${key}`)
    }
    // The workspace page merged into the rules page; its own rail label must
    // not come back.
    assert.equal(keys.includes('navWorkspace'), false, `${locale} still carries navWorkspace`)
    // The appearance page is gone (2.8.2): its palette / motion / art copy must
    // not come back, and neither does the "follow the host" palette.
    for (const key of ['navAppearance', 'appearanceTitle', 'paletteLabel', 'paletteHost', 'paletteObsidian', 'paletteCrystal', 'motionLabel', 'motionFull', 'motionSubtle', 'motionOff', 'artLabel', 'artOn', 'artOff', 'appearanceApplied', 'appearanceFailed']) {
      assert.equal(keys.includes(key), false, `${locale} still carries ${key}`)
    }
    // The settings page carries controls, state and errors only; teaching copy
    // lives in AGENTS.md, so these keys must stay gone.
    for (const key of ['intro', 'smallWindow', 'summaryMax', 'summaryGentle', 'rulesIntro', 'ghIntro', 'toolsIntro', 'ghToolNote', 'ghLoginNote']) {
      assert.equal(keys.includes(key), false, `${locale} still carries ${key}`)
    }
    // One component panel replaced the old "video tools" and "download
    // location" panels; their titles and per-panel copies must stay gone.
    for (const key of ['toolsTitle', 'toolsPathTitle', 'ghTitle', 'ghPathLabel', 'toolsLoadFailed', 'toolsActionFailed', 'toolsPathLoadFailed']) {
      assert.equal(keys.includes(key), false, locale + ' still carries ' + key)
    }
    // Every row shares one set of labels; per-panel duplicates must stay gone.
    for (const key of ['ghProbe', 'ghInstalled', 'ghDownload', 'ghRetry', 'ghContinue', 'ghMissing', 'toolsInstall', 'toolsProbe', 'toolsInstalled', 'toolsRetry', 'toolsContinue', 'toolsDownloading']) {
      assert.equal(keys.includes(key), false, locale + ' split the button labels again with ' + key)
    }
    // The sidebar repository panel is gone; its copy must not linger.
    assert.equal(keys.filter((key) => key.startsWith('repos')).length, 0)
  }
  assert.deepEqual(
    Object.keys(dictionaries.dicts.zh).sort(),
    Object.keys(dictionaries.dicts.en).sort(),
    'both locales carry the same keys',
  )
})

test('the repository row renders above every host-native composer dock row', () => {
  const { module } = loadClient()
  const registrations = []
  const ctx = {
    effect(fn) {
      const dispose = fn()
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    },
    locale: {
      register() { return () => {} },
      bind() { return (key) => key },
    },
    slots: {
      inject(_slot, callback) {
        return callback()
      },
      register(options) {
        registrations.push(options)
        return () => {}
      },
    },
  }
  module.factory(() => fakeReact(null)).apply(ctx)
  const dock = registrations.find((options) => options.name === 'conversation.input.dock')
  // `conversation.input.dock` is a list slot the host renders by ascending
  // `order`: the agent's task bar is `todo` (0), the worktree strip is
  // `forge-panel.worktree` (5), the goal bar `goal` (10) and the queue `queue`
  // (20). Host-native rows stay closest to the input card and this plugin row
  // comes after them, so it has to sort before every one of those.
  for (const hostOrder of [0, 5, 10, 20]) {
    assert.ok(dock.order < hostOrder, `the dock row must render before order ${hostOrder}`)
  }
  assert.equal(dock.order, -1000)
})

test('the tiers page renders five tier buttons and the current tier', () => {
  const nodes = renderPage()
  const buttons = nodes.filter((node) => node.type === 'button')
  const tiers = buttons.filter((node) => node.props.role === 'radio')
  assert.equal(tiers.length, 5)
  const selected = tiers.filter((node) => node.props['aria-checked'] === 'true')
  assert.equal(selected.length, 1)
  assert.match(String(selected[0].props.className), /ct-level-on/)
  // Each tier shows its two ratios on their own lines, so a narrow card does
  // not wrap "自动 x% · 留 y%" into three.
  const first = tiers[0]
  const spans = (Array.isArray(first.props.children) ? first.props.children : [])
    .filter((child) => child && child.type === 'span')
  assert.equal(spans.length, 2)
  assert.match(textOf(spans[0]), /^auto60%$/)
  assert.match(textOf(spans[1]), /^retain16%$/)
  // One page at a time: no rules editor on the tiers page.
  assert.equal(nodes.filter((node) => node.type === 'textarea').length, 0)
  assert.equal(buttonOf(nodes, 'rulesSave'), null)
  assert.equal(nodes.some((node) => node.type === 'style'), false, 'the stylesheet is global, not page-scoped')
})

test('the rules page shows the saved text and enables saving an edit', () => {
  const saved = rulesState('Answer in Chinese.\n')
  const nodes = renderSection('rules', { rules: saved, rulesText: 'Answer in Chinese.\nBe brief.\n' })
  assert.deepEqual(nodes.filter((node) => node.type === 'h3').map((node) => textOf(node)), ['rulesTitle', 'workspaceRulesTitle'])
  const save = buttonOf(nodes, 'rulesSave')
  assert.ok(save)
  assert.equal(save.props.disabled, false)
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas.length, 1)
  assert.equal(textareas[0].props.value, 'Answer in Chinese.\nBe brief.\n')
  assert.equal(textareas[0].props.disabled, false)
  const path = 'C:/dsh/AGENTS.md'
  const mentionsPath = nodes.some((node) => Array.isArray(node.props.children)
    && node.props.children.some((child) => typeof child === 'string' && child.includes(path)))
  assert.ok(mentionsPath, 'the panel shows the rules file path')
})

test('an unchanged rules draft keeps saving disabled', () => {
  const saved = rulesState('Answer in Chinese.\n')
  const nodes = renderSection('rules', { rules: saved, rulesText: 'Answer in Chinese.\n' })
  assert.equal(buttonOf(nodes, 'rulesSave').props.disabled, true)
})

test('the component panel renders one row per managed component', () => {
  const rows = [
    componentRow('gh', 'installed', { path: 'C:/dsh/compression-tiers/gh/bin/gh.exe' }),
    componentRow('git', 'installed', { path: 'C:/dsh/compression-tiers/git/cmd/git.exe', toolVersion: '2.56.1.windows.1' }),
    componentRow('ffmpeg', 'installed', {
      path: 'C:/dsh/compression-tiers/ffmpeg/bin/ffmpeg.exe',
      toolVersion: '7.1.1',
      tools: [
        { name: 'ffmpeg', path: 'C:/dsh/compression-tiers/ffmpeg/bin/ffmpeg.exe', version: '7.1.1', managed: true },
        { name: 'ffprobe', path: 'C:/dsh/compression-tiers/ffmpeg/bin/ffprobe.exe', version: '7.1.1', managed: true },
      ],
    }),
    componentRow('python', 'installed', { path: 'C:/dsh/compression-tiers/python/python.exe', toolVersion: '3.11.18' }),
    componentRow('comfyui', 'installed', { path: 'C:/dsh/compression-tiers/comfyui' }),
    componentRow('comfy-mcp', 'installed', { path: 'C:/dsh/compression-tiers/comfy-mcp' }),
  ]
  const nodes = renderSection('components', { components: componentsPayload(rows) })
  const names = nodes
    .filter((node) => String(node.props.className || '') === 'ct-item-name')
    .map((node) => textOf(node))
  // The page is 模型和组件 now: the PATH components and the two source trees,
  // then the local model.
  assert.deepEqual(names, ['GitHub CLI', 'git', 'ffmpeg / ffprobe', 'Python', 'ComfyUI', 'ComfyUI MCP', 'FLUX.2 [klein] 4B'])
  const items = nodes.filter((node) => String(node.props.className || '') === 'ct-item')
  assert.equal(items.length, 6, 'six list rows instead of six cards')
  assert.equal(nodes.filter((node) => Boolean(node.props['data-model'])).length, 1, 'one local model row')
  assert.match(deepText(items[0]), /downloadDone/)
  assert.match(deepText(items[0]), /v2\.76\.2/)
  assert.match(deepText(items[0]), /gh\\?\.exe|gh\.exe/)
  // The ffmpeg row still lists both binaries and where they came from.
  const tools = nodes.filter((node) => String(node.props.className || '') === 'ct-tool-name').map((node) => textOf(node))
  assert.deepEqual(tools, ['ffmpeg', 'ffprobe'])
  assert.match(deepText(items[2]), /toolsManaged v7\.1\.1/)
  assert.match(deepText(items[2]), /ffprobe\.exe/)
  // A source tree shows its tag with a `v`, a commit pin without one, and the
  // install root instead of a binary.
  assert.match(deepText(items[4]), /downloadDone/)
  assert.match(deepText(items[4]), /v0\.46\.0/)
  assert.match(deepText(items[4]), /comfyui/)
  assert.match(deepText(items[5]), /downloadDone/)
  assert.match(deepText(items[5]), /commit 6c43880/)
  // An installed component is done: the button is disabled but still rendered.
  for (const id of ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp']) {
    const download = buttonOf(nodes, `download:${id}`)
    assert.ok(download, `download:${id} is rendered`)
    assert.equal(download.props.disabled, true)
    assert.equal(textOf(download), 'downloadDone')
    assert.ok(buttonOf(nodes, `probe:${id}`), `probe:${id} is rendered`)
  }
})

test('the components and the model are one list, not one card per item', () => {
  const rows = ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp'].map((id) => componentRow(id, 'missing'))
  const nodes = renderSection('components', { components: componentsPayload(rows) })
  // The page owns the only card; the two groups are lists of rows inside it.
  assert.equal(nodes.filter((node) => hasClass(node, 'ct-panel')).length, 1, 'one card for the whole page')
  const lists = nodes.filter((node) => hasClass(node, 'ct-list'))
  assert.equal(lists.length, 2, 'one list for the components, one for the local models')
  assert.equal(lists[0].props['data-components'], true)
  assert.equal(lists[1].props['data-models'], true)
  // A section label names each group instead of a second card around it.
  const heads = nodes.filter((node) => node.type === 'h4' && hasClass(node, 'ct-list-head')).map((node) => textOf(node))
  assert.deepEqual(heads, ['componentsListLabel', 'modelsLabel'])
  const items = nodes.filter((node) => hasClass(node, 'ct-item'))
  assert.equal(items.length, 7, 'six components and one model, one line each')
  for (const item of items) {
    assert.ok(item.props['data-component'] || item.props['data-model'], 'every line has a stable handle')
    const children = Array.isArray(item.props.children) ? item.props.children.flat(Infinity) : []
    const actions = children.filter((child) => child && hasClass(child, 'ct-actions'))
    assert.equal(actions.length, 1, 'the buttons ride the row itself')
    assert.equal(actions[0].props.children.flat(Infinity).length, 2, 'download then re-check, no third button')
  }
  // No per-item surface: the old per-component block classes are gone.
  assert.equal(nodes.some((node) => String(node.props.className || '').includes('ct-component')), false)
})

test('a missing ffprobe stays listed under the ffmpeg row', () => {
  const rows = [
    componentRow('ffmpeg', 'partial', {
      path: 'C:/dsh/compression-tiers/ffmpeg/bin/ffmpeg.exe',
      toolVersion: '7.1.1',
      tools: [
        { name: 'ffmpeg', path: 'C:/dsh/compression-tiers/ffmpeg/bin/ffmpeg.exe', version: '7.1.1', managed: true },
        { name: 'ffprobe', path: null, version: null, managed: false },
      ],
    }),
  ]
  const nodes = renderSection('components', { components: componentsPayload(rows) })
  const toolRows = nodes.filter((node) => String(node.props.className || '') === 'ct-tool')
  assert.equal(toolRows.length, 2, 'the found binary and the missing one')
  assert.match(deepText(toolRows[0]), /toolsManaged v7\.1\.1/)
  assert.equal(deepText(toolRows[1]), 'ffprobetoolsNotFound')
})

test('a row with no binary at all says it once instead of repeating the state', () => {
  const rows = [
    componentRow('ffmpeg', 'missing', {
      tools: [
        { name: 'ffmpeg', path: null, version: null, managed: false },
        { name: 'ffprobe', path: null, version: null, managed: false },
      ],
    }),
  ]
  const nodes = renderSection('components', { components: componentsPayload(rows) })
  const toolRows = nodes.filter((node) => String(node.props.className || '') === 'ct-tool')
  assert.equal(toolRows.length, 0, 'nothing to list when neither binary is there')
  // The title still names both binaries, and the state appears exactly once.
  const head = nodes
    .filter((node) => String(node.props.className || '') === 'ct-item-main')
    .find((node) => deepText(node).startsWith('ffmpeg / ffprobe'))
  assert.equal(deepText(head), 'ffmpeg / ffprobestateMissing')
  const text = deepText({ props: { children: nodes } })
  assert.equal(text.includes('toolsNotFound'), false, 'no second "未找到" line')
})

test('every component row obeys one button standard', () => {
  const ids = ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp']
  const missing = componentsPayload(ids.map((id) => componentRow(id, 'missing')))
  const nodes = renderSection('components', { components: missing })
  for (const id of ids) {
    const download = buttonOf(nodes, `download:${id}`)
    assert.deepEqual(String(download.props.className).split(' '), ['ct-btn', 'ct-btn--primary'])
    assert.equal(textOf(download), 'downloadIdle')
    assert.equal(download.props.disabled, false)
    const probe = buttonOf(nodes, `probe:${id}`)
    assert.deepEqual(String(probe.props.className).split(' '), ['ct-btn'])
    assert.equal(textOf(probe), 'probe')
    // Download first, re-check second, exactly two buttons in the row.
    const row = actionRowOf(nodes, `download:${id}`)
    assert.ok(row, `download:${id} sits in a ct-actions row`)
    assert.deepEqual(row.map((button) => button.props['data-action']), [`download:${id}`, `probe:${id}`])
    assert.deepEqual(row.map((button) => button.props.className), ['ct-btn ct-btn--primary', 'ct-btn'])
  }
})

test('a component with no managed build explains itself instead of hiding the button', () => {
  const nodes = renderSection('components', {
    components: componentsPayload([componentRow('gh', 'missing', { supported: false })]),
  })
  const download = buttonOf(nodes, 'download:gh')
  assert.equal(download.props.disabled, true)
  assert.equal(textOf(download), 'downloadUnsupported')
  assert.equal(deepText(nodes.find((node) => String(node.props.className || '') === 'ct-item-main')), 'GitHub CLIv2.76.2downloadUnsupported')
})

test('a PATH-only component offers the same forced download', () => {
  const nodes = renderSection('components', {
    components: componentsPayload([componentRow('git', 'system', { path: 'C:/Program Files/Git/cmd/git.exe', toolVersion: '2.56.1.windows.1' })]),
  })
  const download = buttonOf(nodes, 'download:git')
  assert.equal(textOf(download), 'downloadKeep')
  assert.equal(download.props.disabled, false)
  const block = nodes
    .filter((node) => String(node.props.className || '') === 'ct-item')
    .find((node) => deepText(node).startsWith('git'))
  assert.match(deepText(block), /stateSystem/)
  assert.match(deepText(block), /Git\/cmd\/git\.exe/)
})

test('a running download shows its progress and blocks a second start', () => {
  const nodes = renderSection('components', {
    components: componentsPayload([
      componentRow('ffmpeg', 'downloading', { percent: 47.9 }),
    ]),
  })
  const download = buttonOf(nodes, 'download:ffmpeg')
  assert.equal(textOf(download), 'downloadRunning')
  assert.equal(download.props.disabled, true)
  const bar = nodes.find((node) => String(node.props.className || '') === 'ct-progress')
  assert.ok(bar, 'the row renders a progress bar')
  const fill = Array.isArray(bar.props.children) ? bar.props.children[0] : bar.props.children
  assert.equal(fill.props.style.width, '47.9%')
})

test('a failed download keeps its error and offers a retry', () => {
  const nodes = renderSection('components', {
    components: componentsPayload([
      componentRow('python', 'error', { error: 'download failed HTTP 404', percent: 12 }),
    ]),
  })
  assert.equal(textOf(buttonOf(nodes, 'download:python')), 'downloadRetry')
  assert.equal(buttonOf(nodes, 'download:python').props.disabled, false)
  assert.ok(nodes.some((node) => deepText(node).includes('download failed HTTP 404')))
})

test('the component buttons wait for the payload instead of vanishing', () => {
  const nodes = renderSection('components')
  const items = nodes.filter((node) => String(node.props.className || '') === 'ct-item')
  assert.equal(items.length, 6, 'all six list rows render before the fetch resolves')
  for (const id of ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp']) {
    const download = buttonOf(nodes, `download:${id}`)
    assert.ok(download, `download:${id} is rendered while loading`)
    assert.equal(download.props.disabled, true)
    assert.equal(textOf(download), 'loading')
    assert.ok(buttonOf(nodes, `probe:${id}`))
  }
})

test('the download-location block moves every component and resets to the default', () => {
  const moved = {
    path: 'D:/tools',
    defaultPath: 'C:/dsh/compression-tiers',
    isDefault: false,
    components: [],
    running: { gh: false, git: false, ffmpeg: false, python: false },
  }
  const unchanged = renderSection('components', { components: componentsPayload([], moved) })
  const input = unchanged.find((node) => node.type === 'input')
  assert.ok(input, 'the panel always renders the directory field')
  assert.equal(input.props.value, 'D:/tools')
  assert.equal(input.props.placeholder, 'C:/dsh/compression-tiers')
  assert.equal(buttonByText(unchanged, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(unchanged, 'toolsPathReset')[0].props.disabled, false)

  const changed = renderSection('components', { components: componentsPayload([], moved), pathDraft: 'D:/other-tools' })
  assert.equal(buttonByText(changed, 'toolsPathSave')[0].props.disabled, false)
  assert.equal(changed.find((node) => node.type === 'input').props.value, 'D:/other-tools')

  const relative = renderSection('components', { components: componentsPayload([], moved), pathDraft: 'tools' })
  const save = buttonByText(relative, 'toolsPathSave')[0]
  assert.equal(save.props.disabled, true)
  assert.equal(save.props.title, 'toolsPathInvalid')
})

test('a running download blocks the location buttons and says why', () => {
  const running = {
    path: 'D:/tools',
    defaultPath: 'C:/dsh/compression-tiers',
    isDefault: false,
    components: [],
    running: { gh: false, git: true, ffmpeg: false, python: false },
  }
  const nodes = renderSection('components', { components: componentsPayload([], running) })
  assert.equal(buttonByText(nodes, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(nodes, 'toolsPathReset')[0].props.disabled, true)
  assert.ok(deepText({ props: { children: nodes } }).includes('toolsPathRunning'))
})

test('the location block waits for its status instead of showing a wrong path', () => {
  const nodes = renderSection('components')
  assert.equal(buttonByText(nodes, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(nodes, 'toolsPathReset')[0].props.disabled, true)
  assert.equal(nodes.find((node) => node.type === 'input').props.value, '')
})

test('the sign-in buttons are always rendered and disabled while idle', () => {
  const nodes = renderSection('github', { login: idleLogin, auth: authState })
  for (const [key, reason] of [['ghCopy', 'ghLoginInactive'], ['ghOpenDevice', 'ghLoginInactive'], ['ghCancel', 'ghLoginInactive']]) {
    const buttons = buttonByText(nodes, key)
    assert.equal(buttons.length, 1, `${key} must always be rendered`)
    assert.equal(buttons[0].props.disabled, true)
    assert.equal(buttons[0].props.title, reason)
  }
  const code = nodes.find((node) => node.type === 'code')
  assert.ok(code, 'the code slot is always rendered')
  assert.equal(textOf(code), '—')
})

test('a running device flow enables copying the code and cancelling', () => {
  const active = {
    active: true,
    state: 'waiting',
    code: 'ABCD-1234',
    url: 'https://github.com/login/device',
    note: 'copy the one-time code',
    error: null,
    startedAt: 1,
  }
  const nodes = renderSection('github', { login: active, auth: authState })
  assert.equal(textOf(nodes.find((node) => node.type === 'code')), 'ABCD-1234')
  for (const key of ['ghCopy', 'ghOpenDevice', 'ghCancel']) {
    const buttons = buttonByText(nodes, key)
    assert.equal(buttons.length, 1)
    assert.equal(buttons[0].props.disabled, false, `${key} is usable during the flow`)
  }
})

test('the sign-in page shows the account and never a download button', () => {
  const auth = { available: true, authenticated: true, account: 'Homer4033', path: 'C:/dsh/compression-tiers/gh/bin/gh.exe', version: '2.76.2' }
  const nodes = renderSection('github', { login: idleLogin, auth })
  const texts = nodes
    .filter((node) => typeof node.type === 'string')
    .flatMap((node) => (Array.isArray(node.props.children) ? node.props.children : []))
    .filter((child) => typeof child === 'string')
  assert.ok(texts.some((text) => text.includes('Homer4033')))
  // Version and path belong to the binary's row on the components page: the
  // sign-in page only reports the account and the flow.
  assert.ok(deepText({ props: { children: nodes } }).includes('ghLoggedIn'))
  // The binaries live on the components page: the sign-in page owns none of
  // those buttons.
  const downloads = nodes.filter((node) => node.type === 'button' && String(node.props['data-action'] || '').startsWith('download:'))
  assert.deepEqual(downloads, [], 'the sign-in page renders no component buttons')
})

test('the GitHub page lists the token scopes and hides the row while signed out', () => {
  const scoped = {
    available: true,
    authenticated: true,
    account: 'Homer4033',
    scopes: ['repo', 'read:org', 'workflow'],
    missingRepoScope: false,
  }
  const nodes = renderSection('github', { login: idleLogin, auth: scoped })
  const rows = nodes.filter((node) => String(node.props.className || '').includes('ct-scopes'))
  assert.equal(rows.length, 1, 'one scope row')
  // The scope names come from `gh auth status`; the panel shows them verbatim.
  const scopeText = textOf(rows[0])
  assert.match(scopeText, /^ghScopesLabel/)
  assert.ok(scopeText.includes('repo · read:org · workflow'), 'every scope is listed')

  // An older gh that reports no scopes still gets the line, with a marker.
  const silent = renderSection('github', {
    login: idleLogin,
    auth: { available: true, authenticated: true, account: 'Homer4033', scopes: [], missingRepoScope: false },
  })
  assert.ok(textOf(silent.filter((node) => String(node.props.className || '').includes('ct-scopes'))[0]).includes('ghScopesNone'))

  // Signed out, or without a gh binary, there is no scope row at all.
  for (const auth of [
    { available: true, authenticated: false, account: null, scopes: [], missingRepoScope: false },
    { available: false, authenticated: false, account: null, scopes: [], missingRepoScope: false },
  ]) {
    const bare = renderSection('github', { login: idleLogin, auth })
    assert.equal(bare.filter((node) => String(node.props.className || '').includes('ct-scopes')).length, 0)
  }
})

test('the composer dock renders a repository pill that opens a listbox', () => {
  const repos = [
    { nameWithOwner: 'Homer4033/dsh-compression-tiers', private: false },
    { nameWithOwner: 'Homer4033/private-notes', private: true },
  ]
  const nodes = renderDock([repos, 'Homer4033/dsh-compression-tiers', '', false, true, 1], {
    sessionId: 'session-a',
    t: (key) => key,
  }, [null, null, { up: true, left: 120, width: 320, bottom: 500, maxHeight: 280 }, true])
  const dock = nodes.find((node) => hasClass(node, 'ct-repo-dock'))
  assert.ok(dock, 'the dock row renders in place')
  const pill = nodes.find((node) => String(node.props.className || '') === 'ct-repo-pill')
  assert.ok(pill, 'the dock renders a pill button')
  assert.equal(pill.type, 'button')
  assert.equal(pill.props['aria-haspopup'], 'listbox')
  assert.equal(pill.props['aria-expanded'], 'true')
  assert.equal(pill.props['data-bound'], 'true')
  assert.equal(pill.props.disabled, false)
  assert.equal(
    textOf(nodes.find((node) => String(node.props.className || '') === 'ct-repo-value')),
    'Homer4033/dsh-compression-tiers',
  )
  const menu = nodes.find((node) => hasClass(node, 'ct-menu'))
  assert.ok(menu, 'the open pill renders its listbox')
  assert.equal(menu.props.role, 'listbox')
  // Upward placement: bottom edge anchored above the pill, not a `top` drop.
  assert.equal(menu.props.style.bottom, '500px')
  assert.equal(menu.props.style.top, undefined)
  assert.equal(menu.props.style.left, '120px')
  assert.equal(menu.props.style.width, '320px')
  assert.equal(menu.props.style.maxHeight, '280px')
  assert.equal(menu.props['data-side'], 'up')
  assert.equal(menu.props.tabIndex, -1)
  assert.equal(typeof menu.props.onKeyDown, 'function')
  assert.equal(menu.props['aria-activedescendant'], 'ct-repo-option-1')
  const options = nodes.filter((node) => String(node.props.className || '').split(' ').includes('ct-menu-option'))
  assert.deepEqual(options.map((option) => option.props['aria-selected']), ['false', 'true', 'false'])
  assert.deepEqual(options.map((option) => option.props.id), ['ct-repo-option-0', 'ct-repo-option-1', 'ct-repo-option-2'])
  assert.match(String(options[1].props.className), /ct-menu-option-active/)
  assert.doesNotMatch(String(options[0].props.className), /ct-menu-option-active/)
  assert.deepEqual(options.map((option) => deepText(option)), [
    'repoNone',
    '✓Homer4033/dsh-compression-tiers',
    'Homer4033/private-notesrepoPrivate',
  ])
})

test('the listbox drops downward only when the room above is gone', () => {
  const nodes = renderDock([[], '', '', false, true, 0], { sessionId: 'session-down', t: (key) => key },
    [null, null, { up: false, top: 300, left: 8, width: 288, maxHeight: 200 }, true])
  const menu = nodes.find((node) => hasClass(node, 'ct-menu'))
  assert.equal(menu.props['data-side'], 'down')
  assert.equal(menu.props.style.top, '300px')
  assert.equal(menu.props.style.bottom, undefined)
})

test('the repository listbox is titled and separates "no repository"', () => {
  const repos = [{ nameWithOwner: 'Homer4033/one', private: false }]
  const nodes = renderDock([repos, '', '', false, true, null], { sessionId: 'session-menu', t: (key) => key })
  const head = nodes.find((node) => String(node.props.className || '') === 'ct-menu-head')
  assert.ok(head, 'the listbox renders a title line')
  assert.equal(head.props.role, 'presentation')
  assert.equal(textOf(head), 'repoSelectLabel')
  const order = nodes
    .filter((node) => ['ct-menu-head', 'ct-menu-sep', 'ct-menu-option'].includes(String(node.props.className || '').split(' ')[0]))
    .map((node) => String(node.props.className || '').split(' ')[0])
  assert.deepEqual(order, ['ct-menu-head', 'ct-menu-option', 'ct-menu-sep', 'ct-menu-option'])
})

test('a retired binding stays selectable; a closed pill renders no listbox', () => {
  const retired = renderDock([[], 'Homer4033/retired', '', false, true, null], { sessionId: 'session-b', t: (key) => key })
  const options = retired.filter((node) => String(node.props.className || '').split(' ').includes('ct-menu-option'))
  assert.deepEqual(options.map((option) => deepText(option)), ['repoNone', '✓Homer4033/retired'])
  const closed = renderDock([[], '', '', false, false, null], { sessionId: 'session-b', t: (key) => key })
  assert.equal(closed.some((node) => hasClass(node, 'ct-menu')), false)
  const disabled = renderDock([[], '', '', false], { t: (key) => key })
  assert.equal(disabled.find((node) => String(node.props.className || '') === 'ct-repo-pill').props.disabled, true)
})

test('the dock explains an unreadable repository list', () => {
  const nodes = renderDock([[], '', 'repoUnavailable', false], { sessionId: 'session-c', t: (key) => key })
  const note = nodes.find((node) => String(node.props.className || '') === 'ct-repo-note')
  assert.ok(note, 'the dock renders a status note')
  assert.equal(note.props.role, 'status')
  assert.equal(textOf(note), 'repoUnavailable')
})

test('the repository pill shows the bound name and opens a listbox', () => {
  const nodes = renderDock([[], 'Homer4033/x', '', false], { sessionId: 'session-pill', t: (key) => key })
  const pill = nodes.find((node) => String(node.props.className || '') === 'ct-repo-pill')
  assert.ok(pill, 'the dock renders a pill')
  assert.equal(pill.props['data-bound'], 'true')
  const value = nodes.find((node) => String(node.props.className || '') === 'ct-repo-value')
  assert.equal(textOf(value), 'Homer4033/x')
  const caption = nodes.find((node) => String(node.props.className || '') === 'ct-repo-caption')
  assert.equal(textOf(caption), 'repoSelectLabel')
  assert.equal(pill.props['aria-haspopup'], 'listbox')
})

test('an unbound session shows the unbound label inside the pill', () => {
  const nodes = renderDock([[], '', '', false], { sessionId: 'session-pill', t: (key) => key })
  const pill = nodes.find((node) => String(node.props.className || '') === 'ct-repo-pill')
  assert.equal(pill.props['data-bound'], 'false')
  const value = nodes.find((node) => String(node.props.className || '') === 'ct-repo-value')
  assert.equal(textOf(value), 'repoUnbound')
})

function workspaceRulesPayload(list) {
  return { ok: true, maxChars: 100000, workspaces: list }
}

const workspaceOne = {
  id: 'w1',
  title: '压缩上下文',
  path: 'D:/DSH插件/压缩上下文',
  file: 'D:/DSH插件/压缩上下文/AGENTS.md',
  exists: true,
  text: 'Keep it short.\n',
  chars: 15,
}

test('the rules page carries both the global editor and one registered workspace', () => {
  const second = {
    id: 'w2',
    title: '红利量化',
    path: 'D:/DSH插件/红利量化',
    file: 'D:/DSH插件/红利量化/AGENTS.md',
    exists: false,
    text: '',
    chars: 0,
  }
  const nodes = renderSection('rules', {
    workspaceRules: workspaceRulesPayload([workspaceOne, second]),
    workspaceId: 'w1',
    workspaceText: 'Keep it short.\n',
  })
  const headings = nodes.filter((node) => node.type === 'h3').map((node) => textOf(node))
  assert.deepEqual(headings, ['rulesTitle', 'workspaceRulesTitle'])
  const picker = pickerOf(nodes)
  assert.ok(picker, 'the block has a workspace picker')
  assert.equal(picker.props.value, 'w1')
  assert.equal(typeof picker.props.onChange, 'function')
  assert.deepEqual(picker.props.items.map((item) => item.value), ['w1', 'w2'])
  assert.deepEqual(picker.props.items.map((item) => item.label), ['压缩上下文', '红利量化'])
  // The native select is gone: its OS-painted popup cannot be themed.
  assert.equal(nodes.some((node) => node.type === 'select'), false, 'no native select')
  // Two editors on this page: the global rules file and the supplement that is
  // injected at the top of the selected workspace's AGENTS.md.
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas.length, 2)
  assert.equal(textareas[1].props.value, 'Keep it short.\n')
  assert.equal(textareas[1].props.disabled, false)
  assert.equal(textareas[1].props.placeholder, 'workspaceRulesPlaceholder')
  assert.match(deepText({ props: { children: nodes } }), /workspaceRulesLabel/)
  const save = buttonOf(nodes, 'workspaceRulesSave')
  assert.ok(save, 'the block has one save button')
  assert.equal(save.props.disabled, true, 'an unchanged draft cannot be saved')
  const mentionsFile = nodes.some((node) => Array.isArray(node.props.children)
    && node.props.children.some((child) => typeof child === 'string' && child.includes(workspaceOne.file)))
  assert.ok(mentionsFile, 'the block shows the rules file it edits')
})

test('the workspace editor never echoes an AGENTS.md the panel did not write', () => {
  const foreign = {
    id: 'w3',
    title: '外部规则',
    path: 'D:/DSH插件/外部规则',
    file: 'D:/DSH插件/外部规则/AGENTS.md',
    // The file exists and carries its own contract, but no fenced supplement.
    exists: true,
    text: '',
    chars: 0,
  }
  const nodes = renderSection('rules', {
    workspaceRules: workspaceRulesPayload([foreign]),
    workspaceId: 'w3',
    workspaceText: '',
  })
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas[1].props.value, '', 'the existing file body is not loaded into the editor')
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.disabled, true)
  // The file exists, so the "saving creates it" note stays away.
  assert.equal(deepText({ props: { children: nodes } }).includes('workspaceRulesMissing'), false)
})

test('a workspace with no rules file says so, and editing enables saving', () => {
  const second = {
    id: 'w2',
    title: '红利量化',
    path: 'D:/DSH插件/红利量化',
    file: 'D:/DSH插件/红利量化/AGENTS.md',
    exists: false,
    text: '',
    chars: 0,
  }
  const nodes = renderSection('rules', {
    workspaceRules: workspaceRulesPayload([second]),
    workspaceId: 'w2',
    workspaceText: 'Only touch src/.\n',
  })
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.disabled, false)
  assert.ok(deepText({ props: { children: nodes } }).includes('workspaceRulesMissing'))
})

test('the workspace block stays on the rules page and says there is no workspace yet', () => {
  const nodes = renderSection('rules', { workspaceRules: workspaceRulesPayload([]) })
  const items = nodes.filter((node) => String(node.props.className || '') === 'ct-nav-item')
  // Four pages, always: an empty registry is a state, not a missing page.
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'memory', 'rules', 'components', 'github'])
  const content = nodes.find((node) => String(node.props.className || '') === 'ct-content')
  assert.match(deepText(content), /workspaceRulesTitle/)
  assert.match(deepText(content), /workspaceNone/)
  // Nothing to pick, and no workspace editor: the global one is still there.
  assert.equal(pickerOf(nodes), null, 'no picker without a registry')
  const pickers = nodes.filter((node) => node.type === 'textarea'
    && node.props.placeholder === 'workspaceRulesPlaceholder')
  assert.equal(pickers.length, 0)
  const save = buttonOf(nodes, 'workspaceRulesSave')
  assert.ok(save, 'the save button stays rendered')
  assert.equal(save.props.disabled, true)
  assert.equal(save.props.title, 'workspaceNone')
})

test('a workspace block that has not loaded says it is loading, not that the registry is empty', () => {
  const nodes = renderSection('rules', { workspaceRules: null })
  const content = nodes.find((node) => String(node.props.className || '') === 'ct-content')
  assert.match(deepText(content), /rulesTitle|workspaceRulesTitle/)
  assert.ok(deepText({ props: { children: nodes } }).includes('loading'))
  assert.equal(deepText({ props: { children: nodes } }).includes('workspaceNone'), false)
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.disabled, true)
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.title, 'loading')
})

test('the panel is a shell: one navigation rail and one page at a time', () => {
  const nodes = renderSection('components', { components: componentsPayload([]) })
  const nav = nodes.find((node) => String(node.props.className || '') === 'ct-nav')
  assert.ok(nav, 'the panel renders a navigation rail')
  assert.equal(nav.type, 'nav')
  assert.equal(nav.props['aria-label'], 'navAria')
  const items = nodes.filter((node) => String(node.props.className || '') === 'ct-nav-item')
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'memory', 'rules', 'components', 'github'])
  assert.deepEqual(items.map((node) => deepText(node)), ['navLevels', 'navMemory', 'navRules', 'navComponents', 'navGithub'])
  const current = items.filter((node) => node.props['aria-current'] === 'page')
  assert.equal(current.length, 1, 'exactly one page is current')
  assert.equal(current[0].props['data-section'], 'components')
  // Every rail row carries its icon.
  for (const item of items) {
    const children = Array.isArray(item.props.children) ? item.props.children : []
    assert.ok(children.some((child) => child && child.type === 'svg'), 'rail rows have icons')
  }
  const content = nodes.find((node) => String(node.props.className || '') === 'ct-content')
  assert.ok(content)
  assert.match(deepText(content), /componentsTitle/)
  assert.doesNotMatch(deepText(content), /rulesTitle|ghAuthTitle|levelsTitle|appearanceTitle/)
  // Switching pages re-keys the content box so the entry animation replays.
  assert.equal(content.props.key, 'components')
})

test('the workspace picker is a self-drawn listbox, not a native select', () => {
  const second = {
    id: 'w2',
    title: '红利量化',
    path: 'D:/DSH插件/红利量化',
    file: 'D:/DSH插件/红利量化/AGENTS.md',
    exists: false,
    text: '',
    chars: 0,
  }
  const overrides = {
    section: 'rules',
    workspaceRules: workspaceRulesPayload([workspaceOne, second]),
    workspaceId: 'w1',
    workspaceText: 'Keep it short.\n',
  }
  const nodes = renderPicker(overrides, [true, 1], [null, null, null, null, { up: false, top: 640, left: 24, width: 300, maxHeight: 260 }])
  const trigger = nodes.find((node) => String(node.props.className || '') === 'ct-select')
  assert.ok(trigger, 'the picker renders a trigger button')
  assert.equal(trigger.type, 'button')
  assert.equal(trigger.props['aria-haspopup'], 'listbox')
  assert.equal(trigger.props['aria-expanded'], 'true')
  assert.equal(trigger.props.disabled, false)
  assert.equal(trigger.props['aria-label'], 'workspaceSelectLabel')
  assert.equal(
    textOf(nodes.find((node) => String(node.props.className || '') === 'ct-select-value')),
    '压缩上下文',
  )
  const menu = nodes.find((node) => hasClass(node, 'ct-menu'))
  assert.ok(menu, 'the open picker portals its listbox')
  assert.equal(menu.props.role, 'listbox')
  assert.equal(menu.props['data-side'], 'down')
  assert.equal(menu.props.style.top, '640px')
  assert.equal(menu.props.style.left, '24px')
  assert.equal(menu.props.style.width, '300px')
  assert.equal(menu.props.style.maxHeight, '260px')
  assert.equal(menu.props.style.bottom, undefined)
  assert.equal(menu.props['aria-activedescendant'], 'ct-select-option-1')
  const head = nodes.find((node) => String(node.props.className || '') === 'ct-menu-head')
  assert.equal(textOf(head), 'workspaceSelectLabel')
  const options = nodes.filter((node) => String(node.props.className || '').split(' ').includes('ct-menu-option'))
  assert.deepEqual(options.map((option) => option.props.id), ['ct-select-option-0', 'ct-select-option-1'])
  assert.deepEqual(options.map((option) => option.props['aria-selected']), ['true', 'false'])
  assert.deepEqual(options.map((option) => deepText(option)), ['✓压缩上下文', '红利量化'])
  assert.doesNotMatch(String(options[0].props.className), /ct-menu-option-active/)
  assert.match(String(options[1].props.className), /ct-menu-option-active/)
  // Closed and busy: no listbox, and the trigger explains why it cannot open.
  const closed = renderPicker({ ...overrides, workspaceBusy: true }, [false, 0])
  assert.equal(closed.some((node) => hasClass(node, 'ct-menu')), false)
  const idle = closed.find((node) => String(node.props.className || '') === 'ct-select')
  assert.equal(idle.props['aria-expanded'], 'false')
  assert.equal(idle.props.disabled, true)
})

test('each page renders only its own cards', () => {
  const cases = [
    ['levels', {}, ['levelsTitle']],
    ['rules', {}, ['rulesTitle', 'workspaceRulesTitle']],
    ['components', { components: componentsPayload([]) }, ['componentsTitle']],
    ['github', {}, ['ghAuthTitle']],
  ]
  for (const [section, overrides, headings] of cases) {
    const nodes = renderSection(section, overrides)
    assert.deepEqual(nodes.filter((node) => node.type === 'h3').map((node) => textOf(node)), headings, section + ' page')
    assert.equal(nodes.some((node) => node.type === 'select'), false, 'no native select on ' + section)
    const items = nodes.filter((node) => String(node.props.className || '') === 'ct-nav-item')
    assert.equal(items.filter((node) => node.props['aria-current'] === 'page').length, 1, section + ' keeps one current row')
    assert.equal(items.find((node) => node.props['aria-current'] === 'page').props['data-section'], section)
  }
  // One input (the download directory), on the components page only.
  assert.equal(renderSection('components', { components: componentsPayload([]) })
    .filter((node) => node.type === 'input').length, 1)
  assert.equal(renderSection('rules').filter((node) => node.type === 'input').length, 0)
})

test('the local model row keeps its buttons and reports bytes, progress and state', () => {
  const model = {
    id: 'flux2-klein-4b',
    name: 'FLUX.2 [klein] 4B',
    detail: '4-step distilled · guidance 1.0 · Apache-2.0',
    state: 'missing',
    installed: false,
    running: false,
    dir: 'C:/dsh/compression-tiers/models/flux2-klein-4b',
    bytes: 0,
    total: 15980131745,
    percent: 0,
    files: 0,
    fileCount: 18,
    error: null,
  }
  const payload = { ok: true, path: 'C:/dsh/compression-tiers/models', models: [model], running: false }
  const nodes = renderSection('components', { models: payload })
  const row = nodes.find((node) => node.props['data-model'] === 'flux2-klein-4b')
  assert.ok(row, 'the model row renders under the component rows')
  const text = deepText(row)
  assert.match(text, /FLUX\.2 \[klein\] 4B/)
  assert.match(text, /15\.98 GB/)
  assert.match(text, /4-step distilled/)
  // Missing is downloadable; the probe button is always there.
  assert.equal(buttonOf(nodes, 'model:flux2-klein-4b').props.disabled, false)
  assert.ok(buttonOf(nodes, 'modelProbe:flux2-klein-4b'))
  // Installed rows keep the disabled download button instead of dropping it.
  const installed = renderSection('components', {
    models: { ...payload, models: [{ ...model, state: 'installed', installed: true, percent: 100 }] },
  })
  assert.equal(buttonOf(installed, 'model:flux2-klein-4b').props.disabled, true)
  // No payload yet: the row still renders, disabled, with the loading state.
  const loading = buttonOf(renderSection('components', {}), 'model:flux2-klein-4b')
  assert.ok(loading, 'the row waits for its status instead of vanishing')
  assert.equal(loading.props.disabled, true)
  // A running download shows the bar and the file being fetched.
  const running = renderSection('components', {
    models: { ...payload, running: true, models: [{ ...model, running: true, state: 'partial', percent: 42, file: 'transformer/diffusion_pytorch_model.safetensors' }] },
  })
  const runningRow = running.find((node) => node.props['data-model'] === 'flux2-klein-4b')
  assert.equal(String(runningRow.props.className), 'ct-item ct-model')
  assert.match(deepText(runningRow), /modelsFetching/)
  assert.ok(running.some((node) => String(node.props.className) === 'ct-progress'))
})

test('the components page is titled 模型和组件 in both languages', () => {
  assert.match(source, /navComponents: '模型和组件'/)
  assert.match(source, /componentsTitle: '模型和组件'/)
  assert.match(source, /navComponents: 'Models & components'/)
  assert.match(source, /componentsTitle: 'Models & components'/)
})

test('the appearance page is gone: no rail entry and no palette controls', () => {
  // An old bookmark to the page falls back to the first page instead of a blank.
  const nodes = renderSection('appearance')
  const items = nodes.filter((node) => hasClass(node, 'ct-nav-item'))
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'memory', 'rules', 'components', 'github'])
  assert.equal(nodes.some((node) => node.props.role === 'radio' && hasClass(node, 'ct-swatch')), false)
  assert.equal(nodes.some((node) => node.props.role === 'radio' && hasClass(node, 'ct-segment')), false)
  assert.equal(buttonOf(nodes, 'appearanceArt'), null, 'the art switch went with the page')
  const text = deepText({ props: { children: nodes } })
  for (const banned of ['appearanceTitle', 'paletteLabel', 'paletteHost', 'paletteObsidian', 'paletteCrystal', 'motionLabel', 'artLabel']) {
    assert.equal(text.includes(banned), false, banned + ' must not return')
  }
})

test('the body carries one auto skin and the art layer is always on', () => {
  const { module, styles, sandbox } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const skin = plugin.__test
  const attrs = {}
  sandbox.document.body = {
    setAttribute(name, value) { attrs[name] = String(value) },
  }

  const applied = skin.applyOptics()
  assert.equal(JSON.stringify(applied), '{"palette":"auto","art":true}')
  assert.equal(attrs['data-ct-palette'], 'auto')
  assert.equal(attrs['data-ct-art'], 'on')
  assert.equal(attrs['data-ct-motion'], 'full')

  // There is no switch any more: a second call keeps exactly those markers.
  skin.applyOptics()
  assert.deepEqual(attrs, {
    'data-ct-palette': 'auto',
    'data-ct-art': 'on',
    'data-ct-motion': 'full',
  })

  // The stylesheet only reacts to those markers, and it addresses host surfaces
  // through DSH's own semantic attributes rather than hashed class names.
  const css = String(styles[0].textContent)
  assert.match(css, /body\[data-ct-art='on'\] \[data-conversation-region='chat'\] \{/)
  assert.match(css, /body\[data-ct-art='on'\] \[data-conversation-region='chat'\] \[data-message-bubble\] \{/)
  assert.match(css, /body\[data-ct-art='on'\]\[data-ds-dark-theme\] \[data-message-bubble\] \{/)
  assert.match(css, /body\[data-ct-art='on'\] \[data-conversation-region='chat'\] hr \{/)
  assert.match(css, /body\[data-ct-art='on'\] \[data-conversation-scroll\]::-webkit-scrollbar \{/)
  assert.match(css, /body\[data-ct-art='on'\]\[data-ds-dark-theme\] \[data-composer-card\] \{/)
  // Never a hashed-class hook: every art rule is attribute-scoped.
  assert.doesNotMatch(css, /\[data-ct-art='on'\] \.[a-z]+_[A-Za-z0-9]{4,}/)
})

test('the art backdrop is one static linear gradient instead of a repainted canvas', () => {
  const { module, styles } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const css = String(styles[0].textContent)
  assert.match(css, /body\[data-ct-art='on'\] \[data-conversation-region='chat'\] \{\n  background-image:\n    linear-gradient\(to top,/)
  assert.match(css, /background-repeat: no-repeat/)
  // The composer belongs to the host: the card keeps the host fill, and the seat
  // keeps the opaque fade band that clips the transcript. 2.4.2 made both
  // translucent so the old glow reached the window edge, which also let
  // transcript text show through the card.
  assert.equal(/\[data-composer-seat\]/.test(css), false, 'the seat is addressed by its region, not by the seat attribute')
  const cardRules = css.match(/[^}]*\[data-composer-card\][^{]*\{[^}]*\}/g) || []
  assert.ok(cardRules.length > 0, 'the card still gets the art sheen')
  for (const rule of cardRules) {
    assert.equal(/background-color/.test(rule), false, 'the card keeps the host fill')
    assert.equal(/!important/.test(rule), false, 'the composer needs no override')
  }
  // The seat's own sticky background is the host mask band that clips the
  // gradient at the top of the composer. The same gradient is repeated above it
  // on a ::before layer, sized to the chat region and faded in over exactly the
  // mask's 36px; 2.4.9 replaced the seat's whole background-image with stops
  // based on the seat's own height, which bent the glow at that boundary.
  const seatRule = css.match(
    /body\[data-ct-art='on'\] \[data-conversation-region='chat'\]\[data-content-phase='active'\] \[data-conversation-region='composer'\]::before \{[^}]*\}/,
  )
  assert.ok(seatRule, 'the seat repeats the glow above its mask band')
  assert.match(seatRule[0], /position: absolute/)
  assert.match(seatRule[0], /z-index: -1/)
  // Same stops as the region's own gradient, but the background image is sized
  // to the region so the percentages land on the same pixel line.
  assert.match(seatRule[0], /color-mix\(in srgb, var\(--dsw-alias-state-business-primary\) 16%, transparent\) 0%/)
  assert.match(seatRule[0], /color-mix\(in srgb, var\(--dsw-alias-chart-tools\) 9%, transparent\) 26%/)
  assert.match(seatRule[0], /transparent 54%\)/)
  assert.match(seatRule[0], /background-size: 100% var\(--ct-glow-height, 100%\)/)
  assert.match(seatRule[0], /mask-image: linear-gradient\(180deg, transparent 0px, #000 36px\)/)
  assert.equal(/background-color/.test(seatRule[0]), false, 'only image, position and mask change')
  assert.equal(/!important/.test(seatRule[0]), false, 'higher specificity is enough')
  // The host's mask is never replaced: no plain composer rule touches its
  // background any more (that copy is what left the seam).
  assert.equal(/\[data-conversation-region='composer'\] \{[^}]*background-image/.test(css), false)
  // The host's own context meter is hidden while the art layer is on, because
  // the vial carries the same reading; 光学外观 off brings it back.
  assert.match(
    css,
    /body\[data-ct-art='on'\] \[data-composer-dock\] button\[aria-haspopup='dialog'\] \{\n  display: none !important;\n\}/,
  )
  // The horizon renderer is gone: no canvas host, no fallback blobs, no keyframes,
  // and no controller left exposed for anyone to restart.
  assert.equal(/ct-aura/.test(css), false, 'the aura layer is gone')
  assert.equal(plugin.__test.aura, undefined, 'no aura controller is exposed')
})

test('the seat copy of the glow is measured against the chat region', () => {
  const { module, sandbox } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const vars = {}
  const seat = { style: { setProperty: (k, v) => { vars[k] = String(v) }, removeProperty: (k) => { delete vars[k] } } }
  const chat = { clientHeight: 1234, querySelector: () => seat }
  sandbox.document.querySelector = (selector) => (selector === "[data-conversation-region='chat']" ? chat : null)
  plugin.__test.glow.watch()
  assert.equal(vars['--ct-glow-height'], '1234px')
  // A resize re-measures; an unavailable height drops the variable so the
  // stylesheet falls back to the seat's own box.
  chat.clientHeight = 900
  plugin.__test.glow.measure()
  assert.equal(vars['--ct-glow-height'], '900px')
  chat.clientHeight = 0
  plugin.__test.glow.measure()
  assert.equal(vars['--ct-glow-height'], undefined)
})

test('the composer stats line moves into the vial', () => {
  const { module, styles } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const css = String(styles[0].textContent)
  // Host-owned pills under the composer are hidden, and only while the art layer
  // is on (turning it off restores them).
  assert.match(css, /body\[data-ct-art='on'\] \[data-composer-stat\] \{\n  display: none/)
  assert.match(css, /\.ct-vial-usage \{/)
  // The readings come from the same projections the official pills read.
  const usage = plugin.__test.vialUsage
  assert.ok(usage, 'the reading helper is testable')
  const view = usage(
    { uncachedInputTokens: 1000, cacheReadTokens: 9000, cacheWriteTokens: 0, outputTokens: 2000 },
    { turns: 4, steps: 12, decodeMs: 4000, decodeTokens: 800 },
  )
  assert.equal(view.total, 12000)
  assert.equal(view.cacheHit, 90)
  assert.equal(view.speed, 200)
  assert.equal(view.turns, 4)
  // Missing projections degrade to nulls, never to zeros that read as "no usage".
  assert.equal(JSON.stringify(usage(null, null)), JSON.stringify({ total: null, cacheHit: null, speed: null, turns: null, steps: null }))
})

test('a four-page rail keeps every page in the navigation', () => {
  const nodes = renderSection('components')
  const items = nodes.filter((node) => hasClass(node, 'ct-nav-item'))
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'memory', 'rules', 'components', 'github'])
  const current = items.filter((node) => node.props['aria-current'] === 'page')
  assert.equal(current.length, 1)
  assert.equal(current[0].props['data-section'], 'components')
})

/** A grid shaped like the one our usage route returns, for the blank-Session card. */
const heatPayload = {
  ok: true,
  weeks: 26,
  range: 'all',
  firstDay: '2026-06-01',
  lastDay: '2026-11-29',
  totalTokens: 5_120_000_000,
  maxDayTokens: 1_500_000_000,
  activeDays: 24,
  sessions: 95,
  streak: 6,
  peakDay: '2026-11-20',
  models: [
    { id: 'deepseek-account/deepseek-flash', provider: 'deepseek-account', model: 'deepseek-flash', tokens: 3_400_000_000, sessions: 60, share: 0.664 },
    { id: 'deepseek-account/deepseek-pro', provider: 'deepseek-account', model: 'deepseek-pro', tokens: 1_200_000_000, sessions: 25, share: 0.234 },
    { id: 'local/qwen', provider: 'local', model: 'qwen', tokens: 520_000_000, sessions: 10, share: 0.102 },
  ],
  columns: Array.from({ length: 26 }, (unusedWeek, week) => ({
    start: '2026-06-' + String(week).padStart(2, '0'),
    days: Array.from({ length: 7 }, (unusedDay, day) => ({
      date: '2026-06-' + String(week).padStart(2, '0') + '-' + day,
      tokens: 1_000_000 * (week + 1),
      sessions: 1,
      level: day === 0 ? 0 : Math.min(5, day),
      future: week === 25 && day > 3,
      active: !(week === 25 && day > 3),
    })),
  })),
}

/** Render the heatmap element the dock mounts for a blank Session. */
function renderHeat(options) {
  const config = Object.assign({}, options || {})
  // The card costs two hooks (range, grid) and the vial is not rendered in the
  // blank branch, so those two slots hold its state instead of the vial's.
  config.vialStates = ['all', config.heat || null]
  const { dockNodes } = renderVial(config)
  const heat = dockNodes.find((node) => typeof node.type === 'function'
    && node.props && 'heat' in node.props)
  assert.ok(heat, 'the dock mounts the heatmap element')
  return collect(heat.type(heat.props))
}

function renderVial(options) {
  const config = options || {}
  const settings = config.settings || settingsState
  const pressure = config.pressure || null
  const breakdown = config.breakdown || null
  const useProjection = function (key) {
    if (key === 'contextPressure') return pressure || undefined
    if (key === 'contextBreakdown') return breakdown || undefined
    return undefined
  }
  const dockStates = [
    config.repos || [],
    config.bound || '',
    config.note || '',
    false,
    false,
    0,
    settings,
    config.heat || null,
  ]
  const vialStates = config.vialStates || [true, false]
  const react = fakeReact(dockStates.concat(vialStates), config.refs || [null, null, null, true, null, null, null, null, null, null, { up: true, left: 100, width: 392, bottom: 400, maxHeight: 360 }, null, null])
  const { module } = loadClient()
  const registrations = []
  module.factory((specifier) => (specifier === 'react-dom' ? { createPortal: (node) => node } : react)).apply(sectionContext(registrations))
  const dock = registrations.find((item) => item.options.name === 'conversation.input.dock')
  const dockNodes = collect(dock.component({
    sessionId: config.sessionId || 'session-vial',
    session: config.session,
    t: (key) => key,
    useProjection: useProjection,
  }))
  const vial = dockNodes.find((node) => typeof node.type === 'function'
    && node.props && 'meter' in node.props && 'breakdown' in node.props)
  // A blank Session with a cached board renders the portalled card instead of
  // the row, so the vial element is only there once a reading exists.
  if (pressure) assert.ok(vial, 'the dock mounts the context vial')
  return {
    nodes: vial ? collect(vial.type(vial.props)) : [],
    dockNodes,
    element: vial || null,
  }
}

test('the dock renders the vial and the repository pill in one right-aligned row', () => {
  const { dockNodes, element } = renderVial({ vialStates: [false, false] })
  const dock = dockNodes.find((node) => hasClass(node, 'ct-repo-dock'))
  assert.ok(dock, 'the dock row renders')
  assert.match(String(dock.props.className), /ct-skin/)
  assert.equal(dock.props['data-palette'], 'auto')
  assert.equal(dock.props['data-motion'], 'full')
  // 2.5.0 removed the companions: nothing is mounted to their left any more.
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-dock-mascots')), false)
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-mascot-stage')), false)
  const tools = dockNodes.find((node) => hasClass(node, 'ct-dock-tools'))
  assert.ok(tools, 'the tools row stays')
  // The vial is a real dialog trigger, not decoration.
  assert.ok(element, 'the dock passes a meter to the vial')
  assert.ok(dockNodes.some((node) => hasClass(node, 'ct-repo-pill')), 'the repository pill is still there')
})

test('a pre-2.5 settings payload still carrying the companions flag renders the dock', () => {
  // The field is gone from the schema, but an old settings.json may name it; it
  // must be ignored, not fail the read or resurrect the stage.
  const legacy = { ...settingsState, appearance: { palette: 'crystal', motion: 'subtle', mascots: false } }
  const { dockNodes } = renderVial({ settings: legacy, vialStates: [false, false] })
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-dock-mascots')), false)
  const dock = dockNodes.find((node) => hasClass(node, 'ct-repo-dock'))
  // A 2.8.1 payload may still carry the old appearance object; the dock follows
  // the one auto skin regardless.
  assert.equal(dock.props['data-palette'], 'auto')
  assert.equal(dock.props['data-motion'], 'full')
  assert.ok(dockNodes.some((node) => hasClass(node, 'ct-repo-pill')))
})

test('the vial trigger reads the live pressure and opens a dialog', () => {
  const pressure = { projectedTokens: 260000, contextWindow: 512000 }
  const breakdown = { systemTokens: 40000, toolsTokens: 60000, messageTokens: 160000 }
  const closed = renderVial({ pressure, breakdown, vialStates: [false, false] }).nodes
  const trigger = closed.find((node) => hasClass(node, 'ct-vial'))
  assert.ok(trigger, 'the closed vial renders its trigger')
  assert.equal(trigger.props['aria-haspopup'], 'dialog')
  assert.equal(trigger.props['aria-expanded'], 'false')
  assert.equal(deepText(trigger), '51%')
  assert.equal(trigger.props['data-critical'], 'false')
  const open = renderVial({ pressure, breakdown, vialStates: [true, false] }).nodes
  const dialog = open.find((node) => hasClass(node, 'ct-vial-popover'))
  assert.ok(dialog, 'the open vial renders a dialog')
  assert.equal(dialog.props.role, 'dialog')
  assert.equal(dialog.props['data-side'], 'up')
  assert.equal(dialog.props.style.bottom, '400px')
  assert.equal(dialog.props.style.width, '392px')
  const canvas = open.find((node) => node.type === 'canvas')
  assert.ok(canvas, 'the dialog mounts the physical vial canvas')
  assert.equal(canvas.props.className, 'ct-vial-canvas')
  const text = deepText({ props: { children: open } })
  assert.ok(text.includes('260K / 512K'), 'the dialog shows used and window')
  assert.ok(text.includes('vialThreshold'), 'the dialog names the compaction threshold')
  assert.ok(text.includes('vialRetain'), 'the dialog names the verbatim retain budget')
  assert.equal(open.filter((node) => hasClass(node, 'ct-vial-row')).length, 5)
  assert.equal(open.filter((node) => hasClass(node, 'ct-vial-legend-row')).length, 3)
})

test('a brand new Session renders no vial — the host paints no meter there either', () => {
  // 2.6.6: before the first turn the official `contextPressure` projection has
  // no value and the host paints no context meter of its own. A disabled "—"
  // capsule would then be the only token UI in a blank Session, so the vial is
  // not rendered at all; the dock row and the repository pill stay.
  const { nodes, dockNodes } = renderVial({ vialStates: [true, false] })
  assert.ok(dockNodes.some((node) => hasClass(node, 'ct-repo-pill')), 'the repository pill stays')
  assert.equal(nodes.some((node) => hasClass(node, 'ct-vial')), false)
  assert.equal(nodes.some((node) => hasClass(node, 'ct-vial-popover')), false)
})

test('the vial appears as soon as the official projection has a reading', () => {
  const pressure = { projectedTokens: 260000, contextWindow: 512000 }
  const { nodes } = renderVial({ pressure, vialStates: [false, false] })
  const trigger = nodes.find((node) => hasClass(node, 'ct-vial'))
  assert.ok(trigger, 'the vial renders once a reading exists')
  assert.equal('data-empty' in trigger.props, false)
  assert.equal(trigger.props.disabled, undefined)
  assert.equal(deepText(trigger), '51%')
})

test('a blank Session draws the token heatmap card above the repository pill', () => {
  const nodes = renderHeat({ heat: heatPayload })
  const card = nodes.find((node) => hasClass(node, 'ct-heat'))
  assert.ok(card, 'the card renders')
  assert.equal(card.type, 'section')
  const grid = nodes.find((node) => hasClass(node, 'ct-heat-grid'))
  assert.equal(grid.props.role, 'img')
  assert.match(grid.props['aria-label'], /heatTitle/)
  const cells = nodes.filter((node) => hasClass(node, 'ct-heat-cell'))
  assert.equal(cells.length, 182, '26 weeks by 7 days')
  assert.equal(cells.filter((node) => node.props['data-future'] === 'true').length, 3)
  assert.equal(cells.filter((node) => node.props['data-active'] === 'false').length, 3)
  assert.equal(cells.filter((node) => node.props['data-level'] === '0').length, 26)
  // The hover capsule reads the day, its tokens and how many sessions fed it.
  assert.match(cells[0].props['data-tip'], /2026-06-00-0\|1M token · 1 heatSessions/)
  // Upstream's head row: the title on the left, the 7天 / 30天 / 全部 tabs right.
  const head = nodes.find((node) => hasClass(node, 'ct-heat-head'))
  assert.ok(head, 'the head row renders')
  assert.match(deepText(head), /heatTitle/)
  const ranges = nodes.find((node) => hasClass(node, 'ct-heat-ranges'))
  assert.ok(ranges, 'the range tabs render')
  const buttons = nodes.filter((node) => hasClass(node, 'ct-heat-range'))
  assert.deepEqual(buttons.map((node) => node.props['data-range']), ['7d', '30d', 'all'])
  assert.deepEqual(buttons.map((node) => node.props['data-active']), ['false', 'false', 'true'])
  assert.equal(buttons[2].props['aria-pressed'], 'true')
  assert.equal(typeof buttons[0].props.onClick, 'function')
  // The glass capsule lives inside the wrap, not in the DOM flow.
  const wrap = nodes.find((node) => hasClass(node, 'ct-heat-wrap'))
  assert.ok(wrap, 'the grid wrap renders')
  const tip = nodes.find((node) => hasClass(node, 'ct-heat-tip'))
  assert.ok(tip, 'the hover capsule renders')
  assert.equal(tip.props['data-show'], undefined)
  // Foot: hero number, then the small print (upstream's scale zone).
  const hero = nodes.find((node) => hasClass(node, 'ct-heat-hero'))
  assert.ok(hero, 'the headline number renders')
  assert.match(deepText(hero), /heatLead/)
  assert.match(deepText(hero), /5\.12B/)
  assert.match(deepText(hero), /heatTokens/)
  assert.match(deepText(hero), /heatHeroNote/)
  const sub = nodes.find((node) => hasClass(node, 'ct-heat-sub'))
  assert.match(deepText(sub), /heatSessions/)
  assert.match(deepText(sub), /heatDays/)
  assert.match(deepText(sub), /heatPeak/)
  // 2.7.3 copies the right half too: the pools column with one row per model.
  const chassis = nodes.find((node) => hasClass(node, 'ct-heat-chassis'))
  assert.ok(chassis, 'the two-column chassis renders')
  const right = nodes.find((node) => hasClass(node, 'ct-heat-right'))
  assert.ok(right, 'the right column renders')
  assert.match(deepText(right), /heatModels/)
  assert.match(deepText(right), /heatModelNote/)
  const rows = nodes.filter((node) => hasClass(node, 'ct-heat-pool'))
  assert.equal(rows.length, 3, 'one pool row per model')
  assert.match(deepText(rows[0]), /deepseek-flash/)
  assert.match(deepText(rows[0]), /66%/)
  const fills = nodes.filter((node) => hasClass(node, 'ct-heat-track-fill'))
  assert.equal(fills.length, 3)
  assert.equal(fills[0].props.style.width, '66%')
  assert.match(String(fills[0].props.style['--ct-heat-pool']), /chart-1/)
  const rightFoot = nodes.find((node) => hasClass(node, 'ct-heat-right-foot'))
  assert.match(deepText(rightFoot), /heatStreak/)
  assert.match(deepText(rightFoot), /heatWindow/)
  // The telemetry bar under the chassis holds the dock slot we hand in.
  const bar = nodes.find((node) => hasClass(node, 'ct-heat-bar'))
  assert.ok(bar, 'the telemetry bar renders')
  // 2.7.2 dropped the swatch legend: upstream puts the range tabs in that slot.
  assert.equal(nodes.some((node) => hasClass(node, 'ct-heat-swatch')), false)
})

test('the heat card leaves the dock row for a fixed layer over the chat area', () => {
  const { module } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const { overlay } = plugin.__test.heatmap
  assert.equal(typeof overlay, 'function')
  // Node has no document, so the component returns the layer element unwrapped
  // (in the browser it goes through ReactDOM.createPortal into document.body).
  const layer = overlay({ children: 'card' })
  assert.ok(layer, 'the layer renders')
  assert.match(layer.props.className, /ct-heat-layer/)
  assert.match(layer.props.className, /ct-skin/)
  assert.deepEqual(layer.props.children, ['card'])
})

test('the heatmap gives way to the vial once the session has a reading', () => {
  const pressure = { projectedTokens: 260000, contextWindow: 512000 }
  const { dockNodes } = renderVial({ heat: heatPayload, pressure })
  assert.equal(dockNodes.some((node) => node.props && 'heat' in node.props), false)
})

test('a Session with history never shows the board, even before its reading arrives', () => {
  // Switching Sessions remounts this row before the new projection lands, so
  // "blank" has to come from the host flag (`session.blank`) rather than from a
  // missing reading — otherwise the card flashes in conversations that have
  // messages (and the host block is pushed down with it).
  const { dockNodes } = renderVial({ heat: heatPayload, session: { blank: false } })
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-heat')), false)
  assert.ok(dockNodes.some((node) => hasClass(node, 'ct-repo-dock')), 'the dock row renders')
})

test('a Session waiting for its first reply keeps the row, not the board', () => {
  const { dockNodes } = renderVial({ heat: heatPayload, session: { blank: true, awaitingFirstTurn: true } })
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-heat')), false)
})

test('the host blank flag mounts the board without any reading', () => {
  const { dockNodes } = renderVial({ heat: heatPayload, session: { blank: true } })
  assert.ok(dockNodes.some((node) => node.props && 'heat' in node.props), 'the card is mounted')
})

test('no grid is painted without cached usage data', () => {
  const { dockNodes } = renderVial({ heat: null })
  // Without a cached board there is nothing to portal; the row keeps its pill.
  assert.ok(dockNodes.some((node) => hasClass(node, 'ct-repo-dock')), 'the dock row stays')
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-heat')), false)
  assert.equal(dockNodes.some((node) => node.props && 'heat' in node.props), false)
})

test('the dock is a column so the grid sits above the pill, never beside it', () => {
  const { module, styles } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const css = String(styles[0].textContent)
  // 2.7.0: the row stacks a heatmap above the tools line; both keep the right edge.
  assert.match(css, /\.ct-repo-dock \{[^}]*flex-direction: column;/)
  assert.match(css, /\.ct-repo-dock \{[^}]*justify-content: flex-end;/)
  // 2.7.3: the full upstream chassis — 62fr heat column, 38fr pools column,
  // hairline between them, scale zone under the grid, telemetry bar at the bottom.
  assert.match(css, /\.ct-heat-chassis \{[^}]*grid-template-columns: 62fr 38fr;/)
  assert.match(css, /\.ct-heat-zone \{[^}]*padding: 15px 18px 14px;/)
  assert.match(css, /\.ct-heat-zone \{[^}]*gap: 11px;/)
  assert.match(css, /\.ct-heat-right \{[^}]*padding: 15px 18px;/)
  assert.match(css, /\.ct-heat-left \{[^}]*border-right: 1px solid var\(--dsw-alias-border-l1\);/)
  assert.match(css, /\.ct-heat-pools \{[^}]*gap: 13px;/)
  assert.match(css, /\.ct-heat-track \{[^}]*height: 5px;/)
  assert.match(css, /\.ct-heat-track-fill \{[^}]*background-image: linear-gradient\(180deg, rgba\(255, 255, 255, 0\.24\)/)
  assert.match(css, /\.ct-heat-right-foot \{[^}]*border-top: 1px solid var\(--dsw-alias-border-l1\);/)
  assert.match(css, /\.ct-heat-bar \{[^}]*justify-content: flex-end;/)
  assert.match(css, /@container \(max-width: 660px\) \{[\s\S]*?\.ct-heat-chassis \{\n    grid-template-columns: minmax\(0, 1fr\);/)
  assert.match(css, /\.ct-heat-layer \{[^}]*container-type: inline-size;/)
  // 2.7.4: on a blank Session the host's centred welcome + composer block is
  // shifted down into the dead band under the input card, then the card hangs
  // above it. Only while the card is up (data-ct-blank).
  assert.match(css, /body\[data-ct-blank='on'\] \[data-conversation-region='composer'\] \{[^}]*transform: translateY\(var\(--ct-seat-shift, 0px\)\);/)
  assert.match(css, /\.ct-heat-grid \{[^}]*grid-template-columns: repeat\(26, minmax\(0, 1fr\)\);/)
  assert.match(css, /\.ct-heat-grid \{[^}]*grid-auto-flow: column;/)
  assert.match(css, /\.ct-heat \{[\s\S]*?background: var\(--dsw-specific-menu\);/)
  assert.match(css, /\.ct-heat-cell \{[^}]*aspect-ratio: 1;/)
  assert.match(css, /\.ct-heat-cell \{[^}]*border-radius: 2px;/)
  assert.match(css, /\.ct-heat-cell:hover \{[^}]*transform: scale\(1\.3\);/)
  assert.match(css, /\.ct-heat-head \{[^}]*justify-content: space-between;/)
  assert.match(css, /\.ct-heat-ranges \{[^}]*border-radius: 999px;/)
  assert.match(css, /\.ct-heat-range\[data-active='true'\]/)
  assert.match(css, /\.ct-heat-tip \{[^}]*position: absolute;/)
  assert.match(css, /\.ct-heat-tip\[data-show='true'\]/)
  assert.match(css, /\.ct-heat-foot \{[^}]*padding: 13px 18px 15px;/)
  assert.match(css, /\.ct-heat-hero \{[^}]*font-size: clamp\(20px, 2vw, 25px\);/)
  assert.match(css, /\.ct-heat-sub \{[^}]*font-family: ui-monospace/)
  assert.equal(/\.ct-heat-swatch|\.ct-heat-legend|\.ct-heat-meta/.test(css), false, 'the old legend and single meta line are gone')
  // Five steps on the accent token, plus a subtler empty and future square.
  for (const level of [1, 2, 3, 4, 5]) {
    assert.match(css, new RegExp(`\\.ct-heat-cell\\[data-level='${level}'\\]`))
  }
  assert.match(css, /\.ct-heat-cell\[data-future='true'\]/)
})

test('motion off pauses every effort animation, the sweep included', () => {
  const { module, styles } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const css = String(styles[0].textContent)
  assert.match(
    css,
    /\.ct-effort\[data-motion='off'\] \.ct-effort-star,\n\.ct-effort\[data-motion='off'\] \.ct-effort-energy-sweep \{\n  animation-play-state: paused;\n\}/,
  )
})

test('the settings snapshot is pushed to subscribers so the dock follows the panel', () => {
  const { module } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  const settings = plugin.__test.settings
  const seen = []
  const off = settings.subscribe(function (body) { seen.push(body) })
  settings.remember({ level: 'max' })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].level, 'max')
  off()
  settings.remember({ level: 'gentle' })
  assert.equal(seen.length, 1, 'unsubscribing stops the pushes')
})

test('the skin paints from constants at startup, without reading settings', () => {
  const attrs = {}
  let settingsCalls = 0
  const { module, sandbox } = loadClient({
    fetch: (url) => {
      if (String(url) === '/compression-tiers/api/settings') settingsCalls += 1
      return Promise.resolve({ ok: true, json: async () => ({}) })
    },
  })
  sandbox.document.body = { setAttribute(name, value) { attrs[name] = String(value) } }
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(sectionContext([]))
  // Appearance no longer comes from the settings route: there is nothing to read.
  assert.equal(settingsCalls, 0)
  assert.equal(attrs['data-ct-palette'], 'auto')
  assert.equal(attrs['data-ct-art'], 'on')
  assert.equal(attrs['data-ct-motion'], 'full')
})

test('the one auto skin repaints the app through the host theme service', () => {
  const { module } = loadClient()
  const applied = []
  const disposed = []
  const theme = {
    overrideTokens(source, tokens) {
      applied.push({ source, tokens })
      return () => { disposed.push(source) }
    },
  }
  const ctx = {
    effect(fn) { fn() },
    locale: { register: () => () => {}, bind: () => (key) => key },
    slots: { inject: (_slot, callback) => callback(), register: () => () => {} },
    inject(deps, callback) {
      const names = JSON.stringify(deps)
      assert.ok(names === '["theme"]' || names === '["modelDirectories"]', 'unexpected injection: ' + names)
      callback(names === '["theme"]' ? { theme } : {})
      return () => {}
    },
  }
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(ctx)

  const skin = plugin.__test
  assert.ok(skin, 'the factory exposes the skin seams for tests')
  assert.equal(applied.length, 1, 'the auto skin installs exactly one layer at startup')
  assert.equal(applied[0].source, 'compression-tiers')
  const tokens = applied[0].tokens
  const names = Object.keys(tokens)
  assert.ok(names.length > 60, 'the skin covers the app surface tokens')
  for (const name of names) {
    assert.match(name, /^--dsw-/)
    const value = tokens[name]
    assert.equal(typeof value.light, 'string', name + ' has a light value')
    assert.equal(typeof value.dark, 'string', name + ' has a dark value')
    assert.notEqual(value.light, '', name + ' has an empty light value')
    assert.notEqual(value.dark, '', name + ' has an empty dark value')
  }

  // 白昼冷晶 is upstream Obsidian Prism's own light theme; 深空黑曜 its dark half,
  // so the host's 深色 / 亮色 switch is the only control.
  assert.equal(tokens['--dsw-alias-bg-base'].light, '#f4f7fb')
  assert.equal(tokens['--dsw-alias-bg-layer-3'].light, '#ffffff')
  assert.equal(tokens['--dsw-alias-state-business-primary'].light, '#2563eb')
  assert.equal(tokens['--dsw-alias-bg-base'].dark, '#0a0a0c')

  // Only one palette exists now, and it carries no scheme to pin.
  assert.equal(skin.skinSpec('crystal'), null, 'the old palette ids are gone')
  assert.equal(skin.skinSpec('host'), null)
  assert.equal('mode' in skin.skinSpec('auto'), false)
  // The single layer is never stacked: painting again is a no-op.
  skin.setSkinPalette()
  assert.equal(applied.length, 1)
  assert.equal(disposed.length, 0)
})

/* ---- Reasoning effort slider -------------------------------------------- */

/** A tiny DOM: just enough element/attribute/selector surface for the bridge. */
function fakeDom() {
  function parse(selector) {
    const out = { tag: '', classes: [], attrs: [] }
    const head = selector.match(/^[a-zA-Z][\w-]*/)
    if (head) out.tag = head[0].toUpperCase()
    const rest = head ? selector.slice(head[0].length) : selector
    for (const part of rest.match(/\[[^\]]+\]|\.[\w-]+/g) || []) {
      if (part[0] === '.') {
        out.classes.push(part.slice(1))
        continue
      }
      const body = part.slice(1, -1)
      const eq = body.indexOf('=')
      if (eq < 0) out.attrs.push([body, null])
      else out.attrs.push([body.slice(0, eq), body.slice(eq + 1).replace(/^["']|["']$/g, '')])
    }
    return out
  }
  function matches(node, parsed) {
    if (parsed.tag && node.tagName !== parsed.tag) return false
    const classes = String(node.getAttribute('class') || '').split(/\s+/)
    for (const name of parsed.classes) if (!classes.includes(name)) return false
    for (const [name, value] of parsed.attrs) {
      const actual = node.getAttribute(name)
      if (actual === null) return false
      if (value !== null && actual !== value) return false
    }
    return true
  }
  function descendants(node, out = []) {
    for (const child of node.childNodes) {
      out.push(child)
      descendants(child, out)
    }
    return out
  }
  function element(tag) {
    const node = {
      tagName: String(tag).toUpperCase(),
      childNodes: [],
      parentNode: null,
      listeners: {},
      attributes: {},
      rect: null,
      textContent: '',
      style: {
        values: {},
        setProperty(name, value) { this.values[name] = String(value) },
      },
      appendChild(child) {
        child.parentNode = node
        node.childNodes.push(child)
        return child
      },
      insertBefore(child, reference) {
        child.parentNode = node
        const at = reference ? node.childNodes.indexOf(reference) : -1
        if (at < 0) node.childNodes.push(child)
        else node.childNodes.splice(at, 0, child)
        return child
      },
      removeChild(child) {
        const at = node.childNodes.indexOf(child)
        if (at >= 0) node.childNodes.splice(at, 1)
        child.parentNode = null
        return child
      },
      setAttribute(name, value) { node.attributes[name] = String(value) },
      getAttribute(name) { return name in node.attributes ? node.attributes[name] : null },
      addEventListener(type, handler) {
        if (!node.listeners[type]) node.listeners[type] = []
        node.listeners[type].push(handler)
      },
      dispatch(type, event) {
        for (const handler of node.listeners[type] || []) handler(event)
      },
      getBoundingClientRect() {
        return node.rect || { left: 0, top: 0, width: 100, height: 28 }
      },
      querySelector(selector) {
        const parsed = parse(selector)
        return descendants(node).find((child) => matches(child, parsed)) || null
      },
      querySelectorAll(selector) {
        const parsed = parse(selector)
        return descendants(node).filter((child) => matches(child, parsed))
      },
      closest(selector) {
        const parsed = parse(selector)
        let current = node
        while (current) {
          if (current.tagName && matches(current, parsed)) return current
          current = current.parentNode
        }
        return null
      },
    }
    return node
  }
  const body = element('body')
  const byId = new Map()
  const document = {
    body,
    createElement: (tag) => element(tag),
    createElementNS: (_ns, tag) => element(tag),
    getElementById: (id) => byId.get(id) || null,
    querySelector: (selector) => body.querySelector(selector),
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    register(id, node) { byId.set(id, node); return node },
  }
  return { document, element, body }
}

/** `{ light, dark }` effort snapshot for the fake model directory. */
function effortSnapshot(overrides = {}) {
  return {
    current: { provider: 'deepseek', model: 'deepseek-v4', reasoningEffort: 'high' },
    groups: [{
      id: 'deepseek',
      models: [{
        id: 'deepseek-v4',
        reasoning: {
          defaultEffort: 'low',
          efforts: [
            { id: 'off', name: '关闭' },
            { id: 'low', name: '低' },
            { id: 'high', name: '高' },
            { id: 'max', name: '最高' },
          ],
        },
      }],
    }],
    status: 'ready',
    ...overrides,
  }
}

test('the effort state reads the levels of the current model only', () => {
  const { module } = loadClient()
  const effort = module.factory(() => fakeReact(null)).__test.effort

  const state = effort.stateOf(effortSnapshot())
  // Cross-realm arrays: compare their JSON, not their prototypes.
  assert.equal(JSON.stringify(state.levels.map((level) => level.id)), '["off","low","high","max"]')
  assert.equal(JSON.stringify(state.levels.map((level) => level.name)), '["关闭","低","高","最高"]')
  assert.equal(state.index, 2, 'the saved effort wins')
  assert.equal(state.provider, 'deepseek')
  assert.equal(state.model, 'deepseek-v4')
  assert.equal(state.busy, false)

  // No saved effort: the model's advertised default decides.
  assert.equal(effort.stateOf(effortSnapshot({
    current: { provider: 'deepseek', model: 'deepseek-v4' },
  })).index, 1)
  // An effort the catalog no longer advertises falls back to the first level.
  assert.equal(effort.stateOf(effortSnapshot({
    current: { provider: 'deepseek', model: 'deepseek-v4', reasoningEffort: 'turbo' },
  })).index, 0)
  // Mid-select the slider locks itself.
  assert.equal(effort.stateOf(effortSnapshot({ status: 'selecting' })).busy, true)

  // Nothing to slide: a model without reasoning metadata, one single level, or
  // another model's metadata must never grow a control.
  assert.equal(effort.stateOf(effortSnapshot({
    groups: [{ id: 'deepseek', models: [{ id: 'deepseek-v4' }] }],
  })), null)
  assert.equal(effort.stateOf(effortSnapshot({
    groups: [{
      id: 'deepseek',
      models: [{ id: 'deepseek-v4', reasoning: { efforts: [{ id: 'high', name: '高' }] } }],
    }],
  })), null, 'one level is not a slider')
  assert.equal(effort.stateOf(effortSnapshot({
    groups: [{
      id: 'other',
      models: [{ id: 'deepseek-v4', reasoning: { efforts: [{ id: 'a' }, { id: 'b' }] } }],
    }],
  })), null, 'levels belong to the current provider')
  assert.equal(effort.stateOf(null), null)
  assert.equal(effort.stateOf({ current: null, groups: [] }), null)
})

test('the effort rail geometry keeps the knob inside the track', () => {
  const { module } = loadClient()
  const effort = module.factory(() => fakeReact(null)).__test.effort

  assert.equal(effort.knobLeft(0), 'calc(14px + (100% - 28px) * 0)')
  assert.equal(effort.knobLeft(0.5), 'calc(14px + (100% - 28px) * 0.5)')
  assert.equal(effort.knobLeft(1), 'calc(14px + (100% - 28px) * 1)')
  assert.equal(effort.knobLeft(4), effort.knobLeft(1), 'clamped high')
  assert.equal(effort.knobLeft(-2), effort.knobLeft(0), 'clamped low')
  assert.equal(effort.knobLeft('nope'), effort.knobLeft(0), 'garbage is the low end')

  assert.equal(effort.indexAt(0, 4), 0)
  assert.equal(effort.indexAt(1, 4), 3)
  assert.equal(effort.indexAt(0.5, 4), 2, 'the nearest level wins')
  assert.equal(effort.indexAt(2, 4), 3, 'clamped high')
  assert.equal(effort.step(0, -1, 4), 0)
  assert.equal(effort.step(3, 1, 4), 3)
  assert.equal(effort.step(1, 1, 4), 2)
  assert.equal(effort.step(9, 0, 4), 3, 'an out-of-range index is clamped first')

  // Colour is positional: blue at the bottom, violet at the top.
  const low = effort.ramp(0)
  const high = effort.ramp(1)
  assert.ok(high.hue > low.hue)
  assert.match(low.accent, /^hsl\(205 /)
  assert.match(high.accent, /^hsl\(285 /)
  // The fill and the knob ride the same centre line, half a knob from each end.
  assert.equal(effort.knobLeft(0.5), 'calc(14px + (100% - 28px) * 0.5)')
})

test('the bridge finds the official reasoning row by semantic attributes', () => {
  const { module } = loadClient()
  const effort = module.factory(() => fakeReact(null)).__test.effort
  const dom = fakeDom()
  const card = dom.element('div')
  card.setAttribute('data-composer-card', '')
  const trigger = dom.element('button')
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'true')
  trigger.setAttribute('aria-controls', 'model-menu')
  card.appendChild(trigger)
  dom.body.appendChild(card)
  const menu = dom.element('div')
  menu.setAttribute('id', 'model-menu')
  menu.setAttribute('role', 'menu')
  const modelRow = dom.element('button')
  modelRow.setAttribute('role', 'menuitem')
  const effortRow = dom.element('button')
  effortRow.setAttribute('role', 'menuitem')
  menu.appendChild(modelRow)
  menu.appendChild(effortRow)
  dom.body.appendChild(menu)
  dom.document.register('model-menu', menu)

  const found = effort.findRow(dom.document)
  assert.ok(found)
  assert.equal(found.row, effortRow, 'the second row is the reasoning level')
  assert.equal(found.menu, menu)

  // A closed menu is invisible to the bridge.
  trigger.setAttribute('aria-expanded', 'false')
  assert.equal(effort.findRow(dom.document), null)
  // An open menu with a single row has no reasoning row to attach to.
  trigger.setAttribute('aria-expanded', 'true')
  menu.removeChild(effortRow)
  assert.equal(effort.findRow(dom.document), null)
  // A menu without the composer card is still recognised by signature alone.
  menu.appendChild(effortRow)
  dom.body.removeChild(card)
  dom.body.appendChild(trigger)
  assert.ok(effort.findRow(dom.document), 'the fallback signature accepts it')
  assert.equal(effort.findRow(null), null)
  assert.equal(effort.findRow({}), null)
})

test('the reasoning row is identified by its label, not its position', () => {
  const { module } = loadClient()
  const effort = module.factory(() => fakeReact(null)).__test.effort
  const dom = fakeDom()
  const card = dom.element('div')
  card.setAttribute('data-composer-card', '')
  const trigger = dom.element('button')
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'true')
  trigger.setAttribute('aria-controls', 'plan-menu')
  card.appendChild(trigger)
  dom.body.appendChild(card)
  const menu = dom.element('div')
  menu.setAttribute('id', 'plan-menu')
  dom.document.register('plan-menu', menu)

  /** A menu row with the label span the official markup renders. */
  function row(label) {
    const button = dom.element('button')
    button.setAttribute('role', 'menuitem')
    const span = dom.element('span')
    span.textContent = label
    button.appendChild(span)
    const value = dom.element('span')
    value.textContent = 'High'
    button.appendChild(value)
    menu.appendChild(button)
    return button
  }

  const modelRow = row('模型')
  // A subscription picker contributes a second row: position alone would put
  // the rail under Speed and drag the wrong setting.
  const speedRow = row('Speed')
  const effortRow = row('推理等级')

  assert.equal(effort.findRow(dom.document).row, effortRow, 'the label wins over the position')
  assert.ok(modelRow && speedRow)

  // Without the reasoning row the pane is left alone, even though two rows
  // remain — the second one is Speed, not a reasoning level.
  menu.removeChild(effortRow)
  assert.equal(effort.findRow(dom.document), null, 'an unknown second row is not claimed')

  // An unlabelled pane keeps working through the documented two-row layout.
  const modelButton = menu.childNodes[0]
  const speedButton = menu.childNodes[1]
  modelButton.childNodes.length = 0
  speedButton.childNodes.length = 0
  assert.ok(effort.findRow(dom.document), 'two unlabelled rows are model + reasoning')
})

test('the slider writes through the official directory and rolls back a refusal', async () => {
  const { module } = loadClient()
  const plugin = module.factory(() => fakeReact(null))
  const effort = plugin.__test.effort
  const dom = fakeDom()
  effort.setDocument(dom.document)
  effort.setLabels({ ariaLabel: '推理等级', errorPrefix: '切换失败：' })

  const card = dom.element('div')
  card.setAttribute('data-composer-card', '')
  const trigger = dom.element('button')
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'true')
  trigger.setAttribute('aria-controls', 'diff-menu')
  card.appendChild(trigger)
  dom.body.appendChild(card)
  const menu = dom.element('div')
  menu.setAttribute('id', 'diff-menu')
  const row = dom.element('button')
  row.setAttribute('role', 'menuitem')
  const row2 = dom.element('button')
  row2.setAttribute('role', 'menuitem')
  menu.appendChild(row)
  menu.appendChild(row2)
  card.appendChild(menu)
  dom.document.register('diff-menu', menu)

  let snapshot = effortSnapshot()
  const calls = []
  let reply = () => ({ ok: true })
  const directory = {
    store: { getSnapshot: () => snapshot, subscribe: () => () => {} },
    select(selection) {
      calls.push(selection)
      const result = reply()
      // A successful write lands in the durable projection, so the next read
      // shows it — that is what the official row and our knob both follow.
      if (result.ok) snapshot = { ...snapshot, current: { ...snapshot.current, reasoningEffort: selection.reasoningEffort } }
      return Promise.resolve(result)
    },
    load: () => Promise.resolve(snapshot),
  }
  effort.setDirectory(directory)

  // Closed menu: nothing is injected into the official DOM.
  trigger.setAttribute('aria-expanded', 'false')
  effort.sync()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 0)

  // Open: the control lands directly below the reasoning row.
  trigger.setAttribute('aria-expanded', 'true')
  effort.sync()
  const sliders = menu.querySelectorAll('.ct-effort')
  assert.equal(sliders.length, 1)
  const slider = sliders[0]
  assert.equal(menu.childNodes.indexOf(slider), menu.childNodes.indexOf(row2) + 1, 'right under the row')
  const track = slider.querySelector('.ct-effort-track')
  assert.equal(track.getAttribute('role'), 'slider')
  assert.equal(track.getAttribute('aria-valuenow'), '2')
  assert.equal(track.getAttribute('aria-valuemax'), '3')
  assert.equal(track.getAttribute('aria-valuetext'), '高')
  assert.equal(track.getAttribute('aria-label'), '推理等级')
  assert.equal(slider.querySelectorAll('.ct-effort-dot').length, 4, 'one tick per level')
  // The energy layer and its stardust are part of the control, not decoration
  // bolted on afterwards: 22 deterministic dots, one nebula, one sweep.
  assert.equal(slider.querySelectorAll('.ct-effort-star').length, 22, 'the starfield is present')
  assert.equal(slider.querySelectorAll('.ct-effort-star-dot').length, 22)
  assert.equal(slider.querySelectorAll('.ct-effort-energy').length, 1)
  assert.equal(slider.querySelectorAll('.ct-effort-energy-sweep').length, 1)
  // The 'high' level already carries half the energy; the fill reports it through
  // one custom property instead of per-frame style writes.
  const energyValue = Number(slider.style.values['--ct-effort-energy'])
  assert.ok(energyValue > 0.4 && energyValue < 0.6, 'high sits around half energy, got ' + energyValue)
  assert.equal(slider.getAttribute('data-energy'), '1')
  // A second sync must not stack a second control.
  effort.sync()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 1)

  // Keyboard: one step left selects the previous level through the directory.
  track.dispatch('keydown', { key: 'ArrowLeft', preventDefault() {} })
  assert.equal(JSON.stringify(calls), JSON.stringify([{ provider: 'deepseek', model: 'deepseek-v4', reasoningEffort: 'low' }]))
  assert.equal(track.getAttribute('aria-valuenow'), '1')
  await new Promise((resolve) => setTimeout(resolve, 30))

  // A refused selection reports the host's message and puts the knob back.
  reply = () => ({ ok: false, error: { code: 'session/writer-held', message: 'session is busy' } })
  track.dispatch('keydown', { key: 'End', preventDefault() {} })
  assert.equal(JSON.stringify(calls[1]), JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4', reasoningEffort: 'max' }))
  await new Promise((resolve) => setTimeout(resolve, 30))
  const error = slider.querySelector('.ct-effort-error')
  assert.match(error.textContent, /切换失败：/)
  assert.equal(track.getAttribute('aria-valuenow'), '1', 'the knob stays on the confirmed level')

  // Closing the menu removes the control with it.
  trigger.setAttribute('aria-expanded', 'false')
  effort.sync()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 0)
})

test('the bridge waits out a directory the host refuses to hand out yet', async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const { module } = loadClient()
  const effort = module.factory(() => fakeReact(null)).__test.effort
  const dom = fakeDom()
  effort.setDocument(dom.document)
  effort.setLabels({ ariaLabel: '推理等级', errorPrefix: '切换失败：' })

  const card = dom.element('div')
  card.setAttribute('data-composer-card', '')
  const trigger = dom.element('button')
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-expanded', 'true')
  trigger.setAttribute('aria-controls', 'wait-menu')
  card.appendChild(trigger)
  dom.body.appendChild(card)
  const menu = dom.element('div')
  menu.setAttribute('id', 'wait-menu')
  const modelRow = dom.element('button')
  modelRow.setAttribute('role', 'menuitem')
  const row = dom.element('button')
  row.setAttribute('role', 'menuitem')
  menu.appendChild(modelRow)
  menu.appendChild(row)
  dom.body.appendChild(menu)
  dom.document.register('wait-menu', menu)

  const released = []
  const directoryOf = (state) => ({
    store: {
      getSnapshot: () => state,
      subscribe() {
        return () => { released.push(state) }
      },
    },
    select: () => Promise.resolve({ ok: true }),
    load: () => Promise.resolve(state),
  })
  let current = directoryOf(effortSnapshot())
  let refusals = 2
  // The first calls throw: that is what `directoryFor()` does until the
  // session scope exists, and caching the failure would kill the control.
  const service = {
    directoryFor() {
      if (refusals > 0) {
        refusals -= 1
        throw new Error('session scope is not ready')
      }
      return current
    },
  }
  effort.setService(service)

  const dispose = effort.mount('session-1', { motion: 'full', ariaLabel: '推理等级', errorPrefix: '切换失败：' })
  effort.sync()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 0, 'a refused directory injects nothing')

  await wait(420)
  const attached = menu.querySelectorAll('.ct-effort')
  assert.equal(attached.length, 1, 'the retry chain attaches once the directory exists')
  assert.equal(attached[0].querySelector('.ct-effort-track').getAttribute('aria-valuenow'), '2')

  // The host rebuilds the directory on a model-generation change: the bridge
  // has to re-subscribe instead of holding the dead instance forever.
  current = directoryOf(effortSnapshot({
    current: { provider: 'deepseek', model: 'deepseek-v4', reasoningEffort: 'max' },
  }))
  effort.sync()
  assert.equal(released.length, 1, 'the stale subscription is released')
  assert.equal(menu.querySelectorAll('.ct-effort').length, 1, 'still exactly one rail')
  assert.equal(menu.querySelector('.ct-effort-track').getAttribute('aria-valuenow'), '3',
    'the knob follows the rebuilt directory')

  // React drops our node when it swaps panes: the next pass puts it back.
  menu.removeChild(menu.querySelector('.ct-effort'))
  effort.sync()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 1, 'a dropped rail is re-attached')

  dispose()
  assert.equal(menu.querySelectorAll('.ct-effort').length, 0)
  assert.equal(effort.bridge.sessionId, '', 'the disposer forgets the session')
})

test('the dock mounts the effort bridge but renders nothing itself', () => {
  const nodes = renderDock([{ level: 'standard' }], { t: (key) => key, sessionId: 'session-1' })
  const bridge = nodes.find((node) => typeof node.type === 'function' && node.props && node.props.sessionId === 'session-1')
  assert.ok(bridge, 'the bridge is mounted on the dock row')
  assert.equal(bridge.props.motion, 'full')
  assert.equal(bridge.type(bridge.props), null, 'the bridge renders no markup of its own')
})

/** One memory payload, as `/api/memory` returns it for a registered workspace. */
function memoryState(overrides) {
  return {
    ok: true,
    workspaces: [{ id: 'game', title: 'Game', path: 'C:/game' }],
    workspace: 'game',
    memory: {
      root: 'C:/game',
      dir: 'C:/game/memory',
      exists: true,
      entries: 6,
      byKind: { rule: 2, fact: 4 },
      promises: {
        open: [{ id: 'prom-1', claim: '先接通全部接口', deadline: '2026-12-01' }],
        overdue: [],
        done: 1,
        dropped: 0,
      },
      index: {
        path: 'C:/game/memory/MEMORY.md',
        exists: true,
        lines: 42,
        bytes: 1200,
        over: false,
        foreign: false,
        maxLines: 200,
        maxBytes: 25000,
      },
      drift: { missingEvidence: [{ id: 'fact-1', path: 'docs/x.md' }], expired: [] },
      duplicates: [],
      conflicts: [],
      quarantine: 2,
      invalid: 0,
      badLines: 0,
      limits: { maxEntries: 5000, maxIndexLines: 200, maxIndexBytes: 25000 },
      recent: [{ id: 'rule-1', kind: 'rule', claim: '三视图先剪影', at: '2026-11-28T10:00:00.000Z' }],
      questions: [],
      ...(overrides || {}),
    },
  }
}

test('the memory page shows the store, its injected-index budget and three constant actions', () => {
  const nodes = renderSection('memory', { memory: memoryState(), memoryWorkspace: 'game' })
  assert.deepEqual(nodes.filter((node) => node.type === 'h3').map((node) => textOf(node)), ['memoryTitle'])
  const notes = nodes.filter((node) => hasClass(node, 'ct-note')).map((node) => deepText(node)).join('\n')
  assert.match(notes, /C:\/game\/memory/, 'the store directory is shown')
  assert.match(notes, /42 \/ 200/, 'the index budget is shown')
  assert.match(notes, /memoryEvidenceMissing 1/, 'evidence drift is shown')
  assert.match(notes, /memoryQuarantine 2/, 'the quarantine is shown')
  const recent = nodes.filter((node) => hasClass(node, 'ct-item-name')).map((node) => deepText(node))
  assert.deepEqual(recent, ['三视图先剪影'])
  for (const action of ['memoryReload', 'memoryIndex', 'memoryDream']) {
    const button = buttonOf(nodes, action)
    assert.ok(button, `${action} is always rendered`)
    assert.equal(button.props.disabled, false)
  }
  const picker = pickerOf(nodes)
  assert.ok(picker, 'the workspace picker is the shared self-drawn component')
  assert.deepEqual(picker.props.items.map((item) => item.value), ['game'])
})

test('a memory page with no registered workspace keeps its buttons and says so', () => {
  const nodes = renderSection('memory', {
    memory: { ok: true, workspaces: [], workspace: '', memory: null },
    memoryWorkspace: '',
  })
  const text = nodes.map((node) => deepText(node)).join('\n')
  assert.match(text, /memoryNone/)
  for (const action of ['memoryReload', 'memoryIndex', 'memoryDream']) {
    const button = buttonOf(nodes, action)
    assert.ok(button, `${action} stays rendered`)
    assert.equal(button.props.disabled, true)
  }
})

test('the memory page surfaces an over-budget or hand-written index instead of hiding it', () => {
  const nodes = renderSection('memory', {
    memory: memoryState({
      index: {
        path: 'C:/game/memory/MEMORY.md',
        exists: true,
        lines: 240,
        bytes: 30000,
        over: true,
        foreign: true,
        maxLines: 200,
        maxBytes: 25000,
      },
      recent: [],
    }),
    memoryWorkspace: 'game',
  })
  const notes = nodes.filter((node) => hasClass(node, 'ct-note')).map((node) => deepText(node)).join('\n')
  assert.match(notes, /memoryOver/)
  assert.match(notes, /memoryForeign/)
  const text = nodes.map((node) => deepText(node)).join('\n')
  assert.match(text, /memoryNoEntries/)
})

/** The `/api/memory/dream` payload, as the panel receives it. */
function dreamState(overrides) {
  return {
    enabled: true,
    intervalHours: 24,
    lastRunAt: '2026-11-28T00:00:00.000Z',
    nextAt: '2026-11-29T00:00:00.000Z',
    running: false,
    lastReport: { ranAt: '2026-11-28T00:00:00.000Z', totals: { roots: 2, merged: 3, expired: 1 } },
    reportText: '',
    limits: { minIntervalHours: 1, maxIntervalHours: 168, checkMs: 300000 },
    ...(overrides || {}),
  }
}

test('the memory page schedules nightly dreaming and keeps all four actions', () => {
  const nodes = renderSection('memory', {
    memory: memoryState(),
    memoryWorkspace: 'game',
    memoryDream: dreamState(),
    dreamEnabled: true,
    dreamInterval: '24',
  })
  assert.ok(nodes.some((node) => node.type === 'h4' && textOf(node) === 'memoryDreamTitle'))
  for (const action of ['memoryDreamToggle', 'memoryDreamSave', 'memoryDreamRun', 'memoryDreamCancel']) {
    const button = buttonOf(nodes, action)
    assert.ok(button, `${action} is always rendered`)
  }
  assert.equal(buttonOf(nodes, 'memoryDreamRun').props.disabled, false)
  assert.equal(buttonOf(nodes, 'memoryDreamSave').props.disabled, true, 'a clean schedule cannot be saved')
  assert.equal(buttonOf(nodes, 'memoryDreamCancel').props.disabled, true, 'nothing to cancel while idle')
  const input = nodes.find((node) => node.type === 'input' && node.props.className === 'ct-input')
  assert.ok(input, 'the interval field is rendered')
  assert.equal(input.props.value, '24')
  assert.equal(input.props.min, '1')
  assert.equal(input.props.max, '168')
  const text = nodes.map((node) => deepText(node)).join('\n')
  assert.match(text, /memoryDreamLast/)
  assert.match(text, /memoryDreamRoots/)
})

test('a running nightly pass disables save and run but allows cancelling the rest', () => {
  const nodes = renderSection('memory', {
    memory: memoryState(),
    memoryDream: dreamState({ running: true }),
    dreamInterval: '24',
  })
  assert.equal(buttonOf(nodes, 'memoryDreamRun').props.disabled, true)
  assert.equal(buttonOf(nodes, 'memoryDreamCancel').props.disabled, false)
})

test('a cancelled pass stops offering the cancel until it actually ends', () => {
  // The host reports the armed flag, so a remount keeps the button disabled.
  const armed = renderSection('memory', {
    memory: memoryState(),
    memoryDream: dreamState({ running: true, cancelRequested: true }),
    dreamInterval: '24',
  })
  const button = buttonOf(armed, 'memoryDreamCancel')
  assert.equal(button.props.disabled, true)
  assert.equal(button.props.title, 'memoryDreamCancelSent')
  // The click itself arms it before the next status refresh arrives.
  const clicked = renderSection('memory', {
    memory: memoryState(),
    memoryDream: dreamState({ running: true }),
    dreamInterval: '24',
    dreamCancelSent: true,
  })
  assert.equal(buttonOf(clicked, 'memoryDreamCancel').props.disabled, true)
  // Once the pass ends the flag clears and the button is merely idle-disabled.
  const idle = renderSection('memory', {
    memory: memoryState(),
    memoryDream: dreamState({ running: false }),
    dreamInterval: '24',
  })
  const idleButton = buttonOf(idle, 'memoryDreamCancel')
  assert.equal(idleButton.props.disabled, true)
  assert.equal(idleButton.props.title, '')
})

test('nightly dreaming cannot be run before a workspace is registered', () => {
  const nodes = renderSection('memory', {
    memory: { ok: true, workspaces: [], workspace: '', memory: null },
    memoryDream: dreamState({ enabled: false, lastRunAt: null, nextAt: null, lastReport: null }),
  })
  assert.equal(buttonOf(nodes, 'memoryDreamRun').props.disabled, true)
  assert.equal(buttonOf(nodes, 'memoryDreamToggle').props.disabled, false)
})
