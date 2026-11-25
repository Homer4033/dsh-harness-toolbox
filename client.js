window.__ModuleLoader__.load({
  id: 'dsh-harness-toolbox',
  factory(require) {
    const React = require('react')
    let ReactDOM = null
    try {
      ReactDOM = require('react-dom')
    } catch {
      ReactDOM = null
    }
    const h = React.createElement
    const NS = 'compressionTiers'
    const LEVELS = ['gentle', 'light', 'standard', 'aggressive', 'max']
    const API = '/compression-tiers/api/settings'
    const RULES_API = '/compression-tiers/api/rules'
    const WORKSPACE_RULES_API = '/compression-tiers/api/workspace-rules'
    const GH_API = '/compression-tiers/api/github'
    const GH_AUTH_API = '/compression-tiers/api/github/auth'
    const GH_NETWORK_API = '/compression-tiers/api/github/network'
    const GH_ONLINE_API = '/compression-tiers/api/github/online'
    const GH_BINDING_API = '/compression-tiers/api/github/binding'
    const COMPONENTS_API = '/compression-tiers/api/components'
    const TOOLS_API = '/compression-tiers/api/tools'
    const VENDOR_BASE = '/compression-tiers/vendor/'
    const PLUGIN_VERSION = '2.4.8'
    const PALETTES = [
      { id: 'host', labelKey: 'paletteHost' },
      { id: 'obsidian', labelKey: 'paletteObsidian' },
      { id: 'crystal', labelKey: 'paletteCrystal' },
    ]
    const MOTIONS = [
      { id: 'full', labelKey: 'motionFull' },
      { id: 'subtle', labelKey: 'motionSubtle' },
      { id: 'off', labelKey: 'motionOff' },
    ]
    const DEFAULT_APPEARANCE = { palette: 'host', motion: 'full', mascots: true, art: true }

    /**
     * Whole-app skins, as opposed to this plugin's own `.ct-skin` surfaces.
     *
     * DSH's theme service composes `overrideTokens(source, tokens)` layers on top
     * of the active theme and its presenter writes them as inline CSS variables
     * on <body> — so a palette here repaints the sidebar, message bubbles, the
     * composer, menus, cards and code blocks, not just our panel. Every value
     * must be a { light, dark } pair because the service rejects bare strings:
     * a single value goes illegible the moment the user flips the colour scheme.
     *
     * The palettes are a structural ramp plus a tint (see `SKIN_TINTS`). Every
     * palette ships both modes and the host service picks the one matching the
     * active theme, so nothing here decides light or dark for the user.
     */
    const SKIN_FAMILIES = {
      cool: {
        dark: {
          '--dsw-alias-bg-base': '#0a0a0c',
          '--dsw-alias-bg-layer-1': '#101013',
          '--dsw-alias-bg-layer-2': '#17171b',
          '--dsw-alias-bg-layer-3': '#202026',
          '--dsw-alias-bg-module-platform': '#292930',
          '--dsw-alias-bg-overlay': 'rgba(8, 8, 11, 0.72)',
          '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.28)',
          '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.44)',
          '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.6)',
          '--dsw-alias-bg-skeleton': '#1d1d22',
          '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.06)',
          '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.1)',
          '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.18)',
          '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.26)',
          '--dsw-alias-border-selected': '#8fa6ff',
          '--dsw-alias-label-primary': '#f4f5f9',
          '--dsw-alias-label-secondary': '#c3c8d4',
          '--dsw-alias-label-tertiary': '#8a91a0',
          '--dsw-alias-label-caption': '#7b8494',
          '--dsw-alias-label-dimmed': '#6c7484',
          '--dsw-alias-label-on-color': '#0a0a0c',
          '--dsw-alias-link': '#8fb4ff',
          '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.08)',
          '--dsw-alias-interactive-bg-active': 'rgba(255, 255, 255, 0.12)',
          '--dsw-alias-interactive-bg-hover-solid': '#2a2a31',
          '--dsw-alias-button-primary-fill': '#6f9bff',
          '--dsw-alias-button-primary-hover': '#86adff',
          '--dsw-alias-button-contrast-fill': '#f4f5f9',
          '--dsw-alias-button-elevated-fill': '#26262c',
          '--dsw-alias-button-tool-bar-fill': 'rgba(255, 255, 255, 0.06)',
          '--dsw-alias-button-tool-bar-hover': 'rgba(255, 255, 255, 0.12)',
          '--dsw-alias-card-fill': 'rgba(32, 32, 38, 0.66)',
          '--dsw-alias-card-fill-hover': 'rgba(41, 41, 48, 0.78)',
          '--dsw-alias-settings-card-fill': 'rgba(23, 23, 27, 0.72)',
          '--dsw-alias-settings-card-stroke': 'rgba(255, 255, 255, 0.14)',
          '--dsw-alias-menu-group-header-fill': 'rgba(255, 255, 255, 0.04)',
          '--dsw-alias-state-business-primary': '#6f9bff',
          '--dsw-alias-state-success-primary': '#4ec9a0',
          '--dsw-alias-state-success-secondary': 'rgba(78, 201, 160, 0.16)',
          '--dsw-alias-state-warn-primary': '#f0b45c',
          '--dsw-alias-state-warn-secondary': 'rgba(240, 180, 92, 0.16)',
          '--dsw-alias-state-error-primary': '#ff7b72',
          '--dsw-alias-state-error-secondary': 'rgba(255, 123, 114, 0.16)',
          '--dsw-alias-state-done-primary': '#6f9bff',
          '--dsw-alias-state-idle-primary': '#8a91a0',
          '--dsw-alias-chart-system': '#6f9bff',
          '--dsw-alias-chart-tools': '#b18cff',
          '--dsw-alias-chart-messages': '#5fd0c8',
          '--dsw-alias-markdown-code-block': '#101013',
          '--dsw-alias-markdown-code-block-banner': '#1a1a1f',
          '--dsw-alias-markdown-inline-code': 'rgba(255, 255, 255, 0.08)',
          '--dsw-alias-markdown-citation': 'rgba(111, 155, 255, 0.16)',
          '--dsw-alias-markdown-tag': 'rgba(255, 255, 255, 0.08)',
          '--dsw-specific-sidebar-fill': '#101013',
          '--dsw-specific-sidebar-glass-fill': 'rgba(23, 23, 27, 0.7)',
          '--dsw-specific-sidebar-glass-hover': 'rgba(32, 32, 38, 0.82)',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(111, 155, 255, 0.16)',
          '--dsw-specific-sidebar-nav-item-active-accent': '#6f9bff',
          '--dsw-specific-sidebar-tint': 'rgba(111, 155, 255, 0.06)',
          '--dsw-specific-bubble': 'rgba(32, 32, 38, 0.92)',
          '--dsw-specific-bubble-highlight': 'rgba(255, 255, 255, 0.06)',
          '--dsw-specific-menu': '#202026',
          '--dsw-specific-input-major': '#17171b',
          '--dsw-specific-selector': '#202026',
          '--dsw-specific-tip': 'rgba(255, 255, 255, 0.06)',
          '--dsw-alias-tooltip-bg': '#2b2b33',
          '--dsw-alias-tooltip-label': '#f4f5f9',
          '--dsw-alias-tooltip-key-bg': 'rgba(255, 255, 255, 0.1)',
          '--dsw-alias-toast-bg': '#2b2b33',
          '--dsw-alias-toast-label': '#f4f5f9',
          '--dsw-alias-toast-action': '#8fb4ff',
          '--dsw-alias-scrollbar-bg-l1': 'rgba(255, 255, 255, 0.06)',
          '--dsw-alias-scrollbar-hover-l1': 'rgba(255, 255, 255, 0.18)',
          '--dsw-focus-ring-color': '#8fa6ff',
          '--dsw-elevation-panel': '0 28px 64px rgba(0, 0, 0, 0.5)',
          '--dsw-elevation-prominent': '0 20px 48px rgba(0, 0, 0, 0.45)',
          '--dsw-elevation-soft': '0 8px 24px rgba(0, 0, 0, 0.32)',
          '--dsw-elevation-stroke': '1px solid rgba(255, 255, 255, 0.14)',
        },
        light: {
          '--dsw-alias-bg-base': '#e6edf6',
          '--dsw-alias-bg-layer-1': '#eef4fb',
          '--dsw-alias-bg-layer-2': '#f7fafd',
          '--dsw-alias-bg-layer-3': '#ffffff',
          '--dsw-alias-bg-module-platform': '#e1eaf6',
          '--dsw-alias-bg-overlay': 'rgba(244, 247, 252, 0.82)',
          '--dsw-alias-bg-mask-1': 'rgba(23, 40, 64, 0.12)',
          '--dsw-alias-bg-mask-2': 'rgba(23, 40, 64, 0.2)',
          '--dsw-alias-bg-mask-3': 'rgba(23, 40, 64, 0.32)',
          '--dsw-alias-bg-skeleton': '#dfe7f2',
          '--dsw-alias-border-l1': 'rgba(23, 40, 64, 0.08)',
          '--dsw-alias-border-l2': 'rgba(23, 40, 64, 0.14)',
          '--dsw-alias-border-l3': 'rgba(23, 40, 64, 0.24)',
          '--dsw-alias-border-l4': 'rgba(23, 40, 64, 0.32)',
          '--dsw-alias-border-selected': '#2f6fed',
          '--dsw-alias-label-primary': '#142033',
          '--dsw-alias-label-secondary': '#40516a',
          '--dsw-alias-label-tertiary': '#697a93',
          '--dsw-alias-label-caption': '#77879d',
          '--dsw-alias-label-dimmed': '#8a99ad',
          '--dsw-alias-label-on-color': '#ffffff',
          '--dsw-alias-link': '#2563eb',
          '--dsw-alias-interactive-bg-hover': 'rgba(23, 40, 64, 0.07)',
          '--dsw-alias-interactive-bg-active': 'rgba(23, 40, 64, 0.11)',
          '--dsw-alias-interactive-bg-hover-solid': '#e4ebf5',
          '--dsw-alias-button-primary-fill': '#2f6fed',
          '--dsw-alias-button-primary-hover': '#4a84f2',
          '--dsw-alias-button-contrast-fill': '#142033',
          '--dsw-alias-button-elevated-fill': '#ffffff',
          '--dsw-alias-button-tool-bar-fill': 'rgba(23, 40, 64, 0.05)',
          '--dsw-alias-button-tool-bar-hover': 'rgba(23, 40, 64, 0.1)',
          '--dsw-alias-card-fill': 'rgba(255, 255, 255, 0.72)',
          '--dsw-alias-card-fill-hover': '#ffffff',
          '--dsw-alias-settings-card-fill': 'rgba(255, 255, 255, 0.8)',
          '--dsw-alias-settings-card-stroke': 'rgba(23, 40, 64, 0.16)',
          '--dsw-alias-menu-group-header-fill': 'rgba(23, 40, 64, 0.04)',
          '--dsw-alias-state-business-primary': '#2f6fed',
          '--dsw-alias-state-success-primary': '#0f9d8a',
          '--dsw-alias-state-success-secondary': 'rgba(15, 157, 138, 0.14)',
          '--dsw-alias-state-warn-primary': '#b45309',
          '--dsw-alias-state-warn-secondary': 'rgba(180, 83, 9, 0.14)',
          '--dsw-alias-state-error-primary': '#c02626',
          '--dsw-alias-state-error-secondary': 'rgba(192, 38, 38, 0.14)',
          '--dsw-alias-state-done-primary': '#2f6fed',
          '--dsw-alias-state-idle-primary': '#697a93',
          '--dsw-alias-chart-system': '#2f6fed',
          '--dsw-alias-chart-tools': '#7c5cff',
          '--dsw-alias-chart-messages': '#0f9d8a',
          '--dsw-alias-markdown-code-block': '#f1f5fb',
          '--dsw-alias-markdown-code-block-banner': '#e7eef8',
          '--dsw-alias-markdown-inline-code': 'rgba(23, 40, 64, 0.06)',
          '--dsw-alias-markdown-citation': 'rgba(47, 111, 237, 0.12)',
          '--dsw-alias-markdown-tag': 'rgba(23, 40, 64, 0.06)',
          '--dsw-specific-sidebar-fill': '#eaf0f8',
          '--dsw-specific-sidebar-glass-fill': 'rgba(255, 255, 255, 0.62)',
          '--dsw-specific-sidebar-glass-hover': 'rgba(255, 255, 255, 0.82)',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(47, 111, 237, 0.12)',
          '--dsw-specific-sidebar-nav-item-active-accent': '#2f6fed',
          '--dsw-specific-sidebar-tint': 'rgba(47, 111, 237, 0.06)',
          '--dsw-specific-bubble': 'rgba(255, 255, 255, 0.94)',
          '--dsw-specific-bubble-highlight': 'rgba(23, 40, 64, 0.05)',
          '--dsw-specific-menu': '#ffffff',
          '--dsw-specific-input-major': '#f7fafd',
          '--dsw-specific-selector': '#ffffff',
          '--dsw-specific-tip': 'rgba(23, 40, 64, 0.05)',
          '--dsw-alias-tooltip-bg': '#142033',
          '--dsw-alias-tooltip-label': '#f7fafd',
          '--dsw-alias-tooltip-key-bg': 'rgba(255, 255, 255, 0.14)',
          '--dsw-alias-toast-bg': '#142033',
          '--dsw-alias-toast-label': '#f7fafd',
          '--dsw-alias-toast-action': '#8fb4ff',
          '--dsw-alias-scrollbar-bg-l1': 'rgba(23, 40, 64, 0.16)',
          '--dsw-alias-scrollbar-hover-l1': 'rgba(23, 40, 64, 0.3)',
          '--dsw-focus-ring-color': '#2f6fed',
          '--dsw-elevation-panel': '0 26px 56px rgba(31, 54, 93, 0.16)',
          '--dsw-elevation-prominent': '0 20px 44px rgba(31, 54, 93, 0.14)',
          '--dsw-elevation-soft': '0 8px 22px rgba(31, 54, 93, 0.1)',
          '--dsw-elevation-stroke': '1px solid rgba(23, 40, 64, 0.18)',
        },
      },
    }
    /**
     * 深空黑曜 and 白昼冷晶 share the structural ramp above — near-black slate
     * when the host is dark, cool paper when it is light — and differ by tint:
     * obsidian is the ramp as authored (indigo accent), crystal runs the same
     * ramp colder (ice-cyan accent, blue-cast surfaces). Neither palette pins a
     * scheme, which is the 2.2.0 change: both install a light and a dark set and
     * the host picks, so a palette survives the user flipping DSH's theme.
     */
    const SKIN_TINTS = {
      obsidian: { dark: {}, light: {} },
      crystal: {
        dark: {
          '--dsw-alias-bg-base': '#070b12',
          '--dsw-alias-bg-layer-1': '#0b1119',
          '--dsw-alias-bg-layer-2': '#111925',
          '--dsw-alias-bg-layer-3': '#182333',
          '--dsw-alias-bg-module-platform': '#1f2a38',
          '--dsw-alias-bg-skeleton': '#141d29',
          '--dsw-alias-border-l3': 'rgba(196, 228, 255, 0.2)',
          '--dsw-alias-border-l4': 'rgba(196, 228, 255, 0.28)',
          '--dsw-alias-border-selected': '#7ad6ff',
          '--dsw-alias-label-primary': '#eef7ff',
          '--dsw-alias-label-secondary': '#b8ccdd',
          '--dsw-alias-label-tertiary': '#8299ac',
          '--dsw-alias-label-on-color': '#070b12',
          '--dsw-alias-link': '#8ad9ff',
          '--dsw-alias-interactive-bg-hover-solid': '#1d2839',
          '--dsw-alias-button-primary-fill': '#3fb4ec',
          '--dsw-alias-button-primary-hover': '#5ec8ff',
          '--dsw-alias-button-elevated-fill': '#1c2736',
          '--dsw-alias-state-business-primary': '#48c6f5',
          '--dsw-alias-state-done-primary': '#48c6f5',
          '--dsw-alias-state-success-primary': '#4fd6c0',
          '--dsw-alias-state-success-secondary': 'rgba(79, 214, 192, 0.16)',
          '--dsw-alias-chart-system': '#48c6f5',
          '--dsw-alias-chart-tools': '#9db8ff',
          '--dsw-alias-chart-messages': '#5fe3d0',
          '--dsw-alias-markdown-code-block': '#0b1119',
          '--dsw-alias-markdown-code-block-banner': '#131d2a',
          '--dsw-alias-markdown-citation': 'rgba(72, 198, 245, 0.16)',
          '--dsw-specific-sidebar-fill': '#0b1119',
          '--dsw-specific-sidebar-glass-fill': 'rgba(17, 25, 37, 0.7)',
          '--dsw-specific-sidebar-glass-hover': 'rgba(24, 35, 51, 0.82)',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(72, 198, 245, 0.16)',
          '--dsw-specific-sidebar-nav-item-active-accent': '#48c6f5',
          '--dsw-specific-sidebar-tint': 'rgba(72, 198, 245, 0.06)',
          '--dsw-specific-bubble': 'rgba(24, 35, 51, 0.92)',
          '--dsw-specific-menu': '#182333',
          '--dsw-specific-input-major': '#111925',
          '--dsw-specific-selector': '#182333',
          '--dsw-alias-tooltip-bg': '#1f2a38',
          '--dsw-alias-toast-bg': '#1f2a38',
          '--dsw-alias-toast-action': '#8ad9ff',
          '--dsw-focus-ring-color': '#7ad6ff',
          '--dsw-elevation-stroke': '1px solid rgba(196, 228, 255, 0.16)',
        },
        light: {
          '--dsw-alias-bg-base': '#eef6ff',
          '--dsw-alias-bg-layer-1': '#f5faff',
          '--dsw-alias-bg-layer-2': '#fbfdff',
          '--dsw-alias-bg-layer-3': '#ffffff',
          '--dsw-alias-bg-module-platform': '#e4effc',
          '--dsw-alias-bg-skeleton': '#e7f1fc',
          '--dsw-alias-border-selected': '#0f96c8',
          '--dsw-alias-link': '#0a76a8',
          '--dsw-alias-interactive-bg-hover-solid': '#e2f0fb',
          '--dsw-alias-button-primary-fill': '#0f96c8',
          '--dsw-alias-button-primary-hover': '#28b0e0',
          '--dsw-alias-state-business-primary': '#0f96c8',
          '--dsw-alias-state-done-primary': '#0f96c8',
          '--dsw-alias-state-success-primary': '#0d9a86',
          '--dsw-alias-state-success-secondary': 'rgba(13, 154, 134, 0.14)',
          '--dsw-alias-chart-system': '#0f96c8',
          '--dsw-alias-chart-tools': '#6f7cff',
          '--dsw-alias-chart-messages': '#0e9f8f',
          '--dsw-alias-markdown-code-block': '#f2f9ff',
          '--dsw-alias-markdown-code-block-banner': '#e8f3fd',
          '--dsw-alias-markdown-citation': 'rgba(15, 150, 200, 0.12)',
          '--dsw-specific-sidebar-fill': '#f0f7ff',
          '--dsw-specific-sidebar-glass-fill': 'rgba(255, 255, 255, 0.62)',
          '--dsw-specific-sidebar-glass-hover': 'rgba(255, 255, 255, 0.82)',
          '--dsw-specific-sidebar-nav-item-active': 'rgba(15, 150, 200, 0.13)',
          '--dsw-specific-sidebar-nav-item-active-accent': '#0f96c8',
          '--dsw-specific-sidebar-tint': 'rgba(15, 150, 200, 0.06)',
          '--dsw-specific-bubble': 'rgba(255, 255, 255, 0.94)',
          '--dsw-specific-menu': '#fbfdff',
          '--dsw-specific-input-major': '#f5faff',
          '--dsw-specific-selector': '#fbfdff',
          '--dsw-alias-tooltip-bg': '#0b2b3f',
          '--dsw-alias-toast-bg': '#0b2b3f',
          '--dsw-alias-toast-action': '#7fd0ff',
          '--dsw-focus-ring-color': '#0f96c8',
          '--dsw-elevation-stroke': '1px solid rgba(12, 60, 90, 0.18)',
        },
      },
    }
    const SKIN_PALETTES = {
      obsidian: { family: 'cool', tint: 'obsidian' },
      crystal: { family: 'cool', tint: 'crystal' },
    }

    /** One palette as the { light, dark } pairs the theme service requires. */
    function skinSpec(palette) {
      const meta = SKIN_PALETTES[palette]
      if (!meta) return null
      const family = SKIN_FAMILIES[meta.family]
      const tint = SKIN_TINTS[meta.tint] || { dark: {}, light: {} }
      const tokens = {}
      for (const name of Object.keys(family.dark)) {
        tokens[name] = {
          light: tint.light[name] || family.light[name],
          dark: tint.dark[name] || family.dark[name],
        }
      }
      return { id: palette, tokens }
    }

    /**
     * The theme service is optional: when it is missing (older host) this plugin
     * still works, only the whole-app repaint is skipped. `overrideTokens` is
     * imperative and returns its own disposer, so the runtime keeps one layer at
     * a time and swaps it when the palette changes.
     */
    const skinRuntime = { theme: null, palette: DEFAULT_APPEARANCE.palette, applied: null, dispose: null }

    function dropSkin() {
      const dispose = skinRuntime.dispose
      skinRuntime.dispose = null
      skinRuntime.applied = null
      if (typeof dispose === 'function') {
        try { dispose() } catch { /* the host may already be gone */ }
      }
    }

    function paintSkin() {
      const theme = skinRuntime.theme
      if (!theme || typeof theme.overrideTokens !== 'function') return
      if (skinRuntime.applied === skinRuntime.palette) return
      dropSkin()
      const spec = skinSpec(skinRuntime.palette)
      if (!spec) return
      try {
        skinRuntime.dispose = theme.overrideTokens('compression-tiers', spec.tokens)
        skinRuntime.applied = spec.id
      } catch {
        // A rejected layer must not take the panel down with it.
        skinRuntime.dispose = null
        skinRuntime.applied = null
      }
    }

    /** Repaint the whole app for a palette; `host` drops our layer. */
    function setSkinPalette(palette) {
      const next = normalizeAppearance({ palette }).palette
      if (next === skinRuntime.palette) return
      skinRuntime.palette = next
      paintSkin()
    }

    /**
     * The theme art (background wash, bubbles, hairlines, slim scrollbars) is
     * painted by our own stylesheet, so it needs a hook on <body>: which palette
     * is on, and whether the art layer is allowed. Both live under `data-ct-*`
     * so they cannot collide with a host attribute, and both are inert for the
     * `host` palette — the official look is never repainted from underneath.
     */
    function applyOptics(appearance) {
      if (typeof document === 'undefined' || !document.body
        || typeof document.body.setAttribute !== 'function') return null
      const spec = normalizeAppearance(appearance)
      // The art layer is its own switch: the palette only decides which tokens the
      // art is drawn with, so host keeps DSH's colours and still gets the
      // wash/bubbles/glow. Only the explicit art-off switch turns it off.
      const art = spec.art !== false
      document.body.setAttribute('data-ct-palette', spec.palette)
      document.body.setAttribute('data-ct-art', art ? 'on' : 'off')
      document.body.setAttribute('data-ct-motion', spec.motion)
      return { palette: spec.palette, art: art }
    }

    /**
     * A palette never moves the host theme: both install every mode, so flipping
     * DSH's light/dark keeps the chosen skin instead of fighting it.
     */
    // The two UMD modules vendored from Obsidian Prism. A classic <script>
    // tag keeps client.js from having to carry 300KB or use eval; the vial
    // only loads when its window opens, the rig when the dock renders.
    const VENDOR_SCRIPTS = {
      vial: { file: 'vial-core.js', global: '__agVialCore', pending: null },
      mascot: { file: 'dual-mascot-rig.js', global: '__agDualMascotRig', pending: null },
    }
    // Host context budget: the same 65,536-token reserve the official
    // compaction-basic engine applies.
    const CONTEXT_HEADROOM = 65536

    /**
     * The rows the component panel always renders, in this order. The payload
     * fills in state, path and progress; the list itself is fixed so a slow or
     * failed load still shows every button (disabled) instead of an empty panel.
     */
    const COMPONENT_ROWS = [
      { id: 'gh', name: 'GitHub CLI' },
      { id: 'git', name: 'git' },
      { id: 'ffmpeg', name: 'ffmpeg' },
      { id: 'python', name: 'Python' },
    ]

    /**
     * The panel is a small shell: one navigation rail, one page at a time.
     * Every page stays in the rail even before its data arrives; the page
     * itself says what is missing.
     */
    const SECTIONS = [
      { id: 'levels', navLabel: 'navLevels', icon: 'M3 4.5h10M3 8h7M3 11.5h4' },
      { id: 'rules', navLabel: 'navRules', icon: 'M4 2.5h5.5L12.5 5.5v8H4zM9.5 2.5v3h3M6 8h4M6 10.5h3' },
      { id: 'components', navLabel: 'navComponents', icon: 'M6 2.5h4v3H6zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z' },
      { id: 'appearance', navLabel: 'navAppearance', icon: 'M8 2.5a5.5 5.5 0 1 0 5.5 5.5c0-1.2-.4-2.3-1-3.2-.5.9-1.4 1.5-2.4 1.5-1.5 0-2.7-1.2-2.7-2.7 0-.4.1-.8.2-1.1zM8 13.5a4 4 0 0 1 0-8' },
      { id: 'github', navLabel: 'navGithub', icon: 'M8 2.5a5.5 5.5 0 0 0-1.7 10.7c.3.1.4-.1.4-.3v-1c-1.5.3-1.9-.7-1.9-.7-.2-.6-.6-.8-.6-.8-.5-.3 0-.3 0-.3.5 0 .8.5.8.5.5.9 1.3.6 1.6.5 0-.4.2-.6.3-.7-1.2-.1-2.5-.6-2.5-2.7 0-.6.2-1.1.5-1.5-.1-.1-.2-.7 0-1.4 0 0 .5-.2 1.5.5a5 5 0 0 1 2.8 0c1-.7 1.5-.5 1.5-.5.3.7.1 1.3.1 1.4.3.4.5.9.5 1.5 0 2.1-1.3 2.6-2.5 2.7.2.2.4.5.4 1v1.5c0 .2.1.4.4.3A5.5 5.5 0 0 0 8 2.5z' },
    ]

    const DICTIONARIES = {
      zh: {
        sectionLabel: '压缩分档',
        title: '压缩分档与综合工作台',
        levelsAria: '压缩档位',
        navAria: '面板分页',
        navLevels: '档位',
        navRules: '规则',
        navComponents: '组件',
        navAppearance: '外观',
        navGithub: 'GitHub',
        appearanceTitle: '外观',
        paletteLabel: '配色',
        paletteHost: '跟随宿主',
        paletteObsidian: '深空黑曜',
        paletteCrystal: '白昼冷晶',
        motionLabel: '动效',
        motionFull: '完整',
        motionSubtle: '克制',
        motionOff: '关闭',
        mascotsLabel: '像素伙伴',
        mascotsOn: '已开启',
        mascotsOff: '已关闭',
        artLabel: '光学外观',
        artOn: '已开启',
        artOff: '已关闭',
        artHost: '选一套配色后生效',
        appearanceApplied: '已应用。',
        appearanceFailed: '保存失败：',
        vialTitle: '上下文试管',
        vialAria: '上下文占用',
        vialUsed: '已用',
        vialWindow: '窗口',
        vialThreshold: '压缩阈值',
        vialRetain: '保留原文',
        vialUntil: '距阈值',
        vialLevel: '当前档位',
        vialSystem: '系统',
        vialTools: '工具',
        vialMessages: '对话',
        vialUsage: '本会话用量',
        vialUsageCache: '缓存命中',
        vialUsageSpeed: '生成速度',
        vialUsageTurns: '轮 / 步',
        vialUnavailable: '读不到上下文用量',
        vialLoading: '读取中…',
        vialClose: '关闭',
        effortAria: '推理等级',
        effortFailed: '切换失败：',
        levelsTitle: '档位',
        ghScopesLabel: '授权范围',
        ghScopesNone: '未报告',
        levelGentle: '极轻',
        levelLight: '轻量',
        levelStandard: '标准',
        levelAggressive: '积极',
        levelMax: '最大',
        auto: '自动 ',
        retain: '留 ',
        sep: '：',
        currentLabel: '当前档位',
        applying: '正在切换…',
        applied: '已切换为',
        loadFailed: '读取设置失败：',
        applyFailed: '切换失败：',
        loading: '正在读取…',
        engines: '压缩引擎',
        lastCompact: '上次压缩',
        never: '暂无',
        settingsPath: '设置文件',
        rulesTitle: '全局规则',
        rulesLabel: '规则内容',
        rulesPlaceholder: '例如：回答用中文；改动前先读 AGENTS.md。',
        rulesSave: '保存',
        rulesSaving: '保存中…',
        rulesSaved: '已保存。',
        rulesLoadFailed: '读取失败：',
        rulesSaveFailed: '保存失败：',
        rulesChars: '字符',
        rulesPathLabel: '文件',
        rulesLoading: '读取中…',
        rulesMissing: '不存在，保存后创建。',
        workspaceRulesTitle: '工作区规则',
        workspaceNone: '目前无工作区',
        workspaceSelectLabel: '工作区',
        workspaceRulesLabel: '补充规则（置于 AGENTS.md 开头）',
        workspaceRulesPlaceholder: '例如：本工作区只改 src/；提交前跑测试。',
        workspaceRulesMissing: '不存在，保存后创建。',
        workspaceRulesLoadFailed: '读取失败：',
        workspaceRulesSaveFailed: '保存失败：',
        workspaceRulesSaved: '已保存。',
        componentsTitle: '组件管理',
        componentsLoadFailed: '读取组件状态失败：',
        componentsActionFailed: '操作失败：',
        toolsPathLabel: '下载目录',
        toolsPathCurrent: '当前目录',
        toolsPathSave: '迁移',
        toolsPathReset: '恢复默认',
        toolsPathSaved: '已迁移。',
        toolsPathInvalid: '需要绝对路径。',
        toolsPathRunning: '下载中，完成后再迁移。',
        toolsPathFailed: '迁移失败：',
        ghAuthTitle: 'GitHub 登录',
        probe: '重新检测',
        downloadIdle: '下载',
        downloadKeep: '重新下载',
        downloadContinue: '继续下载',
        downloadRetry: '重试',
        downloadRunning: '下载中 ',
        downloadDone: '已安装',
        downloadUnsupported: '当前系统不可用',
        stateMissing: '未安装',
        statePartial: '未完成，可续传',
        stateFailed: '下载失败',
        stateSystem: '系统已安装（PATH）',
        pathLabel: '路径',
        ghAuthUnknown: '正在读取登录状态…',
        ghAuthUnavailable: '不可登录',
        ghLoggedIn: '已登录：',
        ghNotLoggedIn: '未登录',
        ghLogin: '登录 GitHub',
        ghRelogin: '重新登录',
        ghLoginStarting: '正在启动 gh 登录…',
        ghLoginWaiting: '等待授权',
        ghLoginInactive: '未在登录中',
        ghLoginDone: '授权完成，凭据已由 gh 保存。',
        ghLoginFailed: '登录没有完成，可以重试。',
        ghCopy: '复制验证码',
        ghCopied: '已复制验证码',
        ghCopyFailed: '浏览器不允许复制，请手动选中验证码。',
        ghOpenDevice: '打开授权页',
        ghCancel: '取消登录',
        ghLoadFailed: '读取 GitHub CLI 状态失败：',
        ghActionFailed: '操作失败：',
        ghNetwork: '网络体检',
        ghNetworkLabel: '网络',
        ghNetworkDirect: '直连可用',
        ghNetworkProxy: '需走代理',
        ghNetworkProxyDead: '代理不通',
        ghNetworkBlocked: '连不上 GitHub',
        ghNetworkUnknown: '未知',
        ghDnsOff: 'DNS 不是 GitHub 地址',
        ghScopeMissing: '令牌缺少 repo scope，私有仓库推送会失败。',
        toolsNotFound: '未找到',
        toolsManaged: '托管版',
        toolsSystem: '系统 PATH',
        repoSelectLabel: '仓库',
        repoSelectAria: '在线仓库（github_push 的推送目标）',
        repoTitle: 'github_push 默认推送到这个在线仓库',
        repoUnbound: '未绑定',
        repoNone: '不绑定（用 git remote）',
        repoLoading: '读取仓库列表…',
        repoPrivate: '私有',
        repoUnavailable: 'gh 未安装或未登录',
        repoNetwork: '网络不通，读不到仓库',
        repoFailed: '读取仓库失败',
        repoSaveFailed: '保存失败：',
      },
      en: {
        sectionLabel: 'Compression tiers',
        title: 'Compression tiers & workbench',
        levelsAria: 'Compression tier',
        navAria: 'Panel sections',
        navLevels: 'Tiers',
        navRules: 'Rules',
        navComponents: 'Components',
        navAppearance: 'Appearance',
        navGithub: 'GitHub',
        appearanceTitle: 'Appearance',
        paletteLabel: 'Palette',
        paletteHost: 'Host theme',
        paletteObsidian: 'Deep obsidian',
        paletteCrystal: 'Daylight crystal',
        motionLabel: 'Motion',
        motionFull: 'Full',
        motionSubtle: 'Subtle',
        motionOff: 'Off',
        mascotsLabel: 'Pixel companions',
        mascotsOn: 'on',
        mascotsOff: 'off',
        artLabel: 'Optical surfaces',
        artOn: 'on',
        artOff: 'off',
        artHost: 'Pick a palette first',
        appearanceApplied: 'Applied.',
        appearanceFailed: 'Could not save: ',
        vialTitle: 'Context vial',
        vialAria: 'Context used',
        vialUsed: 'Used',
        vialWindow: 'Window',
        vialThreshold: 'Compaction threshold',
        vialRetain: 'Kept verbatim',
        vialUntil: 'Until threshold',
        vialLevel: 'Current tier',
        vialSystem: 'System',
        vialTools: 'Tools',
        vialMessages: 'Conversation',
        vialUsage: 'This session',
        vialUsageCache: 'Cache hit',
        vialUsageSpeed: 'Decode speed',
        vialUsageTurns: 'Turns / steps',
        vialUnavailable: 'Context usage is unavailable',
        vialLoading: 'Reading…',
        vialClose: 'Close',
        effortAria: 'Reasoning level',
        effortFailed: 'Switch failed: ',
        levelsTitle: 'Tiers',
        ghScopesLabel: 'Token scopes',
        ghScopesNone: 'not reported',
        levelGentle: 'Gentle',
        levelLight: 'Light',
        levelStandard: 'Standard',
        levelAggressive: 'Aggressive',
        levelMax: 'Max',
        auto: 'Auto ',
        retain: 'keep ',
        sep: ': ',
        currentLabel: 'Current tier',
        applying: 'Switching…',
        applied: 'Switched to',
        loadFailed: 'Could not read the settings: ',
        applyFailed: 'Switch failed: ',
        loading: 'Loading…',
        engines: 'Compaction engines',
        lastCompact: 'Last compaction',
        never: 'none yet',
        settingsPath: 'Settings file',
        rulesTitle: 'Global rules',
        rulesLabel: 'Rules',
        rulesPlaceholder: 'For example: answer in Chinese; read AGENTS.md before a change.',
        rulesSave: 'Save',
        rulesSaving: 'Saving…',
        rulesSaved: 'Saved.',
        rulesLoadFailed: 'Could not read: ',
        rulesSaveFailed: 'Could not save: ',
        rulesChars: 'Characters',
        rulesPathLabel: 'File',
        rulesLoading: 'Loading…',
        rulesMissing: 'missing; saving creates it.',
        workspaceRulesTitle: 'Workspace rules',
        workspaceNone: 'No workspace registered yet',
        workspaceSelectLabel: 'Workspace',
        workspaceRulesLabel: 'Supplemental rules (placed at the top of AGENTS.md)',
        workspaceRulesPlaceholder: 'For example: this workspace only touches src/; run the tests before committing.',
        workspaceRulesMissing: 'missing; saving creates it.',
        workspaceRulesLoadFailed: 'Could not read: ',
        workspaceRulesSaveFailed: 'Could not save: ',
        workspaceRulesSaved: 'Saved.',
        componentsTitle: 'Components',
        componentsLoadFailed: 'Could not read the component state: ',
        componentsActionFailed: 'Action failed: ',
        toolsPathLabel: 'Download directory',
        toolsPathCurrent: 'Current directory',
        toolsPathSave: 'Move here',
        toolsPathReset: 'Reset to default',
        toolsPathSaved: 'Moved.',
        toolsPathInvalid: 'An absolute path is required.',
        toolsPathRunning: 'A download is running; move after it finishes.',
        toolsPathFailed: 'Could not move: ',
        ghAuthTitle: 'GitHub sign-in',
        probe: 'Re-check',
        downloadIdle: 'Download',
        downloadKeep: 'Download again',
        downloadContinue: 'Resume download',
        downloadRetry: 'Retry',
        downloadRunning: 'Downloading ',
        downloadDone: 'Installed',
        downloadUnsupported: 'Unavailable on this system',
        stateMissing: 'Not installed',
        statePartial: 'Incomplete, can resume',
        stateFailed: 'Download failed',
        stateSystem: 'System install (PATH)',
        pathLabel: 'Path',
        ghAuthUnknown: 'Reading the sign-in state…',
        ghAuthUnavailable: 'cannot sign in',
        ghLoggedIn: 'Signed in: ',
        ghNotLoggedIn: 'Not signed in',
        ghLogin: 'Sign in to GitHub',
        ghRelogin: 'Sign in again',
        ghLoginStarting: 'Starting gh sign-in…',
        ghLoginWaiting: 'Waiting for authorization',
        ghLoginInactive: 'not signing in',
        ghLoginDone: 'Authorization finished; gh stored the credential.',
        ghLoginFailed: 'Sign-in did not finish; you can retry.',
        ghCopy: 'Copy code',
        ghCopied: 'Code copied',
        ghCopyFailed: 'The browser would not copy; select the code manually.',
        ghOpenDevice: 'Open authorization page',
        ghCancel: 'Cancel sign-in',
        ghLoadFailed: 'Could not read the GitHub CLI state: ',
        ghActionFailed: 'Action failed: ',
        ghNetwork: 'Check network',
        ghNetworkLabel: 'Network',
        ghNetworkDirect: 'direct works',
        ghNetworkProxy: 'needs the proxy',
        ghNetworkProxyDead: 'proxy unreachable',
        ghNetworkBlocked: 'GitHub unreachable',
        ghNetworkUnknown: 'unknown',
        ghDnsOff: 'DNS is not a GitHub address',
        ghScopeMissing: 'The token has no repo scope; pushing a private repository will fail.',
        toolsNotFound: 'not found',
        toolsManaged: 'managed',
        toolsSystem: 'system PATH',
        repoSelectLabel: 'Repo',
        repoSelectAria: 'Online repository (the github_push target)',
        repoTitle: 'github_push publishes to this online repository by default',
        repoUnbound: 'Not bound',
        repoNone: 'Not bound (use the git remote)',
        repoLoading: 'Loading repositories…',
        repoPrivate: 'private',
        repoUnavailable: 'gh is missing or signed out',
        repoNetwork: 'Network blocked the list',
        repoFailed: 'Could not list repositories',
        repoSaveFailed: 'Could not save: ',
      },
    }

    const CSS = `
.ct-page {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* Reserve the scrollbar lane even on short pages: otherwise a taller page
     adds a scrollbar, the content box narrows by its width, and the centered
     shell slides sideways the moment you switch pages. */
  scrollbar-gutter: stable;
  padding: 22px 24px 48px;
  color: var(--dsw-alias-label-primary);
  /* Liquid-glass canvas: two accent washes and a faint vertical tint give the
     translucent rail and the cards something to refract. The washes are the
     only decorative paint in the panel; everything else stays on theme tokens. */
  background:
    radial-gradient(820px 460px at 8% -2%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 26%, transparent), transparent 70%),
    radial-gradient(620px 360px at 102% 6%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 15%, transparent), transparent 72%),
    radial-gradient(560px 320px at 42% 106%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent), transparent 72%),
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-base) 93%, var(--dsw-alias-state-business-primary) 7%), var(--dsw-alias-bg-base) 62%);
  /* One glass recipe for the navigation rail and every card. */
  --ct-glass-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 58%, transparent);
  --ct-glass-rail: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 62%, transparent);
  --ct-glass-sheen: linear-gradient(158deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03) 38%, rgba(255, 255, 255, 0) 64%);
  --ct-glass-edge: var(--dsw-alias-border-l3);
  --ct-glass-shadow: 0 24px 60px rgba(0, 0, 0, 0.42), 0 2px 10px rgba(0, 0, 0, 0.22);
  --ct-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  /* The queries below measure this page, which is the panel's own width: a
     viewport media query would be wrong, because the sidebar takes a fixed slice
     of the window (a 1200px window leaves far less than 1200px here). The
     container has to be the page, not the shell: an element cannot be styled by
     a query on its own container, so a shell-level query would leave the shell
     in two columns and only flip its children. */
  container-type: inline-size;
}
/* The rail plus one page at a time: the panel is a small app shell, not one
   long scroll. */
.ct-shell {
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}
.ct-nav {
  position: sticky;
  /* Must stay 0: a positive offset repositions the rail inside the scrollbox,
     so at rest it already sits lower than the first card (18px measured 13–18px
     off, depending on how much room the grid row leaves) and the panel reads
     misaligned on every page. */
  top: 0;
  display: grid;
  gap: 3px;
  box-sizing: border-box;
  padding: 12px 10px;
  border: 1px solid var(--ct-glass-edge);
  border-radius: 20px;
  background: var(--ct-glass-rail);
  background-image: var(--ct-glass-sheen);
  box-shadow: var(--ct-glass-shadow), var(--ct-glass-inner);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
}
.ct-nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 8px 10px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 600;
  line-height: 15px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ct-nav-brand svg {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-state-business-primary);
}
.ct-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  margin: 0;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.ct-nav-item svg {
  flex: none;
  width: 15px;
  height: 15px;
  opacity: 0.8;
}
@media (hover: hover) {
  .ct-nav-item:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
  }
}
.ct-nav-item:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
/* The current page keeps the accent: tinted glass, a 2px bar and a soft glow,
   so the active row reads even against the blurred rail. */
.ct-nav-item[aria-current='page'] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);
  color: var(--dsw-alias-label-primary);
  box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary), 0 0 22px color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);
}
.ct-nav-item[aria-current='page'] svg {
  color: var(--dsw-alias-state-business-primary);
  opacity: 1;
}
.ct-content {
  display: grid;
  gap: 14px;
  min-width: 0;
  animation: ct-page-in 160ms ease-out;
}
@keyframes ct-page-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Narrow panel: the rail turns into a horizontal strip above the page. The
   items wrap instead of scrolling, so no page can be clipped away. */
@container (max-width: 720px) {
  .ct-shell {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  .ct-nav {
    position: static;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: 16px;
  }
  .ct-nav-brand {
    display: none;
  }
  .ct-nav-item {
    flex: none;
    width: auto;
    padding: 0 12px;
  }
}
.ct-intro {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-tertiary);
}
.ct-panel {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--ct-glass-edge);
  border-radius: 20px;
  background: var(--ct-glass-fill);
  background-image: var(--ct-glass-sheen);
  box-shadow: var(--ct-glass-shadow), var(--ct-glass-inner);
  /* No backdrop-filter on the cards on purpose: a page switch re-creates every
     card, and each new blurred surface has to sample and blur the gradient
     behind it — on a 4-core box that is the difference between a crisp switch
     and a stutter. The rail keeps its blur; the cards get by on the translucent
     fill plus the sheen. */
  contain: paint;
}
.ct-levels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
/* Five tiers stay on one row inside the page column; only a genuinely narrow
   panel drops to two. */
@container (max-width: 560px) {
  .ct-levels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.ct-level {
  display: grid;
  gap: 2px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 34%, transparent);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.ct-level strong {
  font-size: 14px;
  font-weight: 500;
}
.ct-level span {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}
@media (hover: hover) {
  .ct-level:hover {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}
.ct-level-on,
.ct-level-on:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 50%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 24px color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);
}
.ct-level:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.ct-summary {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
}
.ct-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}
.ct-status {
  margin: 0;
  min-height: 18px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}
/* Scope names are one long run of identifiers: wrap on any boundary so a full
   token never pushes the panel sideways. */
.ct-scopes {
  overflow-wrap: anywhere;
}
/* An empty status or note line is dead space at the bottom of a panel: hide it
   while there is nothing to say, and let it appear together with the message. */
.ct-status:empty,
.ct-note:empty {
  display: none;
}
.ct-meta {
  display: grid;
  gap: 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
  word-break: break-all;
}
.ct-rules-head {
  display: grid;
  gap: 4px;
}
.ct-rules-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.ct-field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
}
.ct-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 148px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  resize: vertical;
}
.ct-textarea::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.ct-textarea:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.ct-input {
  box-sizing: border-box;
  flex: 1 1 240px;
  min-width: 0;
  margin: 0;
  padding: 6px 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
}
.ct-input::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.ct-input:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
/* The workspace picker is a self-drawn control: a native select popup is
   painted by the OS with a light background and inherits the dark panel's
   light text, so its options are invisible. The trigger keeps the input
   geometry and the portalled listbox reuses the menu surface. */
/* The picker returns its trigger and the portalled menu in one element; the
   wrapper must not add a grid row of its own. */
.ct-select-field {
  display: contents;
}
.ct-select {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  justify-self: start;
  gap: 10px;
  box-sizing: border-box;
  width: min(100%, 360px);
  min-width: 220px;
  height: 34px;
  margin: 0;
  padding: 0 10px 0 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
@media (hover: hover) {
  .ct-select:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
    border-color: var(--dsw-alias-border-l3);
  }
}
.ct-select[aria-expanded='true'] {
  border-color: var(--dsw-alias-border-selected);
  background: var(--dsw-alias-bg-module-platform);
}
.ct-select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
.ct-select:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.ct-select-value {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ct-select-chevron {
  flex: none;
  width: 12px;
  height: 12px;
  color: var(--dsw-alias-label-tertiary);
  transition: transform 140ms ease;
}
.ct-select[aria-expanded='true'] .ct-select-chevron {
  transform: rotate(180deg);
}
.ct-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
/* One button standard for the whole page: the ct-btn base is the geometry,
   ct-btn--primary only changes emphasis. Every panel renders its actions in a
   ct-actions row so the GitHub, download-location and video panels cannot
   drift into different-looking buttons. */
.ct-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ct-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 18px;
  white-space: nowrap;
  cursor: pointer;
}
.ct-btn--primary {
  border-color: var(--dsw-alias-border-selected);
  background: var(--dsw-alias-bg-module-platform);
}
@media (hover: hover) {
  .ct-btn:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}
.ct-btn:disabled {
  border-color: var(--dsw-alias-border-l2);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
.ct-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.ct-code {
  margin: 0;
  padding: 4px 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  letter-spacing: 0.08em;
}
.ct-progress {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--dsw-alias-border-l2);
}
.ct-progress span {
  display: block;
  height: 100%;
  background: var(--dsw-alias-state-business-primary);
}
.ct-tools-list {
  display: grid;
  gap: 4px;
}
.ct-tool {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  font-size: 12px;
  line-height: 18px;
}
.ct-tool-name {
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
.ct-tool-path {
  color: var(--dsw-alias-label-tertiary);
  word-break: break-all;
}
.ct-component {
  display: grid;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.ct-component:first-of-type {
  padding-top: 0;
  border-top: 0;
}
.ct-component-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}
.ct-component-name {
  font-size: 13px;
  font-weight: 600;
}
.ct-component-path {
  word-break: break-all;
}
/* The repository pill rides the composer dock: a full-width row directly above
   the input card, so it is present in a blank Session too (the title cluster is
   hidden there) and its menu can open upward without covering the input. */
.ct-repo-dock {
  box-sizing: border-box;
  /* Mirror the composer card's own box: the card is centered with a side
     clearance, so a full-width dock row parked the pill at the window edge,
     far right of the input. The row is capped to the card and centered, which
     puts the pill's right edge on the card's right edge. */
  width: min(calc(100% - var(--dsh-composer-side-clearance, 16px) * 2), var(--dsh-composer-card-max-width, 720px));
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 0;
  container-type: inline-size;
}
.ct-repo-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ct-repo-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: 26px;
  max-width: 320px;
  min-width: 0;
  padding: 0 10px 0 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
@media (hover: hover) {
  .ct-repo-pill:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    border-color: var(--dsw-alias-border-l3);
  }
}
.ct-repo-pill:focus-within {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.ct-repo-pill[data-bound='true'] {
  border-color: var(--dsw-alias-border-selected);
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 46%, transparent);
  background: var(--dsw-alias-bg-module-platform);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary);
}
.ct-repo-icon {
  flex: none;
  width: 13px;
  height: 13px;
  color: var(--dsw-alias-label-tertiary);
}
.ct-repo-pill[data-bound='true'] .ct-repo-icon {
  color: var(--dsw-alias-label-secondary);
}
.ct-repo-caption {
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.ct-repo-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}
.ct-repo-chevron {
  flex: none;
  width: 12px;
  height: 12px;
  color: var(--dsw-alias-label-tertiary);
  transition: transform 140ms ease;
}
.ct-repo-pill[aria-expanded='true'] .ct-repo-chevron {
  transform: rotate(180deg);
}
.ct-repo-pill[aria-expanded='true'] {
  border-color: var(--dsw-alias-border-l3);
  background: var(--dsw-alias-interactive-bg-hover);
}
.ct-repo-pill {
  font-family: inherit;
  cursor: pointer;
}
.ct-repo-pill:disabled {
  opacity: 0.55;
  cursor: default;
}
/* One surface for every portalled picker (the repository pill above the
   composer and the workspace picker in the panel). Popovers are portalled to
   body and fixed-positioned, so neither the composer nor the panel scrollport
   can clip them. The fill is layer-3, one step above the cards, plus a faint
   top sheen: layer-2 is exactly the card colour, which made the old menu read
   as floating text instead of a panel. */
.ct-menu {
  position: fixed;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-sizing: border-box;
  overflow: auto;
  padding: 6px;
  border: 1px solid var(--dsw-alias-border-l3);
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, var(--dsw-alias-border-l3));
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-3);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 88%, transparent);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 46%);
  box-shadow: 0 0 32px color-mix(in srgb, var(--dsw-alias-state-business-primary) 9%, transparent), 0 24px 64px rgba(0, 0, 0, 0.55), 0 2px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 16px;
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  transform-origin: bottom center;
  animation: ct-menu-rise 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
/* The data-side attribute picks the entry direction; the route keeps at most
   the room on that side of the trigger. */
.ct-menu[data-side='down'] {
  transform-origin: top center;
  animation-name: ct-menu-drop;
}
.ct-menu:focus {
  outline: none;
}
@keyframes ct-menu-rise {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
@keyframes ct-menu-drop {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.ct-menu-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 7px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 600;
  line-height: 15px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
/* The accent tick turns the head into a title bar instead of one more row. */
.ct-menu-head::before {
  content: '';
  flex: none;
  width: 2px;
  height: 12px;
  border-radius: 1px;
  background: var(--dsw-alias-state-business-primary);
  box-shadow: 0 0 8px var(--dsw-alias-state-business-primary);
}
.ct-menu-sep {
  height: 1px;
  margin: 5px 8px;
  background: linear-gradient(90deg, transparent, var(--dsw-alias-border-l3) 18%, var(--dsw-alias-border-l3) 82%, transparent);
}
.ct-menu-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  margin: 0;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 110ms ease, color 110ms ease;
}
@media (hover: hover) {
  .ct-menu-option:hover {
    background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 13%, transparent);
  }
}
.ct-menu-option:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.ct-menu-option-active {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 15%, transparent);
}
.ct-menu-option[aria-selected='true'] {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent);
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}
/* A 2px accent bar on the selected row survives the hover fill, so the current
   choice stays visible while the pointer moves over the list. */
.ct-menu-option[aria-selected='true']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 2px;
  border-radius: 2px;
  background: var(--dsw-alias-state-business-primary);
}
.ct-menu-check {
  flex: none;
  width: 14px;
  color: var(--dsw-alias-state-business-primary);
  font-size: 12px;
  text-align: center;
}
.ct-menu-option-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ct-menu-tag {
  flex: none;
  margin-left: auto;
  padding: 1px 6px;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 999px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.04em;
}
.ct-menu-note {
  margin: 4px 8px 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}
.ct-repo-note {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
/* ---- Optical skins -------------------------------------------------------
   Each palette defines a token set on the plugin's own roots (panel page,
   composer dock, portalled menus). The host UI never sees these values: the
   attributes only exist on our elements. "host" is the empty case and keeps the
   official theme untouched.

   Both palettes follow the host scheme. The first block of each pair is the
   light-host reading, and body[data-ds-dark-theme] — the attribute the official
   theme presenter sets — swaps in the dark one. color-scheme is deliberately
   absent: html already carries the host's, and a local value here would fight
   it. */
.ct-skin[data-palette='obsidian'] {
  --dsw-alias-bg-base: #e6edf6;
  --dsw-alias-bg-layer-1: #eef4fb;
  --dsw-alias-bg-layer-2: #f7fafd;
  --dsw-alias-bg-layer-3: #ffffff;
  --dsw-alias-bg-module-platform: #e1eaf6;
  --dsw-alias-border-l2: rgba(23, 40, 64, 0.14);
  --dsw-alias-border-l3: rgba(23, 40, 64, 0.24);
  --dsw-alias-border-selected: #2f6fed;
  --dsw-alias-label-primary: #142033;
  --dsw-alias-label-secondary: #40516a;
  --dsw-alias-label-tertiary: #697a93;
  --dsw-alias-interactive-bg-hover: rgba(23, 40, 64, 0.07);
  --dsw-alias-state-business-primary: #2f6fed;
  --dsw-alias-link: #2563eb;
  --dsw-alias-chart-system: #2f6fed;
  --dsw-alias-chart-tools: #7c5cff;
  --dsw-alias-chart-messages: #0f9d8a;
  --dsw-alias-state-warn-primary: #b45309;
  --dsw-alias-state-error-primary: #c02626;
  --ct-glass-fill: rgba(255, 255, 255, 0.66);
  --ct-glass-rail: rgba(255, 255, 255, 0.54);
  --ct-glass-sheen: linear-gradient(158deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.14) 40%, transparent 66%);
  --ct-glass-shadow: 0 26px 56px rgba(31, 54, 93, 0.16), 0 2px 8px rgba(31, 54, 93, 0.1);
  --ct-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(31, 54, 93, 0.06);
}
.ct-skin[data-palette='crystal'] {
  --dsw-alias-bg-base: #eef6ff;
  --dsw-alias-bg-layer-1: #f5faff;
  --dsw-alias-bg-layer-2: #fbfdff;
  --dsw-alias-bg-layer-3: #ffffff;
  --dsw-alias-bg-module-platform: #e4effc;
  --dsw-alias-border-l2: rgba(12, 60, 90, 0.14);
  --dsw-alias-border-l3: rgba(12, 60, 90, 0.24);
  --dsw-alias-border-selected: #0f96c8;
  --dsw-alias-label-primary: #0a2233;
  --dsw-alias-label-secondary: #35566c;
  --dsw-alias-label-tertiary: #5f7f96;
  --dsw-alias-interactive-bg-hover: rgba(12, 60, 90, 0.07);
  --dsw-alias-state-business-primary: #0f96c8;
  --dsw-alias-link: #0a76a8;
  --dsw-alias-chart-system: #0f96c8;
  --dsw-alias-chart-tools: #6f7cff;
  --dsw-alias-chart-messages: #0e9f8f;
  --dsw-alias-state-warn-primary: #a35a08;
  --dsw-alias-state-error-primary: #b8272a;
  --ct-glass-fill: rgba(255, 255, 255, 0.7);
  --ct-glass-rail: rgba(255, 255, 255, 0.58);
  --ct-glass-sheen: linear-gradient(158deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.16) 40%, transparent 66%);
  --ct-glass-shadow: 0 26px 56px rgba(12, 60, 90, 0.14), 0 2px 8px rgba(12, 60, 90, 0.08);
  --ct-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.94), inset 0 -1px 0 rgba(12, 60, 90, 0.06);
}
body[data-ds-dark-theme] .ct-skin[data-palette='obsidian'] {
  --dsw-alias-bg-base: #0a0a0c;
  --dsw-alias-bg-layer-1: #101013;
  --dsw-alias-bg-layer-2: #17171b;
  --dsw-alias-bg-layer-3: #202026;
  --dsw-alias-bg-module-platform: #292930;
  --dsw-alias-border-l2: rgba(255, 255, 255, 0.1);
  --dsw-alias-border-l3: rgba(255, 255, 255, 0.18);
  --dsw-alias-border-selected: #8fa6ff;
  --dsw-alias-label-primary: #f4f5f9;
  --dsw-alias-label-secondary: #c3c8d4;
  --dsw-alias-label-tertiary: #8a91a0;
  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);
  --dsw-alias-state-business-primary: #6f9bff;
  --dsw-alias-link: #8fb4ff;
  --dsw-alias-chart-system: #6f9bff;
  --dsw-alias-chart-tools: #b18cff;
  --dsw-alias-chart-messages: #5fd0c8;
  --dsw-alias-state-warn-primary: #f0b45c;
  --dsw-alias-state-error-primary: #ff7b72;
  --ct-glass-fill: rgba(32, 32, 38, 0.6);
  --ct-glass-rail: rgba(23, 23, 27, 0.7);
  --ct-glass-sheen: linear-gradient(158deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 38%, transparent 64%);
  --ct-glass-shadow: 0 28px 64px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3);
  --ct-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.07), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
body[data-ds-dark-theme] .ct-skin[data-palette='crystal'] {
  --dsw-alias-bg-base: #070b12;
  --dsw-alias-bg-layer-1: #0b1119;
  --dsw-alias-bg-layer-2: #111925;
  --dsw-alias-bg-layer-3: #182333;
  --dsw-alias-bg-module-platform: #1f2a38;
  --dsw-alias-border-l2: rgba(196, 228, 255, 0.12);
  --dsw-alias-border-l3: rgba(196, 228, 255, 0.2);
  --dsw-alias-border-selected: #7ad6ff;
  --dsw-alias-label-primary: #eef7ff;
  --dsw-alias-label-secondary: #b8ccdd;
  --dsw-alias-label-tertiary: #8299ac;
  --dsw-alias-interactive-bg-hover: rgba(196, 228, 255, 0.08);
  --dsw-alias-state-business-primary: #48c6f5;
  --dsw-alias-link: #8ad9ff;
  --dsw-alias-chart-system: #48c6f5;
  --dsw-alias-chart-tools: #9db8ff;
  --dsw-alias-chart-messages: #5fe3d0;
  --dsw-alias-state-warn-primary: #f0b45c;
  --dsw-alias-state-error-primary: #ff8a7a;
  --ct-glass-fill: rgba(24, 35, 51, 0.6);
  --ct-glass-rail: rgba(17, 25, 37, 0.72);
  --ct-glass-sheen: linear-gradient(158deg, rgba(200, 235, 255, 0.14), rgba(200, 235, 255, 0.03) 38%, transparent 64%);
  --ct-glass-shadow: 0 28px 64px rgba(0, 4, 10, 0.56), 0 2px 10px rgba(0, 4, 10, 0.34);
  --ct-glass-inner: inset 0 1px 0 rgba(200, 235, 255, 0.09), inset 0 -1px 0 rgba(0, 0, 0, 0.34);
}
/* ---- Prism art layer (host surfaces) -------------------------------------
   The palette only repaints tokens, which leaves every host surface flat. The
   art upstream draws in its stylesheet — a wash behind the conversation, the
   smoked user bubble, hairline rules, slim scrollbars, the composer sheen — is
   addressed here through DSH's own semantic attributes. applyOptics() is the
   only switch: it writes data-ct-palette / data-ct-art on <body>, and both are
   inert for the host palette and when the art switch is off. */
body[data-ct-art='on'] [data-conversation-region='chat'] {
  background-image:
    radial-gradient(150% 90% at 50% 86%, color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent) 0%, transparent 66%),
    radial-gradient(80% 60% at 100% 0%, color-mix(in srgb, var(--dsw-alias-chart-tools) 11%, transparent) 0%, transparent 70%),
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 4%, transparent) 0%, transparent 40%);
}
body[data-ct-art='on'] [data-conversation-region='chat'] [data-message-bubble] {
  border-radius: 16px;
  padding: 10px 15px;
  border: 1px solid var(--dsw-alias-border-l2);
}
body[data-ct-art='on'][data-ds-dark-theme] [data-message-bubble] {
  background-image: linear-gradient(rgba(255, 255, 255, 0.022) 0%, transparent 55%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.058), 0 6px 20px -10px rgba(0, 0, 0, 0.44);
}
body[data-ct-art='on']:not([data-ds-dark-theme]) [data-message-bubble] {
  background-image: none;
  box-shadow: inset 0 1px 0 #ffffff, 0 4px 16px -10px rgba(15, 23, 42, 0.1);
}
/* CJK prose breathes a little wider than the host default. */
body[data-ct-art='on'] [data-conversation-region='chat'] :is(p, li) {
  line-height: 1.72;
  letter-spacing: 0.005em;
}
body[data-ct-art='on'] [data-conversation-region='chat'] hr {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent) 16%, color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent) 84%, transparent 100%);
}
body[data-ct-art='on'] [data-conversation-region='chat'] blockquote {
  position: relative;
  margin: 10px 0;
  padding: 7px 16px 7px 15px;
  border: 0;
  border-radius: 2px 0 0 2px;
  background-image: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 4%, rgba(128, 128, 128, 0.028)) 0%, rgba(128, 128, 128, 0.022) 76%, transparent 98%);
}
body[data-ct-art='on'] [data-conversation-region='chat'] blockquote::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 1.5px;
  border-radius: 999px;
  background: linear-gradient(color-mix(in srgb, var(--dsw-alias-state-business-primary) 68%, transparent) 0%, color-mix(in srgb, var(--dsw-alias-chart-tools) 42%, transparent) 100%);
}
body[data-ct-art='on'] [data-conversation-scroll]::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
body[data-ct-art='on'] [data-conversation-scroll]::-webkit-scrollbar-track {
  background: transparent;
}
body[data-ct-art='on'] [data-conversation-scroll]::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);
  border-radius: 999px;
}
body[data-ct-art='on'][data-ds-dark-theme] [data-composer-card] {
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 0%, transparent 58%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 30px -18px rgba(0, 0, 0, 0.5);
}
/* The composer keeps every surface the host gives it. Its seat paints an opaque
   fade band that clips the transcript as it scrolls out from under the card, and
   the card itself stays opaque. 2.4.2 made both translucent so the old horizon
   glow could reach the window edge; that also let transcript text show through
   the card, so 2.4.6 replaced the glow with a static gradient and this rule set
   went back to the host. The card still gets the art's own sheen and shadow. */
body[data-ct-art='on']:not([data-ds-dark-theme]) [data-composer-card] {
  background-image: linear-gradient(rgba(255, 255, 255, 0.6) 0%, transparent 60%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 20px -16px rgba(15, 23, 42, 0.28);
}
/* The art layer sits behind the transcript: one background on the chat region,
   below the scroll column, never taking a click. */
body[data-ct-art='on'] [data-conversation-region='chat'] {
  position: relative;
}
/* The art layer's backdrop is one static linear gradient — a bottom-lit band
   under the transcript. Nothing animates here on purpose: the horizon renderer
   it replaced repainted a canvas ~30 times a second for the same picture. */
body[data-ct-art='on'] [data-conversation-region='chat'] {
  background-image:
    linear-gradient(to top,
      color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-chart-tools) 9%, transparent) 26%,
      transparent 54%);
  background-repeat: no-repeat;
  background-position: bottom;
}
/* The composer stats line under the composer is the host's own text; the art
   layer hides it and the vial popover carries the same readings. */
body[data-ct-art='on'] [data-composer-stat] {
  display: none !important;
}
/* ---- Appearance page ---------------------------------------------------- */
.ct-swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
@container (max-width: 640px) {
  .ct-swatches {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.ct-swatch {
  display: grid;
  gap: 7px;
  box-sizing: border-box;
  min-width: 0;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 30%, transparent);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
@media (hover: hover) {
  .ct-swatch:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}
.ct-swatch[aria-checked='true'] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent);
  color: var(--dsw-alias-label-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 20px color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);
}
.ct-swatch:disabled {
  cursor: default;
  opacity: 0.6;
}
.ct-swatch:focus-visible,
.ct-segment:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.ct-swatch-band {
  display: block;
  height: 22px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  border-radius: 7px;
  background: linear-gradient(135deg, var(--sw-bg) 0 38%, var(--sw-mid) 38% 68%, var(--sw-accent) 68% 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
}
.ct-swatch-band[data-choice='host'] {
  --sw-bg: var(--dsw-alias-bg-base);
  --sw-mid: var(--dsw-alias-bg-layer-2);
  --sw-accent: var(--dsw-alias-state-business-primary);
}
/* A palette follows the host scheme, so its band shows both ends: the dark
   surface on the left, the light one in the middle, the accent on the right. */
.ct-swatch-band[data-choice='obsidian'] {
  --sw-bg: #0a0a0c;
  --sw-mid: #e6edf6;
  --sw-accent: #6f9bff;
}
.ct-swatch-band[data-choice='crystal'] {
  --sw-bg: #070b12;
  --sw-mid: #eef6ff;
  --sw-accent: #2fb8e8;
}
.ct-swatch-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 16px;
}
.ct-segments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ct-segment {
  box-sizing: border-box;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
@media (hover: hover) {
  .ct-segment:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}
.ct-segment[aria-checked='true'] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 50%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);
  color: var(--dsw-alias-label-primary);
}
.ct-segment:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
/* ---- Reasoning effort slider (inside the official model menu) -------------
   Injected as a sibling of the official 推理等级 row, so it inherits the menu
   surface and its tokens. Geometry follows the reference slider
   (dsh-codex-effort-slider): one 28px pill track, an accent fill that ends at
   the knob centre, a white circular knob that fills the tube, and 3px ticks at
   every level. */
.ct-effort {
  display: block;
  box-sizing: border-box;
  padding: 2px 10px 6px;
  --ct-effort-accent: hsl(240 92% 62%);
  --ct-effort-glow: hsl(240 92% 66% / 0.5);
}
.ct-effort-track {
  position: relative;
  display: block;
  height: 28px;
  border-radius: 999px;
  background: var(--dsw-alias-border-l1, rgba(15, 17, 21, 0.09));
  cursor: pointer;
  touch-action: none;
  transition: box-shadow 200ms ease;
}
.ct-effort-track:focus-visible {
  outline: 2px solid var(--ct-effort-accent);
  outline-offset: 2px;
}
.ct-effort-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 14px;
  border-radius: 14px 0 0 14px;
  background: var(--ct-effort-accent);
  pointer-events: none;
}
.ct-effort-dot {
  position: absolute;
  top: 50%;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 26%, transparent);
  transition: opacity 140ms ease;
  pointer-events: none;
}
.ct-effort-gem {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 28px;
  height: 28px;
  margin-top: -14px;
  margin-left: -14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.34), 0 0 0 0.5px rgba(0, 0, 0, 0.06),
    0 0 calc(var(--ct-effort-energy, 0) * 12px) var(--ct-effort-glow);
  pointer-events: none;
  transition: left 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
/* Highest level: the tube glows violet and the fill turns violet at its end. */
.ct-effort[data-energy='1'] .ct-effort-track {
  box-shadow: 0 0 calc(var(--ct-effort-energy, 0) * 16px) color-mix(in srgb, var(--ct-effort-glow) 80%, transparent);
}
.ct-effort[data-energy='0'] .ct-effort-star,
.ct-effort[data-energy='0'] .ct-effort-energy-sweep {
  animation-play-state: paused;
}
/* The energy layer is the reference slider's violet nebula: it covers the filled
   part of the rail only, and one custom property drives its strength, so "turning
   on" is a colour interpolation the compositor does for us. */
.ct-effort-energy {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 14px;
  border-radius: 14px 0 0 14px;
  overflow: hidden;
  opacity: var(--ct-effort-energy, 0);
  transition: opacity 200ms ease;
  background: linear-gradient(90deg, #3b1178 0%, #6d28d9 30%, #9333ea 62%, #c084fc 100%);
  pointer-events: none;
}
.ct-effort-energy-sweep {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 18%, rgba(255, 255, 255, 0.3) 50%, transparent 82%);
  transform: translateX(100%);
  animation: ct-effort-sweep 2.4s linear infinite;
}
@keyframes ct-effort-sweep {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
/* Stardust rides its own layer: if it shared the nebula's opacity, the stars
   would sit at 0.25 on the high tier and read as absent. */
.ct-effort-stars {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 14px;
  border-radius: 14px 0 0 14px;
  overflow: hidden;
  opacity: var(--ct-effort-star-opacity, 0);
  transition: opacity 200ms ease;
  pointer-events: none;
}
.ct-effort-star {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  margin-top: -1.5px;
  animation-name: ct-effort-star-sweep;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  pointer-events: none;
}
.ct-effort-star-dot {
  position: absolute;
  left: 100%;
  top: 0;
  width: 3px;
  height: 3px;
  margin-left: -1.5px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.85);
  opacity: var(--ct-effort-b, 1);
  transform: scale(var(--ct-effort-b, 1));
}
@keyframes ct-effort-star-sweep {
  0% { transform: translate3d(0, 0, 0); opacity: 0; }
  6% { opacity: 1; }
  94% { opacity: 1; }
  100% { transform: translate3d(-100%, 0, 0); opacity: 0; }
}
body[data-ds-dark-theme] .ct-effort-star-dot {
  background: #f5f3ff;
  box-shadow: 0 0 5px rgba(216, 180, 254, 0.95);
}
@media (prefers-reduced-motion: reduce) {
  .ct-effort-energy { transition: none; }
  .ct-effort-energy-sweep { display: none; }
}
.ct-effort[data-motion='off'] .ct-effort-star {
  animation-play-state: paused;
}
.ct-effort[data-motion='off'] .ct-effort-gem,
.ct-effort[data-motion='off'] .ct-effort-dot,
.ct-effort[data-motion='off'] .ct-effort-track {
  transition: none;
}
.ct-effort[data-busy='true'] .ct-effort-track {
  cursor: progress;
  opacity: 0.72;
}
.ct-effort-error {
  margin: 4px 0 0;
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px;
  line-height: 15px;
}
.ct-effort-error:empty {
  display: none;
}

/* ---- Composer dock: vial + pixel companions ----------------------------- */
.ct-dock-mascots {
  flex: 0 0 220px;
  width: 220px;
  height: 84px;
  min-width: 0;
}
.ct-dock-tools {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  margin-left: auto;
}
@container (max-width: 620px) {
  .ct-dock-mascots {
    display: none;
  }
}
.ct-mascot-stage {
  position: relative;
  width: 220px;
  height: 84px;
}
.ct-mascot-stage[data-state='failed'] {
  display: none;
}
.ct-mascot-stage .ag-v2-mascot-actor {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 96px;
  height: 84px;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  outline: none;
}
.ct-mascot-stage .ag-v2-mascot-actor::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 44px;
  height: 8px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.16) 58%, transparent);
  pointer-events: none;
  z-index: 0;
}
.ct-mascot-stage .ag-v2-mascot-actor[data-dragging='1'] {
  cursor: grabbing;
}
.ct-mascot-stage .ag-v2-mascot-canvas {
  position: relative;
  z-index: 1;
  display: block;
  width: 96px;
  height: 84px;
  image-rendering: pixelated;
  pointer-events: none;
}
.ct-mascot-stage .ag-v2-mini-pile {
  position: absolute;
  left: 12px;
  bottom: 1px;
  display: none;
  align-items: flex-end;
  height: 32px;
  pointer-events: none;
  z-index: 20;
}
.ct-mascot-stage .ag-v2-mini-crab-canvas {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 32px;
  image-rendering: pixelated;
  pointer-events: none;
  transition: transform 160ms steps(2, end);
}
.ct-vial {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: 26px;
  margin: 0;
  padding: 0 10px 0 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
@media (hover: hover) {
  .ct-vial:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    border-color: var(--dsw-alias-border-l3);
  }
}
.ct-vial:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.ct-vial[aria-expanded='true'] {
  border-color: var(--dsw-alias-border-l3);
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
}
.ct-vial[data-critical='true'] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 55%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.ct-vial-mini {
  display: block;
  flex: none;
  width: 10px;
  height: 16px;
  overflow: visible;
}
.ct-vial-track {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0.45;
}
.ct-vial-liquid {
  fill: currentColor;
  opacity: 0.88;
  transition: y 600ms cubic-bezier(0.22, 1, 0.36, 1), height 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
/* Motion tiers: "subtle" drops the page/menu entrances and the liquid height
   transition but leaves the companions alive; "off" also freezes the vial
   simulator (the JS passes reducedMotion) and the companions. */
.ct-page[data-motion='subtle'] .ct-content,
.ct-page[data-motion='off'] .ct-content {
  animation: none;
}
.ct-skin[data-motion='subtle'] .ct-vial-liquid,
.ct-skin[data-motion='off'] .ct-vial-liquid {
  transition: none;
}
.ct-vial-threshold {
  stroke: var(--dsw-alias-state-warn-primary);
  stroke-width: 1;
  opacity: 0.9;
}
.ct-vial-pct {
  font-weight: 500;
}
.ct-vial-popover {
  position: fixed;
  z-index: 2147483000;
  display: grid;
  gap: 10px;
  box-sizing: border-box;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--dsw-alias-border-l3);
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, var(--dsw-alias-border-l3));
  border-radius: 16px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 92%, transparent);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 46%);
  box-shadow: 0 0 32px color-mix(in srgb, var(--dsw-alias-state-business-primary) 9%, transparent), 0 24px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 16px;
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  transform-origin: bottom left;
  animation: ct-menu-rise 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ct-vial-popover[data-side='down'] {
  transform-origin: top left;
  animation-name: ct-menu-drop;
}
.ct-vial-popover:focus {
  outline: none;
}
.ct-vial-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 600;
  line-height: 15px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ct-vial-head-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ct-vial-level {
  padding: 1px 7px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-weight: 500;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: none;
}
.ct-vial-bar i[data-kind='total'] {
  background: var(--dsw-alias-state-business-primary);
}
.ct-vial-close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
@media (hover: hover) {
  .ct-vial-close:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
  }
}
.ct-vial-close:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.ct-vial-body {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
.ct-vial-canvas {
  display: block;
  width: 96px;
  height: 220px;
}
.ct-vial-stats {
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
}
.ct-vial-percent {
  font-size: 26px;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.ct-vial[data-critical='true'] .ct-vial-percent,
.ct-vial-popover[data-critical='true'] .ct-vial-percent {
  color: var(--dsw-alias-state-warn-primary);
}
.ct-vial-numbers {
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.ct-vial-rows {
  display: grid;
  gap: 5px;
  margin: 0;
}
/* The host's composer stats line is hidden by the art layer; these rows carry
   the same readings inside the vial, separated from the context numbers. */
.ct-vial-usage {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.ct-vial-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.ct-vial-row dt {
  color: var(--dsw-alias-label-tertiary);
}
.ct-vial-row dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.ct-vial-bar {
  display: flex;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--dsw-alias-border-l2);
}
.ct-vial-bar i {
  display: block;
  height: 100%;
  min-width: 0;
}
.ct-vial-bar i[data-kind='system'] {
  background: var(--dsw-alias-chart-system);
}
.ct-vial-bar i[data-kind='tools'] {
  background: var(--dsw-alias-chart-tools);
}
.ct-vial-bar i[data-kind='messages'] {
  background: var(--dsw-alias-chart-messages);
}
.ct-vial-legend {
  display: grid;
  gap: 4px;
}
.ct-vial-legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 15px;
}
.ct-vial-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 2px;
}
.ct-vial-dot[data-kind='system'] {
  background: var(--dsw-alias-chart-system);
}
.ct-vial-dot[data-kind='tools'] {
  background: var(--dsw-alias-chart-tools);
}
.ct-vial-dot[data-kind='messages'] {
  background: var(--dsw-alias-chart-messages);
}
.ct-vial-legend-row span:last-child {
  margin-left: auto;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}
.ct-vial-empty {
  max-width: 220px;
  color: var(--dsw-alias-label-tertiary);
}
`

    function percent(value) {
      return Math.round((Number(value) || 0) * 100) + '%'
    }

    function labelOf(t, id) {
      const key = 'level' + id.charAt(0).toUpperCase() + id.slice(1)
      return t(key)
    }

    /** Two directory spellings that name the same place, for the move button. */
    function samePathDraft(a, b) {
      const clean = function (value) {
        return String(value || '').trim().replace(/[\\/]+$/, '').toLowerCase()
      }
      return clean(a) === clean(b)
    }

    /** Absolute on Windows (`C:\x`, `\\host\share`) or POSIX (`/x`). */
    function looksAbsolute(value) {
      return /^([A-Za-z]:[\\/]|\\\\|\/)/.test(String(value || '').trim())
    }

    /**
     * The one button standard for this page. `ct-btn` is the geometry, the
     * `ct-btn--primary` modifier only adds emphasis, and `data-action` gives
     * tests a stable handle. No panel may style its own button.
     */
    function actionButton(action, label, options) {
      const config = options || {}
      return h('button', {
        // Rendered inside an array by actionRow(), so it needs its own key; the
        // action id is already unique within a row.
        key: action,
        type: 'button',
        className: 'ct-btn' + (config.primary ? ' ct-btn--primary' : ''),
        'data-action': action,
        disabled: config.disabled === true,
        title: config.title || '',
        onClick: config.onClick,
      }, label)
    }

    /** Every panel renders its buttons in this row and nothing else. */
    function actionRow(children) {
      return h('div', { className: 'ct-actions' }, children)
    }

    function timeLabel(value) {
      if (!value) return ''
      const date = new Date(value)
      return isNaN(date.getTime()) ? String(value) : date.toLocaleString()
    }

    function readJson(response) {
      return response.json().catch(function () { return null }).then(function (body) {
        if (!response.ok) {
          throw new Error(body && body.error ? body.error : 'HTTP ' + response.status)
        }
        return body
      })
    }

    function messageOf(error) {
      return error && error.message ? error.message : String(error)
    }

    /**
     * The account's repositories, cached for five minutes. The session header
     * remounts on every session switch, and listing repositories is a `gh`
     * round trip; a cache keeps switching sessions free.
     */
    const REPO_CACHE_MS = 5 * 60_000
    const repoCache = { repos: null, error: null, at: 0, pending: null }

    function loadOnlineRepos() {
      if (repoCache.repos && Date.now() - repoCache.at < REPO_CACHE_MS) {
        return Promise.resolve({ repos: repoCache.repos, error: repoCache.error })
      }
      if (repoCache.pending) return repoCache.pending
      repoCache.pending = fetch(GH_ONLINE_API, { credentials: 'same-origin' })
        .then(readJson)
        .then(function (body) {
          const repos = body && Array.isArray(body.repos) ? body.repos : []
          repoCache.repos = repos
          repoCache.error = body && body.error ? String(body.error) : null
          repoCache.at = Date.now()
          return { repos, error: repoCache.error }
        })
        .catch(function (error) {
          // Keep the rows a previous listing returned; only the note says it failed.
          repoCache.repos = repoCache.repos || []
          repoCache.error = 'failed'
          repoCache.at = Date.now()
          return { repos: repoCache.repos, error: 'failed', detail: messageOf(error) }
        })
        .then(function (result) {
          repoCache.pending = null
          return result
        })
      return repoCache.pending
    }

    function repoErrorText(t, error) {
      if (error === 'gh-not-installed' || error === 'not-authenticated') return t('repoUnavailable')
      if (error === 'network') return t('repoNetwork')
      return t('repoFailed')
    }

    /**
     * The client half of `normalizeAppearance` in `src/store.js`, including the
     * 2.0.0 palette migration: the server rewrites the stored value on read, so
     * this only matters for a payload that predates that rewrite.
     */
    const LEGACY_PALETTES = { warm: 'obsidian', alabaster: 'crystal' }
    function normalizeAppearance(value) {
      const next = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      const legacy = LEGACY_PALETTES[next.palette]
      const palette = PALETTES.some(function (item) { return item.id === next.palette })
        ? next.palette
        : (legacy || DEFAULT_APPEARANCE.palette)
      return {
        palette: palette,
        motion: MOTIONS.some(function (item) { return item.id === next.motion }) ? next.motion : DEFAULT_APPEARANCE.motion,
        mascots: next.mascots === false ? false : DEFAULT_APPEARANCE.mascots,
        art: next.art === false ? false : DEFAULT_APPEARANCE.art,
      }
    }

    /** The tier spec the vial draws its threshold from. */
    function levelSpecOf(settings) {
      const level = settings && settings.level ? settings.level : 'standard'
      const list = settings && Array.isArray(settings.levels) ? settings.levels : []
      const found = list.find(function (item) { return item && item.id === level })
      if (found && Number.isFinite(Number(found.thresholdRatio))) return found
      return { id: 'standard', thresholdRatio: 0.6, retainRatio: 0.16 }
    }

    /**
     * The readings the host prints under the composer (session tokens, cache
     * hit, decode speed, turns/steps). The art layer hides that line, so the
     * vial carries the same numbers — read from the same two projections the
     * official pills use, and only when the host actually serves them.
     */
    function vialUsage(usage, stats) {
      const out = { total: null, cacheHit: null, speed: null, turns: null, steps: null }
      const count = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0)
      if (usage && typeof usage === 'object') {
        const cacheRead = count(usage.cacheReadTokens)
        const prompt = count(usage.uncachedInputTokens) + cacheRead + count(usage.cacheWriteTokens)
        const total = prompt + count(usage.outputTokens)
        if (total > 0) {
          out.total = total
          if (prompt > 0) out.cacheHit = Math.round((cacheRead / prompt) * 100)
        }
      }
      if (stats && typeof stats === 'object') {
        if (typeof stats.turns === 'number' && stats.turns >= 0) out.turns = stats.turns
        if (typeof stats.steps === 'number' && stats.steps >= 0) out.steps = stats.steps
        const decodeMs = count(stats.decodeMs)
        const decodeTokens = count(stats.decodeTokens)
        if (decodeMs > 0 && decodeTokens > 0) out.speed = decodeTokens / (decodeMs / 1000)
      }
      return out
    }

    /**
     * Fold the official `contextPressure` projection into the numbers the vial
     * and the panel show. The threshold mirrors the documented server formula
     * `floor(min(W × ratio, W − 65,536))`; the output reservation is unknown on
     * the client, so this is the same upper bound `compression_context` reports.
     */
    function vialMeter(pressure, spec) {      const usedRaw = pressure && (pressure.projectedTokens !== undefined ? pressure.projectedTokens : pressure.pressureTokens)
      const used = Number(usedRaw)
      const window = Number(pressure && pressure.contextWindow)
      if (!Number.isFinite(used) || used < 0 || !Number.isFinite(window) || window <= 0) return null
      const ratio = Number(spec && spec.thresholdRatio)
      const retainRatio = Number(spec && spec.retainRatio)
      const threshold = Math.max(1, Math.floor(Math.min(
        window * (Number.isFinite(ratio) && ratio > 0 ? ratio : 0.6),
        window - CONTEXT_HEADROOM,
      )))
      const retain = Math.max(0, Math.floor(window * (Number.isFinite(retainRatio) && retainRatio >= 0 ? retainRatio : 0.16)))
      const until = Math.max(0, threshold - used)
      return {
        used,
        window,
        threshold,
        retain,
        until,
        percent: Math.min(1, used / window),
        thresholdPercent: Math.min(1, threshold / window),
        critical: until <= threshold * 0.15,
      }
    }

    /** Compact token labels for the dock and the vial popover. */
    function tokenLabel(value) {
      const number = Number(value)
      if (!Number.isFinite(number)) return '—'
      if (number >= 1_000_000) {
        const scaled = number / 1_000_000
        return (scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10) + 'M'
      }
      if (number >= 1_000) {
        const scaled = number / 1_000
        return (scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10) + 'K'
      }
      return String(Math.round(number))
    }

    /**
     * Whether the host theme is dark. A palette no longer decides this: the two
     * palettes carry both modes and ride whatever DSH is set to, so the vial
     * reads the document instead of the setting. `body[data-ds-dark-theme]` is
     * the presenter's own attribute, so it wins when present; the CSS
     * `color-scheme` and the media query are the fallbacks for a host without
     * the presenter.
     */
    function hostIsDark() {
      try {
        if (typeof document !== 'undefined' && document.body
          && typeof document.body.hasAttribute === 'function'
          && document.body.hasAttribute('data-ds-dark-theme')) {
          return true
        }
        const scheme = typeof window !== 'undefined' && window.getComputedStyle
          ? window.getComputedStyle(document.documentElement).colorScheme
          : ''
        if (scheme) return scheme.indexOf('dark') >= 0
      } catch {
        // Fall through to the media query.
      }
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
    }

    /**
     * Load one vendored UMD module once. The scripts are served by the host
     * route `/compression-tiers/vendor/<name>`; the version query keeps a stale
     * copy from surviving a plugin update in the browser cache.
     */
    function loadVendor(key) {
      const spec = VENDOR_SCRIPTS[key]
      if (!spec) return Promise.reject(new Error('unknown vendor script: ' + key))
      if (spec.pending) return spec.pending
      spec.pending = new Promise(function (resolve, reject) {
        if (typeof window === 'undefined' || typeof document === 'undefined' || !document.head) {
          reject(new Error('no document'))
          return
        }
        if (window[spec.global]) {
          resolve(window[spec.global])
          return
        }
        const script = document.createElement('script')
        script.src = VENDOR_BASE + spec.file + '?v=' + PLUGIN_VERSION
        script.async = true
        script.onload = function () {
          const lib = window[spec.global]
          if (lib) resolve(lib)
          else reject(new Error('vendor global is missing: ' + spec.global))
        }
        script.onerror = function () {
          reject(new Error('vendor script failed: ' + spec.file))
        }
        document.head.appendChild(script)
      })
      spec.pending.catch(function () {
        // A transient failure (for example the plugin was still activating)
        // must not poison the module for the rest of the session.
        spec.pending = null
      })
      return spec.pending
    }

    /**
     * The settings snapshot is shared by the panel and the composer dock: one
     * request fills the tier spec, the palette and the mascot flag. Actions that
     * write settings hand the response back here so both surfaces agree.
     */
    const settingsCache = { body: null, at: 0, pending: null }
    const SETTINGS_CACHE_MS = 60_000

    function rememberSettings(body) {
      if (!body || typeof body !== 'object') return
      settingsCache.body = body
      settingsCache.at = Date.now()
    }

    function loadSettingsSnapshot() {
      if (settingsCache.body && Date.now() - settingsCache.at < SETTINGS_CACHE_MS) {
        return Promise.resolve(settingsCache.body)
      }
      if (settingsCache.pending) return settingsCache.pending
      settingsCache.pending = fetch(API, { credentials: 'same-origin' })
        .then(readJson)
        .then(function (body) {
          rememberSettings(body)
          return body
        })
        .catch(function () {
          return settingsCache.body
        })
        .then(function (body) {
          settingsCache.pending = null
          return body
        })
      return settingsCache.pending
    }

    /** Ratios for the vial's hover slices; zero usage yields a neutral split. */
    function breakdownRatios(breakdown) {
      if (!breakdown) return [0.08, 0.27, 0.12]
      const system = Number(breakdown.systemTokens) || 0
      const tools = Number(breakdown.toolsTokens) || 0
      const messages = Number(breakdown.messageTokens) || 0
      const total = system + tools + messages
      return total > 0 ? [system / total, tools / total, messages / total] : [0.08, 0.27, 0.12]
    }

    /**
     * Anchor a portalled menu to its trigger. Menus open upward by default:
     * the composer dock sits right above the input card, and the panel picker
     * usually sits in the lower half of the frame. A trigger with too little
     * room above and more room below flips down instead of clipping. A
     * right-aligned trigger (the repository pill) also right-aligns its menu, so
     * the list grows toward the middle instead of past the card edge.
     */
    function placeMenu(node, options) {
      const opts = options || {}
      const rect = node && typeof node.getBoundingClientRect === 'function'
        ? node.getBoundingClientRect()
        : { top: 0, bottom: 0, left: 0, width: 260 }
      const win = typeof window === 'undefined' ? null : window
      const viewportWidth = win && win.innerWidth ? win.innerWidth : 1024
      const viewportHeight = win && win.innerHeight ? win.innerHeight : 768
      const minWidth = typeof opts.minWidth === 'number' ? opts.minWidth : 240
      const extraWidth = typeof opts.extraWidth === 'number' ? opts.extraWidth : 0
      const cap = typeof opts.maxHeight === 'number' ? opts.maxHeight : 320
      const width = Math.min(
        Math.max(minWidth, Math.round(rect.width) + extraWidth),
        Math.max(220, viewportWidth - 24),
      )
      const rawLeft = opts.align === 'end' ? rect.left + rect.width - width : rect.left
      const left = Math.max(8, Math.min(Math.round(rawLeft), Math.round(viewportWidth - width - 8)))
      const gap = 8
      const roomAbove = Math.round(rect.top - gap - 8)
      const roomBelow = Math.round(viewportHeight - rect.bottom - gap - 8)
      const up = roomAbove >= 200 || roomAbove >= roomBelow
      if (up) {
        return {
          up: true,
          left,
          width,
          bottom: Math.round(viewportHeight - rect.top + gap),
          maxHeight: Math.max(140, Math.min(cap, roomAbove)),
        }
      }
      return {
        up: false,
        top: Math.round(rect.bottom + gap),
        left,
        width,
        maxHeight: Math.max(140, Math.min(cap, roomBelow)),
      }
    }

    /** The fixed-position style of a placed menu (see `placeMenu`). */
    function menuStyle(placement) {
      const at = placement || { up: false, left: 0, width: 288, maxHeight: 320 }
      const style = { left: at.left + 'px', width: at.width + 'px', maxHeight: at.maxHeight + 'px' }
      if (at.up) style.bottom = at.bottom + 'px'
      else style.top = at.top + 'px'
      return style
    }

    /**
     * Close a menu from outside: a mousedown on anything but the trigger or the
     * menu, Escape, or a window resize (a fixed-position menu would otherwise
     * keep pointing at where its trigger used to be).
     */
    function useMenuDismiss(open, close, triggerRef, menuRef) {
      React.useEffect(function () {
        if (!open) return undefined
        const doc = typeof document === 'undefined' ? null : document
        const win = typeof window === 'undefined' ? null : window
        const onDown = function (event) {
          const target = event && event.target
          if (triggerRef.current && target && triggerRef.current.contains(target)) return
          if (menuRef.current && target && menuRef.current.contains(target)) return
          close()
        }
        const onKey = function (event) {
          if (event.key === 'Escape') close()
        }
        const onResize = function () { close() }
        if (doc) doc.addEventListener('mousedown', onDown)
        if (doc) doc.addEventListener('keydown', onKey)
        if (win) win.addEventListener('resize', onResize)
        return function () {
          if (doc) doc.removeEventListener('mousedown', onDown)
          if (doc) doc.removeEventListener('keydown', onKey)
          if (win) win.removeEventListener('resize', onResize)
        }
      }, [open])
    }

    /** Move focus into the open menu so the arrow keys work without a click. */
    function useMenuFocus(open, menuRef) {
      React.useLayoutEffect(function () {
        if (!open) return
        const node = menuRef.current
        if (node && typeof node.focus === 'function') node.focus()
      }, [open])
    }

    /**
     * The index a listbox key moves the highlight to, or null when the key is
     * not a move: Enter selects and Escape closes, and both belong to the
     * caller.
     */
    function menuMove(key, current, count) {
      if (count <= 0) return null
      if (key === 'Home') return 0
      if (key === 'End') return count - 1
      const index = typeof current === 'number' && current >= 0 ? current % count : 0
      if (key === 'ArrowDown') return (index + 1) % count
      if (key === 'ArrowUp') return (index - 1 + count) % count
      return null
    }

    /**
     * The optical context vial. The dock shows a one-line reading; opening it
     * mounts the vendored shallow-water vial in a portalled dialog with the
     * live pressure, the tier threshold and the system/tools/conversation
     * split from the official `contextBreakdown` projection.
     */
    function ContextVial(props) {
      const t = props.t
      const meter = props.meter || null
      const breakdown = props.breakdown || null
      const usage = props.usage || { total: null, cacheHit: null, speed: null, turns: null, steps: null }
      const appearance = props.appearance || DEFAULT_APPEARANCE
      const [open, setOpen] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const triggerRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const canvasRef = React.useRef(null)
      const controllerRef = React.useRef(null)
      const loopRef = React.useRef(0)
      const openRef = React.useRef(false)
      const placement = React.useRef(null)
      const stateRef = React.useRef(null)
      const lastTickRef = React.useRef(0)
      openRef.current = open

      const ratios = breakdownRatios(breakdown)
      stateRef.current = {
        fill: meter ? Math.max(0.06, Math.min(0.95, meter.percent)) : 0.06,
        maxTokens: meter ? meter.window : 512000,
        isDark: hostIsDark(),
        critical: Boolean(meter && meter.critical),
        streaming: false,
        hoveredSlice: -1,
        ratios: ratios,
        accentTone: 'cobalt',
        lightPreset: 'crystal',
      }

      function startLoop() {
        if (loopRef.current || typeof requestAnimationFrame !== 'function') return
        lastTickRef.current = 0
        const tick = function (now) {
          loopRef.current = 0
          const controller = controllerRef.current
          if (!controller || !openRef.current) return
          if (!lastTickRef.current) lastTickRef.current = now
          const dt = Math.max(0.001, Math.min(0.05, (now - lastTickRef.current) / 1000))
          lastTickRef.current = now
          controller.step(dt)
          if (!controller.isSettled()) loopRef.current = requestAnimationFrame(tick)
        }
        loopRef.current = requestAnimationFrame(tick)
      }

      React.useEffect(function () {
        if (!open) return undefined
        setFailed(false)
        let disposed = false
        loadVendor('vial').then(function (lib) {
          if (disposed || !canvasRef.current || typeof lib.mountPhysicalWaterVial !== 'function') return
          controllerRef.current = lib.mountPhysicalWaterVial(canvasRef.current, {
            fill: stateRef.current.fill,
            maxTokens: stateRef.current.maxTokens,
            isDark: stateRef.current.isDark,
            accentTone: 'cobalt',
            camp: 'gemini',
            streaming: false,
            reducedMotion: appearance.motion === 'off',
            getState: function () { return stateRef.current },
            onWake: function () { startLoop() },
          })
          startLoop()
        }).catch(function () {
          if (!disposed) setFailed(true)
        })
        return function () {
          disposed = true
          if (loopRef.current) {
            cancelAnimationFrame(loopRef.current)
            loopRef.current = 0
          }
          const controller = controllerRef.current
          controllerRef.current = null
          if (controller && typeof controller.dispose === 'function') {
            try { controller.dispose() } catch { /* the canvas may already be gone */ }
          }
        }
      }, [open])

      // New numbers, palette or motion tier wake the settled simulator.
      React.useEffect(function () {
        if (!open) return
        const controller = controllerRef.current
        if (!controller) return
        if (typeof controller.wake === 'function') controller.wake()
        startLoop()
      }, [open, meter && meter.used, appearance.palette, appearance.motion])

      useMenuDismiss(open, closeVial, triggerRef, panelRef)

      function closeVial() {
        setOpen(false)
        const node = triggerRef.current
        if (node && typeof node.focus === 'function') {
          try { node.focus() } catch { /* focus can fail while unmounting */ }
        }
      }

      function toggle() {
        if (open) {
          closeVial()
          return
        }
        const node = triggerRef.current
        if (!node || typeof node.getBoundingClientRect !== 'function') return
        placement.current = placeMenu(node, { minWidth: 392, extraWidth: 8, maxHeight: 380, align: 'end' })
        setOpen(true)
        if (typeof props.onPoke === 'function') {
          try { props.onPoke() } catch { /* the mascot stage is optional */ }
        }
      }

      const percentValue = meter ? Math.min(100, Math.round(meter.percent * 100)) : null
      const percentText = percentValue === null ? '—' : percentValue + '%'
      const ariaLabel = t('vialAria') + ' ' + (meter ? percentText : t('vialUnavailable'))
      const fillRatio = meter ? Math.max(0.06, Math.min(1, meter.percent)) : 0
      const liquidHeight = 15 * fillRatio
      const liquidY = 16.5 - liquidHeight
      const thresholdY = 16.5 - 15 * (meter ? meter.thresholdPercent : 0.6)

      const trigger = h('button', {
        key: 'vial-trigger',
        type: 'button',
        ref: triggerRef,
        className: 'ct-vial',
        'data-critical': meter && meter.critical ? 'true' : 'false',
        'data-empty': meter ? 'false' : 'true',
        'aria-haspopup': 'dialog',
        'aria-expanded': open ? 'true' : 'false',
        'aria-label': ariaLabel,
        title: ariaLabel,
        onClick: toggle,
      },
      h('svg', { className: 'ct-vial-mini', viewBox: '0 0 10 18', 'aria-hidden': 'true' },
        h('rect', { className: 'ct-vial-track', x: '2', y: '1.5', width: '6', height: '15', rx: '2.4' }),
        meter
          ? h('rect', { className: 'ct-vial-liquid', x: '2.8', y: String(liquidY), width: '4.4', height: String(liquidHeight), rx: '1.6' })
          : null,
        meter
          ? h('line', { className: 'ct-vial-threshold', x1: '1.2', x2: '8.8', y1: String(thresholdY), y2: String(thresholdY) })
          : null),
      h('span', { className: 'ct-vial-pct' }, percentText))

      if (!open) return trigger

      const usedParts = breakdown
        ? {
            system: Number(breakdown.systemTokens) || 0,
            tools: Number(breakdown.toolsTokens) || 0,
            messages: Number(breakdown.messageTokens) || 0,
          }
        : null
      const usedTotal = usedParts ? usedParts.system + usedParts.tools + usedParts.messages : 0
      const barSegments = usedParts && usedTotal > 0
        ? [
            { kind: 'system', width: usedParts.system / usedTotal * 100 },
            { kind: 'tools', width: usedParts.tools / usedTotal * 100 },
            { kind: 'messages', width: usedParts.messages / usedTotal * 100 },
          ].filter(function (part) { return part.width > 0 })
        : [{ kind: 'total', width: 100 }]

      function row(key, label, value) {
        return h('div', { className: 'ct-vial-row', key: key },
          h('dt', null, label),
          h('dd', null, value))
      }

      const body = meter
        ? [
            h('div', { className: 'ct-vial-stats', key: 'stats' },
              h('div', { className: 'ct-vial-percent' }, percentText),
              h('div', { className: 'ct-vial-numbers' }, tokenLabel(meter.used) + ' / ' + tokenLabel(meter.window)),
              h('dl', { className: 'ct-vial-rows' },
                row('used', t('vialUsed'), tokenLabel(meter.used)),
                row('window', t('vialWindow'), tokenLabel(meter.window)),
                row('threshold', t('vialThreshold'), tokenLabel(meter.threshold) + ' · ' + Math.round(meter.thresholdPercent * 100) + '%'),
                row('retain', t('vialRetain'), tokenLabel(meter.retain)),
                row('until', t('vialUntil'), tokenLabel(meter.until))),
              h('div', { className: 'ct-vial-bar', role: 'presentation' },
                barSegments.map(function (part) {
                  return h('i', { key: part.kind, 'data-kind': part.kind, style: { width: part.width + '%' } })
                })),
              usedParts
                ? h('div', { className: 'ct-vial-legend' },
                    h('div', { className: 'ct-vial-legend-row' },
                      h('span', { className: 'ct-vial-dot', 'data-kind': 'system' }),
                      h('span', null, t('vialSystem')),
                      h('span', null, tokenLabel(usedParts.system))),
                    h('div', { className: 'ct-vial-legend-row' },
                      h('span', { className: 'ct-vial-dot', 'data-kind': 'tools' }),
                      h('span', null, t('vialTools')),
                      h('span', null, tokenLabel(usedParts.tools))),
                    h('div', { className: 'ct-vial-legend-row' },
                      h('span', { className: 'ct-vial-dot', 'data-kind': 'messages' }),
                      h('span', null, t('vialMessages')),
                      h('span', null, tokenLabel(usedParts.messages))))
                : null,
              usage.total !== null || usage.speed !== null || usage.turns !== null
                ? h('dl', { className: 'ct-vial-rows ct-vial-usage' },
                    usage.total !== null ? row('usageTotal', t('vialUsage'), tokenLabel(usage.total)) : null,
                    usage.cacheHit !== null ? row('usageCache', t('vialUsageCache'), usage.cacheHit + '%') : null,
                    usage.speed !== null ? row('usageSpeed', t('vialUsageSpeed'), (Math.round(usage.speed * 10) / 10) + ' tok/s') : null,
                    usage.turns !== null || usage.steps !== null
                      ? row('usageTurns', t('vialUsageTurns'),
                          (usage.turns === null ? '—' : usage.turns) + ' / ' + (usage.steps === null ? '—' : usage.steps))
                      : null)
                : null)
          ]
        : [
            h('div', { className: 'ct-vial-stats', key: 'empty' },
              h('div', { className: 'ct-vial-percent' }, '—'),
              h('p', { className: 'ct-vial-empty' }, t('vialUnavailable')))
          ]

      const popover = h('div', {
        key: 'vial-popover',
        ref: panelRef,
        className: 'ct-vial-popover ct-skin',
        'data-palette': appearance.palette,
        'data-motion': appearance.motion,
        'data-side': placement.current && placement.current.up === false ? 'down' : 'up',
        'data-critical': meter && meter.critical ? 'true' : 'false',
        role: 'dialog',
        'aria-label': t('vialTitle'),
        tabIndex: -1,
        style: menuStyle(placement.current),
      },
      h('div', { className: 'ct-vial-head' },
        h('span', { className: 'ct-vial-head-title' },
          h('span', null, t('vialTitle')),
          h('span', { className: 'ct-vial-level' }, labelOf(t, props.level))),
        h('button', {
          type: 'button',
          className: 'ct-vial-close',
          'aria-label': t('vialClose'),
          title: t('vialClose'),
          onClick: closeVial,
        }, '×')),
      h('div', { className: 'ct-vial-body' },
        h('canvas', { className: 'ct-vial-canvas', ref: canvasRef, width: 96, height: 220, 'aria-hidden': 'true' }),
        body),
      failed ? h('p', { className: 'ct-note', role: 'status' }, t('vialUnavailable')) : null)

      return [
        trigger,
        typeof ReactDOM !== 'undefined' && ReactDOM && typeof ReactDOM.createPortal === 'function'
          ? ReactDOM.createPortal(popover, document.body)
          : popover,
      ]
    }

    /**
     * The vendored pixel companions, mounted into a fixed 220×84 stage. The
     * stage owns its DOM (three mini crabs plus the cat/clawd pair); React only
     * provides the host element and disposes the stage on unmount.
     */
    function MascotStage(props) {
      const hostRef = React.useRef(null)
      const stageRef = React.useRef(null)
      const [state, setState] = React.useState('loading')

      React.useEffect(function () {
        let disposed = false
        loadVendor('mascot').then(function (lib) {
          if (disposed || !hostRef.current || typeof lib.mountDualMascotStage !== 'function') return
          const stage = lib.mountDualMascotStage(hostRef.current, {
            mascot: 'minis',
            camp: 'gemini',
            reducedMotion: props.motion === 'off',
            // Do not write the rainbow easter egg into the host's localStorage.
            storage: { getItem: function () { return null }, setItem: function () {}, removeItem: function () {} },
          })
          if (!stage) {
            setState('failed')
            return
          }
          stageRef.current = stage
          if (props.stageRef) props.stageRef.current = stage
          setState('ready')
        }).catch(function () {
          if (!disposed) setState('failed')
        })
        return function () {
          disposed = true
          const stage = stageRef.current
          stageRef.current = null
          if (props.stageRef) props.stageRef.current = null
          if (stage && typeof stage.dispose === 'function') {
            try { stage.dispose() } catch { /* the host may already be gone */ }
          }
        }
      }, [])

      React.useEffect(function () {
        const stage = stageRef.current
        if (stage && typeof stage.setState === 'function') {
          stage.setState({ reducedMotion: props.motion === 'off' })
        }
      }, [props.motion])

      return h('div', {
        ref: hostRef,
        className: 'ct-mascot-stage',
        'data-state': state,
        'aria-hidden': 'true',
      })
    }

    /* ---- Reasoning effort slider -------------------------------------------
       DSH has a real reasoning level. The official model menu's root pane has
       a model row and a reasoning-level row — the latter only when the current
       model advertises `reasoning.efforts`. This slider is injected under that
       row and writes through the same per-session directory the official menu
       writes through, so the official row shows the new level as soon as the
       selection settles and the two entry points can never disagree.

       Everything here is fail-open: a host without the `modelDirectories`
       service, a session without a directory, a closed menu, a model without
       levels or a rejected selection all leave the official menu exactly as it
       was. There is no decorative control: if the write cannot happen, the
       slider is not rendered. */
    let modelDirectories = null
    const EFFORT_MIN_LEVELS = 2
    const EFFORT_KNOB = 28
    /* The row is labelled `menu.effort` in the official dictionaries (zh
       推理等级 / en Effort). Free-tier and subscription pickers can contribute
       extra rows to the same pane, so the label decides and the two-row layout
       is only the positional fallback — painting the rail under a Speed row
       would make the slider write the wrong setting. */
    const EFFORT_ROW_LABELS = [
      '推理等级', '推理强度', '強度', '推論の強さ',
      'Effort', 'Reasoning effort', 'Effort de raisonnement',
      'Esfuerzo', 'Aufwand', 'Esforço',
      'Усилие', 'Интенсивность рассуждений',
    ]
    /* `directoryFor()` throws while the session scope is not ready yet and the
       host rebuilds the directory when the model generation changes, so the
       instance is re-resolved instead of being cached for the session's life. */
    const EFFORT_RETRY_DELAYS = [60, 240, 540, 960, 1500, 3000]
    const EFFORT_LOAD_GAP = 400

    /** The current model's reasoning levels, or null when there is nothing to slide. */
    function effortStateOf(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') return null
      const current = snapshot.current
      if (!current || typeof current.provider !== 'string' || typeof current.model !== 'string') return null
      const groups = Array.isArray(snapshot.groups) ? snapshot.groups : []
      let reasoning = null
      for (const group of groups) {
        if (!group || group.id !== current.provider || !Array.isArray(group.models)) continue
        for (const model of group.models) {
          if (model && model.id === current.model && model.reasoning) reasoning = model.reasoning
        }
      }
      if (!reasoning || !Array.isArray(reasoning.efforts)) return null
      const levels = []
      for (const effort of reasoning.efforts) {
        if (!effort || typeof effort.id !== 'string' || !effort.id) continue
        levels.push({
          id: effort.id,
          name: typeof effort.name === 'string' && effort.name ? effort.name : effort.id,
        })
      }
      if (levels.length < EFFORT_MIN_LEVELS) return null
      const saved = typeof current.reasoningEffort === 'string' && current.reasoningEffort
        ? current.reasoningEffort
        : ''
      const fallback = typeof reasoning.defaultEffort === 'string' ? reasoning.defaultEffort : ''
      const at = levels.findIndex(function (level) { return level.id === (saved || fallback) })
      return {
        provider: current.provider,
        model: current.model,
        levels: levels,
        index: at < 0 ? 0 : at,
        busy: snapshot.status === 'selecting' || snapshot.status === 'loading',
      }
    }

    function effortRatio(pct) {
      const value = Number(pct)
      if (!Number.isFinite(value)) return 0
      return Math.min(1, Math.max(0, value))
    }

    /** Where the knob sits: half a knob inset at both ends, so it never leaves the rail. */
    function effortKnobLeft(pct) {
      const ratio = Math.round(effortRatio(pct) * 1000) / 1000
      return 'calc(' + EFFORT_KNOB / 2 + 'px + (100% - ' + EFFORT_KNOB + 'px) * ' + ratio + ')'
    }

    /** The level under a pointer position, as an index on the same rail. */
    function effortIndexAt(pct, count) {
      const steps = Math.max(1, Number(count) - 1)
      return Math.round(effortRatio(pct) * steps)
    }

    function stepEffort(index, delta, count) {
      const steps = Math.max(1, Number(count) - 1)
      const at = Math.min(Math.max(0, Math.round(Number(index) || 0)), steps)
      return Math.min(Math.max(0, at + (Number(delta) || 0)), steps)
    }

    /**
     * Colour by position, not by level name: a light level and a heavy level may
     * be called anything in any locale, but the rail is always short → long.
     */
    function effortRamp(pct) {
      const hue = Math.round(205 + effortRatio(pct) * 80)
      return {
        hue: hue,
        accent: 'hsl(' + hue + ' 92% 62%)',
        soft: 'hsl(' + hue + ' 88% 62% / 0.3)',
        glow: 'hsl(' + hue + ' 92% 66% / 0.5)',
      }
    }

    /* Energy curve of the reference slider: nothing before the second tier, half
       strength on `high`, full on `max`. It is driven by position, not by level
       names, so any model's ladder gets the same feel. */
    const EFFORT_ENERGY_START = 1 / 3
    const EFFORT_STAR_COUNT = 22
    const EFFORT_GOLDEN = 0.6180339887498949
    const EFFORT_MIN_HEIGHT_SLOTS = 2
    const EFFORT_STAR_BASE_SECONDS = 2

    function effortEnergy(pct) {
      const t = effortRatio(pct)
      return Math.max(0, Math.min(1, (t - EFFORT_ENERGY_START) / (1 - EFFORT_ENERGY_START)))
    }

    /** More energy, faster stardust — 0.55× on the left, 2× at the top. */
    function effortSpeed(pct) {
      return Math.min(2, Math.max(0.55, 3 * effortRatio(pct) - 1))
    }

    function effortHash01(index, salt) {
      const value = ((index + 1) * salt * 2654435761) % 4294967296
      return ((value >>> 8) % 1000) / 1000
    }

    /* Deterministic starfield: phases from a golden-ratio sequence (any prefix of
       it spreads evenly), heights from a hashed permutation of evenly spaced
       slots. No random number, so a re-render never reshuffles the sky. */
    const EFFORT_STARS = (function buildEffortStars() {
      const count = EFFORT_STAR_COUNT
      const stars = []
      for (let i = 0; i < count; i += 1) {
        stars.push({ y: 0, phase: ((i + 1) * EFFORT_GOLDEN) % 1, duration: 0, delay: 0 })
      }
      const byPhase = stars.map(function (_, i) { return i })
      byPhase.sort(function (a, b) { return stars[a].phase - stars[b].phase })
      let slots = null
      for (let salt = 71; salt < 4000 && slots === null; salt += 1) {
        const candidate = stars.map(function (_, i) { return i })
        candidate.sort(function (a, b) {
          const ha = effortHash01(a, salt)
          const hb = effortHash01(b, salt)
          return ha === hb ? a - b : ha - hb
        })
        let ok = true
        for (let k = 1; k < count && ok; k += 1) {
          if (Math.abs(candidate[k] - candidate[k - 1]) < EFFORT_MIN_HEIGHT_SLOTS) ok = false
        }
        if (ok) slots = candidate
      }
      if (slots === null) {
        slots = []
        for (let i = 0; i < count; i += 1) slots.push((i * 5) % count)
      }
      for (let rank = 0; rank < count; rank += 1) {
        stars[byPhase[rank]].y = 8 + (slots[rank] / (count - 1)) * 84
      }
      for (let i = 0; i < count; i += 1) {
        // Per-star duration spread (±8%) keeps them from marching in lockstep.
        const spread = 0.92 + 0.16 * effortHash01(i, 29)
        stars[i].duration = EFFORT_STAR_BASE_SECONDS * spread
        const jitter = effortHash01(i, 53) * 0.03
        stars[i].delay = -((stars[i].phase + jitter) % 1) * stars[i].duration
      }
      return stars
    })()

    /**
     * The injected control: one 28px pill track, an accent fill, 3px ticks and a
     * white circular knob — the geometry of the reference slider, drawn with our
     * own DOM because it lives inside a React-owned menu.
     */
    function createEffortSlider(doc, handlers) {      const hooks = handlers || {}
      const root = doc.createElement('div')
      root.setAttribute('class', 'ct-effort')
      root.setAttribute('role', 'presentation')

      const track = doc.createElement('div')
      track.setAttribute('class', 'ct-effort-track')
      track.setAttribute('role', 'slider')
      track.setAttribute('tabindex', '0')
      track.setAttribute('aria-valuemin', '0')
      root.appendChild(track)

      const fill = doc.createElement('span')
      fill.setAttribute('class', 'ct-effort-fill')
      fill.setAttribute('aria-hidden', 'true')
      track.appendChild(fill)

      const energy = doc.createElement('span')
      energy.setAttribute('class', 'ct-effort-energy')
      energy.setAttribute('aria-hidden', 'true')
      const sweep = doc.createElement('span')
      sweep.setAttribute('class', 'ct-effort-energy-sweep')
      energy.appendChild(sweep)
      track.appendChild(energy)

      const stars = doc.createElement('span')
      stars.setAttribute('class', 'ct-effort-stars')
      stars.setAttribute('aria-hidden', 'true')
      track.appendChild(stars)
      const starNodes = EFFORT_STARS.map(function (star, index) {
        const row = doc.createElement('span')
        row.setAttribute('class', 'ct-effort-star')
        row.setAttribute('data-star', String(index))
        row.style.setProperty('top', star.y + '%')
        row.style.setProperty('animation-duration', star.duration.toFixed(3) + 's')
        row.style.setProperty('animation-delay', star.delay.toFixed(3) + 's')
        const dot = doc.createElement('span')
        dot.setAttribute('class', 'ct-effort-star-dot')
        dot.style.setProperty('--ct-effort-b', (0.5 + 0.5 * effortHash01(index, 61)).toFixed(3))
        row.appendChild(dot)
        stars.appendChild(row)
        return { row: row, dot: dot }
      })

      const knob = doc.createElement('span')
      knob.setAttribute('class', 'ct-effort-gem')
      knob.setAttribute('aria-hidden', 'true')
      track.appendChild(knob)
      const ticks = []

      const error = doc.createElement('p')
      error.setAttribute('class', 'ct-effort-error')
      error.setAttribute('role', 'alert')
      root.appendChild(error)

      const view = { levels: [], index: 0, busy: false, motion: 'full' }
      let dragging = false
      let preview = -1

      function paint() {
        const count = view.levels.length
        const at = preview >= 0 ? preview : view.index
        const steps = Math.max(1, count - 1)
        const pct = count <= 1 ? 0 : Math.min(1, Math.max(0, at / steps))
        const ramp = effortRamp(pct)
        // Pill geometry: the knob centre runs from 14px to (100% - 14px), and the
        // fill ends at that same centre (the reference slider's fill radius).
        // The tube keeps the host accent; only the top level turns violet (the
        // reference's "energy" state) and picks up a glow.
        root.style.setProperty('--ct-effort-accent', 'var(--dsw-alias-state-business-primary, #4d93f8)')
        root.style.setProperty('--ct-effort-glow', pct >= 0.999 ? 'hsl(270 86% 62% / 0.55)' : ramp.glow)
        fill.style.setProperty('width', effortKnobLeft(pct))
        knob.style.setProperty('left', effortKnobLeft(pct))
        const energyLevel = effortEnergy(pct)
        const left = effortKnobLeft(pct)
        energy.style.setProperty('width', left)
        stars.style.setProperty('width', left)
        root.style.setProperty('--ct-effort-energy', energyLevel.toFixed(3))
        root.setAttribute('data-energy', energyLevel > 0.001 ? '1' : '0')
        stars.style.setProperty('--ct-effort-star-opacity', (0.6 + 0.4 * energyLevel).toFixed(3))
        // Stars arrive one by one as the rail fills: the k-th dot needs its own
        // slice of the remaining travel, and only the last few stay faint.
        starNodes.forEach(function (node, index) {
          const threshold = index / EFFORT_STARS.length
          const reveal = Math.min(1, Math.max(0, (energyLevel - threshold) / 0.22))
          node.dot.style.setProperty('opacity', reveal.toFixed(3))
        })
        const rate = effortSpeed(pct)
        starNodes.forEach(function (node) {
          const anims = typeof node.row.getAnimations === 'function' ? node.row.getAnimations() : []
          for (const anim of anims) {
            try { anim.playbackRate = rate } catch { /* animation may be gone */ }
          }
        })
        ticks.forEach(function (tick, index) {
          const tickPct = count <= 1 ? 0 : index / steps
          tick.style.setProperty('left', effortKnobLeft(tickPct))
          tick.style.setProperty('opacity', index <= at ? '0.9' : '0.4')
        })
        while (ticks.length < count) {
          const tick = doc.createElement('span')
          tick.setAttribute('class', 'ct-effort-dot')
          tick.setAttribute('aria-hidden', 'true')
          track.insertBefore(tick, knob)
          ticks.push(tick)
        }
        const level = view.levels[at]
        root.setAttribute('data-busy', view.busy ? 'true' : 'false')
        root.setAttribute('data-motion', view.motion === 'off' ? 'off' : 'full')
        root.setAttribute('data-levels', String(count))
        track.setAttribute('aria-valuemax', String(Math.max(0, count - 1)))
        track.setAttribute('aria-valuenow', String(at))
        track.setAttribute('aria-valuetext', level ? level.name : '')
        track.setAttribute('aria-label', hooks.ariaLabel || '')
        error.textContent = hooks.errorText || ''
      }

      function commit(index) {
        preview = -1
        if (view.busy || index === view.index) {
          paint()
          return
        }
        view.index = index
        paint()
        if (typeof hooks.onChange === 'function') hooks.onChange(index)
      }

      function ratioAt(clientX) {
        const rect = typeof track.getBoundingClientRect === 'function' ? track.getBoundingClientRect() : null
        if (!rect || !rect.width) return 0
        const pad = EFFORT_KNOB / 2
        return (Number(clientX) - rect.left - pad) / Math.max(1, rect.width - EFFORT_KNOB)
      }

      track.addEventListener('pointerdown', function (event) {
        if (view.busy) return
        if (event.preventDefault) event.preventDefault()
        dragging = true
        preview = effortIndexAt(ratioAt(event.clientX), view.levels.length)
        paint()
        try { track.setPointerCapture(event.pointerId) } catch { /* older engines */ }
      })
      track.addEventListener('pointermove', function (event) {
        if (!dragging) return
        preview = effortIndexAt(ratioAt(event.clientX), view.levels.length)
        paint()
      })
      track.addEventListener('pointerup', function (event) {
        if (!dragging) return
        dragging = false
        commit(effortIndexAt(ratioAt(event.clientX), view.levels.length))
      })
      track.addEventListener('pointercancel', function () {
        dragging = false
        preview = -1
        paint()
      })
      track.addEventListener('keydown', function (event) {
        const key = event && event.key
        if (!key) return
        let next = null
        if (key === 'ArrowRight' || key === 'ArrowUp') next = stepEffort(view.index, 1, view.levels.length)
        else if (key === 'ArrowLeft' || key === 'ArrowDown') next = stepEffort(view.index, -1, view.levels.length)
        else if (key === 'Home') next = 0
        else if (key === 'End') next = Math.max(0, view.levels.length - 1)
        if (next === null) return
        if (event.preventDefault) event.preventDefault()
        commit(next)
      })

      paint()

      return {
        element: root,
        update: function (next) {
          if (!next) return
          view.levels = Array.isArray(next.levels) ? next.levels : []
          view.index = Math.max(0, Math.min(view.levels.length - 1, Number(next.index) || 0))
          view.busy = next.busy === true
          view.motion = next.motion === 'off' ? 'off' : 'full'
          paint()
        },
        isDragging: function () { return dragging },
        destroy: function () {
          if (root.parentNode) root.parentNode.removeChild(root)
        },
      }
    }

    /** The label a menu row shows: its first `span`, else its own text. */
    function effortRowLabel(row) {
      if (!row) return ''
      let text = ''
      if (typeof row.querySelectorAll === 'function') {
        const spans = row.querySelectorAll('span')
        const first = spans && spans[0] ? spans[0] : null
        if (first && typeof first.textContent === 'string') text = first.textContent
      }
      if (!text && typeof row.textContent === 'string') text = row.textContent
      return text.replace(/\s+/g, ' ').trim()
    }

    /** True when `node` still sits directly after `row` — React may move both. */
    function effortFollowsRow(node, row) {
      if (!node || !row || node.parentNode !== row.parentNode) return false
      if (node.previousSibling !== undefined) return node.previousSibling === row
      const children = row.parentNode && row.parentNode.childNodes
      if (!children) return false
      const at = Array.prototype.indexOf.call(children, row)
      return at >= 0 && children[at + 1] === node
    }

    /**
     * Find the official reasoning row. Semantic attributes only — DSH's class
     * names are CSS-module hashes and change between builds. The label decides
     * which row it is; a pane with exactly two rows is the documented layout.
     */
    function findReasoningRow(doc) {
      if (!doc || typeof doc.querySelectorAll !== 'function') return null
      const triggers = doc.querySelectorAll('button[aria-haspopup="menu"][aria-expanded="true"]')
      const candidates = []
      for (let i = 0; i < triggers.length; i += 1) {
        const trigger = triggers[i]
        const id = typeof trigger.getAttribute === 'function' ? trigger.getAttribute('aria-controls') : ''
        if (!id || typeof doc.getElementById !== 'function') continue
        const menu = doc.getElementById(id)
        if (!menu || typeof menu.querySelectorAll !== 'function') continue
        const rows = menu.querySelectorAll('button[role="menuitem"]')
        if (!rows || rows.length < EFFORT_MIN_LEVELS) continue
        let row = null
        let labelled = false
        for (let r = 0; r < rows.length; r += 1) {
          const text = effortRowLabel(rows[r])
          if (text) labelled = true
          if (!row && EFFORT_ROW_LABELS.indexOf(text) >= 0) row = rows[r]
        }
        /* Unknown rows stay untouched: an unknown second row may belong to
           another picker. Unlabelled panes fall back to the documented layout. */
        if (!row && !labelled && rows.length === 2) row = rows[1]
        if (!row) continue
        const owned = typeof trigger.closest === 'function' && trigger.closest('[data-composer-card]')
        candidates.push({ trigger: trigger, menu: menu, row: row, owned: Boolean(owned) })
      }
      const preferred = candidates.filter(function (item) { return item.owned })
      if (preferred.length > 0) return preferred[0]
      return candidates.length > 0 ? candidates[0] : null
    }

    /**
     * The bridge between the per-session model directory and the injected
     * slider: subscribes to the directory, follows the menu opening and
     * closing, and writes selections back through `directory.select`.
     */
    const effortBridge = {
      directory: null,
      sessionId: '',
      observer: null,
      unsubscribe: null,
      frame: 0,
      retryTimer: 0,
      retryIndex: 0,
      loadAt: 0,
      node: null,
      menu: null,
      slider: null,
      view: null,
      labels: { ariaLabel: '', errorPrefix: '' },
      motion: 'full',
      error: '',
    }

    /** The document the bridge reads; tests swap in a fake one. */
    let effortDocument = null
    function effortDoc() {
      if (effortDocument) return effortDocument
      return typeof document === 'undefined' ? null : document
    }

    /** Ask the directory to fill itself; the store renders its own load state. */
    function kickEffortLoad(directory) {
      if (!directory || typeof directory.load !== 'function') return
      const now = Date.now()
      if (now - effortBridge.loadAt < EFFORT_LOAD_GAP) return
      effortBridge.loadAt = now
      try {
        Promise.resolve(directory.load()).catch(function () { /* the store carries the error */ })
      } catch { /* sync throw: same, the store reports it */ }
    }

    function releaseEffortSubscription() {
      if (!effortBridge.unsubscribe) return
      try { effortBridge.unsubscribe() } catch { /* already gone */ }
      effortBridge.unsubscribe = null
    }

    /**
     * The live directory for this session, or null. Re-resolved on every read:
     * `directoryFor()` throws until the session scope is ready, and the host
     * swaps the instance out when the model generation changes. A failed
     * re-resolve keeps the instance we already had — the store subscription
     * still feeds it, and dropping it would make the rail vanish mid-session.
     */
    function resolveEffortDirectory() {
      if (!modelDirectories || typeof modelDirectories.directoryFor !== 'function' || !effortBridge.sessionId) {
        return effortBridge.directory || null
      }
      let fresh = null
      try { fresh = modelDirectories.directoryFor(effortBridge.sessionId) } catch { fresh = null }
      if (!fresh || !fresh.store || typeof fresh.store.getSnapshot !== 'function') return effortBridge.directory || null
      if (fresh === effortBridge.directory) return fresh
      releaseEffortSubscription()
      effortBridge.directory = fresh
      if (typeof fresh.store.subscribe === 'function') {
        try {
          effortBridge.unsubscribe = fresh.store.subscribe(function () { scheduleEffortSync() })
        } catch {
          effortBridge.unsubscribe = null
        }
      }
      kickEffortLoad(fresh)
      scheduleEffortSync()
      return fresh
    }

    /** Retry a directory that is not ready yet, a few times, then stop asking. */
    function scheduleEffortRetry() {
      if (effortBridge.retryTimer || effortBridge.retryIndex >= EFFORT_RETRY_DELAYS.length) return
      const delay = EFFORT_RETRY_DELAYS[effortBridge.retryIndex]
      effortBridge.retryIndex += 1
      effortBridge.retryTimer = setTimeout(function () {
        effortBridge.retryTimer = 0
        if (!effortBridge.sessionId) return
        if (resolveEffortDirectory()) {
          effortBridge.retryIndex = 0
          scheduleEffortSync()
          return
        }
        // Without this the first failed retry would end the self-heal chain and
        // the control would stay dead for the rest of the session.
        scheduleEffortRetry()
      }, delay)
    }

    function detachEffortSlider() {
      if (effortBridge.slider) {
        try { effortBridge.slider.destroy() } catch { /* already gone with the menu */ }
      }
      effortBridge.slider = null
      effortBridge.node = null
      effortBridge.menu = null
    }

    /** Paint the attached slider from the directory; attaches when the menu just opened. */
    function syncEffortSlider() {
      effortBridge.frame = 0
      const doc = effortDoc()
      if (!doc) return
      const directory = resolveEffortDirectory()
      if (!directory || !directory.store || typeof directory.store.getSnapshot !== 'function') {
        detachEffortSlider()
        if (effortBridge.sessionId) scheduleEffortRetry()
        return
      }
      /* An idle store has no levels yet; `load()` shares the catalog the
         official row uses and answers from cache once it is ready. */
      kickEffortLoad(directory)
      let snapshot = null
      try { snapshot = directory.store.getSnapshot() } catch { snapshot = null }
      const view = effortStateOf(snapshot)
      effortBridge.view = view
      if (!view) {
        detachEffortSlider()
        return
      }
      const found = findReasoningRow(doc)
      if (!found) {
        detachEffortSlider()
        return
      }
      /* React may reuse the row and drop our node when it swaps panes, so the
         attachment is re-checked on every pass instead of trusting the flag. */
      const attached = effortBridge.slider && effortBridge.menu === found.menu
        && effortFollowsRow(effortBridge.node, found.row)
      if (!attached) {
        detachEffortSlider()
        const slider = createEffortSlider(doc, {
          ariaLabel: effortBridge.labels.ariaLabel,
          errorText: effortBridge.error,
          onChange: function (index) { selectEffort(index) },
        })
        const parent = found.row.parentNode
        if (!parent || typeof parent.insertBefore !== 'function') return
        parent.insertBefore(slider.element, found.row.nextSibling || null)
        effortBridge.slider = slider
        effortBridge.node = slider.element
        effortBridge.menu = found.menu
        /* No `resize` dispatch here: some hosts close the menu on resize, and
           a CSS-anchored menu follows the added height by itself. */
      }
      if (effortBridge.slider) {
        effortBridge.slider.element.setAttribute('data-busy', view.busy ? 'true' : 'false')
        effortBridge.slider.update({
          levels: view.levels,
          index: view.index,
          busy: view.busy,
          motion: effortBridge.motion,
        })
        const error = effortBridge.slider.element.querySelector
          ? effortBridge.slider.element.querySelector('.ct-effort-error')
          : null
        if (error) error.textContent = effortBridge.error
      }
    }

    function scheduleEffortSync() {
      if (effortBridge.frame) return
      const run = function () { syncEffortSlider() }
      if (typeof requestAnimationFrame === 'function') {
        effortBridge.frame = requestAnimationFrame(run)
      } else {
        effortBridge.frame = setTimeout(run, 16)
      }
    }

    /** Write one level through the official directory; roll back on refusal. */
    function selectEffort(index) {
      const directory = resolveEffortDirectory()
      const view = effortBridge.view
      if (!directory || !view || typeof directory.select !== 'function') return
      const level = view.levels[index]
      if (!level) return
      // Roll back to what the host actually holds, not to the optimistic paint.
      let confirmed = view.index
      try {
        const state = effortStateOf(directory.store.getSnapshot())
        if (state) confirmed = state.index
      } catch { /* keep the painted index */ }
      const previous = confirmed
      effortBridge.error = ''

      let pending = null
      try {
        pending = Promise.resolve(directory.select({
          provider: view.provider,
          model: view.model,
          reasoningEffort: level.id,
        }))
      } catch (error) {
        pending = Promise.reject(error)
      }
      effortBridge.view = { ...view, index: index, busy: true }
      if (effortBridge.slider) {
        effortBridge.slider.update({
          levels: effortBridge.view.levels,
          index: index,
          busy: true,
          motion: effortBridge.motion,
        })
      }
      pending.then(function (result) {
        if (result && result.ok === false) {
          effortBridge.error = effortBridge.labels.errorPrefix + messageOf(result.error)
          effortBridge.view = { ...effortBridge.view, index: previous, busy: false }
          scheduleEffortSync()
          return
        }
        scheduleEffortSync()
      }).catch(function (error) {
        effortBridge.error = effortBridge.labels.errorPrefix + messageOf(error)
        effortBridge.view = { ...effortBridge.view, index: previous, busy: false }
        scheduleEffortSync()
      })
    }

    /** Mount the bridge for one session; returns its disposer (React effect shape). */
    function mountEffortBridge(sessionId, options) {
      const opts = options || {}
      if (typeof document === 'undefined' || !sessionId || !modelDirectories
        || typeof modelDirectories.directoryFor !== 'function') {
        return function () {}
      }
      effortBridge.sessionId = sessionId
      effortBridge.motion = opts.motion === 'off' ? 'off' : 'full'
      effortBridge.labels = {
        ariaLabel: typeof opts.ariaLabel === 'string' ? opts.ariaLabel : '',
        errorPrefix: typeof opts.errorPrefix === 'string' ? opts.errorPrefix : '',
      }
      effortBridge.error = ''
      effortBridge.retryIndex = 0
      /* The directory may still be refused here — the session scope is created
         right around this mount, and `directoryFor()` throws until it exists.
         The observer and the retry chain keep the bridge alive until it does. */
      if (resolveEffortDirectory()) effortBridge.retryIndex = 0
      else scheduleEffortRetry()
      if (typeof document.body !== 'undefined' && typeof MutationObserver === 'function') {
        effortBridge.observer = new MutationObserver(function () { scheduleEffortSync() })
        try {
          effortBridge.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-expanded'],
          })
        } catch {
          effortBridge.observer = null
        }
      }
      scheduleEffortSync()
      return function () {
        if (effortBridge.observer) {
          try { effortBridge.observer.disconnect() } catch { /* already gone */ }
          effortBridge.observer = null
        }
        if (effortBridge.retryTimer) {
          clearTimeout(effortBridge.retryTimer)
          effortBridge.retryTimer = 0
        }
        releaseEffortSubscription()
        if (effortBridge.frame) {
          if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(effortBridge.frame)
          else clearTimeout(effortBridge.frame)
          effortBridge.frame = 0
        }
        detachEffortSlider()
        effortBridge.sessionId = ''
        effortBridge.retryIndex = 0
        effortBridge.loadAt = 0
        effortBridge.directory = null
        effortBridge.view = null
        effortBridge.error = ''
      }
    }

    /**
     * Renders nothing: it only owns the bridge's lifetime for the session the
     * composer dock belongs to.
     */
    function EffortBridge(props) {
      const sessionId = props.sessionId || (props.session && props.session.id) || ''
      const t = props.t
      React.useEffect(function () {
        return mountEffortBridge(sessionId, {
          motion: props.motion,
          ariaLabel: typeof t === 'function' ? t('effortAria') : '',
          errorPrefix: typeof t === 'function' ? t('effortFailed') : '',
        })
      }, [sessionId, props.motion])
      return null
    }

    /**
     * Composer dock row: which online repository this session publishes to.
     * The row sits above the input card, so a blank Session shows it too (the
     * title cluster is hidden there) and the listbox can open upward.
     */
    function RepoBinding(props) {
      const t = props.t
      const sessionId = props.sessionId || (props.session && props.session.id) || ''
      const [repos, setRepos] = React.useState(repoCache.repos)
      // The first load has to say something while the list is on its way.
      const [bound, setBound] = React.useState('')
      const [note, setNote] = React.useState(repoCache.repos ? '' : t('repoLoading'))
      const [busy, setBusy] = React.useState(false)
      const [open, setOpen] = React.useState(false)
      const [active, setActive] = React.useState(0)
      // The palette and mascot flag come from the same snapshot the panel uses.
      const [settings, setSettings] = React.useState(settingsCache.body)
      const pillRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const placement = React.useRef(null)
      const mounted = React.useRef(true)
      const mascotRef = React.useRef(null)
      // Official token-meter projections. The dock slot is session-scoped, so
      // these stay live while the conversation runs; older hosts without the
      // hook simply render the vial without a reading.
      const useProjection = props && typeof props.useProjection === 'function' ? props.useProjection : null
      const pressure = useProjection ? useProjection('contextPressure') : undefined
      const breakdown = useProjection ? useProjection('contextBreakdown') : undefined
      const appearance = normalizeAppearance(settings && settings.appearance)
      const spec = levelSpecOf(settings)
      const level = settings && settings.level ? settings.level : 'standard'
      const tokenUsage = useProjection ? useProjection('tokenUsage') : undefined
      const sessionStats = useProjection ? useProjection('sessionStats') : undefined
      const usage = vialUsage(tokenUsage, sessionStats)
      const meter = vialMeter(pressure, spec)

      React.useEffect(function () {
        mounted.current = true
        loadSettingsSnapshot().then(function (body) {
          if (mounted.current && body) setSettings(body)
        })
        if (sessionId) {
          fetch(GH_BINDING_API + '?session=' + encodeURIComponent(sessionId), { credentials: 'same-origin' })
            .then(readJson)
            .then(function (body) {
              if (mounted.current) setBound(body && typeof body.repo === 'string' ? body.repo : '')
            })
            .catch(function (error) {
              if (mounted.current) setNote(t('repoSaveFailed') + messageOf(error))
            })
        }
        loadOnlineRepos().then(function (result) {
          if (!mounted.current) return
          setRepos(result.repos)
          setNote(result.error ? repoErrorText(t, result.error) : '')
        })
        return function () {
          mounted.current = false
        }
      }, [sessionId])

      function selectRepo(value) {
        if (!sessionId) return
        setBusy(true)
        setNote('')
        fetch(GH_BINDING_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ session: sessionId, repo: value }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setBound(body && typeof body.repo === 'string' ? body.repo : '')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setNote(t('repoSaveFailed') + messageOf(error))
          })
          .then(function () {
            if (mounted.current) setBusy(false)
          })
      }

      function chooseRepo(value) {
        setOpen(false)
        selectRepo(value)
      }

      /**
       * Place the listbox by its bottom edge and cap it at the room above the
       * pill: the dock is above the composer, so the list opens upward. A short
       * window (or a pill near the top) flips it downward instead of clipping.
       */
      function toggleMenu() {
        if (open) {
          setOpen(false)
          return
        }
        const node = pillRef.current
        if (!node || typeof node.getBoundingClientRect !== 'function') return
        placement.current = placeMenu(node, { minWidth: 288, extraWidth: 24, maxHeight: 320, align: 'end' })
        setActive(0)
        setOpen(true)
      }

      useMenuDismiss(open, function () { setOpen(false) }, pillRef, menuRef)
      useMenuFocus(open, menuRef)

      const rows = Array.isArray(repos) ? repos : []
      const known = new Set(rows.map(function (row) { return row.nameWithOwner }))
      const items = [{ value: '', label: t('repoNone'), private: false }]
      // A bound repository the listing no longer returns must stay selectable.
      if (bound && !known.has(bound)) items.push({ value: bound, label: bound, private: false })
      rows.forEach(function (row) {
        items.push({ value: row.nameWithOwner, label: row.nameWithOwner, private: row.private === true })
      })

      const pill = h('button', {
        type: 'button',
        ref: pillRef,
        className: 'ct-repo-pill',
        'data-bound': bound ? 'true' : 'false',
        'aria-haspopup': 'listbox',
        'aria-expanded': open ? 'true' : 'false',
        'aria-label': t('repoSelectAria'),
        title: note ? t('repoTitle') + ' — ' + note : t('repoTitle'),
        disabled: busy || !sessionId,
        onClick: toggleMenu,
      },
      h('svg', {
        className: 'ct-repo-icon',
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.4',
        'aria-hidden': 'true',
      },
      h('rect', { x: '2.5', y: '2.5', width: '11', height: '11', rx: '2.5' }),
      h('path', { d: 'M5.5 6.5h5M5.5 9.5h3.5', strokeLinecap: 'round' })),
      h('span', { className: 'ct-repo-caption' }, t('repoSelectLabel')),
      h('span', { className: 'ct-repo-value' }, bound || t('repoUnbound')),
      h('svg', {
        className: 'ct-repo-chevron',
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.6',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
      }, h('path', { d: 'M4.5 6.25 8 9.75l3.5-3.5' })))

      const activeIndex = items.length === 0
        ? 0
        : (((typeof active === 'number' ? active : 0) % items.length) + items.length) % items.length
      const at = placement.current || { up: false, left: 0, width: 288, maxHeight: 320 }
      const menuPos = menuStyle(at)
      // Head line + separator keep "no repository" apart from the real list, so
      // the menu reads as a titled picker rather than a flat run of names.
      const menuChildren = [h('div', { key: '__head', className: 'ct-menu-head', role: 'presentation' }, t('repoSelectLabel'))]
      items.forEach(function (item, index) {
        if (index === 1) menuChildren.push(h('div', { key: '__sep', className: 'ct-menu-sep', role: 'presentation' }))
        const selected = item.value === bound
        menuChildren.push(h('button', {
          key: item.value || '__none',
          id: 'ct-repo-option-' + index,
          type: 'button',
          role: 'option',
          tabIndex: -1,
          'aria-selected': selected ? 'true' : 'false',
          className: 'ct-menu-option'
            + (index === activeIndex ? ' ct-menu-option-active' : ''),
          onMouseEnter: function () { setActive(index) },
          onClick: function () { chooseRepo(item.value) },
        },
        h('span', { className: 'ct-menu-check' }, selected ? '✓' : ''),
        h('span', { className: 'ct-menu-option-name' }, item.label),
        item.private ? h('span', { className: 'ct-menu-tag' }, t('repoPrivate')) : null))
      })
      // The listbox itself owns focus, so the arrow keys move the highlight and
      // Enter picks it without turning the pill into a second control.
      function onMenuKey(event) {
        const key = event && event.key
        if (!key) return
        if (key === 'Escape') {
          if (event.preventDefault) event.preventDefault()
          setOpen(false)
          return
        }
        const next = menuMove(key, activeIndex, items.length)
        if (next !== null) {
          if (event.preventDefault) event.preventDefault()
          setActive(next)
          return
        }
        if (key === 'Enter' || key === ' ') {
          if (event.preventDefault) event.preventDefault()
          chooseRepo(items[activeIndex].value)
        }
      }
      const menu = open && ReactDOM && typeof ReactDOM.createPortal === 'function'
        ? ReactDOM.createPortal(h('div', {
          ref: menuRef,
          className: 'ct-menu ct-skin',
          'data-palette': appearance.palette,
          role: 'listbox',
          tabIndex: -1,
          'data-side': at.up ? 'up' : 'down',
          'aria-label': t('repoSelectAria'),
          'aria-activedescendant': items.length === 0 ? undefined : 'ct-repo-option-' + activeIndex,
          style: menuPos,
          onKeyDown: onMenuKey,
        }, menuChildren), document.body)
        : null

      // The dock row renders in place above the composer: the pixel companions
      // on the left, then the vial, an optional network note and the repository
      // pill, all flush with the input card's right edge.
      return h('div', {
        className: 'ct-repo-dock ct-skin',
        'data-palette': appearance.palette,
        'data-motion': appearance.motion,
      },
      appearance.mascots
        ? h('div', { key: 'mascots', className: 'ct-dock-mascots' },
            h(MascotStage, {
              motion: appearance.motion,
              stageRef: mascotRef,
            }))
        : null,
      h('div', { key: 'tools', className: 'ct-dock-tools' },
        h(EffortBridge, {
          key: 'effort',
          sessionId: sessionId,
          motion: appearance.motion,
          t: t,
        }),
        h(ContextVial, {
          t: t,
          meter: meter,
          breakdown: breakdown,
          usage: usage,
          level: level,
          appearance: appearance,
          onPoke: function () {
            const stage = mascotRef.current
            if (stage && typeof stage.poke === 'function') stage.poke('cat')
          },
        }),
        note ? h('span', { className: 'ct-repo-note', role: 'status', title: note }, note) : null,
        h('span', { className: 'ct-repo-group' }, pill, menu)))
    }

    /**
     * A self-drawn picker for the workspace block. A native `<select>` popup is
     * painted by the OS: it keeps the dark panel's light text on its own light
     * background, so every option is invisible until it is hovered. This keeps
     * the input look, portals the listbox to body and shares the menu surface,
     * placement and keyboard rules with the repository pill.
     */
    function Select(props) {
      const t = props.t
      const items = Array.isArray(props.items) ? props.items : []
      const value = typeof props.value === 'string' ? props.value : ''
      const disabled = props.disabled === true
      const [open, setOpen] = React.useState(false)
      const [active, setActive] = React.useState(0)
      const triggerRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const placement = React.useRef(null)
      const selectedIndex = items.findIndex(function (item) { return item.value === value })
      const current = selectedIndex >= 0 ? items[selectedIndex] : null

      function choose(next) {
        setOpen(false)
        if (next !== value && typeof props.onChange === 'function') props.onChange(next)
      }

      function toggle() {
        if (disabled) return
        if (open) {
          setOpen(false)
          return
        }
        const node = triggerRef.current
        if (!node || typeof node.getBoundingClientRect !== 'function') return
        placement.current = placeMenu(node, { minWidth: 260, maxHeight: 320 })
        setActive(selectedIndex >= 0 ? selectedIndex : 0)
        setOpen(true)
      }

      useMenuDismiss(open, function () { setOpen(false) }, triggerRef, menuRef)
      useMenuFocus(open, menuRef)

      const activeIndex = items.length === 0
        ? 0
        : (((typeof active === 'number' ? active : 0) % items.length) + items.length) % items.length
      const at = placement.current || { up: false, left: 0, width: 260, maxHeight: 320 }
      const menuChildren = [h('div', { key: '__head', className: 'ct-menu-head', role: 'presentation' }, t('workspaceSelectLabel'))]
      items.forEach(function (item, index) {
        const selected = item.value === value
        menuChildren.push(h('button', {
          key: item.value,
          id: 'ct-select-option-' + index,
          type: 'button',
          role: 'option',
          tabIndex: -1,
          'aria-selected': selected ? 'true' : 'false',
          className: 'ct-menu-option' + (index === activeIndex ? ' ct-menu-option-active' : ''),
          onMouseEnter: function () { setActive(index) },
          onClick: function () { choose(item.value) },
        },
        h('span', { className: 'ct-menu-check' }, selected ? '✓' : ''),
        h('span', { className: 'ct-menu-option-name' }, item.label)))
      })
      function onMenuKey(event) {
        const key = event && event.key
        if (!key) return
        if (key === 'Escape') {
          if (event.preventDefault) event.preventDefault()
          setOpen(false)
          return
        }
        const next = menuMove(key, activeIndex, items.length)
        if (next !== null) {
          if (event.preventDefault) event.preventDefault()
          setActive(next)
          return
        }
        if ((key === 'Enter' || key === ' ') && items[activeIndex]) {
          if (event.preventDefault) event.preventDefault()
          choose(items[activeIndex].value)
        }
      }
      const menu = open && ReactDOM && typeof ReactDOM.createPortal === 'function'
        ? ReactDOM.createPortal(h('div', {
          ref: menuRef,
          className: 'ct-menu ct-skin',
          'data-palette': props.palette || 'host',
          role: 'listbox',
          tabIndex: -1,
          'data-side': at.up ? 'up' : 'down',
          'aria-label': t('workspaceSelectLabel'),
          'aria-activedescendant': items.length === 0 ? undefined : 'ct-select-option-' + activeIndex,
          style: menuStyle(at),
          onKeyDown: onMenuKey,
        }, menuChildren), document.body)
        : null

      return h('span', { className: 'ct-select-field' },
        h('button', {
          key: '__trigger',
          type: 'button',
          ref: triggerRef,
          className: 'ct-select',
          'aria-haspopup': 'listbox',
          'aria-expanded': open ? 'true' : 'false',
          'aria-label': t('workspaceSelectLabel'),
          disabled: disabled,
          onClick: toggle,
        },
        h('span', { className: 'ct-select-value' }, current ? current.label : ''),
        h('svg', {
          className: 'ct-select-chevron',
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.6',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        }, h('path', { d: 'M4.5 6.25 8 9.75l3.5-3.5' }))),
        menu)
    }

    function Page(props) {
      const t = props.t
      const [state, setState] = React.useState(null)
      const [message, setMessage] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [rules, setRules] = React.useState(null)
      const [rulesText, setRulesText] = React.useState('')
      const [rulesMessage, setRulesMessage] = React.useState('')
      const [rulesBusy, setRulesBusy] = React.useState(false)
      // One payload for the whole component panel: the four rows and the shared
      // download root they all install below.
      const [components, setComponents] = React.useState(null)
      const [componentsMessage, setComponentsMessage] = React.useState('')
      const [componentsBusy, setComponentsBusy] = React.useState(false)
      const [pathDraft, setPathDraft] = React.useState(null)
      const [pathBusy, setPathBusy] = React.useState(false)
      // The gh device-code flow; the gh binary itself is a component row.
      const [login, setLogin] = React.useState(null)
      const [auth, setAuth] = React.useState(null)
      const [ghMessage, setGhMessage] = React.useState('')
      const [ghBusy, setGhBusy] = React.useState(false)
      const [network, setNetwork] = React.useState(null)
      // Workspace rules: a fenced supplement the panel prepends to each
      // registered workspace's `AGENTS.md`. The registry is the allow list, and
      // the block lives on the rules page next to the global editor.
      const [workspaceRules, setWorkspaceRules] = React.useState(null)
      const [workspaceId, setWorkspaceId] = React.useState('')
      const [workspaceText, setWorkspaceText] = React.useState('')
      const [workspaceMessage, setWorkspaceMessage] = React.useState('')
      const [workspaceBusy, setWorkspaceBusy] = React.useState(false)
      // Appearance is applied optimistically; a failed write rolls the panel
      // back to the last saved snapshot and says why.
      const [appearanceBusy, setAppearanceBusy] = React.useState(false)
      const [appearanceMessage, setAppearanceMessage] = React.useState('')
      // Which page of the shell is open. Declared last so the hook order above
      // stays stable for the test harness.
      const [section, setSection] = React.useState('levels')
      const mounted = React.useRef(true)
      const buttons = React.useRef({})

      React.useEffect(function () {
        mounted.current = true
        load()
        loadRules()
        loadComponents()
        loadLogin()
        loadAuth()
        loadNetwork()
        loadWorkspaceRules()
        return function () {
          mounted.current = false
        }
      }, [])

      const loggingIn = login ? login.active === true : false
      React.useEffect(function () {
        if (!loggingIn) return undefined
        const timer = window.setInterval(function () { loadLogin() }, 1500)
        return function () { window.clearInterval(timer) }
      }, [loggingIn])

      // Any managed install in flight keeps the panel refreshing; the payload
      // itself reports progress, so no second timer per component is needed.
      const anyRunning = components && Array.isArray(components.components)
        ? components.components.some(function (row) { return row && row.running === true })
        : false
      React.useEffect(function () {
        if (!anyRunning) return undefined
        const timer = window.setInterval(function () { loadComponents({ quiet: true }) }, 1200)
        return function () { window.clearInterval(timer) }
      }, [anyRunning])

      function load() {
        fetch(API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            rememberSettings(body)
            setState(body)
            setMessage('')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setMessage(t('loadFailed') + (error && error.message ? error.message : String(error)))
          })
      }

      function applyRules(body) {
        setRules(body || null)
        setRulesText(body && typeof body.text === 'string' ? body.text : '')
      }

      function loadRules() {
        fetch(RULES_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            applyRules(body)
            setRulesMessage('')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setRulesMessage(t('rulesLoadFailed') + (error && error.message ? error.message : String(error)))
          })
      }

      /**
       * Workspace rules: the payload carries every registered workspace with
       * its current text, so switching the selector never re-reads the disk and
       * only a save talks to the host.
       */
      function applyWorkspaceRules(body) {
        const list = body && Array.isArray(body.workspaces) ? body.workspaces : []
        // An empty registry is still a loaded registry: the page has to say
        // "no workspace yet" instead of going back to its loading state.
        setWorkspaceRules({ workspaces: list })
        if (list.length === 0) {
          setWorkspaceId('')
          setWorkspaceText('')
          return
        }
        const current = list.find(function (item) { return item.id === workspaceId }) || list[0]
        setWorkspaceId(current.id)
        setWorkspaceText(typeof current.text === 'string' ? current.text : '')
      }

      function loadWorkspaceRules() {
        fetch(WORKSPACE_RULES_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            applyWorkspaceRules(body)
            setWorkspaceMessage('')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setWorkspaceMessage(t('workspaceRulesLoadFailed') + messageOf(error))
          })
      }

      function pickWorkspace(id) {
        setWorkspaceId(id)
        const list = workspaceRules && Array.isArray(workspaceRules.workspaces) ? workspaceRules.workspaces : []
        const row = list.find(function (item) { return item.id === id })
        setWorkspaceText(row && typeof row.text === 'string' ? row.text : '')
        setWorkspaceMessage('')
      }

      function saveWorkspaceRules() {
        if (!workspaceId) return
        setWorkspaceBusy(true)
        setWorkspaceMessage('')
        fetch(WORKSPACE_RULES_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ workspaceId: workspaceId, rules: workspaceText }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            const saved = body && body.workspace ? body.workspace : null
            const list = workspaceRules && Array.isArray(workspaceRules.workspaces) ? workspaceRules.workspaces : []
            if (saved) {
              setWorkspaceRules({
                ...(workspaceRules || {}),
                workspaces: list.map(function (item) { return item.id === saved.id ? saved : item }),
              })
            }
            setWorkspaceMessage(t('workspaceRulesSaved'))
          })
          .catch(function (error) {
            if (!mounted.current) return
            setWorkspaceMessage(t('workspaceRulesSaveFailed') + messageOf(error))
          })
          .then(function () {
            if (mounted.current) setWorkspaceBusy(false)
          })
      }

      /** The device-code flow state; the gh binary lives in the component rows. */
      function applyLogin(body) {
        setLogin(body && body.login ? body.login : null)
      }

      function loadLogin() {
        return fetch(GH_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            applyLogin(body)
            if (body && body.login && body.login.state === 'success') loadAuth()
          })
          .catch(function (error) {
            if (!mounted.current) return
            setGhMessage(t('ghLoadFailed') + messageOf(error))
          })
      }

      function loadAuth() {
        return fetch(GH_AUTH_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setAuth(body && body.auth ? body.auth : null)
          })
          .catch(function () {
            if (!mounted.current) return
            setAuth(null)
          })
      }

      function githubAction(payload) {
        return fetch(GH_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(readJson)
      }

      function loginGh() {
        if (ghBusy) return
        setGhBusy(true)
        setGhMessage('')
        githubAction({ action: 'login' })
          .then(function (body) {
            if (!mounted.current) return
            applyLogin(body)
          })
          .catch(function (error) {
            if (!mounted.current) return
            setGhMessage(t('ghActionFailed') + (error && error.message ? error.message : String(error)))
          })
          .then(function () {
            if (mounted.current) setGhBusy(false)
          })
      }

      function cancelLogin() {
        if (ghBusy) return
        setGhBusy(true)
        githubAction({ action: 'cancel' })
          .then(function (body) {
            if (!mounted.current) return
            applyLogin(body)
            setGhMessage('')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setGhMessage(t('ghActionFailed') + (error && error.message ? error.message : String(error)))
          })
          .then(function () {
            if (mounted.current) setGhBusy(false)
          })
      }

      function copyCode() {
        if (!login || !login.code) return
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(login.code).then(
              function () { if (mounted.current) setGhMessage(t('ghCopied')) },
              function () { if (mounted.current) setGhMessage(t('ghCopyFailed')) },
            )
            return
          }
        } catch {
          // Fall through to the manual-copy hint.
        }
        setGhMessage(t('ghCopyFailed'))
      }

      function openDevice() {
        const url = login && login.url ? login.url : 'https://github.com/login/device'
        window.open(url, '_blank', 'noopener,noreferrer')
      }

      function loadNetwork() {
        return fetch(GH_NETWORK_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setNetwork(body && body.network ? body.network : null)
          })
          .catch(function () {
            if (!mounted.current) return
            setNetwork(null)
          })
      }

      /**
       * The four component rows plus the shared download root. `quiet` keeps the
       * current status line (a refetch after an action must not erase its own
       * "migrated" message).
       */
      function loadComponents(options) {
        const quiet = Boolean(options && options.quiet)
        return fetch(COMPONENTS_API, { credentials: 'same-origin' })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setComponents(body)
            if (!quiet) setComponentsMessage('')
          })
          .catch(function (error) {
            if (!mounted.current) return
            setComponentsMessage(t('componentsLoadFailed') + messageOf(error))
          })
      }

      /** Start one component's managed install; the poll shows its progress. */
      function downloadComponent(id) {
        if (componentsBusy) return
        setComponentsBusy(true)
        setComponentsMessage('')
        fetch(COMPONENTS_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: id, action: 'download' }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setComponents(body)
          })
          .catch(function (error) {
            if (!mounted.current) return
            setComponentsMessage(t('componentsActionFailed') + messageOf(error))
          })
          .then(function () {
            if (mounted.current) setComponentsBusy(false)
          })
      }

      /** Move every managed component to `target` and persist it. */
      function migratePath(target) {
        if (pathBusy) return
        setPathBusy(true)
        setComponentsMessage('')
        fetch(TOOLS_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'migrate', path: target }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            setPathDraft(null)
            setComponentsMessage(t('toolsPathSaved'))
            // Every binary location changed, so every row is stale.
            loadComponents({ quiet: true })
          })
          .catch(function (error) {
            if (!mounted.current) return
            setComponentsMessage(t('toolsPathFailed') + messageOf(error))
            loadComponents({ quiet: true })
          })
          .then(function () {
            if (mounted.current) setPathBusy(false)
          })
      }

      function select(id) {
        if (busy || !state || state.level === id) return
        setBusy(true)
        setMessage(t('applying'))
        fetch(API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ level: id }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            rememberSettings(body)
            setState(body)
            setMessage(t('applied') + ' ' + labelOf(t, id))
          })
          .catch(function (error) {
            if (!mounted.current) return
            setMessage(t('applyFailed') + (error && error.message ? error.message : String(error)))
          })
          .then(function () {
            if (mounted.current) setBusy(false)
          })
      }

      /**
       * Appearance writes go through the same settings route. The change is
       * painted immediately (palette and mascots are local state), then the
       * saved payload replaces it; a failed save restores the previous value.
       */
      function applyAppearance(patch) {
        if (appearanceBusy || !state) return
        const previous = state.appearance || DEFAULT_APPEARANCE
        const optimistic = normalizeAppearance({ ...previous, ...patch })
        setState({ ...state, appearance: optimistic })
        setSkinPalette(optimistic.palette)
        applyOptics(optimistic)
        setAppearanceBusy(true)
        setAppearanceMessage('')
        fetch(API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ appearance: patch }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            rememberSettings(body)
            setState(body)
            const saved = normalizeAppearance(body.appearance)
            setSkinPalette(saved.palette)
            applyOptics(saved)
            setAppearanceMessage(t('appearanceApplied'))
          })
          .catch(function (error) {
            if (!mounted.current) return
            setState(function (current) {
              return current ? { ...current, appearance: previous } : current
            })
            setSkinPalette(previous.palette)
            applyOptics(previous)
            setAppearanceMessage(t('appearanceFailed') + messageOf(error))
          })
          .then(function () {
            if (mounted.current) setAppearanceBusy(false)
          })
      }

      function saveRules() {
        if (rulesBusy || !rules || rulesText === rules.text) return
        setRulesBusy(true)
        setRulesMessage(t('rulesSaving'))
        fetch(RULES_API, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rules: rulesText }),
        })
          .then(readJson)
          .then(function (body) {
            if (!mounted.current) return
            applyRules(body)
            setRulesMessage(t('rulesSaved'))
          })
          .catch(function (error) {
            if (!mounted.current) return
            setRulesMessage(t('rulesSaveFailed') + (error && error.message ? error.message : String(error)))
          })
          .then(function () {
            if (mounted.current) setRulesBusy(false)
          })
      }

      function onKeyDown(event) {
        if (!state) return
        const at = LEVELS.indexOf(state.level)
        let target = -1
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = (at + 1) % LEVELS.length
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = (at - 1 + LEVELS.length) % LEVELS.length
        else if (event.key === 'Home') target = 0
        else if (event.key === 'End') target = LEVELS.length - 1
        if (target < 0) return
        event.preventDefault()
        const id = LEVELS[target]
        select(id)
        const node = buttons.current[id]
        if (node && typeof node.focus === 'function') node.focus()
      }

      /**
       * The one download control shared by every component row: identical state
       * line and button label for identical states, so the four rows (and any
       * component added later) cannot drift into different-looking controls.
       */
      function downloadControl(model) {
        const loading = model.loading === true
        const unsupported = model.unsupported === true
        const running = model.running === true
        const system = model.system === true
        const installed = model.installed === true && !system
        const percent = model.percent == null ? '' : model.percent + '%'
        const stateText = loading
          ? t('loading')
          : unsupported ? t('downloadUnsupported')
            : running ? t('downloadRunning') + percent
              : system ? t('stateSystem')
                : installed ? t('downloadDone')
                  : model.failed === true ? t('stateFailed')
                    : model.partial === true ? t('statePartial')
                      : t('stateMissing')
        const label = loading
          ? t('loading')
          : unsupported ? t('downloadUnsupported')
            : running ? t('downloadRunning')
              : system ? t('downloadKeep')
                : installed ? t('downloadDone')
                  : model.failed === true ? t('downloadRetry')
                    : model.partial === true ? t('downloadContinue')
                      : t('downloadIdle')
        return {
          stateText,
          label,
          disabled: loading || unsupported || running || installed,
        }
      }
      const levels = state && Array.isArray(state.levels) && state.levels.length ? state.levels : LEVELS.map(function (id) {
        return { id: id }
      })
      const current = state ? state.level : ''
      const engineCount = state && typeof state.engines === 'number' ? state.engines : 0
      const last = state && state.lastCompact
      const lastText = last && last.at
        ? timeLabel(last.at) + (last.compacted === false ? ' (' + (last.note || last.error || 'skipped') + ')' : '')
        : t('never')

      const panel = state
        ? h('section', { className: 'ct-panel', key: 'levels' },
          h('div', { className: 'ct-rules-head' },
            h('h3', null, t('levelsTitle'))),
          h('div', { className: 'ct-levels', role: 'radiogroup', 'aria-label': t('levelsAria') },
            levels.map(function (level) {
              const id = level.id
              const selected = id === current
              return h('button', {
                key: id,
                type: 'button',
                role: 'radio',
                'aria-checked': selected ? 'true' : 'false',
                tabIndex: selected ? 0 : -1,
                disabled: busy,
                ref: function (node) { buttons.current[id] = node },
                className: 'ct-level' + (selected ? ' ct-level-on' : ''),
                onClick: function () { select(id) },
                onKeyDown: onKeyDown,
              },
              h('strong', null, labelOf(t, id)),
              h('span', null, t('auto') + percent(level.thresholdRatio)),
              h('span', null, t('retain') + percent(level.retainRatio)))
            })),
          h('p', { className: 'ct-summary' }, t('currentLabel') + t('sep') + labelOf(t, current)),
          h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, message))
        : h('p', { className: 'ct-intro', key: 'levels', role: 'status' }, message || t('loading'))

      const dirty = rules ? rulesText !== rules.text : false
      const rulesCount = rules && typeof rules.chars === 'number' ? rules.chars : 0
      const rulesLimit = rules && typeof rules.maxChars === 'number' ? rules.maxChars : 0
      const rulesPanel = h('section', { className: 'ct-panel', key: 'rules' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('rulesTitle'))),
        h('label', { className: 'ct-field' },
          h('span', null, t('rulesLabel')),
          h('textarea', {
            className: 'ct-textarea',
            rows: 8,
            spellCheck: false,
            value: rulesText,
            placeholder: t('rulesPlaceholder'),
            disabled: rulesBusy || !rules,
            onChange: function (event) { setRulesText(event.target.value) },
          })),
        h('p', { className: 'ct-note' }, rules
          ? t('rulesChars') + ' ' + rulesCount + ' / ' + rulesLimit
          : (rulesMessage ? '' : t('rulesLoading'))),
        actionRow([
          actionButton('rulesSave', rulesBusy ? t('rulesSaving') : t('rulesSave'), {
            disabled: rulesBusy || !rules || !dirty,
            onClick: saveRules,
            primary: true,
          }),
        ]),
        h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, rulesMessage),
        rules && rules.path
          ? h('p', { className: 'ct-note' }, t('rulesPathLabel') + t('sep') + rules.path + (rules.exists === false ? ' — ' + t('rulesMissing') : ''))
          : null)

      /**
       * The binaries of a multi-binary component: one line per found binary.
       * Nothing is listed when none is found — the title already names the pair
       * and the state line already says 未安装, so a "未找到" line would only
       * repeat it. A single missing binary gets one line naming just that one.
       */
      function componentToolLines(row) {
        if (!row || !row.tools) return null
        const found = row.tools.filter(function (tool) { return Boolean(tool.path) })
        if (found.length === 0) return null
        const missing = row.tools.filter(function (tool) { return !tool.path })
        const lines = found.map(function (tool) {
          return h('div', { className: 'ct-tool', key: tool.name },
            h('span', { className: 'ct-tool-name' }, tool.name),
            h('span', { className: 'ct-note' }, (tool.managed ? t('toolsManaged') : t('toolsSystem')) + (tool.version ? ' v' + tool.version : '')),
            tool.path ? h('span', { className: 'ct-tool-path' }, tool.path) : null)
        })
        if (missing.length > 0) {
          lines.push(h('div', { className: 'ct-tool', key: 'missing' },
            h('span', { className: 'ct-tool-name' }, missing.map(function (tool) { return tool.name }).join(' / ')),
            h('span', { className: 'ct-note' }, t('toolsNotFound'))))
        }
        return h('div', { className: 'ct-tools-list' }, lines)
      }

      // ---- component panel: four rows plus the download root they share ----
      const rootInfo = components && components.root ? components.root : null
      const rootPath = rootInfo && rootInfo.path ? String(rootInfo.path) : ''
      const rootDefault = rootInfo && rootInfo.defaultPath ? String(rootInfo.defaultPath) : ''
      const rootRunning = Boolean(rootInfo && rootInfo.running && COMPONENT_ROWS.some(function (def) {
        return rootInfo.running[def.id] === true
      }))
      const rowsById = {}
      if (components && Array.isArray(components.components)) {
        components.components.forEach(function (row) {
          if (row && row.id) rowsById[row.id] = row
        })
      }
      // Every row renders through the one download control and the one button
      // standard; a component whose payload has not arrived still renders its
      // two buttons, disabled, instead of vanishing from the panel.
      const componentNodes = COMPONENT_ROWS.map(function (def) {
        const row = rowsById[def.id] || null
        const control = downloadControl({
          loading: !row,
          unsupported: Boolean(row && row.supported === false),
          running: Boolean(row && row.state === 'downloading'),
          installed: Boolean(row && row.state === 'installed'),
          partial: Boolean(row && row.state === 'partial'),
          failed: Boolean(row && row.state === 'error'),
          system: Boolean(row && row.state === 'system'),
          percent: row ? row.percent : null,
        })
        const pinned = row && row.version ? ' · v' + row.version : ''
        const used = row && row.toolVersion ? ' (' + row.toolVersion + ')' : ''
        // A row that covers several binaries says so in its title, so "ffprobe
        // is part of this row" stays visible even when there is nothing to list.
        const title = row && row.tools
          ? row.tools.map(function (tool) { return tool.name }).join(' / ')
          : (row && row.name ? row.name : def.name)
        const bar = Boolean(row) && row.percent != null
          && (row.state === 'downloading' || row.state === 'partial' || row.state === 'error')
        return h('div', { className: 'ct-component', key: def.id },
          h('div', { className: 'ct-component-head' },
            h('strong', { className: 'ct-component-name' }, title),
            h('span', { className: 'ct-note' }, control.stateText + pinned + used)),
          bar ? h('div', { className: 'ct-progress' }, h('span', { style: { width: (row.percent || 0) + '%' } })) : null,
          row && row.path ? h('p', { className: 'ct-note ct-component-path' }, t('pathLabel') + t('sep') + row.path) : null,
          componentToolLines(row),
          row && row.error ? h('p', { className: 'ct-status', role: 'alert' }, row.error) : null,
          actionRow([
            actionButton('download:' + def.id, control.label, {
              disabled: componentsBusy || control.disabled,
              onClick: function () { downloadComponent(def.id) },
              primary: true,
            }),
            actionButton('probe:' + def.id, t('probe'), { onClick: function () { loadComponents(); loadAuth() } }),
          ]))
      })

      // The shared download root sits in the same panel: it is what a component
      // installs below, so moving it is a component action. Both buttons stay
      // rendered and go disabled while a download runs or the draft is unchanged.
      const pathValue = pathDraft === null ? rootPath : pathDraft
      const pathClean = String(pathValue == null ? '' : pathValue).trim()
      const pathInvalid = pathClean.length > 0 && !looksAbsolute(pathClean)
      const pathChanged = rootPath !== '' && !samePathDraft(pathClean, rootPath)
      const pathDisabled = pathBusy || rootRunning || !rootPath || !pathClean || pathInvalid || !pathChanged
      const pathTitle = rootRunning ? t('toolsPathRunning') : pathInvalid ? t('toolsPathInvalid') : ''
      const pathBlock = h('div', { className: 'ct-rules-head' },
        h('label', { className: 'ct-field' },
          h('span', null, t('toolsPathLabel')),
          h('div', { className: 'ct-row' },
            h('input', {
              className: 'ct-input',
              type: 'text',
              spellCheck: false,
              value: pathValue,
              placeholder: rootDefault,
              disabled: pathBusy,
              onChange: function (event) { setPathDraft(event.target.value) },
            }))),
        h('p', { className: 'ct-note' }, rootPath
          ? t('toolsPathCurrent') + t('sep') + rootPath
          : (componentsMessage ? '' : t('loading'))),
        rootRunning ? h('p', { className: 'ct-note' }, t('toolsPathRunning')) : null,
        actionRow([
          actionButton('toolsPathMigrate', pathBusy ? t('rulesSaving') : t('toolsPathSave'), {
            disabled: pathDisabled,
            title: pathTitle,
            onClick: function () { migratePath(pathClean) },
            primary: true,
          }),
          actionButton('toolsPathReset', t('toolsPathReset'), {
            disabled: pathBusy || rootRunning || !rootDefault || samePathDraft(rootPath, rootDefault),
            title: rootRunning ? t('toolsPathRunning') : '',
            onClick: function () { migratePath(rootDefault) },
          }),
        ]))

      const componentsPanel = h('section', { className: 'ct-panel', key: 'components' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('componentsTitle'))),
        componentNodes,
        pathBlock,
        h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, componentsMessage))

      const authText = auth === null
        ? t('ghAuthUnknown')
        : !auth.available
          ? t('ghAuthUnavailable')
          : auth.authenticated
            ? t('ghLoggedIn') + (auth.account || 'GitHub')
            : t('ghNotLoggedIn')
      // The token's scopes are read from `gh auth status`; the token itself never
      // leaves gh. A signed-in account without `repo` can list but not push.
      const scopeList = auth && Array.isArray(auth.scopes)
        ? auth.scopes.filter(function (scope) { return typeof scope === 'string' && scope })
        : []
      const scopeText = auth && auth.available && auth.authenticated
        ? t('ghScopesLabel') + t('sep') + (scopeList.length > 0 ? scopeList.join(' · ') : t('ghScopesNone'))
        : ''
      // The sign-in block is always rendered: a button that only exists while a
      // condition holds makes the panel jump. Unusable actions go disabled with
      // the reason in `title` instead.
      const loginActive = Boolean(login && login.active)
      const loginCode = login && login.code ? login.code : ''
      const loginLead = !login
        ? ''
        : loginActive
          ? (loginCode ? t('ghLoginWaiting') : (login.note || t('ghLoginStarting')))
          : login.state === 'success' ? t('ghLoginDone') : login.state === 'error' ? t('ghLoginFailed') : ''
      const loginInactiveTitle = loginActive ? '' : t('ghLoginInactive')
      const ghLoginBlock = h('div', { className: 'ct-rules-head' },
        h('p', { className: 'ct-note' }, loginLead),
        h('div', { className: 'ct-row' }, h('code', { className: 'ct-code' }, loginCode || '—')),
        actionRow([
          actionButton('ghCopy', t('ghCopy'), {
            disabled: ghBusy || !loginCode,
            title: loginCode ? '' : t('ghLoginInactive'),
            onClick: copyCode,
          }),
          actionButton('ghOpenDevice', t('ghOpenDevice'), {
            disabled: ghBusy || !loginActive,
            title: loginInactiveTitle,
            onClick: openDevice,
            primary: true,
          }),
          actionButton('ghCancel', t('ghCancel'), {
            disabled: ghBusy || !loginActive,
            title: loginInactiveTitle,
            onClick: cancelLogin,
          }),
        ]),
        login && login.error ? h('p', { className: 'ct-status', role: 'alert' }, login.error) : null)
      const networkText = !network
        ? ''
        : network.verdict === 'direct' ? t('ghNetworkDirect')
          : network.verdict === 'proxy' ? t('ghNetworkProxy') + (network.proxy ? ' ' + network.proxy.url : '')
            : network.verdict === 'proxy-dead' ? t('ghNetworkProxyDead') + (network.proxy ? ' ' + network.proxy.url : '')
              : network.verdict === 'blocked' ? t('ghNetworkBlocked')
                : t('ghNetworkUnknown')
      const dnsNote = network && network.dns && Array.isArray(network.dns.resolved) && network.dns.resolved.length > 0 && network.dns.knownGithub === false
        ? t('ghDnsOff')
        : ''
      const networkBlock = h('div', { className: 'ct-rules-head' },
        networkText
          ? h('p', { className: 'ct-note' }, t('ghNetworkLabel') + t('sep') + networkText + (dnsNote ? ' · ' + dnsNote : ''))
          : null,
        actionRow([
          actionButton('ghNetwork', t('ghNetwork'), { onClick: function () { loadNetwork() } }),
        ]))

      // The signed-in account, the device flow and the network probe. The `gh`
      // binary itself is one row in the component panel above.
      const ghAuthPanel = h('section', { className: 'ct-panel', key: 'github' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('ghAuthTitle'))),
        h('p', { className: 'ct-note' }, authText),
        scopeText ? h('p', { className: 'ct-note ct-scopes' }, scopeText) : null,
        actionRow([
          actionButton('ghLogin', auth && auth.authenticated ? t('ghRelogin') : t('ghLogin'), {
            disabled: ghBusy || loggingIn || !auth || !auth.available,
            onClick: loginGh,
            primary: true,
          }),
        ]),
        auth && auth.missingRepoScope
          ? h('p', { className: 'ct-status', role: 'alert' }, t('ghScopeMissing'))
          : null,
        ghLoginBlock,
        networkBlock,
        ghMessage ? h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, ghMessage) : null)

      // Workspace rules: the registry names the only workspaces this block may
      // touch. The card sits on the rules page below the global editor; an empty
      // registry says so instead of leaving the reader without an editor.
      const workspaceList = workspaceRules && Array.isArray(workspaceRules.workspaces)
        ? workspaceRules.workspaces
        : []
      const workspaceLoaded = workspaceRules !== null
      const workspaceEmpty = workspaceLoaded && workspaceList.length === 0
      const workspaceNote = !workspaceLoaded
        ? t('loading')
        : workspaceEmpty ? t('workspaceNone') : ''
      const workspaceRow = workspaceList.find(function (item) { return item.id === workspaceId }) || null
      const workspaceDirty = Boolean(workspaceRow)
        && (typeof workspaceRow.text === 'string' ? workspaceRow.text : '') !== workspaceText
      const workspacePanel = h('section', { className: 'ct-panel', key: 'workspace' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('workspaceRulesTitle')),
          workspaceNote ? h('p', { className: 'ct-note', role: 'status' }, workspaceNote) : null),
        // Nothing to pick or type until the registry names a workspace.
        workspaceList.length === 0
          ? null
          : [
            h('div', { className: 'ct-field', key: 'picker' },
              h('span', null, t('workspaceSelectLabel')),
              h(Select, {
                t: t,
                palette: normalizeAppearance(state && state.appearance).palette,
                items: workspaceList.map(function (item) {
                  return { value: item.id, label: item.title }
                }),
                value: workspaceId,
                disabled: workspaceBusy,
                onChange: pickWorkspace,
              })),
            h('label', { className: 'ct-field', key: 'text' },
              h('span', null, t('workspaceRulesLabel') + ' · ' + workspaceText.length + ' ' + t('rulesChars')),
              h('textarea', {
                className: 'ct-textarea',
                rows: 8,
                spellCheck: false,
                value: workspaceText,
                placeholder: t('workspaceRulesPlaceholder'),
                disabled: workspaceBusy,
                onChange: function (event) { setWorkspaceText(event.target.value) },
              })),
          ],
        workspaceRow
          ? h('p', { className: 'ct-note' }, t('rulesPathLabel') + t('sep') + workspaceRow.file
            + (workspaceRow.exists === false ? ' — ' + t('workspaceRulesMissing') : ''))
          : null,
        actionRow([
          actionButton('workspaceRulesSave', workspaceBusy ? t('rulesSaving') : t('rulesSave'), {
            disabled: workspaceBusy || !workspaceRow || !workspaceDirty,
            title: workspaceRow ? '' : (workspaceEmpty ? t('workspaceNone') : workspaceLoaded ? '' : t('loading')),
            onClick: saveWorkspaceRules,
            primary: true,
          }),
        ]),
        h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, workspaceMessage))

      // Appearance: four scoped optical palettes plus the host theme, a motion
      // tier and the pixel companions. Values apply immediately; the page has no
      // save button because there is nothing to type.
      const appearance = normalizeAppearance(state && state.appearance)
      const appearanceDisabled = appearanceBusy || !state
      const appearancePanel = h('section', { className: 'ct-panel', key: 'appearance' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('appearanceTitle'))),
        h('div', { className: 'ct-field' },
          h('span', null, t('paletteLabel')),
          h('div', { className: 'ct-swatches', role: 'radiogroup', 'aria-label': t('paletteLabel') },
            PALETTES.map(function (choice) {
              return h('button', {
                key: choice.id,
                type: 'button',
                role: 'radio',
                'aria-checked': appearance.palette === choice.id ? 'true' : 'false',
                className: 'ct-swatch',
                'data-choice': choice.id,
                disabled: appearanceDisabled,
                onClick: function () { applyAppearance({ palette: choice.id }) },
              },
              h('span', { className: 'ct-swatch-band', 'data-choice': choice.id }),
              h('span', { className: 'ct-swatch-name' }, t(choice.labelKey)))
            }))),
        h('div', { className: 'ct-field' },
          h('span', null, t('motionLabel')),
          h('div', { className: 'ct-segments', role: 'radiogroup', 'aria-label': t('motionLabel') },
            MOTIONS.map(function (choice) {
              return h('button', {
                key: choice.id,
                type: 'button',
                role: 'radio',
                'aria-checked': appearance.motion === choice.id ? 'true' : 'false',
                className: 'ct-segment',
                'data-motion-choice': choice.id,
                disabled: appearanceDisabled,
                onClick: function () { applyAppearance({ motion: choice.id }) },
              }, t(choice.labelKey))
            }))),
        h('div', { className: 'ct-field' },
          h('span', null, t('mascotsLabel')),
          actionRow([
            h('button', {
              key: 'mascots',
              type: 'button',
              className: 'ct-btn' + (appearance.mascots ? ' ct-btn--primary' : ''),
              'data-action': 'appearanceMascots',
              'aria-pressed': appearance.mascots ? 'true' : 'false',
              disabled: appearanceDisabled,
              onClick: function () { applyAppearance({ mascots: !appearance.mascots }) },
            }, appearance.mascots ? t('mascotsOn') : t('mascotsOff')),
          ])),
        h('div', { className: 'ct-field' },
          h('span', null, t('artLabel')),
          actionRow([
            h('button', {
              key: 'art',
              type: 'button',
              className: 'ct-btn' + (appearance.art ? ' ct-btn--primary' : ''),
              'data-action': 'appearanceArt',
              'aria-pressed': appearance.art ? 'true' : 'false',
              disabled: appearanceDisabled,
              onClick: function () { applyAppearance({ art: !appearance.art }) },
            }, appearance.art ? t('artOn') : t('artOff')),
          ])),
        h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, appearanceMessage))

      // Navigation rail: every page is always listed, so a page never disappears
      // just because its data is empty.
      const sections = SECTIONS
      const activeSection = sections.some(function (item) { return item.id === section })
        ? section
        : sections[0].id
      const nav = h('nav', { className: 'ct-nav', 'aria-label': t('navAria') },
        h('div', { className: 'ct-nav-brand' },
          h('svg', {
            viewBox: '0 0 16 16',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.3',
            strokeLinecap: 'round',
            'aria-hidden': 'true',
          }, h('path', { d: 'M2.5 3.75h11M2.5 6.5h9M2.5 9.25h6.5M2.5 12h4' })),
          h('span', null, t('sectionLabel'))),
        sections.map(function (item) {
          return h('button', {
            key: item.id,
            type: 'button',
            className: 'ct-nav-item',
            'data-section': item.id,
            'aria-current': item.id === activeSection ? 'page' : undefined,
            onClick: function () { setSection(item.id) },
          },
          h('svg', {
            viewBox: '0 0 16 16',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.35',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': 'true',
          }, h('path', { d: item.icon })),
          h('span', null, t(item.navLabel)))
        }))

      const meta = state
        ? h('div', { className: 'ct-meta', key: 'meta' },
          h('span', null, t('engines') + t('sep') + engineCount),
          h('span', null, t('lastCompact') + t('sep') + lastText),
          state.paths && state.paths.settings
            ? h('span', null, t('settingsPath') + t('sep') + state.paths.settings)
            : null)
        : null

      // The rules page carries both editors: the global file and the supplement
      // each registered workspace gets at the top of its own AGENTS.md.
      const pages = {
        levels: [panel, meta],
        rules: [rulesPanel, workspacePanel],
        components: [componentsPanel],
        appearance: [appearancePanel],
        github: [ghAuthPanel],
      }

      return h('section', {
        className: 'ct-page ct-skin',
        'data-palette': appearance.palette,
        'data-motion': appearance.motion,
      },
        h('div', { className: 'ct-shell' },
          nav,
          h('div', { className: 'ct-content', key: activeSection }, pages[activeSection])))
    }

    /**
     * The stylesheet is global: the composer dock pill renders outside the
     * toolbox panel, so a `<style>` scoped to that panel would leave the pill
     * unstyled (default 300x150 SVG boxes) until the panel was opened once.
     */
    function installStyles() {
      if (typeof document === 'undefined' || !document.createElement || !document.head) {
        return function () {}
      }
      const existing = typeof document.querySelector === 'function'
        ? document.querySelector('style[data-compression-tiers]')
        : null
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
      const style = document.createElement('style')
      style.setAttribute('data-compression-tiers', '')
      style.textContent = CSS
      document.head.appendChild(style)
      return function () {
        if (style.parentNode) style.parentNode.removeChild(style)
      }
    }

    /** Five descending bars: the sidebar row's mark for the tier control. */
    function PanelIcon(props) {
      const size = props && props.size ? props.size : 16
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '1.3',
        strokeLinecap: 'round',
        'aria-hidden': 'true',
      },
      h('path', { d: 'M2.5 3.75h11M2.5 6.5h9M2.5 9.25h6.5M2.5 12h4' }))
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      // Seams for the unit tests: the palette table, the skin runtime and the
      // reasoning bridge are the things a fake renderer cannot reach.
      __test: {
        skinSpec: skinSpec,
        skinTints: SKIN_TINTS,
        setSkinPalette: setSkinPalette,
        skinRuntime: skinRuntime,
        normalizeAppearance: normalizeAppearance,
        applyOptics: applyOptics,
        vialUsage: vialUsage,

        setSkinTheme: function (theme) {
          skinRuntime.theme = theme
          paintSkin()
        },
        // The geometry and colour ramps are pure, the DOM controller takes a
        // fake document, and the bridge can be pointed at a fake model directory.
        effort: {
          stateOf: effortStateOf,
          knobLeft: effortKnobLeft,
          indexAt: effortIndexAt,
          step: stepEffort,
          ramp: effortRamp,
            findRow: findReasoningRow,
          createSlider: createEffortSlider,
          bridge: effortBridge,
          setDocument: function (doc) { effortDocument = doc || null },
          setDirectory: function (directory) { effortBridge.directory = directory || null },
          setService: function (service) { modelDirectories = service || null },
          mount: mountEffortBridge,
          setLabels: function (labels) {
            effortBridge.labels = {
              ariaLabel: labels && labels.ariaLabel ? labels.ariaLabel : '',
              errorPrefix: labels && labels.errorPrefix ? labels.errorPrefix : '',
            }
          },
          sync: function () { syncEffortSlider() },
          select: function (index) { selectEffort(index) },
        },
      },
      apply(ctx) {
        ctx.effect(function () {
          return installStyles()
        }, 'compression-tiers: styles')

        // Whole-app skin: the host's theme service composes our palette layer on
        // top of the active theme. Optional on purpose — a host without the
        // service keeps the panel and the dock, it just does not repaint.
        if (typeof ctx.inject === 'function') {
          ctx.inject(['theme'], function (scope) {
            skinRuntime.theme = scope.theme
            paintSkin()
            return function () {
              skinRuntime.theme = null
              dropSkin()
            }
          })
        }
        // Reasoning effort: the official model directory owns the levels, so
        // this service is the only way in. Optional — a host without it keeps
        // the dock and the menu exactly as they are (the slider never mounts).
        if (typeof ctx.inject === 'function') {
          ctx.inject(['modelDirectories'], function (scope) {
            modelDirectories = scope && scope.modelDirectories ? scope.modelDirectories : null
            return function () {
              modelDirectories = null
            }
          })
        }
        if (typeof fetch === 'function') {
          // The palette lives in our own settings, so the skin is back before the
          // user opens anything — not only after the appearance page loads. The
          // retry matters: a host that answers before the plugin half is ready
          // would otherwise leave the whole art layer off for the session.
          let appearanceTry = 0
          const loadAppearance = function () {
            appearanceTry += 1
            let request
            try {
              request = loadSettingsSnapshot()
            } catch {
              return
            }
            request.then(function (body) {
              const appearance = normalizeAppearance(body && body.appearance)
              setSkinPalette(appearance.palette)
              applyOptics(appearance)
            }).catch(function () {
              if (appearanceTry < 5 && typeof setTimeout === 'function') setTimeout(loadAppearance, 1500 * appearanceTry)
            })
          }
          loadAppearance()
        }
        ctx.effect(function () {
          return ctx.locale.register(NS, DICTIONARIES)
        }, 'compression-tiers: locale')
        const t = ctx.locale.bind(NS)
        function ToolboxPanel() {
          return h(Page, { t: t })
        }
        // The sidebar row selects the toolbox as a main panel. The old Settings
        // section is gone on purpose: one entry, one page.
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({
            name: 'sidebar.panellist',
            id: 'compression-tiers',
            order: 47,
            label: function () { return t('sectionLabel') },
          }, PanelIcon)
        })
        ctx.slots.inject('main', function () {
          return ctx.slots.register({
            name: 'main',
            key: 'compression-tiers',
          }, ToolboxPanel)
        })
        // Composer dock: which online repository this session publishes to.
        // The dock renders in a blank Session too, unlike the title cluster.
        ctx.slots.inject('conversation.input.dock', function () {
          return ctx.slots.register({
            name: 'conversation.input.dock',
            id: 'compression-repo',
            order: 90,
            locale: NS,
          }, RepoBinding)
        })
      },
    }
  },
})
