# AGENTS.md

> 本仓库是 DeepSeek Harness 插件 `dsh-harness-toolbox`（旧名 `dsh-compression-tiers`） 的维护契约。任何工程代码、资产或系统变更操作前先读本文件。

## 目录

- [范围](#范围)
- [事实来源](#事实来源)
- [工程约束](#工程约束)
- [验证要求](#验证要求)
- [文档索引](#文档索引)
- [变更记录](#变更记录)

## 范围

- 本仓库只负责五档上下文压缩、全局规则编辑、组件管理、发布流程与会话发布仓库：档位参数、设置页、`compression_tiers` / `compression_context` / `compression_compact` / `github_push` 四个工具、把档位同步进预设隔离域的 `compaction-basic` 引擎、设置页里对 `<DSH home>/AGENTS.md` 的读取与原子写入、四套托管组件（GitHub CLI / git / ffmpeg+ffprobe / Python）的 PATH 检测与托管下载、`gh` 的设备码登录与网络体检、`github_push` 的发布流程、会话标题旁的在线仓库绑定，以及四套托管文件共用的下载根目录与整体迁移。
- 不负责：`dsh-compaction-basic` 本身的压缩算法、会话历史、摘要模型选择、官方 `/compact` 命令；不解析或改写规则内容，只把它当作文本原样保存；不实现 PR/检查/评审/工作树面板本身（官方 `dsh-experimental-forge-bundle` 负责），只保证它找得到已登录的 `gh`。
- 不做仓库列表面板：1.4.x 的左侧栏「仓库」面板在 1.5.0 删除，1.5.1 又删掉设置页里的默认仓库与推送/建仓/查看动作；1.6.0 只增加会话标题旁按会话绑定的单个在线仓库选择器（`conversation.session.header.actions`）。多仓库场景由智能体在各自会话里调用 `github_push`，不要再加仓库列表或推送按钮。
- 不提供改写全局规则的智能体工具：高优先级契约只能由人在设置页保存。
- 不维护 `homerdsh-workbench` 的其它子系统（会话、GitHub、记忆、视频、投研终端）。

## 事实来源

- 当前策略：`<DSH home>/compression-tiers/settings.json`。引擎配置是派生态，可重建。
- 全局规则唯一来源：`<DSH home>/AGENTS.md`，由官方 `dsh-agent-instructions` 读取；本插件不复制、不缓存，删文件即等于没有规则。
- GitHub CLI 版本唯一来源：`src/gh.js` 的 `GH_VERSION`（当前 `2.76.2`）与官方 release URL；托管副本在 `<toolsPath>/gh`，登录凭据在 `gh` 自己的存储里，插件不读取。
- 下载位置唯一来源：`settings.json` 的 `toolsPath`（空 = `<DSH home>/compression-tiers`），由 `src/tools-path.js` 解析；`gh` 装 `<toolsPath>/gh`、git 装 `<toolsPath>/git`、ffmpeg 装 `<toolsPath>/ffmpeg`、Python 装 `<toolsPath>/python`。任何模块都不得再硬编码用户可见的安装目录。
- 档位参数唯一来源：`src/levels.js` 的 `COMPRESSION`；文档与界面不得写出与之不一致的比例。
- 发布目录选择唯一来源：`src/push-flow.js` 的 `resolvePushCwd`（显式路径 → 会话工作目录；没有配置项、没有兜底）；插件自己的检出目录不得作为工具默认值。
- 会话发布目标唯一来源：`settings.json` 的 `sessionRepos`（会话 id → `owner/name`）；`github_push` 把它变成 `https://github.com/<owner/name>.git` 作为 `pushFlow` 的 `target`，没有绑定则回落到 `github.remote`（初始 `origin`）。
- 音视频托管源唯一来源：`src/ffmpeg.js` 的 `SOURCES`（当前只有 Windows 的 `ffmpeg-release-essentials.zip`）；托管副本在 `<toolsPath>/ffmpeg/bin`，浮动 release 构建，钉住 URL 与安装后的自检。
- git / Python 托管源唯一来源：`src/components.js` 的 `COMPONENTS`（钉住 MinGit `2.56.1` 与 python-build-standalone `3.11.18+20261110`，资源文件名与版本同步）；托管副本在 `<toolsPath>/git`、`<toolsPath>/python`。
- 组件行唯一来源：`src/component-rows.js` 的 `COMPONENT_ORDER` 与四个 mapper（gh / git / ffmpeg / python → 统一行）。设置页不得自行拼装某一个组件的状态、版本或路径，也不得再为单个组件加一套状态行。
- 运行时兼容声明：`package.json` 的 `engines.dsh`（当前 `>=0.2.2-rc.3 <0.3.0`），DSH 加载器据此拒绝不兼容版本。
- 官方阈值公式：`floor(min(W × thresholdRatio, W − O − 65,536))`，逐字保留 `(W − O) × retainRatio`。

## 工程约束

1. 不手工改已安装 profile 的 `package.json` / `cordis.patch.yml`；安装与启用通过 `plugin_manager`。把 `link:` 本地链接换成 registry / git 安装时，必须先让插件页移除该条目（它会清掉 `node_modules` 里的 Junction）；pnpm 不能用 rename 覆盖 Junction，会报 `ERR_PNPM_EPERM` 并把 profile 清单里的条目一起弄丢。删 Junction 只能用 `cmd /c rmdir <link>`，禁止递归删除。
2. 新增运行时文件必须同时更新 `package.json` 的 `files` 与 `exports`；locale、图标、详情文档保持在包内。
3. 不引入 Harness Client 包作为模块；设置页只用主题 token 与自有控件。
4. 状态写入必须原子（临时文件 + rename）；手改坏的 JSON 回落到默认值，不得让插件崩溃。
5. 预设结构访问保持防御式：拿不到结构时放弃更新，保留官方默认。
6. 插件不写 `$DSH_HOME/cordis.patch.yml`，不改宿主平面上的 `compaction-basic` 行。
7. 文档内容冲突时优先级：AGENTS.md > README.md > locale 文案。
8. 全局规则只写 `<DSH home>/AGENTS.md`，不写工作区 `AGENTS.md`；写入必须原子、去 BOM、CRLF 归一为 LF、保留单个结尾换行，超过 100,000 字符返回 413 而不是截断。
9. 系统提示只带规则的最新 2,000 字符摘要，不得整份注入或把摘要写回文件。
10. GitHub CLI 下载固定 `GH_VERSION` 与官方 release URL；解压后必须先跑 `--version` 探测暂存副本再原子替换，失败回滚旧二进制；只把托管 `bin` 目录插到本进程 PATH 最前，不改系统环境变量。
11. 登录只驱动 `gh auth login --web` 的设备码流程，不读取、不复制、不代存 `gh` 凭据；取消时结束子进程并丢弃会话状态。
12. ffmpeg / ffprobe 下载用 `SOURCES` 里的 URL 与 HTTP Range 续传；解压后必须先对暂存的两个二进制各跑一次 `-version`，再原子替换 `bin` 目录、失败回滚旧版本；只把托管 `bin` 目录插到本进程 PATH 最前，不写系统环境变量。托管源只有 Windows，其它平台只做 PATH 检测。
13. 会话发布仓库只允许改 `github_push` 的推送目标：不得因此克隆仓库、切换分支或改动会话工作区；绑定归一化必须是 `owner/name`，非法值丢弃，最多保留 200 条。
14. 会话头选择器注册在官方 `conversation.session.header.actions`（id `compression-repo`）；不得改标题、工作区选择器或其它官方 slot 的注册。官方 header 对标题旁动作是 `overflow: clip`，需要渲染到标题下方时只能用 portal 挂到 View 标签行（`[data-conversation-tabs]` 的父节点）并负责清理，拿不到标签行就退回内联。胶囊固定在标签行内、紧跟标签之后（不得再用 `margin-left: auto` 甩到最右边），`margin-top: -4px` 让 24px 胶囊与标签文字基线对齐；不得为了多一行去改官方 `titleRow` / `tabs` 的布局——header 高度是桌面窗口 chrome 几何的锚点。下拉菜单顶部有标题行，`不使用仓库` 与仓库列表之间有分隔线。
15. 设置页只放控件标签、当前值、路径与错误信息。不写教学性说明段（面板介绍、原理、操作步骤、"为什么需要它"）：这类文字写进本文件或 README，界面上的 `intro` / `*Note` 一类键不再新增；旧键删除后不得加回。示例值只能作为输入框 `placeholder`，不能变成段落。
16. 所有动作按钮必须常显：条件不满足时渲染为 `disabled` 并用 `title`（或同一行的状态文本）说明原因，不得用条件渲染把按钮整个隐藏（弹层、菜单、进度条不在此列，它们不是动作按钮）。设置页现有按钮——档位、规则保存、组件行下载/重新检测、`gh` 登录、设备码复制/打开授权页/取消、网络体检、下载目录迁移/恢复默认——都按这条执行；组件行在状态还没读到时也要渲染（显示「正在读取…」并置灰），不得整行消失。
17. 下载根目录规则：`toolsPath` 只接受绝对路径，非法或相对值回落默认（写库时归一化为空串）；迁移前先做完整预检（目标已有同名组件即拒绝、任一下载进行中返回 409），四套组件要么都搬、要么都不动；跨卷 `EXDEV` 退化为复制后删除；迁移成功才写 `toolsPath`，失败保留旧值以便重试；迁移后必须把本进程 PATH 里的旧目录（`gh/bin`、`git/cmd`、`ffmpeg/bin`、`python` 与 `python/Scripts`）换成新的。
18. 设置页按钮只有一套标准：所有动作按钮经 `actionButton()` 渲染（基础类 `ct-btn`，主操作 `ct-btn--primary` 只加描边与底色，不改尺寸）；每个动作行经 `actionRow()` 渲染为 `ct-actions`，行内只放按钮、状态文字另起一行；按钮标签走共享键（`downloadIdle` / `downloadKeep` / `downloadContinue` / `downloadRetry` / `downloadRunning` / `downloadDone` / `downloadUnsupported`、`probe`、`stateMissing` / `statePartial` / `stateFailed` / `stateSystem`），禁止再出现 `ghDownload` / `toolsInstall` 这类按面板分裂的副本。四套组件行必须结构一致（名称与版本 → 状态行 → 进度 → 路径/错误 → 同一行两个按钮，下载在左、重新检测在右），都由 `downloadControl()` 算出状态与标签。
19. git / Python 的托管安装：下载用 `COMPONENTS` 里钉住的 URL 与 HTTP Range 续传；解压与暂存必须在 `<toolsPath>/.staging/<id>`（**不能**放在组件目录内，否则整棵树 rename 到 `<root>/<id>` 会踩父目录），先对暂存二进制跑一次 `--version`，通过后整棵树原子替换、失败回滚旧版本；只把 `git/cmd`、`python`、`python/Scripts` 插到本进程 PATH 最前，不写系统环境变量。托管源只有 Windows，其它平台只做 PATH 检测并报「当前系统不可用」。
20. 安装替换必须经 `src/swap.js` 的 `moveIntoPlace()`，不得直接 `renameSync` 到安装目录：Windows 在目录里有文件被占用（杀毒扫描刚写出的二进制、`-version` 子进程还没退干净）时把 rename 报成 `EPERM`，必须「重试退避 → 仍失败就复制过去」，否则用户看到的就是一次白下的安装失败。下载完成的归档文件（`<root>/<id>/download/<file>`）要复用，重试时先判断它是否已存在，存在就不再下载。

## 验证要求

- 改动后运行 `npm test`；新增档位、路由或同步逻辑必须补 `node:test` 用例。
- 修改 `src/rules.js`、`/compression-tiers/api/rules` 或设置页规则面板后，必须让 `test/rules.test.js` 与 `test/client.test.js` 覆盖读取、归一化、413、摘要与面板状态。
- 修改 `src/gh.js`、`/compression-tiers/api/github` 或 GitHub CLI 面板后，`test/gh.test.js` 必须覆盖状态、断点续传、416 重启、**自动重试**（掉线重试并从 `.part` 续传、4xx 不重试、`aborted` 不重试、重试预算用尽后报出次数）、PATH 前插与设备码解析；真实下载/安装只在临时 home 验证，不写用户 DSH home。
- 修改 `src/publish.js` 或 `/compression-tiers/api/github/network` 后，`test/publish.test.js` 必须覆盖代理归一化与优先级、GitHub 连通判定（直连 / 代理 / 代理不通 / 全断）、失败分类、push 的代理注入与超时终止、仓库快照、建仓确认与密钥扫描。
- 修改 `src/push-flow.js` 或 `github_push` 工具后，`test/push-flow.test.js` 必须覆盖目录选择（显式 → 会话，无兜底）、不可用路径早退、密钥拦截与 `force` 放行、失败分类与报告文案；发布只能有 `github_push` 一个入口，不要再往设置页加推送按钮。会话绑定生效时还必须覆盖 `target` 作为远端、不再取仓库快照、以及拒绝推送时仍报告 `target`。
- 修改 `src/ffmpeg.js` 或 `/compression-tiers/api/ffmpeg` 后，`test/ffmpeg.test.js` 必须覆盖托管源选择、`-version` 解析、PATH 检测与托管优先、状态（missing / partial / installed）与 PATH 前插；真实下载只在临时 home 验证，不写用户 DSH home。
- 修改 `src/manual-compact.js`（主动压缩队列）后，`test/manual-compact.test.js` 必须覆盖：排队后 `turn/end` 才压缩并注入一次续跑、重复请求被拒、`aborted` 丢弃、**真人消息优先**（结束前发言取消排队任务、压缩中发言只取消续跑）、宿主已按阈值压缩时不重复压缩但仍续跑。真人发言不得被压缩流程吞掉，也不得被续跑消息抢先回答。
- 修改会话发布仓库（`sessionRepos`、`/api/github/online`、`/api/github/binding`）后，`test/gh.test.js` 覆盖仓库行解析与 `gh` 缺失分类，`test/store.test.js` 覆盖 `owner/name` 归一化与 200 条上限，`test/client.test.js` 覆盖会话头选择器的注册、选项与状态提示，以及胶囊位置（`.ct-repo-slot` 不含 `margin-left`、`margin-top: -4px`）和下拉菜单的标题行 + 分隔线顺序。
- 修改 `src/http.js` 的 `queryParam` 后，`test/http.test.js` 必须覆盖缺参、空值与非字符串请求。
- 修改 `src/tools-path.js`、`/compression-tiers/api/tools` 或设置页的下载目录区块后，`test/tools-path.test.js` 必须覆盖默认根、绝对路径校验、四套组件整体迁移、目标已存在时预检拒绝、任一下载进行中 409、跨卷 `EXDEV` 回退与「搬一半后重试」；`test/store.test.js` 覆盖 `toolsPath` 归一化，`test/client.test.js` 覆盖迁移与恢复默认按钮的禁用态。
- 修改 `src/swap.js`（安装树替换）后，`test/swap.test.js` 必须覆盖首试成功、锁重试后成功、锁不释放退化为复制、不可重试错误（`ENOENT`）早退、跨卷 `EXDEV` 直接复制；`src/gh.js` / `src/ffmpeg.js` / `src/components.js` 里到安装目录的移动必须走 `moveIntoPlace`，不得留裸 `renameSync`。
- 修改 src/components.js、/compression-tiers/api/components 或某一行组件后，`test/components.test.js` 必须覆盖钉住的 URL 与资源文件名（含 Python 的 `%2B`）、版本解析、PATH 检测、状态（missing / partial / installed / system）、PATH 前插去重与未知组件/无托管构建的早退；`test/component-rows.test.js` 覆盖四行顺序与 state → ready/managed/system/running 映射；`test/client.test.js` 覆盖四行的按钮一致性。
- 修改设置页文案或按钮后，`test/client.test.js` 必须覆盖：动作按钮常显（含设备码复制 / 打开授权页 / 取消在空闲时仍渲染且 `disabled`、组件行在状态未到时仍渲染）、说明段键已删除（`intro`、`ghToolNote` 等不得回到字典里）、空状态行收起（`.ct-status:empty` / `.ct-note:empty` 不占位、面板底部不留白），以及四套组件行的按钮一致性（同样的类名、同样的标签键、同样的禁用态、同样的一行顺序）；按面板分裂的标签键（`ghDownload`、`toolsInstall` 等）与已合并的旧面板键（`toolsTitle`、`toolsPathTitle`、`ghTitle`、`ghPathLabel`）都不得回归。
- 发布前运行 `npm run check:secrets`；新增运行时文件、改 `package.json` 的 `files` 或版本号后同步 `CHANGELOG.md` 并按版本打 tag（`vX.Y.Z`）。
- 修改 manifest、locale、图标或 `client.js` 注册方式后，检查 `test/manifest.test.js` 全绿。
- 安装验证以插件页的 `application` 结果与新会话中的工具/设置为准，不以下载或日志推断成功。
- 无法在浏览器中确认的视觉效果，交付时明确写"渲染未验证"。

## 文档索引

- [README.md](README.md)：安装、使用、档位表、工具、原理、限制、发布与版本。
- [CHANGELOG.md](CHANGELOG.md)：按版本记录变更与 tag。
- [scripts/check-secrets.mjs](scripts/check-secrets.mjs)：`npm run check:secrets`，CI 与本地共用的密钥扫描入口。
- [docs/DETAIL.md](docs/DETAIL.md)：插件详情页（英文，单图）。
- [docs/DETAIL.zh.md](docs/DETAIL.zh.md)：插件详情页（中文，单图）。
- [locale/en.json](locale/en.json)、[locale/zh.json](locale/zh.json)：插件管理器元数据与描述。
- [test/](test/)：单元测试与 manifest 规范检查。

## 变更记录

- 2026-11-17：从 `homerdsh-workbench` 拆出，独立包、独立状态、独立工具名；首次安装尽量沿用现有引擎档位，未匹配五档时采用 `standard`。
- 2026-11-17：把 `homerdsh-workbench` 的全局规则设置合并进来：新增 `src/rules.js` 与 `/compression-tiers/api/rules`，设置页增加规则面板，系统提示带最新 2,000 字符摘要；`src/store.js` 增加原子文本写入；版本升到 1.1.0。
- 2026-11-17：设置页文案精简（档位说明改为一句话、删除主动压缩说明段、规则面板文案缩短），版本 1.1.1；结构与接口未变。
- 2026-11-18：合并 GitHub CLI 功能：新增 `src/gh.js`（固定 `gh 2.76.2`、断点续传、原子安装回滚、设备码登录）、`/compression-tiers/api/github` 与 `/auth` 路由、设置页 GitHub CLI 面板；版本升到 1.2.0。
- 2026-11-18：把 `@deepseek-ai/dsh-home-paths`、`@deepseek-ai/dsh-tools` 声明为可选 `peerDependencies`：以本地目录链接（linked root）方式安装时，DSH 的解析层靠包的 peer 声明把宿主导入路由到运行时实现，缺声明会导致 Host 半区导入失败、插件不激活；版本 1.2.1。
- 2026-11-18：GitHub 面板补上「能发出去」这一段：新增 `src/publish.js`（代理探测、DNS/TCP 体检、带超时与进程树清理的 push、仓库快照、建仓），`gh auth status --json hosts` 读 scopes，设置里加 `github.repoPath/remote/branch/proxy`，新增 `network` / `repo` 路由与 `configure` / `push` / `create` / `view` 动作；版本 1.3.0。
- 2026-11-18：发布规范：`src/publish.js` 增加 `scanSecrets`（文件名 + 内容两类密钥规则），推送前命中即阻止并可人工放行；新增 `scripts/check-secrets.mjs`（`npm run check:secrets`）与 CI 步骤，CI 覆盖 Windows 与 Linux；补 `CHANGELOG.md`，按版本打 tag；版本 1.3.1。
- 2026-11-19：面板去掉隐式兜底：`github.repos` 为空即空面板，默认仓库只用于设置页与单仓库动作；版本 1.4.1。
- 2026-11-18：多仓库面板：左侧栏 `sidebar.panellist`（id `compression-repos`）+ `main` 面板，每个仓库独立一行、独立推送，避免全局 `repoPath` 被并发会话互相覆盖；`github.repos` 保存绝对路径数组，`GET /api/github/repos` 返回逐仓库快照，`push`/`create`/`view` 的 `repo` 参数只接受列表内路径；设置页字段改为「默认仓库」兜底；版本 1.4.0。
- 2026-11-19：面板与官方「变更请求与工作树」重复，改为发布工具：删除 `sidebar.panellist` / `main` 注册、面板组件与图标、`repos*` 文案、`GET /api/github/repos` 与 `github.repos`；新增 `src/push-flow.js`（`resolvePushCwd` / `pushFlow` / `pushReportText`）与 `github_push` 工具（体检 → 密钥扫描 → 带超时推送 → 失败分类），设置页 `push` 动作改走同一流程；版本 1.5.0。
- 2026-11-19：仓库 UI 全部下线：删掉设置页的默认仓库输入与仓库状态、推送、建仓、查看按钮，以及 `configure` / `push` / `create` / `view` 动作和 `GET /api/github/repo` 路由；删除 `github.repoPath`（升级后下一次写入即清掉）与未再使用的 `resolveRepoPath`；发布只保留 `github_push`；`github_push` 的目录选择变为「显式路径 → 会话工作目录」；版本 1.5.1。
- 2026-11-19：新运行时兼容：`engines.dsh` 放宽为 `>=0.2.2-rc.3 <0.3.0`（rc.5 不再被判不兼容）。会话发布仓库：新增 `conversation.session.header.actions` 选择器（id `compression-repo`）、`/api/github/online` 与 `/api/github/binding` 路由、`sessionRepos` 状态，`github_push` 增加 `target` 并跳过 URL 远端的仓库快照。音视频工具：新增 `src/ffmpeg.js` 与 `/api/ffmpeg`，设置页面板负责检测、断点续传下载、自检后原子替换与 PATH 前插。`src/gh.js` 导出 `runCommand` / `extractArchive` 并新增 `listRepos` / `parseRepoList`，`src/http.js` 新增 `queryParam`；测试增至 113 条（`test/ffmpeg.test.js`、`test/http.test.js` 为新增）；版本 1.6.0。
- 2026-11-19：**包名改为 `dsh-harness-toolbox`**（旧名 `dsh-compression-tiers`，加载器 id 仍为 `compression-tiers`，状态目录与工具名不变；bundle 名即包名，升级须在插件页移除旧条目再添加本目录）。npm 发布改为「`npm stage publish` + 人工 2FA 审批」，旧名的 `0.0.0-stage` 占位弃用。音视频面板在未读到状态时显示「读取中…」而不是误报不支持；版本 1.6.1。
- 2026-11-19：会话头在线仓库选择器改成标题下方 View 标签行右侧的胶囊（图标 +「仓库」+ 当前 `owner/name` + 箭头，绑定时选中色描边）；官方 header 的 `.titleCluster` 是 `overflow: clip`，所以用 React portal 把外观挂到 `[data-conversation-tabs]` 所在行，原生 `<select>` 铺在胶囊上负责交互，没有标签行时退回内联；版本 1.6.2。
- 2026-11-19：样式表改为插件加载时全局注入 `style[data-compression-tiers]`（卸载移除），不再依赖设置页渲染 `<style>`；此前未打开设置页时胶囊无样式（SVG 默认 300×150 撑爆标签行）。版本 1.6.3。
- 2026-11-19：会话头仓库选择器改用自绘深色弹层（portal 到 body、fixed 定位、role=listbox/option、Esc/外部点击/resize 关闭），不再用原生 select（系统白底 + 浅色文字导致选项不可见）；版本 1.6.4。
- 2026-11-19：统一下载位置：新增 `src/tools-path.js`（默认根 `<DSH home>/compression-tiers`、绝对路径校验、两组件整体迁移、跨卷回退、下载中 409）与 `/compression-tiers/api/tools`；`src/gh.js` / `src/ffmpeg.js` 的首个参数由 DSH home 改为共享根目录（`<root>/gh`、`<root>/ffmpeg`，默认路径与 1.6.x 完全一致，升级不搬文件），设置页新增「下载位置」面板（迁移 / 恢复默认）。`settings.json` 新增 `toolsPath`。设置页删掉全部教学性说明段（页面 intro、档位点评、规则/GitHub/音视频面板说明、`ghToolNote`、`ghLoginNote`），相关规则写进本文件第 15 条；设备码复制 / 打开授权页 / 取消三个按钮改为常显（不可用时 `disabled` + `title` 说明），遵守第 16 条；版本 1.7.0。
- 2026-11-20：设置页按钮统一为一套标准（第 18 条）：新增 `actionButton()` / `actionRow()` 与 `ct-btn`、`ct-btn--primary` 样式，删掉旧的 `ct-save`；GitHub CLI 与音视频面板的「下载 / 重新检测」改成同一结构（状态行 → 进度 → 路径/错误 → 一行两个按钮，下载在左、重新检测在右），两个面板的下载控制都由 `downloadControl()` 计算状态与标签；按钮文案合并为共享键（`download*` / `probe` / `state*`），删掉 `ghDownload`、`ghProbe`、`toolsInstall`、`toolsProbe`、`toolsDownloading`、`toolsUnsupported`、`toolsLoading` 等按面板分裂的副本。测试增至 135 条（新增四个按钮一致性用例）；版本 1.7.1。
- 2026-11-21：**「音视频工具」改为「组件管理」**：GitHub CLI 下载、下载目录迁移与 ffmpeg 检测并进同一栏，并新增 git 与 Python 的托管下载。新增 `src/components.js`（钉住 MinGit `2.56.1` 与 python-build-standalone `3.11.18+20261110`；解压/暂存在 `<toolsPath>/.staging/<id>`，先 `--version` 自检再整棵树原子替换，失败回滚；PATH 前插 `git/cmd`、`python`、`python/Scripts`）与 `src/component-rows.js`（四行统一形状，作为设置页组件行的唯一来源）；新增 `GET/POST /compression-tiers/api/components`；`src/tools-path.js` 的 `TOOL_DIRS` 扩到四套组件，迁移与「下载中 409」覆盖全部四套，`toolsStatus` 改为 `components` 数组。设置页只留三栏（档位、全局规则、组件管理）加一个「GitHub 登录」，`GitHub CLI` 面板只剩账号/设备码/网络体检；删掉 `toolsTitle`、`toolsPathTitle`、`ghTitle`、`ghPathLabel`、`toolsLoadFailed`、`toolsActionFailed`、`toolsPathLoadFailed` 等旧键，`ghPathLabel` 由共享的 `pathLabel` 取代。规则补进第 16/17/18 条并新增第 19 条。测试增至 154 条（新增 `test/components.test.js`、`test/component-rows.test.js`，重写设置页用例）；版本 1.8.0。
- 2026-11-21：1.8.0 的观感修正：ffmpeg 一行固定列出 `ffmpeg` 与 `ffprobe` 两个二进制（缺哪个显示「未找到」，不再因整对缺失而省掉副行）；`downloadKeep` 文案由「仍要下载」改为「重新下载」（英文 `Download again`）；空的状态行/提示行（`ct-status` / `ct-note` 无内容）收起，档位与规则面板底部不再留约 30px 空白。测试增至 156 条；版本 1.8.1。
- 2026-11-21：组件行的多二进制不再重复报缺失：找到的二进制各占一行（来源/版本/路径），所有缺的合并成一行「ffmpeg / ffprobe　未找到」，不再在「未安装」下面再逐条写「未找到」。测试增至 157 条；版本 1.8.2。
- 2026-11-21：多二进制行的标题写成它覆盖的二进制（`ffmpeg / ffprobe`），两个都没装时只留「未安装」一行、不再补「未找到」——两者同义；只缺一个时保留该行（此时状态行是「未完成，可续传」，不同义）。版本 1.8.3。
- 2026-11-21：主动压缩让位于真人输入：`src/manual-compact.js` 的 `user/message` 分支不再只在「压缩正在跑」时记录，任何真人消息都会取消排队中的压缩并阻止续跑消息（已开始的压缩不中断，但结束后不注入续跑）；新增 `test/manual-compact.test.js`（7 条）并把该模块纳入验证要求。测试增至 164 条；版本 1.8.4。
- 2026-11-21：修复 `github_push` 必然崩溃：工具把 `githubSettings()`（只有 `github` 块）当成顶层 settings 去取 `sessionRepos[sessionId]`，任何会话都报 `Cannot read properties of undefined (reading 'session-…')`。新增 `src/push-flow.js` 的 `sessionTarget(settings, sessionId)` 作为绑定 → 目标的唯一换算（读顶层、缺 map 返回空串），工具与 `sessionRepoBinding` 共用，`test/push-flow.test.js` 补回归用例（含无 `sessionRepos` 的旧设置）。README 精简到 88 行。版本 1.8.5。
