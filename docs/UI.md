# 面板 UI 规范（dsh-harness-toolbox）

> 本文件约束本插件**自己画**的那部分界面：左侧栏「压缩分档」面板（液体玻璃外壳 + 左侧分页导航）、输入框上方那一行（空白会话的用量热力图、上下文试管与仓库胶囊）、「模型和组件」页的组件与本地模型列表行、外观页的两套皮肤、注入官方模型菜单的推理滑块，以及全部自绘弹层。宿主主题与官方组件（侧边栏、输入框、标题栏）本身不在范围内，也不要试图改它们。

## 目录

- [范围](#范围)
- [表面与颜色](#表面与颜色)
- [配色皮肤](#配色皮肤)
- [主题美术（宿主表面）](#主题美术宿主表面)
- [对话区底光](#对话区底光)
- [间距、圆角与控件高度](#间距圆角与控件高度)
- [排版](#排版)
- [布局](#布局)
- [分页导航](#分页导航)
- [卡片](#卡片)
- [控件](#控件)
- [外观页](#外观页)
- [输入框上方那一行](#输入框上方那一行)
- [输入框的光学层（2.8.0）](#输入框的光学层280)
- [本机用量热力图（空白会话）](#本机用量热力图空白会话)
- [推理滑块（注入官方模型菜单）](#推理滑块注入官方模型菜单)
- [下拉与弹层](#下拉与弹层)
- [动效](#动效)
- [焦点与可访问性](#焦点与可访问性)
- [禁止项](#禁止项)
- [落地映射](#落地映射)
- [检查清单](#检查清单)

## 范围

- 只用主题 token（`--dsw-alias-*`），不写死主题色；阴影、高光与玻璃高光允许 `rgba(0,0,0,…)` / `rgba(255,255,255,…)`。整份覆盖 token 的只有两套配色皮肤（见下一节），它们也只作用在插件自己的根节点上。
- 面板、外观页、输入框上方那一行与弹层必须在深色、浅色两套主题下都能读：任何「深色底 + 继承浅色字」的组合都不算可用设计。
- 界面只放控件标签、当前值、路径与错误；教学性说明按 [AGENTS.md](../AGENTS.md) 第 15 条写进文档，不写进面板。

## 表面与颜色

主题 token 与深色主题的解析值（浅色主题由宿主给出对应值，插件不感知）：

| 用途 | token | 深色解析值 |
| --- | --- | --- |
| 页面底色 | `--dsw-alias-bg-base` | `#151517` |
| 卡片、胶囊 | `--dsw-alias-bg-layer-2` | `#2c2c2e` |
| 弹层、菜单 | `--dsw-alias-bg-layer-3` | `#353638` |
| 选中底、主操作底 | `--dsw-alias-bg-module-platform` | `#353638` |
| 一级描边 | `--dsw-alias-border-l2` | `rgba(255,255,255,.12)` |
| 二级描边（玻璃边缘） | `--dsw-alias-border-l3` | `rgba(255,255,255,.16)` |
| 选中描边 | `--dsw-alias-border-selected` | `#adb2b8` |
| 正文 | `--dsw-alias-label-primary` | `#f9fafb` |
| 次要文字 | `--dsw-alias-label-secondary` | `#cfd3d6` |
| 弱化文字（路径、字符数） | `--dsw-alias-label-tertiary` | `#adb2b8` |
| 悬停底 | `--dsw-alias-interactive-bg-hover` | `rgba(255,255,255,.08)` |
| 强调色（accent） | `--dsw-alias-state-business-primary` | `#7aaaff` |

- **层级靠表面递进**：玻璃画布 → 导航栏/卡片（layer-3 与 layer-2 的半透明混合）→ 弹层（layer-3 不透明）。弹层不得继续用 layer-2：它和卡片同色，浮在页面上就像一行浮着的文字。
- **允许在 accent 上做淡染**：`color-mix(in srgb, var(--dsw-alias-state-business-primary) 12–20%, transparent)` 用于悬停、选中、选中行的左竖条。
- **液体玻璃只有一套配方**，在 `.ct-page` 上定义、由导航栏与所有卡片共用：

| 变量 | 值 | 作用 |
| --- | --- | --- |
| `--ct-glass-fill` | layer-3 58% + transparent | 卡片底 |
| `--ct-glass-rail` | layer-2 62% + transparent | 导航栏底（比卡片低一层） |
| `--ct-glass-sheen` | `linear-gradient(158deg, rgba(255,255,255,.16), …0)` | 顶部斜向高光 |
| `--ct-glass-edge` | `--dsw-alias-border-l3` | 1px 边缘 |
| `--ct-glass-shadow` | `0 24px 60px rgba(0,0,0,.42)` + `0 2px 10px rgba(0,0,0,.22)` | 浮起 |
| `--ct-glass-inner` | `inset 0 1px 0 rgba(255,255,255,.16)` + `inset 0 -1px 0 rgba(0,0,0,.2)` | 内高光与底边压暗 |

- **画布要有可折射的东西**：`.ct-page` 的底色是三段 accent 径向渐变（左上 26%、右上 15%、左下 8%）加一层从 accent 轻染到 `bg-base` 的线性渐变；玻璃块没有背后的明暗差就只是一块灰。渐变是面板里唯一的装饰性画布，其余一律落在 token 上。
- 玻璃块只有**导航栏**保留 `backdrop-filter: blur(16px) saturate(150%)`；卡片（`.ct-panel`）**不模糊**——切页会把所有卡片重建一遍，每张都是一个要重新采样背景的模糊面，是切页卡顿的来源；卡片靠 `--ct-glass-fill` 半透明底色 + 顶光 + `contain: paint` 撑住观感。边缘 1px `--ct-glass-edge`，不加第二层描边。

## 配色皮肤

「跟随宿主」是默认值，也是唯一不覆盖任何颜色的皮肤；另外两套在 `.ct-skin[data-palette='…']` 上定义 token，且**每套都写亮暗两份**——皮肤跟随 DSH 自己的深浅，配色不再左右宿主的外观偏好。

| 皮肤 | `data-palette` | 模式来源 | 深色画布 `bg-base` | 浅色画布 `bg-base` | accent（深 / 浅） |
| --- | --- | --- | --- | --- | --- |
| 跟随宿主 | （属性缺省或 `host`） | 宿主 | 宿主 | 宿主 | 宿主 |
| 深空黑曜 | `obsidian` | `body[data-ds-dark-theme]` | `#0a0a0c` | `#e6edf6` | `#6f9bff` / `#2f6fed` |
| 白昼冷晶 | `crystal` | `body[data-ds-dark-theme]` | `#070b12` | `#eef6ff` | `#48c6f5` / `#0f96c8` |

1. **只挂在 `.ct-skin` 上**：面板页根、输入框上方那一行、portal 到 body 的菜单与试管浮窗各带一个 `.ct-skin` 与 `data-palette`。绝不往 `:root` / `body` 写变量——那会改到宿主界面（`body[data-ds-dark-theme]` 只作为**选择器条件**读，不写）。
2. **每个皮肤两段**：默认块是浅色宿主读到的值，`body[data-ds-dark-theme] .ct-skin[data-palette='…']` 是深色宿主的值。官方主题 presenter 自己会设这个属性，所以它是唯一可靠的「宿主当前是深色」信号；不要用 `@media (prefers-color-scheme)`（系统偏好与 DSH 主题不是一回事），也不要在这里写 `color-scheme`（`html` 上已有宿主设的那份，本地再写会打架）。
3. **玻璃变量跟着皮肤走**：深色那段的 `--ct-glass-fill` / `-rail` / `-sheen` / `-shadow` 用白高光 + 重阴影，浅色那段换成白底高透 + 冷色阴影，并补 `--ct-glass-inner` 的白色内高光。换皮肤等于换一整套玻璃配方，不是只换底色。
4. **图表三色**（`--dsw-alias-chart-system` / `-tools` / `-messages`）每套皮肤都要给，试管的三段构成条与图例直接用它们。
5. **新增皮肤要同时改四处处**：`PALETTES`（外观页选项）、`.ct-swatch-band[data-choice='…']`（色带）、`.ct-skin[data-palette='…']` 的浅色与深色两段，再补一条 `test/client.test.js` 断言。
6. **旧配色要迁移，不要静默丢弃**：`src/store.js` 的 `LEGACY_PALETTES` 把 2.0.0 的 `warm` / `alabaster` 映射到现存的深 / 亮两套；`client.js` 里也保留同一张表，任何一侧改了都要改另一边。

### 全局皮肤（宿主主题服务）

上面那两套 token 只作用在插件自己的节点上；要让**整个 DSH 界面**一起换，走宿主官方的主题服务：

```js
ctx.inject(['theme'], (scope) => {
  const dispose = scope.theme.overrideTokens('compression-tiers', tokens)
  return () => dispose()
})
```

1. **成对值**：每个 token 必须是 `{ light, dark }`，服务会直接拒绝裸字符串——一个值在用户切换亮暗后必然读不清。两套模式都要给，宿主自己挑那一半。
2. **只叠一层**：`overrideTokens` 是命令式且返回自己的 disposer；换配色时先 dispose 旧的再装新的，不要在同一 source 上反复叠加。
3. **别偷偷改用户的主题偏好**：2.0.0 选深色配色会把宿主外观偏好切到深色，2.2.0 去掉了这次 `setTheme` 写入。皮肤自带两套模式就够了，掰用户偏好的副作用（浅色用户被迫变深色）比收益大。
4. **服务缺席要降级**：`theme` 是可选的，`ctx.inject` 拿不到时插件照常工作，只是不重绘整个界面。
5. **不要用宿主 class 名硬改结构**：DSH 的界面是 CSS Modules 哈希类名，只有 token 是稳定契约；气泡、侧栏这类结构只用 `--dsw-specific-*` 换色，不改几何。

### 主题美术（宿主表面）

token 换色只解决颜色，宿主表面仍然是平的一片。2.3.0 起把上游 `style.css` 里**能用语义锚点表达**的那部分美术搬过来，由外观页「光学外观」开关控制（默认开）；配色只决定用哪套 token 画，`host` 下就用 DSH 自己的颜色画：

1. **只认语义属性**：`[data-conversation-region='chat']`（对话区画布）、`[data-conversation-scroll]`（滚动条）、`[data-message-bubble]`（用户气泡）、`[data-composer-card]`（输入卡）、对话区里的 `hr` / `blockquote`。这些是 DSH 自己写在 `src/client/chat/*` 里的属性，不是哈希类名；任何一条选择器命中不到就自然不生效。
2. **开关只有两个 body 属性**：`data-ct-palette` 与 `data-ct-art`，由 `applyOptics()` 写入（`host` 或开关关闭时 `data-ct-art='off'`）。样式表里每条美术规则都必须以 `body[data-ct-art='on']` 开头——**禁止**写裸 `body` / `:root` 的背景，否则跟随宿主的用户也会被改观。
3. **画的就是这三层**：对话区底光（底部一条 accent → 冷色的静态线性渐变，见下一节）+ 用户气泡 16px 圆角、`10px 15px` 内边距、深色加 `linear-gradient(rgba(255,255,255,.022), transparent 55%)` 与 `inset 0 1px 0 rgba(255,255,255,.058)` + `0 6px 20px -10px rgba(0,0,0,.44)`，浅色换成 `inset 0 1px 0 #fff` + `0 4px 16px -10px rgba(15,23,42,.10)`；输入卡一层 3% 顶部光泽（浅色 60%）与更深的落影。
4. **引用块与分隔线**：`blockquote` 左侧 1.5px accent→冷紫渐变竖条（`::before`，上下各留 2px）+ accent 4% 的横向淡染；`hr` 是 84% 宽度的发丝渐变，不占额外高度。
5. **排版只放宽行距**：对话区 `p` / `li` 的 `line-height` 1.72、`letter-spacing` .005em（上游给中日韩正文的同一条处理），字号、字重、颜色一律不动。
6. **输入卡归宿主自己**：`[data-composer-card]` 只加光泽与落影，**不**改它的底色；`[data-composer-seat]` 的遮罩（把滚出去的正文裁在输入卡上方）一律保留，2.4.2 为了旧辉光「到底」把遮罩关掉、卡片改 76% 半透明，结果正文透过卡片，2.4.8 全部撤回。2.4.9 试着让 seat 自己重画一遍底光，但 seat 是 sticky + `z-index` 的层叠上下文，重画的那条和对话区渐变的下沿接不上（2.5.0 修的「断层」）。现在唯一允许碰 seat 的是 seat 上的 `::before` 伪元素（2.5.0）：`position: absolute; inset: 0; z-index: -1`，画的就是同一条渐变，见下一节第 4 条——遮罩本身与 seat 的其它属性一概不动。
7. **美术层自身不加 CSS keyframes**：静态部分全是渐变，没有任何逐帧动画；`data-motion` 只影响试管与旋钮的过渡。
8. **不抄的部分**：壁纸、Omni 检视台、思考转译、配额遥测都不在本插件范围内。

### 对话区底光

2.4.6 起美术层的背景只有一条静态渐变，2.4.0–2.4.5 那套 canvas 地平线渲染器（`horizon-glow.js`）已连同控制器一起删除，**不得**加回，也不得再引入任何背景动画。

1. **挂在哪里**：`body[data-ct-art='on'] [data-conversation-region='chat']` 上的 `background-image`，绝对不生成节点、不接点击、不参与排版；`position: relative` 只为让这层落在对话区自己的坐标系里。
2. **画什么**：`linear-gradient(to top, accent 16% → chart-tools 9% @26% → transparent @54%)`，`background-repeat: no-repeat`、`background-position: bottom`——底部一条向上淡出的冷光。
3. **为什么是静态的**：逐帧重绘的 canvas 在 4 核机器上就是切页与滚动时那点卡顿的来源，而同一张图用 CSS 渐变表达时浏览器只需要合成一次。用户看到的「动的带子」也一并消失。
4. **和输入卡的关系**：渐变铺满整个对话区，底部被宿主的 seat 遮罩与输入卡盖住——这正是「正文在输入卡上方就被裁住」的效果，不要为了多看一截底光去动 composer 的遮罩或透明度。**2.4.9 补上被遮罩吃掉的那一截，2.5.0 修掉接缝**：seat 自己的遮罩从透明渐变到 `bg-base`（36px），底光因此停在 seat 顶边（用户报的「渐变被切掉了」）。2.4.9 让 seat 自己重画一遍 `background-image`，可 seat 是 sticky + `z-index` 的层叠上下文，重画的那条只覆盖 seat 那一条，和对话区渐变的下沿接不上——用户看到的「断层」就是这条缝。2.5.0 把那条规则整条删掉，改成 seat 上的 `::before`：
   - 选择器 `body[data-ct-art='on'] [data-conversation-region='chat'][data-content-phase='active'] [data-conversation-region='composer']::before`；只认 active 相位——hero / settling 没有这条遮罩，也就不需要这一层。
   - `content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none`。seat 本身是 sticky + `z-index: 9` 的层叠上下文，负 z 的伪元素落在 seat 背景**之上**、输入卡**之下**，所以既盖住遮罩、又不会跑到卡上面。
   - 底图就是**同一条**渐变（`to top`、`background-repeat: no-repeat`、`background-position: bottom`），`background-size: 100% var(--ct-glow-height, 100%)`；再用 `mask-image: linear-gradient(180deg, transparent 0px, #000 36px)` 按遮罩斜率淡出顶边，接缝处没有台阶。
   - `--ct-glow-height` 由脚本实测：`measureGlow()` 取 `[data-conversation-region='chat'].clientHeight` 写进 seat 的行内样式，`watchGlow()` 用 `ResizeObserver` + `window resize` + 每次 dock 挂载重算，宿主换掉节点时重新绑定。**不得**用固定像素高度顶替测量。
   - seat 的 `background-image`、卡片底色、遮罩、透明度一概不动，正文照样在卡上方被裁住。
5. **宿主统计字并进试管**：美术层打开时 `body[data-ct-art='on'] [data-composer-stat] { display: none !important }` 隐藏宿主自己的 usage / activity 药丸，同样的读数改由试管浮窗底部的 `.ct-vial-usage` 一段呈现（`vialUsage()` 读官方 `tokenUsage` / `sessionStats` 投影，缺投影整行不渲染）。
6. **宿主上下文环一并隐藏（2.5.0，无开关）**：输入框底栏那颗 `○ 5%` 是宿主自己的 `ContextMeter`（`[data-composer-dock]` 里一个 `aria-haspopup='dialog'` 的按钮，只有哈希类名可用），和试管里的占用重复。只加一条 `body[data-ct-art='on'] [data-composer-dock] button[aria-haspopup='dialog'] { display: none !important }`；关掉「光学外观」宿主自己回来。**不要**给它加开关、不要改它的 DOM 或文案，也不要顺手改 `[data-composer-dock]` 的布局。

## 间距、圆角与控件高度

| 刻度 | 用途 |
| --- | --- |
| 3px | 导航项之间 |
| 4px | 图标与文字、状态行之间 |
| 6px | 弹层内边距、字段内部 |
| 8px | 按钮之间、弹层与触发器之间 |
| 12px | 卡片内主间距、表单行 |
| 14px | 页面内卡片之间、窄面板导航与页面之间 |
| 20px | 导航栏与页面之间 |
| 22 / 24px | 页面边距 |

| 圆角 | 用途 |
| --- | --- |
| 8px | 代码块、小标签 |
| 10px | 按钮、输入框、弹层选项 |
| 12px | 导航项 |
| 14px | 档位按钮、文本域 |
| 16px | 弹层、窄面板的横向导航栏 |
| 20px | 卡片、导航栏（宽面板） |
| 999px | 胶囊 |

| 高度 | 用途 |
| --- | --- |
| 22px | 皮肤色带（`.ct-swatch-band`） |
| 26px | 输入框上方的仓库胶囊、试管触发器 |
| 30px | 面板动作按钮 |
| 34px | 导航项、下拉触发器、弹层选项、动效分段按钮 |

## 排版

| 角色 | 字号 / 行高 / 字重 |
| --- | --- |
| 导航栏品牌行 | 11 / 15 / 600，`letter-spacing: .1em`，大写，`label-tertiary` |
| 导航项、卡片标题 `h3` | 13 / 20 与 15 / 22 / 600 |
| 正文、按钮、字段标签 | 13 / 20 / 400 |
| 状态行、次要说明 | 12 / 18 / 400 |
| 弹层分组标题 | 11 / 15 / 600，`letter-spacing: .1em`，大写 |
| 弹层元信息、scope 列表 | 10–11 / 14–16 / 400 |

等宽字体只用于二进制名与验证码（`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`）。

## 布局

- 面板自身是滚动容器：`.ct-page` 为 `flex: 1 1 auto; overflow-y: auto`，内边距 `22px 24px 48px`。
- **滚动条槽固定**：`.ct-page` 带 `scrollbar-gutter: stable`。分页高度不同，短页没有滚动条、长页有；不预留槽位时内容盒会窄 15px，居中的 `.ct-shell` 就横向挪一下——切页时的「小小位移」有一半来自这里。
- **一个外壳、一次一页**：`.ct-shell` 是 `grid-template-columns: 196px minmax(0, 1fr)`、间距 20px、最大宽 980px 居中；左列是固定导航栏 `.ct-nav`，右列是当前页 `.ct-content`（`key` 随分页变化，触发 160ms 进场）。不再有整页长滚动与两栏拼贴。
- **容器查询的容器是 `.ct-page`**（`container-type: inline-size`），不是 `.ct-shell`：元素不能被自己的容器查询命中，把 `container-type` 放在 `.ct-shell` 上时，`@container` 里对 `.ct-shell` 的规则不会生效——外壳留在两栏、只有子元素被改成横向，导航项会被裁在 196px 里。
- **按面板宽度判断，不按窗口宽度**：左侧栏占掉窗口的一段固定宽度，1200px 的窗口留给面板的远不到 1200px；用 `@media` 会在「窗口够宽、面板不够宽」时错判。容器查询不可用的环境退回两栏，这是可接受的降级。
- **窄面板（≤720px）**：导航栏变成页面上方的横向条（`flex` + `flex-wrap: wrap`，6px 内边距、16px 圆角、品牌行隐藏），导航项 `width: auto`、34px 高。必须换行，不能用 `overflow-x` 横滚——被裁掉的页面等于没有入口。
- 卡片高度由内容决定（`align-items: start`）。
- 不允许用负 margin 贴边；需要与宿主的 dock 行对齐时用 `--dsh-composer-side-clearance`、`--dsh-composer-dock-inset` 与 `--dsh-composer-card-max-width` 把行**收窄并居中**（见「控件」里的胶囊）。
- **dock 行的表面色跟宿主走**：试管触发器 `.ct-vial` 用 `background: var(--dsw-specific-menu)`——宿主的任务栏（`TodoPanel`）就画这个 token；用 `--dsw-alias-bg-layer-2` 会比任务栏和输入卡都暗一档（2.6.4 的实机观感，2.6.5 修正）。

## 分页导航

1. 五个分页固定顺序：档位（`levels`）、规则（`rules`）、模型和组件（`components`）、外观（`appearance`）、GitHub（`github`），由 `SECTIONS` 常量统一给出。**五个分页始终都在导航里**：某个页面没有数据时页面照常打开、在页内说明状态，不能因为没数据就把页面或导航项拿掉——分页是固定的地图，不是可选清单。2.4.8 起全局规则与工作区规则合并在同一页（`rules` 一张卡放全局 `AGENTS.md`，下一张卡放所选工作区的补充规则），独立的「工作区」分页删除；2.5.0 起「组件」页改名「模型和组件」，页尾多一段本地模型；2.6.2 起六套组件与本地模型并成一张卡片里的两段列表（见「卡片」里的列表行）。
2. 导航栏 `.ct-nav`：`position: sticky; top: 0`，玻璃底（`--ct-glass-rail`）+ 20px 圆角 + 内高光；品牌行是 14px 的 accent 图标 + 11px 大写文字。**`top` 只能是 0**：正值会把导航栏相对滚动口重新定位，静止状态就往下一段，导航栏顶部与右侧第一张卡片对不齐（1400×792 实测 `top: 18px` 时档位页差 13px、规则页差 18px，用户看到的就是「点击规则的时候页面有小小的位移」）。`top: 0` 下静止时两列都在 `padding-top` 的 22px 处（实测差值 0），滚动时导航栏也不再跳动。改回正值前先读这一条。
3. 导航项 `.ct-nav-item`：34px 高、12px 圆角、15px 图标 + 13px 文字、`justify-content: flex-start`；默认透明底 + 透明描边。
4. 当前页用 `aria-current="page"` 标记，样式是 accent 16% 淡染 + 40% accent 描边 + `inset 2px 0 0` 左竖条 + 22px 柔光；图标转 accent。**不要**用右侧箭头或加粗字号来区分。
5. 导航项必须是 `<button type="button">`，带 `data-section`（测试与样式共用），Enter/Space 切换；不用链接、不用 tab 角色。
6. 切换分页不写状态到宿主：当前分页只是面板内的 `useState`，刷新回到「档位」。

## 卡片

每张卡片三段，顺序固定：

1. **标题行**：`.ct-rules-head > h3`；档位卡片标题为「档位」。
2. **内容**：字段（`.ct-field`）、状态行（`.ct-status`）、说明或路径（`.ct-note`）。
3. **动作行**：`.ct-actions`，一行只放按钮；状态文字另起一行。列表页的行把 `.ct-actions` 放在行尾（`grid-column: 2`），里面同样只放按钮。

样式：`border: 1px solid var(--ct-glass-edge)`、`border-radius: 20px`、`background: var(--ct-glass-fill)` + `--ct-glass-sheen`、`padding: 16px 18px`、内部 `gap: 12px`，配 `--ct-glass-shadow` 与 `--ct-glass-inner`。

- **授权范围** `.ct-scopes`：GitHub 页在账号行下面单独一行显示 `gh auth status` 报出的 token scope（`repo · read:org · workflow`），12px `label-tertiary`，`overflow-wrap: anywhere`（scope 是一个长串标识符，不能把卡片撑宽）。缺 `repo` 时另起一条 `role="alert"` 状态行说明只能读不能推；scope 由 `gh` 报出，插件不读、不存 token 本身。
- **空状态写在卡片里，不写进导航**：还没注册工作区时，规则页的工作区卡片仍然渲染，标题行下面用一条 `.ct-note`（`role="status"`）写「目前无工作区」，不渲染选择器与文本域，保存按钮常显、置灰、`title` 与这条说明一致；还没读到时写「正在读取…」（不要拿「无工作区」冒充加载态）。任何页面都不得因为数据为空而整页消失。
- **工作区卡片只编辑补充规则**：文本域里是插件自己写入的那个受管块（`<!-- compression-tiers:workspace-rules:start -->` … `:end -->`），保存时插到该工作区 `AGENTS.md` 的**开头**，没有文件就创建，块下面的正文原样保留。磁盘上那份文件本来就有的正文**不进面板**——它不属于插件，读接口也只返回受管块的内容。
- **组件与本地模型是同一张卡片里的列表行（2.6.2）**：`components` 页只有一张卡片，卡片里是两段列表——「组件」六行、「本地模型」一行；每段前面是一条 `.ct-list-head`（`<h4>`，第一条不带分隔线）。行本体是 `.ct-item`（`grid-template-columns: minmax(0, 1fr) auto`，行与行之间只有 1px 分隔线）。行首 `.ct-item-main` 放名称（`.ct-item-name`）、钉住的版本（`.ct-item-pin`：数字钉 `v2.76.2`，源码树的 commit 钉 `commit 6c43880`，非数字钉不加 `v`）与状态（`.ct-item-state`，复用 `downloadControl()` 的标签键：`未安装 / 下了一部分 / 下载中 / 已安装 / 已失败`）；行尾的 `.ct-actions` 放两个常显按钮（下载在左、重新检测在右），不再单独占一行。路径（`.ct-item-path`）、进度条、二进制明细（`.ct-tools-list`）与错误行横跨整行，只在有内容时渲染；状态没读到时整行仍在、按钮置灰。**不要**给单个组件套卡片、圆角或底色，也不要为它另做一套按钮样式；不要写死 Hugging Face / ModelScope 路径、文件清单或下载端点（唯一来源是 `src/models.js` 的 `MODELS` 与 `MODEL_ENDPOINTS`）。下载目录是列表下方的一段设置 `.ct-section`（分隔线 + 输入框 + 迁移/恢复默认），不是列表行。
- 链接一律 `target="_blank" rel="noreferrer noopener"`；正文里不出现裸 URL 文本以外的装饰。
- 空的状态行/说明行用 `:empty` 收起（`display: none`），面板底部不留空白。

## 控件

- **按钮只有一套**：`.ct-btn` 定几何（30px 高、10px 圆角、13px 字），`.ct-btn--primary` 只加描边与底色，不改尺寸；每个动作行由共享的 `actionButton()` / `actionRow()` 渲染。
- **动作按钮常显**：条件不满足时渲染为 `disabled` 并给 `title` 说明原因，不得整天消失（[AGENTS.md](../AGENTS.md) 第 16 条）。
- **输入框 / 文本域**：透明底 + `border-l2` + 10px 圆角，聚焦时 `outline: 2px solid accent; outline-offset: 2px`；文本域可纵向 resize。
- **下拉触发器** `.ct-select`：`aria-haspopup="listbox"`、`aria-expanded`，宽 `min(100%, 360px)`、高 34px、左对齐（`justify-self: start`），展开时描边转 `border-selected`、箭头 180° 旋转；禁用态用 `label-tertiary`。
- **胶囊** `.ct-repo-pill`：26px 高、999px 圆角、图标 + 标签 + 值 + 箭头；绑定态用 accent 淡染底与 accent 混合描边。
- **试管触发器** `.ct-vial`：26px 高胶囊，`flex: none`；里面是 10 × 16 的 SVG 迷你试管（液面 `rect` + 阈值 `line`）与百分比文字，`font-variant-numeric: tabular-nums`（数字变化时宽度不跳）。展开时 `aria-expanded='true'`，占用已贴近阈值时 `data-critical='true'` 转 warn 色。**官方的 `contextPressure` 没有读数时整个试管不渲染**（2.6.6）：新会话在第一条消息之前拿不到投影，宿主自己在那时也不画 `ContextMeter`，画一个点不动的灰「—」只会让空会话看起来像坏了；有读数就出现，读数消失（例如换会话）就跟着消失。
- **胶囊对齐的是宿主的 dock 行，不是输入卡本身**：`conversation.input.dock` 渲染在整宽的 `.composerStack` 里，输入卡用 `--dsh-composer-card-max-width` 居中，而宿主自己的行（智能体任务栏、目标条、队列）在卡宽的基础上**每边再内缩 `--dsh-composer-dock-inset`**（它们的规则是 `100% - 2 × clearance - 4 × inset`，`max-width` 是 `card-max - 4 × inset`）。`.ct-repo-dock` 因此照抄这个盒子：
  `width: calc(100% - var(--dsh-composer-side-clearance, 16px) * 2 - var(--dsh-composer-dock-inset, 8px) * 4); max-width: calc(var(--dsh-composer-card-max-width, 720px) - var(--dsh-composer-dock-inset, 8px) * 4); margin: 0 auto`，
  行内 `justify-content: flex-end`，胶囊右缘就落在任务栏右缘上（2.6.4 只按卡宽收窄，右缘压过任务栏 16px，2.6.5 修正）。整宽行配 `padding: 0 var(--dsh-composer-side-clearance)` 只解决「不贴窗口边」，锚不到任务栏（1.9.x 的观测结果），不要再改回去。

## 外观页

一张卡片：配色（3 个色板）→ 动效（3 个分段按钮）→ 光学外观（1 个开关，2.4.2 起常显可点）。2.5.0 删除像素伙伴后不再有「伙伴」开关，卡片里也不要再加第三组控件。

1. **配色用色板，不用下拉**：`.ct-swatches` 是 3 列栅格（`@container (max-width: 640px)` 时 2 列），每个选项是 `role="radio"` + `aria-checked` 的按钮；顶部 `.ct-swatch-band` 是一条 22px 的三段渐变色带（深色端 / 浅色端 / accent），下面 12px 名称。两套配色都跟随宿主深浅，所以色带同时露出深色端与浅色端；色带只用作预览，颜色写死在各 `data-choice` 里——它展示的**不是**当前主题的 token。
2. **动效用分段按钮**：`.ct-segment` 34px 高，`role="radiogroup"` 包住三个 `role="radio"`；选中态 accent 16% 淡染 + 50% 描边。
3. **光学外观用开关式动作按钮**：`actionButton()` 渲染，`aria-pressed` 表示状态，开启时加 `ct-btn--primary`；标签随状态在「已开启 / 已关闭」之间切换，不用复选框、不用开关滑块。它开关的是整层主题美术（底光、气泡、分隔线、输入卡光泽）与宿主统计字 / 上下文环的隐藏，**不是**配色——跟随宿主时它也照样开启、照样可点。
4. **写入是乐观的**：点选立刻改本地状态并发 `POST /compression-tiers/api/settings`；失败回滚到上一个值，并在卡片底部的 `.ct-status`（`role="status"`）写一条失败提示。请求进行中三个控件一起 `disabled`，避免连点打架。成功响应同时推给设置快照的订阅者（`rememberSettings()` → `subscribeSettings()`），所以输入框上方那一行不必等切会话重挂载就会跟着换配色 / 动效；外观引导读取失败时**不**用默认值涂抹，而是按 1.5s × 次数退避重试（首次失败有旧快照才回退）。
5. 颜色与动效同时作用于面板页根、输入框上方那一行与 portal 出去的菜单——皮肤靠 `data-palette` / `data-motion` 三个根节点各自带上属性，不要指望继承。

## 输入框上方那一行

`.ct-repo-dock` 渲染在 `conversation.input.dock`（输入框正上方的整宽槽）。空白会话里这一行**整行不渲染**（用量卡片是 portal 出去的浮层，见下一节），有读数后才是「工具区」一行。

| 块 | 类名 | 规则 |
| --- | --- | --- |
| 用量卡片 | `.ct-heat-layer` / `.ct-heat` | 空白会话的浮层卡（`position: fixed`、portal 到 body），**不在这一行里**，见下一节 |
| 工具区 | `.ct-dock-tools` | `flex: 1 1 auto` + `justify-content: flex-end` + `margin-left: auto`，内放试管触发器、状态小字（`.ct-repo-note`）与仓库胶囊 |

- 行容器仍保留 `justify-content: flex-end` 与那条 dock 盒子规则（右缘落在任务栏右缘上）；空白会话下整行返回 `null`，宿主的 hero 行因此回到原版位置。
- 行宽按输入卡几何收窄并居中（见上一节「胶囊必须正对输入卡」），`box-sizing: border-box`。
- **2.5.0 按用户要求整块删除像素伙伴**：没有左段、没有 `.ct-dock-mascots` / `.ct-mascot-stage`、没有 `@container (max-width: 620px)` 的收伙伴规则，`.ct-repo-dock` 也不带 `container-type`。不要为了「以后可关」把舞台或开关加回来（产品决定，写进 [AGENTS.md](../AGENTS.md) 第 23 条）。
- 有读数后这一行只有试管触发器、状态小字与胶囊；窄了就让胶囊自己缩，不要新增占位块把行撑宽。
- **上到下固定是「仓库栏和试管 → 任务栏 → 输入卡」（2.6.4）**：`conversation.input.dock` 是 `list` 槽，宿主按 `order` **升序**渲染（`[...rows].sort((a, b) => a.order - b.order)`，上小下大）。原则是**跟原版输入卡亲密性强的 UI 优先靠近输入卡，插件次之**（用户 2.6.4 的原话）——宿主自己的行（智能体 `todo_write` 起的「任务」清单条 `todo`，order 0，条目 1/2/3/4 排开；工作树进度 5；目标条 10；队列 20）紧贴输入卡，本行取 order **-1000**（`client.js` 的 `DOCK_ORDER_FIRST`），排在它们全部之前。没有任务条时就是「仓库栏和试管 → 输入卡」。不要把 order 改成非负值，也不要为了抢位置去改宿主条目的 order。

## 本机用量热力图（空白会话）

上游 Obsidian Prism 的 Studio 首页用一张 bento 卡同时放两块东西：左边「活跃轨迹」（标题行 → 26 周 × 7 天网格 → 大号总量），右边「5h 配额池」（三条带 5px 轨道的用量行）。DSH 没有那块板子，所以整套排版搬进本插件自己的浮层卡，**只在空白会话出现**（2.7.0 首版，2.7.1 卡片化，2.7.2 补全双栏并搬出输入框上方那一行）。

1. **画在哪儿**：宿主把会话标成空白（`session.blank === true` 且 `awaitingFirstTurn !== true`；旧宿主没给这个字段时才回落到「没有 `contextPressure` 读数」）时，这一行**不再渲染**，`RepoBinding` 直接返回 `HeatOverlay`：卡片经 `ReactDOM.createPortal` 挂到 `document.body` 的 `.ct-heat-layer` 上（`position: fixed`、`pointer-events: none`、`container-type: inline-size`、`z-index: 20`），卡片自己 `pointer-events: auto`。这样宿主自己的空会话 hero（问候语 + 快捷按钮）保持在原版位置，输入卡仍在窗口最底部——上游就是「热力图在中间、对话栏在底下」。**`blank === false` 时必须只画 dock 行**：切换会话时新会话的投影还没到（冷会话根本不发 `contextPressure`），用「没有读数」推断空白会把卡片画进有消息的会话里，还会连带把宿主那一段推下去（2.7.6）。
2. **怎么定位**：`placeHeatLayer()` 读 `[data-conversation-region='chat']` 与 `[data-conversation-region='composer']` 的矩形，水平居中于聊天区，**底边贴着输入区上沿 16px**（`HEAT_BOTTOM_GAP`；顶到聊天区顶时保底 12px）——空聊天区里不要浮在半空。宽度从 900px 起，放不下就每档减 40px（下限 360px），绝不盖住宿主 hero。`HeatOverlay` 用 `resize` + `ResizeObserver`（层 / chat / composer）重算。
3. **空白会话把宿主那一段往下推（2.7.4；2.7.5 起热力图不跟**：宿主在空会话里把「欢迎语 + 快捷按钮 + 输入卡」整块居中在聊天区（1584×905 实测 seat `265 → 680`，下方空着 225px 死区），插件行在不在都不改变它——用户要「红圈地方往下移」的就只能是这块。`placeHeatLayer()` **先清掉 `--ct-seat-shift` 再量 seat**，按量到的宿主原始座位算 `shift = max(0, chatBottom − 24 − seatBottom)`（`HEAT_SEAT_GAP` = 24px）写回 `:root` 的 `--ct-seat-shift`；样式表里只有一条 `body[data-ct-blank='on'] [data-conversation-region='composer'] { transform: translateY(var(--ct-seat-shift, 0px)) }`。**卡片一律按清零后量到的原始座位定位**，不按移位后的座位贴边——用户只要求把这块往下移，热力图不能跟着动。`data-ct-blank` 由 `HeatOverlay` 挂载时写入、卸载时与变量一起删除，有 `contextPressure` 读数时整条规则不成立；除这两个开关外仍然只读宿主几何、不写宿主节点。
3. **双栏底盘**：`.ct-heat` 里是 `.ct-heat-chassis`（`grid-template-columns: 62fr 38fr`，左右栏之间 1px `border-l1` 分隔线），窄于 660px（`@container`）时堆叠成单栏、分隔线转成上边框。卡面 `--dsw-specific-menu` 底、1px `border-l2`、14px 圆角、`overflow: hidden`。
4. **左栏（热力图）**：`.ct-heat-zone` 内边距 15/18/14、行距 11px——标题行 `.ct-heat-head`（左「活跃轨迹」12px/600，右分段控件）→ `.ct-heat-grid`（`repeat(26, minmax(0, 1fr))` + `repeat(7, auto)` + `grid-auto-flow: column` + gap 3px，格子 `aspect-ratio: 1`、2px 圆角）→ `.ct-heat-foot`（`padding: 13px 18px 15px` + `border-top`，里面是 `.ct-heat-hero`：`clamp(20px, 2vw, 25px)` / 500 / `-0.02em` 的大号总量 + 12px 的「Tokens」与「（近 26 周）」，下面 11px mono 摘要）。
5. **右栏（模型用量）**：`.ct-heat-right` 内边距 15/18，标题行（左「模型用量」、右 mono 10px「按会话归属」）→ `.ct-heat-pools`（gap 13px）里每个模型一行 `.ct-heat-pool`：`.ct-heat-pool-top`（左名称 12px/500、右 mono 11px「百分比 + 会话数」）→ `.ct-heat-track`（5px 高、内阴影、`--ct-heat-pool` 取 `--dsw-alias-chart-1..6`、兜底 accent）→ `.ct-heat-track-fill`（`width` 按份额，`min-width: 5px`，顶部一条白色高光）。份额四舍五入到 0 但确实有量时写 `<1%`。底部 `.ct-heat-right-foot`（`border-top` + 10px mono）写「连续活跃 N 天 · 窗口 起 – 止」。
6. **分段控件**：`.ct-heat-ranges` 是 2px 内边距的 999px 胶囊（1px `border-l1`、5% 淡底），`.ct-heat-range` 11px、圆角 999px，选中 `data-active='true'` 用 8% 淡底 + 内高光 + 0.5px 描边。切窗口**重新取数**（`GET /api/usage?range=7d|30d|all`），强度按窗口内峰值重算，右栏与卡脚同步——不要在前端对 26 周数据做纯视觉过滤。
7. **悬停胶囊**：`.ct-heat-tip` 绝对定位在 `.ct-heat-wrap` 里，`--tip-x` / `--tip-y` 由 `pointerover` 计算并夹在网格宽度内；`data-show='true'` 时从 `translate(-50%, calc(-100% - 6px)) scale(.96)` 升到 `-8px / scale(1)`；两行（strong 11px 给日期、span 10px mono 给 token 与会话数）。没有读数/未来日不带 `data-tip`。
8. **五档强度**：格子 `data-level` 0–5（0 空日、1–5 由 `src/usage-heatmap.js` 的 `levelOf()` 按窗口内当日峰值取对数），颜色全部 `color-mix(in srgb, var(--dsw-alias-state-business-primary) N%, transparent)`——18 / 34 / 52 / 72 / 92%；`data-level='0'` 是 `label-secondary` 6% 淡底，未来日与窗口外的日子（`data-active='false'`）3%；悬停 `scale(1.3)` + 一圈 55% `label-primary` 描边。**不得**写死十六进制蓝，也不得给空日画灰「—」。
9. **读数如实**：格子悬停给「日期 / token · 会话数」；右栏按会话 `modelSelection.val.lastUsed` 归桶（缓存只留每个会话最后的模型，卡片标题写「按会话归属」）；没有缓存就整块不画，**不得**用假数据或 0 冒充（上游演示图里的热力图是 hash 出来的假数据，这里不跟）。口径写在 [AGENTS.md](../AGENTS.md)「事实来源」的「本机用量唯一来源」段。
10. **卡底栏**：`.ct-heat-bar`（`border-top`、`padding: 8px 18px`、`justify-content: flex-end`）放仓库胶囊与状态小字——空会话不再有独立 dock 行，胶囊跟着卡片走；`:empty` 时不占位。

## 推理滑块（注入官方模型菜单）

它不属于本插件自己的面板，但样式也在本仓库里，所以同样受本文件约束。

1. **只挂在官方那一行下面**：锚点只用语义属性——`aria-haspopup="menu"` + `aria-expanded` + `aria-controls` 找到菜单、`role="menuitem"` 找到根面板的行、`[data-composer-card]` 判断这颗触发器是不是本会话输入卡的。**认行靠标签不靠位置**：读每行第一个 `span` 的文字，命中官方 `menu.effort` 文案（`推理等级` / `Effort` 及各语言写法）才算推理等级行；根面板恰好两行时按官方布局取第 2 行作为兜底，多于两行又没有标签命中就什么都不加（订阅类选择器会在同一面板里再加 Speed / Verbosity 行，按位置取会把滑条挂到别的设置上）。命中后把 `.ct-effort` 插到该行的**下一个兄弟位**，不包裹、不改写官方节点，不读 DSH 的哈希类名。注入后**不派发 `resize`**：部分宿主的菜单用 resize 兜底关闭，派发会让菜单刚打开就收起来；现代宿主用 CSS 锚点定位，自己会跟着高度走。
2. **尺寸与几何（对齐参考插件）**：轨道是一条 28px 高的胶囊（`border-radius: 999px`，底色 `--dsw-alias-border-l1`），旋钮直径也是 28px、正好填满管口；两端各留半个旋钮（14px），旋钮位置 `left: calc(14px + (100% - 28px) × 位置%)`，填充的 `width` 用同一个表达式，所以填充正好停在旋钮圆心。档位点是 3px 圆点，与旋钮同一条轴，当前档及以下不透明度 0.9、以上 0.4。
2b. **能量层与星尘（2.4.5 起对齐参考插件的「满档通电」）**：`.ct-effort-energy` 是紫色星云，只覆盖已填充那一段（宽度与填充同一个表达式），四段渐变 `#3b1178 → #6d28d9 → #9333ea → #c084fc`，强度由根节点的 `--ct-effort-energy`（0..1）驱动，靠 `opacity` 过渡而不逐帧写样式；里面再放一条 `.ct-effort-energy-sweep` 做扫光。星尘单独一层 `.ct-effort-stars`（不跟星云一起淡入，否则 high 档的星被星云的 0.5 透明度压没了）：22 颗 3px 圆点，横向整轨 `translate3d(-100%)` 扫过，`animation-duration` 与负 `animation-delay` **内联写在元素上**（写进样式表时负相位在真宿主里不生效）；位置全部由下标算出、不用随机数——相位取黄金比低差异序列，高度取带最小间隔约束的哈希排列，亮度 `--ct-effort-b` 取 0.5–1。能量曲线按位置而不是档位名：`pct ≤ 1/3` 为 0、`pct = 2/3`（四档模型的 high）为 0.5、满档为 1；`energy ≤ 0.001` 时 `data-energy='0'` 把动画设成 `animation-play-state: paused`，22 个隐形元素不白烧 GPU；`data-motion='off'` 用同一份暂停列表（星尘与扫光**都**要停，只停星尘的话扫光会继续跑）。
3. **旋钮与能量态**：旋钮是白色圆钮（`#fff` + `0 1px 5px rgba(0,0,0,.34)` 与半像素描边），不是切面宝石；填充固定用 `--dsw-alias-state-business-primary`（宿主强调色），能量强度驱动轨道外发光 `0 0 calc(--ct-effort-energy × 16px)` 与旋钮外发光。档位与颜色不再用位置色阶，颜色语义只剩「普通 / 通电」。**不要**给它加贴图或外链资源。
4. **颜色只来自 token**：轨道底色用 `--dsw-alias-border-l1`，填充用 `--dsw-alias-state-business-primary`（缺省回落 `#4d93f8`），满档的紫色泛光写进 `--ct-effort-glow`。不写死某一档的颜色。
5. **交互**：拖动（pointer capture）时只移动旋钮预览，`pointerup` 才提交；键盘 ↑ / ↓ 走一档、Home / End 到两端，每次都直接提交。写入中 `data-busy='true'` 锁住并降到 72% 不透明；失败时 `.ct-effort-error` 写原因（`:empty` 时不占位），旋钮回到宿主确认的档位。
6. **渲染不出来就不渲染**：宿主没有 `modelDirectories`、模型没有 `reasoning.efforts`、只有一档、菜单没开、锚点认不出——一律什么都不加，官方菜单保持原样。**不得**做拨动后无效果的装饰控件。
7. **会话目录按需重取，不长期缓存**：`directoryFor(sessionId)` 在会话作用域就绪前会抛错，宿主还会在模型代次变化时换掉实例，所以每次读、每次写都重新解析；解析失败时保留手上那份实例（订阅仍在喂它），从未拿到过则按 60 / 240 / 540 / 960 / 1500 / 3000ms 退避重试，取到新实例就退掉旧订阅、重新订阅并按 400ms 节流调一次 `load()`（`load()` 在已就绪时直接回缓存，共享官方那一份目录）。React 切换子面板时可能丢掉我们的节点，所以每轮都复核「节点仍是该行的下一个兄弟」，丢了就重建。
8. **动效**：旋钮 `left` 150ms、档位点 140ms；`data-motion='off'`（外观页动效关闭）时两者都去掉过渡。

## 下拉与弹层

1. **只自绘**：面板与胶囊里不得出现原生 `<select>`。它的弹层由操作系统绘制，深色主题下是「浅底 + 继承来的浅字」，选项在白底上不可见。
2. **挂载**：`createPortal` 到 `document.body` + `position: fixed`。输入框附近与面板滚动容器里的 `fixed` 后代必须 portal，否则会被裁剪。
3. **定位**：统一走 `placeMenu()`——默认**上拉**（`bottom = 视口高 − 触发器顶 − 8`），`max-height` 取该侧空间（上限 320px）；上方不足 200px 且小于下方时翻成 `data-side='down'` 并改按 `top` 定位。右对齐的触发器（仓库胶囊）用 `align: 'end'`，让菜单向右边缘对齐、朝页面中间展开。
4. **表面**：layer-3 + 玻璃 + 顶部高光 + 大阴影；16px 圆角；`z-index: 2147483000`。
5. **结构**：分组标题（大写、11px、前面 2px accent 竖条）→ 渐变分隔线 → 选项。选项 34px 高、10px 圆角：悬停/键盘高亮用 accent 13–15% 淡染，选中项 20% 淡染 + 左侧 2px accent 竖条 + 勾选位；私有等元信息用右侧 pill 标签。
6. **交互**：点触发器开关；点外部、Esc、窗口 resize 关闭；打开后焦点进入 listbox；↑ / ↓ / Home / End 移动，Enter / Space 选中；触发器与 listbox 都带 `aria-haspopup` / `aria-expanded` / `aria-activedescendant`。
7. **进场**：`data-side` 决定位移方向，140ms 淡入 + 6px 位移 + 0.98 缩放。

## 动效

- 只做 110–160ms 的 `background-color` / `border-color` / `color` / `transform` 过渡、分页进场与弹层进场；不做位移布局、不做长于 200ms 的动画。唯一的慢过渡是迷你试管的液面（600ms `y` / `height`），因为它表示的是数值变化而不是交互反馈。
- 分页进场 `ct-page-in` 160ms：只做 `opacity 0→1`，不位移、不缩放；只挂在 `.ct-content` 上，不重播导航栏。切页时任何位移（`translateY` 也算）都会读成「页面跳了一下」，既然两组坐标本来就不该变，就别让它们动。
- 展开箭头 140ms `rotate(180deg)`；按钮与选项 hover 110–120ms。
- 用 `--virtual-time-budget` 之类冻结时钟的截图工具里，进场动画可能停在 `opacity: 0` 的首帧：预览样式要单独关掉它，交付截图前先确认画面不是全黑。
- **动效档位是全局语义，不是单个面板的偏好**：

| 档位 | `data-motion` | 表现 |
| --- | --- | --- |
| 完整 | `full` | 全部：分页/菜单进场、液面过渡、能量层扫光与星尘 |
| 克制 | `subtle` | 去掉分页与菜单进场、去掉液面过渡；推理滑块的能量层照常 |
| 关闭 | `off` | 再把 `reducedMotion: true` 传给试管（物理停住），并把星尘与扫光一起暂停 |

  实现上 `subtle` / `off` 只加两条 CSS（`.ct-page[data-motion=…] .ct-content { animation: none }` 与 `.ct-skin[data-motion=…] .ct-vial-liquid { transition: none }`），`off` 额外在 JS 侧传参，并把 `.ct-effort-star` 与 `.ct-effort-energy-sweep` 一起 `animation-play-state: paused`；新增动效时必须同时检查这三档，不要只写 `prefers-reduced-motion`。

## 焦点与可访问性

- 可聚焦控件必须有可见焦点环：`outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px`；listbox 内部选项用 `outline-offset: -2px`。
- 按钮必须有可读标签（`<button type="button">` + 文本或 `aria-label`）；不用 `div` 假装按钮。
- 导航栏是 `<nav aria-label>`，当前页靠 `aria-current="page"`，不要只靠颜色。
- 状态与错误用 `role="status"` / `role="alert"` + `aria-live`，并占据固定的一行位置，避免出现时把下方内容顶动。

## 禁止项

- ❌ 原生 `<select>`、原生 `<option>` 弹层。
- ❌ 弹层底色用 layer-2（与卡片同色），或写死十六进制主题色。
- ❌ 用条件渲染隐藏动作按钮。
- ❌ 面板里写教学段、原理段、操作步骤（第 15 条）。
- ❌ 第二套按钮样式、按面板分裂的按钮文案。
- ❌ 用负 margin 贴到输入卡边缘。
- ❌ 把整页内容重新拼成一条长滚动，或恢复 `.ct-page-inner` / `.ct-columns` 两栏栅格。
- ❌ 用 `overflow-x` 横滚的导航条（窄面板必须换行）。
- ❌ 让 seat 自己重画底光（2.4.9 那套两层 `background-image`：seat 是层叠上下文，重画的那条和对话区渐变接不上），或为了多看一截底光去关掉 seat 遮罩、把输入卡改半透明——底座上的底光只能走 `::before`（负 z + 实测高度 + 顶边 mask）。
- ❌ 用实色或第二层遮罩冒充底光（`background-color` 一旦写上去，正文就会被盖住或被透出来）。
- ❌ 给同一个面板换第二套卡片圆角或第二套玻璃配方。
- ❌ 给 `.ct-nav` 写正的 `sticky` `top`（导航栏会离第一张卡片一个偏移），或在分页进场里加位移/缩放。
- ❌ 往 `:root` / `body` 写配色变量，或在 `.ct-skin` 里写 `color-scheme`（皮肤靠 `body[data-ds-dark-theme]` 跟随宿主，自己设会打架）。
- ❌ 选配色时顺手 `theme.setTheme()` 改用户的外观偏好（2.2.0 已删除这次写入）。
- ❌ 往官方模型菜单里塞一个拨动后不影响推理等级的装饰控件，或用哈希类名认锚点（只能用语义属性，认不出就不注入）。
- ❌ 让 `client.js` import 移植模块（它们是 UMD，只能走同源 `<script src="/compression-tiers/vendor/…">`）。
- ❌ 在投影缺失时画一个禁用状态的试管（2.6.6：没有读数就整个不渲染，见第 220 行）。
- ❌ 给热力图填假数据、用 0 冒充没有读数的日子，或把未来日画成实心格（2.7.0：没有会话缓存就整块不画）。
- ❌ 把热力图塞回输入框上方那一行、做成 `width: fit-content` 的裸块或写死 10px 方块（2.7.2：它是聊天区里的固定浮层卡，`62fr 38fr` 双栏、列宽均分卡面，宿主的空会话 hero 必须留在原版位置）。
- ❌ 在没有 `body[data-ct-blank='on']` 的前提下改宿主 composer seat 的位置（2.7.4 的唯一一处宿主布局覆写只允许在空白会话生效、只走 `--ct-seat-shift` 一个变量，有读数时必须连属性带变量一起撤掉；不得给它加第二套偏移逻辑，也不得借这条去改别的宿主区域）。
- ❌ 恢复像素伙伴或给输入框上方那一行重新引入容器查询（2.5.0 已整块删除，见 [AGENTS.md](../AGENTS.md) 第 23 条）。

## 落地映射

| 类名 | 作用 |
| --- | --- |
| `.ct-page` | 面板滚动容器 + 玻璃画布 + 容器查询的容器（`container-type: inline-size`） |
| `.ct-shell` | 外壳栅格：196px 导航栏 + 当前页 |
| `.ct-nav` / `.ct-nav-brand` / `.ct-nav-item` | 导航栏 / 品牌行 / 导航项（`aria-current='page'`） |
| `.ct-content` | 当前页容器（分页进场动效） |
| `.ct-panel` | 卡片（玻璃） |
| `.ct-rules-head` / `.ct-actions` | 卡片标题行 / 动作行 |
| `.ct-levels` / `.ct-level` | 档位按钮组 / 单个档位 |
| `.ct-field` / `.ct-textarea` / `.ct-input` | 字段 / 文本域 / 路径输入 |
| `.ct-select` / `.ct-select-value` | 下拉触发器 / 当前值 |
| `.ct-menu` / `.ct-menu-head` / `.ct-menu-option` | 弹层 / 分组标题 / 选项 |
| `.ct-skin` | 插件自己的皮肤根：携带 `data-palette` / `data-motion`（面板页、dock 行、菜单、试管浮窗） |
| `.ct-swatches` / `.ct-swatch` / `.ct-swatch-band` | 外观页配色栅格 / 单个色板（`role=radio`）/ 三段色带 |
| `.ct-segments` / `.ct-segment` | 外观页动效分段组 / 单个分段按钮 |
| `.ct-repo-dock` / `.ct-repo-pill` / `.ct-repo-note` | 输入框上方那一行（按宿主 dock 盒子收窄并居中——卡宽再每边内缩 `--dsh-composer-dock-inset`，order -1000，排在宿主原生 dock 行之前；2.7.0 起是列布局）/ 仓库胶囊 / 状态小字 |
| `.ct-heat-layer` / `.ct-heat` / `.ct-heat-chassis` | 空白会话的浮层容器（fixed + portal）/ 卡面 / `62fr 38fr` 双栏底盘（660px 以下堆叠） |
| `.ct-heat-zone` / `.ct-heat-head` / `.ct-heat-grid` / `.ct-heat-cell` | 左栏热力区 / 标题行（左标题、右分段控件）/ 26 列满宽网格 / 单个方格（`aspect-ratio: 1`、`data-level` 0–5、`data-active`） |
| `.ct-heat-foot` / `.ct-heat-hero` / `.ct-heat-hero-num` / `.ct-heat-hero-unit` / `.ct-heat-sub` | 左栏卡脚（发丝线以上）/ 大号总量行 / 总量数字 / 「Tokens」单位 / mono 小字摘要 |
| `.ct-heat-right` / `.ct-heat-pools` / `.ct-heat-pool` / `.ct-heat-track` / `.ct-heat-track-fill` | 右栏模型区 / 模型列表 / 单行 / 5px 轨道 / 份额填充 |
| `.ct-heat-ranges` / `.ct-heat-range` | 标题行右侧的 7天 / 30天 / 全部 分段控件 / 单个分段（`data-active`） |
| `.ct-heat-tip` / `.ct-heat-bar` / `.ct-heat-right-foot` | 悬停玻璃胶囊 / 卡底仓库栏 / 右栏 10px 脚注 |
| `body[data-ct-blank='on']` / `--ct-seat-shift` | 空白会话的两个开关：`HeatOverlay` 挂载时写、卸载时删；变量由 `placeHeatLayer()` 写根节点，只被 `[data-conversation-region='composer']` 那条 `translateY` 读（2.7.4） |
| `.ct-list` / `.ct-list-head` | 「模型和组件」页的列表容器 / 分组标题（组件、本地模型） |
| `.ct-item` / `.ct-item-main` / `.ct-item-name` / `.ct-item-pin` / `.ct-item-state` | 列表行 / 行首文本块 / 名称 / 钉住版本 / 状态 |
| `.ct-item-path` / `.ct-item > .ct-actions` | 行内路径 / 住在行尾的两个按钮 |
| `.ct-section` | 列表下方的设置段（下载目录） |
| `.ct-vial` / `.ct-vial-popover` / `.ct-vial-canvas` | 试管触发器 / 浮窗 / 物理画布（96 × 220） |
| `.ct-vial-rows` / `.ct-vial-bar` / `.ct-vial-legend` | 浮窗数字行 / 三段构成条 / 图例 |
| `.ct-effort` / `.ct-effort-track` / `.ct-effort-gem` | 注入官方模型菜单的推理轨道 / `role="slider"` 的轨道 / 那颗白色圆钮（2.4.1 起不是切面宝石） |
| `.ct-effort-rail` / `.ct-effort-fill` / `.ct-effort-dot` / `.ct-effort-error` | 轨道条 / 已选段 / 档位点 / 失败原因 |
| `.ct-status` / `.ct-note` / `.ct-meta` / `.ct-scopes` | 状态行 / 弱化说明 / 页脚元信息 / 授权范围 |

## 输入框的光学层（2.8.0）

输入卡上只有一道**银白流光边**（2.8.1 按用户要求删掉了停止按钮彩虹环 / 升空环 / 焦散扫光）。它画在**一个** portal 到 `<body>` 的 `.ct-optics-layer`（`position: fixed`、`pointer-events: none`、`z-index: 30`、`ct-skin`、`aria-hidden="true"`、带 `data-palette` / `data-motion`），**只读**宿主 `[data-composer-card]`：不写它的样式、不加子节点、不改底色 / 边框 / seat 遮罩。

- **类名映射**：`.ct-optics-rim`（1px 边）。这个节点由 React 渲染，几何由 mount 函数写成行内样式（`--ct-rim-x` / `--ct-rim-y` / `--ct-rim-strength`、方框与圆角）与 `data-on` 属性；指针移动只换这三个变量，所以「流光」是指针带着渐变圆心走，不是自播动画。
- **颜色**：三段银白 `--ct-rim-hi / mid / lo` 只写在 `.ct-optics-layer` 上（浅色 `#ffffff / #dfe4ea / #8f98a5`，深色 `#ffffff / #e6eaef / #b3bcc7`）：银白就是效果本身，**不随三套配色变化**。这是「配色只写在 `.ct-skin[data-palette]`」的唯一例外。
- **锚点**：卡片按 `[data-conversation-session]` 找本会话那一张（找不到才回落到页面第一张）。不再读任何按钮，也不读 `session.running`。
- **动效档位**：`art === false` 或 `motion === 'off'` 时整层不渲染；`subtle` 与 `full` 相同（只剩这一道边）。`prefers-reduced-motion: reduce` 不隐藏它，只把 220ms 的淡入淡出改成 `transition: none`。
- **几何**：`ResizeObserver`（卡片）+ `window resize` + 捕获阶段的 `scroll` 触发一次 rAF 重算；卡片节点 `isConnected === false` 时下一帧重取并重绑观察者；指针移动合并进一个 rAF，没有常驻帧循环。
- **样式约束**：每条规则以 `body[data-ct-art='on']` 开头；边用两层 `mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)` 掏成 1px，填充是 `radial-gradient(240px circle at var(--ct-rim-x) var(--ct-rim-y), …)`；样式表里不再有 `ct-optics-stop` / `-liftoff` / `-sweep` / `ct-prism`，也没有任何 `@keyframes ct-prism*`。
- **禁止**：不写 `[data-composer-card]` 的 `background-color`、不碰 `[data-composer-seat]`、不把层放进 composer 区域（宿主 `.composerStack` 是 fixed 的包含块）、不用宿主哈希类名。

## 检查清单

改面板或弹层后逐条确认：

- [ ] 只用 token，不出现新的主题色硬编码。
- [ ] 面板是「导航栏 + 一次一页」，分页顺序与 `SECTIONS` 一致，当前页有 `aria-current="page"`。
- [ ] `container-type` 在 `.ct-page` 上；面板 ≤720px 时导航栏是换行的横向条，没有被裁掉的页面。
- [ ] 卡片仍是 20px 圆角、同一套玻璃配方；导航栏比卡片低一层。
- [ ] 导航栏 `sticky` 的 `top` 是 0，导航栏顶部与第一张卡片同一水平线；`.ct-page` 有 `scrollbar-gutter: stable`，切分页时外壳不会横向挪动。
- [ ] 所有动作按钮常显，禁用时有 `title`。
- [ ] 没有原生 `<select>`；弹层是 layer-3 + portal + `data-side`，表面不是 layer-2。
- [ ] 键盘：↑ / ↓ / Home / End / Enter / Esc 与外部点击都能走通。
- [ ] 仓库胶囊右缘与输入卡右缘对齐（`min()` + `margin: 0 auto`，没有负 margin）。
- [ ] 两套皮肤的 token 只写在 `.ct-skin[data-palette='…']` 上，每套都有浅色段与 `body[data-ds-dark-theme]` 深色段；「跟随宿主」是空集。
- [ ] 外观页三组控件（配色 / 动效 / 光学外观）都能改、失败会回滚；「光学外观」是 `aria-pressed` 的按钮，不是复选框；卡片里**没有**「伙伴」开关。
- [ ] 「模型和组件」页是**一张卡片里的两段列表**（组件六行 + 本地模型一行，`.ct-item`）：每行行尾两个按钮常显、状态未到时置灰，行内的路径 / 进度 / 错误横跨整行，单行不套卡片；下载目录是列表下方的 `.ct-section`。
- [ ] 试管只在有官方读数时出现：新会话（第一条消息之前）看不到试管，发第一条消息后出现且能点开，浮窗里有数字、构成条与图例。
- [ ] 推理滑块只出现在官方「推理等级」行下面：行按标签认（两行兜底），多于两行又没有标签命中就不加；锚点是语义属性，`role="slider"` 带 min/max/now/valuetext；写不进去就回滚并写原因；注入后不派发 `resize`；会话目录每次重取、丢了节点会重建。
- [ ] 输入框上方那一行只有工具区（试管触发器 + 状态小字 + 胶囊），没有伙伴槽、没有 `container-type`、没有 `@container` 收伙伴的规则。
- [ ] 空白会话的用量卡片：卡片是聊天区里的固定浮层（不占 dock 行，宿主 hero 在原版位置），左栏「标题行（标题 + 7天/30天/全部）→ 26 周网格 → 发丝线 → 大号总量与小字」，右栏「模型用量」每模型一行 5px 轨道 + 百分比 + 会话数，卡底是仓库胶囊；窄于 660px 两栏堆叠；有读数后整块让位给试管；格子颜色全走 `color-mix` 的 accent，没有硬编码蓝、没有假数据。
- [ ] 空白会话里宿主的「欢迎语 + 快捷按钮 + 输入卡」整块被推到聊天区底部（底部留 24px），而热力图卡片**留在宿主原始座位上方、不跟着下移**（2.7.5）；发出第一条消息（有 `contextPressure` 读数）后整块回到宿主原位，`body` 上没有 `data-ct-blank`、`:root` 上没有 `--ct-seat-shift`，窗口 resize 后也不会弹回。
- [ ] 动效三档都试过：`subtle` 只关进场与液面过渡，`off` 还把 `reducedMotion` 传给了试管、并暂停了星尘与扫光。
- [ ] 空状态行不占位。
- [ ] 规则页是两张卡：上面全局 `AGENTS.md`，下面所选工作区的补充规则；两张卡各有一个文本域与一个保存按钮。
- [ ] 工作区文本域里只有受管块的内容，保存后插在 `AGENTS.md` 开头，文件原有的正文原样留在块下面。
- [ ] 输入卡归宿主：没有改 `[data-composer-card]` 的底色，seat 的遮罩、`background-image` 与其它属性也没动；seat 上只多一层 `::before` 底光（负 z、实测高度、顶边 mask），正文在卡上方就被裁住。**例外只有空白会话那一处**：`body[data-ct-blank='on']` 下的 `translateY(var(--ct-seat-shift))`，有读数时属性与变量都必须消失（2.7.4）。
- [ ] 宿主那颗 `○ 5%`（`[data-composer-dock]` 里 `aria-haspopup='dialog'` 的按钮）在美术层打开时不显示，关掉「光学外观」后自己回来；没有为它新增开关。
- [ ] 底光跨过 seat 顶边是连续的：确认没有再让 seat 自己重画 `background-image`，`--ct-glow-height` 是实测值而不是写死的像素。
- [ ] 对话区背景只有一条静态 `linear-gradient`，样式表里没有 canvas、没有背景关键帧。
- [ ] `npm test` 通过（`test/client.test.js` 覆盖外壳、导航、分页、玻璃变量、授权范围行、规则页两张卡、外观页、试管、热力图、模型行与自绘下拉；`test/usage-heatmap.test.js` 覆盖四桶求和、26 周对齐与强度分档；`test/workspace-rules.test.js` 覆盖受管块的读写；`test/vendor.test.js` 覆盖移植模块与 GPL 文件）。
- [ ] 视觉效果无法在真实窗口确认时，交付说明写「渲染未验证」。
- [ ] 输入框光学层只读宿主卡片：层固定、点击穿透、`z-index: 30`，卡片没有新样式或子节点；只有 `.ct-optics-rim` 一个节点，`off` / 光学外观关闭时整层不出现，`subtle` 与 `full` 一样。
- [ ] 银白边只在指针靠近卡片 280px 内点亮，指针沿边走时渐变圆心跟着滑；没有停止环、升空环与扫光。
- [ ] 系统开启减少动态效果时不隐藏边、只是不做淡入淡出；宿主换掉卡片节点后边仍然跟着新卡片。
