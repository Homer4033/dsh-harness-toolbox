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

- 本仓库只负责五档上下文压缩、全局与工作区规则编辑、组件管理、发布流程与会话发布仓库：档位参数、左侧栏「压缩分档」面板（`sidebar.panellist` + `main`）、`compression_tiers` / `compression_context` / `compression_compact` / `github_push` 四个工具、把档位同步进预设隔离域的 `compaction-basic` 引擎、面板里对 `<DSH home>/AGENTS.md` 与已注册工作区 `AGENTS.md` 的读取与原子写入、四套托管组件（GitHub CLI / git / ffmpeg+ffprobe / Python）的 PATH 检测与托管下载、`gh` 的设备码登录与网络体检、`github_push` 的发布流程、输入框上方按会话绑定的在线仓库胶囊，以及四套托管文件共用的下载根目录与整体迁移。2.0.0 起还负责输入框上方那一行的光学层（上下文试管浮窗、像素伙伴）与外观页的三套设置（配色 / 动效 / 伙伴开关），以及四套运行期皮肤。
- 不负责：`dsh-compaction-basic` 本身的压缩算法、会话历史、摘要模型选择、官方 `/compact` 命令；不解析或改写规则内容，只把它当作文本原样保存；不实现 PR/检查/评审/工作树面板本身（官方 `dsh-experimental-forge-bundle` 负责），只保证它找得到已登录的 `gh`。
- 不实现上游 Obsidian Prism 的其余能力（推理等级滑块、切工水晶、思考过程转译、动静态壁纸、Omni 检视台等）：只移植试管核心与像素伙伴装配两份 UMD 模块，其余光学观感（外壳、配色、动效）是本插件自己按上游语言重画的。
- 不做仓库列表面板：1.4.x 的左侧栏「仓库」面板在 1.5.0 删除，1.5.1 又删掉设置页里的默认仓库与推送/建仓/查看动作；1.6.0 只增加按会话绑定的单个在线仓库选择器，1.9.0 把它从会话头移到输入框上方（`conversation.input.dock`）。多仓库场景由智能体在各自会话里调用 `github_push`，不要再加仓库列表或推送按钮。
- 不提供改写全局规则或工作区规则的智能体工具：高优先级契约只能由人在面板里保存。
- 不维护 `homerdsh-workbench` 的其它子系统（会话、GitHub、记忆、视频、投研终端）。

## 事实来源

- 当前策略：`<DSH home>/compression-tiers/settings.json`。引擎配置是派生态，可重建。
- 全局规则唯一来源：`<DSH home>/AGENTS.md`，由官方 `dsh-agent-instructions` 读取；本插件不复制、不缓存，删文件即等于没有规则。
- 工作区规则唯一来源：每个已注册工作区根目录的 `AGENTS.md`（工作区清单来自 `<DSH home>/storages/workspace.json` 的 `tables.workspaces`）；插件只读注册表、不写注册表，也不持有第二份规则文本。
- GitHub CLI 版本唯一来源：`src/gh.js` 的 `GH_VERSION`（当前 `2.76.2`）与官方 release URL；托管副本在 `<toolsPath>/gh`，登录凭据在 `gh` 自己的存储里，插件不读取。
- 下载位置唯一来源：`settings.json` 的 `toolsPath`（空 = `<DSH home>/compression-tiers`），由 `src/tools-path.js` 解析；`gh` 装 `<toolsPath>/gh`、git 装 `<toolsPath>/git`、ffmpeg 装 `<toolsPath>/ffmpeg`、Python 装 `<toolsPath>/python`。任何模块都不得再硬编码用户可见的安装目录。
- 档位参数唯一来源：`src/levels.js` 的 `COMPRESSION`；文档与界面不得写出与之不一致的比例。
- 发布目录选择唯一来源：`src/push-flow.js` 的 `resolvePushCwd`（显式路径 → 会话工作目录；没有配置项、没有兜底）；插件自己的检出目录不得作为工具默认值。
- 会话发布目标唯一来源：`settings.json` 的 `sessionRepos`（会话 id → `owner/name`）；`github_push` 把它变成 `https://github.com/<owner/name>.git` 作为 `pushFlow` 的 `target`，没有绑定则回落到 `github.remote`（初始 `origin`）。
- 音视频托管源唯一来源：`src/ffmpeg.js` 的 `SOURCES`（当前只有 Windows 的 `ffmpeg-release-essentials.zip`）；托管副本在 `<toolsPath>/ffmpeg/bin`，浮动 release 构建，钉住 URL 与安装后的自检。
- git / Python 托管源唯一来源：`src/components.js` 的 `COMPONENTS`（钉住 MinGit `2.56.1` 与 python-build-standalone `3.11.18+20261110`，资源文件名与版本同步）；托管副本在 `<toolsPath>/git`、`<toolsPath>/python`。
- 组件行唯一来源：`src/component-rows.js` 的 `COMPONENT_ORDER` 与四个 mapper（gh / git / ffmpeg / python → 统一行）。面板不得自行拼装某一个组件的状态、版本或路径，也不得再为单个组件加一套状态行。
- 运行时兼容声明：`package.json` 的 `engines.dsh`（当前 `>=0.2.2-rc.3 <0.3.0`），DSH 加载器据此拒绝不兼容版本。
- 官方阈值公式：`floor(min(W × thresholdRatio, W − O − 65,536))`，逐字保留 `(W − O) × retainRatio`。
- 外观取值域唯一来源：`src/store.js` 的 `APPEARANCE_PALETTES`（`host` / `obsidian` / `warm` / `crystal` / `alabaster`）、`APPEARANCE_MOTIONS`（`full` / `subtle` / `off`）与 `defaultAppearance()`（`host` / `full` / 伙伴开启）；面板、dock 行与试管都从这里取，不得另写一套。
- 移植模块唯一来源：`vendor/obsidian-prism/` 的两份 UMD（上游 `1.0.8-beta.1`），文件名集合由 `index.js` 与 `client.js` 的 `VENDOR_SCRIPTS` 共同限定；新增或删除文件必须两边同步并补 `test/vendor.test.js`。
- 许可与署名：`LICENSE`（GPL-3.0 全文）、`NOTICE`（衍生作品声明 + 上游 NOTICE 全文）、`THIRD_PARTY_NOTICES.md`（上游吸收的 MIT 项目）。三份文件不得删改署名段；两份 vendor 文件的出处头必须保留上游仓库、版权年份与修改日期。

## 工程约束

1. 不手工改已安装 profile 的 `package.json` / `cordis.patch.yml`；安装与启用通过 `plugin_manager`。把 `link:` 本地链接换成 registry / git 安装时，必须先让插件页移除该条目（它会清掉 `node_modules` 里的 Junction）；pnpm 不能用 rename 覆盖 Junction，会报 `ERR_PNPM_EPERM` 并把 profile 清单里的条目一起弄丢。删 Junction 只能用 `cmd /c rmdir <link>`，禁止递归删除。
2. 新增运行时文件必须同时更新 `package.json` 的 `files` 与 `exports`；locale、图标、详情文档保持在包内。
3. 不引入 Harness Client 包作为模块；面板只用主题 token 与自有控件。
4. 状态写入必须原子（临时文件 + rename）；手改坏的 JSON 回落到默认值，不得让插件崩溃。
5. 预设结构访问保持防御式：拿不到结构时放弃更新，保留官方默认。
6. 插件不写 `$DSH_HOME/cordis.patch.yml`，不改宿主平面上的 `compaction-basic` 行。
7. 文档内容冲突时优先级：AGENTS.md > README.md > locale 文案。
8. 全局规则面板只写 `<DSH home>/AGENTS.md`；工作区规则面板只写注册表里那个工作区根目录的 `AGENTS.md`（见第 21 条），不得读写未注册目录。两处写入都必须原子、去 BOM、CRLF 归一为 LF、保留单个结尾换行，超过 100,000 字符返回 413 而不是截断。
9. 系统提示只带规则的最新 2,000 字符摘要，不得整份注入或把摘要写回文件。
10. GitHub CLI 下载固定 `GH_VERSION` 与官方 release URL；解压后必须先跑 `--version` 探测暂存副本再原子替换，失败回滚旧二进制；只把托管 `bin` 目录插到本进程 PATH 最前，不改系统环境变量。
11. 登录只驱动 `gh auth login --web` 的设备码流程，不读取、不复制、不代存 `gh` 凭据；取消时结束子进程并丢弃会话状态。
12. ffmpeg / ffprobe 下载用 `SOURCES` 里的 URL 与 HTTP Range 续传；解压后必须先对暂存的两个二进制各跑一次 `-version`，再原子替换 `bin` 目录、失败回滚旧版本；只把托管 `bin` 目录插到本进程 PATH 最前，不写系统环境变量。托管源只有 Windows，其它平台只做 PATH 检测。
13. 会话发布仓库只允许改 `github_push` 的推送目标：不得因此克隆仓库、切换分支或改动会话工作区；绑定归一化必须是 `owner/name`，非法值丢弃，最多保留 200 条。
14. 会话发布仓库胶囊注册在官方 `conversation.input.dock`（id `compression-repo`，order 90）：这是输入框正上方的 full-width 槽，空会话也渲染（新会话的 `titleCluster` 被 `hideChrome` 隐藏，标题旁的动作不出现，1.6.2–1.8.x 的旧做法因此在新会话里无入口）。不得改标题、工作区选择器或其它官方 slot 的注册；不要把胶囊挂回 `conversation.session.header.actions`，也不要再 portal 到 `[data-conversation-tabs]`。胶囊在 dock 行内右对齐，且右缘必须落在输入卡右缘上——官方 `.composerStack` 是整宽列、输入卡自己按 `--dsh-composer-card-max-width` 居中，所以这一行要按 `min(calc(100% - 2 × --dsh-composer-side-clearance), --dsh-composer-card-max-width)` 收窄并 `margin: 0 auto`（1.9.x 的整宽行 + `padding: 0 var(--dsh-composer-side-clearance)` 只做到不贴窗口边，胶囊仍停在输入卡右侧很远），不得用负 margin 贴边。菜单用 `createPortal` 挂 body、`position: fixed`，默认**上拉**：按 `bottom` 定位（`bottom = viewportHeight - rect.top + gap`），`max-height` 取胶囊上方空间；上方不足 200px 且小于下方时才翻转成向下（`data-side='down'`）。菜单顶部有标题行，`不使用仓库` 与仓库列表之间有分隔线；键盘支持 ↑ / ↓ / Home / End / Enter / Esc。2.0.0 起这一行是两段：左段 `.ct-dock-mascots`（像素伙伴，220×84），右段 `.ct-dock-tools`（试管触发器 + 状态小字 `.ct-repo-note` + 胶囊，`margin-left: auto`）。`.ct-repo-dock` 自己带 `container-type: inline-size`，`@container (max-width: 620px)` 时收起伙伴——必须按**行宽**判断，不能用 `@media` 按窗口判断（窗口宽而输入卡窄时伙伴会压到胶囊上）；关掉伙伴时整块不渲染，工具区仍然右对齐，不留占位。
15. 面板只放控件标签、当前值、路径与错误信息。不写教学性说明段（面板介绍、原理、操作步骤、"为什么需要它"）：这类文字写进本文件或 README，界面上的 `intro` / `*Note` 一类键不再新增；旧键删除后不得加回。示例值只能作为输入框 `placeholder`，不能变成段落。
16. 所有动作按钮必须常显：条件不满足时渲染为 `disabled` 并用 `title`（或同一行的状态文本）说明原因，不得用条件渲染把按钮整个隐藏（弹层、菜单、进度条不在此列，它们不是动作按钮）。面板现有按钮——档位、规则保存、组件行下载/重新检测、`gh` 登录、设备码复制/打开授权页/取消、网络体检、下载目录迁移/恢复默认——都按这条执行；组件行在状态还没读到时也要渲染（显示「正在读取…」并置灰），不得整行消失。
17. 下载根目录规则：`toolsPath` 只接受绝对路径，非法或相对值回落默认（写库时归一化为空串）；迁移前先做完整预检（目标已有同名组件即拒绝、任一下载进行中返回 409），四套组件要么都搬、要么都不动；跨卷 `EXDEV` 退化为复制后删除；迁移成功才写 `toolsPath`，失败保留旧值以便重试；迁移后必须把本进程 PATH 里的旧目录（`gh/bin`、`git/cmd`、`ffmpeg/bin`、`python` 与 `python/Scripts`）换成新的。
18. 面板按钮只有一套标准：所有动作按钮经 `actionButton()` 渲染（基础类 `ct-btn`，主操作 `ct-btn--primary` 只加描边与底色，不改尺寸）；每个动作行经 `actionRow()` 渲染为 `ct-actions`，行内只放按钮、状态文字另起一行；按钮标签走共享键（`downloadIdle` / `downloadKeep` / `downloadContinue` / `downloadRetry` / `downloadRunning` / `downloadDone` / `downloadUnsupported`、`probe`、`stateMissing` / `statePartial` / `stateFailed` / `stateSystem`），禁止再出现 `ghDownload` / `toolsInstall` 这类按面板分裂的副本。四套组件行必须结构一致（名称与版本 → 状态行 → 进度 → 路径/错误 → 同一行两个按钮，下载在左、重新检测在右），都由 `downloadControl()` 算出状态与标签。
19. git / Python 的托管安装：下载用 `COMPONENTS` 里钉住的 URL 与 HTTP Range 续传；解压与暂存必须在 `<toolsPath>/.staging/<id>`（**不能**放在组件目录内，否则整棵树 rename 到 `<root>/<id>` 会踩父目录），先对暂存二进制跑一次 `--version`，通过后整棵树原子替换、失败回滚旧版本；只把 `git/cmd`、`python`、`python/Scripts` 插到本进程 PATH 最前，不写系统环境变量。托管源只有 Windows，其它平台只做 PATH 检测并报「当前系统不可用」。
20. 安装替换必须经 `src/swap.js` 的 `moveIntoPlace()`，不得直接 `renameSync` 到安装目录：Windows 在目录里有文件被占用（杀毒扫描刚写出的二进制、`-version` 子进程还没退干净）时把 rename 报成 `EPERM`，必须「重试退避 → 仍失败就复制过去」，否则用户看到的就是一次白下的安装失败。下载完成的归档文件（`<root>/<id>/download/<file>`）要复用，重试时先判断它是否已存在，存在就不再下载。
21. 工作区规则：清单唯一来源是 `<DSH home>/storages/workspace.json`（`global.workspaceIds` + `tables.workspaces`，由 `src/workspace-rules.js` 读取）。只允许编辑清单内且 `path` 为绝对路径的工作区；客户端传任意路径一律不接受，id 不在清单返回 404；同一目录只出现一次，最多 50 个。写入走 `normalizeRulesText` 与原子写入。**工作区页始终在导航里**：清单为空时页面照常显示并写「目前无工作区」（不出选择器与文本域），保存按钮常显、置灰并用 `title` 说明原因；还没读到时写「正在读取…」。1.9–1.10.1 的「清单为空就不渲染、连导航项一起消失」已作废。插件不改注册表，也不缓存第二份规则文本。
22. 面板与弹层遵守 [docs/UI.md](docs/UI.md)：面板是**液体玻璃外壳 + 左侧分页导航**——`.ct-page` 是滚动容器、玻璃画布与容器查询的容器（`container-type: inline-size`，不能放在 `.ct-shell` 上，元素不会被自己的容器查询命中），`.ct-shell` 为 `196px minmax(0,1fr)` 栅格、最大 980px，左列 `.ct-nav`（6 个分页：档位 / 规则 / 工作区 / 组件 / 外观 / GitHub，`aria-current='page'`），右列 `.ct-content` 一次只渲染一页（导航栏 `position: sticky; top: 0`——正的 `top` 会在静止状态把它推离第一张卡片，实测 18px 时差 10–18px；`.ct-page` 带 `scrollbar-gutter: stable`，否则长短页切换时出现/消失的滚动条会让居中外壳横向位移；分页进场只淡入，不位移不缩放）；面板宽度 ≤720px 时导航栏变横向条并**换行**（不得用 `overflow-x` 横滚，被裁掉的页面等于没有入口）。卡片 20px 圆角、共用 `.ct-page` 上的玻璃变量（`--ct-glass-fill` / `-rail` / `-sheen` / `-edge` / `-shadow` / `-inner`）+ 三段结构（标题行 → 内容 → 动作行）；导航栏比卡片低一层（layer-2 混合）。下拉与菜单一律自绘（`Select` 组件 + `.ct-menu`：portal 到 body、`placeMenu()` 定位、`data-side` 决定上拉/翻下、↑ / ↓ / Home / End / Enter / Esc 与 `aria-activedescendant`），不得再出现原生 `<select>`（系统弹层是浅底 + 继承来的浅字）。弹层表面用 `--dsw-alias-bg-layer-3` 加玻璃与阴影，**不得**用 layer-2（那是卡片色，菜单会读成浮着的一行文字）；accent 只做 12–20% 淡染与 2px 竖条。GitHub 页用一行 `.ct-scopes` 显示 `gh auth status` 报出的 token scope（缺 `repo` 时另给一条 alert 状态），插件不读、不存 token 本身；不另设许可页（1.10.1 已删除）。改控件先改规范，再改样式。
23. 光学层（2.0.0）：
    - **移植模块只走同源脚本**：`vial-core.js` / `dual-mascot-rig.js` 由 `GET /compression-tiers/vendor/<name>` 提供（白名单只放这两个名字、`text/javascript; charset=utf-8`、`cache-control: public, max-age=3600`），客户端用普通 `<script src="…?v=<PLUGIN_VERSION>">` 加载。`client.js` 不得 `import` 它们，也不得把 UMD 内容复制进来；宿主侧与客户端各有一份 `VENDOR_SCRIPTS`，增删要两边同步。
    - **配色只写在 `.ct-skin[data-palette='…']` 上**（面板页、dock 行、portal 菜单、试管浮窗），禁止写 `:root` / `body`；`host` 是空集，浅色两套必须同时设 `color-scheme: light`，四套都要给全量 token（含 `--dsw-alias-chart-*` 与玻璃变量）。
    - **数字只能来自官方投影**：`useProjection('contextPressure')` 与 `useProjection('contextBreakdown')`；取不到就渲染「—」并禁用触发器，不许用 0 或估算值冒充。阈值与保留量按「事实来源」里的官方阈值公式算。
    - **外观写入走一个字段**：`POST /compression-tiers/api/settings` 的 `appearance`，服务端用 `normalizeAppearance()` 归一回默认、非法值 400；客户端乐观更新，失败必须回滚并写 `.ct-status`。
    - **伙伴默认开启但必须可关**：关掉后不渲染 `.ct-dock-mascots`、不留占位；动效 `off` 必须把 `reducedMotion` 传给试管与伙伴。移植模块加载失败时舞台整块收起（`data-state='failed'`），不得留空白框。

## 验证要求

- 改动后运行 `npm test`；新增档位、路由或同步逻辑必须补 `node:test` 用例。
- 修改 `src/rules.js`、`/compression-tiers/api/rules` 或面板的全局规则区块后，必须让 `test/rules.test.js` 与 `test/client.test.js` 覆盖读取、归一化、413、摘要与面板状态。
- 修改 `src/workspace-rules.js`、`/compression-tiers/api/workspace-rules` 或面板的工作区规则区块后，必须让 `test/workspace-rules.test.js` 覆盖清单顺序与过滤（相对路径、重复目录、50 条上限）、BOM 与 CRLF 归一化、未注册 id 404、超限 413 不落盘、原子写入；`test/client.test.js` 覆盖工作区选择、脏态才可保存，以及清单为空时页面仍在导航里、写「目前无工作区」、保存按钮置灰且 `title` 说明（未加载时写「正在读取…」）。
- 修改 `src/gh.js`、`/compression-tiers/api/github` 或 GitHub CLI 面板后，`test/gh.test.js` 必须覆盖状态、断点续传、416 重启、**自动重试**（掉线重试并从 `.part` 续传、4xx 不重试、`aborted` 不重试、重试预算用尽后报出次数）、PATH 前插与设备码解析；真实下载/安装只在临时 home 验证，不写用户 DSH home。
- 修改 `src/publish.js` 或 `/compression-tiers/api/github/network` 后，`test/publish.test.js` 必须覆盖代理归一化与优先级、GitHub 连通判定（直连 / 代理 / 代理不通 / 全断）、失败分类、push 的代理注入与超时终止、仓库快照、建仓确认与密钥扫描。
- 修改 `src/push-flow.js` 或 `github_push` 工具后，`test/push-flow.test.js` 必须覆盖目录选择（显式 → 会话，无兜底）、不可用路径早退、密钥拦截与 `force` 放行、失败分类与报告文案；发布只能有 `github_push` 一个入口，不要再往面板加推送按钮。会话绑定生效时还必须覆盖 `target` 作为远端、不再取仓库快照、以及拒绝推送时仍报告 `target`。
- 修改 `src/ffmpeg.js` 或 `/compression-tiers/api/ffmpeg` 后，`test/ffmpeg.test.js` 必须覆盖托管源选择、`-version` 解析、PATH 检测与托管优先、状态（missing / partial / installed）与 PATH 前插；真实下载只在临时 home 验证，不写用户 DSH home。
- 修改 `src/manual-compact.js`（主动压缩队列）后，`test/manual-compact.test.js` 必须覆盖：排队后 `turn/end` 才压缩并注入一次续跑、重复请求被拒、`aborted` 丢弃、**真人消息优先**（结束前发言取消排队任务、压缩中发言只取消续跑）、宿主已按阈值压缩时不重复压缩但仍续跑。真人发言不得被压缩流程吞掉，也不得被续跑消息抢先回答。
- 修改会话发布仓库（`sessionRepos`、`/api/github/online`、`/api/github/binding`）后，`test/gh.test.js` 覆盖仓库行解析与 `gh` 缺失分类，`test/store.test.js` 覆盖 `owner/name` 归一化与 200 条上限，`test/client.test.js` 覆盖 `conversation.input.dock` 的注册、选项与状态提示，以及上拉定位（`up` 时用 `bottom` 与 `data-side='up'`、空间不足时 `data-side='down'`）、活动项高亮与 `aria-activedescendant`、标题行 + 分隔线顺序。
- 修改 `src/http.js` 的 `queryParam` 后，`test/http.test.js` 必须覆盖缺参、空值与非字符串请求。
- 修改 `src/tools-path.js`、`/compression-tiers/api/tools` 或面板的下载目录区块后，`test/tools-path.test.js` 必须覆盖默认根、绝对路径校验、四套组件整体迁移、目标已存在时预检拒绝、任一下载进行中 409、跨卷 `EXDEV` 回退与「搬一半后重试」；`test/store.test.js` 覆盖 `toolsPath` 归一化，`test/client.test.js` 覆盖迁移与恢复默认按钮的禁用态。
- 修改 `src/swap.js`（安装树替换）后，`test/swap.test.js` 必须覆盖首试成功、锁重试后成功、锁不释放退化为复制、不可重试错误（`ENOENT`）早退、跨卷 `EXDEV` 直接复制；`src/gh.js` / `src/ffmpeg.js` / `src/components.js` 里到安装目录的移动必须走 `moveIntoPlace`，不得留裸 `renameSync`。
- 修改 src/components.js、/compression-tiers/api/components 或某一行组件后，`test/components.test.js` 必须覆盖钉住的 URL 与资源文件名（含 Python 的 `%2B`）、版本解析、PATH 检测、状态（missing / partial / installed / system）、PATH 前插去重与未知组件/无托管构建的早退；`test/component-rows.test.js` 覆盖四行顺序与 state → ready/managed/system/running 映射；`test/client.test.js` 覆盖四行的按钮一致性。
- 修改面板文案或按钮后，`test/client.test.js` 必须覆盖：动作按钮常显（含设备码复制 / 打开授权页 / 取消在空闲时仍渲染且 `disabled`、组件行在状态未到时仍渲染）、说明段键已删除（`intro`、`ghToolNote` 等不得回到字典里）、空状态行收起（`.ct-status:empty` / `.ct-note:empty` 不占位、面板底部不留白），以及四套组件行的按钮一致性（同样的类名、同样的标签键、同样的禁用态、同样的一行顺序）；按面板分裂的标签键（`ghDownload`、`toolsInstall` 等）与已合并的旧面板键（`toolsTitle`、`toolsPathTitle`、`ghTitle`、`ghPathLabel`）都不得回归。
- 修改面板布局、控件或弹层（`client.js` 的 `CSS` / `Page` / `Select` / `RepoBinding`）后，`test/client.test.js` 必须覆盖：外壳栅格与分页（`.ct-shell` 的 `196px minmax(0,1fr)`、`.ct-nav` 与 `.ct-nav-item[aria-current='page']`、一次只渲染一页、六个分页始终都在导航里）、`container-type` 在 `.ct-page` 上而**不在** `.ct-shell` 上（元素不会被自己的容器查询命中）、窄面板导航换行（`@container (max-width: 720px)` + `flex-wrap: wrap`）、玻璃变量与 20px 卡片圆角、GitHub 页的授权范围行（`.ct-scopes` 有 scope 时渲染、未登录或没有 `gh` 时不渲染）、工作区页在清单为空时仍在导航里并写「目前无工作区」（保存按钮置灰）、卡片与弹层类名（`.ct-menu` / `.ct-menu-head` / `.ct-menu-option`，旧 `.ct-repo-menu` / `.ct-repo-option` 不得回归）、自绘下拉（触发器 `aria-haspopup` / `aria-expanded`、portal 菜单 `role=listbox`、选项 id 与选中态、活动项高亮、`aria-activedescendant`）、页面上没有原生 `select`、胶囊 dock 行按 `--dsh-composer-card-max-width` 收窄并 `margin: 0 auto`，**导航栏 `sticky` 的 `top` 为 `0`**（正的 `top` 会让导航栏离第一张卡片一个偏移）、**`.ct-page` 带 `scrollbar-gutter: stable`**（否则长短页切换时居中的外壳横向挪动）、**分页进场只有透明度没有位移/缩放**，以及上拉定位与翻向仍按 `data-side` / `bottom` 决定；同时确认 [docs/UI.md](docs/UI.md) 与实现一致（表面层级、类名映射、焦点环、禁用态）。
- 修改外观设置、移植模块、试管、像素伙伴或 dock 行的布局后：`test/store.test.js` 覆盖 `appearance` 的默认值、归一化与持久化；`test/vendor.test.js` 覆盖两份 UMD 的装载、出处头、GPL 文件、vendor 路由白名单与 manifest；`test/client.test.js` 覆盖外观页三组控件（色板 / 分段 / 伙伴开关、乐观写入与失败回滚）、试管浮窗（百分比、五条数字、三段构成与图例、投影缺失写「—」且触发器 `disabled`、Esc 关闭与焦点归还）、伙伴挂载与 `reducedMotion`、`.ct-repo-dock` 的 `container-type` 与 `@container (max-width: 620px)` 收伙伴；并确认 [docs/UI.md](docs/UI.md) 的「配色皮肤」「外观页」「输入框上方那一行」「动效」四节与实现一致。
- 发布前运行 `npm run check:secrets`；新增运行时文件、改 `package.json` 的 `files` 或版本号后同步 `CHANGELOG.md` 并按版本打 tag（`vX.Y.Z`）。
- 修改 manifest、locale、图标或 `client.js` 注册方式后，检查 `test/manifest.test.js` 全绿。
- 安装验证以插件页的 `application` 结果与新会话中的工具/设置为准，不以下载或日志推断成功。
- 无法在浏览器中确认的视觉效果，交付时明确写"渲染未验证"。

## 文档索引

- [README.md](README.md)：安装、使用、档位表、工具、光学层（试管 / 伙伴 / 配色）、原理、限制、许可与版本。
- [CHANGELOG.md](CHANGELOG.md)：按版本记录变更与 tag。
- [LICENSE](LICENSE)、[NOTICE](NOTICE)、[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：GPL-3.0 全文、衍生作品署名与修改说明、上游及其吸收项目的完整声明。
- [scripts/check-secrets.mjs](scripts/check-secrets.mjs)：`npm run check:secrets`，CI 与本地共用的密钥扫描入口。
- [docs/DETAIL.md](docs/DETAIL.md)：插件详情页（英文，单图）。
- [docs/DETAIL.zh.md](docs/DETAIL.zh.md)：插件详情页（中文，单图）。
- [docs/UI.md](docs/UI.md)：面板、外观页、输入框上方那一行与自绘弹层的 UI 规范（表面层级、配色皮肤、栅格、卡片、下拉、动效、检查清单）。
- [docs/screenshots/](docs/screenshots/)：README 与详情页用的截图（离线渲染舞台产物，示例内容为虚构）。
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
- 2026-11-21：会话头仓库胶囊观感修正：胶囊挪到 View 标签行、紧跟标签之后（去掉 `margin-left: auto`），`margin-top: -4px` 让胶囊与标签文字基线对齐；胶囊 26→24px，展开时箭头旋转 180°，菜单加标题行与分隔线、选项 32px。版本 1.8.6。
- 2026-11-22：组件下载失败自动重试：`downloadWithResume` 增加 `retries=3`（指数退避）、`onRetry` 钩子与可被 `abort` 打断的等待；每次尝试从磁盘重读 `.part` 大小，天然续传。只重试网络错误与 `RETRYABLE_STATUS`；`aborted` 与 4xx 立即失败；预算用尽时在错误里报出尝试次数。`test/gh.test.js` 覆盖掉线续传、404 不重试、`aborted` 不重试与预算用尽。版本 1.8.7。
- 2026-11-22：修复 Windows 安装 `EPERM`：新增 `src/swap.js` 的 `moveIntoPlace()`（rename 重试 7 次指数退避，仍失败退化为复制；`EXDEV` 直接复制），gh / ffmpeg / git / Python 的落位全部改走它并保留回滚；已下载完成的归档在重试时复用，不再白下第二次。新增 `test/swap.test.js`（6 条）与第 20 条。版本 1.8.8。
- 2026-11-24：插件说明按官方体例重写：显示名 `上下文压缩分档` → **`压缩分档与工具箱`**，`meta.description` 收成「一句话 + 准确 UI 文案 + 限制 + 数据流向 + 关掉后的变化」，中文 438 字 / 英文 971 字符（插件列表只显示一行）；`package.json` 的 description 与 keywords 同步。版本 1.8.9、1.8.10。
- 2026-11-25：**1.9.0 UI 改造**：设置页搬进左侧栏——删除 `settings.section`，改为 `sidebar.panellist`（id `compression-tiers`，order 47，label 与图标）+ `main` 面板，页面自身成为滚动容器（`.ct-page` / `.ct-page-inner`），`package.json` 的 `dsh.client.inject` 换成 layout / sidebar / conversation 三个官方包。新增**工作区规则**：`src/workspace-rules.js` 读工作区注册表、校验后原子写各工作区根目录的 `AGENTS.md`，新增 `GET/POST /compression-tiers/api/workspace-rules`；注册表为空时整块不渲染。会话发布仓库胶囊从 `conversation.session.header.actions` 移到 `conversation.input.dock`（空会话也渲染、输入框正上方、右对齐），菜单改为默认上拉（`bottom` 定位 + 上方空间 `max-height`，上方不足时翻成 `data-side='down'`），并重做观感（14px 圆角、分组标题、32px 选项、活动项高亮、130ms 进场）与键盘操作（↑/↓/Home/End/Enter/Esc，`aria-activedescendant`）；新增 `test/workspace-rules.test.js`（8 条）与上拉/翻向/高亮用例，测试 188 条；版本 1.9.0。
- 2026-11-25：**1.9.1 观感与 UI 规范**：新增 [docs/UI.md](docs/UI.md)（表面层级、间距刻度、960px 两栏栅格、卡片三段结构、自绘下拉规范、动效与禁止项）并把面板排成两栏——`.ct-page-inner` 760→960px、`.ct-columns` 按面板自身宽度两列（容器查询 `@container (min-width: 880px)`，更窄单列），左列档位 + 全局规则、右列工作区规则 + 组件管理 + GitHub 登录；档位按钮的两个比例拆成两行，半宽卡里不再被挤成三行。工作区下拉不再用原生 `<select>`（深色主题下系统弹层是浅底 + 继承来的浅字，选项不可见），改为自绘 `Select`：触发器按钮 + portal 到 body 的 listbox，↑/↓/Home/End/Enter/Esc、外部点击、resize、`aria-activedescendant` 全部与仓库菜单共用 `placeMenu` / `useMenuDismiss` / `useMenuFocus` / `menuMove`。仓库上拉菜单重做：layer-3 玻璃表面（layer-2 与卡片同色，菜单读起来像浮着的文字）、accent 混合描边与光晕、16px 圆角、顶部高光、分组标题前的 2px accent 竖条、34px 选项、accent 淡染 hover/选中 + 选中行左侧竖条、右对齐触发器的菜单也右对齐（`align: 'end'`）。测试 190 条（新增两栏结构与自绘下拉用例）；版本 1.9.1。
- 2026-11-25：**1.10.0 面板外壳与许可页**：面板从「一条长滚动 + 两栏拼贴」改成**液体玻璃外壳 + 左侧分页导航**——`.ct-shell` 是 `196px minmax(0,1fr)` 栅格、最大 980px，左列 `.ct-nav` 六个分页（档位 / 规则 / 工作区 / 组件 / GitHub / 许可，`aria-current='page'`），右列 `.ct-content` 一次渲染一页（`key` 切换触发 160ms `ct-page-in` 进场）；新增 `SECTIONS` 常量作为分页顺序的唯一来源，没注册工作区时「工作区」页连同导航项一起消失。玻璃配方（`--ct-glass-fill/-rail/-sheen/-edge/-shadow/-inner`）统一在 `.ct-page` 上定义，卡片圆角 16→20px，`.ct-page` 用三段 accent 径向渐变作画布。窄面板（`@container (max-width: 720px)`）导航栏变横向条并**换行**。**修正容器查询写错位置**：`container-type: inline-size` 原先放在 `.ct-shell` 上，而元素不会被自己的容器查询命中，于是外壳留在两栏、只有导航项被改成横向并被裁在 196px 里；现在容器是 `.ct-page`，`.ct-shell` 只做栅格。新增**许可页**：`PLUGIN_LICENSE` + `LICENSE_ROWS`（本插件 MIT，托管组件 GitHub CLI MIT / MinGit GPL-2.0 / FFmpeg GPL-2.0-or-later / python-build-standalone PSF-2.0 · MIT，各自全文链接），说明只写许可事实。仓库胶囊改用官方输入卡几何：`.ct-repo-dock` 按 `min(calc(100% - 2 × --dsh-composer-side-clearance), --dsh-composer-card-max-width)` 收窄并 `margin: 0 auto`，胶囊右缘与输入卡右缘对齐（1.9.x 的整宽行把胶囊停在了窗口最右）。`container-type` 改由 `.ct-page` 承担，测试 191 条（改断言：容器在页面、窄面板换行、分页骨架、许可页）；版本 1.10.0。
- 2026-11-25：**1.10.1 删掉许可页，改为 GitHub 授权范围**：1.10.0 理解的「许可」是软件许可（MIT / GPL / PSF），实际要的是 GitHub 的授权范围。删除许可页（`PLUGIN_LICENSE` / `LICENSE_ROWS` 常量、`licensePanel`、`.ct-license*` 样式、`navLicense` / `licenseTitle` / `licenseOwn` / `licenseComponentsTitle` / `licenseNotice` 五个字典键），导航回到五个分页；GitHub 页新增 `.ct-scopes` 一行显示 `gh auth status` 报出的 token scope（无 scope 写「未报告」，未登录或没有 `gh` 时不渲染，缺 `repo` 仍给 alert），仓库胶囊与玻璃外壳不变。测试仍 191 条（许可页用例换成授权范围用例 + 两处不得回归断言）；版本 1.10.1。
- 2026-11-25：**1.10.2 工作区页常驻**：面板是「导航 + 一次一页」，工作区页在没有注册工作区时原本整页消失（1.9.0 起的「清单为空就整块不渲染」，连带把导航项也摘掉）。现在五个分页始终都在导航里：清单为空时工作区页照常打开并写「目前无工作区」，不出选择器与文本域，保存按钮常显、置灰、用 `title` 说明原因；还没读到时写「正在读取…」而不是误报没有工作区（`applyWorkspaceRules` 现在把空清单也当成已加载状态，`workspaceRules` 不再用 null 表示空）。新增 `workspaceNone` 文案键。测试 192 条（新增空清单页与未加载状态两条用例，导航断言改成五页恒定）；第 21 条与验证要求同步，1.9.0 的「整块不渲染」作废。
- 2026-11-25：**1.10.3 导航栏对齐与切页位移**：1.10.2 的截图暴露出两处不动点被破坏——`.ct-nav` 的 `sticky; top: 18px` 会在**静止状态**把导航栏相对滚动口往下推（1400×792 实测：档位页比第一张卡片低 13px、规则页低 18px），于是每次切页都像整页挪了一下；`.ct-page` 又是 `overflow-y: auto` 且没有固定滚动条槽，短页没有滚动条、长页有，内容盒窄 15px，居中的 `.ct-shell` 跟着横向位移；再叠上 `ct-page-in` 的 `translateY(3px)`。现在导航栏 `top: 0`（静止时与第一张卡片同在 `padding-top` 22px，实测差值 0，滚动时也不跳）、`.ct-page` 加 `scrollbar-gutter: stable`（五页实测 `shellLeft` 恒为 318.5、`gutter` 恒为 15）、分页进场只留 160ms 淡入。第 22 条、验证要求、[docs/UI.md](docs/UI.md)（布局、分页导航、动效、禁止项、检查清单）同步。测试 192 条（新增导航栏 `top` 与滚动条槽断言，`ct-page-in` 断言不得出现 `transform`）；版本 1.10.3。
- 2026-11-25：**2.0.0 移植 Obsidian Prism 光学层**：用户要求把 [obsidian-prism](https://github.com/RMvdesi/obsidian-prism) 的做法合进本插件并按它的 README 体例重写说明。范围取「试管 + 像素伙伴 + 主题预设」：新增 `vendor/obsidian-prism/`（上游 `1.0.8-beta.1` 的 `vial-core.js` 与 `dual-mascot-rig.js`，逐字移植 + 出处头）、同源 `GET /compression-tiers/vendor/<name>` 路由（白名单只有这两个文件）、`.ct-dock-mascots` + `.ct-dock-tools` 两段式 dock 行、`ContextVial`（26px 触发器 + 上拉浮窗，96×220 canvas + 五条数字 + 三段构成）、`MascotStage`（`'minis'` 编队）、外观页（5 套配色 / 3 档动效 / 伙伴开关，乐观写入 + 失败回滚）与 `.ct-skin[data-palette|data-motion]` 皮肤；`src/store.js` 增加 `APPEARANCE_*` 与 `normalizeAppearance()`，导航从五页变六页。**许可证整包改为 `GPL-3.0-only`**：`LICENSE` 换成 GPL-3.0 全文，新增 `NOTICE`（衍生声明 + 上游 NOTICE）与 `THIRD_PARTY_NOTICES.md`；`package.json` 的 `license` / `files` / `exports` / `version` 同步，MIT 时代（≤1.10.3）结束。测试 192 → 205 条（新增 `test/vendor.test.js`、`appearance` 归一化、外观页 / 试管 / 伙伴用例）。README 按上游体例重写并新增 `docs/screenshots/` 五张截图，`docs/DETAIL*.md` 单图换成 `screenshots/hero.png`（删除 `docs/preview.svg`），[docs/UI.md](docs/UI.md) 增补配色皮肤 / 外观页 / 输入框上方那一行 / 动效档位四节。范围、事实来源、第 14/22 条与第 23 条、验证要求、文档索引同步；版本 2.0.0。
