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
     * The panel is a small shell: one navigation rail, one page at a time. The
     * workspace page drops out of the rail entirely when the registry is empty,
     * which is the same rule as hiding the block (no empty picker, no dead tab).
     */
    const SECTIONS = [
      { id: 'levels', navLabel: 'navLevels', icon: 'M3 4.5h10M3 8h7M3 11.5h4' },
      { id: 'rules', navLabel: 'navRules', icon: 'M4 2.5h5.5L12.5 5.5v8H4zM9.5 2.5v3h3M6 8h4M6 10.5h3' },
      { id: 'workspace', navLabel: 'navWorkspace', icon: 'M2.5 5.5h4l1.2 1.5h5.8v5.5h-11z' },
      { id: 'components', navLabel: 'navComponents', icon: 'M6 2.5h4v3H6zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z' },
      { id: 'github', navLabel: 'navGithub', icon: 'M8 2.5a5.5 5.5 0 0 0-1.7 10.7c.3.1.4-.1.4-.3v-1c-1.5.3-1.9-.7-1.9-.7-.2-.6-.6-.8-.6-.8-.5-.3 0-.3 0-.3.5 0 .8.5.8.5.5.9 1.3.6 1.6.5 0-.4.2-.6.3-.7-1.2-.1-2.5-.6-2.5-2.7 0-.6.2-1.1.5-1.5-.1-.1-.2-.7 0-1.4 0 0 .5-.2 1.5.5a5 5 0 0 1 2.8 0c1-.7 1.5-.5 1.5-.5.3.7.1 1.3.1 1.4.3.4.5.9.5 1.5 0 2.1-1.3 2.6-2.5 2.7.2.2.4.5.4 1v1.5c0 .2.1.4.4.3A5.5 5.5 0 0 0 8 2.5z' },
      { id: 'license', navLabel: 'navLicense', icon: 'M4 2.5h8v11H4zM6 6h4M6 8.5h4' },
    ]

    /** The plugin's own work plus the third-party programs the panel installs. */
    const PLUGIN_LICENSE = {
      name: 'dsh-harness-toolbox',
      license: 'MIT',
      url: 'https://github.com/Homer4033/dsh-harness-toolbox/blob/main/LICENSE',
    }
    const LICENSE_ROWS = [
      { name: 'GitHub CLI', license: 'MIT', url: 'https://github.com/cli/cli/blob/trunk/LICENSE' },
      { name: 'Git for Windows (MinGit)', license: 'GPL-2.0', url: 'https://github.com/git-for-windows/git/blob/main/COPYING' },
      { name: 'FFmpeg', license: 'GPL-2.0-or-later', url: 'https://ffmpeg.org/legal.html' },
      { name: 'Python (python-build-standalone)', license: 'PSF-2.0 · MIT', url: 'https://github.com/astral-sh/python-build-standalone/blob/main/LICENSE' },
    ]

    const DICTIONARIES = {
      zh: {
        sectionLabel: '压缩分档',
        title: '压缩分档与工具箱',
        levelsAria: '压缩档位',
        navAria: '面板分页',
        navLevels: '档位',
        navRules: '规则',
        navWorkspace: '工作区',
        navComponents: '组件',
        navGithub: 'GitHub',
        navLicense: '许可',
        levelsTitle: '档位',
        licenseTitle: '许可',
        licenseOwn: '本插件以 MIT 许可发布，源码与许可全文在仓库里。',
        licenseComponentsTitle: '托管组件',
        licenseNotice: '这些程序不随插件分发：面板下载的是各自发行方的构建，许可证随安装目录附带。',
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
        workspaceSelectLabel: '工作区',
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
        title: 'Compression tiers & toolbox',
        levelsAria: 'Compression tier',
        navAria: 'Panel sections',
        navLevels: 'Tiers',
        navRules: 'Rules',
        navWorkspace: 'Workspace',
        navComponents: 'Components',
        navGithub: 'GitHub',
        navLicense: 'License',
        levelsTitle: 'Tiers',
        licenseTitle: 'License',
        licenseOwn: 'This plugin is released under the MIT license; the source and the full text live in the repository.',
        licenseComponentsTitle: 'Managed components',
        licenseNotice: 'These programs are not bundled: the panel downloads each vendor build and its license ships with the install directory.',
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
        workspaceSelectLabel: 'Workspace',
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
  top: 18px;
  display: grid;
  gap: 3px;
  box-sizing: border-box;
  padding: 12px 10px;
  border: 1px solid var(--ct-glass-edge);
  border-radius: 20px;
  background: var(--ct-glass-rail);
  background-image: var(--ct-glass-sheen);
  box-shadow: var(--ct-glass-shadow), var(--ct-glass-inner);
  -webkit-backdrop-filter: blur(26px) saturate(170%);
  backdrop-filter: blur(26px) saturate(170%);
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
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
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
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  backdrop-filter: blur(22px) saturate(160%);
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
/* License page: one row per work, license id on the right, source link under
   it. Legal text is allowed here; it is not teaching copy. */
.ct-license {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ct-license-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  align-items: baseline;
  padding-top: 10px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.ct-license-row:first-child {
  padding-top: 0;
  border-top: 0;
}
.ct-license-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.ct-license-tag {
  justify-self: end;
  padding: 1px 7px;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 15px;
  white-space: nowrap;
}
.ct-license-link {
  grid-column: 1 / -1;
  color: var(--dsw-alias-link);
  font-size: 12px;
  line-height: 18px;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.ct-license-link:hover {
  text-decoration: underline;
}
.ct-license-link:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
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
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  padding: 0;
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
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
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
      const pillRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const placement = React.useRef(null)
      const mounted = React.useRef(true)

      React.useEffect(function () {
        mounted.current = true
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
          className: 'ct-menu',
          role: 'listbox',
          tabIndex: -1,
          'data-side': at.up ? 'up' : 'down',
          'aria-label': t('repoSelectAria'),
          'aria-activedescendant': items.length === 0 ? undefined : 'ct-repo-option-' + activeIndex,
          style: menuPos,
          onKeyDown: onMenuKey,
        }, menuChildren), document.body)
        : null

      // The dock row renders in place above the composer: note (if any), then
      // the pill, both flush with the input card's right edge.
      return h('div', { className: 'ct-repo-dock' },
        note ? h('span', { className: 'ct-repo-note', role: 'status', title: note }, note) : null,
        h('span', { className: 'ct-repo-group' }, pill, menu))
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
          className: 'ct-menu',
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
      // Workspace rules: one `AGENTS.md` per registered workspace. The registry
      // is the allow list, and an empty list hides the whole block.
      const [workspaceRules, setWorkspaceRules] = React.useState(null)
      const [workspaceId, setWorkspaceId] = React.useState('')
      const [workspaceText, setWorkspaceText] = React.useState('')
      const [workspaceMessage, setWorkspaceMessage] = React.useState('')
      const [workspaceBusy, setWorkspaceBusy] = React.useState(false)
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
        setWorkspaceRules(list.length === 0 ? null : body)
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
      // touch, and an empty registry hides the block instead of showing an
      // empty picker.
      const workspaceList = workspaceRules && Array.isArray(workspaceRules.workspaces)
        ? workspaceRules.workspaces
        : []
      const workspaceRow = workspaceList.find(function (item) { return item.id === workspaceId }) || null
      const workspaceDirty = Boolean(workspaceRow)
        && (typeof workspaceRow.text === 'string' ? workspaceRow.text : '') !== workspaceText
      const workspacePanel = workspaceList.length === 0
        ? null
        : h('section', { className: 'ct-panel', key: 'workspace' },
          h('div', { className: 'ct-rules-head' },
            h('h3', null, t('workspaceRulesTitle'))),
          h('div', { className: 'ct-field' },
            h('span', null, t('workspaceSelectLabel')),
            h(Select, {
              t: t,
              items: workspaceList.map(function (item) {
                return { value: item.id, label: item.title }
              }),
              value: workspaceId,
              disabled: workspaceBusy,
              onChange: pickWorkspace,
            })),
          h('label', { className: 'ct-field' },
            h('span', null, t('rulesLabel') + ' · ' + workspaceText.length + ' ' + t('rulesChars')),
            h('textarea', {
              className: 'ct-textarea',
              rows: 8,
              spellCheck: false,
              value: workspaceText,
              placeholder: t('workspaceRulesPlaceholder'),
              disabled: workspaceBusy,
              onChange: function (event) { setWorkspaceText(event.target.value) },
            })),
          workspaceRow
            ? h('p', { className: 'ct-note' }, t('rulesPathLabel') + t('sep') + workspaceRow.file
              + (workspaceRow.exists === false ? ' — ' + t('workspaceRulesMissing') : ''))
            : null,
          actionRow([
            actionButton('workspaceRulesSave', workspaceBusy ? t('rulesSaving') : t('rulesSave'), {
              disabled: workspaceBusy || !workspaceRow || !workspaceDirty,
              onClick: saveWorkspaceRules,
              primary: true,
            }),
          ]),
          h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, workspaceMessage))

      // Navigation rail. The workspace page only exists while the registry names
      // at least one workspace: an empty registry keeps the page out of the rail
      // instead of opening a blank one.
      const sections = SECTIONS.filter(function (item) {
        return item.id !== 'workspace' || workspaceList.length > 0
      })
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

      // License page: the plugin itself and the programs this panel can
      // install. Legal text only, no usage instructions.
      function licenseRow(row) {
        return h('li', { className: 'ct-license-row', key: row.name },
          h('span', { className: 'ct-license-name' }, row.name),
          h('span', { className: 'ct-license-tag' }, row.license),
          h('a', {
            className: 'ct-license-link',
            href: row.url,
            target: '_blank',
            rel: 'noreferrer noopener',
          }, row.url))
      }
      const licensePanel = h('section', { className: 'ct-panel', key: 'license' },
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('licenseTitle'))),
        h('p', { className: 'ct-note' }, t('licenseOwn')),
        h('ul', { className: 'ct-license' }, licenseRow(PLUGIN_LICENSE)),
        h('div', { className: 'ct-rules-head' },
          h('h3', null, t('licenseComponentsTitle'))),
        h('ul', { className: 'ct-license' }, LICENSE_ROWS.map(licenseRow)),
        h('p', { className: 'ct-note' }, t('licenseNotice')))

      const meta = state
        ? h('div', { className: 'ct-meta', key: 'meta' },
          h('span', null, t('engines') + t('sep') + engineCount),
          h('span', null, t('lastCompact') + t('sep') + lastText),
          state.paths && state.paths.settings
            ? h('span', null, t('settingsPath') + t('sep') + state.paths.settings)
            : null)
        : null

      const pages = {
        levels: [panel, meta],
        rules: [rulesPanel],
        workspace: [workspacePanel],
        components: [componentsPanel],
        github: [ghAuthPanel],
        license: [licensePanel],
      }

      return h('section', { className: 'ct-page' },
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
      apply(ctx) {
        ctx.effect(function () {
          return installStyles()
        }, 'compression-tiers: styles')
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
