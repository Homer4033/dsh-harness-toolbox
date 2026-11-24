# 面板 UI 规范（dsh-harness-toolbox）

> 本文件约束本插件**自己画**的那部分界面：左侧栏「压缩分档」面板、输入框上方的仓库胶囊与全部自绘弹层。宿主主题与官方组件（侧边栏、输入框、标题栏）不在范围内，也不要试图改它们。

## 目录

- [范围](#范围)
- [表面与颜色](#表面与颜色)
- [间距、圆角与控件高度](#间距圆角与控件高度)
- [排版](#排版)
- [布局](#布局)
- [卡片](#卡片)
- [控件](#控件)
- [下拉与弹层](#下拉与弹层)
- [动效](#动效)
- [焦点与可访问性](#焦点与可访问性)
- [禁止项](#禁止项)
- [落地映射](#落地映射)
- [检查清单](#检查清单)

## 范围

- 只用主题 token（`--dsw-alias-*`），不写死主题色；阴影与高光允许 `rgba(0,0,0,…)` / `rgba(255,255,255,…)`。
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
| 二级描边（同层级里的强调） | `--dsw-alias-border-l3` | `rgba(255,255,255,.16)` |
| 选中描边 | `--dsw-alias-border-selected` | `#adb2b8` |
| 正文 | `--dsw-alias-label-primary` | `#f9fafb` |
| 次要文字 | `--dsw-alias-label-secondary` | `#cfd3d6` |
| 弱化文字（路径、字符数） | `--dsw-alias-label-tertiary` | `#adb2b8` |
| 悬停底 | `--dsw-alias-interactive-bg-hover` | `rgba(255,255,255,.08)` |
| 强调色（accent） | `--dsw-alias-state-business-primary` | `#7aaaff` |

- **层级靠表面递进**：页面底 → 卡片（layer-2）→ 弹层（layer-3）。弹层不得继续用 layer-2：它和卡片同色，浮在页面上就像一行浮着的文字。
- **允许在 accent 上做淡染**：`color-mix(in srgb, var(--dsw-alias-state-business-primary) 12–20%, transparent)` 用于悬停、选中、选中行的左竖条。必须保留不依赖 `color-mix` 的回退声明（先写纯 token 值）。
- **玻璃质感**：弹层可叠 `backdrop-filter: blur(18px) saturate(150%)` 与顶部 `linear-gradient` 高光，底必须是 layer-3 与透明度的混合，不能是纯黑。

## 间距、圆角与控件高度

| 刻度 | 用途 |
| --- | --- |
| 4px | 图标与文字、状态行之间 |
| 6px | 弹层内边距、字段内部 |
| 8px | 按钮之间、弹层与触发器之间 |
| 12px | 卡片内主间距、表单行 |
| 16px | 卡片之间、栅格列间、卡片内边距 |
| 24 / 32px | 页面边距、区块分隔 |

| 圆角 | 用途 |
| --- | --- |
| 8px | 代码块、小标签 |
| 10px | 按钮、输入框、下拉触发器、弹层选项 |
| 16px | 卡片、弹层 |
| 999px | 胶囊、标签 |

| 高度 | 用途 |
| --- | --- |
| 26px | 输入框上方的仓库胶囊 |
| 30px | 面板动作按钮 |
| 34px | 下拉触发器、弹层选项 |

## 排版

| 角色 | 字号 / 行高 / 字重 |
| --- | --- |
| 面板标题 `h2` | 20 / 28 / 600，`letter-spacing: -0.02em` |
| 卡片标题 `h3` | 15 / 22 / 600 |
| 正文、按钮、字段标签 | 13 / 20 / 400 |
| 状态行、次要说明 | 12 / 18 / 400 |
| 弹层分组标题 | 11 / 15 / 600，`letter-spacing: .1em`，大写 |
| 弹层元信息（私有标签、字符数） | 10–11 / 14–16 / 400 |

等宽字体只用于二进制名与验证码（`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`）。

## 布局

- 面板自身是滚动容器：`.ct-page` 为 `flex: 1 1 auto; overflow-y: auto`，内容 `.ct-page-inner` 最大宽 **960px** 居中，卡片间距 **16px**。
- **宽面板两栏**：`.ct-page-inner` 是容器查询的容器（`container-type: inline-size`）；`.ct-columns` 默认单列，`@container (min-width: 880px)` 时变成 `repeat(2, minmax(0,1fr))`。左列＝档位 + 全局规则，右列＝工作区规则 + 组件管理 + GitHub 登录；页脚元信息通栏。
- **按面板宽度判断，不按窗口宽度**：左侧栏占掉窗口的一段固定宽度，1200px 的窗口留给面板的远不到 1200px；用 `@media` 会在「窗口够宽、面板不够宽」时错误地排成两栏。容器查询不可用的环境退回单列，这是可接受的降级。
- 卡片高度由内容决定（`align-content: start`），两列不强行等高。
- 不允许用负 margin 贴边；需要与输入卡对齐时用 `--dsh-composer-side-clearance`。

## 卡片

每张卡片三段，顺序固定：

1. **标题行**：`.ct-rules-head > h3`；无标题的卡片（档位）直接从内容开始。
2. **内容**：字段（`.ct-field`）、状态行（`.ct-status`）、说明或路径（`.ct-note`）。
3. **动作行**：`.ct-actions`，一行只放按钮；状态文字另起一行。

样式：`border: 1px solid var(--dsw-alias-border-l2)`、`border-radius: 16px`、`background: var(--dsw-alias-bg-layer-2)`、`padding: 16px 18px`、内部 `gap: 12px`，外加 `box-shadow: 0 1px 2px rgba(0,0,0,.12)` 的极浅分层。

空的状态行/说明行用 `:empty` 收起（`display: none`），面板底部不留空白。

## 控件

- **按钮只有一套**：`.ct-btn` 定几何（30px 高、10px 圆角、13px 字），`.ct-btn--primary` 只加描边与底色，不改尺寸；每个动作行由共享的 `actionButton()` / `actionRow()` 渲染。
- **动作按钮常显**：条件不满足时渲染为 `disabled` 并给 `title` 说明原因，不得整天消失（[AGENTS.md](../AGENTS.md) 第 16 条）。
- **输入框 / 文本域**：透明底 + `border-l2` + 10px 圆角，聚焦时 `outline: 2px solid accent; outline-offset: 2px`；文本域可纵向 resize。
- **下拉触发器** `.ct-select`：`aria-haspopup="listbox"`、`aria-expanded`，宽 `min(100%, 360px)`、高 34px、左对齐（`justify-self: start`），展开时描边转 `border-selected`、箭头 180° 旋转；禁用态用 `label-tertiary`。
- **胶囊** `.ct-repo-pill`：26px 高、999px 圆角、图标 + 标签 + 值 + 箭头；绑定态用 accent 淡染底与 accent 混合描边。

## 下拉与弹层

1. **只自绘**：面板与胶囊里不得出现原生 `<select>`。它的弹层由操作系统绘制，深色主题下是「浅底 + 继承来的浅字」，选项在白底上不可见。
2. **挂载**：`createPortal` 到 `document.body` + `position: fixed`。输入框附近与面板滚动容器里的 `fixed` 后代必须 portal，否则会被裁剪。
3. **定位**：统一走 `placeMenu()`——默认**上拉**（`bottom = 视口高 − 触发器顶 − 8`），`max-height` 取该侧空间（上限 320px）；上方不足 200px 且小于下方时翻成 `data-side='down'` 并改按 `top` 定位。右对齐的触发器（仓库胶囊）用 `align: 'end'`，让菜单向右边缘对齐、朝页面中间展开。
4. **表面**：layer-3 + 玻璃 + 顶部高光 + 大阴影；16px 圆角；`z-index: 2147483000`。
5. **结构**：分组标题（大写、11px、前面 2px accent 竖条）→ 渐变分隔线 → 选项。选项 34px 高、10px 圆角：悬停/键盘高亮用 accent 13–15% 淡染，选中项 20% 淡染 + 左侧 2px accent 竖条 + 勾选位；私有等元信息用右侧 pill 标签。
6. **交互**：点触发器开关；点外部、Esc、窗口 resize 关闭；打开后焦点进入 listbox；↑ / ↓ / Home / End 移动，Enter / Space 选中；触发器与 listbox 都带 `aria-haspopup` / `aria-expanded` / `aria-activedescendant`。
7. **进场**：`data-side` 决定位移方向，140ms 淡入 + 6px 位移 + 0.98 缩放。

## 动效

- 只做 110–140ms 的 `background-color` / `border-color` / `color` / `transform` 过渡与弹层进场；不做位移布局、不做长于 200ms 的动画。
- 展开箭头 140ms `rotate(180deg)`；按钮与选项 hover 110–120ms。
- 支持 `prefers-reduced-motion` 时由宿主统一处理，插件不加自己的长动画。

## 焦点与可访问性

- 可聚焦控件必须有可见焦点环：`outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px`；listbox 内部选项用 `outline-offset: -2px`。
- 按钮必须有可读标签（`<button type="button">` + 文本或 `aria-label`）；不用 `div` 假装按钮。
- 状态与错误用 `role="status"` / `role="alert"` + `aria-live`，并占据固定的一行位置，避免出现时把下方内容顶动。

## 禁止项

- ❌ 原生 `<select>`、原生 `<option>` 弹层。
- ❌ 弹层底色用 layer-2（与卡片同色），或写死十六进制主题色。
- ❌ 用条件渲染隐藏动作按钮。
- ❌ 面板里写教学段、原理段、操作步骤（第 15 条）。
- ❌ 第二套按钮样式、按面板分裂的按钮文案。
- ❌ 用负 margin 贴到输入卡边缘。

## 落地映射

| 类名 | 作用 |
| --- | --- |
| `.ct-page` / `.ct-page-inner` | 面板滚动容器 / 960px 居中内容 |
| `.ct-columns` / `.ct-col` | 两栏栅格 / 单列容器 |
| `.ct-panel` | 卡片 |
| `.ct-rules-head` / `.ct-actions` | 卡片标题行 / 动作行 |
| `.ct-levels` / `.ct-level` | 档位按钮组 / 单个档位 |
| `.ct-field` / `.ct-textarea` / `.ct-input` | 字段 / 文本域 / 路径输入 |
| `.ct-select` / `.ct-select-value` | 下拉触发器 / 当前值 |
| `.ct-menu` / `.ct-menu-head` / `.ct-menu-option` | 弹层 / 分组标题 / 选项 |
| `.ct-repo-dock` / `.ct-repo-pill` | 输入框上方的行 / 仓库胶囊 |
| `.ct-status` / `.ct-note` / `.ct-meta` | 状态行 / 弱化说明 / 页脚元信息 |

## 检查清单

改面板或弹层后逐条确认：

- [ ] 只用 token，不出现新的主题色硬编码。
- [ ] 面板宽 ≥880px 两栏、更窄单列（容器查询，不是窗口宽度）；卡片仍是 16px 圆角。
- [ ] 所有动作按钮常显，禁用时有 `title`。
- [ ] 没有原生 `<select>`；弹层是 layer-3 + portal + `data-side`，表面不是 layer-2。
- [ ] 键盘：↑ / ↓ / Home / End / Enter / Esc 与外部点击都能走通。
- [ ] 空状态行不占位。
- [ ] `npm test` 通过（`test/client.test.js` 覆盖栅格、自绘下拉与菜单类名）。
- [ ] 视觉效果无法在真实窗口确认时，交付说明写「渲染未验证」。
