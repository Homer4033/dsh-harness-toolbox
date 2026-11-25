# 面板 UI 规范（dsh-harness-toolbox）

> 本文件约束本插件**自己画**的那部分界面：左侧栏「压缩分档」面板（液体玻璃外壳 + 左侧分页导航）、输入框上方那一行（上下文试管、像素伙伴与仓库胶囊）、外观页的两套皮肤、注入官方模型菜单的推理滑块，以及全部自绘弹层。宿主主题与官方组件（侧边栏、输入框、标题栏）本身不在范围内，也不要试图改它们。

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
6. **输入卡归宿主自己**：`[data-composer-card]` 只加光泽与落影，**不**改它的底色；`[data-composer-seat]` 的遮罩（把滚出去的正文裁在输入卡上方）一律保留，2.4.2 为了旧辉光「到底」把遮罩关掉、卡片改 76% 半透明，结果正文透过卡片，2.4.8 全部撤回。2.4.9 唯一允许碰 seat 的是**底光的那一层背景**：它叠在遮罩之上、并且照抄遮罩，见下一节第 4 条——遮罩本身与 seat 的其它属性一概不动。
7. **美术层自身不加 CSS keyframes**：静态部分全是渐变，没有任何逐帧动画；`data-motion` 只影响试管与旋钮的过渡。
8. **不抄的部分**：壁纸、Omni 检视台、思考转译、配额遥测都不在本插件范围内。

### 对话区底光

2.4.6 起美术层的背景只有一条静态渐变，2.4.0–2.4.5 那套 canvas 地平线渲染器（`horizon-glow.js`）已连同控制器一起删除，**不得**加回，也不得再引入任何背景动画。

1. **挂在哪里**：`body[data-ct-art='on'] [data-conversation-region='chat']` 上的 `background-image`，绝对不生成节点、不接点击、不参与排版；`position: relative` 只为让这层落在对话区自己的坐标系里。
2. **画什么**：`linear-gradient(to top, accent 16% → chart-tools 9% @26% → transparent @54%)`，`background-repeat: no-repeat`、`background-position: bottom`——底部一条向上淡出的冷光。
3. **为什么是静态的**：逐帧重绘的 canvas 在 4 核机器上就是切页与滚动时那点卡顿的来源，而同一张图用 CSS 渐变表达时浏览器只需要合成一次。用户看到的「动的带子」也一并消失。
4. **和输入卡的关系**：渐变铺满整个对话区，底部被宿主的 seat 遮罩与输入卡盖住——这正是「正文在输入卡上方就被裁住」的效果，不要为了多看一截底光去动 composer 的遮罩或透明度。**2.4.9 补上被遮罩吃掉的那一截**：seat 自己的遮罩从透明渐变到 `bg-base`（36px），底光因此停在 seat 顶边（用户报的「渐变被切掉了」）。修法是**在 seat 上再画一遍底光**，叠在遮罩之上：
   - 选择器 `body[data-ct-art='on'] [data-conversation-region='chat'][data-content-phase='active'] [data-conversation-region='composer']`，特指度 (0,4,1) 压过宿主的 (0,3,0)，不用 `!important`；只认 active 相位——hero / settling 没有这条遮罩，也就不需要这一层。
   - `background-image` 两层：第一层是 `to top` 的 accent 16%（0px）→ chart-tools 11%（`calc(100% - 36px)`）→ transparent（100%），第二层**照抄宿主的遮罩**（`to bottom` 的 `bg-base` 0% → `bg-base` 36px）。整条 `background-image` 会被替换，所以遮罩必须一起写回来。
   - 为什么最后 36px 淡出：遮罩在这 36px 里从 0 升到不透明，底光按同样斜率升上来（`a × 深度 / 36px`），两层相加正好等于原渐变，接缝处没有台阶；36px 以下遮罩是全不透明的，底光用 11%（seat 高 150–260px 时那片区域的真实值约 10–12%），窗口底边回到 16%。
   - 只改 `background-image`：卡片底色、seat 的遮罩、透明度和其它属性都不动，正文照样在卡上方被裁住。离线舞台（无遮罩的同一渐变作基准）实测整列像素差 ≤3/255，行间最大跳变 3/255；2.4.8 的对照在 36px 内从 25 掉到 10 然后全平。
5. **宿主统计字并进试管**：美术层打开时 `body[data-ct-art='on'] [data-composer-stat] { display: none !important }` 隐藏宿主自己的 usage / activity 药丸，同样的读数改由试管浮窗底部的 `.ct-vial-usage` 一段呈现（`vialUsage()` 读官方 `tokenUsage` / `sessionStats` 投影，缺投影整行不渲染）。

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
| 84px | 像素伙伴舞台（220 × 84） |

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
- 不允许用负 margin 贴边；需要与输入卡对齐时用 `--dsh-composer-side-clearance` 与 `--dsh-composer-card-max-width` 把行**收窄并居中**（见「控件」里的胶囊）。

## 分页导航

1. 五个分页固定顺序：档位（`levels`）、规则（`rules`）、组件（`components`）、外观（`appearance`）、GitHub（`github`），由 `SECTIONS` 常量统一给出。**五个分页始终都在导航里**：某个页面没有数据时页面照常打开、在页内说明状态，不能因为没数据就把页面或导航项拿掉——分页是固定的地图，不是可选清单。2.4.8 起全局规则与工作区规则合并在同一页（`rules` 一张卡放全局 `AGENTS.md`，下一张卡放所选工作区的补充规则），独立的「工作区」分页删除。
2. 导航栏 `.ct-nav`：`position: sticky; top: 0`，玻璃底（`--ct-glass-rail`）+ 20px 圆角 + 内高光；品牌行是 14px 的 accent 图标 + 11px 大写文字。**`top` 只能是 0**：正值会把导航栏相对滚动口重新定位，静止状态就往下一段，导航栏顶部与右侧第一张卡片对不齐（1400×792 实测 `top: 18px` 时档位页差 13px、规则页差 18px，用户看到的就是「点击规则的时候页面有小小的位移」）。`top: 0` 下静止时两列都在 `padding-top` 的 22px 处（实测差值 0），滚动时导航栏也不再跳动。改回正值前先读这一条。
3. 导航项 `.ct-nav-item`：34px 高、12px 圆角、15px 图标 + 13px 文字、`justify-content: flex-start`；默认透明底 + 透明描边。
4. 当前页用 `aria-current="page"` 标记，样式是 accent 16% 淡染 + 40% accent 描边 + `inset 2px 0 0` 左竖条 + 22px 柔光；图标转 accent。**不要**用右侧箭头或加粗字号来区分。
5. 导航项必须是 `<button type="button">`，带 `data-section`（测试与样式共用），Enter/Space 切换；不用链接、不用 tab 角色。
6. 切换分页不写状态到宿主：当前分页只是面板内的 `useState`，刷新回到「档位」。

## 卡片

每张卡片三段，顺序固定：

1. **标题行**：`.ct-rules-head > h3`；档位卡片标题为「档位」。
2. **内容**：字段（`.ct-field`）、状态行（`.ct-status`）、说明或路径（`.ct-note`）。
3. **动作行**：`.ct-actions`，一行只放按钮；状态文字另起一行。

样式：`border: 1px solid var(--ct-glass-edge)`、`border-radius: 20px`、`background: var(--ct-glass-fill)` + `--ct-glass-sheen`、`padding: 16px 18px`、内部 `gap: 12px`，配 `--ct-glass-shadow` 与 `--ct-glass-inner`。

- **授权范围** `.ct-scopes`：GitHub 页在账号行下面单独一行显示 `gh auth status` 报出的 token scope（`repo · read:org · workflow`），12px `label-tertiary`，`overflow-wrap: anywhere`（scope 是一个长串标识符，不能把卡片撑宽）。缺 `repo` 时另起一条 `role="alert"` 状态行说明只能读不能推；scope 由 `gh` 报出，插件不读、不存 token 本身。
- **空状态写在卡片里，不写进导航**：还没注册工作区时，规则页的工作区卡片仍然渲染，标题行下面用一条 `.ct-note`（`role="status"`）写「目前无工作区」，不渲染选择器与文本域，保存按钮常显、置灰、`title` 与这条说明一致；还没读到时写「正在读取…」（不要拿「无工作区」冒充加载态）。任何页面都不得因为数据为空而整页消失。
- **工作区卡片只编辑补充规则**：文本域里是插件自己写入的那个受管块（`<!-- compression-tiers:workspace-rules:start -->` … `:end -->`），保存时插到该工作区 `AGENTS.md` 的**开头**，没有文件就创建，块下面的正文原样保留。磁盘上那份文件本来就有的正文**不进面板**——它不属于插件，读接口也只返回受管块的内容。
- 链接一律 `target="_blank" rel="noreferrer noopener"`；正文里不出现裸 URL 文本以外的装饰。
- 空的状态行/说明行用 `:empty` 收起（`display: none`），面板底部不留空白。

## 控件

- **按钮只有一套**：`.ct-btn` 定几何（30px 高、10px 圆角、13px 字），`.ct-btn--primary` 只加描边与底色，不改尺寸；每个动作行由共享的 `actionButton()` / `actionRow()` 渲染。
- **动作按钮常显**：条件不满足时渲染为 `disabled` 并给 `title` 说明原因，不得整天消失（[AGENTS.md](../AGENTS.md) 第 16 条）。
- **输入框 / 文本域**：透明底 + `border-l2` + 10px 圆角，聚焦时 `outline: 2px solid accent; outline-offset: 2px`；文本域可纵向 resize。
- **下拉触发器** `.ct-select`：`aria-haspopup="listbox"`、`aria-expanded`，宽 `min(100%, 360px)`、高 34px、左对齐（`justify-self: start`），展开时描边转 `border-selected`、箭头 180° 旋转；禁用态用 `label-tertiary`。
- **胶囊** `.ct-repo-pill`：26px 高、999px 圆角、图标 + 标签 + 值 + 箭头；绑定态用 accent 淡染底与 accent 混合描边。
- **试管触发器** `.ct-vial`：26px 高胶囊，`flex: none`；里面是 10 × 16 的 SVG 迷你试管（液面 `rect` + 阈值 `line`）与百分比文字，`font-variant-numeric: tabular-nums`（数字变化时宽度不跳）。展开时 `aria-expanded='true'`，占用已贴近阈值时 `data-critical='true'` 转 warn 色。它**不是**动作按钮的例外——任何时候都渲染，投影缺失时显示「—」并禁用。
- **胶囊必须正对输入卡**：`conversation.input.dock` 渲染在整宽的 `.composerStack` 里，而输入卡自己用 `--dsh-composer-card-max-width` 居中。`.ct-repo-dock` 因此写成
  `width: min(calc(100% - var(--dsh-composer-side-clearance, 16px) * 2), var(--dsh-composer-card-max-width, 720px)); margin: 0 auto`，
  行内 `justify-content: flex-end`，胶囊右缘就落在输入卡右缘上。整宽行配 `padding: 0 var(--dsh-composer-side-clearance)` 只解决「不贴窗口边」，锚不到卡右缘（1.9.x 的观测结果），不要再改回去。

## 外观页

一张卡片三段：配色（3 个色板）→ 动效（3 个分段按钮）→ 像素伙伴（1 个开关）。

1. **配色用色板，不用下拉**：`.ct-swatches` 是 3 列栅格（`@container (max-width: 640px)` 时 2 列），每个选项是 `role="radio"` + `aria-checked` 的按钮；顶部 `.ct-swatch-band` 是一条 22px 的三段渐变色带（深色端 / 浅色端 / accent），下面 12px 名称。两套配色都跟随宿主深浅，所以色带同时露出深色端与浅色端；色带只用作预览，颜色写死在各 `data-choice` 里——它展示的**不是**当前主题的 token。
2. **动效用分段按钮**：`.ct-segment` 34px 高，`role="radiogroup"` 包住三个 `role="radio"`；选中态 accent 16% 淡染 + 50% 描边。
3. **像素伙伴用开关式动作按钮**：`actionButton()` 渲染，`aria-pressed` 表示状态，开启时加 `ct-btn--primary`；标签随状态在「已开启 / 已关闭」之间切换，不用复选框、不用开关滑块。
4. **写入是乐观的**：点选立刻改本地状态并发 `POST /compression-tiers/api/settings`；失败回滚到上一个值，并在卡片底部的 `.ct-status`（`role="status"`）写一条失败提示。请求进行中三个控件一起 `disabled`，避免连点打架。成功响应同时推给设置快照的订阅者（`rememberSettings()` → `subscribeSettings()`），所以输入框上方那一行不必等切会话重挂载就会跟着换配色 / 动效 / 伙伴开关；外观引导读取失败时**不**用默认值涂抹，而是按 1.5s × 次数退避重试（首次失败有旧快照才回退）。
5. 颜色与动效同时作用于面板页根、输入框上方那一行与 portal 出去的菜单——皮肤靠 `data-palette` / `data-motion` 三个根节点各自带上属性，不要指望继承。

## 输入框上方那一行

`.ct-repo-dock` 渲染在 `conversation.input.dock`（输入框正上方的整宽槽），一行两块：

| 块 | 类名 | 规则 |
| --- | --- | --- |
| 像素伙伴 | `.ct-dock-mascots` | `flex: 0 0 220px`、`height: 84px`；窄于 620px（容器查询）时 `display: none` |
| 工具区 | `.ct-dock-tools` | `flex: 1 1 auto` + `justify-content: flex-end` + `margin-left: auto`，内放试管触发器、状态小字（`.ct-repo-note`）与仓库胶囊 |

- 行宽按输入卡几何收窄并居中（见上一节「胶囊必须正对输入卡」），`box-sizing: border-box`。
- **容器查询的容器是 `.ct-repo-dock`**（`container-type: inline-size`），伙伴的显隐按**这一行**的宽度判断，不按窗口宽度——窗口宽但输入卡窄时，伙伴会压到胶囊上。
- 关掉像素伙伴（外观页）时 `.ct-dock-mascots` 整块不渲染，工具区仍然 `margin-left: auto` 右对齐；不要为了让行不塌而渲染一个空占位。
- 伙伴是 canvas 像素画，容器 `.ct-mascot-stage` 固定 220 × 84；canvas 用 `image-rendering: pixelated`，定位是 `position: absolute; left/bottom: 0`，宿主样式不得改写 `ag-v2-*` 的几何（那是移植模块自己的坐标系）。模块加载失败时 `data-state='failed'` 把舞台收起，不留空白框。
- **伙伴不得抢焦点、不得拦截输入**：canvas 是 `pointer-events: none`，只有外层 actor 接受点击（`cursor: grab`，拖动时 `grabbing`），点击只是 `poke()` 一下，不写设置。

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
| 完整 | `full` | 全部：分页/菜单进场、液面过渡、伙伴动画 |
| 克制 | `subtle` | 去掉分页与菜单进场、去掉液面过渡；伙伴照常 |
| 关闭 | `off` | 再把 `reducedMotion: true` 传给试管与伙伴（物理与帧动画停住） |

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
- ❌ 为了多看一截底光去关掉 seat 遮罩、把输入卡改半透明，或在 seat 上重画背景时把遮罩那一层漏掉（底光会换成一整块不透明的 `bg-base`）。
- ❌ 用实色或第二层遮罩冒充底光（`background-color` 一旦写上去，正文就会被盖住或被透出来）。
- ❌ 给同一个面板换第二套卡片圆角或第二套玻璃配方。
- ❌ 给 `.ct-nav` 写正的 `sticky` `top`（导航栏会离第一张卡片一个偏移），或在分页进场里加位移/缩放。
- ❌ 往 `:root` / `body` 写配色变量，或在 `.ct-skin` 里写 `color-scheme`（皮肤靠 `body[data-ds-dark-theme]` 跟随宿主，自己设会打架）。
- ❌ 选配色时顺手 `theme.setTheme()` 改用户的外观偏好（2.2.0 已删除这次写入）。
- ❌ 往官方模型菜单里塞一个拨动后不影响推理等级的装饰控件，或用哈希类名认锚点（只能用语义属性，认不出就不注入）。
- ❌ 让 `client.js` import 移植模块（它们是 UMD，只能走同源 `<script src="/compression-tiers/vendor/…">`）。
- ❌ 用条件渲染隐藏试管触发器（投影缺失时也要渲染，显示「—」并禁用）。
- ❌ 在输入框上方那一行用 `@media` 判断伙伴显隐（要按行宽，用容器查询）。

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
| `.ct-repo-dock` / `.ct-repo-pill` / `.ct-repo-note` | 输入框上方那一行（收窄到输入卡并居中、容器查询的容器）/ 仓库胶囊 / 状态小字 |
| `.ct-dock-mascots` / `.ct-dock-tools` / `.ct-mascot-stage` | 像素伙伴槽 / 右侧工具区 / 伙伴舞台（220 × 84） |
| `.ct-vial` / `.ct-vial-popover` / `.ct-vial-canvas` | 试管触发器 / 浮窗 / 物理画布（96 × 220） |
| `.ct-vial-rows` / `.ct-vial-bar` / `.ct-vial-legend` | 浮窗数字行 / 三段构成条 / 图例 |
| `.ct-effort` / `.ct-effort-track` / `.ct-effort-gem` | 注入官方模型菜单的推理轨道 / `role="slider"` 的轨道 / 那颗白色圆钮（2.4.1 起不是切面宝石） |
| `.ct-effort-rail` / `.ct-effort-fill` / `.ct-effort-dot` / `.ct-effort-error` | 轨道条 / 已选段 / 档位点 / 失败原因 |
| `.ct-status` / `.ct-note` / `.ct-meta` / `.ct-scopes` | 状态行 / 弱化说明 / 页脚元信息 / 授权范围 |

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
- [ ] 外观页三组控件都能改、失败会回滚；伙伴开关是 `aria-pressed` 的按钮，不是复选框。
- [ ] 试管触发器任何时候都在（投影缺失显示「—」），浮窗里有数字、构成条与图例。
- [ ] 推理滑块只出现在官方「推理等级」行下面：行按标签认（两行兜底），多于两行又没有标签命中就不加；锚点是语义属性，`role="slider"` 带 min/max/now/valuetext；写不进去就回滚并写原因；注入后不派发 `resize`；会话目录每次重取、丢了节点会重建。
- [ ] 输入框上方那一行按 `@container` 决定伙伴显隐，窗口窄但卡宽时也不会互相压住。
- [ ] 动效三档都试过：`subtle` 只关进场与液面过渡，`off` 还把 `reducedMotion` 传给了试管与伙伴。
- [ ] 空状态行不占位。
- [ ] 规则页是两张卡：上面全局 `AGENTS.md`，下面所选工作区的补充规则；两张卡各有一个文本域与一个保存按钮。
- [ ] 工作区文本域里只有受管块的内容，保存后插在 `AGENTS.md` 开头，文件原有的正文原样留在块下面。
- [ ] 输入卡归宿主：没有改 `[data-composer-card]` 的底色，seat 的遮罩与其它属性也没动；seat 上只多一层底光背景（叠在遮罩之上、并照抄遮罩），正文在卡上方就被裁住。
- [ ] 底光跨过 seat 顶边是连续的：离线舞台里与「没有遮罩」的基准比，整列像素差 ≤3/255，没有台阶。
- [ ] 对话区背景只有一条静态 `linear-gradient`，样式表里没有 canvas、没有背景关键帧。
- [ ] `npm test` 通过（`test/client.test.js` 覆盖外壳、导航、分页、玻璃变量、授权范围行、规则页两张卡、外观页、试管、伙伴与自绘下拉；`test/workspace-rules.test.js` 覆盖受管块的读写；`test/vendor.test.js` 覆盖移植模块与 GPL 文件）。
- [ ] 视觉效果无法在真实窗口确认时，交付说明写「渲染未验证」。
