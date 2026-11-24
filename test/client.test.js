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

function render(states) {
  const { module } = loadClient()
  const registrations = []
  const dictionaries = {}
  module.factory((specifier) => (specifier === 'react-dom' ? { createPortal: (node) => node } : fakeReact(states))).apply(sectionContext(registrations, dictionaries))
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

/** Every string inside an element subtree, in order. */
function deepText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(deepText).join('')
  if (!node || typeof node !== 'object') return ''
  const children = node.props && Array.isArray(node.props.children) ? node.props.children : []
  return children.map(deepText).join('')
}

function optionsOf(select) {
  const children = Array.isArray(select.props.children) ? select.props.children : []
  return children.flat(Infinity).filter((node) => node && node.type === 'option')
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
  'pathDraft', 'pathBusy',
  'login', 'auth', 'ghMessage', 'ghBusy', 'network',
  'workspaceRules', 'workspaceId', 'workspaceText', 'workspaceMessage', 'workspaceBusy',
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
}

/** One `useState` value per hook, in call order. */
function pageStates(overrides) {
  const merged = { ...BASE_PAGE, ...(overrides || {}) }
  return HOOK_ORDER.map((key) => merged[key])
}

function renderPage(overrides) {
  return render(pageStates(overrides)).nodes
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
  assert.match(dockCss[0], /justify-content: flex-end/)
  assert.match(dockCss[0], /--dsh-composer-side-clearance/)
  // No tab-strip slot survives: the pill is no longer appended to the header.
  assert.doesNotMatch(styles[0].textContent, /\.ct-repo-slot/)
  // The main panel is its own scrollport, so the page cannot grow the frame.
  const pageCss = String(styles[0].textContent).match(/\.ct-page \{[^}]*\}/)
  assert.ok(pageCss, 'the panel page keeps its own rule')
  assert.match(pageCss[0], /overflow-y: auto/)
  assert.match(pageCss[0], /flex: 1 1 auto/)
  assert.match(styles[0].textContent, /\.ct-page-inner \{/)
  // The listbox opens upward and flips down only when the room above is gone.
  assert.match(styles[0].textContent, /\.ct-repo-menu\[data-side='down'\]/)
  assert.match(styles[0].textContent, /@keyframes ct-repo-rise/)
  assert.match(styles[0].textContent, /\.ct-repo-option-active/)
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
    ]) {
      assert.ok(keys.includes(key), `${locale} is missing ${key}`)
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

test('the settings page renders five tier buttons and the global rules editor', () => {
  const nodes = renderPage()
  const buttons = nodes.filter((node) => node.type === 'button')
  const tiers = buttons.filter((node) => node.props.role === 'radio')
  assert.equal(tiers.length, 5)
  const selected = tiers.filter((node) => node.props['aria-checked'] === 'true')
  assert.equal(selected.length, 1)
  assert.match(String(selected[0].props.className), /ct-level-on/)

  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas.length, 1)
  // Before the rules fetch resolves there is nothing to save.
  assert.equal(textareas[0].props.disabled, true)
  const save = buttonOf(nodes, 'rulesSave')
  assert.ok(save, 'the rules panel has a save button')
  assert.equal(save.props.disabled, true)
  assert.equal(nodes.some((node) => node.type === 'style'), false, 'the stylesheet is global, not page-scoped')
})

test('the rules editor shows the saved text and enables saving an edit', () => {
  const saved = rulesState('Answer in Chinese.\n')
  const nodes = renderPage({ rules: saved, rulesText: 'Answer in Chinese.\nBe brief.\n' })
  const save = buttonOf(nodes, 'rulesSave')
  assert.ok(save)
  assert.equal(save.props.disabled, false)
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas[0].props.value, 'Answer in Chinese.\nBe brief.\n')
  assert.equal(textareas[0].props.disabled, false)
  const path = 'C:/dsh/AGENTS.md'
  const mentionsPath = nodes.some((node) => Array.isArray(node.props.children)
    && node.props.children.some((child) => typeof child === 'string' && child.includes(path)))
  assert.ok(mentionsPath, 'the panel shows the rules file path')
})

test('an unchanged rules draft keeps saving disabled', () => {
  const saved = rulesState('Answer in Chinese.\n')
  const nodes = renderPage({ rules: saved, rulesText: 'Answer in Chinese.\n' })
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
  const nodes = renderPage({ components: componentsPayload(rows) })
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
  const nodes = renderPage({ components: componentsPayload(rows) })
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
  const nodes = renderPage({ components: componentsPayload(rows) })
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
  const nodes = renderPage({ components: missing })
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
  const nodes = renderPage({
    components: componentsPayload([componentRow('gh', 'missing', { supported: false })]),
  })
  const download = buttonOf(nodes, 'download:gh')
  assert.equal(download.props.disabled, true)
  assert.equal(textOf(download), 'downloadUnsupported')
  assert.equal(deepText(nodes.find((node) => String(node.props.className || '') === 'ct-component-head')), 'GitHub CLIdownloadUnsupported · v2.76.2')
})

test('a PATH-only component offers the same forced download', () => {
  const nodes = renderPage({
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
  const nodes = renderPage({
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
  const nodes = renderPage({
    components: componentsPayload([
      componentRow('python', 'error', { error: 'download failed HTTP 404', percent: 12 }),
    ]),
  })
  assert.equal(textOf(buttonOf(nodes, 'download:python')), 'downloadRetry')
  assert.equal(buttonOf(nodes, 'download:python').props.disabled, false)
  assert.ok(nodes.some((node) => deepText(node).includes('download failed HTTP 404')))
})

test('the component buttons wait for the payload instead of vanishing', () => {
  const nodes = renderPage()
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
  const unchanged = renderPage({ components: componentsPayload([], moved) })
  const input = unchanged.find((node) => node.type === 'input')
  assert.ok(input, 'the panel always renders the directory field')
  assert.equal(input.props.value, 'D:/tools')
  assert.equal(input.props.placeholder, 'C:/dsh/compression-tiers')
  assert.equal(buttonByText(unchanged, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(unchanged, 'toolsPathReset')[0].props.disabled, false)

  const changed = renderPage({ components: componentsPayload([], moved), pathDraft: 'D:/other-tools' })
  assert.equal(buttonByText(changed, 'toolsPathSave')[0].props.disabled, false)
  assert.equal(changed.find((node) => node.type === 'input').props.value, 'D:/other-tools')

  const relative = renderPage({ components: componentsPayload([], moved), pathDraft: 'tools' })
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
  const nodes = renderPage({ components: componentsPayload([], running) })
  assert.equal(buttonByText(nodes, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(nodes, 'toolsPathReset')[0].props.disabled, true)
  assert.ok(deepText({ props: { children: nodes } }).includes('toolsPathRunning'))
})

test('the location block waits for its status instead of showing a wrong path', () => {
  const nodes = renderPage()
  assert.equal(buttonByText(nodes, 'toolsPathSave')[0].props.disabled, true)
  assert.equal(buttonByText(nodes, 'toolsPathReset')[0].props.disabled, true)
  assert.equal(nodes.find((node) => node.type === 'input').props.value, '')
})

test('the sign-in buttons are always rendered and disabled while idle', () => {
  const nodes = renderPage({ login: idleLogin, auth: authState })
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
  const nodes = renderPage({ login: active, auth: authState })
  assert.equal(textOf(nodes.find((node) => node.type === 'code')), 'ABCD-1234')
  for (const key of ['ghCopy', 'ghOpenDevice', 'ghCancel']) {
    const buttons = buttonByText(nodes, key)
    assert.equal(buttons.length, 1)
    assert.equal(buttons[0].props.disabled, false, `${key} is usable during the flow`)
  }
})

test('the sign-in panel shows the account and never a download button', () => {
  const auth = { available: true, authenticated: true, account: 'Homer4033', path: 'C:/dsh/compression-tiers/gh/bin/gh.exe', version: '2.76.2' }
  const nodes = renderPage({
    components: componentsPayload([componentRow('gh', 'installed', { path: 'C:/dsh/compression-tiers/gh/bin/gh.exe' })]),
    login: idleLogin,
    auth,
  })
  const texts = nodes
    .filter((node) => typeof node.type === 'string')
    .flatMap((node) => (Array.isArray(node.props.children) ? node.props.children : []))
    .filter((child) => typeof child === 'string')
  assert.ok(texts.some((text) => text.includes('Homer4033')))
  assert.ok(texts.some((text) => text.includes('2.76.2')))
  assert.ok(texts.some((text) => text.includes('C:/dsh/compression-tiers/gh/bin/gh.exe')))
  // The binary install moved to the component panel: exactly one download
  // button for gh, and it is the row's, not the sign-in panel's.
  const downloads = nodes.filter((node) => node.type === 'button' && String(node.props['data-action'] || '').startsWith('download:'))
  assert.deepEqual(downloads.map((node) => node.props['data-action']), ['download:gh', 'download:git', 'download:ffmpeg', 'download:python'])
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
  const dock = nodes.find((node) => String(node.props.className || '') === 'ct-repo-dock')
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
  const menu = nodes.find((node) => String(node.props.className || '') === 'ct-repo-menu')
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
  const options = nodes.filter((node) => String(node.props.className || '').split(' ').includes('ct-repo-option'))
  assert.deepEqual(options.map((option) => option.props['aria-selected']), ['false', 'true', 'false'])
  assert.deepEqual(options.map((option) => option.props.id), ['ct-repo-option-0', 'ct-repo-option-1', 'ct-repo-option-2'])
  assert.match(String(options[1].props.className), /ct-repo-option-active/)
  assert.doesNotMatch(String(options[0].props.className), /ct-repo-option-active/)
  assert.deepEqual(options.map((option) => deepText(option)), [
    'repoNone',
    '✓Homer4033/dsh-compression-tiers',
    'Homer4033/private-notesrepoPrivate',
  ])
})

test('the listbox drops downward only when the room above is gone', () => {
  const nodes = renderDock([[], '', '', false, true, 0], { sessionId: 'session-down', t: (key) => key },
    [null, null, { up: false, top: 300, left: 8, width: 288, maxHeight: 200 }, true])
  const menu = nodes.find((node) => String(node.props.className || '') === 'ct-repo-menu')
  assert.equal(menu.props['data-side'], 'down')
  assert.equal(menu.props.style.top, '300px')
  assert.equal(menu.props.style.bottom, undefined)
})

test('the repository listbox is titled and separates "no repository"', () => {
  const repos = [{ nameWithOwner: 'Homer4033/one', private: false }]
  const nodes = renderDock([repos, '', '', false, true, null], { sessionId: 'session-menu', t: (key) => key })
  const head = nodes.find((node) => String(node.props.className || '') === 'ct-repo-menu-head')
  assert.ok(head, 'the listbox renders a title line')
  assert.equal(head.props.role, 'presentation')
  assert.equal(textOf(head), 'repoSelectLabel')
  const order = nodes
    .filter((node) => ['ct-repo-menu-head', 'ct-repo-sep', 'ct-repo-option'].includes(String(node.props.className || '').split(' ')[0]))
    .map((node) => String(node.props.className || '').split(' ')[0])
  assert.deepEqual(order, ['ct-repo-menu-head', 'ct-repo-option', 'ct-repo-sep', 'ct-repo-option'])
})

test('a retired binding stays selectable; a closed pill renders no listbox', () => {
  const retired = renderDock([[], 'Homer4033/retired', '', false, true, null], { sessionId: 'session-b', t: (key) => key })
  const options = retired.filter((node) => String(node.props.className || '').split(' ').includes('ct-repo-option'))
  assert.deepEqual(options.map((option) => deepText(option)), ['repoNone', '✓Homer4033/retired'])
  const closed = renderDock([[], '', '', false, false, null], { sessionId: 'session-b', t: (key) => key })
  assert.equal(closed.some((node) => String(node.props.className || '') === 'ct-repo-menu'), false)
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
  const nodes = renderPage({
    workspaceRules: workspaceRulesPayload([workspaceOne, second]),
    workspaceId: 'w1',
    workspaceText: 'Keep it short.\n',
  })
  const headings = nodes.filter((node) => node.type === 'h3').map((node) => textOf(node))
  assert.deepEqual(headings, ['rulesTitle', 'workspaceRulesTitle', 'componentsTitle', 'ghAuthTitle'])
  const select = nodes.find((node) => node.type === 'select')
  assert.ok(select, 'the block has a workspace picker')
  assert.equal(select.props.value, 'w1')
  assert.deepEqual(optionsOf(select).map((option) => option.props.value), ['w1', 'w2'])
  assert.deepEqual(optionsOf(select).map((option) => textOf(option)), ['压缩上下文', '红利量化'])
  // Two textareas: the global rules and the selected workspace's rules.
  const textareas = nodes.filter((node) => node.type === 'textarea')
  assert.equal(textareas.length, 2)
  assert.equal(textareas[1].props.value, 'Keep it short.\n')
  assert.equal(textareas[1].props.disabled, false)
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
  const nodes = renderPage({
    workspaceRules: workspaceRulesPayload([second]),
    workspaceId: 'w2',
    workspaceText: 'Only touch src/.\n',
  })
  assert.equal(buttonOf(nodes, 'workspaceRulesSave').props.disabled, false)
  assert.ok(deepText({ props: { children: nodes } }).includes('workspaceRulesMissing'))
})

test('no registered workspace hides the workspace rules block entirely', () => {
  for (const workspaceRules of [null, workspaceRulesPayload([])]) {
    const nodes = renderPage({ workspaceRules })
    const headings = nodes.filter((node) => node.type === 'h3').map((node) => textOf(node))
    assert.deepEqual(headings, ['rulesTitle', 'componentsTitle', 'ghAuthTitle'])
    assert.equal(nodes.some((node) => node.type === 'select'), false)
    assert.equal(nodes.filter((node) => node.type === 'textarea').length, 1)
    assert.equal(buttonOf(nodes, 'workspaceRulesSave'), null)
  }
})

test('the page renders the tiers, the rules and one component panel', () => {
  const nodes = renderPage({ components: componentsPayload([]) })
  const headings = nodes.filter((node) => node.type === 'h3').map((node) => textOf(node))
  assert.deepEqual(headings, ['rulesTitle', 'componentsTitle', 'ghAuthTitle'])
  // One input (the download directory) and one textarea (the rules).
  assert.equal(nodes.filter((node) => node.type === 'input').length, 1)
  assert.equal(optionsOf(nodes.find((node) => node.type === 'select') || { props: { children: [] } }).length, 0)
})
