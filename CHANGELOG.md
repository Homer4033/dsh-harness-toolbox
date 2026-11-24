# 变更记录

> 版本号以 `package.json` 为准，每个发布版本对应一个 `vX.Y.Z` tag。安装方可以锁 `git+https://github.com/Homer4033/dsh-harness-toolbox.git#v1.10.0`。

## 1.10.0 — 2026-11-25

- **面板改成「液体玻璃外壳 + 左侧分页导航」**：原来那条长滚动 + 两栏拼贴换成一个小外壳——`.ct-shell` 是 `196px minmax(0,1fr)` 栅格（最大 980px、间距 20px），左列固定导航栏，右列**一次只渲染一页**（`key` 切换触发 160ms `ct-page-in` 进场）。六个分页：档位 / 规则 / 工作区 / 组件 / GitHub / 许可；顺序由新的 `SECTIONS` 常量统一给出，没注册工作区时「工作区」页连同导航项一起消失。导航项 34px、12px 圆角，当前页用 `aria-current="page"` + accent 16% 淡染 + 40% 描边 + `inset 2px 0 0` 左竖条 + 柔光。
- **玻璃配方只有一套**：`--ct-glass-fill` / `-rail` / `-sheen` / `-edge` / `-shadow` / `-inner` 定义在 `.ct-page` 上，导航栏与所有卡片共用；卡片圆角 16→20px，导航栏比卡片低一层（layer-2 混合）。画布用三段 accent 径向渐变（26% / 15% / 8%）压在 base 上——玻璃块背后没有明暗差就只是一块灰。
- **修掉容器查询写错位置**：`container-type: inline-size` 原来放在 `.ct-shell` 上，而元素不会被**自己**的容器查询命中，于是外壳留在两栏、`@container` 只把导航项改成横向，结果导航被裁在 196px 的槽里（1.10.0 预览时发现）。现在容器是 `.ct-page`，`.ct-shell` 只做栅格；面板宽度 ≤720px 时导航栏变成页面上方的横向条并**换行**（不用 `overflow-x` 横滚，被裁掉的页面等于没有入口）。
- **新增「许可」页**：本插件 MIT，加四套托管组件的标识与许可全文链接——GitHub CLI（MIT）、Git for Windows / MinGit（GPL-2.0）、FFmpeg（GPL-2.0-or-later）、python-build-standalone（PSF-2.0 · MIT），并说明这些程序不随插件分发、面板下载的是各自发行方的构建。新增 `PLUGIN_LICENSE` / `LICENSE_ROWS` 常量与 `.ct-license*` 样式（名称 + 标识 pill + 链接，链接 `target="_blank" rel="noreferrer noopener"`）。
- **仓库胶囊终于站到输入卡上**：`conversation.input.dock` 渲染在整宽的 `.composerStack` 里，而输入卡自己按 `--dsh-composer-card-max-width` 居中——1.9.x 的整宽行只做到「不贴窗口边」，胶囊停在输入卡右侧很远。`.ct-repo-dock` 现在按 `min(calc(100% - 2 × --dsh-composer-side-clearance), --dsh-composer-card-max-width)` 收窄并 `margin: 0 auto`，胶囊右缘与输入卡右缘对齐。
- 新增 `test/client.test.js` 用例：外壳与导航（一次一页、`aria-current`、工作区页缺席）、容器在页面而不在外壳、窄面板换行、玻璃变量与 20px 卡片圆角、许可页四套组件；旧的 `.ct-page-inner` / `.ct-columns` / `.ct-col` 断言改成「必须不存在」。测试 191 条。
- `actionButton()` 补上 `key: action`：动作行是用数组传给 `actionRow()` 的，真实 React 里每个按钮都需要自己的 key（此前只有测试用的假 React 掩盖了这一点）。
- 文档：[docs/UI.md](docs/UI.md) 重写（玻璃配方、分页导航、布局与容器查询的坑、许可行、胶囊对齐），[AGENTS.md](AGENTS.md) 第 14/22 条与验证要求同步，README 的使用与许可两节更新。
- 渲染未验证：静态预览（`temp/preview-build.mjs` + 无头 Chrome，深色 token 取真实主题值）确认了外壳、分页、玻璃、许可页与胶囊对齐；真实 DSH 窗口里的最终观感要刷新页面后确认。

## 1.9.1 — 2026-11-25

- **新增 UI 规范 `docs/UI.md`**：表面层级（页面 base → 卡片 layer-2 → 弹层 layer-3）、间距刻度、圆角、控件高度、卡片三段结构、自绘下拉规则、动效与禁止项、类名映射与检查清单。以后改面板先改规范再改样式。
- **面板改成 960px 两栏栅格**：`.ct-page-inner` 760→960px，新增 `.ct-columns` / `.ct-col`——宽窗两列，左列档位 + 全局规则，右列工作区规则 + 组件管理 + GitHub 登录；按面板自身宽度判断（容器查询 880px，不看窗口宽度），更窄时回落单列。卡片保留 16px 圆角与 16px 间距，档位按钮里的两个比例拆成两行，「自动 80% · 留 20%」在半宽卡里不再被挤成三行。
- **工作区下拉换成自绘 `Select`**：原生 `<select>` 的弹层由系统绘制，深色主题下是浅底 + 从面板继承来的浅字，选项在白底上看不见（只有悬停行显形）。现在是一个触发器按钮 + portal 到 body 的 listbox：`aria-haspopup` / `aria-expanded` / `aria-activedescendant`，↑ / ↓ / Home / End / Enter / Esc 与外部点击、窗口 resize 关闭，和仓库胶囊共用 `placeMenu()` / `useMenuDismiss()` / `useMenuFocus()` / `menuMove()`。
- **仓库上拉菜单重做**：弹层改用 layer-3 玻璃表面（layer-2 与卡片同色，旧菜单读起来就是一行浮着的文字）、accent 混合描边 + 光晕 + 顶部高光、16px 圆角、`0 24px 64px` 阴影；标题行前加 2px accent 竖条，分隔线改成两端淡出的渐变；选项 34px、10px 圆角，悬停/键盘高亮用 accent 淡染，选中项再加左侧 2px accent 竖条与勾选位，「私有」变成 pill 标签；上拉/下拉各一套 140ms 进场。右对齐的胶囊用 `align: 'end'` 定位，菜单右缘与输入卡对齐、朝页面中间展开。
- 胶囊绑定态改用 accent 淡染底与 accent 混合描边；`.ct-select` 展开时描边转选中色、箭头 180° 旋转。
- 测试 190 条（新增两栏结构、自绘下拉两条用例；原有的菜单用例改用 `.ct-menu` 系列类名，并断言旧 `.ct-repo-menu` / `.ct-repo-option` 不再出现在样式表里）。
- 渲染未验证：静态预览（`temp/preview-build.mjs` + 无头 Chrome，深色 token 取真实主题值）确认了两栏落位、胶囊与菜单的层次和右对齐；真实 DSH 窗口里的最终观感要刷新页面后确认。

## 1.9.0 — 2026-11-25

- **设置页搬进左侧栏**：删除 `settings.section` 注册，改为 `sidebar.panellist`（id `compression-tiers`，order 47，五条横线图标）+ `main` 面板，原来那四栏（档位 / 全局规则 / 组件管理 / GitHub 登录）整页搬过去，系统设置里不再出现本插件。面板自己是滚动容器（`.ct-page` + `.ct-page-inner`），不撑高主面板；`dsh.client.inject` 从 settings 换成 layout / sidebar / conversation。
- **新增工作区规则**：左侧栏面板里多一块「工作区规则」——从 `<DSH home>/storages/workspace.json` 读出已注册工作区，选一个就编辑它根目录的 `AGENTS.md`。新增 `src/workspace-rules.js` 与 `GET/POST /compression-tiers/api/workspace-rules`：只认清单里的 id（其它一律 404），写入与全局规则同样归一化、同样 100,000 字符上限，原子替换；**清单为空时整块不渲染**（不是置灰）。
- **仓库胶囊搬到输入框上方**：从 `conversation.session.header.actions` 换到 `conversation.input.dock`。旧位置在新会话里根本不渲染——空会话的标题栏被 `hideChrome` 隐藏，整个 `titleCluster`（含标签行）都不在，所以 1.6.2 起那个 portal 在新会话里无处可挂；dock 在空会话也渲染，正好在输入卡正上方、右对齐。
- **菜单改成上拉**：按 `bottom` 定位（`bottom = viewportHeight - rect.top + 8`），`max-height` 取胶囊上方空间，空间不足 200px 且小于下方时才翻成向下（`data-side='down'`）；不再测量菜单高度，长列表也不会溢出屏幕。
- **菜单观感重做**（社区里常见的 Radix/shadcn 风格）：14px 圆角、6px 内边距、分组标题 11px 加字距、分隔线用 `border-l2`、选项 32px 高 / 9px 圆角、悬停与活动项同一个 token、选中项加粗 + 勾、上拉/下拉各一套 130ms 进场动画（淡入 + 4px 位移 + 0.985 缩放）、`0 18px 44px` 双层阴影。键盘：菜单自己接管焦点，↑ / ↓ / Home / End 移动活动项，Enter / 空格选中，Esc 关闭，`aria-activedescendant` 跟着走。
- 测试 188 条（新增 `test/workspace-rules.test.js` 8 条与上拉/翻向/活动项/侧边栏注册/工作区区块 5 条）。
- 渲染未验证：本机浏览器工具在当前环境不可用，侧边栏面板与上拉菜单只做了结构断言与静态样式核对；真实 DSH 窗口里的最终观感要装上新版、重启 DSH 后刷新页面确认。

## 1.8.10 — 2026-11-24

- **按官方体例重写插件说明**：翻了 DSH 自带的 `references/plugin-details.md`（插件详情规范）和仓库里能拿到的其它插件——官方插件基本是「标题 + 一句话」（`计时服务 — 为其他插件提供延时和周期执行能力。`，17–40 字），第三方里最长的「红利量化」也只有 486 字。上一版（1.8.9）压到 669 字仍然像说明书。
- 现在中文 438 字、英文 971 字符，一段话七句：第一句是整包的定位（插件列表把说明裁成一行，只有这句会露出来），随后按「档位 / 组件 / 仓库 / 四个工具 / 联网与关闭后的变化 / 限制」展开，并补上规范要求的「数据去了哪里」与「关掉插件会怎样」。
- 规范里另外两条也确认过了：详情文档只能是一行图片（`docs/DETAIL*.md` 保持原样），功能与用法一律写在 `meta.description` 里。
- 8.9 的 stage 作废，改用这一版的 stage。

## 1.8.9 — 2026-11-24

- **插件说明重写**：插件页里那段说明原来是 1,343 字（英文 3,190 字符）的一大段流水账——GitHub CLI 讲了两遍、「组件管理」栏出现两次、还留着早已删掉的 1.4.x 仓库面板。先按「五档压缩 / 四个工具 / 全局规则 / 组件管理 / 会话仓库 / 限制」分成六块，中文 669 字、英文 1,668 字符（各减一半）；随后在 1.8.10 里按官方体例进一步压到 438 / 971。
- **显示名改为「压缩分档与工具箱」**（英文 `Compression tiers & toolbox`）：功能早就超出「压缩分档」，包名也是 toolbox；加载器 id、状态目录、工具名都不变。
- `package.json` 的 `description` 从 470 字符压到 235，`keywords` 补 `toolbox` / `ffmpeg` / `github`，npm 搜索页不再是一长串。
- 说明里同步了这几版的新事实：掉线自动重试、已完成归档复用、安装替换失败回滚、会话标题下的仓库选择器。

## 1.8.8 — 2026-11-21

- **修 `EPERM: rename 'staged-bin' -> 'bin'`**：包已经下完、二进制也自检通过，最后一步把暂存目录挪进安装位置时被 Windows 拒了——目录里还有文件被占用（杀毒在扫刚写出的 110 MB `ffmpeg.exe`，或者 `-version` 子进程还没退干净）时，`rename` 会报 `EPERM`。新增 `src/swap.js` 的 `moveIntoPlace()`：先按 200ms→400ms→…→6s 退避重试 7 次，锁还在就改用复制（读不锁、改名才锁），安装照样完成。`src/ffmpeg.js`、`src/components.js`（git / python）、`src/gh.js` 里所有到安装目录的移动都改走它，包括回滚路径。
- **重试不再白下**：下载完成的归档（`<root>/<id>/download/<file>`）现在会被复用——重试时先看它在不在，在就直接解压安装，不重新拉 110+ MB。这条对刚才那种「下完了、装的时候失败」的情况是最直接的救回。
- 测试 176 条（新增 `test/swap.test.js` 6 条：首试成功、锁重试后成功、锁不释放退化为复制、`ENOENT` 早退、跨卷 `EXDEV` 直接复制、错误分类）。

## 1.8.7 — 2026-11-21

- **组件下载掉线自动重试**：以前只有「断点续传」——中断后 `.part` 留在磁盘上，但必须人再点一次「继续下载」。现在 `downloadWithResume` 自己在掉线时重试：默认 3 次（共 4 次尝试），退避 1.5s / 3s / 6s，**每次重试都从 `.part` 的字节偏移继续**（`Range: bytes=N-`），所以哪怕下到 100 MB 掉线也只补差额。gh / ffmpeg / git / python 四套组件共用这一段，一起生效。
- 不会重试的情况：`404` / `403` 这类再试也不会变的回答（`429` / `5xx` / `408` 会重试）、以及已经 `aborted` 的信号（20 分钟超时或人取消）——这两种立刻失败，省掉没有意义的十几秒等待。重试预算用尽后错误信息会带上「(gave up after N attempts)」，`.part` 依然保留，页面照旧给「继续下载」。
- 测试 170 条（新增 4 条：掉线重试并从 `.part` 续传、4xx 不重试、`aborted` 不重试且 `.part` 保留、预算用尽时报出尝试次数）。

## 1.8.6 — 2026-11-21

- **会话头仓库胶囊挪到标题下面**：以前它被 `margin-left: auto` 甩到 View 标签行的最右端，和标题隔着上千像素的空白。现在紧跟标签之后，就在标题正下方、和「对话 / 轨迹」同一行；`margin-top: -4px` 让 24px 胶囊与标签文字基线对齐（由官方 `.tab` 的 -10px 外边距 + 10px 内边距推出，实测偏差 0px）。没有改官方 `titleRow` / `tabs` 的布局——header 高度是桌面窗口 chrome 几何的锚点。
- **胶囊更轻一点**：高度 26 → 24px，圆角胶囊、边距收紧；描边默认 `border-l2`、悬停升到 `border-l3`（深色主题里 l3 比 l2 明显）；展开时箭头旋转 180° 并带 140ms 过渡；标题「仓库」降到 11px，仓库名加 500 字重；`max-width` 260 → 300px，`owner/name` 不再被截断（实测 30 字符名字自然宽度 266px）。
- **下拉菜单加了结构**：顶部一行标题「仓库」，`不使用仓库` 与仓库列表之间有分隔线；选项高度 30 → 32px，选中项名字加粗。仍然只有一份 portal、Esc / 外部点击 / resize 关闭。
- 测试 166 条（新增菜单标题 + 分隔线顺序、胶囊位置两条断言）。
- 渲染验证方式：把官方 `ConversationRoot` 的编译后 CSS 与插件样式表拼成一个静态页，用无头 Chromium 量出胶囊与标签文字中心线 `dy = 0.0px`、无文本截断，并截图核对（`output/capture/`）。真实 DSH 窗口内的最终观感仍需刷新页面确认。

## 1.8.5 — 2026-11-20

- **修复 `github_push` 崩溃**：工具读会话绑定时用的是 `settings.github`（只有 github 块），而 `sessionRepos` 在**顶层** settings 上，于是报 `Cannot read properties of undefined (reading 'session-…')`，工具完全不可用。新增 `src/push-flow.js` 的 `sessionTarget()`（读顶层、缺 map 时返回空串），工具与绑定查询共用；`test/push-flow.test.js` 补回归用例（含旧 settings 没有 `sessionRepos` 的情况）。
- **README 精简**：从 280 行压到 88 行，按「安装 / 使用 / 五档参数 / 智能体工具 / 组件管理 / 全局规则 / 兼容性与限制 / 开发」重排，删掉长论证与重复细节，保留可查的表（档位、四套组件）。
- 测试 164 条。

## 1.8.4 — 2026-11-20

- **用户输入优先于主动压缩**：`compression_compact` 排队后，如果人在 AI 结束本轮之前就发了消息，以前只在「压缩正在跑」时才认这条输入，排队中的任务会照样执行，并在你的问题后面再补一句「继续未完成任务」。现在任何一条真人消息都会取消排队中的压缩，并阻止续跑消息；已经开始的压缩不会被中断，但结束后同样不再注入续跑。真人消息永远按正常轮次处理，不会被压缩流程丢弃。
- 新增 `test/manual-compact.test.js`（7 条）：排队 → 轮次结束 → 压缩 + 续跑；重复请求拒绝；`aborted` 丢弃；结束前用户发言取消；压缩中用户发言只取消续跑；宿主已按阈值压缩时不重复压缩但仍续跑；工具名与引擎解析。共 164 条。

## 1.8.3 — 2026-11-20

- **一个组件只说一次「没有」**：ffmpeg 行的标题现在就是 `ffmpeg / ffprobe`（它覆盖的两个二进制），所以两个都没装时只有一行「ffmpeg / ffprobe　未安装」，不再在下面补「ffmpeg / ffprobe　未找到」——「未安装」和「未找到」说的是同一件事。
- 只缺一个时仍然保留那一行（例如 `ffprobe　未找到`），因为此时状态行说的是「未完成，可续传」而不是「未找到」，两者不同义。
- 测试：改「都没有时不另列缺失行」用例，共 157 条。

## 1.8.2 — 2026-11-20

- **ffmpeg 一行不再三重否定**：整行已经写着「未安装」，下面又列「ffmpeg 未找到」「ffprobe 未找到」，同一件事说三遍。现在找到的二进制各自一行（带来源、版本、路径），所有缺的合并成一行「ffmpeg / ffprobe　未找到」；只缺一个时那一行就只写缺的那个。
- 测试：新增「两个二进制都缺只出现一行」用例，共 157 条。

## 1.8.1 — 2026-11-20

- **ffprobe 不再消失**：ffmpeg 那一行固定列出 `ffmpeg` 与 `ffprobe` 两个二进制，缺哪个就显示「未找到」，不再因为整对都没装就把副行整个省掉。
- **「仍要下载」改为「重新下载」**（`downloadKeep`）：PATH 里已有系统副本时，按钮文案说明的是「再装一份托管版」，不是「坚持要装」；英文同步改为 `Download again`。
- **面板底部不再留空**：状态行是空的（`ct-status` / `ct-note` 无内容）时直接收起，档位面板与规则面板底部原来会多出约 30px 的空白（网格 `gap` + 预留的 18px 行高），现在没有消息就不占位。
- 测试：`test/component-rows.test.js` 覆盖「缺一个二进制仍列两行」与「未找到」；`test/client.test.js` 覆盖 `toolsNotFound` 副行与空状态收起的样式规则；共 156 条。

## 1.8.0 — 2026-11-21

- **「音视频工具」改成「组件管理」**：设置页最后一栏不再只管 ffmpeg，而是把四套托管组件放在一栏里——GitHub CLI、git、ffmpeg/ffprobe、Python。每一行都长一样：名称 + 钉住的版本 + 实际用的版本 + 状态（未安装 / 未完成可续传 / 下载中 / 已安装 / 系统已安装 / 下载失败 / 当前系统不可用）+ 实际二进制路径 →「下载」「重新检测」一行两个按钮。原来的 GitHub CLI 下载行与「下载位置」面板都并进这一栏。
- **新增 `git` 与 `Python` 的托管下载**：新增 `src/components.js`，钉住 MinGit `2.56.1`（`MinGit-2.56.1-64-bit.zip` / `-arm64.zip`）与 python-build-standalone `3.11.18+20261110`（`...-x86_64-pc-windows-msvc-install_only.tar.gz`，URL 里的 `+` 保持 `%2B`）。同样是 HTTP Range 续传、解压后先在临时目录跑一次 `--version` 自检、再原子换上整棵目录（失败回滚），最后把 `<root>/git/cmd`、`<root>/python`、`<root>/python/Scripts` 插到本进程 PATH 最前。
- **新的拖放区**：安装的解包/暂存目录放在 `<root>/.staging/<id>`，不再放在组件目录里——否则「把暂存的树 rename 成 `<root>/<id>`」会踩到自己的父目录。
- **「下载位置」并入同一栏**：仍然是 `settings.json` 的 `toolsPath`（空 = `<DSH home>/compression-tiers`），仍然只接受绝对路径、下载中 409、目标已存在预检拒绝、跨卷 `EXDEV` 退化为复制后删除、支持半迁移重试。变化是迁移现在整体搬**四个**组件（`gh` / `git` / `ffmpeg` / `python`），PATH 里的旧目录也一并换掉。
- **GitHub 栏只留登录**：`GitHub CLI` 面板改名为 `GitHub 登录`，只剩账号状态、`gh auth login --web` 设备码、复制/打开/取消与网络体检；二进制的下载与检测搬到组件管理栏。
- **接口**：新增 `GET /compression-tiers/api/components`（返回 `root` 与四行 `components`，每行 `id/name/version/toolVersion/state/supported/ready/managed/system/path/percent/error/running/tools`）与 `POST` `{"id":"git","action":"download"}`（202 + 刷新的列表，未知 id 返回 400）。四行的映射放在新增的 `src/component-rows.js`，与宿主服务解耦、可单独测试。
- **共享按钮标准的范围扩大**：`downloadControl()` 与 `actionButton()` 现在服务四行而不是两个面板；按面板分裂的标签键（`ghDownload` / `toolsInstall` …）继续禁止回归，`toolsPathTitle` / `ghTitle` / `ghPathLabel` / `toolsLoadFailed` 等旧键随面板合并删除，`ghPathLabel` 由共享的 `pathLabel` 取代。
- 测试：新增 `test/components.test.js`（资产钉住、`git --version` / `Python 3.11.18` 解析、PATH 检测、状态 missing/installed/system/partial、PATH 前插去重、未知组件与无托管构建的早退）与 `test/component-rows.test.js`（四行顺序、state→ready/managed/system/running 映射、ffmpeg 双二进制、缺失状态丢行）；`test/client.test.js` 按新面板重写组件、位置与登录用例；`test/tools-path.test.js` 覆盖四组件迁移，共 154 条。

## 1.7.1 — 2026-11-20

- **按钮统一成一套标准**：以前每个面板各自拼 `<button class="ct-save">`，GitHub CLI 与音视频两栏越改越不像（一个把状态文字塞进按钮行、一个把工具列表插在按钮上方）。现在所有动作按钮经 `actionButton()` 渲染：基础类 `ct-btn`（30px 高、`0 12px` 内边距、10px 圆角），主操作只多一个 `ct-btn--primary`（选中色描边 + 模块底色），尺寸、字号、间距、禁用态、焦点圈完全一致；旧的 `ct-save` 删除。
- **两个下载面板同构**：「下载」与「重新检测」在 GitHub CLI 和 ffmpeg/ffprobe 两栏里位置、顺序、样式都一样——状态行 → 进度条 → 路径/错误行 → 一行两个按钮（下载在左、重新检测在右），按钮只放在 `ct-actions` 行里，状态文字另起一行。
- **共享状态与标签**：新增 `downloadControl()`，两个面板用同一套规则算出状态文案与按钮标签（`downloadIdle` / `downloadKeep` / `downloadContinue` / `downloadRetry` / `downloadRunning` / `downloadDone` / `downloadUnsupported`、`stateMissing` / `statePartial` / `stateFailed` / `stateSystem`、`probe`），删掉 `ghDownload`、`ghProbe`、`ghInstalled`、`toolsInstall`、`toolsProbe`、`toolsDownloading`、`toolsUnsupported`、`toolsLoading` 等按面板分裂的副本；PATH 里只有系统副本时两边都显示「仍要下载」且可点。
- 测试：新增四个按钮一致性用例（类名、标签键、禁用态、行内顺序、PATH-only 强制下载、运行中的进度），共 135 条；`test/client.test.js` 同时断言按面板分裂的标签键不会回归。

## 1.7.0 — 2026-11-19

- **统一下载位置**：`gh` 与 `ffmpeg` / `ffprobe` 不再各自找目录，两套托管文件共用一个根目录 `<toolsPath>`（`gh` 在 `<toolsPath>/gh`，ffmpeg 在 `<toolsPath>/ffmpeg`）。`settings.json` 新增 `toolsPath`；留空即默认 `<DSH home>/compression-tiers`，与 1.6.x 的两个目录完全一致，升级不搬动任何文件。
- **可迁移**：设置页新增「下载位置」面板（绝对路径输入 + 「迁移」+「恢复默认」）。迁移整体搬两棵目录、写完 `settings.json`、并把本进程 PATH 里的旧 `bin` 目录换成新的。规则：只接受绝对路径；下载进行中返回 409；目标已有同名组件时预检拒绝（什么都不动）；跨卷 `rename` 失败（`EXDEV`）退化为复制后删除；「搬一半失败」可以重试补完。接口 `GET/POST /compression-tiers/api/tools`。
- **新模块** `src/tools-path.js`：`defaultToolsPath` / `parseToolsPath` / `normalizeToolsPath` / `resolveToolsPath` / `toolsStatus` / `migrateTools`。`src/gh.js` 与 `src/ffmpeg.js` 的首个参数从 DSH home 改为共享根目录，并新增 `ghDownloadRunning` / `ffmpegDownloadRunning` 供迁移前检查。
- **设置页不再写说明文**：删掉页面 intro、档位点评、规则/GitHub/音视频三个面板的说明段、`ghToolNote` 与设备码操作说明，界面只留控件标签、当前值、路径与错误信息；这类文字写进 `AGENTS.md`（新增第 15 条）。
- **按钮常显**：设备码「复制验证码」/「打开授权页」/「取消登录」三个按钮不再按条件渲染，空闲时照常显示并置灰，原因写在 `title`（`AGENTS.md` 新增第 16 条）。下载位置的两个按钮同样常显。
- **测试**：新增 `test/tools-path.test.js`（默认根、绝对路径校验、整体迁移、目标已存在预检、下载中 409、`EXDEV` 回退、半迁移重试）；`test/store.test.js` 覆盖 `toolsPath` 归一化；`test/client.test.js` 覆盖三个常显按钮、下载位置面板的禁用态与「说明段键已删除」；共 131 条。

## 1.6.4 — 2026-11-19

- 会话头仓库选择器不再用原生 `<select>`：原生弹层是系统白底，且会继承胶囊的浅色文字，几乎看不见选项。改成自绘深色弹层（portal 到 `document.body`、`position: fixed` 锚在胶囊下方）：主题底色、圆角、阴影、`max-height` 滚动；每行 30px，左侧勾选位、名称省略、右侧「私有」标记；第一行固定「不绑定（用 git remote）」，已绑定但列表里没有的仓库仍保留。
- 交互：点胶囊开关弹层；点外部、按 Esc、窗口缩放都会关闭；`aria-haspopup` / `aria-expanded` / `role=listbox` / `role=option` 齐备。
- 测试改成断言胶囊按钮与弹层选项（含退役仓库、私有标记、禁用态），不再依赖原生 select。

## 1.6.3 — 2026-11-19

- 修复会话头胶囊**没有样式**的问题：样式表以前是作为设置页里的 `<style>` 渲染的，只有打开过设置页才生效，于是首屏的胶囊按 SVG 默认 300×150 撑爆了标签行。现在插件加载时就把 `style[data-compression-tiers]` 注入 `document.head`，卸载时移除；设置页不再自带 `<style>`。
- 测试：新增断言样式表在 `apply` 阶段注入且包含胶囊规则，设置页树里不再有 `<style>`。

## 1.6.2 — 2026-11-19

- 会话头的在线仓库选择器改成**标题下方 View 标签行右侧**的胶囊控件：仓库图标 +「仓库」标签 + 当前 `owner/name`（未绑定显示「未绑定」）+ 箭头；有绑定时用选中色描边，悬停/聚焦有反馈，长名字省略。官方 header 会裁剪标题旁的动作（`.titleCluster { overflow: clip }`），所以胶囊通过 React portal 挂到 `[data-conversation-tabs]` 所在行的末尾；没有标签行（少于两个 View）时退回标题旁内联显示。
- 原生 `<select>` 仍铺在胶囊上负责键盘与选择行为；原来的裸下拉与灰色提示文字被这层外观替换。

## 1.6.1 — 2026-11-19

- **包名改为 `dsh-harness-toolbox`**：功能已经不止压缩（全局规则、`gh` 管理、`github_push`、会话发布仓库、ffmpeg/ffprobe），旧名不再贴切。加载器行 id（`compression-tiers`）、状态目录、工具名都不变；bundle 名就是包名，所以升级要在插件页移除旧条目再添加本目录。
- **npm 发布改走暂存**：npm 已对 2FA-bypass token 关闭直接发布，`npm publish` 会被拒；改为 `npm stage publish`，再由维护者在 npmjs.com 的 Staged Packages 或 `npm stage approve <id>` 完成 2FA 审批。旧名下的 `0.0.0-stage` 占位版本不再使用。
- 音视频面板在状态还没读到时不再误报「当前系统没有托管版」，改为「读取中…」；只有平台确实没有托管源时才显示不可用。

## 1.6.0 — 2026-11-19

- **兼容新运行时**：`engines.dsh` 从钉死的 `0.2.2-rc.3` 放宽为 `>=0.2.2-rc.3 <0.3.0`，`0.2.2-rc.5` 不再报「不兼容」；用 Node 自带 semver 验证过 rc.3 / rc.5 满足、0.3.0 拒绝。
- **会话发布仓库**：会话标题右侧新增「仓库」选择器，按持久会话 id 把当前会话绑到某个在线仓库（`settings.json` 的 `sessionRepos`，最多 200 条）。绑定后 `github_push` 默认推到 `https://github.com/<owner/name>.git`——只换推送目标，不克隆、不切分支、不改工作区。列表来自 `GET /api/github/online`（`gh repo list --limit 100`，客户端缓存 5 分钟，未安装/未登录/网络不通分别说明），绑定接口是 `GET/POST /api/github/binding?session=…`。
- **音视频工具管理**：设置页新增「音视频工具」面板，检测 `ffmpeg` / `ffprobe`（托管版优先、再看 PATH），显示两者版本与路径；可从 gyan.dev 下载 Windows essentials 构建（约 110 MB，HTTP Range 断点续传、20 分钟超时），解压后先跑 `-version` 自检暂存副本再原子替换 `bin` 目录、失败回滚，最后插到本进程 PATH 最前。接口 `GET/POST /api/ffmpeg`。
- 新模块 `src/ffmpeg.js`；`src/gh.js` 增加 `listRepos` / `parseRepoList` 并把 `runCommand` / `extractArchive` 导出复用；`src/http.js` 增加 `queryParam`；`src/store.js` 增加 `sessionRepos` 归一化（`normalizeRepoName` / `normalizeSessionRepos`）；`src/push-flow.js` 的 `pushFlow` 新增 `target`（URL 作为远端时不取仓库快照）。
- 客户端：新增会话头 `conversation.session.header.actions` 注册（id `compression-repo`，order 60）与设置页音视频面板、对应 zh/en 文案与样式。
- 测试：新增 `test/ffmpeg.test.js`、`test/http.test.js`，并补 `parseRepoList` / `listRepos`、`sessionRepos` 归一化、`pushFlow` 的 `target` 与报告文案、设置页音视频面板与会话头选择器；共 113 条。

## 1.5.1 — 2026-11-19

- **设置页不再有仓库**：删掉「默认仓库」输入框、仓库状态行、推送 / 建仓 / 查看按钮与仓库路径的保存动作。GitHub 这一栏只剩 `gh` 的安装、登录与网络体检；发布只走 `github_push` 工具。
- 接口收敛：`/api/github` 只保留 `download` / `login` / `cancel`，`configure` / `push` / `create` / `view` 下线；`GET /api/github/repo` 删除；网络体检固定在本插件检出目录上跑（只为读 git 的 `http.proxy`）。
- 设置里删掉 `github.repoPath`（升级后下一次写入即清掉），`resolveRepoPath` 一并移除；`github_push` 的目录选择变成「显式 `path` → 本会话工作目录」，不再有配置兜底。
- 测试同步：`test/push-flow.test.js` 覆盖「显式 → 会话、无兜底」，`test/store.test.js` 断言 `repoPath` / `repos` 从内存与磁盘上一起消失；共 92 条。
## 1.5.0 — 2026-11-19

- **删掉左侧栏「仓库」面板**：官方「变更请求与工作树」bundle 已经在管仓库与工作树 UI，自建面板与它重复。移除 `sidebar.panellist` / `main` 两个注册、面板组件与图标、`repos*` 文案、`GET /api/github/repos` 路由和 `configure` 的 `repos` 字段（现在返回 400 说明已下线）。
- **发布能力改成工具 `github_push`**：默认推本会话的工作目录（`workingDirectory`），其次设置页的「默认仓库」，可用 `repo` 指定绝对路径。内部固定走「网络体检 → 密钥扫描 → 60 秒超时的 push → 失败分类 + 待推列表」，命中密钥时阻止并提示可 `force`。
- 新模块 `src/push-flow.js`：`resolvePushCwd` / `pushFlow` / `pushReportText`，设置页的 `push` 动作与工具共用同一段流程，安全规则不会两边不一致。
- `github.repos` 从状态与归一化里移除（升级后下一次写入即清掉旧字段）；`push`/`create`/`view` 的 `repo` 参数改为接受任意存在的绝对目录。
- 设置页 GitHub 一节补一句说明：那一栏只推默认仓库，工作区发布交给 `github_push`。
- 新增 `test/push-flow.test.js`（目录解析、密钥拦截与放行、失败分类、报告文案、无仓库早退）。

## 1.4.1 — 2026-11-19

- **面板不再有隐式仓库**：列表为空就是空面板，不会再自动出现插件自己的检出目录（之前那份兜底确实容易让人以为「没填路径也能推」）。github.repos 只装你显式添加的仓库。
- 「默认仓库」只服务设置页那一节和单仓库动作；设置页推送现在显式带上它自己的路径。

## 1.4.0 — 2026-11-18

- **左侧栏「仓库」面板**（`sidebar.panellist` id `compression-repos` + `main`）：每个仓库独立成行，各自推送；多个 agent 同时推不同仓库时不再互相覆盖全局路径。
- `github.repos`：绝对路径数组，按平台去重；列表为空时回落到插件自己的检出目录。设置页那一项改为「默认仓库」，只作兜底。
- 新增 `GET /api/github/repos`；`configure` 接受 `repos` 数组并校验目录存在；`push` / `create` / `view` 接受 `repo` 参数，且只接受配置列表内的路径（否则 400）。
- 面板沿用密钥扫描：命中即阻止，行下会出现「仍然推送」按钮（带 `force`，只作用于该仓库）。

## 1.3.1 — 2026-11-18

- **推送前密钥扫描**：`scanSecrets` 检查将被发布的文件——文件名（`.env`、`keys.json`、`*token*.txt`、`*.pem`、`id_rsa`）和内容（GitHub / OpenAI / AWS / Slack 令牌、私钥头、`token = "…"` 这类赋值）。命中时设置页阻止推送并列出 `文件:行`，人工确认后可以「仍然推送」。
- `npm run check:secrets` 与 CI 复用同一扫描，终端里的推送也能在 CI 被拦下。
- CI 覆盖 Windows 与 Linux（前者是主要开发平台）。
- 发布规范：补本文件，按版本打 tag。

## 1.3.0 — 2026-11-18

- **网络体检**：DNS、直连 443、对 `https://github.com/` 的 HEAD、代理端口分层探测，结论为 `direct` / `proxy` / `proxy-dead` / `blocked`。只有 HTTPS 成功才算可达——被污染的解析结果照样能完成 TCP 握手。
- **代理**：优先级为显式设置 → git `http.proxy` → 系统代理；push 时用 `-c http.proxy=…` 注入，不改全局配置。
- **推送看门狗**：60 秒硬超时，超时结束整棵进程树（`taskkill /T /F`），并设 `GIT_TERMINAL_PROMPT=0`、`GCM_INTERACTIVE=never`；失败按 DNS / 网络代理 / 认证 / 非快进 / 仓库不存在分类，回带未推提交列表。
- **仓库**：快照（本地/远端 HEAD、待推、未提交）、路径可配置、建仓（默认私有，需二次确认）、`gh repo view`。
- **认证**：`gh auth status --json hosts` 读取 scopes，缺 `repo` scope 时提前提示。

## 1.2.1 — 2026-11-18

- 把 `@deepseek-ai/dsh-home-paths`、`@deepseek-ai/dsh-tools` 声明为可选 `peerDependencies`：以本地目录链接（linked root）方式安装时，DSH 的解析层靠 peer 声明把宿主导入路由到运行时实现；缺声明会导致 Host 半区导入失败、插件不激活。

## 1.2.0 — 2026-11-18

- 合并 GitHub CLI 管理：固定 `gh 2.76.2`、断点续传下载、解压后探测暂存副本再原子替换（失败回滚）、PATH 检测与托管插前、`gh auth login --web` 设备码登录；新增 `/compression-tiers/api/github` 与 `/auth` 路由和设置页面板。

## 1.1.1 — 2026-11-17

- 设置页文案精简：档位说明改为一句话，删除主动压缩说明段，规则面板文案缩短。

## 1.1.0 — 2026-11-17

- 合并全局规则编辑：`src/rules.js` 与 `/compression-tiers/api/rules`，设置页规则面板，系统提示带最新 2,000 字符摘要；`src/store.js` 增加原子文本写入。

## 1.0.0 — 2026-11-17

- 从 `homerdsh-workbench` 拆出的独立插件：五档上下文压缩、`compression_tiers` / `compression_context` / `compression_compact` 三个工具、把档位同步进预设隔离域的 `compaction-basic` 引擎、设置页。
