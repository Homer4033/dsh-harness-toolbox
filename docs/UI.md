# 面板 UI 规范（dsh-harness-toolbox）

> 本文件约束本插件**自己画**的那部分界面：左侧栏「压缩分档」面板（液体玻璃外壳 + 左侧分页导航）、输入框上方那一行（上下文试管、像素伙伴与仓库胶囊）、外观页的两套皮肤，以及全部自绘弹层。宿主主题与官方组件（侧边栏、输入框、标题栏）不在范围内，也不要试图改它们。

## 目录

- [范围](#范围)
- [表面与颜色](#表面与颜色)
- [配色皮肤](#配色皮肤)
- [间距、圆角与控件高度](#间距圆角与控件高度)
- [排版](#排版)
- [布局](#布局)
- [分页导航](#分页导航)
- [卡片](#卡片)
- [控件](#控件)
- [外观页](#外观页)
- [输入框上方那一行](#输入框上方那一行)
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
- 玻璃块统一 `backdrop-filter: blur(22–26px) saturate(160–170%)`；边缘 1px `--ct-glass-edge`，不加第二层描边。

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

1. 六个分页固定顺序：档位（`levels`）、规则（`rules`）、工作区（`workspace`）、组件（`components`）、外观（`appearance`）、GitHub（`github`），由 `SECTIONS` 常量统一给出。**六个分页始终都在导航里**：某个页面没有数据（例如还没注册工作区）时页面照常打开、在页内说明状态，不能因为没数据就把页面或导航项拿掉——分页是固定的地图，不是可选清单。
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
- **空状态写在卡片里，不写进导航**：工作区页在没有注册工作区时仍然打开，标题行下面用一条 `.ct-note`（`role="status"`）写「目前无工作区」，不渲染选择器与文本域，保存按钮常显、置灰、`title` 与这条说明一致；还没读到时写「正在读取…」（不要拿「无工作区」冒充加载态）。任何页面都不得因为数据为空而整页消失。
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
4. **写入是乐观的**：点选立刻改本地状态并发 `POST /compression-tiers/api/settings`；失败回滚到上一个值，并在卡片底部的 `.ct-status`（`role="status"`）写一条失败提示。请求进行中三个控件一起 `disabled`，避免连点打架。
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

  实现上 `subtle` / `off` 只加两条 CSS（`.ct-page[data-motion=…] .ct-content { animation: none }` 与 `.ct-skin[data-motion=…] .ct-vial-liquid { transition: none }`），`off` 额外在 JS 侧传参；新增动效时必须同时检查这三档，不要只写 `prefers-reduced-motion`。

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
- ❌ 给同一个面板换第二套卡片圆角或第二套玻璃配方。
- ❌ 给 `.ct-nav` 写正的 `sticky` `top`（导航栏会离第一张卡片一个偏移），或在分页进场里加位移/缩放。
- ❌ 往 `:root` / `body` 写配色变量，或在 `.ct-skin` 里写 `color-scheme`（皮肤靠 `body[data-ds-dark-theme]` 跟随宿主，自己设会打架）。
- ❌ 选配色时顺手 `theme.setTheme()` 改用户的外观偏好（2.2.0 已删除这次写入）。
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
- [ ] 输入框上方那一行按 `@container` 决定伙伴显隐，窗口窄但卡宽时也不会互相压住。
- [ ] 动效三档都试过：`subtle` 只关进场与液面过渡，`off` 还把 `reducedMotion` 传给了试管与伙伴。
- [ ] 空状态行不占位。
- [ ] `npm test` 通过（`test/client.test.js` 覆盖外壳、导航、分页、玻璃变量、授权范围行、外观页、试管、伙伴与自绘下拉；`test/vendor.test.js` 覆盖移植模块与 GPL 文件）。
- [ ] 视觉效果无法在真实窗口确认时，交付说明写「渲染未验证」。
