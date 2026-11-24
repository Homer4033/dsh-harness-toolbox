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

    const DICTIONARIES = {
      zh: {
        sectionLabel: '压缩分档',
        title: '压缩分档与工具箱',
        levelsAria: '压缩档位',
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
  padding: 20px 24px 48px;
  color: var(--dsw-alias-label-primary);
}
.ct-page-inner {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}
.ct-head {
  display: grid;
  gap: 4px;
}
.ct-head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
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
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2);
}
.ct-levels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 640px) {
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
  border-radius: 16px;
  padding: 10px 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
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
  border-color: var(--dsw-alias-border-selected);
  background: var(--dsw-alias-bg-module-platform);
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  padding: 0 var(--dsh-composer-side-clearance, 16px);
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
  background: var(--dsw-alias-bg-module-platform);
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
  border-color: var(--dsw-alias-border-l2);
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
/* The listbox opens upward from the composer dock: the data-side attribute
   picks the entry direction, and the route keeps at most the room above the
   pill. */
.ct-repo-menu {
  position: fixed;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  gap: 1px;
  box-sizing: border-box;
  overflow: auto;
  padding: 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34), 0 2px 8px rgba(0, 0, 0, 0.18);
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 16px;
  transform-origin: bottom center;
  animation: ct-repo-rise 130ms ease-out;
}
.ct-repo-menu[data-side='down'] {
  transform-origin: top center;
  animation-name: ct-repo-drop;
}
.ct-repo-menu:focus {
  outline: none;
}
@keyframes ct-repo-rise {
  from { opacity: 0; transform: translateY(4px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
@keyframes ct-repo-drop {
  from { opacity: 0; transform: translateY(-4px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
.ct-repo-menu-head {
  padding: 6px 9px 5px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 500;
  line-height: 15px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ct-repo-sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--dsw-alias-border-l2);
}
.ct-repo-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 0 9px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms ease;
}
@media (hover: hover) {
  .ct-repo-option:hover {
    background: var(--dsw-alias-interactive-bg-hover);
  }
}
.ct-repo-option:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.ct-repo-option-active {
  background: var(--dsw-alias-interactive-bg-hover);
}
.ct-repo-option-on {
  background: var(--dsw-alias-bg-module-platform);
}
.ct-repo-option-on .ct-repo-option-name {
  font-weight: 500;
}
.ct-repo-check {
  flex: none;
  width: 14px;
  color: var(--dsw-alias-state-business-primary);
}
.ct-repo-option-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ct-repo-tag {
  flex: none;
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.ct-repo-menu-note {
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
        const rect = node.getBoundingClientRect()
        const win = typeof window === 'undefined' ? null : window
        const viewportWidth = win && win.innerWidth ? win.innerWidth : 1024
        const viewportHeight = win && win.innerHeight ? win.innerHeight : 768
        const width = Math.min(Math.max(288, Math.round(rect.width) + 24), Math.max(220, viewportWidth - 24))
        const left = Math.max(8, Math.min(Math.round(rect.left), Math.round(viewportWidth - width - 8)))
        const gap = 8
        const roomAbove = Math.round(rect.top - gap - 8)
        const roomBelow = Math.round(viewportHeight - rect.bottom - gap - 8)
        const up = roomAbove >= 200 || roomAbove >= roomBelow
        placement.current = up
          ? {
            up: true,
            left,
            width,
            bottom: Math.round(viewportHeight - rect.top + gap),
            maxHeight: Math.max(140, Math.min(320, roomAbove)),
          }
          : {
            up: false,
            top: Math.round(rect.bottom + gap),
            left,
            width,
            maxHeight: Math.max(140, Math.min(320, roomBelow)),
          }
        setActive(0)
        setOpen(true)
      }

      React.useEffect(function () {
        if (!open) return undefined
        const doc = typeof document === 'undefined' ? null : document
        const win = typeof window === 'undefined' ? null : window
        const onDown = function (event) {
          const target = event && event.target
          if (pillRef.current && target && pillRef.current.contains(target)) return
          if (menuRef.current && target && menuRef.current.contains(target)) return
          setOpen(false)
        }
        const onKey = function (event) {
          if (event.key === 'Escape') setOpen(false)
        }
        const onResize = function () { setOpen(false) }
        if (doc) doc.addEventListener('mousedown', onDown)
        if (doc) doc.addEventListener('keydown', onKey)
        if (win) win.addEventListener('resize', onResize)
        return function () {
          if (doc) doc.removeEventListener('mousedown', onDown)
          if (doc) doc.removeEventListener('keydown', onKey)
          if (win) win.removeEventListener('resize', onResize)
        }
      }, [open])

      // Focus moves into the listbox on open so the arrow keys work without a
      // click, and Esc returns focus to the pill.
      React.useLayoutEffect(function () {
        if (!open) return
        const node = menuRef.current
        if (node && typeof node.focus === 'function') node.focus()
      }, [open])

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
      const menuStyle = { left: at.left + 'px', width: at.width + 'px', maxHeight: at.maxHeight + 'px' }
      if (at.up) menuStyle.bottom = at.bottom + 'px'
      else menuStyle.top = at.top + 'px'
      // Head line + separator keep "no repository" apart from the real list, so
      // the menu reads as a titled picker rather than a flat run of names.
      const menuChildren = [h('div', { key: '__head', className: 'ct-repo-menu-head', role: 'presentation' }, t('repoSelectLabel'))]
      items.forEach(function (item, index) {
        if (index === 1) menuChildren.push(h('div', { key: '__sep', className: 'ct-repo-sep', role: 'presentation' }))
        const selected = item.value === bound
        menuChildren.push(h('button', {
          key: item.value || '__none',
          id: 'ct-repo-option-' + index,
          type: 'button',
          role: 'option',
          tabIndex: -1,
          'aria-selected': selected ? 'true' : 'false',
          className: 'ct-repo-option'
            + (selected ? ' ct-repo-option-on' : '')
            + (index === activeIndex ? ' ct-repo-option-active' : ''),
          onMouseEnter: function () { setActive(index) },
          onClick: function () { chooseRepo(item.value) },
        },
        h('span', { className: 'ct-repo-check' }, selected ? '✓' : ''),
        h('span', { className: 'ct-repo-option-name' }, item.label),
        item.private ? h('span', { className: 'ct-repo-tag' }, t('repoPrivate')) : null))
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
        if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
          if (event.preventDefault) event.preventDefault()
          setActive(function (current) {
            const index = typeof current === 'number' ? current : 0
            if (key === 'Home') return 0
            if (key === 'End') return items.length - 1
            return key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length
          })
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
          className: 'ct-repo-menu',
          role: 'listbox',
          tabIndex: -1,
          'data-side': at.up ? 'up' : 'down',
          'aria-label': t('repoSelectAria'),
          'aria-activedescendant': items.length === 0 ? undefined : 'ct-repo-option-' + activeIndex,
          style: menuStyle,
          onKeyDown: onMenuKey,
        }, menuChildren), document.body)
        : null

      // The dock row renders in place above the composer: note (if any), then
      // the pill, both flush with the input card's right edge.
      return h('div', { className: 'ct-repo-dock' },
        note ? h('span', { className: 'ct-repo-note', role: 'status', title: note }, note) : null,
        h('span', { className: 'ct-repo-group' }, pill, menu))
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
        ? h('section', { className: 'ct-panel' },
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
              h('span', null, t('auto') + percent(level.thresholdRatio) + ' · ' + t('retain') + percent(level.retainRatio)))
            })),
          h('p', { className: 'ct-summary' }, t('currentLabel') + t('sep') + labelOf(t, current)),
          h('p', { className: 'ct-status', role: 'status', 'aria-live': 'polite' }, message))
        : h('p', { className: 'ct-intro', role: 'status' }, message || t('loading'))

      const dirty = rules ? rulesText !== rules.text : false
      const rulesCount = rules && typeof rules.chars === 'number' ? rules.chars : 0
      const rulesLimit = rules && typeof rules.maxChars === 'number' ? rules.maxChars : 0
      const rulesPanel = h('section', { className: 'ct-panel' },
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

      const componentsPanel = h('section', { className: 'ct-panel' },
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
      const ghAuthPanel = h('section', { className: 'ct-panel' },
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
        : h('section', { className: 'ct-panel' },
          h('div', { className: 'ct-rules-head' },
            h('h3', null, t('workspaceRulesTitle'))),
          h('label', { className: 'ct-field' },
            h('span', null, t('workspaceSelectLabel')),
            h('select', {
              className: 'ct-input',
              value: workspaceId,
              disabled: workspaceBusy,
              onChange: function (event) { pickWorkspace(event.target.value) },
            },
            workspaceList.map(function (item) {
              return h('option', { key: item.id, value: item.id }, item.title)
            }))),
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

      return h('section', { className: 'ct-page' },
        h('div', { className: 'ct-page-inner' },
          h('header', { className: 'ct-head' },
            h('h2', null, t('title'))),
          panel,
          rulesPanel,
          workspacePanel,
          componentsPanel,
          ghAuthPanel,
          state
            ? h('div', { className: 'ct-meta' },
              h('span', null, t('engines') + t('sep') + engineCount),
              h('span', null, t('lastCompact') + t('sep') + lastText),
              state.paths && state.paths.settings
                ? h('span', null, t('settingsPath') + t('sep') + state.paths.settings)
                : null)
            : null))
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
