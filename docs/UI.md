# 面板 UI 规范（dsh-harness-toolbox）

> 本文件约束本插件**自己画**的那部分界面：左侧栏「压缩分档」面板（液体玻璃外壳 + 左侧分页导航）、输入框上方的仓库胶囊与全部自绘弹层。宿主主题与官方组件（侧边栏、输入框、标题栏）不在范围内，也不要试图改它们。

## 目录

- [范围](#范围)
- [表面与颜色](#表面与颜色)
- [间距、圆角与控件高度](#间距圆角与控件高度)
- [排版](#排版)
- [布局](#布局)
- [分页导航](#分页导航)
- [卡片](#卡片)
- [控件](#控件)
- [下拉与弹层](#下拉与弹层)
- [动效](#动效)
- [焦点与可访问性](#焦点与可访问性)
- [禁止项](#禁止项)
- [落地映射](#落地映射)
- [检查清单](#检查清单)

## 范围

- 只用主题 token（`--dsw-alias-*`），不写死主题色；阴影、高光与玻璃高光允许 `rgba(0,0,0,…)` / `rgba(255,255,255,…)`。
- 面板与弹层必须在深色、浅色两套主题下都能读：任何「深色底 + 继承浅色字」的组合都不算可用设计。
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
| 26px | 输入框上方的仓库胶囊 |
| 30px | 面板动作按钮 |
| 34px | 导航项、下拉触发器、弹层选项 |

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
- **一个外壳、一次一页**：`.ct-shell` 是 `grid-template-columns: 196px minmax(0, 1fr)`、间距 20px、最大宽 980px 居中；左列是固定导航栏 `.ct-nav`，右列是当前页 `.ct-content`（`key` 随分页变化，触发 160ms 进场）。不再有整页长滚动与两栏拼贴。
- **容器查询的容器是 `.ct-page`**（`container-type: inline-size`），不是 `.ct-shell`：元素不能被自己的容器查询命中，把 `container-type` 放在 `.ct-shell` 上时，`@container` 里对 `.ct-shell` 的规则不会生效——外壳留在两栏、只有子元素被改成横向，导航项会被裁在 196px 里。
- **按面板宽度判断，不按窗口宽度**：左侧栏占掉窗口的一段固定宽度，1200px 的窗口留给面板的远不到 1200px；用 `@media` 会在「窗口够宽、面板不够宽」时错判。容器查询不可用的环境退回两栏，这是可接受的降级。
- **窄面板（≤720px）**：导航栏变成页面上方的横向条（`flex` + `flex-wrap: wrap`，6px 内边距、16px 圆角、品牌行隐藏），导航项 `width: auto`、34px 高。必须换行，不能用 `overflow-x` 横滚——被裁掉的页面等于没有入口。
- 卡片高度由内容决定（`align-items: start`）。
- 不允许用负 margin 贴边；需要与输入卡对齐时用 `--dsh-composer-side-clearance` 与 `--dsh-composer-card-max-width` 把行**收窄并居中**（见「控件」里的胶囊）。

## 分页导航

1. 五个分页固定顺序：档位（`levels`）、规则（`rules`）、工作区（`workspace`）、组件（`components`）、GitHub（`github`）。**五个分页始终都在导航里**：某个页面没有数据（例如还没注册工作区）时页面照常打开、在页内说明状态，不能因为没数据就把页面或导航项拿掉——分页是固定的地图，不是可选清单。
2. 导航栏 `.ct-nav`：`position: sticky; top: 18px`，玻璃底（`--ct-glass-rail`）+ 20px 圆角 + 内高光；品牌行是 14px 的 accent 图标 + 11px 大写文字。
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
- **胶囊必须正对输入卡**：`conversation.input.dock` 渲染在整宽的 `.composerStack` 里，而输入卡自己用 `--dsh-composer-card-max-width` 居中。`.ct-repo-dock` 因此写成
  `width: min(calc(100% - var(--dsh-composer-side-clearance, 16px) * 2), var(--dsh-composer-card-max-width, 720px)); margin: 0 auto`，
  行内 `justify-content: flex-end`，胶囊右缘就落在输入卡右缘上。整宽行配 `padding: 0 var(--dsh-composer-side-clearance)` 只解决「不贴窗口边」，锚不到卡右缘（1.9.x 的观测结果），不要再改回去。

## 下拉与弹层

1. **只自绘**：面板与胶囊里不得出现原生 `<select>`。它的弹层由操作系统绘制，深色主题下是「浅底 + 继承来的浅字」，选项在白底上不可见。
2. **挂载**：`createPortal` 到 `document.body` + `position: fixed`。输入框附近与面板滚动容器里的 `fixed` 后代必须 portal，否则会被裁剪。
3. **定位**：统一走 `placeMenu()`——默认**上拉**（`bottom = 视口高 − 触发器顶 − 8`），`max-height` 取该侧空间（上限 320px）；上方不足 200px 且小于下方时翻成 `data-side='down'` 并改按 `top` 定位。右对齐的触发器（仓库胶囊）用 `align: 'end'`，让菜单向右边缘对齐、朝页面中间展开。
4. **表面**：layer-3 + 玻璃 + 顶部高光 + 大阴影；16px 圆角；`z-index: 2147483000`。
5. **结构**：分组标题（大写、11px、前面 2px accent 竖条）→ 渐变分隔线 → 选项。选项 34px 高、10px 圆角：悬停/键盘高亮用 accent 13–15% 淡染，选中项 20% 淡染 + 左侧 2px accent 竖条 + 勾选位；私有等元信息用右侧 pill 标签。
6. **交互**：点触发器开关；点外部、Esc、窗口 resize 关闭；打开后焦点进入 listbox；↑ / ↓ / Home / End 移动，Enter / Space 选中；触发器与 listbox 都带 `aria-haspopup` / `aria-expanded` / `aria-activedescendant`。
7. **进场**：`data-side` 决定位移方向，140ms 淡入 + 6px 位移 + 0.98 缩放。

## 动效

- 只做 110–160ms 的 `background-color` / `border-color` / `color` / `transform` 过渡、分页进场与弹层进场；不做位移布局、不做长于 200ms 的动画。
- 分页进场 `ct-page-in` 160ms：`opacity 0→1` + `translateY(3px)→0`；只挂在 `.ct-content` 上，不重播导航栏。
- 展开箭头 140ms `rotate(180deg)`；按钮与选项 hover 110–120ms。
- 用 `--virtual-time-budget` 之类冻结时钟的截图工具里，进场动画可能停在 `opacity: 0` 的首帧：预览样式要单独关掉它，交付截图前先确认画面不是全黑。

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
| `.ct-repo-dock` / `.ct-repo-pill` | 输入框上方的行（收窄到输入卡并居中）/ 仓库胶囊 |
| `.ct-status` / `.ct-note` / `.ct-meta` / `.ct-scopes` | 状态行 / 弱化说明 / 页脚元信息 / 授权范围 |

## 检查清单

改面板或弹层后逐条确认：

- [ ] 只用 token，不出现新的主题色硬编码。
- [ ] 面板是「导航栏 + 一次一页」，分页顺序与 `SECTIONS` 一致，当前页有 `aria-current="page"`。
- [ ] `container-type` 在 `.ct-page` 上；面板 ≤720px 时导航栏是换行的横向条，没有被裁掉的页面。
- [ ] 卡片仍是 20px 圆角、同一套玻璃配方；导航栏比卡片低一层。
- [ ] 所有动作按钮常显，禁用时有 `title`。
- [ ] 没有原生 `<select>`；弹层是 layer-3 + portal + `data-side`，表面不是 layer-2。
- [ ] 键盘：↑ / ↓ / Home / End / Enter / Esc 与外部点击都能走通。
- [ ] 仓库胶囊右缘与输入卡右缘对齐（`min()` + `margin: 0 auto`，没有负 margin）。
- [ ] 空状态行不占位。
- [ ] `npm test` 通过（`test/client.test.js` 覆盖外壳、导航、分页、玻璃变量、授权范围行与自绘下拉）。
- [ ] 视觉效果无法在真实窗口确认时，交付说明写「渲染未验证」。
