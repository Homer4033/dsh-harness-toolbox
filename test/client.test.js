import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

/** Evaluate the browser module without touching a real ModuleLoader. */
function loadClient() {
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
    fetch: () => Promise.resolve({ ok: true, json: async () => ({}) }),
    setTimeout,
    console,
  })
  vm.runInContext(source, sandbox)
  assert.equal(loaded.length, 1)
  return { module: loaded[0], styles }
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
  appearance: { palette: 'host', motion: 'full', mascots: true },
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
  'pathDraft', 'pathBusy',
  'login', 'auth', 'ghMessage', 'ghBusy', 'network',
  'workspaceRules', 'workspaceId', 'workspaceText', 'workspaceMessage', 'workspaceBusy',
  'appearanceBusy', 'appearanceMessage',
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
  appearanceBusy: false,
  appearanceMessage: '',
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
  name: id === 'gh' ? 'GitHub CLI' : id === 'python' ? 'Python' : id,
  version: id === 'gh' ? '2.76.2' : id === 'git' ? '2.56.1' : id === 'python' ? '3.11.18' : null,
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
  assert.equal(dock.options.order, 90)
  assert.equal(dock.options.locale, 'compressionTiers')
  // The sheet is injected once, globally: the dock pill renders outside the
  // toolbox panel and must not depend on that panel having been opened.
  assert.equal(styles.length, 1)
  assert.match(styles[0].textContent, /\.ct-repo-pill \{/)
  const dockCss = String(styles[0].textContent).match(/\.ct-repo-dock \{[^}]*\}/)
  assert.ok(dockCss, 'the dock row keeps its own rule')
  assert.match(dockCss[0], /justify-content: space-between/)
  assert.match(dockCss[0], /container-type: inline-size/)
  assert.match(dockCss[0], /--dsh-composer-side-clearance/)
  // The dock row is capped to the composer card and centered: a full-width row
  // parked the pill at the window edge, far right of the input card.
  assert.match(dockCss[0], /--dsh-composer-card-max-width/)
  assert.match(dockCss[0], /margin: 0 auto/)
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
  assert.match(panelCss[0], /backdrop-filter: blur/)
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
  assert.match(styles[0].textContent, /\.ct-component \{/)
  // Empty status/note lines must collapse instead of leaving a gap in the panel.
  assert.match(styles[0].textContent, /\.ct-status:empty,\s*\.ct-note:empty \{/)
  assert.match(styles[0].textContent, /display: none;/)
  assert.equal(dictionaries.namespace, 'compressionTiers')
  assert.deepEqual(Object.keys(dictionaries.dicts).sort(), ['en', 'zh'])
  for (const locale of ['zh', 'en']) {
    const keys = Object.keys(dictionaries.dicts[locale])
    for (const key of [
      'title', 'sectionLabel', 'levelGentle', 'currentLabel', 'rulesTitle', 'rulesSave', 'rulesMissing',
      'workspaceRulesTitle', 'workspaceSelectLabel', 'workspaceRulesPlaceholder',
      'workspaceRulesMissing', 'workspaceRulesLoadFailed', 'workspaceRulesSaveFailed',
      'workspaceRulesSaved',
      'componentsTitle', 'componentsLoadFailed', 'componentsActionFailed',
      'toolsPathLabel', 'toolsPathSave', 'toolsPathReset', 'toolsPathRunning',
      'ghAuthTitle', 'ghLogin', 'ghCopy', 'ghOpenDevice', 'ghCancel',
      'toolsNotFound', 'toolsManaged', 'toolsSystem', 'pathLabel',
      'probe', 'downloadIdle', 'downloadKeep', 'downloadContinue', 'downloadRetry',
      'downloadRunning', 'downloadDone', 'downloadUnsupported',
      'stateMissing', 'statePartial', 'stateFailed', 'stateSystem',
      'repoSelectLabel', 'repoNone', 'repoTitle',
      'navAria', 'navLevels', 'navRules', 'navWorkspace', 'navComponents', 'navAppearance', 'navGithub',
      'appearanceTitle', 'paletteLabel', 'paletteHost', 'paletteObsidian', 'paletteWarm',
      'paletteCrystal', 'paletteAlabaster', 'motionLabel', 'motionFull', 'motionSubtle', 'motionOff',
      'mascotsLabel', 'mascotsOn', 'mascotsOff', 'appearanceApplied', 'appearanceFailed',
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
  assert.deepEqual(nodes.filter((node) => node.type === 'h3').map((node) => textOf(node)), ['rulesTitle'])
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
  ]
  const nodes = renderSection('components', { components: componentsPayload(rows) })
  const names = nodes
    .filter((node) => String(node.props.className || '') === 'ct-component-name')
    .map((node) => textOf(node))
  assert.deepEqual(names, ['GitHub CLI', 'git', 'ffmpeg / ffprobe', 'Python'])
  const blocks = nodes.filter((node) => String(node.props.className || '') === 'ct-component')
  assert.equal(blocks.length, 4)
  assert.match(deepText(blocks[0]), /downloadDone · v2\.76\.2/)
  assert.match(deepText(blocks[0]), /gh\\?\.exe|gh\.exe/)
  // The ffmpeg row still lists both binaries and where they came from.
  const tools = nodes.filter((node) => String(node.props.className || '') === 'ct-tool-name').map((node) => textOf(node))
  assert.deepEqual(tools, ['ffmpeg', 'ffprobe'])
  assert.match(deepText(blocks[2]), /toolsManaged v7\.1\.1/)
  assert.match(deepText(blocks[2]), /ffprobe\.exe/)
  // An installed component is done: the button is disabled but still rendered.
  for (const id of ['gh', 'git', 'ffmpeg', 'python']) {
    const download = buttonOf(nodes, `download:${id}`)
    assert.ok(download, `download:${id} is rendered`)
    assert.equal(download.props.disabled, true)
    assert.equal(textOf(download), 'downloadDone')
    assert.ok(buttonOf(nodes, `probe:${id}`), `probe:${id} is rendered`)
  }
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
    .filter((node) => String(node.props.className || '') === 'ct-component-head')
    .find((node) => deepText(node).startsWith('ffmpeg / ffprobe'))
  assert.equal(deepText(head), 'ffmpeg / ffprobestateMissing')
  const text = deepText({ props: { children: nodes } })
  assert.equal(text.includes('toolsNotFound'), false, 'no second "未找到" line')
})

test('every component row obeys one button standard', () => {
  const missing = componentsPayload(['gh', 'git', 'ffmpeg', 'python'].map((id) => componentRow(id, 'missing')))
  const nodes = renderSection('components', { components: missing })
  for (const id of ['gh', 'git', 'ffmpeg', 'python']) {
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
  assert.equal(deepText(nodes.find((node) => String(node.props.className || '') === 'ct-component-head')), 'GitHub CLIdownloadUnsupported · v2.76.2')
})

test('a PATH-only component offers the same forced download', () => {
  const nodes = renderSection('components', {
    components: componentsPayload([componentRow('git', 'system', { path: 'C:/Program Files/Git/cmd/git.exe', toolVersion: '2.56.1.windows.1' })]),
  })
  const download = buttonOf(nodes, 'download:git')
  assert.equal(textOf(download), 'downloadKeep')
  assert.equal(download.props.disabled, false)
  const block = nodes
    .filter((node) => String(node.props.className || '') === 'ct-component')
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
  const blocks = nodes.filter((node) => String(node.props.className || '') === 'ct-component')
  assert.equal(blocks.length, 4, 'all four rows render before the fetch resolves')
  for (const id of ['gh', 'git', 'ffmpeg', 'python']) {
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

test('the workspace rules block edits one registered workspace', () => {
  const second = {
    id: 'w2',
    title: '红利量化',
    path: 'D:/DSH插件/红利量化',
    file: 'D:/DSH插件/红利量化/AGENTS.md',
    exists: false,
    text: '',
    chars: 0,
  }
  const nodes = renderSection('workspace', {
    workspaceRules: workspaceRulesPayload([workspaceOne, second]),
    workspaceId: 'w1',
    workspaceText: 'Keep it short.\n',
  })
  const headings = nodes.filter((node) => node.type === 'h3').map((node) => textOf(node))
  assert.deepEqual(headings, ['workspaceRulesTitle'])
  const picker = pickerOf(nodes)
  assert.ok(picker, 'the block has a workspace picker')
  assert.equal(picker.props.value, 'w1')
  assert.equal(typeof picker.props.onChange, 'function')
  assert.deepEqual(picker.props.items.map((item) => item.value), ['w1', 'w2'])
  assert.deepEqual(picker.props.items.map((item) => item.label), ['压缩上下文', '红利量化'])
  // The native select is gone: its OS-painted popup cannot be themed.
  assert.equal(nodes.some((node) => node.type === 'select'), false, 'no native select')
  // One textarea: the selected workspace's rules (the global one is on its own page).
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas.length, 1)
  assert.equal(textareas[0].props.value, 'Keep it short.\n')
  assert.equal(textareas[0].props.disabled, false)
  const save = buttonOf(nodes, 'workspaceRulesSave')
  assert.ok(save, 'the block has one save button')
  assert.equal(save.props.disabled, true, 'an unchanged draft cannot be saved')
  const mentionsFile = nodes.some((node) => Array.isArray(node.props.children)
    && node.props.children.some((child) => typeof child === 'string' && child.includes(workspaceOne.file)))
  assert.ok(mentionsFile, 'the block shows the rules file it edits')
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
  const nodes = renderSection('workspace', {
    workspaceRules: workspaceRulesPayload([second]),
    workspaceId: 'w2',
    workspaceText: 'Only touch src/.\n',
  })
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.disabled, false)
  assert.ok(deepText({ props: { children: nodes } }).includes('workspaceRulesMissing'))
})

test('the workspace page stays in the rail and says there is no workspace yet', () => {
  const nodes = renderSection('workspace', { workspaceRules: workspaceRulesPayload([]) })
  const items = nodes.filter((node) => String(node.props.className || '') === 'ct-nav-item')
  // Six pages, always: an empty registry is a state, not a missing page.
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'rules', 'workspace', 'components', 'appearance', 'github'])
  const content = nodes.find((node) => String(node.props.className || '') === 'ct-content')
  assert.match(deepText(content), /workspaceRulesTitle/)
  assert.match(deepText(content), /workspaceNone/)
  // Nothing to pick or type, and the save button still renders - disabled and
  // explaining why, exactly like every other action button.
  assert.equal(pickerOf(nodes), null, 'no picker without a registry')
  assert.equal(nodes.filter((node) => node.type === 'textarea').length, 0)
  const save = buttonOf(nodes, 'workspaceRulesSave')
  assert.ok(save, 'the save button stays rendered')
  assert.equal(save.props.disabled, true)
  assert.equal(save.props.title, 'workspaceNone')
})

test('a workspace page that has not loaded says it is loading, not that the registry is empty', () => {
  const nodes = renderSection('workspace', { workspaceRules: null })
  const content = nodes.find((node) => String(node.props.className || '') === 'ct-content')
  assert.match(deepText(content), /levelsTitle|workspaceRulesTitle/)
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
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'rules', 'workspace', 'components', 'appearance', 'github'])
  assert.deepEqual(items.map((node) => deepText(node)), ['navLevels', 'navRules', 'navWorkspace', 'navComponents', 'navAppearance', 'navGithub'])
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
    section: 'workspace',
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

test('each page renders only its own card', () => {
  const cases = [
    ['levels', {}, ['levelsTitle']],
    ['rules', {}, ['rulesTitle']],
    ['workspace', { workspaceRules: workspaceRulesPayload([workspaceOne]), workspaceId: 'w1' }, ['workspaceRulesTitle']],
    ['components', { components: componentsPayload([]) }, ['componentsTitle']],
    ['appearance', {}, ['appearanceTitle']],
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

test('the appearance page paints the four palettes, motion tiers and companions', () => {
  const nodes = renderSection('appearance')
  const page = nodes.find((node) => hasClass(node, 'ct-page'))
  assert.ok(page, 'the page carries the skin root')
  assert.equal(page.props['data-palette'], 'host')
  assert.equal(page.props['data-motion'], 'full')
  const palettes = nodes.filter((node) => node.props.role === 'radio' && hasClass(node, 'ct-swatch'))
  assert.deepEqual(palettes.map((node) => node.props['data-choice']), ['host', 'obsidian', 'warm', 'crystal', 'alabaster'])
  assert.equal(palettes.filter((node) => node.props['aria-checked'] === 'true').length, 1)
  assert.equal(palettes[0].props['aria-checked'], 'true')
  const motions = nodes.filter((node) => node.props.role === 'radio' && hasClass(node, 'ct-segment'))
  assert.deepEqual(motions.map((node) => node.props['data-motion-choice']), ['full', 'subtle', 'off'])
  assert.equal(motions[0].props['aria-checked'], 'true')
  const mascots = buttonOf(nodes, 'appearanceMascots')
  assert.ok(mascots, 'the companions switch always renders')
  assert.equal(mascots.props['aria-pressed'], 'true')
  assert.equal(mascots.props.disabled, false)
  // A palette choice is a radio, not a button row that vanishes while loading.
  assert.equal(nodes.some((node) => node.type === 'select'), false)
  // No teaching copy on the page: only control labels and values.
  for (const banned of ['intro', 'paletteNote', 'motionNote']) {
    assert.equal(deepText({ props: { children: nodes } }).includes(banned), false, banned + ' must not return')
  }
})

test('a six-page rail keeps appearance in the navigation', () => {
  const nodes = renderSection('appearance')
  const items = nodes.filter((node) => hasClass(node, 'ct-nav-item'))
  assert.deepEqual(items.map((node) => node.props['data-section']), ['levels', 'rules', 'workspace', 'components', 'appearance', 'github'])
  const current = items.filter((node) => node.props['aria-current'] === 'page')
  assert.equal(current.length, 1)
  assert.equal(current[0].props['data-section'], 'appearance')
})

/** Render the context vial element the dock mounts, with its own hook values. */
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
  ]
  const vialStates = config.vialStates || [true, false]
  const react = fakeReact(dockStates.concat(vialStates), config.refs || [null, null, null, true, null, null, null, null, null, null, null, { up: true, left: 100, width: 392, bottom: 400, maxHeight: 360 }, null, null])
  const { module } = loadClient()
  const registrations = []
  module.factory((specifier) => (specifier === 'react-dom' ? { createPortal: (node) => node } : react)).apply(sectionContext(registrations))
  const dock = registrations.find((item) => item.options.name === 'conversation.input.dock')
  const dockNodes = collect(dock.component({
    sessionId: config.sessionId || 'session-vial',
    t: (key) => key,
    useProjection: useProjection,
  }))
  const vial = dockNodes.find((node) => typeof node.type === 'function'
    && node.props && 'meter' in node.props && typeof node.props.onPoke === 'function')
  assert.ok(vial, 'the dock mounts the context vial')
  return {
    nodes: collect(vial.type(vial.props)),
    dockNodes,
    element: vial,
  }
}

test('the dock renders the vial and the pixel companions in one row', () => {
  const { dockNodes, element } = renderVial({ vialStates: [false, false] })
  const dock = dockNodes.find((node) => hasClass(node, 'ct-repo-dock'))
  assert.ok(dock, 'the dock row renders')
  assert.match(String(dock.props.className), /ct-skin/)
  assert.equal(dock.props['data-palette'], 'host')
  assert.equal(dock.props['data-motion'], 'full')
  const mascots = dockNodes.find((node) => hasClass(node, 'ct-dock-mascots'))
  assert.ok(mascots, 'the companions sit on the left of the dock')
  const stage = collect(mascots).find((node) => typeof node.type === 'function'
    && node.props && 'stageRef' in node.props)
  assert.ok(stage, 'the stage component is mounted inside the dock')
  assert.equal(stage.type.name, 'MascotStage')
  assert.equal(stage.props.motion, 'full')
  // The vial is a real dialog trigger, not decoration.
  assert.ok(element, 'the dock passes a meter to the vial')
})

test('turning the companions off removes only the stage', () => {
  const quiet = { ...settingsState, appearance: { palette: 'crystal', motion: 'subtle', mascots: false } }
  const { dockNodes } = renderVial({ settings: quiet, vialStates: [false, false] })
  assert.equal(dockNodes.some((node) => hasClass(node, 'ct-dock-mascots')), false)
  const dock = dockNodes.find((node) => hasClass(node, 'ct-repo-dock'))
  assert.equal(dock.props['data-palette'], 'crystal')
  assert.equal(dock.props['data-motion'], 'subtle')
  // The repository pill is still there: the companions are additive.
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

test('a vial without a reading says so instead of inventing zero', () => {
  const { nodes } = renderVial({ vialStates: [true, false] })
  const trigger = nodes.find((node) => hasClass(node, 'ct-vial'))
  assert.equal(deepText(trigger), '—')
  assert.match(trigger.props['aria-label'], /vialUnavailable/)
  const dialog = nodes.find((node) => hasClass(node, 'ct-vial-popover'))
  assert.ok(dialog)
  assert.match(deepText(dialog), /vialUnavailable/)
  assert.equal(nodes.some((node) => hasClass(node, 'ct-vial-row')), false)
})



test('a palette repaints the whole app through the host theme service', () => {
  const { module } = loadClient()
  const applied = []
  const theme = {
    overrideTokens(source, tokens) {
      applied.push({ source, tokens })
      return () => {}
    },
    setTheme() {},
  }
  const ctx = {
    effect(fn) { fn() },
    locale: { register: () => () => {}, bind: () => (key) => key },
    slots: { inject: (_slot, callback) => callback(), register: () => () => {} },
    inject(deps, callback) {
      // Cross-realm array: compare contents, not the prototype.
      assert.equal(JSON.stringify(deps), '["theme"]')
      callback({ theme })
    },
  }
  const plugin = module.factory(() => fakeReact(null))
  plugin.apply(ctx)

  const skin = plugin.__test
  assert.ok(skin, 'the factory exposes the skin seams for tests')
  // The default "host" palette installs no layer: the official theme stays.
  assert.equal(applied.length, 0)

  skin.setSkinPalette('warm')
  assert.equal(applied.length, 1)
  assert.equal(applied[0].source, 'compression-tiers')
  const names = Object.keys(applied[0].tokens)
  assert.ok(names.length > 60, 'the skin covers the app surface tokens')
  for (const name of names) {
    // The service rejects bare strings for a reason: one value cannot serve both
    // colour schemes. Every token must carry an explicit { light, dark } pair.
    assert.match(name, /^--dsw-/)
    const value = applied[0].tokens[name]
    assert.equal(typeof value.light, 'string')
    assert.equal(typeof value.dark, 'string')
  }
  assert.equal(applied[0].tokens['--dsw-alias-bg-base'].dark, '#12110f')
  assert.equal(applied[0].tokens['--dsw-specific-sidebar-fill'].dark, '#181613')

  skin.setSkinPalette('alabaster')
  assert.equal(applied.length, 2)
  assert.equal(applied[1].tokens['--dsw-alias-bg-base'].light, '#f4f1ea')

  // Going back to "host" removes the layer instead of stacking another one.
  skin.setSkinPalette('host')
  assert.equal(applied.length, 2)
  assert.equal(skin.skinRuntime.applied, null)
  assert.equal(skin.skinSpec('obsidian').mode, 'dark')
  assert.equal(skin.skinSpec('crystal').mode, 'light')
  assert.equal(skin.skinSpec('host'), null)
})
