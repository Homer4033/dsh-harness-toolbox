# 变更记录归档（1.0 – 2.3.0）

> AGENTS.md 的「变更记录」只保留最近几个版本；更早的历史在这里逐条保留，格式与原文一致。

## 目录

- [2026-11](#2026-11)

## 2026-11

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

- 2026-11-25：**1.9.1 观感与 UI 规范**：新增 [docs/UI.md](UI.md)（表面层级、间距刻度、960px 两栏栅格、卡片三段结构、自绘下拉规范、动效与禁止项）并把面板排成两栏——`.ct-page-inner` 760→960px、`.ct-columns` 按面板自身宽度两列（容器查询 `@container (min-width: 880px)`，更窄单列），左列档位 + 全局规则、右列工作区规则 + 组件管理 + GitHub 登录；档位按钮的两个比例拆成两行，半宽卡里不再被挤成三行。工作区下拉不再用原生 `<select>`（深色主题下系统弹层是浅底 + 继承来的浅字，选项不可见），改为自绘 `Select`：触发器按钮 + portal 到 body 的 listbox，↑/↓/Home/End/Enter/Esc、外部点击、resize、`aria-activedescendant` 全部与仓库菜单共用 `placeMenu` / `useMenuDismiss` / `useMenuFocus` / `menuMove`。仓库上拉菜单重做：layer-3 玻璃表面（layer-2 与卡片同色，菜单读起来像浮着的文字）、accent 混合描边与光晕、16px 圆角、顶部高光、分组标题前的 2px accent 竖条、34px 选项、accent 淡染 hover/选中 + 选中行左侧竖条、右对齐触发器的菜单也右对齐（`align: 'end'`）。测试 190 条（新增两栏结构与自绘下拉用例）；版本 1.9.1。

- 2026-11-25：**1.10.0 面板外壳与许可页**：面板从「一条长滚动 + 两栏拼贴」改成**液体玻璃外壳 + 左侧分页导航**——`.ct-shell` 是 `196px minmax(0,1fr)` 栅格、最大 980px，左列 `.ct-nav` 六个分页（档位 / 规则 / 工作区 / 组件 / GitHub / 许可，`aria-current='page'`），右列 `.ct-content` 一次渲染一页（`key` 切换触发 160ms `ct-page-in` 进场）；新增 `SECTIONS` 常量作为分页顺序的唯一来源，没注册工作区时「工作区」页连同导航项一起消失。玻璃配方（`--ct-glass-fill/-rail/-sheen/-edge/-shadow/-inner`）统一在 `.ct-page` 上定义，卡片圆角 16→20px，`.ct-page` 用三段 accent 径向渐变作画布。窄面板（`@container (max-width: 720px)`）导航栏变横向条并**换行**。**修正容器查询写错位置**：`container-type: inline-size` 原先放在 `.ct-shell` 上，而元素不会被自己的容器查询命中，于是外壳留在两栏、只有导航项被改成横向并被裁在 196px 里；现在容器是 `.ct-page`，`.ct-shell` 只做栅格。新增**许可页**：`PLUGIN_LICENSE` + `LICENSE_ROWS`（本插件 MIT，托管组件 GitHub CLI MIT / MinGit GPL-2.0 / FFmpeg GPL-2.0-or-later / python-build-standalone PSF-2.0 · MIT，各自全文链接），说明只写许可事实。仓库胶囊改用官方输入卡几何：`.ct-repo-dock` 按 `min(calc(100% - 2 × --dsh-composer-side-clearance), --dsh-composer-card-max-width)` 收窄并 `margin: 0 auto`，胶囊右缘与输入卡右缘对齐（1.9.x 的整宽行把胶囊停在了窗口最右）。`container-type` 改由 `.ct-page` 承担，测试 191 条（改断言：容器在页面、窄面板换行、分页骨架、许可页）；版本 1.10.0。

- 2026-11-25：**1.10.1 删掉许可页，改为 GitHub 授权范围**：1.10.0 理解的「许可」是软件许可（MIT / GPL / PSF），实际要的是 GitHub 的授权范围。删除许可页（`PLUGIN_LICENSE` / `LICENSE_ROWS` 常量、`licensePanel`、`.ct-license*` 样式、`navLicense` / `licenseTitle` / `licenseOwn` / `licenseComponentsTitle` / `licenseNotice` 五个字典键），导航回到五个分页；GitHub 页新增 `.ct-scopes` 一行显示 `gh auth status` 报出的 token scope（无 scope 写「未报告」，未登录或没有 `gh` 时不渲染，缺 `repo` 仍给 alert），仓库胶囊与玻璃外壳不变。测试仍 191 条（许可页用例换成授权范围用例 + 两处不得回归断言）；版本 1.10.1。

- 2026-11-25：**1.10.2 工作区页常驻**：面板是「导航 + 一次一页」，工作区页在没有注册工作区时原本整页消失（1.9.0 起的「清单为空就整块不渲染」，连带把导航项也摘掉）。现在五个分页始终都在导航里：清单为空时工作区页照常打开并写「目前无工作区」，不出选择器与文本域，保存按钮常显、置灰、用 `title` 说明原因；还没读到时写「正在读取…」而不是误报没有工作区（`applyWorkspaceRules` 现在把空清单也当成已加载状态，`workspaceRules` 不再用 null 表示空）。新增 `workspaceNone` 文案键。测试 192 条（新增空清单页与未加载状态两条用例，导航断言改成五页恒定）；第 21 条与验证要求同步，1.9.0 的「整块不渲染」作废。

- 2026-11-25：**1.10.3 导航栏对齐与切页位移**：1.10.2 的截图暴露出两处不动点被破坏——`.ct-nav` 的 `sticky; top: 18px` 会在**静止状态**把导航栏相对滚动口往下推（1400×792 实测：档位页比第一张卡片低 13px、规则页低 18px），于是每次切页都像整页挪了一下；`.ct-page` 又是 `overflow-y: auto` 且没有固定滚动条槽，短页没有滚动条、长页有，内容盒窄 15px，居中的 `.ct-shell` 跟着横向位移；再叠上 `ct-page-in` 的 `translateY(3px)`。现在导航栏 `top: 0`（静止时与第一张卡片同在 `padding-top` 22px，实测差值 0，滚动时也不跳）、`.ct-page` 加 `scrollbar-gutter: stable`（五页实测 `shellLeft` 恒为 318.5、`gutter` 恒为 15）、分页进场只留 160ms 淡入。第 22 条、验证要求、[docs/UI.md](UI.md)（布局、分页导航、动效、禁止项、检查清单）同步。测试 192 条（新增导航栏 `top` 与滚动条槽断言，`ct-page-in` 断言不得出现 `transform`）；版本 1.10.3。

- 2026-11-25：**2.0.0 移植 Obsidian Prism 光学层**：用户要求把 [obsidian-prism](https://github.com/RMvdesi/obsidian-prism) 的做法合进本插件并按它的 README 体例重写说明。范围取「试管 + 像素伙伴 + 主题预设」：新增 `vendor/obsidian-prism/`（上游 `1.0.8-beta.1` 的 `vial-core.js` 与 `dual-mascot-rig.js`，逐字移植 + 出处头）、同源 `GET /compression-tiers/vendor/<name>` 路由（白名单只有这两个文件）、`.ct-dock-mascots` + `.ct-dock-tools` 两段式 dock 行、`ContextVial`（26px 触发器 + 上拉浮窗，96×220 canvas + 五条数字 + 三段构成）、`MascotStage`（`'minis'` 编队）、外观页（5 套配色 / 3 档动效 / 伙伴开关，乐观写入 + 失败回滚）与 `.ct-skin[data-palette|data-motion]` 皮肤；`src/store.js` 增加 `APPEARANCE_*` 与 `normalizeAppearance()`，导航从五页变六页。**许可证整包改为 `GPL-3.0-only`**：`LICENSE` 换成 GPL-3.0 全文，新增 `NOTICE`（衍生声明 + 上游 NOTICE）与 `THIRD_PARTY_NOTICES.md`；`package.json` 的 `license` / `files` / `exports` / `version` 同步，MIT 时代（≤1.10.3）结束。测试 192 → 205 条（新增 `test/vendor.test.js`、`appearance` 归一化、外观页 / 试管 / 伙伴用例）。README 按上游体例重写并新增 `docs/screenshots/` 五张截图，`docs/DETAIL*.md` 单图换成 `screenshots/hero.png`（删除 `docs/preview.svg`），[docs/UI.md](UI.md) 增补配色皮肤 / 外观页 / 输入框上方那一行 / 动效档位四节。范围、事实来源、第 14/22 条与第 23 条、验证要求、文档索引同步；版本 2.0.0。

- 2026-11-25：**2.2.0 两套跟随宿主的配色 + 推理滑块 / 切工水晶**。用户要求配色只留「深空黑曜 / 白昼冷晶」并跟随 DSH 自己的深浅，并要求把参考插件 [`dsh-codex-effort-slider`](https://github.com/Microqian2th/dsh-codex-effort-slider) 的推理滑块与切工水晶移植进来。配色：`APPEARANCE_PALETTES` 收成 `host` / `obsidian` / `crystal`，`LEGACY_PALETTES` 把 2.0.0 的 `warm` / `alabaster` 按冷暖性格迁移（客户端保留同表）；皮肤表简化成一条结构色阶 + `SKIN_TINTS`（黑曜 = 原色阶靛蓝 accent，冷晶 = 同色阶压冷、冰青 accent），`skinSpec()` 只产出 `{ light, dark }` 成对值、不再带 `mode`；**删除 `setHostScheme()` 与 `theme.setTheme()` 写入**——选配色不再改用户的外观偏好；`.ct-skin` 每套写两段（默认浅色宿主 + `body[data-ds-dark-theme]` 深色宿主），不再写 `color-scheme`；`paletteIsDark()` → `hostIsDark()`。滑块：客户端 `ctx.inject(['modelDirectories'])` 拿官方每会话模型目录（读 `groups[].models[].reasoning.efforts`、写 `directory.select({ provider, model, reasoningEffort })`、订阅 `store.subscribe()`），在官方模型菜单第 2 行（推理等级）下方注入 `.ct-effort` 轨道；DOM 锚点只用语义属性（`aria-haspopup="menu"` + `aria-expanded` + `aria-controls`、`role="menuitem"` 第 2 行、`[data-composer-card]` 判归属），认不出或模型没有 ≥2 档就 fail-open；写入被拒时写原因并回滚到宿主确认的档位；切工水晶是自绘 4 切面 SVG，`createElementNS` 不可用退化成圆点。**更正 2.1.0 的错误结论**：DSH 客户端确实有推理等级，此前「没有任何 effort 标识」源于不完整的 `app.asar` 解包。测试 208 → 213 条（配色 3 色板、旧 id 迁移、tint 只能覆盖已存在 token、滑块档位映射/几何/锚点/写入回滚），离线舞台跑通「注入 → 点击 → 官方行变最高」，新增截图 `docs/screenshots/effort.png` 并重出 `palettes.png` / `skins.png`；README、[docs/UI.md](UI.md)（新增「推理滑块」整节）、CHANGELOG、locale、`package.json` 与 `PLUGIN_VERSION` 同步；版本 2.2.0。

- 2026-11-25：**2.2.1 推理滑块锚点加固**（2.2.0 的 staged 记录未审批发布，由 2.2.1 取代）：读了参考插件 `dsh-codex-effort-slider@1.1.9` 已安装的 `lib/client.js`，发现三处真实差异——它按行标签认行（Codex 订阅类选择器会往同一面板加 Speed / Verbosity 行）、注入后**明确不派发 `resize`**（部分宿主用 resize 兜底关菜单，派发会让菜单刚打开就关掉）、`directoryFor()` 在会话作用域就绪前会抛错且目录实例会被重建；滑块因此改为「标签认行 + 恰好两行兜底 + 多行无命中不注入」、删掉 `resize` 派发、目录每次读写重取并带 60/240/540/960/1500/3000ms 退避重试与换实例重订阅、每轮复核节点仍在该行之后（React 会丢），`load()` 按 400ms 节流按需调用；测试 213 → 215 条，第 23 条、验证要求、[docs/UI.md](UI.md) 与 README 同步，离线舞台重跑「注入 → 点击 → 官方行变最高」通过；版本 2.2.1。

- 2026-11-25：**2.3.0 主题美术补全**（用户指出「背景渐变怎么没有、对话栏的排版怎么没有」）：2.0.0–2.2.1 只复刻了配色 token，上游 `style.css` 的美术层没搬。现在 `applyOptics()` 在 `<body>` 写 `data-ct-palette` / `data-ct-art`（`host` 或 `appearance.art === false` 时 `off`），美术规则逐条以 `body[data-ct-art='on']` 开头：对话区 accent 径向泛光（底部 20% / 右上 chart-tools 11% / 顶部 4% 提亮）、`[data-message-bubble]` 16px 圆角烟熏气泡（深色 2.2% 顶光 + 1px 描边 + 内侧高光 + 深落影，浅色按上游换白内高光）、引用块 1.5px accent→冷紫竖条、`hr` 84% 发丝渐变、`[data-conversation-scroll]` 6px 细滚动条、`[data-composer-card]` 3% 顶光，正文 `line-height` 1.72；只用 DSH 语义属性、不碰哈希类名，不新增 keyframes。`src/store.js` / `client.js` 增加 `appearance.art`（只有显式 `false` 才关），外观页第 4 个开关在跟随宿主时置灰 + `title`。测试 215 → 216 条（美术 body 属性、样式表逐条闸门、外观页开关），新增截图 `docs/screenshots/art.png`；README、[docs/UI.md](UI.md)（新增「主题美术（宿主表面）」整节）、CHANGELOG、第 23 条与验证要求同步；版本 2.3.0。
