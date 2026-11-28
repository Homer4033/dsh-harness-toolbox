# 变更记录

> 版本号以 `package.json` 为准，每个发布版本对应一个 `vX.Y.Z` tag。安装方可以锁 `git+https://github.com/Homer4033/dsh-harness-toolbox.git#v2.5.0`。

## 2.10.0 — 2026-11-28

- **夜间做梦：可调度的批量整理 + 漂移对账报告**（用户：「接着 ②」）：新增 `src/memory-dream.js`——`normalizeDreamSettings()`（默认停用、间隔钳到 1–168 小时）、`dreamDue()` / `nextDreamAt()`、`dreamProjects()`（对所有已注册工作区逐个 `dream(apply) + reconcile`，单个目录缺失或坏库只记一条错误；`shouldStop` 在项目之间生效）、`dreamReportText()` 与 `compactReport()`（≤50 个工作区、≤8KB，报告写回 `settings.json` 的 `memory.dream.lastReport`）。`src/store.js` 新增 `memory.dream` 默认值与归一化，旧配置无该块时按默认值补齐。宿主半区新增调度：每 5 分钟检查是否到期，激活后 10 秒起跑，`setImmediate` 执行避免阻塞激活；新增 `GET/POST /compression-tiers/api/memory/dream`（`save` / `run` / `cancel`，运行中重复 run 返回 409）。`memory_dream` 工具增加 `all: true` 批量模式并返回批量报告。面板「记忆」卡片底部新增计划区：启用/停用、间隔输入、上次/下次、保存计划 / 立即做梦 / 取消剩余四个常显按钮；运行中每 1.5 秒轮询状态，轮询不回写间隔草稿。
- 测试 **287 → 297**：新增 `test/memory-dream.test.js` 6 条（默认与钳位、到期/下次、批量含坏项目、`shouldStop`、报告截断、状态 payload），`test/store.test.js` 1 条（记忆计划默认与旧配置补齐），`test/client.test.js` 3 条（四个按钮、运行中禁用保存/运行、无工作区禁止运行）与 `HOOK_ORDER` / 字典键同步。
- 文档同步：AGENTS.md 事实来源与第 24 条、验证要求、文档索引；README 与英文版新增夜间做梦段、工具表、目录树与版本；[docs/UI.md](UI.md) 记忆页计划区；详情页；locale；`package.json` 2.10.0。**渲染未在装好 2.10.0 的窗口里复验；调度器只有单测，未在真实宿主上跑过一轮夜间任务**。
## 2.9.0 — 2026-11-28

- **新增「记忆」分页与四个记忆工具**（用户：「产出一版 v1.1，做成加入插件『记忆』功能」）：按 v1.1 的 7 处修正落地——索引硬上限、三道写入闸、外部来源隔离、单写者/tombstone、承诺台账、面板只读状态、确定性检索。`src/memory.js`：`entries.jsonl` / `quarantine.jsonl` 只追加，`tombstone` 记录取代 / 过期 / 完成；`rebuildIndex()` 生成带 `INDEX_MARKER` 的 `MEMORY.md`（`MAX_INDEX_LINES` 200 / `MAX_INDEX_BYTES` 25,000，超限报 `over`，手写文件先改名 `.foreign-<ts>` 保留）；`writeMemory()` 闸门为完全重复、Jaccard ≥ `NEAR_DUPLICATE` 0.8 的近似重复、`rule`/`decision` 否定矛盾，`source: 'external'` 只进隔离区；`settlePromise()` 只能结算一次；`atomicWrite()` 对 Windows `EPERM` 重试退避后回退原地写。工具四个：`memory_write` / `memory_search` / `memory_reconcile` / `memory_dream`；路由 `GET/POST /compression-tiers/api/memory`；面板第 2 个分页「记忆」（工作区选择器 + 条目/承诺/索引预算/漂移/隔离区状态行 + 最近记忆列表 + 常显「重新检测 / 重建索引 / 做梦整理」）。`SECTIONS` 回到 5 项，字典 +26 键，`__test` 无新增。
- 测试 **270 → 287**：新增 `test/memory.test.js` 14 条（空库、写入 + 索引、完全重复、近似重复与 `force`/`supersedes`、矛盾与取代链、外部隔离、输入校验、CJK 检索、承诺逾期与 settle、证据漂移与过期、做梦 dry/apply、手写索引改名、索引超限、面板 payload）与 `test/client.test.js` 3 条（记忆页三按钮、空工作区、超限与外部写入），改写 5 处分页断言与 `HOOK_ORDER`。
- 文档同步：AGENTS.md 第 22 / 24 条、事实来源、验证要求、文档索引；README / README.en 新增「记忆」节并改分页与工具计数；[docs/UI.md](UI.md) 分页表与检查清单；`docs/DETAIL.md` / `DETAIL.zh.md`；locale 中英描述；`package.json` 2.9.0（新增 `agent-memory` / `memory` 关键词）。**渲染未在装好 2.9.0 的窗口里复验；工具与路由只有单测，未在真实会话里调用过**。
## 2.8.2 — 2026-11-27

- **输入卡光学层整体取消**（用户：「棱镜流光取消掉吧」）：2.8.0 的四种光效与 2.8.1 剩下的银白流光边一起删掉——`client.js` 删除 `ComposerOptics` / `mountComposerOptics` / `opticsPlan()` / `rimPoint()` / `findComposerCard()` / `composerRadius()` / `RIM_REACH`、`RepoBinding` 里的两处挂载、`__test.optics` 导出与全部 `.ct-optics-*` 样式。宿主输入卡回到完全原样（这条边界本来就在：`composerStack` 是 fixed 的包含块，光效只能是只读叠层，现在叠层也没有了）。`test/client.test.js` 的九条光效用例与 `opticsNodes` 一类 helper 一并删除。
- **设置里的「外观」页取消**（用户：「设置『外观』页取消」）：`SECTIONS` 从 5 项收成 4 项（档位 / 规则 / 模型和组件 / GitHub），删除色板 `PALETTES`、动效 `MOTIONS`、`normalizeAppearance()`、`LEGACY_PALETTES`、`DEFAULT_APPEARANCE`、`applyAppearance()` / `appearancePanel()` / `loadAppearance()`、`appearanceBusy` / `appearanceMessage`、中英字典里的 `navAppearance` / `appearanceTitle` / `palette*` / `motion*` / `art*` / `appearanceApplied` / `appearanceFailed` 与 `.ct-swatch*` / `.ct-segment*` 样式。换成 `client.js` 里一个常量 `APPEARANCE = { palette: 'auto', motion: 'full', art: true }`：面板、dock 行与试管都从这里取，启动时不再读设置（少一次 `/api/settings` 往返），`applyOptics()` 只负责写 `data-ct-palette='auto'` / `data-ct-art='on'` / `data-ct-motion='full'` 并 `watchGlow()`。
- **配色只跟随 DSH 的深色 / 亮色**（用户：「『跟随宿主」外观取消，『深空黑耀』对应 DSH 深色主题、『白昼冷晶』对应 DSH 浅色主题，跟随 DSH『深色』『亮色』设置就好了」）：`SKIN_PALETTES` 只剩 `{ auto: { family: 'cool' } }`，`SKIN_TINTS` 删除，`skinSpec('auto')` 直接把 `SKIN_FAMILIES.cool` 的 light / dark 成对交给 `theme.overrideTokens`；样式表里 `.ct-skin[data-palette='auto']` 的默认段是浅色，`body[data-ds-dark-theme] .ct-skin[data-palette='auto']` 段是深色——DSH 自己的外观开关就是唯一开关，插件不再调 `theme.setTheme()` 改用户偏好。启动路径变成 `setSkinPalette(); applyOptics()`。
- **「白昼冷晶」按上游 Obsidian Prism 浅色主题重做**（用户：「『白昼冷晶』好像不是 obsidian-prism 中的白色」）：旧值是自拟的冷灰（`#f6f8fb` 一类），上游 `style.css` 的浅色主题是更亮的一档——画布 `#F4F7FB`、卡片 `#FFF`、次层 `#E9EFF8`、弱底 `#EEF3FA`、侧栏 `#E8EEF6`、正文 `#0F172A`、次级正文 `#334155`、弱化正文 `#4B5B73`、accent / primary `#2563EB`、链接 `#1D4ED8`、边框 `rgba(15,23,42,.11)`、卡边框 `.15`、阴影 `0 10px 28px -6px rgba(30,58,138,.1)`，警示色 `#DC2626` / `#D97706` / `#059669`。`SKIN_FAMILIES.cool.light` 逐项换成这套值，深色「深空黑曜」保持 `#0A0A0C` / `#6F9BFF` 不变。
- **设置接口不再收 `appearance`**：`src/store.js` 删除 `APPEARANCE_PALETTES` / `LEGACY_PALETTES` / `APPEARANCE_MOTIONS` / `defaultAppearance()` / `normalizeAppearance()`，`defaultSettings()` 不再写这个字段，`normalizeSettings()` 直接 `delete next.appearance`——旧 `settings.json` 里的 `appearance`（含 2.0.0 的 `warm` / `alabaster`）读时丢弃、不回写。`index.js` 的 `POST /compression-tiers/api/settings` 只接受 `level` / `routeLines`，没有可改字段时报 `nothing to update: pass level and/or routeLines`。
- 测试 **283 → 270**：删掉 9 条光效用例；外观页那条改写成「外观页已删除」（导航只有 4 项、没有 `.ct-swatch*` / `.ct-segment*`）；皮肤用例改写为单一 auto 皮肤（浅色 `#f4f7fb` / `#ffffff` / `#2563eb`，深色 `#0a0a0c`）；`test/store.test.js` 的 appearance 用例换成「schema 里没有、旧配置读时丢弃、写回不含它」。第 22 / 23 条、事实来源、验证要求、[UI.md](UI.md)、README 与英文版同步；版本 2.8.2。**渲染未在装好 2.8.2 的窗口里复验（本地装的是 2.8.1）**。

## 2.8.1 — 2026-11-27

- **只留银白流光边，另外三种光效删除**（用户：「棱镜流光边改为银白色。停止按钮彩虹环、升空彩虹环、焦散扫光，这3个效果取消。」）：输入卡光学层从四种收成一种。`client.js` 删掉 `STOP_RING_PAD` / `LIFTOFF_MS` / `SWEEP_MS` / `SWEEP_FLOOR_MS` 四个常量、`stopRingBox()` / `liftoffOrigin()` / `sweepDue()` / `isStopControl()` / `stopControlOf()` 五个纯函数、停止环 / 升空环 / 扫光的全部样式与 `ct-prism-orbit` / `ct-prism-liftoff` / `ct-prism-sweep` / `ct-prism-sweep-tint` 四个 keyframes、卡片 click 捕获与 turn 计时（`opticsTurnStart`）、`prefersReducedMotion()` 这套开关判断。`opticsPlan()` 只剩 `rim` 一项（`art === false` 或 `motion === 'off'` 时不渲染；`subtle` 与 `full` 相同），`mountComposerOptics()` 只描卡片矩形并写 `--ct-rim-x` / `--ct-rim-y` / `--ct-rim-strength` 与 `data-on`。流光边颜色由棱镜四色 `--ct-prism-*` 换成三段银白 `--ct-rim-hi / mid / lo`（浅色 `#ffffff / #dfe4ea / #8f98a5`，深色 `#ffffff / #e6eaef / #b3bcc7`）。减少动态效果不再隐藏效果，只去掉 220ms 的淡入淡出。`__test.optics` 只导出 `plan` / `rimPoint` / `findCard` / `mount` / `setDocument` / `reach`；`test/client.test.js` 十条用例改写为九条（283 → **282**），并断言样式表里不得再出现 `ct-optics-stop` / `-liftoff` / `-sweep` / `ct-prism` 与 `@keyframes ct-prism*`。第 23 条、事实来源、验证要求、[UI.md](UI.md)、README 与英文版同步；版本 2.8.1。**渲染未在装好 2.8.1 的窗口里复验（本地装的是 2.8.0）**。

## 2.8.0 — 2026-11-27

- **输入框光学层：上游输入卡的四种光效加入插件**（用户：「停止按钮彩虹环、升空彩虹环、焦散扫光。这4个效果加入插件」，按用户列出的四项实现：棱镜流光边 / 停止按钮彩虹环 / 升空彩虹环 / 焦散扫光，不做换模型的阵营弧光）：`client.js` 新增 `opticsPlan()` 开关表与 `rimPoint` / `stopRingBox` / `liftoffOrigin` / `sweepDue` 四个纯函数，`ComposerOptics` 把一个 `pointer-events: none` 的 `.ct-optics-layer` portal 到 `<body>`，只读宿主 `[data-composer-card]` 的矩形与按钮：① 1px 棱镜流光边（`radial-gradient` 以指针为圆心、两层 mask 只留 1px 描边，指针进入卡片 280px 内点亮、强度随距离递减）；② 停止按钮彩虹环（认 `button > svg > rect` 的方形停止字形，不认本地化 `aria-label`；5 段 conic + `steps(38)` 1.9s，只在 `session.running` 时挂上）；③ 发送升空环（点主按钮时从按钮中心扩散 520ms）；④ 焦散扫光（一轮 ≥6s 的 turn 结束后，1px 光带从右往左掠过卡片上边并整卡淡染 880ms）。宿主输入卡**不改任何样式或子节点**：层是只读叠层，几何用 `getBoundingClientRect` + `ResizeObserver` + 捕获 `scroll` + `resize` 重算，卡片被 React 换掉时重取重绑，指针合并进一个 rAF。开关沿用现有的 `appearance.art` / `appearance.motion`：`full` 全开、`subtle` 只留流光边与彩虹环、`off` 与「光学外观」关闭时整层不渲染，`prefers-reduced-motion` 下停转并隐藏两个瞬时效果。棱镜四色是这层的常量（浅色 / 深色各一套），换三套配色不改彩虹。`test/client.test.js` 新增 10 条（273 → **283**），覆盖开关表、几何纯函数、停止按钮识别、按会话找卡片、mount 的矩形写入与卸载清理、宿主换卡片后重绑、组件树与样式约定。第 23 条、事实来源、验证要求、[UI.md](UI.md)、README 同步；2.7.6 / 2.7.7 移入 [HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.7.7）；版本 2.8.0。**渲染未在装好 2.8.0 的窗口里复验（当前装的是 2.7.7，插件在 npm 上）**。

## 2.7.7 — 2026-11-27

- **文档中英双语**（用户：「更新github说明、中英双语」）：`README.md` 保持中文，顶部加 `简体中文 | English` 切换；新增英文版 [README.en.md](README.en.md)，章节顺序、目录、徽章、表格与中文版一一对应，链接改成从 `docs/` 出发的相对路径。两份 README 的版本引用与徽章一起更新到 2.7.7，测试徽章从 268 修正为 **273**（2.7.6 起就是 273，之前一直是旧数字）。
- **截图全部重拍，只留三张**（用户：「图片换无多余插件截图」，随后「简单2/3张图片展示就可以了」）：旧图是 1.10 时代的产物——`hero.png` 里还挂着 2.5.0 已删除的像素伙伴、旧的侧栏与旧试管样式，`palettes.png` 与 `panel.png` 还画着已经下线的暖炭玄岩 / 暖白画册两套配色和「像素伙伴」开关。现在 `docs/screenshots/` 只有三张：`hero.png`（对话里的试管浮窗 + 输入框上方那一行）、`panel.png`（「模型和组件」页）、`heat.png`（空白会话的用量看板）；`palettes.png` / `skins.png` / `art.png` / `background.png` / `vial.png` / `effort.png` 全部删除。
- **截图由离线渲染舞台重做**（`scripts/stage/render.mjs` + `scripts/stage/shoot.mjs` + `scripts/stage/install.mjs`；`files` 里的 `scripts` 是整个目录，所以它们随包发布，但运行时不加载）：从 `client.js` 原样抽出 `CSS` 模板串，在 `node:vm` 里用一套队列驱动的 hooks 跑真实的 `apply()` 与组件树，把面板五页、dock 行、空白会话卡片与试管浮窗序列化成 HTML，再套 DSH 主题 token 用无头 Chrome 截图（2x DPR）。试管里的液体由真实的 `vendor/obsidian-prism/vial-core.js` 在页面里绘制；推理滑块用 `__test.effort.createSlider` 在页面里现搭。旧的 `temp/preview-build.mjs` 上手写 HTML，因此才会出现「样式表里有、页面里没有」的组件（例如早已删除的 `.ct-component`）。
- **DSH 端插件说明改成「目录 + 正文」**（用户：「DSH端插件说明更新，目录+内容的形式」）：[DETAIL.zh.md](DETAIL.zh.md) 与 [DETAIL.md](DETAIL.md) 从「只有一行图片」变成真正的说明页——目录、它是什么、三个界面（三张新图）、五个分页、四个工具、安装、边界与许可。`test/manifest.test.js` 的断言随之改写：不再要求「恰好一行图片」，改为要求目录块、至少五个分节、目录里的锚点、图片都真实存在，以及正文行数。
- 只动文档、截图与 `PLUGIN_VERSION`；`package.json` 的 `files` 本来就含 `docs`，所以三张新图随包发布，六张旧图从包里消失（包体积略降）。测试仍 **273**（`test/manifest.test.js` 的详情页断言重写，条数不变）。[docs/README.en.md](README.en.md) 新增到文档索引；2.7.4 移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.7.4）；版本 2.7.7。**渲染未在装好 2.7.7 的窗口里复验**。

## 2.7.6 — 2026-11-27

- **空白只看宿主的 `session.blank`，不再用「没有读数」推断**（用户：「切换不同的会话时为什么会看到热力图」）：2.7.0–2.7.5 的条件是 `meter == null`（拿不到 `contextPressure` 就认为空白）。可投影是异步的：切到别的会话时这一行先拿不到新会话的读数，冷会话（重启后没继续聊过的）甚至根本不发，于是模块缓存的用量卡片被画了出来，`data-ct-blank` 一起生效，宿主那一段也跟着被推下去。headless 实测切到 6 天前的会话时有 **17 帧 / 约 250ms** 的卡片 + 位移。
- 现在 `RepoBinding` 读宿主已经给到的 `props.session.blank`（宿主画自己欢迎语用的同一个标志）：`blank === true` 且 `awaitingFirstTurn !== true` 才画卡片；`blank === false` 时哪怕一个读数都没有也只画 dock 行，绝不进空白分支；旧宿主没有这个字段时才回落到读数判断。
- 测试 270 → **273**：新增三条用例（有历史但没读数 → 只有 dock 行；等首轮回复 → 不画；`blank` 为真 → 直接挂卡片），`renderVial` 支持传入 `session`。第 14 条、验证要求、[docs/UI.md](UI.md)、README（§5、升级说明）、AGENTS 变更记录同步；2.7.3 移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.7.3）；版本 2.7.6。**渲染未在装好 2.7.6 的窗口里复验**。

## 2.7.5 — 2026-11-27

- **热力图不跟着宿主那一块下移**（用户：「红圈没有圈热力图，你移下来干什么？」）：2.7.4 把宿主座位推下去之后，卡片是按移位后的座位贴边的，等于连带把热力图也挪到了下面——而红圈圈的只有宿主的欢迎语 + 输入卡。现在 `placeHeatLayer()` **测量前先把 `--ct-seat-shift` 清零**，量到的永远是宿主自己的座位；移位量只写回变量，卡片一律按这个**原始座位**算位置：红圈那块往下走，热力图留在原地。顺带修掉一个真实 bug——旧实现第二次调用读到的是移位后的矩形，`shift` 会算成 0，窗口一 resize 整块就弹回原位。
- **变更记录搬进 `docs/`**（用户：「除了 AGENTS.md，其余文档收到 docs」）：`CHANGELOG.md` → [docs/CHANGELOG.md](CHANGELOG.md)，文件里指向 `docs/*` 的链接改成同级、指向 `AGENTS.md` 的改成 `../AGENTS.md`；`package.json` 的 `files` 去掉根级 `CHANGELOG.md`（`docs` 整个目录本来就在 `files` 里，包里仍然带着它）。README 留在根（GitHub 首页与 npm 包页要用），LICENSE / NOTICE / THIRD_PARTY_NOTICES.md 也留在根（许可与署名识别）。
- 测试仍 **270**。第 14 条、验证要求、[docs/UI.md](UI.md)、README（§5 与升级说明）、AGENTS 变更记录同步；2.7.1 / 2.7.2 的变更记录移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.7.2）；版本 2.7.5。**空白会话的最终渲染只在 headless 注入里验证，未在装好 2.7.5 的窗口里复验**。

## 2.7.4 — 2026-11-27

- **空白会话把宿主那一段（欢迎语 + 快捷按钮 + 输入卡）整块下移**（用户先发截图画圈、再纠正「啥啊，红圈地方往下移，我说卡片了吗？」——红框圈的是宿主的空会话块，2.7.3 只挪了我们自己的卡片，所以屏幕上几乎没动）：先量出根因——空会话里宿主的 `.composerStack` 由宿主自己在聊天区居中，1584×905 窗口实测 seat `y 265 → 680`、下方空着 225px 死区，插件行在不在都不改变它；`docs` 里那条「只读宿主几何、不写宿主节点」的约束因此只能由用户明确要求来打破。
- 实现：`placeHeatLayer()` 先算 `shift = max(0, chatBottom − HEAT_SEAT_GAP(24) − seatBottom)`（该窗口 201px）写进根节点的 `--ct-seat-shift`，样式表只加一条 `body[data-ct-blank='on'] [data-conversation-region='composer'] { transform: translateY(var(--ct-seat-shift, 0px)) }`；`data-ct-blank` 由 `HeatOverlay` 挂载时写入、卸载时连变量一起删除，有 `contextPressure` 读数时整条规则不成立。写完变量必须**重新取一次 seat 矩形**再算卡片位置（transform 会反映进 `getBoundingClientRect`），顺序颠倒卡片会停在旧位置。
- 产物：seat 从 `265 → 680` 变成 `466 → 881`，看板随之落在新的输入区上沿之上，宿主 hero 与输入卡之间仍是原样的间距。这是一次**明确由用户要求的宿主布局覆写**（与 2.5.0 的 `display: none` 同类）：只走 `body[data-ct-blank='on']` + 一个 CSS 变量，空白会话结束即撤销。
- 测试仍 **270**（`test/client.test.js` 补一条样式规则断言，确认那条 `translateY` 只挂在 `body[data-ct-blank='on']` 下）。
- 第 14 条、验证要求、[docs/UI.md](UI.md)（「本机用量热力图」新增第 3 条、禁止项、类名表、检查清单同步）、README（亮点、§4、§5、升级说明）、AGENTS 变更记录同步；2.6.5 / 2.6.6 / 2.7.0 的变更记录移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.7.0，AGENTS.md 回到 65,536 字节预算以内）；版本 2.7.4。**空白会话的最终渲染只在 headless 注入里验证，未在装好 2.7.4 的窗口里复验**。

## 2.7.3 — 2026-11-27

- **看板贴到输入区上沿**（用户发截图、从对话栏画了一条往下的箭头：「移下来不行吗？」）：2.7.2 把卡片垂直居中在「聊天区顶 → 输入区顶」之间，空聊天区里它浮在半空、离下面的对话栏还差一截。现在改成底部对齐——卡片底边落在输入区上沿再减 `HEAT_BOTTOM_GAP`（16px），顶到聊天区顶时保底 12px；窗口矮时先缩宽度再贴边。`placeHeatLayer()` 的公式从 `(room - height) / 2` 换成 `room - height - 16`，其余不动。测试仍 **270**。
- 顺带核实：宿主的空会话 hero（问候语 + 快捷按钮）与输入卡由宿主自己在聊天区里居中，插件行有没有都不改变它们的位置——所以「对话栏在底下」这一条属于宿主布局，插件只挪自己的浮层卡，不碰宿主 DOM（第 14 条）。
- 第 14 条、验证要求、[docs/UI.md](UI.md)、README、CHANGELOG 同步；版本 2.7.3。

## 2.7.2 — 2026-11-27

- **看板搬进聊天区、补齐上游双栏底盘**（用户连着三条：「他的热力图是不是在中间、对话栏是不是在底下？」「为什么热力图抄一半另一半不抄？」「左边红圈放原版DSH位置。」）：①位置。上游把「活跃轨迹」画在对话区里、输入框钉在窗口底部；2.7.1 却把卡片塞进输入框上方那一行，等于把宿主的空会话 hero（问候语 + 快捷按钮）往上顶了一行。现在空白会话里 **`conversation.input.dock` 这一行整行不渲染**（`RepoBinding` 直接返回浮层），卡片经 `ReactDOM.createPortal` 挂到 `document.body` 的 `.ct-heat-layer`（`position: fixed`、`pointer-events: none`、`container-type: inline-size`、`z-index: 20`），按 `[data-conversation-region='chat']` 与 `[data-conversation-region='composer']` 的实测矩形水平居中、在输入区上方垂直居中；窗口不够高就 900 → 360px 逐级缩小，绝不盖住宿主 hero。`HeatOverlay` 监听 `resize` + `ResizeObserver`（层 / chat / composer）重算，只读几何、不写宿主节点。宿主的 hero 回到原版位置，输入卡仍在最底部。
- ②另一半。补上上游的右栏：`.ct-heat-chassis` 是 `62fr 38fr` 双栏 + 1px 分隔线（窄于 660px 堆叠），右栏「模型用量」把每个会话按 `modelSelection.val.lastUsed` 归到模型桶（`readSessionUsage` 新增 `sessionModel()`；窗口内过滤、`tokens > 0` 才上榜、份额按窗口总量算），每行一条 5px 轨道 + 百分比 + 会话数，底部 10px mono 写「连续活跃 N 天 · 窗口 起 – 止」；份额四舍五入到 0 但确实有量时写 `<1%`。
- ③左栏照上游补上标题行右侧的 7天 / 30天 / 全部 分段控件（切换重新取数，强度按窗口内峰值重算、总量 / 活跃日 / 峰值日 / 模型分桶都跟着窗口走）、发丝线下的大号总量与 mono 小字、网格悬停 8px 处的玻璃胶囊；仓库胶囊搬进卡片底部 `.ct-heat-bar`，空会话不再有独立 dock 行。
- `GET /compression-tiers/api/usage` 新增 `?range=7d|30d|all`（未知值回落 `all`），`buildUsageHeatmap()` 多了 `active` / `range` / `streak` / `peakDay` / `models`，客户端按窗口各缓存 60 秒；字典补 `heatModels` / `heatModelNote` / `heatUnknownModel` / `heatNoModels`，删掉 2.7.1 的 `heatRange` 与图例键。
- 测试 269 → **270**：`test/usage-heatmap.test.js` 新增三窗口用例（窗口外 `active=false` 且归零、强度按窗口峰值重算、总量 / 会话数 / 活跃日 / 峰值日跟着窗口走、未知窗口回落 `all`、`streak` 跳过今天这类空尾）；`test/client.test.js` 改为断言双栏底盘（`ct-heat-chassis` / `ct-heat-left` / `ct-heat-right`）、模型行与 5px 轨道、分段控件三个按钮、浮层（`ct-heat-layer` + `ct-skin`）与卡底栏。
- 第 14 条、事实来源、验证要求、[docs/UI.md](UI.md)（「本机用量热力图」整节重写成浮层 + 双栏，类名表、禁止项、检查清单同步）、README（亮点、§5、升级说明）、AGENTS 变更记录同步；2.5.1 / 2.6.3 / 2.6.4 的变更记录移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.6.4）；版本 2.7.2。**空白会话的最终渲染只在 headless 注入里验证（见 `temp/heatmap-preview.png`），未在装好 2.7.2 的窗口里复验**。

## 2.7.1 — 2026-11-27

- **用量热力图按上游 Studio 的排版重做**（用户：「参考obsidian-prism的排版啊，你这样放乱放是吗？」）：2.7.0 把它做成 `width: fit-content` 的裸块——标题与摘要挤在同一行小字里、182 个写死 10px 的方格贴着右缘，读起来像一团随手放上去的控件。上游 `ag-v2-bento-heat-zone` 是一张卡：标题行（左「活跃轨迹」、右时段切换位）→ 满宽网格（`repeat(26, minmax(0,1fr))`，列宽均分、`aspect-ratio: 1` 的方格）→ 发丝线 → 大号总量 + 一行小字（`相当于写下 14.2 本书` + `累计 3.56M Tokens · 1,284 条消息`）。
- 现在 `.ct-heat` 是同一套结构：`width: min(100%, 560px)`、`margin-left: auto`（卡面与仓库胶囊共用右缘）、`--dsw-specific-menu` 底 + 1px `border-l2` + 14px 圆角 + 14/16/13 内边距；`.ct-heat-head` 左标题（12px/600）右图例（「少 → 多」五个 8px 方块）；`.ct-heat-grid` 改成 `grid-template-columns: repeat(26, minmax(0, 1fr))` + `grid-template-rows: repeat(7, auto)` + `grid-auto-flow: column`，格子 `aspect-ratio: 1` 随卡宽缩放、悬停 `scale(1.25)`；`.ct-heat-foot` 一条 `border-top` 后放 `.ct-heat-hero-num`（20px/600/`tabular-nums`）+「Tokens」与 11px 的「近 26 周 · 95 个会话 · 23 个活跃日」。图例从网格下方移到标题行右侧，摘要从标题行移进卡脚。字典新增 `heatTokens`。
- 测试仍 **268**（client 的两条热力图用例改为断言卡片结构：head 里有标题与图例、hero 是 20px 的 `5.12B`、脚注写会话与活跃日、网格按 26 列均分且格子 `aspect-ratio: 1`、`.ct-heat` 是 `min(100%, 560px)` + `margin-left: auto` 且不再有 `fit-content` / `.ct-heat-range`）。
- [docs/UI.md](UI.md)（「本机用量热力图」整节重写 + 类名表 + 禁止项 + 检查清单）、README（亮点、§5、升级说明）同步；版本 2.7.1。实机排版已用注入 shipped CSS + 真实 payload 的截图核对（`temp/heatmap-preview.png`）。2.7.0 的 npm 版本未获批准，可以直接跳到 2.7.1。

## 2.7.0 — 2026-11-26

- **空白会话上方画出本机 token 热力图**（用户先纠正「是新会话token 热力图HUD，不是试管」，再定位置「obsidian-prism中显示在上方、对话栏往下移了吧」）：上游 Obsidian Prism 的 Studio 首页有一条「活跃轨迹」——26 周 × 7 天的方格网格，DSH 没有那块板子。现在同一张网格放进本插件自己的 `conversation.input.dock` 行，**只在空白会话出现**：没有 `contextPressure` 读数时这一行先画热力图（工具区在下面），发出第一条消息、试管拿到读数后热力图整块让位。
- `src/usage-heatmap.js`（新增）只读宿主自己写的会话投影缓存 `<DSH home>/storages/session_projcache/sessions/*.json`：一条会话的 token = `uncachedInputTokens + outputTokens + cacheReadTokens + cacheWriteTokens`，按 `record.identity.createdAt` 的**本地日**归集（缓存没有逐轮时间戳，跨夜会话记在创建日）；坏 JSON、没有 usage 行的会话跳过，目录不存在就是空网格。`GET /compression-tiers/api/usage` 出网格（`weeks` / `firstDay` / `lastDay` / `totalTokens` / `maxDayTokens` / `activeDays` / `sessions` / `columns[w].days[d]{date,tokens,sessions,level,future}`），窗口固定 26 周、周一对齐、今天之后不画，五档强度由 `levelOf()` 按当日峰值取 `floor(4 × log1p(t) / log1p(max)) + 1`。
- 客户端 `UsageHeatmap` 画 10px 方格（`grid-auto-flow: column` + 7 行 = 列优先，一列一周）、五档 `color-mix` 的 accent 18% → 92%、空格 6% 淡底、未来日 3%、悬停给「日期 · token · 会话数」，标题行左侧「活跃轨迹」、右侧摘要（`近 26 周 · 5.13B token · 23 个活跃日`），右下角「少 → 多」图例。`.ct-repo-dock` 因此从单行改成 `flex-direction: column; align-items: stretch`（行宽与胶囊右缘不变），热力图自己 `width: fit-content; margin-left: auto` 贴右缘。客户端按 60 秒缓存，取不到时保留上一次的网格。
- 本机实测（2026-11-26 快照）：**95 个会话 / 23 个活跃日 / 5,133,407,254 token**，窗口 2026-06-01 – 2026-11-29，单日峰值 2026-10-22 的 1.50B。
- 测试 258 → **268**：`test/usage-heatmap.test.js` 6 条（四桶求和与非法桶、缓存读取与坏 JSON、缺目录空网格、26 周周一对齐 + future 标记 + 同日相加、强度单调到 5、本地时区归日）+ client 4 条（空白会话画 182 格、有读数时让位给试管、无缓存不画、dock 行是列布局与五档色阶）。
- 事实来源（新增「本机用量唯一来源」段）、第 14 条、验证要求、[docs/UI.md](UI.md)（新增「本机用量热力图」一节 + 类名表 + 禁止项 + 检查清单）、README（亮点、§5、升级说明、测试条数）同步；2.6.0–2.6.2 的变更记录移入 [docs/HISTORY.md](HISTORY.md)（归档范围改为 1.0 – 2.6.2）；版本 2.7.0。

## 2.6.6 — 2026-11-26

- **没有读数就不画试管**（用户：「新会话的token HUD好像还没有」）：实机核对（headless Chrome 连桌面端 `127.0.0.1:1250`）——空白会话里 `conversation.input.dock` 照常渲染，但 `.ct-vial` 是 `disabled` 的灰胶囊、只写「—」、点不开，而宿主自己的 `ContextMeter` 在第一条消息之前压根不渲染（`[data-composer-dock]` 里 0 个按钮）；对照有内容的会话，试管显示 `9%` 并接管了被美术层隐藏的宿主占用环。根因是 `contextPressure` 在首条消息之前没有值，旧规则要求「取不到就渲染『—』并禁用触发器」，于是空白会话里这支灰胶囊成了唯一的 token UI。
- 现在 `ContextVial` 在 `meter` 为 null 时直接 `return null`：触发器、浮窗、`data-empty` 属性与 `.ct-vial-empty` 样式一并删除，有读数才出现、读数消失（换会话）就跟着消失；dock 行与仓库胶囊照旧渲染，headless 实测空白会话里胶囊右缘仍在任务栏右缘上（`dockRight = pillRight = 1345`，行宽不变）。
- 测试仍 **258** 条：两条旧用例改为「新会话不渲染试管」「有读数才出现」（并断言不再有 `data-empty` / `disabled`）。第 23 条、验证要求、[docs/UI.md](UI.md)、README §5 与升级说明同步；版本 2.6.6。

## 2.6.5 — 2026-11-26

- **2.6.4 装到实机后的两处视觉修正**（用户发截图：「右边缘没对齐，仓库那行左移动对齐任务栏的右边缘。试管底色好像跟对话栏和任务栏底色不一样。」）：
  - **右缘要贴的是宿主 dock 行，不是输入卡本身**：宿主给每个 composer dock 行都套了同一层盒子——在卡宽基础上每边再内缩 `--dsh-composer-dock-inset`（宿主规则是 `width: calc(100% - 2 × clearance - 4 × inset)`、`max-width: calc(card-max - 4 × inset)`，实测任务栏左右各内缩 16px）。`.ct-repo-dock` 原来只按卡宽收窄，胶囊右缘因此比任务栏多出 16px（2560 宽窗口实测 `dockRight - todoRight = +16`、行宽 952 vs 任务栏 920）。现在照抄宿主盒子：`width: calc(100% - var(--dsh-composer-side-clearance) * 2 - var(--dsh-composer-dock-inset) * 4)` + `max-width: calc(var(--dsh-composer-card-max-width) - var(--dsh-composer-dock-inset) * 4)` + `margin: 0 auto`，实测 `dockRight - todoRight = 0`、行宽 920 = 任务栏 920，左右边缘都对齐。
  - **试管底色跟宿主 dock 行同一层表面**：`.ct-vial` 从 `--dsw-alias-bg-layer-2`（#17171b，也是输入卡基色）换成 `--dsw-specific-menu`（#202026，宿主 `TodoPanel` 画的 token），与任务栏同色；截图取色旧值是 (23,23,27) vs 任务栏 (32,32,38)，新值两者都是 (32,32,38)。
- 测试仍 **258** 条：注册用例新增 `--dsh-composer-dock-inset`、`max-width: calc(var(--dsh-composer-card-max-width…` 与 `.ct-vial` 的 `--dsw-specific-menu` 断言。
- 第 14 条、验证要求、README §5 与升级说明、docs/UI.md（「胶囊必须正对输入卡」改成「对齐宿主 dock 行」+ 类名表）同步；版本 2.6.5。实机渲染已验证（headless Chrome 连桌面端 `127.0.0.1:12410`，注入新规则后测量并截图）。
## 2.6.4 — 2026-11-26

- **反转输入框上方 dock 的次序——插件行在宿主原生行上面**（用户更正 2.6.3 的要求：「写错了。任务栏要在对话栏上面，没有任务栏时上到下：仓库栏和试管、对话栏。有任务栏时上到下：仓库栏和试管、任务栏、对话栏。既跟原版对话栏亲密性强的UI优先靠近对话栏，插件次之。」）：`conversation.input.dock` 按 `order` **升序**渲染（上小下大），所以「插件行在上、宿主原生 UI 贴着输入卡」等于取负值：`client.js` 的 `DOCK_ORDER_LAST = 1000` 换成 `DOCK_ORDER_FIRST = -1000`，注册行的 `order` 同步。宿主自己的行——智能体 `todo_write` 起的任务清单条 `todo`（0）、工作树进度 `forge-panel.worktree`（5）、目标条 `goal`（10）、队列 `queue`（20）——从此全部落在仓库行与输入卡之间，上到下固定为「仓库栏和试管 → 任务栏 → 输入卡」；没有任务条时仓库行直接贴在输入卡上方。
- 测试仍 **258** 条：注册用例与「仓库行排在宿主每一行之前」的用例都断言 `order === -1000` 且小于 0 / 5 / 10 / 20。
- 第 14 条「行的次序」段（改成「原生 UI 优先靠近输入卡，插件次之」的产品原则，并禁止把 order 改成非负值）、验证要求、README §5 与升级说明、docs/UI.md（「输入框上方那一行」与类名表）同步；2.6.3 取 1000 的方向正好相反，未获批准、可跳过。版本 2.6.4。**有任务条时的堆叠渲染未验证**。
## 2.6.3 — 2026-11-25

- **把「任务栏 → 仓库栏和试管 → 输入卡」的次序写死**（用户：「任务栏要在对话栏上面。没有任务栏时上到下：仓库栏和试管、对话栏；有任务栏时上到下：任务栏、仓库栏和试管、对话栏」）：`conversation.input.dock` 是 `list` 槽，宿主按 `order` **升序**渲染（`[...rows].sort((a, b) => a.order - b.order)`）。智能体用 `todo_write` 起的「任务」清单条 `todo` 是 order 0、本来就在最上面，工作树进度 `forge-panel.worktree` 5、目标条 `goal` 10、队列 `queue` 20 也都在我们上面；扩展文档自带的示例用 100。本行原来是 order 90，虽然刚好排在所有现存宿主行之后，但只要以后有插件按文档示例取 100，就会插到仓库行和输入卡之间。现在改成常量 `DOCK_ORDER_LAST = 1000`：仓库行永远是输入卡正上方那一行，任务栏永远在它上面，没有任务时这一行直接贴着输入卡。
- 测试 257 → **258**：新增「仓库行是 composer dock 的最后一行」用例，断言 order 同时大于宿主已知的 0 / 5 / 10 / 20 与扩展示例 100、并等于 1000；原有注册用例同步改成断言 1000。
- 第 14 条（新增「行的次序」段）、验证要求、README §5 与升级说明、docs/UI.md（「输入框上方那一行」与类名表，顺手修掉 2.5.0 遗留的「容器查询的容器」）同步；版本 2.6.3。仓库行贴着输入卡已在 headless Chrome 里实测（行 `y=429`、输入卡 `y=463`，行宽 867 与卡同宽），**有任务条时的堆叠未截图验证**。（方向在 2.6.4 按用户更正反转：插件行改到宿主任务条上面；2.6.3 的 npm stage 未获批准、可跳过。）

## 2.6.2 — 2026-11-25

- **「模型和组件」页改成列表，不再一个组件一张卡**（用户：「重新编排『模型和组件』分页的组件和模型，使用列表排列，不要使用一个卡牌排一个组件」）：整页现在只有一张卡片，卡片里是两段列表——一条 `.ct-list-head`（「组件」/「本地模型」）加 `.ct-list` 里的 `.ct-item` 行。行首是名称、钉住版本（数字钉 `v2.76.2`、源码树 `commit 6c43880`）与状态，行尾的 `.ct-actions` 放两个常显按钮（下载在左、重新检测在右）；路径、进度条、二进制明细与错误横跨整行，行与行之间只有 1px 分隔线。下载目录从卡片里的子块改成列表下方的 `.ct-section`。旧的 `.ct-component*` / `.ct-models` 样式与类名整块删除，单行不再有卡片、圆角或底色。
- 测试 256 → **257**：整页只有一张卡片、两段列表、七行 `.ct-item`、每行行尾恰好两个按钮、样式表里不得再有 `ct-component`。
- 第 18 条与验证要求、README §8、docs/UI.md（列表行规格、类名表、检查清单）、client 字典（新增 `componentsListLabel`）同步；版本 2.6.2。

## 2.6.1 — 2026-11-25

- **本地模型下载改走 ModelScope，`hf-mirror.com` 退到第二**（用户实测 2.6.0 面板里 FLUX.2 [klein] 4B「下不动」，问「可以登录 huggingface.co 来下吗」）：登录不解决，也没法解决——`huggingface.co` 在这台机器上 TCP 都连不上（`curl` 21 秒超时），而这个模型在 Hugging Face 上本来就是 Apache-2.0、免登录的，没有可登录的东西。真正的问题是速度：`hf-mirror.com` 能把请求转给 `cas-bridge.xethub.hf.co`，但实测只有约 150 KB/s，7.75 GB 的 transformer 要 14 小时以上。`MODEL_ENDPOINTS` 现在先试 ModelScope 上 BFL 的官方镜像仓库（18 个文件与上游同路径同字节，逐个核对过），同一台机器实测约 38 MB/s；`hf-mirror.com` 与 `huggingface.co` 留在后面兜底。
- **端点结构从字符串改成 `{ host, base, revision }`**：ModelScope 的路径是 `/models/<repo>/resolve/master/<path>`，上游两家是 `/<repo>/resolve/main/<path>`，`modelFileUrl()` 按端点自己的 revision 拼；`DSH_HF_ENDPOINT` 仍按上游形状排在首选，`modelFileUrls()` 的返回值与 `.part` 续传语义不变。
- 测试 255 → **256**：端点顺序与新 URL 形状（`resolve/master` vs `resolve/main`）、三家主机依次回落、`DSH_HF_ENDPOINT` 覆盖。
- 真实下载验证：`D:\Components\models\flux2-klein-4b` 的 18 个文件从 ModelScope 落盘，14.88 GiB 用了 456 秒（约 33 MiB/s，全程没有停住），`modelStatus` 报 installed（18/18、15,980,131,745 字节）。
- README §5 与限制、AGENTS.md 事实来源与验证要求、docs/UI.md、locale 描述同步；版本 2.6.1。

## 2.6.0 — 2026-11-25

- **组件页新增 ComfyUI 与官方 ComfyUI MCP 两棵源码树**（用户：「组件添加ComfyUI+MVC」，确认 MVC = ComfyUI-MCP、范围 = 只下载解压）：`src/components.js` 新增 `comfyui`（钉 `Comfy-Org/ComfyUI` 的 tag `v0.46.0`）与 `comfy-mcp`（钉 commit `6c43880`，它没有 release，分支名不能当钉）。两者都是 GitHub 的 `/archive/<ref>.zip`，资产键用 `any`（同一份归档不分平台），装到 `<下载根>/comfyui` 与 `<下载根>/comfy-mcp`。
- **源码树没有可执行文件**：新增 `marker`（`main.py` / `pyproject.toml`）与 `componentEntryPath()`，安装自检从跑 `--version` 改成找标记文件；`archiveTree()` 剥掉 GitHub 多包的那一层 `ComfyUI-0.46.0/`（只在解压目录里恰好一个目录时剥，其它布局原样保留让标记检查报错），装完就是仓库根。它们不建 venv、不装依赖、不启动服务、不进 PATH，面板路径显示安装根、版本位显示 `· v0.46.0` 与 `· commit 6c43880`。
- **六套统一**：`COMPONENT_ORDER` / `TOOL_DIRS` / `componentRows()` / `componentsPayload` / `toolsStatus.running` 与整体迁移都改成六套；客户端 `COMPONENT_ROWS` 六行，版本位对非数字钉不加 `v`；`prependComponentPath()` 对没有 binary 的项直接返回 false，`parseComponentVersion()` 对没有 `versionPattern` 的项返回 null。
- **顺便补上下载的空闲闸门**（`src/gh.js`，gh / ffmpeg / git / Python / 模型共用）：半开连接上 `fetch` 不会自己报错，ComfyUI 归档实测在 9.8 MB 处停住 8 分钟毫无反应，`pipeline` 就一直等着。现在 `downloadWithResume` 带 `idleTimeoutMs`（默认 `DOWNLOAD_IDLE_TIMEOUT_MS` 60 秒），超过没有新字节即按可重试错误处理，下一次尝试从 `.part` 续传——这也顺带治好了 16 GB 模型下载可能永远「下载中」的问题。测试覆盖「body 停住不来数据 → 重试并从 `.part` 续传」。
- 测试 249 → **255**：`any` 资产在任意平台返回同一份归档、`archiveTree()` 只剥单层包裹、标记文件存在才算 installed、源码树不进 PATH、六行顺序与按钮一致性、迁移集合含新目录；README、AGENTS.md、docs/UI.md、locale 描述同步，2.4.6 / 2.4.7 的变更记录移入 docs/HISTORY.md（归档范围改为 1.0 – 2.4.7）。

## 2.5.1 — 2026-11-25

- **模型下载在国内网络下必失败**（用户实测：`D:\Components\models\flux2-klein-4b` 报 `fetch failed (gave up after 4 attempts)`）：2.5.0 只认 `huggingface.co`，而这台机器上 `huggingface.co:443` 不可达、`hf-mirror.com:443` 可达。现在 `src/models.js` 新增 `MODEL_ENDPOINTS = ['https://hf-mirror.com', 'https://huggingface.co']`：逐个文件按顺序试，镜像失败再回落到上游；`.part` 跨端点共享（字节相同，换端点继续续传，不会重下已下的部分）；`DSH_HF_ENDPOINT` 可覆盖首选端点。两个端点都失败时错误信息列出每个 host 与原因（如 `hf-mirror.com: fetch failed (ENOTFOUND)`），不再只有一句 `fetch failed`。
- **顺手修掉分块响应的长度判定**（`src/gh.js`）：`Number(headers.get('content-length'))` 在没有该头时得到 `0` 而不是 `null`，于是任何 chunked 响应都会被判成「0 字节短读」。现在缺头即视为未知长度；`downloadWithResume` 新增 `expectedBytes` 参数，模型下载把钉住的字节数传下去，这种响应上仍然能做短读校验（不完整文件绝不改名落盘）。gh / ffmpeg / 组件共用这个下载器，一并受益。
- 测试 245 → **249**：`test/models.test.js` 补端点顺序与回落、双端全挂时的错误文案、无 `content-length` 时按钉住字节判短读；`test/gh.test.js` 补「chunked 不当作 0 字节」与 `expectedBytes` 兜底。
- 真实下载验证：用 `startModelDownload` 的 `files` 注入只取两个真实小文件（`model_index.json` 446 B、`transformer/config.json` 541 B），从 `hf-mirror.com` 3.2 秒落地、字节数吻合（同一路径下大文件的 `Range` 也验过返回 206 + `content-range`）。
- README §5 补镜像与排查说明；AGENTS.md 的本地模型事实来源、验证要求同步；2.4.0 – 2.4.5 的变更记录移入 [docs/HISTORY.md](HISTORY.md)，AGENTS.md 只保留 2.4.6 起。

## 2.5.0 — 2026-11-25

- **删掉像素伙伴，输入框上方那一行只剩控件**（用户：「像素伙伴相关功能删除。」）：`MascotStage`、`vendor/obsidian-prism/dual-mascot-rig.js`、`.ct-dock-mascots` / `.ct-mascot-stage` 样式、`appearance.mascots` 字段、外观页的「像素伙伴」开关与 `mascotsLabel` / `mascotsOn` / `mascotsOff` 文案、`@container (max-width: 620px)` 收伙伴规则全部删除；`.ct-repo-dock` 不再需要 `container-type`，改为 `justify-content: flex-end`，`.ct-dock-tools` 仍然右对齐。旧 `settings.json` 里残留的 `mascots` 字段被读侧忽略（不报错、不复活）。`VENDOR_SCRIPTS` 只剩 `vial-core.js`，`NOTICE` 的衍生文件清单同步；`test/vendor.test.js` 断言两个文件都不再随包发布。
- **宿主底栏的上下文环（○ 5%）在美术层打开时隐藏**（用户指的就是 DSH 自己那个 `ContextMeter`）：`body[data-ct-art='on'] [data-composer-dock] button[aria-haspopup='dialog'] { display: none !important }`，读数与三段构成改由试管浮窗承担（和 2.4.6 隐藏 `[data-composer-stat]` 同一套思路）；关掉「光学外观」宿主的控件回来。不加开关（用户：「不需要开启按钮。」）。
- **底光接缝修平**（用户问「这个渐变是不是有断层？」）：2.4.9 在底座上重画渐变时用的是**底座自身高度**的百分比停靠点（底边 accent 16% → 距顶 36px 处 chart-tools 11% → 顶边透明），和上方那条 accent 渐变在接缝处颜色、坡度都对不上，输入框上方那行的顶边会看到一条淡色带。现在不再替换底座的 `background-image`（宿主的遮罩原样保留），改成在 `[data-conversation-region='composer']::before` 上重画**同一条渐变**：`background-size: 100% var(--ct-glow-height, 100%)` 按对话区高度取尺度，再用 `mask-image: linear-gradient(180deg, transparent 0px, #000 36px)` 按宿主遮罩同样的 36px 淡入，两层相消；`--ct-glow-height` 由客户端量对话区 `clientHeight` 写入（`ResizeObserver` + `resize` + 每次会话挂载重测）。截图逐行实测：接缝处单行变化 ≤1/255。
- **「组件」页改名「模型和组件」，新增本地模型下载**（用户：「『组件』改成『模型和组件』，添加本地模型下载 FLUX.2 [klein] 4B 蒸馏 4 步，本地模型单独放一个文件夹。」）：导航与标题改为「模型和组件 / Models & components」。新增 `src/models.js`：钉住 `black-forest-labs/FLUX.2-klein-4B`（蒸馏 4 步、guidance 1.0、Apache-2.0、免登录免同意），只取 diffusers 最小集 18 个文件（transformer 7.75GB + Qwen3-4B 文本编码器两片 8.04GB + VAE 168MB + scheduler / tokenizer），**不**取仓库里重复的单文件 transformer 与预览图；每个文件的大小按 Hugging Face tree API 的 LFS 字节数钉死，下载走 2.4.10 的 Range 续传与短读重试，只有完整文件才 `rename` 到目标路径。模型放在下载根下**单独的 `models/` 目录**（`<root>/models/<id>`），四套组件仍在 `<root>/<id>`；`migrateTools` 现在把 `models` 一起搬并按同一个预检/回滚规则处理，任一下载（含模型）进行中返回 409。新路由 `GET/POST /compression-tiers/api/models`（GET 状态、POST `download` / `probe`，16GB 的任务在后台跑、面板轮询），面板在同一页多一段「本地模型」行：名称 + 状态 + 总量（15.98 GB）+ 进度条 + 当前文件 + 目录 + 下载 / 重新检测两个常显按钮。
- 测试 238 → **245** 条：新增 `test/models.test.js`（钉住的仓库/许可/文件集/总字节/URL、missing / partial / installed 三态与不虚报字节、`.part` 续传与改名、单飞 409、未知 id 404）；`test/tools-path.test.js` 覆盖 `models` 目录与 `running.models`；`test/client.test.js` 覆盖模型行的四种状态与按钮常显、改名后的文案、旧 `mascots` 字段仍能渲染 dock。
- `PLUGIN_VERSION` 与 `package.json` 同步到 `2.5.0`；AGENTS.md（范围、事实来源、第 14 / 23 条、验证要求与变更记录）、README、[docs/UI.md](UI.md)、`locale/*.json`、`NOTICE`、`package.json` 的 `files` / keywords 同步。
- **渲染未验证**：模型行、宿主上下文环的隐藏、底光接缝与试管在真宿主里的观感要装上看；`docs/screenshots/` 仍是 2.4.x 的产物（含已删除的像素伙伴），下次截图时再重出。

## 2.4.10 — 2026-11-25

- **整理 + 代码审查后的修复版**（用户说「整理文件、文档。然后审查代码。」）：整理部分已单独提交（`46d9165`：README 过时描述、死代码、temp 归档、文档链接）。审查用只读审计代理逐文件过了一遍，下面每条都先在代码里复现、再修、再补用例；没有「顺手重构」。
- **`gh` 解压的 PowerShell 兜底其实一直是坏的**（`src/gh.js`）：`powershell.exe -Command 'Expand-Archive … $args[0] …'` 后面跟的参数不会进 `$args`（PowerShell 把它们当命令行的其余部分），实测 `count=0`，兜底永远失败。改成 `& { param($a, $b) Expand-Archive -LiteralPath $a -DestinationPath $b -Force }` 再跟两个路径，失败时把 tar 与 PowerShell 两边的 stderr 一起报出来。`extractArchive()` 增加可注入的 `run`，用例断言参数声明与位置参数。
- **短读的下载会变成永久坏归档**：body 比 `content-length` 短时 `pipeline` 仍然正常结束，`.part` 被改名成归档，之后每次「重试」都解压同一个坏文件。现在 `received !== total` 抛可重试错误（断点续传从磁盘字节继续），只有完整下载才落到归档路径。解压失败、归档里找不到二进制、暂存自检失败同样会删掉归档再抛错，让重试重新下载（`gh` / `ffmpeg` / 组件三处一致）。
- **验证通过的安装被一次清理失败回滚**（`src/ffmpeg.js`、`src/components.js`）：成功路径里的 `rmSync(backup)` 在 Windows 上遇到占用会抛错，落进 `catch` 后删掉刚验证过的新目录、再把旧目录搬回来，用户看到「安装失败」。备份清理改成独立 `try/catch`：清理失败只留一个陈旧备份，不动已装好的版本。
- **迁移失败后永远无法重试**（`src/tools-path.js`）：跨卷 `EXDEV` 走 `cpSync`，复制中途失败会留下半份目标目录，下一次预检看到「源和目标都在」直接 409。现在复制失败（以及复制成功后删源失败）会回滚目标、保留源，重试可以完整跑完。
- **补充规则里的整行围栏标记会截断受管块**（`src/workspace-rules.js`）：如果人在补充规则里写了一整行 START/END，下一次读会在那里提前收尾、下一次保存会把剩余部分当正文抄走。现在保存前就返回 400（`the supplement must not contain a whole line with the fence marker`），文件一个字不动；行内提及仍然允许。顺手给工作区注册表读取加了 BOM 剥离（手改过的 JSON 带 BOM 时原本会「没有任何工作区」）。
- **外观引导的重试是死代码**（`client.js`）：`loadSettingsSnapshot()` 原先在 catch 里返回旧快照（首次为 `null`），所以「失败 → 重试」分支永远不执行，冷启动时还会用默认值盖掉用户的配色。现在首次失败会 reject（有旧快照时仍回退到它），重试真的发生；用例断言第一次失败后**没有**写 `data-ct-*`，重试后才写入。
- **dock 行跟不上面板里的外观改动**：设置快照加了订阅（`subscribeSettings` / `rememberSettings`），面板保存档位或外观后把响应推给 dock，不必等切会话重挂载；dock 的 effect 同时补了 rejection 分支与退订。
- **取不到投影时试管触发器没有禁用**：规则 23 写的是「渲染「—」并禁用触发器」，实现只加了 `data-empty`；现在 `disabled: !meter`，用例断言有/无投影两种状态。
- **动效关掉后扫光还在跑**：`[data-motion='off']` 只暂停了 `.ct-effort-star`，没暂停 `.ct-effort-energy-sweep`；两条选择器合并。菜单按 Esc 关闭后焦点回到触发器（此前留在即将卸载的菜单上）。
- **两处小校验**：`POST /api/settings` 的 `appearance.art` 非布尔现在 400（和 palette / motion / mascots 一致）；`sessionRepos` 的查表改用 `Object.hasOwn`（`constructor` 之类的键不再变成远端）；GitHub 页登录按钮补上禁用时的 `title`。
- 测试 225 → **238** 条：`test/gh.test.js` 补短读重试、PowerShell 兜底参数、双 stderr、设备码解析；`test/tools-path.test.js` 补「复制失败回滚后半程可重试」；`test/workspace-rules.test.js` 补整行标记 400、行内提及放行、带 BOM 的注册表；`test/client.test.js` 补试管禁用态、扫光暂停、设置快照推送、外观引导失败不涂抹；`test/rules.test.js` 与 `test/workspace-rules.test.js` 补「手改的 BOM/CRLF 文件读回已归一，编辑器一打开不会就是脏的」。
- **顺带修掉两处读侧不一致**：`readRules()` / `readWorkspaceRules()` 现在把 BOM 与 CRLF 归一后再交给面板——textarea 拿回来的是 LF，不归一的话一个 CRLF 的 `AGENTS.md` 刚打开就被判成「已修改」，保存按钮一直可点；工作区保存成功后编辑器对齐到服务端归一后的文本（草稿结尾的换行不会再把脏态卡住）。**明确没改**：`MAX_RULES_CHARS` 仍按输入字符计（结尾那一个换行不算超限，不改变已保存文件）；请求路径里的同步读文件保持原样（体积小、失败有兜底）；`Select` 菜单的 Tab 焦点顺序不动（Esc 的焦点归还已补）。
- `PLUGIN_VERSION` 与 `package.json` 同步到 `2.4.10`；AGENTS.md 第 10 / 12 / 17 / 21 / 23 条与验证要求、[docs/UI.md](UI.md) 的动效与试管小节同步。
- **渲染未验证**：试管禁用态、dock 跟随面板、扫光暂停在真宿主里的观感要装上看。

## 2.4.9 — 2026-11-25

- **工作区规则卡不再显示 `AGENTS.md` 正文**（用户说「工作区规则不是说不显示 AGENTS.md 的内容吗？用户写好注入到 AGENTS.md 开头就行了」）：2.4.8 的受管块用 `indexOf` 在**整份文件**里找围栏，而这个工作区的 `AGENTS.md` 在正文里描述受管块时把两个标记各写了一次——于是「正文里那对标记之间」被当成补充规则读进面板，点保存还会把这段正文剥出来重新前置，等于用截断的契约覆盖文件。现在围栏**只认文件开头**：首个非空行必须是 START、END 必须是后面一整行，行内顺口提到的标记一律不算；半个围栏（只有 START 没有 END）按空块处理，保存后不会出现第二个 START，围栏下面那段文字当别人的正文原样保留。
- **底光被输入区底座截断**（用户说「怎么把渐变也给切掉了？」）：2.4.8 把 composer 交还宿主后，`[data-conversation-region='composer']` 底座自带的遮罩（顶边透明、36px 处变不透明 `bg-base`，用来挡住滚出去的正文）也把底光截在底座顶边——用户截图取样 y≈1110 最亮、y≥1190 起回落到 `(10,10,12)` 并保持平直。现在在底座上再画一遍底光、叠在遮罩之上，最后 36px 按遮罩斜率淡出，两层相加正好等于原渐变；36px 以下遮罩已不透明，底光自己铺到窗口底边。选择器 `body[data-ct-art='on'] [data-conversation-region='chat'][data-content-phase='active'] [data-conversation-region='composer']`（特指度 0,4,1 压过宿主的 0,3,0，不用 `!important`），`background-image` 两层——第一层是底光，第二层**照抄宿主遮罩**（整条 `background-image` 会被替换）。只改 `background-image`：卡片底色、遮罩、透明度都没动，正文照样在卡上方被裁住。
- 离线舞台验证（`temp/seat-preview.html` 三个变体，1440×900 截图 + Pillow 取列）：与「没有底座遮罩」的同一渐变相比整列像素差 ≤3/255、行间最大跳变 3/255；2.4.8 的对照在 36px 内从 25 掉到 10 然后全平。
- 测试 222 → **225** 条：`test/workspace-rules.test.js` 新增「标记在正文行内不算围栏」「只提到标记的文件保存后正文逐字保留」「孤儿 START 不产生第二个开头」；`test/client.test.js` 断言底座那一层规则（含 `calc(100% - 36px)` 与照抄的遮罩）、只此一条且只在 active 相位、仍无 `[data-composer-seat]`、卡片规则仍无 `background-color` / `!important`。
- `PLUGIN_VERSION` 与 `package.json` 同步到 `2.4.9`；[docs/UI.md](UI.md) 的「对话区底光」补上底座层与接缝算式、「主题美术」第 6 条澄清 seat 只多一层背景，README §3 与规则段同步。
- **渲染未验证**：底光在真宿主里的接缝观感与底座高度相关，要装上看。

## 2.4.8 — 2026-11-25

- **全局规则与工作区规则合成一页**（用户说「全局规则和工作区规则用同一页面」）：`SECTIONS` 从六页收成五页——档位 / 规则 / 组件 / 外观 / GitHub，规则页上面一张卡是全局 `AGENTS.md`，下面一张卡是所选工作区的规则；`navWorkspace` 文案键一并删除，导航里不再有独立的「工作区」入口。原来「工作区页在清单为空时仍留在导航里、写『目前无工作区』」的约束，改为「工作区卡片仍渲染在规则页里、写『目前无工作区』」。
- **工作区规则改为「注入 AGENTS.md 开头」**（用户说「工作区规则不要显示的 AGENTS.md 内容，注入在 AGENTS.md 开头，没有 AGENTS.md 则创建一个」）：面板不再把工作区 `AGENTS.md` 的正文灌进文本域，文本域里只剩插件自己的受管块——保存时把 `<!-- compression-tiers:workspace-rules:start -->` … `<!-- compression-tiers:workspace-rules:end -->` 插到文件**开头**，块下面原有的正文逐字保留；没有文件就创建。`GET /api/workspace-rules` 只返回受管块内容（`readWorkspaceRules` 先剥围栏），所以别人的那份契约永远不进面板。清空编辑器再保存只去掉围栏、保留文件其余正文，且不会给没有文件的工作区创建空文件。字段标签改为「补充规则（置于 AGENTS.md 开头）」，新增 `workspaceRulesLabel` 键。
- **正文不再透过输入卡**（用户说「文字透过了对话框，应该是在对话栏上方就裁减了才对」）：2.4.2 / 2.4.4 为了旧辉光「到底」关掉了 `[data-composer-seat]` 的底遮罩、把输入卡改成 76% 半透明（`!important`），正文滚到卡下面时会从半透明卡片里透出来。底光在 2.4.6 已改成静态渐变，这两条覆盖随之删除：遮罩回到宿主手里、卡片保持不透明，正文在输入卡上方就被裁住；卡片上的顶光泽与落影保留。
- 测试 219 → **222** 条：`test/workspace-rules.test.js` 重写为受管块的四件事（只读受管块、块前置且正文保留、再次保存替换旧块、空保存不建空文件 / 不清正文），`test/client.test.js` 改成「规则页两张卡 + 五个分页 + 工作区只显示补充规则」，并新增「输入卡不得有底色覆盖、样式表不得出现 `[data-composer-seat]`」的断言。
- `PLUGIN_VERSION` 与 `package.json` 同步到 `2.4.8`；[docs/UI.md](UI.md) 的「地平线辉光」一节改写为「对话区底光」、分页从六页改五页、工作区卡片语义重写，README 的分页表与规则段同步。
- **渲染未验证**：规则页两张卡的配色与高度、正文在输入卡上方被裁住的效果都要装上看。

## 2.4.7 — 2026-11-25

- **中文显示名改为「压缩分档与综合工作台」**（英文 `Compression tiers & workbench`）：用户说「『压缩分档与工具箱 · dsh-harness-toolbox』github 中文名落后了，现在是个综合工作台了」。功能早就不止「压缩分档」——档位、全局与工作区规则、四套托管组件、两套配色与美术层、会话仓库发布，也早就不止「工具箱」。这次只改**显示名**：`locale/zh.json` 与 `locale/en.json` 的 `meta.title`、`client.js` 两个 `DICTIONARIES` 的 `title`、README 的 H1 与三处 `alt`；包名 `dsh-harness-toolbox`、加载器 id、槽位 id、状态目录 `<DSH home>/compression-tiers`、四个工具名**全都不动**，已装用户不用迁移。
- **两处 `meta.description` 开头同步**：中文「加一套光学工具栏」→「加一套综合工作台」，英文「plus an optical toolbar」→「plus a workbench」；`package.json` 的 description 改成「a DeepSeek Harness workbench built around five-tier context compaction」（原文只有压缩分档一面），keywords 增补 `workbench`（保留 `toolbox`，老搜索词仍命中）。
- **README 技术细节修掉两处 2.4.6 遗留的过时描述**：vendor 白名单在 2.4.6 已从三个名字收成两个（`horizon-glow.js` 随渲染器一起下线），但技术细节仍写「约 17 KB 的地平线渲染器 / 只服务这三个文件名」、测试清单里仍写「地平线辉光的挂载」——已改成两个名字并注明 2.4.6 起白名单只剩 `vial-core.js` 与 `dual-mascot-rig.js`。
- `client.js` 的 `PLUGIN_VERSION`（vendor 路由的 `?v=` 缓存失效参数）同步到 `2.4.7`。
- 测试仍是 219 条，但 `test/vendor.test.js` 里那条 `assert.equal(manifest.version, '2.4.6')` 改成**跟着变**的断言：读 `client.js` 的 `PLUGIN_VERSION` 与 `package.json` 的 `version` 比相等——原本每发一版都要改那个字面量，而真正要防的是「忘了同步缓存失效参数」。`test/manifest.test.js` 只断言 `meta.description.length > 40`，不锁显示名，所以改名不动它。
- **渲染未验证**：显示名出现在插件管理器列表与面板标题栏两处，装上看一眼即可。

## 2.4.6 — 2026-11-25

- **背景不再动**：用户说「背景动效不要了吧、改为纯线性渐变」，2.4.6 把 2.4.0 起的 canvas 地平线渲染器整层删掉——`vendor/obsidian-prism/horizon-glow.js`、`auraRuntime` / `auraAllowed` / `auraMotion` / `syncAura` / `drawAuraFrame` / `ensureAuraGlow` / `watchAura`、`.ct-aura-*` 样式、`VENDOR_SCRIPTS` 的第三个名字、`NOTICE` 里的那条衍生声明、vendor 测试一起下线。现在对话区底部只有一条静态渐变：`linear-gradient(to top, accent 16% → chart-tools 9% @26% → transparent @54%)`，挂在 `body[data-ct-art='on'] [data-conversation-region='chat']` 上，没有 canvas、没有帧、没有 `requestAnimationFrame`。
- **输入框下方那行浅色统计字并进试管**：用户在截图里框的就是它（`[data-composer-stat]`：轮/步、tok/s、总 token、缓存命中）。美术层打开时 `display: none !important` 隐藏，同样读数改到试管浮窗底部的「本会话用量」一段：新增纯函数 `vialUsage(tokenUsage, sessionStats)`，读官方 `useProjection('tokenUsage')` 与 `useProjection('sessionStats')`；投影缺失就整行不渲染，不用 0 冒充。四个新文案键（`vialUsage` / `vialUsageCache` / `vialUsageSpeed` / `vialUsageTurns`）。
- 测试仍 219 条（两处用例改写：静态渐变 + 无 aura 控制器；`vialUsage` 读数与 null 回落；vendor 用例改成「渲染器已下线、白名单只有两个」）。
- 截图：新增 `docs/screenshots/background.png`，删除 `aura.png` / `aura-hero.png`。
- **渲染未验证**：截图来自离线舞台，真实窗口里底光与「统计字消失后输入卡上方更干净」的观感要装上看。

## 2.4.5 — 2026-11-25

- **推理滑块补上星尘粒子**：用户说「推理条没有粒子效果」。参考插件 `dsh-codex-effort-slider` 的满档是「紫色星云 + 扫光 + 22 颗星尘」，2.4.1 只抄了轨道几何和满档紫光，能量层和粒子没搬。现在补上：`.ct-effort-energy`（四段紫渐变星云，只覆盖已填充段，强度由 `--ct-effort-energy` 一个变量驱动）+ 扫光 + `.ct-effort-stars` 里 22 颗 3px 星尘，横向整轨 `translate3d(-100%)` 扫过。粒子位置全部由下标算出（相位取黄金比低差异序列、高度取带最小间隔的哈希排列），不用 `Math.random`，重渲染不跳变；`animation-duration` 与负 `animation-delay` 内联在元素上（写进样式表时负相位在真宿主里不生效）。能量曲线按**位置**算：`pct ≤ 1/3` 为 0、`2/3` 为 0.5、满档 1，速度 0.55×–2×（用 `playbackRate` 缩放、不动 duration/delay，所以拖动不会倒着走）；`data-energy='0'` 与外观页动效 `off` 都会 `animation-play-state: paused`。
- **分页切换卡顿**：切页会把所有卡片重建一遍，而每张 `.ct-panel` 都带 `backdrop-filter: blur(22px)`——每个新出现的模糊面都要重新采样背景，4 核机器上就是肉眼可见的顿一下。现在卡片不再模糊（保留半透明底 + 顶光 + `contain: paint`），模糊只留给导航栏一处，半径 26px → 16px。
- 测试仍 219 条（新增星尘数量 / 能量层 / `--ct-effort-energy` 断言；面板用例改成「卡片不得有 `backdrop-filter: blur`、导航栏仍有」）。`docs/screenshots/effort.png` 按 2 倍放大重出，能看到满档的星尘。

## 2.4.4 — 2026-11-25

- **输入卡底遮罩的 `!important`**：2.4.2 想用 `body[data-ct-art='on'] [data-composer-seat]` 关掉 DSH 那条渐到 `bg-base` 的底遮罩，但那台机器装的是 2.4.2、截图里辉光仍被截在卡片上方——原因是 DSH 的遮罩来自 `.root[data-phase='active'] .composerSeat`（特指度 0,3,0），压过了我们只靠属性选择器的规则。现在两条覆盖都加 `!important`，辉光才能真的画到窗口底边。
- 2.4.3 的画布顶部 `mask-image` 一并生效：辉光不再有上下两条硬边。
- 测试仍 219 条。

## 2.4.3 — 2026-11-25

- **辉光顶部不再有一条硬缝**：用户截图（2.4.1）里辉光是一条**两端都有硬边**的横带——下边被输入卡的底遮罩截断（2.4.2 已修），上边是画布自己的顶边：窗口高的时候 `reach` 0.85 的地平线会画到画布之外，于是出现一条横贯对话区的直线。现在画布顶部加 16% 的 `mask-image` 淡出，任何窗口尺寸下都是软过渡。
- 2.4.2 的改动一并生效：美术层只由「光学外观」开关决定（跟随宿主也画），输入卡底遮罩让位、卡片 76% 半透明，辉光一直到底。
- 测试仍 219 条；`docs/screenshots/aura.png` 按 1400×900 重出（顶部已是软过渡）。

## 2.4.2 — 2026-11-25

- **美术层不再依赖「选一套配色」**：用户报「另一台机器升到 2.4.1、新会话既没有渐变也没有动效」。根因是 2.3.0 把美术层绑在「配色 ≠ 跟随宿主」上——而 `跟随宿主` 正是默认值，所以新装的机器上这一整层永远是关的，哪怕开关显示「开」。现在 `applyOptics()` 只按 `appearance.art` 决定 `data-ct-art`（默认开），配色只决定用哪套 token 画：跟随宿主的机器用 DSH 自己的颜色画泛光、气泡与辉光，新会话（含空会话的首页）也有。
- **外观页的「光学外观」开关不再置灰**：它以前在跟随宿主时 `disabled` + `title` 说明；现在任何配色下都能开/关，只由它自己决定美术层。
- **辉光「没到底」**：DSH 的 `[data-composer-seat]` 会在底部 36px 铺一条到 `--dsw-alias-bg-base` 的遮罩，正好把辉光截在输入卡上方。美术层打开时这条遮罩让位（`background: none`），改由输入卡自己半透明（`bg-layer-3` 76%）承担过渡，辉光一直画到窗口底边。
- 测试仍 219 条（改断言：`host + art: true` → `data-ct-art='on'`；外观页开关 `disabled === false` 且没有 `title`）。
- 离线舞台新增「跟随宿主 + 空会话」变体（`temp/aura-hero-host.html`）并出图 `docs/screenshots/aura-hero.png`——就是另一台机器升级后首页应有的样子。
- **渲染未验证**：截图仍来自离线舞台；真实窗口里首页与半透明输入卡的观感要装上看一眼。

## 2.4.1 — 2026-11-25

- **推理滑块换成参考插件的几何**：用户看到 2.4.0 的注入滑块后说「开源的进度条好像不是这个样子的」。上游参考插件 `dsh-codex-effort-slider` 是 28px 胶囊轨道 + 白色圆钮；我们之前自己做了一颗切工水晶旋钮和一条 4px 细轨。现在改成同一套几何：28px 胶囊（底色 `--dsw-alias-border-l1`）、填充用 `--dsw-alias-state-business-primary` 并停在旋钮圆心（`width: calc(14px + (100% - 28px) × 位置)`）、旋钮是 28px 白色圆钮、档位点 3px；**只有满档**才把填充末端转成紫色并给轨道加 `0 0 14px` 紫色泛光（`data-energy='1'`）。切面宝石 SVG 与按位置取色的色阶一并删除。
- **辉光更明显，且不再可能「整层消失」**：真实窗口里 32% 高度 + `reach` 0.72 的辉光只在窗口最底边留一条几乎看不见的边。现在高度 40%、`reach` 0.85、深色强度 0.95；canvas 下面再垫一层 `.ct-aura-fallback`（两个缓慢漂移的径向色块，26s 交替，GPU 合成的 `transform`），在 canvas 报首帧后淡出，渲染器取不到或起不来时它就是这一层，不会留一块死黑。
- **启动时补齐外观**：以前只在启动时读一次设置，读失败（宿主还没就绪）就会让整个美术层整场都不生效。现在失败按 1.5s × 次数退避重试 5 次；动效档位同时写到 `<body>` 的 `data-ct-motion`，CSS 兜底层按它降速或停用。
- 测试仍 219 条：`test/client.test.js` 增补 `data-ct-motion` 写入、`.ct-aura-fallback` 与 `data-ct-motion='off'` 的样式断言；滑块几何用例改成断言填充与旋钮共用同一条中心线。
- 文档：README 的「推理滑块」小节与截图换新（`docs/screenshots/effort.png`）、「会动的背景」小节更新高度与兜底层；[docs/UI.md](UI.md) 的「推理滑块」几何与颜色两条重写、新增兜底层条目；[AGENTS.md](../AGENTS.md) 第 23 条与验证要求同步。
- **渲染未验证**：两张截图都来自离线舞台（真实 `client.js` 样式表 + 真实 `horizon-glow.js` + 无头 Chrome），真实窗口里仍需看一眼。

## 2.4.0 — 2026-11-25

- **补上上游真正的动效**：2.3.0 把美术层补成静态之后，用户问「跟 RMvdesi/obsidian-prism 一样吗？我感觉他有动效呢」。查上游仓库确认：它的动效不是 CSS keyframes，而是 `conv-aura.js` + `ripple-core.js` 里的 canvas 程序化渲染——逐像素画对话区底部的地平线辉光（两个正弦波叠出的 curtain、`valueNoise` 的 jitter、halftone 点阵、深色钴蓝→青 / 浅色宝蓝水彩）。`style.css` 里那批 keyframes 只是 Obsidian 自身 DOM（spinner、思考流、侧栏行）的微交互，DSH 没有对应结构。
- **新增移植文件 `vendor/obsidian-prism/horizon-glow.js`**（2026-12-01 从 `ripple-core.js` 逐字抽出）：`createBrandHorizon2DRenderer` 加它的依赖（`hash` / `valueNoise` / `smooth` / `horizonPrismRgb` / `DEFAULT_HORIZON_AURA` / `clampFinite` / `isCanvasDocHidden`），带出处与抽取说明；**不含** WebGL 渲染器、glyph field、ripple 与 spectrum 检测路径。宿主白名单与客户端 `VENDOR_SCRIPTS` 同步加上这个名字（同源路由照旧、`?v=` 跟着版本走）。
- **控制器在 `client.js`**（`auraRuntime` / `auraAllowed` / `auraMotion` / `syncAura` / `drawAuraFrame` / `watchAura`）：画布作为 `[data-conversation-region='chat']` 的第一个子节点挂在一个 `aria-hidden` 的 `.ct-aura-host` 里，绝对定位贴底 32%、`z-index: 0`，同时把 `[data-conversation-scroll]` 提到 `z-index: 1`——辉光在底色之上、正文之下，不接点击也不参与排版。`rAF` 上限 ~30fps（与上游一致），设备像素比按 `min(dpr, 1.5) × 0.72` 出图。
- **三档动效直接管它**：`full` 原速；`subtle` 速度 ×0.45、强度 0.5；`off` 只画一帧静态图并停止排帧。渲染 `reach` 用 0.72（上游默认 0.47 是给没有输入卡遮挡的画布用的，DSH 的输入卡压住底部约 150px）。`document.hidden` 时不排帧；React 换掉对话区节点时每 1.2s 复核并重新挂载。
- **闸门不变**：`host` 配色或 `art: false` 时连 canvas 都不挂（控制器与静态美术共用 `applyOptics()` 的两个 body 属性），vendor 脚本也是美术层开启后才取。
- 测试 216 → **219** 条：`test/vendor.test.js` 新增出处头 / 抽取范围（不得把 GL、glyph、ripple 路径带进来）/ `mount` 的 resize-draw-clear / 无 2d context 的降级；`test/client.test.js` 新增「挂在对话区第一个子节点且 `aria-hidden`」「`subtle` / `off` / 未知值分档」「`off` 不再排帧」「`host` 切换后画布被移除」「vendor 就绪后先 sizing 再出帧」。
- 文档：README 新增「界面预览 3. 会动的背景」小节与 `docs/screenshots/aura.png`，亮点 / 技术细节 / 测试数同步；[docs/UI.md](UI.md) 新增「地平线辉光」一节（挂载点、三档、重建、为什么不加 keyframes）；[AGENTS.md](../AGENTS.md) 第 23 条拆出「地平线辉光是美术层唯一的动效」、范围 / 事实来源 / 验证要求同步；`NOTICE` 补 `horizon-glow.js` 的衍生声明。
- **渲染未验证**：`docs/screenshots/aura.png` 来自离线舞台（真实 `horizon-glow.js` + 按 DSH 语义属性搭的对话区 + 黑曜 token，由无头 Chrome 截图），真实窗口里的速度与浓度仍需装上后确认。

## 2.3.0 — 2026-11-25

- **补上主题美术这一半**：2.0.0–2.2.1 的「主题预设」只复刻了配色 token，上游 `style.css` 里那层美术（背景泛光、烟熏气泡、发丝分隔线、细滚动条、输入卡光泽）一直没搬——宿主表面换完色仍然是一片平。这次按上游的配方补齐，并且只在**选了配色**时生效。
- **背景泛光**：对话区（`[data-conversation-region='chat']`）底部一层 accent 径向泛光（20% → 66% 处透明）+ 右上角 chart-tools 冷光（11%）+ 顶部 4% 竖向提亮。上游那块是 canvas 着色器（`conv-aura` / `brand-glow`），没有对应 CSS，这里用同一套配色语言重画成静态泛光，不是逐像素复刻。
- **烟熏用户气泡**：`[data-message-bubble]` 改成 16px 圆角、`10px 15px` 内边距、1px 描边；深色加 `linear-gradient(rgba(255,255,255,.022), transparent 55%)` 顶部光泽与 `inset 0 1px 0 rgba(255,255,255,.058)` + `0 6px 20px -10px rgba(0,0,0,.44)`；浅色按上游换 `inset 0 1px 0 #fff` + `0 4px 16px -10px rgba(15,23,42,.10)`。
- **对话栏排版**：正文 `p` / `li` 的 `line-height` 1.72、`letter-spacing` .005em（上游给中日韩正文的同一条处理）；引用块左侧 1.5px accent→冷紫渐变竖条 + accent 4% 横向淡染；`hr` 收成 84% 宽的发丝渐变；对话滚动条 6px、thumb 16% label-primary；输入卡加 3% 顶部光泽（浅色 60%）与更深的落影。
- **开关只有两个 body 属性**：`applyOptics()` 写 `data-ct-palette` / `data-ct-art`，样式表里每条美术规则都以 `body[data-ct-art='on']` 开头；`host` 或外观页「光学外观」关闭时是 `off`，DSH 原样一点不动。选择器只用 DSH 自己的语义属性（`[data-conversation-region]` / `[data-conversation-scroll]` / `[data-message-bubble]` / `[data-composer-card]`、对话区的 `hr` / `blockquote`），不碰哈希类名，命中不到就自然不生效。
- **外观页多一组控件**：`appearance.art`（默认开）与配色 / 动效 / 伙伴并列；跟随宿主时按钮置灰、`title` 写「选一套配色后生效」（第 16 条：禁用要说明原因）。`src/store.js` 与 `client.js` 两侧的归一化都接受 `art`，只有显式 `false` 才关。
- 测试 215 → **216** 条：新增「美术层挂在两个 body 属性上、宿主配色永远不上」（含未知值回落、样式表必须逐条以 `body[data-ct-art='on']` 开头、不得出现哈希类名钩子）与外观页第 4 个开关的断言。
- 文档：README 新增「界面预览 2. 主题美术」小节与 `docs/screenshots/art.png`、亮点 / 技术细节 / 兼容性与限制同步；[docs/UI.md](UI.md) 新增「主题美术（宿主表面）」一节（三层配方、开关边界、不抄的部分）与检查清单；[AGENTS.md](../AGENTS.md) 第 23 条与验证要求同步。
- **渲染未验证**：截图来自离线渲染舞台（按 DSH 的语义属性搭的对话区副本 + 本仓库真实样式表 + 2.2.x 的配色 token），真实 DSH 窗口里的观感（尤其宿主是不是把这些属性都挂上）仍需装上新版本后点一遍。

## 2.2.1 — 2026-11-25

- **推理滑块改成按标签认行，不再按位置认**：官方模型菜单根面板的行里，只有行首标签命中官方 `menu.effort` 文案（`推理等级` / `Effort` 及各语言写法）的那一行才是推理等级行；根面板恰好两行时按官方布局取第 2 行兜底，行更多又没有标签命中就什么都不加。原因是 Codex / 订阅类选择器会往同一个面板里再加 Speed / Verbosity 行——按位置取会把滑条挂到别的设置上，拖一下改的不是推理等级。
- **不再派发 `resize`**：2.2.0 在注入轨道后用 `window.dispatchEvent(new Event('resize'))` 想让官方菜单重新测量高度。参考插件（`dsh-codex-effort-slider@1.1.9`，已装在 DSH 里实测可用）的源码里明确写着不要派发——部分宿主在 `resize` 上挂了「关闭菜单」的兜底监听，派发会让菜单刚打开就收起来。现在官方菜单用 CSS 锚点定位，加高自己会跟着走。
- **会话目录按需重取，不长期缓存**：`directoryFor(sessionId)` 在会话作用域就绪前会抛错，宿主还会在模型代次变化时换掉目录实例。所以每次读、每次写都重新解析；拿不到就按 60 / 240 / 540 / 960 / 1500 / 3000ms 退避重试（第一次重试失败也要继续排下一次，否则一次启动期抖动就是永久失效），换到新实例时退掉旧订阅、重新订阅并按 400ms 节流调一次 `load()`（`load()` 已就绪时直接回缓存，与官方行共享同一份目录）。React 切换子面板时可能复用行、也可能把我们的节点移掉，所以每轮复核「节点仍是该行的下一个兄弟」，丢了就重建。
- 测试 213 → **215** 条：新增「标签优先于位置」（三行菜单，标签命中第 3 行；去掉推理行后剩下的两行不再被认领）、「`directoryFor()` 先抛错后可用」（退避重试接上、换实例后重订阅并跟着重画、节点被丢掉后重建、dispose 清掉会话）。
- 文档：[docs/UI.md](UI.md) 的「推理滑块」一节补「认行靠标签不靠位置」「注入后不派发 `resize`」「目录按需重取」三条与检查清单；README 的滑块段与技术细节同步；[AGENTS.md](../AGENTS.md) 第 23 条与验证要求同步。
- **2.2.0 的 staged 记录未审批发布，由 2.2.1 取代**（2.2.0 那份 tarball 里还是按位置认行、且会派发 `resize` 的版本）。

## 2.2.0 — 2026-11-25

- **配色只留两套，并且跟随 DSH 自己的深浅**：外观页剩「跟随宿主 / 深空黑曜 / 白昼冷晶」。两套配色各自带亮、暗两份 token，宿主切深浅时皮肤跟着切；**删掉了 2.1.0 的 `theme.setTheme()` 写入**——选配色不再改用户的外观偏好（浅色用户不会被一套皮肤掰成深色）。
- **深空黑曜与白昼冷晶现在是两套真的不同的配色**：共享同一条结构色阶（深色近黑石板 / 浅色冷纸白），差在色调——黑曜是靛蓝 accent，冷晶把同一色阶压得更冷（冰青 accent、表面带蓝，深色端 `#070B12`、浅色端 `#EEF6FF`）。因为两套都带两种模式、且模式由宿主决定，所以它们在深色和浅色下都互不相同，不会出现「两个选项看起来一样」。
- **本地皮肤也跟着宿主模式走**：`.ct-skin[data-palette='…']` 每套写两段——默认块给浅色宿主，`body[data-ds-dark-theme] .ct-skin[data-palette='…']` 给深色宿主（`data-ds-dark-theme` 是官方主题 presenter 自己写的属性）。`.ct-skin` 里不再写 `color-scheme`：`html` 上已经有宿主设的那一份，本地再写会打架。
- **下线暖炭玄岩 / 暖白画册**：`APPEARANCE_PALETTES` 变 `host` / `obsidian` / `crystal`，`LEGACY_PALETTES` 把旧值按冷暖性格迁移（`warm → obsidian`、`alabaster → crystal`）；`src/store.js` 与 `client.js` 各留一份同表，升级后旧配置不会白丢皮肤、也不会静默回落成「跟随宿主」。
- 试管不再按配色猜深浅：`paletteIsDark(palette)` 换成 `hostIsDark()`（先读 `body[data-ds-dark-theme]`，再读 CSS `color-scheme`，最后才是 `prefers-color-scheme`）。
- 测试 207 → 208 条：外观页断言改成 3 个色板；皮肤用例改成「两套配色都在主题服务里装成对值、晶体与黑曜的 accent 不同、旧 id 迁移、`host` 只卸载不加层」，并新增「tint 只能覆盖已存在的 token」（拼错的名字会被静默丢弃，这条拦住它）；`test/store.test.js` 新增旧配色迁移用例。
- **推理滑块 + 切工水晶（补上 2.1.0 说「不做」的那一项）**：官方模型菜单根面板第二行是「推理等级」，插件在那行下面注入一条 28px 轨道与一颗切面随档位点亮的宝石旋钮。读写都走官方那条路——`ctx.inject(['modelDirectories'])` → `directoryFor(sessionId).store.getSnapshot()` 读 `groups[].models[].reasoning.efforts`，`directory.select({ provider, model, reasoningEffort })` 写，`store.subscribe()` 同步；因此官方行与触发器副标题会立刻跟着变。**2.1.0 那句「DSH 客户端没有任何 effort 标识」是错的**：那是解包 `app.asar` 时漏了 `dsh-client-ui-model-selection` 与 `dsh-llm-deepseek` 得出的结论，2.1.0 的条目里已加更正。
- **DOM 桥只用语义属性**：`button[aria-haspopup="menu"][aria-expanded="true"]` + `aria-controls` 找菜单、`button[role="menuitem"]` 第 2 行定位、`[data-composer-card]` 判归属；挂载用 `MutationObserver`（childList/subtree + `aria-expanded`）+ store 订阅 + rAF 节流。宿主没有 `modelDirectories`、模型没有档位、只有一档、菜单没开、锚点认不出——一律什么都不加，官方菜单保持原样。
- **写失败不谎报**：`select` 返回 `ok:false`（例如 `session/writer-held`）或抛错时，`.ct-effort-error` 写原因、旋钮退回**宿主确认**的那一档（不是退回上一次乐观值）；写入中 `data-busy='true'` 锁住轨道。切工水晶是自绘 SVG（4 个切面，按位置由冰蓝到紫罗兰），`createElementNS` 不可用时退化成圆点旋钮。
- 测试 208 → 213 条：新增档位映射（含「一档不算滑轨」「别的 provider 的同名模型不认」）、轨道几何与位置色、语义锚点查找（含 1 行菜单 / 关闭菜单 / 无 composer card 的兜底）、注入后与官方行的兄弟顺序、键盘写入 `reasoningEffort`、被拒回滚、关菜单即移除，以及 dock 只挂桥不渲染标记。
- 离线舞台里跑通了整条链路（挂载 → 点击 → 官方行变「最高」→ 旋钮到最右），截图见 `docs/screenshots/effort.png`；真实 DSH 菜单里的最终位置仍需在窗口里确认。
- 文档：README 亮点 / 界面预览（新增「推理滑块与切工水晶」小节与 `screenshots/effort.png`）/ 配色表 / 使用 / 技术细节 / 兼容性改写；[docs/UI.md](UI.md) 新增「推理滑块（注入官方模型菜单）」整节，并同步配色皮肤（两段式、不再写 `color-scheme`）、全局皮肤（删除「选深色会改偏好」那条）、禁止项、落地映射与检查清单；[AGENTS.md](../AGENTS.md) 范围 / 事实来源 / 第 23 条同步；`PLUGIN_VERSION` 与 `package.json` 升到 2.2.0（vendor 路由的 `?v=` 跟着换）。
- 渲染未验证：截图仍来自离线渲染舞台；两套配色在真实 DSH 窗口里切换深浅、以及滑块在真实模型菜单里的位置，都要装上新版本后确认。

## 2.1.0 — 2026-11-25

- **配色改成换整个 DSH 界面**：原来 `.ct-skin[data-palette]` 只覆盖插件自己的节点（面板页、dock 行、portal 菜单、试管浮窗）。现在另外接宿主的主题服务——`ctx.inject(['theme'], …)` 后调 `scope.theme.overrideTokens('compression-tiers', tokens)`，宿主把这一层写成 `<body>` 上的内联 CSS 变量，侧栏、消息气泡、输入框、菜单、卡片、代码块、滚动条、焦点环、阴影一并换色，视觉上就是「整个 GUI 换了一套」。
- **皮肤表**：两套色族 × 两种模式（冷调 / 暖调 × 深 / 浅），四套配色各 62 个 token，全部是 `{ light, dark }` 成对值——主题服务故意拒绝裸字符串，因为单个值在用户切换亮暗后必然读不清；同族的另一模式随皮肤一起装好，事后在「设置 → 外观」手切亮暗也不会花。
- **选深色配色会一并把宿主外观偏好切到深色**（`theme.setTheme('dark'|'light')`，「深空黑曜」在浅色宿主里名不副实）；这是可见、可回退的一次写入。服务缺席（旧宿主）时静默降级，只保留插件自己的皮肤。
- **不做推理滑块与切工水晶**：这两样在上游是给 Antigravity 的模型菜单做的，依赖宿主有「推理等级 / effort」。DSH 的客户端包（chat / conversation / theme / layout / settings 等）里没有任何 `effort`、`reasoningEffort`、`thinkingBudget` 标识，没有可挂的宿主控件；按「不显示假数据」的规矩，不添加拨动后无效果的装饰控件，等宿主暴露真实推理强度再移植。**（本节结论后来被证伪：判断源于一份不完整的 `app.asar` 解包，漏了 `dsh-client-ui-model-selection` 与 `dsh-llm-deepseek`；DSH 确实有真实推理等级，2.2.0 已按官方数据通路移植滑块。）**
- 设置即皮肤：插件启动时读自己的 `settings.json` 把上次的配色装回去，不必先打开外观页；写入失败仍回滚到上一个配色（连同全局层一起回滚）。
- 测试 205 → 207 条：新增「四套配色经主题服务重绘整个界面」用例（每个 token 必须是 `--dsw-*` 且带 light/dark、`host` 只卸载不加层、暖调 / 暖白取到对应底色）。
- 文档：README 的亮点、外观页与技术细节补上全局换肤，兼容性里写明为什么没有推理滑块与切工水晶；[docs/UI.md](UI.md) 增「全局皮肤（宿主主题服务）」小节；[AGENTS.md](../AGENTS.md) 第 23 条同步；`PLUGIN_VERSION` 与 `package.json` 升到 2.1.0（vendor 路由的 `?v=` 跟着换，旧缓存不会跨版本存活）。
- 渲染未验证：跟 2.0.0 一样，截图来自离线渲染舞台；全局 token 的实际观感要在真实 DSH 窗口里换一遍确认。

## 2.0.0 — 2026-11-25

- **移植 [Obsidian Prism](https://github.com/RMvdesi/obsidian-prism) 的光学界面**：`vendor/obsidian-prism/vial-core.js`（浅水波上下文试管）与 `dual-mascot-rig.js`（像素伙伴装配）是上游 `1.0.8-beta.1` 的 UMD 模块，逐字移植，只在文件头部加了出处与修改说明（2026-11-25）。它们不被打包进 `client.js`：新增同源路由 `GET /compression-tiers/vendor/<name>`（只服务这两个文件名，`text/javascript; charset=utf-8`，`cache-control: public, max-age=3600`），客户端用普通 `<script src="…?v=2.0.0">` 按需加载，不用 `eval`、不背 300KB。
- **许可证改为 `GPL-3.0-only`**：`LICENSE` 换成 GNU GPL v3 全文；新增 `NOTICE`（衍生作品声明 + 上游 NOTICE 全文）与 `THIRD_PARTY_NOTICES.md`（上游吸收的 MIT 项目完整声明）。`package.json` 的 `license`、`files`（`vendor` / `NOTICE` / `THIRD_PARTY_NOTICES.md`）与 `exports`（`./vendor/*`）同步。**1.10.3 及更早仍是 MIT。**
- **输入框上方那一行重做**：原来只有仓库胶囊，现在是「像素伙伴 + 工具区」两段——伙伴占 220×84，工具区右对齐放试管触发器、状态小字与仓库胶囊。`.ct-repo-dock` 加 `container-type: inline-size`，`@container (max-width: 620px)` 时伙伴让位，只留控件（按行宽判断，不按窗口宽度）。
- **上下文试管**：`ContextVial` 在工具区渲染一个 26px 胶囊（10×16 的 SVG 迷你试管 + 百分比），点开是 portal 到 body 的浮窗——96×220 的 canvas 交给移植模块跑物理，右侧列出已用 / 窗口 / 压缩阈值 / 保留原文 / 距阈值，下面是系统 / 工具 / 对话三段构成条与图例。数字全部来自官方投影 `contextPressure` 与 `contextBreakdown`，缺失时显示「—」而不是 0；浮窗上拉，Esc / 外部点击关闭并把焦点还给触发器。
- **像素伙伴**：`MascotStage` 用 `'minis'` 编队（小紫猫 + Clawd + 三只迷你蟹）跑 canvas 像素画，点一下 `poke()`；模块加载失败时整块收起，不留空白框。**默认开启**——这是 2.0.0 算大版本的原因之一，不想要就在外观页关掉。
- **外观页（第六个分页）**：配色 5 选 1（跟随宿主 / 深空黑曜 / 暖炭玄岩 / 白昼冷晶 / 暖白画册）、动效 3 档（完整 / 克制 / 关闭）、像素伙伴开关。点选即乐观 `POST /compression-tiers/api/settings`，失败回滚并在卡片底部报错；请求进行中三个控件一起置灰。`src/store.js` 新增 `APPEARANCE_PALETTES` / `APPEARANCE_MOTIONS` / `defaultAppearance()`（`host` / `full` / 伙伴开启）与 `normalizeAppearance()`，`settings.appearance` 在读写两侧都归一化，未知值回落默认。
- **配色是整份 token 覆盖，但只覆盖自己的根**：`.ct-skin[data-palette='…']` 定义在面板页、dock 行、portal 菜单与试管浮窗上，四套值不渗到宿主界面；`host` 是空集。浅色两套同时设 `color-scheme: light`（否则原生滚动条与输入框还是深色），玻璃变量也跟着换（白底高透 + 冷/暖阴影）。
- **动效档位**：`subtle` 去掉分页 / 菜单进场与液面过渡，`off` 再把 `reducedMotion` 传给试管与伙伴；实现只有两条 CSS 加一处 JS 传参，新增动效时必须三档都过一遍。
- 新增 `test/vendor.test.js`（UMD 用 `node:vm` 装载、出处头、GPL 文件、vendor 路由、manifest 许可与 `files`）与外观 / 试管 / 伙伴 / 设置归一化用例；`test/client.test.js` 的 harness 跟着六页与新增 hooks 更新。测试 192 → **205** 条。
- **README 按上游体例重写**：居中图标 + 标题 + 徽章 + 主图、非官方声明、亮点、界面预览（配色表 / 试管 / 伙伴 / 面板）、快速安装、使用、档位与组件表、`<details>` 技术细节、GPL 与上游致谢、开发与目录树；新增 `docs/screenshots/` 五张截图，`docs/DETAIL*.md` 的单图换成 `screenshots/hero.png`（`docs/preview.svg` 删除）。[docs/UI.md](UI.md) 增补配色皮肤、外观页、输入框上方那一行、动效档位与检查清单；[AGENTS.md](../AGENTS.md) 范围 / 事实来源 / 约束 / 验证 / 索引同步。
- 渲染未验证：截图与几何结论来自离线渲染舞台（同源静态预览 + 无头 Chrome，直接运行本仓库 `client.js` 与移植模块）；真实 DSH 窗口（当前安装的是 1.10.1）里的最终观感要装上新版本后刷新确认。

## 1.10.3 — 2026-11-25

- **导航栏不再比卡片高一头**：`.ct-nav` 原来写的是 `position: sticky; top: 18px`。粘性定位的正 `top` 不是「留 18px 呼吸」，而是「相对滚动口把盒子往下压」——于是静止状态下导航栏就比右侧第一张卡片低一截（1400×792 实测：档位页低 13px、规则页低 18px；用户窗口里是 10px）。现在 `top: 0`，导航栏与第一张卡片同在 `.ct-page` 的 `padding-top` 处（实测差值 0），滚动时也不再跳。
- **切页不再横向挪一下**：`.ct-page` 是 `overflow-y: auto` 却没固定滚动条槽，档位页内容短、没有滚动条，规则页内容高、多出一条 15px 的滚动条，内容盒跟着变窄，居中的 `.ct-shell` 就横向位移。加上 `scrollbar-gutter: stable` 后五页实测 `shellLeft` 恒为 318.5、`gutter` 恒为 15。
- **分页进场只淡入**：`ct-page-in` 去掉了 `translateY(3px)`，只留 160ms 的 `opacity 0→1`；位移叠在前两条上，读起来正好是「点击规则的时候页面有小小的位移」。
- 测试 192 条不变：`test/client.test.js` 新增三条断言——`.ct-nav` 必须是 `sticky` 且 `top: 0`（不得出现 `top: 18px`）、`.ct-page` 必须有 `scrollbar-gutter: stable`、`@keyframes ct-page-in` 里不得出现 `transform`。
- 文档：[AGENTS.md](../AGENTS.md) 第 22 条与验证要求、[docs/UI.md](UI.md)（布局、分页导航、动效、禁止项、检查清单）同步写明「正的 `sticky` `top` 会把导航栏推离卡片」。
- 渲染未验证：几何结论来自无头 Chrome（同源静态预览，1400×792 / 600×792）的 `getBoundingClientRect` 测量，真实 DSH 窗口刷新后请再确认一次。

## 1.10.2 — 2026-11-25

- **工作区页常驻**：面板是「导航 + 一次一页」，而工作区页在没有注册工作区时整页消失（1.9.0 起的「清单为空就整块不渲染」，1.10.x 的导航又把这个规则一起继承下来）——分页是固定的地图，不该因为没数据少一格。现在五个分页始终在导航里；打开工作区页时如果没有注册工作区，页面照常显示并写「目前无工作区」，不出选择器与文本域，保存按钮常显、置灰、`title` 写同一条说明。
- **加载态不再冒充空态**：以前「还没读到」和「读到了但为空」都用 `workspaceRules === null` 表示，页面分不出来。现在空清单也是一个已加载结果（`applyWorkspaceRules` 写入 `{ workspaces: [] }`），未加载时显示「正在读取…」，加载完但为空才显示「目前无工作区」。新增 `workspaceNone` 文案键（中/英）。
- 测试 192 条：新增「空清单页仍在导航里并写目前无工作区」「未加载时写正在读取」两条用例，导航断言改成五页恒定（`levels/rules/workspace/components/github`）。
- 文档：[AGENTS.md](../AGENTS.md) 第 21 条与验证要求改写（1.9.0 的「整块不渲染」作废）、[docs/UI.md](UI.md) 增加「空状态写在卡片里，不写进导航」、README 工作区一栏同步。

## 1.10.1 — 2026-11-25

- **删掉 1.10.0 的「许可」页**：那一页列的是本插件与四套托管组件的软件许可（MIT / GPL / PSF），不是要的东西。许可页、`PLUGIN_LICENSE` / `LICENSE_ROWS` 常量、`.ct-license*` 样式与五个字典键全部删除，导航回到五个分页（档位 / 规则 / 工作区 / 组件 / GitHub）。
- **GitHub 页改为显示 GitHub 的授权范围**：账号行下面新增一行 `.ct-scopes`，直接显示 `gh auth status` 报出的 token scope（`授权范围：repo · read:org · workflow`），`overflow-wrap: anywhere` 防止长 scope 撑宽卡片；`gh` 不报 scope 时写「未报告」；未登录或没有 `gh` 时不渲染这一行。缺 `repo` 时仍照旧给一条 `role="alert"` 说明只能读不能推。scope 是 `gh` 的输出，插件不读、不存 token 本身。
- 测试仍 191 条：许可页用例换成「授权范围行」用例（有 scope / 无 scope / 未登录三种），并加了「`navLicense`、`licenseTitle` 等五个键不得回到字典里」「样式表里不得再出现 `.ct-license`」两条回归断言。

## 1.10.0 — 2026-11-25

- **面板改成「液体玻璃外壳 + 左侧分页导航」**：原来那条长滚动 + 两栏拼贴换成一个小外壳——`.ct-shell` 是 `196px minmax(0,1fr)` 栅格（最大 980px、间距 20px），左列固定导航栏，右列**一次只渲染一页**（`key` 切换触发 160ms `ct-page-in` 进场）。六个分页：档位 / 规则 / 工作区 / 组件 / GitHub / 许可；顺序由新的 `SECTIONS` 常量统一给出，没注册工作区时「工作区」页连同导航项一起消失。导航项 34px、12px 圆角，当前页用 `aria-current="page"` + accent 16% 淡染 + 40% 描边 + `inset 2px 0 0` 左竖条 + 柔光。
- **玻璃配方只有一套**：`--ct-glass-fill` / `-rail` / `-sheen` / `-edge` / `-shadow` / `-inner` 定义在 `.ct-page` 上，导航栏与所有卡片共用；卡片圆角 16→20px，导航栏比卡片低一层（layer-2 混合）。画布用三段 accent 径向渐变（26% / 15% / 8%）压在 base 上——玻璃块背后没有明暗差就只是一块灰。
- **修掉容器查询写错位置**：`container-type: inline-size` 原来放在 `.ct-shell` 上，而元素不会被**自己**的容器查询命中，于是外壳留在两栏、`@container` 只把导航项改成横向，结果导航被裁在 196px 的槽里（1.10.0 预览时发现）。现在容器是 `.ct-page`，`.ct-shell` 只做栅格；面板宽度 ≤720px 时导航栏变成页面上方的横向条并**换行**（不用 `overflow-x` 横滚，被裁掉的页面等于没有入口）。
- **新增「许可」页**：本插件 MIT，加四套托管组件的标识与许可全文链接——GitHub CLI（MIT）、Git for Windows / MinGit（GPL-2.0）、FFmpeg（GPL-2.0-or-later）、python-build-standalone（PSF-2.0 · MIT），并说明这些程序不随插件分发、面板下载的是各自发行方的构建。新增 `PLUGIN_LICENSE` / `LICENSE_ROWS` 常量与 `.ct-license*` 样式（名称 + 标识 pill + 链接，链接 `target="_blank" rel="noreferrer noopener"`）。
- **仓库胶囊终于站到输入卡上**：`conversation.input.dock` 渲染在整宽的 `.composerStack` 里，而输入卡自己按 `--dsh-composer-card-max-width` 居中——1.9.x 的整宽行只做到「不贴窗口边」，胶囊停在输入卡右侧很远。`.ct-repo-dock` 现在按 `min(calc(100% - 2 × --dsh-composer-side-clearance), --dsh-composer-card-max-width)` 收窄并 `margin: 0 auto`，胶囊右缘与输入卡右缘对齐。
- 新增 `test/client.test.js` 用例：外壳与导航（一次一页、`aria-current`、工作区页缺席）、容器在页面而不在外壳、窄面板换行、玻璃变量与 20px 卡片圆角、许可页四套组件；旧的 `.ct-page-inner` / `.ct-columns` / `.ct-col` 断言改成「必须不存在」。测试 191 条。
- `actionButton()` 补上 `key: action`：动作行是用数组传给 `actionRow()` 的，真实 React 里每个按钮都需要自己的 key（此前只有测试用的假 React 掩盖了这一点）。
- 文档：[docs/UI.md](UI.md) 重写（玻璃配方、分页导航、布局与容器查询的坑、许可行、胶囊对齐），[AGENTS.md](../AGENTS.md) 第 14/22 条与验证要求同步，README 的使用与许可两节更新。
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
