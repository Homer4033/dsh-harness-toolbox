<div align="center">

<img src="icon.svg" width="88" height="88" alt="压缩分档与综合工作台" />

# 压缩分档与综合工作台 · dsh-harness-toolbox

**为 DeepSeek Harness 打造的五档上下文压缩与综合工作台**

五档压缩 · 会流动的上下文试管 · 空会话的本机用量热力图 · 本地模型与六套托管组件 · 两套跟随宿主深浅的配色 · 全局与工作区规则 · 会话仓库发布

[**简体中文**](README.md) | [**English**](docs/README.en.md) · [**更新日志 (CHANGELOG)**](./docs/CHANGELOG.md) · [**问题反馈 (Issues)**](https://github.com/Homer4033/dsh-harness-toolbox/issues) · [**npm 包**](https://www.npmjs.com/package/dsh-harness-toolbox) · [**插件详情**](./docs/DETAIL.zh.md)

<p>
  <a href="https://www.npmjs.com/package/dsh-harness-toolbox"><img src="https://img.shields.io/npm/v/dsh-harness-toolbox?style=flat-square&color=3186ff&label=npm" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/Version-2.7.7-0f172a?style=flat-square" alt="Version 2.7.7" />
  <img src="https://img.shields.io/badge/DSH-0.2.2--rc.3%20~%200.3.0-1e293b?style=flat-square" alt="DSH runtime range" />
  <a href="https://github.com/Homer4033/dsh-harness-toolbox/actions"><img src="https://img.shields.io/github/actions/workflow/status/Homer4033/dsh-harness-toolbox/ci.yml?branch=main&style=flat-square&label=CI" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/Tests-273%20passing-16a34a?style=flat-square" alt="273 tests passing" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-2563eb?style=flat-square" alt="License: GPL-3.0" /></a>
  <a href="./NOTICE"><img src="https://img.shields.io/badge/Attribution-Required%20(NOTICE)-8b5cf6?style=flat-square" alt="Attribution Required" /></a>
</p>

<img src="docs/screenshots/hero.png" width="100%" alt="对话里的上下文试管浮窗与输入框上方的仓库胶囊（深空黑曜配色）" />

<sub>以上画面由离线渲染舞台直接运行本仓库前端源码截图，示例会话、仓库与数字均为虚构。</sub>

</div>

> **非官方项目与商标免责声明 (Non-Affiliation Disclaimer)**
>
> 本项目是独立的开源 DSH 插件，与 DeepSeek 无隶属、赞助或官方背书关系。
> 界面概念与移植脚本来自 [Obsidian Prism](https://github.com/RMvdesi/obsidian-prism)（GPL-3.0-only）；原作者与该项目不因此为本项目背书。

---

## 目录

- [亮点](#亮点)
- [界面预览](#界面预览)
  - [1. 对话：上下文试管与输入框上方那一行](#1-对话上下文试管与输入框上方那一行)
  - [2. 面板：玻璃外壳 + 五个分页](#2-面板玻璃外壳-五个分页)
  - [3. 空白会话：本机用量看板](#3-空白会话本机用量看板)
- [快速安装指南](#快速安装指南)
  - [方式一：从 npm 安装](#方式一从-npm-安装推荐)
  - [方式二：从本地目录安装](#方式二从本地目录安装推荐开发者)
  - [升级与回退](#升级与回退)
- [使用](#使用)
  - [面板的五个分页](#面板的五个分页)
  - [规则：全局与工作区](#规则全局与工作区)
  - [外观：配色、动效与光学外观](#外观配色动效与光学外观)
  - [主题美术与底光](#主题美术与底光)
  - [模型和组件页](#模型和组件页)
  - [输入框上方那一行](#输入框上方那一行)
  - [空白会话的用量看板](#空白会话的用量看板)
  - [官方模型菜单里的推理滑块](#官方模型菜单里的推理滑块)
  - [四个智能体工具](#四个智能体工具)
- [五档参数](#五档参数)
- [组件管理](#组件管理)
- [技术细节](#技术细节)
- [兼容性与限制](#兼容性与限制)
- [开源协议、二次开发与致谢](#开源协议二次开发与致谢)
  - [二次开发与分发协议](#1-二次开发与分发协议-gpl-30-only-notice)
  - [上游项目与致谢](#2-上游项目与致谢-upstream-credits)
  - [社区](#3-社区)
- [开发](#开发)

---

## 亮点

- **五档压缩，点一下写进去**：`gentle` / `light` / `standard` / `aggressive` / `max` 五档，选中即同步进所有已挂载的预设压缩引擎并留档，不重启；每档都保留官方自动压力压缩。
- **看见的上下文与摸得到的推理档**：输入框上方的小试管实时显示占用——液面就是 `已用 / 窗口`，刻度线是对应的压缩阈值；点开能读到已用、窗口、压缩阈值、保留原文、距阈值，以及系统 / 工具 / 对话三段构成。官方模型菜单里则多一条推理滑块，直接改当前会话的推理等级。
- **空白会话中间是一块本机用量看板**：第一条消息之前拿不到上下文读数，于是浮起一张卡——照上游 Studio 的 bento 双栏排：左栏「活跃轨迹」（标题行 + 26 周 × 7 天满宽网格 + 发丝线 + 大号总量），右栏「模型用量」（每个模型一条 5px 轨道、百分比与会话数），卡底放仓库胶囊；宿主的问候语与输入卡这一整块同时被推到底部，看板**留在原处**。数据来自宿主自己写的会话缓存（只读、不复制），发第一条消息后整块让位给试管。
- **本地模型单独一个文件夹**：「模型和组件」页能一键下载 **FLUX.2 [klein] 4B** 的蒸馏 4 步版本（`black-forest-labs/FLUX.2-klein-4B`，Apache-2.0、免登录、18 个 diffusers 文件、共约 15.98 GB），装在下载根下单独的 `models/` 目录里，和六套组件分开放；逐文件断点续传，只有完整文件才落盘。
- **两套配色，换的是整个界面，跟着 DSH 走**：深空黑曜偏靛蓝，白昼冷晶偏冰青；每套都带亮、暗两份 token，DSH 切深色就用深色那份、切浅色就用浅色那份，皮肤不会把宿主的外观偏好掰到另一边。另有默认的「跟随宿主」——不覆盖任何颜色，照官方主题走。选中一套时，侧栏、消息气泡、输入框、菜单、卡片与代码块一起换，不只是插件自己的面板。
- **主题美术也一起搬**：光换 token 宿主表面还是平的，所以还会画一层美术——对话区底部一条静态底光、16px 圆角的烟熏用户气泡、引用块左侧 accent 竖条、84% 宽的发丝分隔线、6px 细滚动条、输入卡顶部光泽；「跟随宿主」下用 DSH 自己的颜色画（不是关掉这层），外观页还能单独关掉美术。
- **底光是一条不动的渐变**：2.4.6 起对话区底部只有一条 `linear-gradient`（accent 16% → 冰蓝 9% @26% → 透明 @54%），2.5.0 起底座上那截由同一层的 `::before` 伪元素按实测高度补上，接缝不再有台阶；没有 canvas、没有帧、没有动画。2.4.0–2.4.5 那套 canvas 地平线渲染器已删除。
- **规则只有一份**：全局规则写 `<DSH home>/AGENTS.md`，工作区规则写各工作区根目录的 `AGENTS.md`（插件只占其中开头一个受管块，文件其余部分是工作区自己的）；插件不复制、不缓存，智能体没有改写它们的工具，只能由人在面板里保存。
- **六套组件一个根目录**：GitHub CLI、git、ffmpeg / ffprobe、Python 都能检测系统 PATH 副本或下载托管版，断点续传、自检后原子替换、失败回滚；ComfyUI 与官方 ComfyUI MCP 是两棵源码树（GitHub 仓库归档，不做 PATH 检测），同样下载、自检、原子替换；整个根目录可在面板里迁移。
- **发布只有一个入口**：`github_push` 依次做网络体检 → 密钥扫描 → 60 秒超时推送 → 失败分类；输入框上方的「仓库」胶囊决定当前会话推到哪里，胶囊在空会话里也在。
- **轻、守规矩**：面板只用官方主题 token、不引入 Host 的 Client 包；托管副本只插本进程 PATH，不写系统环境变量；移植的那份 UMD 模块走同源脚本路由，按需加载。

---

## 界面预览

三张图都是**离线渲染舞台**的产物：从 `client.js` 里原样抽出样式表与组件树，套一套 DSH 主题 token，用无头 Chrome 截图——所以画面不会和代码漂移。示例会话、仓库、路径与数字都是虚构的。

### 1. 对话：上下文试管与输入框上方那一行

<p align="center">
  <img src="docs/screenshots/hero.png" width="100%" alt="上下文试管浮窗：液面、阈值、保留量与三段构成；输入框上方是试管触发器与仓库胶囊" />
</p>

输入框正上方那一行只有右对齐的工具区：试管触发器（显示占用百分比）、状态小字，以及当前会话的**在线仓库胶囊**。试管点开是一张浮窗——液面高度就是 `已用 / 窗口`，试管左侧刻度是窗口的 25% / 50% / 75%，右上方的小横线是对应档位的压缩阈值；浮窗里再读百分比、`已用 / 窗口`、压缩阈值（含比例）、保留原文、距阈值，以及系统 / 工具 / 对话三段构成与图例，最下面一段「本会话用量」。数字全部来自官方投影 `contextPressure` / `contextBreakdown` / `tokenUsage` / `sessionStats`，没有读数就整支不出现（不编一个 0）。

这一行还决定 `github_push` 推到哪里：胶囊里选中的仓库就是这个会话的发布目标。

### 2. 面板：玻璃外壳 + 五个分页

<p align="center">
  <img src="docs/screenshots/panel.png" width="100%" alt="压缩分档面板的「模型和组件」页：左侧分页导航，六套组件与本地模型在同一张卡片的列表里" />
</p>

面板挂在左侧栏的「压缩分档」上，一次只显示一页，顺序固定：**档位 / 规则 / 模型和组件 / 外观 / GitHub**。五页的入口永远都在导航里——数据空着时页面照样渲染，只是把状态写在卡片里（例如没有注册工作区时，规则页那张卡照旧存在并写「目前无工作区」）。

### 3. 空白会话：本机用量看板

<p align="center">
  <img src="docs/screenshots/heat.png" width="100%" alt="空白会话里浮起的本机用量看板：左侧 26 周活跃轨迹，右侧模型用量，卡底是仓库胶囊" />
</p>

宿主的空会话本没有上下文读数，所以那里放的是一块**本机用量看板**：左栏「活跃轨迹」（26 周 × 7 天、五档强度、大号总量），右栏「模型用量」，卡底放仓库胶囊；宿主的问候语与输入卡整块被推到底部，看板浮在它们上方 16px。数据只读宿主自己写的会话缓存，发第一条消息后整块让位给试管。细节见[使用](#使用)。

---

## 快速安装指南

要求 **Node.js ≥ 24.9**、DSH 运行时在 **`0.2.2-rc.3`（含）到 `0.3.0`（不含）** 之间（`package.json` 的 `engines` 声明，加载器据此拒绝不兼容版本）。

### 方式一：从 npm 安装（推荐）

1. DSH → **插件 → 添加插件**，输入包名 `dsh-harness-toolbox`（要锁版本就写 `dsh-harness-toolbox@2.7.7`）；
2. 安装完成后打开新会话 → 左侧栏出现 **压缩分档** 面板；
3. 面板第一页就是五个档位按钮，选一个即可。

也可以在会话里让智能体用 `plugin_manager` 安装这个包名。安装与启用都交给 DSH，**不要手改** profile 的 `package.json` / `cordis.patch.yml`。

> 国内镜像（npmmirror）同步可能滞后：插件页装不到刚发布的版本时，先 `npm view dsh-harness-toolbox version` 确认线上版本，再等镜像同步或换 registry。

### 方式二：从本地目录安装（推荐开发者）

```bash
git clone https://github.com/Homer4033/dsh-harness-toolbox.git

# 在 DSH 里：插件 → 添加插件 → 选择这个目录
```

以本地目录链接方式安装时，宿主包（`@deepseek-ai/dsh-home-paths`、`@deepseek-ai/dsh-tools`）由运行时提供，本包只声明为可选 `peerDependencies`——缺这条声明会导致 Host 半区导入失败、插件不激活。

### 升级与回退

- **1.x → 2.0.0 / 2.2.0**：`settings.json` 里多一个 `appearance` 块（缺省即 `host` / `full` / 美术层开启），规则、组件、下载目录、会话仓库绑定都不动，不需要搬文件。
- **2.4.x → 2.5.0**：像素伙伴整块删除，旧 `settings.json` 里的 `appearance.mascots` 会被直接忽略（不回写、不报错）；外观页只剩配色、动效与光学外观三组。新增「本地模型」一行，但不会自动下载任何东西。
- **2.5.x → 2.6.0**：「模型和组件」页多出 ComfyUI 与 ComfyUI MCP 两行（GitHub 仓库归档，只下载解压，不建 venv、不启动）。设置、已装组件与下载目录都不动，也不会自动下载；点了才下。
- **2.6.1 → 2.6.2**：「模型和组件」页从「一个组件一张卡」改成一张卡片里的两段列表（组件六行 + 本地模型一行），行尾两个按钮，路径 / 进度 / 错误横跨整行；数据与行为都不变，只是排版。面板、设置与已下好的文件都不动，升级后再点「下载」会从原 `.part` 接着下。
- **2.6.2 → 2.6.3**：输入框上方那一行（仓库栏 + 试管）在 `conversation.input.dock` 里的 `order` 从 90 抬到 1000，把次序写死并补了回归测试（方向在 2.6.4 按用户更正反转，2.6.3 可以跳过、直接升 2.6.4）。数据、设置与界面布局都不动。
- **2.6.3 → 2.6.4**：同一个 dock 行的次序反转——插件行改取 `order: -1000`，排到宿主自己的行（任务清单条 0 / 工作树 5 / 目标 10 / 队列 20）**上面**，上到下变成「仓库栏和试管 → 任务栏 → 输入卡」：跟原版输入卡亲密性强的宿主 UI 贴着输入卡，插件行次之。升级后不需要任何操作。
- **2.6.4 → 2.6.5**：同一行的横向几何与底色修正——行宽改成照宿主 dock 行收（卡宽再每边内缩 `--dsh-composer-dock-inset`），胶囊右缘从此压在任务栏右缘上；试管触发器的底色换成宿主 dock 行那一层表面 `--dsw-specific-menu`。升级后不需要任何操作。
- **2.6.5 → 2.6.6**：没有读数时不再画那支灰色「—」试管。新会话在第一条消息之前拿不到官方 `contextPressure`，宿主那时也不画自己的上下文环，所以空白会话里原来只剩一个点不动的灰胶囊；现在整支试管不出现，发出第一条消息就照常出现。dock 行与仓库胶囊不变。
- **2.6.6 → 2.7.0**：空白会话的 dock 行多一张本机用量热力图（26 周 × 7 天、五档色阶），画在试管触发器上面，有读数后让位给试管。只读宿主的会话投影缓存，不写、不复制；升级后在新会话里就能看到。
- **2.7.0 → 2.7.1**：同一张热力图按上游 Studio 首页的排版重做——不再是一团贴着右缘的小方格，而是一张卡：标题行、列宽均分卡面的 26 × 7 网格、发丝线、大号总量与一行小字摘要。只动外观，数据与接口不变。
- **2.7.1 → 2.7.2**：看板搬进聊天区并补全上游双栏——空白会话不再占用输入框上方那一行，卡片是居中浮层；右栏新增「模型用量」，标题行右侧改成 7天 / 30天 / 全部 分段控件，仓库胶囊移到卡片底部。接口多了 `?range=` 参数。
- **2.7.2 → 2.7.3**：看板从「空聊天区里垂直居中」改成「贴着输入区上沿」——底边离输入区 16px。只改定位常量，数据与接口不变。
- **2.7.3 → 2.7.4**：空白会话里，宿主的「欢迎语 + 快捷按钮 + 输入卡」整块被往下推，落到底部（离聊天区底 24px）。只在空白会话生效（`body[data-ct-blank]` + 一个 CSS 变量），发出第一条消息、试管拿到读数后立刻回到宿主原位。
- **2.7.4 → 2.7.5**：看板不再跟着宿主那一块下移——`placeHeatLayer()` 测量前先把位移变量清零，卡片按宿主原始座位算位置，于是只有「欢迎语 + 输入卡」往下走、热力图留在原地。顺带修掉「窗口一 resize 整块弹回原位」的测量顺序 bug；变更记录文件从根目录移到 `docs/CHANGELOG.md`。
- **2.7.5 → 2.7.6**：看板只在宿主标成空白的会话里出现——以前用「没有上下文读数」推断空白，切换会话时新读数还没到，卡片会闪一下、还连带把宿主那一段推下去；现在读宿主自己的 `session.blank`，有消息的会话永远只画输入框上方那一行。
- **2.7.6 → 2.7.7**：只有文档与截图。README 改成一页三图（对话 / 面板 / 用量看板），并新增英文版 [docs/README.en.md](docs/README.en.md)；详情页从「一张图」改写成「目录 + 正文」；截图全部由离线渲染舞台按 2.7.6 的界面重拍，2.5.0 已删除的像素伙伴、已下线的旧配色与旧分页都不再出现在图里。代码、接口、设置与已下好的文件全都不动。
- **许可证**：2.0.0 起整包改为 **GPL-3.0-only**（因为移植了上游 GPL 代码）；`1.10.3` 及更早的版本仍是 MIT。
- **卸载**：插件页移除即可，托管组件目录留在原处，删掉目录即彻底清理。

安装是否成功以插件页的 `application` 结果和新会话里的面板 / 工具为准，不以日志或下载进度推断。

---

## 使用

### 面板的五个分页

| 分页 | 做什么 | 唯一事实来源 |
| :--- | :--- | :--- |
| **档位** | 五个按钮，点一下写入所有已挂载的预设压缩引擎 | `src/levels.js` 的 `COMPRESSION` |
| **规则** | 全局规则整份编辑；下半张卡编辑所选工作区的补充规则（插到它 `AGENTS.md` 开头） | `<DSH home>/AGENTS.md`、`<DSH home>/storages/workspace.json` + 各工作区 `AGENTS.md` |
| **模型和组件** | 六套组件的状态、下载、重新检测与下载根目录，以及一行本地模型 | `src/components.js` 的 `COMPONENTS`、`src/models.js` 的 `MODELS` |
| **外观** | 配色、动效、光学外观 | `settings.json` 的 `appearance` |
| **GitHub** | 账号、token scope、设备码登录、网络体检 | `gh` 自己的存储（插件不读凭据） |

所有动作按钮都常显：条件不满足时渲染成置灰并用 `title` 写原因，不会整块消失。面板宽度 ≤ 720px 时导航条变横向并换行。

### 规则：全局与工作区

全局规则整份写入 `<DSH home>/AGENTS.md`；工作区规则只写插件自己的**受管块**，保存时插到该工作区 `AGENTS.md` 的**开头**（没有文件就创建），块下面原有的正文原样保留，面板也不显示这份文件的内容。两处写入都原子、去 BOM、CRLF→LF、保留单个结尾换行，单次上限 100,000 字符，超出直接 413 而不是截断；系统提示只带最新 2,000 字符摘要。

受管块只认文件开头：围栏必须是首个非空行加上后面一整行的结束标记，正文里顺口提到这两个标记不算（本仓库自己的 `AGENTS.md` 就提到过两次）；半个围栏（只有开头没有结尾）按空块处理，保存后不会出现第二个开头；补充规则里出现整行围栏标记时直接 400、文件不动。

### 外观：配色、动效与光学外观

外观页把三组设置放在一张卡里，选完立刻生效（乐观写入，失败回滚）。配色走宿主官方的主题服务（`overrideTokens`）：面板页、输入框上方那一行、portal 到 body 的菜单照旧各带一份皮肤，同时把整套 token 叠加到宿主主题上，于是侧栏、气泡、输入框、菜单与代码块一起换色。两套配色都同时提供亮色与暗色两份值，**深色 / 浅色由 DSH 自己决定**——切一下官方主题，皮肤跟着切，不用回面板再点一次。

| 主题预设 | 配置键值 | 深色画布 | 浅色画布 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **跟随宿主** | `appearance.palette: "host"` | 宿主 token | 宿主 token | 默认；不覆盖颜色，深浅随官方主题 |
| **深空黑曜** | `appearance.palette: "obsidian"` | `#0A0A0C` | `#E6EDF6` | 靛蓝 accent，近黑石板深色 / 冷灰蓝浅色 |
| **白昼冷晶** | `appearance.palette: "crystal"` | `#070B12` | `#EEF6FF` | 冰青 accent，冷蓝黑深色 / 冰白浅色 |

2.0.0 的暖炭玄岩与暖白画册已下线：旧配置里的 `warm` / `alabaster` 会按冷暖性格迁移到深空黑曜 / 白昼冷晶，升级后不会白丢皮肤、也不会回落成「跟随宿主」。动效三档（完整 / 克制 / 关闭）只影响试管与滑块的过渡。「光学外观」是独立开关：关掉只去掉底光、烟熏气泡、竖条与发丝线，配色 token 仍然生效。

### 主题美术与底光

只换 token 的话宿主表面还是平的。插件还会把上游 `style.css` 里能用**语义锚点**表达的那层美术画上去：对话区底部一条静态线性渐变、用户气泡换成 16px 圆角的烟熏表面（顶部 2.2% 光泽 + 1px 描边 + 内侧高光 + 深落影）、引用块左侧 1.5px 的 accent→冷紫竖条、`hr` 收成 84% 宽的发丝渐变、滚动条收成 6px 细条、输入卡顶部一层 3% 光泽；对话正文的行距放宽到 1.72。所有选择器只用 DSH 自己的语义属性（`[data-conversation-region]`、`[data-message-bubble]`、`[data-composer-card]`、`[data-conversation-scroll]`），不碰哈希类名，命中不到就自然不生效。

对话区底部只有**一条线性渐变**：从底边的 accent 16% 淡染升到 26% 处的冰蓝 9%、54% 处收敛为全透明，没有 canvas、没有帧、没有动画。它本来会被输入区底座自己的遮罩截断，所以底座上用同一层的 `::before` 伪元素（`z-index: -1`，落在底座背景之上、输入卡之下）画**同一条渐变**，`--ct-glow-height` 按聊天区实测高度写进底座行内样式，顶边再用 `mask-image` 按遮罩斜率淡出——接缝不再有台阶。输入卡与遮罩仍然归宿主：卡片保持不透明，正文滚到卡上方就被裁住。

美术层打开时还会顺手把宿主那行浅色统计字（`[data-composer-stat]`）和底栏那颗 `○ 5%` 上下文环（`[data-composer-dock]` 里 `aria-haspopup='dialog'` 的按钮）藏起来——同样的读数已经在试管浮窗里；关掉「光学外观」宿主自己就回来。

### 模型和组件页

一张卡片里的两段列表：上面是六套托管组件，下面是一行本地模型，每行是名称与钉住版本、状态、行尾「下载 / 重新检测」；路径、进度、错误横跨整行，单行不套卡片，状态没读到时整行仍在、按钮置灰。列表下方是下载目录（`settings.json` 的 `toolsPath`），迁移只接受绝对路径、整体搬六套组件、任一下载进行中 409。

本地模型目前只有一个：**FLUX.2 [klein] 4B** 的蒸馏 4 步版本。

| 项 | 值 |
| :--- | :--- |
| 模型 | [`black-forest-labs/FLUX.2-klein-4B`](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)，蒸馏 4 步版本；[ModelScope 官方镜像](https://modelscope.cn/models/black-forest-labs/FLUX.2-klein-4B) 同路径同字节 |
| 许可 | Apache-2.0；Hugging Face 与 ModelScope 都免登录即可下载 |
| 体积 | 18 个文件，共约 **15.98 GB** |
| 位置 | `<下载根>/models/flux2-klein-4b`（与六套组件分开的独立目录，整体迁移时一起搬） |

只取 diffusers 最小集（transformer、两段文本编码器、VAE、tokenizer / scheduler / 配置）；仓库里那份重复的单文件 transformer 与三张预览图不取。下载逐文件走 HTTP Range 续传，失败留下的 `.part` 下次接着下，只有完整文件才改名落盘——所以状态只有「未安装 / 下了一部分 / 已安装」三种。接口是 `GET/POST /compression-tiers/api/models`，同一时间只允许一个下载任务，下载中再点返回 409。

下载端点默认**先走 ModelScope，再走镜像 `hf-mirror.com`，最后回落 `huggingface.co`**：`huggingface.co` 在国内多数网络不可达（第一版只认它，用户看到的就是 `fetch failed (gave up after 4 attempts)`）；`hf-mirror.com` 连得上，但大文件被转到 `cas-bridge.xethub.hf.co`，实测只有约 150 KB/s（15.98 GB 要一天）；ModelScope 上有一份官方 BFL 镜像仓库，18 个文件与上游**同路径同字节**，同一台机器实测大文件约 33–38 MiB/s。每个文件都按这个顺序尝试，`.part` 在各端点之间共享。要换别的镜像就设环境变量 `DSH_HF_ENDPOINT`。所有端点都失败时，面板那一行的错误会写清**每个 host 与原因**，不再只有一句 `fetch failed`。

### 输入框上方那一行

`conversation.input.dock` 是输入框正上方的整宽槽，插件在这里注册 `compression-repo`：

- **试管触发器**：显示当前占用百分比，点开上下文试管浮窗；
- **仓库胶囊**：给当前会话绑定一个在线仓库，`github_push` 默认推到它；空会话里也渲染，菜单向上弹出；
- **状态小字**：胶囊还在读仓库列表、或保存绑定失败时，在胶囊左边写一行状态。

槽里按 `order` 升序排队（上小下大），原则是**跟原版输入卡亲密性强的 UI 优先靠近输入卡，插件次之**：智能体用 `todo_write` 起的「任务」清单条（`todo`，order 0）、工作树进度（5）、目标条（10）、队列（20）这些宿主自己的行都贴着输入卡，本行取 `order: -1000` 排在它们全部之前。所以上到下固定是 **仓库栏和试管 → 任务栏 → 输入卡**。

试管里的液体不是一张图：移植的 `vial-core.js` 在 96×220 的 canvas 上跑一个 24 节点的浅水波模拟，倾斜或开关浮窗时液面会荡一下。菜单默认上拉，上方不足 200px 且小于下方时才翻成向下；↑ / ↓ / Home / End / Enter / Esc 全键盘可用。

### 空白会话的用量看板

只有当宿主把会话标成空白（`session.blank`，也就是还没发过第一条消息）时才浮起本机用量看板：这种情况下拿不到 `contextPressure`，试管整支不出现。有消息的会话**永远不画看板**——切换会话时投影还没到也一样，所以不会闪一下、也不会把宿主那一段推下去。看板照搬上游 Studio 首页那张 bento 卡的排版：

- **位置**：卡片 portal 到 body（`.ct-heat-layer`，`position: fixed`），按聊天区与输入区的实测矩形落位——水平居中于聊天区、底边贴着输入区上沿 16px；窗口不够高就 900 → 360px 逐级缩小，绝不盖住宿主的问候语。**输入框上方那一行在空白会话里整行不渲染**，输入卡仍在最底部；
- **对话栏一起下移**：宿主原本把「欢迎语 + 快捷按钮 + 输入卡」整块居中在聊天区，现在空白会话里把整块推到底部、离聊天区底 24px；看板按宿主**原始**座位定位，所以往下走的只有红圈那一块。这层位移只由 `body[data-ct-blank='on']` 与一个 CSS 变量控制，有读数时属性与变量一起撤掉；
- **双栏**：左栏「活跃轨迹」（标题行 → 满宽网格 → 发丝线 → 大号总量 + 小字摘要），右栏「模型用量」（每个模型一条 5px 轨道 + 百分比 + 会话数）；窄于 660px 两栏堆叠；
- **标题行**：左边「活跃轨迹」，右边 7天 / 30天 / 全部 分段控件——切换会重新取数，强度按窗口内峰值重算；
- **网格**：26 周 × 7 天共 182 格，列优先（一列一周、从上到下周一…周日，周一对齐），今天之后与窗口外的格子留空；列宽均分卡面、格子随宽度缩放成方格；
- **五档强度**：一格一个**本地日**，颜色按当日 token 占窗口内峰值的对数分五档，没有用量的日子是淡底；悬停浮出玻璃胶囊，写「日期」与「token · 会话数」；
- **模型用量**：每个会话按它最后使用的模型归桶（缓存只有 `modelSelection.val.lastUsed`，卡片自己也写「按会话归属」），按份额排序最多六行；
- **数据只读、不复制**：读的是宿主自己写的 `<DSH home>/storages/session_projcache/sessions/*.json`，一条会话的 token = `uncachedInputTokens + outputTokens + cacheReadTokens + cacheWriteTokens`，按 `identity.createdAt` 的本地日归集；坏 JSON 与没有 usage 行的会话跳过，目录不存在就是空网格，**不编 0 也不摆假数据**；
- **接口**：`GET /compression-tiers/api/usage?range=7d|30d|all` 按窗口出网格与汇总，客户端按窗口各缓存 60 秒。

### 官方模型菜单里的推理滑块

输入框里的「模型」按钮点开就是官方模型菜单：根面板两行（模型 / 推理等级），下面多出插件注入的那一条轨道。

- 拖动轨道、点某一档、或按 ↑ / ↓ / Home / End：写入立刻发生，官方行与触发器副标题同时更新；
- 档位名（关闭 / 低 / 高 / 最高 ……）由宿主随模型下发，插件不翻译、不写死；
- 几何对齐参考插件 [`dsh-codex-effort-slider`](https://github.com/Microqian2th/dsh-codex-effort-slider)：28px 胶囊轨道、直径等于轨道高度的白色圆钮、3px 档位点，填充停在旋钮圆心；过了中间档轨道开始「通电」——紫色星云盖住已填充段、一道扫光横过、22 颗星尘横向飘过，满档最亮；
- 写入中轨道变忙碌态并锁住；被拒（会话被写者占用等）则在轨道下方写原因，旋钮退回宿主确认的档位。

挂载是 fail-open 的：宿主没有 `modelDirectories` 服务、当前模型没有 `reasoning.efforts`、只有一档、菜单没开、或者写入被拒，都退回「什么都不加」。锚点只用语义属性（`aria-haspopup="menu"` + `aria-controls` 找菜单、`role="menuitem"` 的行配上行首标签文字认出「推理等级」、`[data-composer-card]` 判归属），不认 DSH 的哈希类名。

### 四个智能体工具

| 工具 | 作用 |
| :--- | :--- |
| `compression_tiers` | 读或切档位；可带按路由的 `headroomTokens` 覆盖（`provider model headroom [retain]` 行） |
| `compression_context` | 读实时占用、本档阈值与剩余空间；对话尾部的 `[context]` 行给的是同样的数字 |
| `compression_compact` | 排队一次主动压缩，本轮结束后执行并自动续跑；期间你发的消息会取消排队任务或阻止续跑 |
| `github_push` | 发布当前工作区：体检 → 密钥扫描 → 60 秒超时推送 → 失败分类；密钥命中会阻止推送，人工确认后 `force: true` 放行 |

主动压缩永远让位于真人输入：你开口，排队就作废；正在跑的压缩不中断，但结束后不再注入续跑消息。多仓库场景由智能体在各自会话里调用 `github_push`——插件没有仓库列表，也没有推送按钮。

---

## 五档参数

| 档位 | 自动触发 | 逐字保留 | 定位 |
| :--- | ---: | ---: | :--- |
| `gentle` 极轻 | 80% | 20% | 与官方默认一致，最贵最晚 |
| `light` 轻量 | 70% | 18% | 比官方早一档 |
| `standard` 标准 | 60% | 16% | **默认** |
| `aggressive` 积极 | 50% | 10% | 成本优先 |
| `max` 最大 | 40% | 6% | 最省 |

官方阈值公式逐字保留：`floor(min(W × thresholdRatio, W − O − 65,536))`，逐字保留量是 `(W − O) × retainRatio`。面板与试管按同一公式显示，`0.80` 是最贵的一档而不是中间档。

---

## 组件管理

六套托管组件装在同一个可配置根目录下。前四套是可执行程序：能识别系统 PATH 里的副本，托管副本优先，并插到本进程 PATH 最前（不写系统环境变量）。后两套是源码树，没有可执行文件，也就没有 PATH 那一段。

| 组件 | 托管源 | 位置 | PATH 目录 |
| :--- | :--- | :--- | :--- |
| GitHub CLI | `cli/cli` release，钉 `2.76.2` | `<root>/gh` | `<root>/gh/bin` |
| git | MinGit，钉 `2.56.1` | `<root>/git` | `<root>/git/cmd` |
| ffmpeg / ffprobe | gyan.dev essentials（浮动 release） | `<root>/ffmpeg` | `<root>/ffmpeg/bin` |
| Python | python-build-standalone，钉 `3.11.18+20261110` | `<root>/python` | `<root>/python`、`<root>/python/Scripts` |
| ComfyUI | `Comfy-Org/ComfyUI` 仓库归档，钉 tag `v0.46.0` | `<root>/comfyui` | 无 |
| ComfyUI MCP | `Comfy-Org/comfy-mcp` 仓库归档，钉 commit `6c43880` | `<root>/comfy-mcp` | 无 |

- **下载**：HTTP Range 续传、20 分钟超时、失败自动重试（指数退避），body 超过 60 秒没有新字节按掉线重试（半开连接不会让进度条永远停在一个数上）；解压到 `<root>/.staging/<id>` 后先自检（可执行组件跑 `--version` / `-version`，源码树找标记文件 `main.py` / `pyproject.toml`），通过才整棵目录原子替换，失败回滚并保留 `.part`。
- **源码树只负责下载**：装完是两棵可以直接查看、自行接管依赖的树，插件不建 venv、不装 torch，也不启动 ComfyUI——`<root>/comfyui/main.py`、`<root>/comfy-mcp/pyproject.toml` 就是安装完成的凭据。GitHub 的 `/archive/<ref>.zip` 会在仓库外面多包一层 `ComfyUI-0.46.0/`，这一层会被剥掉，所以安装目录就是仓库根。
- **Windows 占用**：替换经 `moveIntoPlace()`——rename 重试退避，仍失败就复制过去，不再因为杀毒扫描刚写出的二进制而报 `EPERM`。
- **下载目录**：`settings.json` 的 `toolsPath`（空 = `<DSH home>/compression-tiers`）。迁移只接受绝对路径、整体搬六套组件、任一下载进行中 409、目标已存在拒绝、跨卷自动退化为复制后删除，复制中途失败会回滚目标并保留源，好让下一次还能重试。
- **接口**：`GET/POST /compression-tiers/api/components`（读六行状态 / `{id, action:'download'}`），`GET/POST /compression-tiers/api/tools`（读目录状态 / `{action:'migrate', path}`）。
- **边界**：gh / git / ffmpeg / Python 的托管源只有 Windows，Linux / macOS 只做 PATH 检测并显示「当前系统不可用」；ComfyUI 与 MCP 的仓库归档不分平台，两种系统都能装。

---

## 技术细节

<details>
<summary><strong>分层、试管物理、阈值、配色跟随与安全边界（点击展开）</strong></summary>

**版本 `2.7.7`** 不改宿主的压缩算法、不碰宿主平面上的 `compaction-basic` 行，只通过官方 slot、官方投影与预设隔离域工作：

- **Host / Client 两个半区**：`index.js` 注册四个工具、系统提示摘要、HTTP 路由与 reconciler（把档位同步进预设隔离域里的压缩引擎）；`client.js` 只拿 `ctx.slots` / `ctx.locale` / `ctx.effect` 与主题 token 渲染侧栏面板与输入框上方那一行。面板不 import 宿主的 Client 包，下拉、菜单、按钮全部自绘。
- **普通 `<script>` 加载移植模块**：`vial-core.js`（约 75 KB）是上游 1.0.8-beta.1 的脚本，走同源路由 `GET /compression-tiers/vendor/<name>`（白名单只有这一个文件名，`text/javascript; charset=utf-8`，`cache-control: public, max-age=3600`，URL 带 `?v=2.7.7` 防止旧缓存跨版本存活）。这样 `client.js` 不用背 UMD 内容，也不用 `eval`。2.4.6 撤掉地平线渲染器、2.5.0 删除像素伙伴装配之后，白名单从三个名字收成一个。
- **试管是物理的**：`vial-core.js` 导出 `createWaterVialPhysics` 与 `mountPhysicalWaterVial`，在 96×220 的 canvas 上跑 24 节点浅水波、阻尼与表面张力；宿主负责驱动 RAF 与 `step(dt)`，`isSettled()` 为真时停止重绘。液面比例与阈值刻度由面板按官方公式算好后传给物理层——物理层不认识 token。
- **数字来自官方投影**：占用与窗口来自 `useProjection('contextPressure')`，三段构成来自 `useProjection('contextBreakdown')`。没有任何读数时（新会话的第一条消息之前）整支试管不渲染——宿主自己那时也不画 `ContextMeter`，所以不摆一个点不动的灰「—」；试管浮窗的环境（端口、主题、`reducedMotion`）由客户端传进去，移植模块不读宿主全局。
- **换肤是两条腿**：插件自己的面板 / dock / 弹层用 `.ct-skin[data-palette='…']` 上的 token（宿主界面不受影响，主题服务缺席时也不至于没皮肤）；整个 DSH 界面则由 `ctx.theme.overrideTokens('compression-tiers', tokens)` 叠一层，宿主把它写成 `<body>` 上的内联 CSS 变量。每个 token 必须是 `{ light, dark }` 成对值（服务故意拒绝裸字符串），两套模式都齐备——这正是「皮肤跟随 DSH 深浅」的实现方式：宿主自己挑用哪一半。
- **配色只覆盖自己的根**：`.ct-skin[data-palette='…']` 定义在面板页、dock 行与 portal 出去的菜单上，这些值不会渗到宿主界面；`host` 是空集，保持官方主题不变。两个配色的本地 token 也按宿主模式分两份：默认块是浅色宿主读到的值，`body[data-ds-dark-theme]`（官方主题 presenter 自己写的属性）下换成深色那份；这里不写 `color-scheme`，`html` 上已经有宿主设的那一份。
- **皮肤不掰用户的主题**：2.0.0 选深色配色会把宿主外观偏好一并切到深色，2.2.0 去掉了这次写入——配色自带亮暗两份值，用户切官方主题时皮肤跟着走。
- **美术层只认语义属性**：`applyOptics()` 在 `<body>` 上写 `data-ct-palette` / `data-ct-art`，样式表里每条美术规则都以 `body[data-ct-art='on']` 开头，选择器只用 DSH 自己的 `[data-conversation-region]` / `[data-conversation-scroll]` / `[data-message-bubble]` / `[data-composer-card]` 与对话区的 `hr` / `blockquote`；命中不到就不生效，不碰哈希类名。
- **推理滑块挂官方那一行，写入走官方那条路**：客户端 `ctx.inject(['modelDirectories'])` 拿到每个会话的模型目录，读 `store.getSnapshot()` 的 `groups[].models[].reasoning.efforts`，写 `directory.select({ provider, model, reasoningEffort })`，并用 `store.subscribe()` 跟官方行同步。DOM 桥只用语义属性，认行靠标签不靠位置（根面板恰好两行时按官方布局兜底，更多行且无标签命中就不注入）；目录按需重取（会话作用域就绪前 `directoryFor()` 会抛错，按 60 / 240 / 540 / 960 / 1500 / 3000ms 退避重试），实例被换掉时退旧订阅、重新订阅。写失败会在轨道下方写原因并把旋钮退回宿主确认的档位，不谎报成功。
- **状态只落一个文件**：`<DSH home>/compression-tiers/settings.json`，所有写入是「临时文件 + rename」；手改坏的 JSON 回落到默认值，不让插件崩。`appearance` 在读写两侧都归一化，未知配色 / 动效值直接回落默认而不是报错。
- **规则写入**：去 BOM、CRLF 归一 LF、保留单个结尾换行，单次上限 100,000 字符（超出 413 且不落盘）；系统提示只带最新 2,000 字符摘要，从不整份注入，也不把摘要写回文件。
- **本机用量只读**：`<DSH home>/storages/session_projcache/sessions/*.json` 由宿主自己写，插件只读、不写、不复制。
- **托管安装**：下载 → `.staging` → 自检 → `moveIntoPlace()` 原子替换 → 失败回滚；已下载完的归档在下一次重试时复用，不再白下第二遍——但**只有完整下载才落成归档**（body 比 `content-length` 短算可重试的断点续传），归档解压不出二进制或暂存自检失败时会先删掉它，下一次重新下载而不是反复解压同一个坏文件。
- **发布边界**：会话绑定的仓库只改 `github_push` 的推送目标，不克隆、不切分支、不动会话工作区；绑定归一化为 `owner/name`，非法值丢弃，最多 200 条。
- **测试**：`npm test` 273 条 `node:test` 用例，覆盖档位与公式、路由、引擎同步、全局规则与工作区受管块（创建 / 替换 / 保留正文 / 只读受管块 / 整行围栏标记 400）、`gh` / 组件 / 下载位置（含短读重试、停住 60 秒的掉线重试、PowerShell 兜底、复制失败回滚后半程可重试）、源码树组件（仓库归档的 `any` 资产、剥掉 GitHub 的外层目录、按标记文件判定安装、不参与 PATH、六行统一形状、dock 次序）、组件与模型的列表页（一张卡片、两段列表、行尾两个按钮、不再有 `ct-component`）、本地模型（钉住的文件清单与总字节数、端点顺序与回落、`DSH_HF_ENDPOINT` 覆盖、三态、`.part` 续传、下载中 409、未知 id 404）、**本机用量热力图**（四个 token 桶求和与非法桶、坏 JSON / 无 usage 行 / 缺失目录、26 周周一对齐与未来日、同日多会话相加、强度单调到 5、本地时区归日、三个窗口，以及空白会话画 182 格、有读数时让位、无数据不画、贴输入区上沿、只在下移开关存在时移宿主 seat、**空白只看宿主 `session.blank`**）、发布流程、移植模块的 UMD 装载与署名（白名单只剩 `vial-core.js`）、配色的成对值 / 旧配色迁移 / 皮肤只叠一层、推理滑块的档位映射 / 轨道几何 / 语义锚点查找 / 目录退避与重建 / 写入与回滚、三档动效 / `host` 撤下与渲染器降级、设置快照推送、底光 `::before` 与 `--ct-glow-height`、宿主上下文环隐藏，manifest 与 locale；CI 在 Windows 与 Linux 两侧跑同一套。

</details>

---

## 兼容性与限制

- **窗口大小**：五档按 ≥ 256k tokens 的窗口设计；128k 窗口下各档只剩「保留量」不同，≤ 64k 的窗口会被官方 65,536 的输出余量卡住——用 `compression_tiers` 的 `routeLines` 给该路由写更小的 `headroomTokens`。
- **宿主平面**：只更新预设隔离域里的引擎；如果别的插件也管同一批引擎，两边会互相覆盖，只留一个。
- **网络**：GitHub 与 npm 相关操作要能访问 `github.com`；代理死掉或 DNS 被污染时用「网络体检」定位。ffmpeg 需要能访问 `www.gyan.dev`，git / Python / ComfyUI / ComfyUI MCP 需要能访问 `github.com`，本地模型先试 `modelscope.cn`、再试 `hf-mirror.com`、最后 `huggingface.co`。
- **托管副本会盖过系统版本**：装了托管 git / Python 后，本进程内的 `git` / `python` 优先用托管副本；删掉 `<root>/git`、`<root>/python` 并重启即回退。
- **ComfyUI / MCP 只装代码**：两行下载的是仓库归档，装完是两棵源码树，插件不建 venv、不装依赖（torch 等要自己装）、也不启动服务；「已安装」只代表归档解开且标记文件在，删掉目录即清掉。
- **推理滑块不是每条会话都有**：它只在当前模型真的暴露 `reasoning.efforts`（≥2 档）时出现；子智能体会话、没有 `modelDirectories` 服务的宿主、或模型没有推理档位时不渲染任何东西。
- **本地模型要自己下**：FLUX.2 [klein] 4B 约 15.98 GB，插件只负责下载与文件大小校验，不内置权重、也不校验哈希；删掉 `<root>/models/<id>` 即彻底清掉。下载中途断网留在原地的 `.part` 下次接着下，卡住 60 秒不动也会自动重连续传。
- **美术层与配色解耦**：2.4.2 起「跟随宿主」也用宿主 token 画这层美术，不是关掉；外观页的「光学外观」开关常显可点，关掉只去掉底光 / 气泡 / 分隔线这些美术，配色 token 仍然生效。
- **截图与渲染**：README 与详情页里的三张图来自离线渲染舞台（同源静态预览 + 无头 Chrome，直接运行本仓库的 `client.js`），**真实 DSH 窗口里的最终观感仍需刷新页面后确认**；推理滑块没有单独出图，它的挂载、拖动写入、官方行同步与被拒回滚由单元测试覆盖。
- **仓库 UI**：没有仓库列表，也没有推送按钮。多仓库由智能体在各自会话里调用 `github_push`；胶囊只决定当前会话的目标。

---

## 开源协议、二次开发与致谢

### 1. 二次开发与分发协议 (`GPL-3.0-only` + `NOTICE`)

**dsh-harness-toolbox**（`Copyright (C) 2026 Homer and the dsh-harness-toolbox contributors`）采用 **[GNU General Public License v3.0 (`GPL-3.0-only`)](./LICENSE)** 发布，并附带 **[`NOTICE`](./NOTICE)** 与 **[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)**。

基于本项目做修改、二次开发、移植或打包再分发时，须遵守：

1. **同源开源（Copyleft）**：任何包含或修改自本项目的衍生插件，整体须同样以 **GPL-3.0** 开放完整对应源代码。
2. **保留署名链**：衍生仓库根目录须完整保留 [`LICENSE`](./LICENSE)、[`NOTICE`](./NOTICE) 与 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)，并在 README 保留对原作者 `RMvdesi` 与上游仓库 `RMvdesi/obsidian-prism` 的来源链接。
3. **标注修改**：修改过的上游文件须注明修改日期与变更摘要（本项目在 vendor 文件的头部写明）；不得用未修改的「Obsidian Prism 官方原版」名义发布衍生版本。

> **许可证变更**：`1.10.3` 及更早版本以 MIT 发布；`2.0.0` 起移植了 GPL-3.0-only 的上游代码，整包改为 **GPL-3.0-only**。已经在 MIT 下发布的旧版本不受影响。

#### 下游二次开发 README 署名模板

```markdown
> Built upon [dsh-harness-toolbox](https://github.com/Homer4033/dsh-harness-toolbox) by Homer, licensed under [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html).
> Optical vial and motion concepts ported from [Obsidian Prism](https://github.com/RMvdesi/obsidian-prism) by [@RMvdesi](https://github.com/RMvdesi) (GPL-3.0-only). Upstream component notices are preserved in `NOTICE` and `THIRD_PARTY_NOTICES.md`.
```

### 2. 上游项目与致谢 (Upstream Credits)

- **[RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism)** (`1.0.8-beta.1`) — `GPL-3.0-only`, `Copyright (C) 2026 RMvdesi`：本项目移植了 `vial-core.js`（浅水波试管），并沿用它那套光学界面语言重做了本插件的面板外壳、两套配色与动效档位；该文件头部写有出处与修改说明。2.5.0 按用户要求删除了此前移植的 `dual-mascot-rig.js`（像素伙伴装配），不再包含这份衍生代码。
- 上游本身又吸收了若干 MIT 项目（与 GPL-3.0 兼容），完整版权与许可全文保留在 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)，其中与本插件直接相关的有：
  - **[0DNANCY/agy-claude-style](https://github.com/0DNANCY/agy-claude-style)** — `MIT`, `Copyright (c) 2026 0DNANCY`（配色框架与像素宠物底座）。
  - **[wp3171216237/dsh-TUI](https://github.com/wp3171216237/dsh-TUI)** — `MIT`, `Copyright (c) 2026 chimney (@wp3171216237)`（Deepy 桌宠轮廓配色参考）。

### 3. 社区

问题与建议走 [Issues](https://github.com/Homer4033/dsh-harness-toolbox/issues)，改动走 Pull Request；提交前请先跑 `npm test` 与 `npm run check:secrets`。

---

## 开发

```bash
npm test               # node:test：档位、路由、状态、引擎同步、规则、GitHub、发布、组件、热力图、移植模块与 manifest
npm run check:secrets  # 仓库密钥扫描（CI 与本地共用）
```

文档分工：本文件（以及英文版 [docs/README.en.md](docs/README.en.md)）面向使用者，插件详情页在 [docs/DETAIL.zh.md](docs/DETAIL.zh.md) / [docs/DETAIL.md](docs/DETAIL.md)；逐版本变更见 [docs/CHANGELOG.md](docs/CHANGELOG.md)，旧版本归档在 [docs/HISTORY.md](docs/HISTORY.md)；面板与弹层的实现规范在 [docs/UI.md](docs/UI.md)。截图由 `scripts/stage/render.mjs` + `scripts/stage/shoot.mjs` 生成（不在包内）。

```text
dsh-harness-toolbox/
├── package.json                  # 清单：engines.dsh、GPL-3.0-only、files/exports（含 vendor）
├── LICENSE / NOTICE              # GPL-3.0 全文 + 衍生作品署名与修改说明
├── THIRD_PARTY_NOTICES.md        # 上游及其吸收的 MIT 项目的完整声明
├── icon.svg                      # 面板图标
├── index.js                      # Host 入口：四个工具、系统提示、面板路由、reconciler、vendor 路由
├── client.js                     # 客户端：侧栏面板（五个分页）、输入框 dock、试管、用量热力图、自绘弹层
├── vendor/obsidian-prism/        # 移植的 UMD 模块（vial-core.js）
├── src/
│   ├── levels.js                 # 五档参数与阈值公式（唯一来源）
│   ├── presets.js                # 预设隔离域引擎同步
│   ├── context-meter.js          # 实时占用与 [context] 尾行
│   ├── manual-compact.js         # 主动压缩队列（真人输入优先）
│   ├── store.js                  # 状态读写（原子，含 appearance）
│   ├── rules.js                  # 全局规则：路径、校验、原子写入、摘要
│   ├── workspace-rules.js        # 工作区规则：注册表读取、受管块注入、原子写入
│   ├── gh.js                     # GitHub CLI：托管下载、PATH、设备码登录、仓库列表
│   ├── ffmpeg.js                 # ffmpeg / ffprobe 托管下载与 PATH
│   ├── components.js             # 托管组件：git / Python 可执行文件 + ComfyUI / MCP 源码树
│   ├── component-rows.js         # 面板六行组件的统一形状
│   ├── models.js                 # 本地模型：钉住的文件清单、状态、逐文件续传下载
│   ├── usage-heatmap.js          # 本机用量热力图：读会话投影缓存、按本地日归集、五档分色
│   ├── tools-path.js             # 下载根目录与整体迁移
│   ├── swap.js                   # 安装树替换（rename 重试 → 复制回退）
│   ├── publish.js                # 网络体检、push、密钥扫描、建仓
│   └── push-flow.js              # 发布流程（工具与面板共用）
├── docs/
│   ├── README.en.md              # 英文版说明
│   ├── UI.md                     # 面板与弹层的 UI 规范（表面层级、栅格、动效、检查清单）
│   ├── CHANGELOG.md / HISTORY.md # 逐版本变更记录与旧版本归档
│   ├── DETAIL.md / DETAIL.zh.md  # 插件详情页（英文 / 中文，目录 + 正文）
│   └── screenshots/              # README 与详情页用的三张截图
├── locale/                       # zh / en 元数据与描述
├── scripts/check-secrets.mjs     # 密钥扫描入口
├── scripts/stage/                # 离线渲染舞台：抽出 CSS、跑组件树、无头截图（不进包）
├── test/                         # node:test 用例
└── .github/workflows/ci.yml      # Windows + Linux：npm test → check:secrets
```

文档冲突时优先级：**[AGENTS.md](AGENTS.md) > README.md > locale 文案**。UI 相关问题先读 [docs/UI.md](docs/UI.md)。
