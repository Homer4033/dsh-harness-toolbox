# 压缩分档与工具箱（dsh-harness-toolbox）

> DSH 插件：五档上下文压缩 + 全局与工作区规则编辑 + 组件管理（`gh` / git / ffmpeg / Python）+ `github_push` 发布。
> 包名 `dsh-harness-toolbox`（旧名 `dsh-compression-tiers` 已弃用），加载器行 id 仍是 `compression-tiers`，状态目录不变。

## 目录

- [安装](#安装)
- [使用](#使用)
- [五档参数](#五档参数)
- [智能体工具](#智能体工具)
- [组件管理](#组件管理)
- [全局规则](#全局规则)
- [工作区规则](#工作区规则)
- [兼容性与限制](#兼容性与限制)
- [开发](#开发)

## 安装

要求 Node.js ≥ 24.9；DSH 运行时 `0.2.2-rc.3` 到 `0.3.0` 之前（`engines.dsh` 声明）。

**从 npm 安装（推荐）**

包名 `dsh-harness-toolbox`（已发布在 npmjs.com，版本见 `npm view dsh-harness-toolbox version`）：

1. DSH → **插件 → 添加插件**，输入包名 `dsh-harness-toolbox`（要锁版本就写 `dsh-harness-toolbox@1.10.2`）；
2. 安装完成后打开新会话 → 左侧栏的 **压缩分档** 面板。

也可以在会话里让智能体用 `plugin_manager` 安装这个包名。

**从本地目录安装**

1. 把本仓库放到任意目录；
2. DSH → **插件 → 添加插件**，选择这个目录；
3. 打开新会话 → 左侧栏的 **压缩分档** 面板。

安装与启用都交给 DSH（不要手改 profile 的 `package.json` / `cordis.patch.yml`）。宿主包（`@deepseek-ai/dsh-home-paths`、`@deepseek-ai/dsh-tools`）由运行时提供，本包只声明为可选 `peerDependencies`，这样以「链接到外部目录」方式安装也能解析。

> 国内镜像（npmmirror）同步可能滞后：插件页装不到刚发布的版本时，先用上面的 `npm view` 确认线上版本，再等镜像同步或换 registry。

## 使用

左侧栏的 **压缩分档** 面板（不再占用系统设置页）是「左侧导航 + 一次一页」的外壳，五个分页：

- **档位**：五个按钮，点一下立即写入所有已挂载的预设压缩引擎（在 `<DSH home>/compression-tiers/settings.json` 留档），不需要重启。
- **规则**：直接编辑 `<DSH home>/AGENTS.md`，保存即原子写入；系统提示只带最新 2,000 字符摘要。
- **工作区**：从已注册工作区里选一个，编辑它根目录的 `AGENTS.md`；还没有注册工作区时这一页照常打开，只是提示「目前无工作区」（保存按钮置灰）。
- **组件**：GitHub CLI、git、ffmpeg/ffprobe、Python 四行，每行「下载 / 重新检测」，底部是四套组件共用的下载目录。
- **GitHub**：账号状态与 token 的授权范围（scopes）、`gh auth login --web` 设备码、网络体检。

面板是液体玻璃外壳：导航栏与卡片共用一套玻璃配方，画布用三段强调色渐变，卡片 20px 圆角。面板宽度不足 720px 时导航栏变成页面上方的横向条并自动换行。表面层级、间距、分页与下拉的规范见 [docs/UI.md](docs/UI.md)。

输入框上方还有一个「仓库」胶囊：给当前会话绑定一个在线仓库，`github_push` 默认推到它；胶囊在空会话里也显示，右缘与输入卡右缘对齐，菜单向上弹出。

## 五档参数

| 档位 | 自动触发 | 逐字保留 | 定位 |
| --- | ---: | ---: | --- |
| `gentle` 极轻 | 80% | 20% | 与官方默认一致，最贵最晚 |
| `light` 轻量 | 70% | 18% | 比官方早一档 |
| `standard` 标准 | 60% | 16% | **默认** |
| `aggressive` 积极 | 50% | 10% | 成本优先 |
| `max` 最大 | 40% | 6% | 最省 |

官方公式：`floor(min(W × thresholdRatio, W − O − 65,536))`，逐字保留为 `(W − O) × retainRatio`。

`0.80` 是最贵的一档，不是中间档；默认用 `standard`，让长对话更早压缩。

## 智能体工具

- `compression_tiers`：读或切档位，可带按路由的 `headroomTokens` 覆盖（`provider model headroom [retain]` 行）。
- `compression_context`：读实时占用、本档阈值与剩余空间；对话尾部的 `[context]` 行给的是同样的数字。
- `compression_compact`：排队一次主动压缩，本轮结束后执行并自动续跑；压缩期间你发的消息会取消排队任务或阻止续跑，不会被流程吞掉。
- `github_push`：发布当前工作区——网络体检 → 密钥扫描 → 60 秒超时推送 → 失败分类。默认用会话工作目录；绑定了在线仓库就推到它。密钥命中会阻止推送，人工确认后可用 `force: true`。

## 组件管理

四套托管组件装在一个可配置根目录下，都能识别系统 PATH 副本，托管副本优先并插到本进程 PATH 最前（不写系统环境变量）。

| 组件 | 托管源 | 位置 | PATH 目录 |
| --- | --- | --- | --- |
| GitHub CLI | `cli/cli` release，钉 `2.76.2` | `<root>/gh` | `<root>/gh/bin` |
| git | MinGit，钉 `2.56.1` | `<root>/git` | `<root>/git/cmd` |
| ffmpeg/ffprobe | gyan.dev essentials（浮动 release） | `<root>/ffmpeg` | `<root>/ffmpeg/bin` |
| Python | python-build-standalone，钉 `3.11.18+20261110` | `<root>/python` | `<root>/python`、`Scripts` |

- **下载**：HTTP Range 续传、20 分钟超时；解压到 `<root>/.staging/<id>` 后先跑 `--version` / `-version` 自检，通过才原子替换整棵目录，失败回滚并保留 `.part`。
- **下载目录**：`settings.json` 的 `toolsPath`（空 = `<DSH home>/compression-tiers`）。迁移只接受绝对路径、整体搬四套组件、任一下载进行中拒绝、目标已存在拒绝、跨卷自动退化为复制后删除。
- **接口**：`GET/POST /compression-tiers/api/components`（读四行状态 / `{id, action:'download'}`），`GET/POST /compression-tiers/api/tools`（读目录状态 / `{action:'migrate', path}`）。
- **边界**：托管源只有 Windows；Linux / macOS 只做 PATH 检测并显示「当前系统不可用」。

## 全局规则

`<DSH home>/AGENTS.md` 是唯一事实来源，插件不复制、不缓存。保存是原子写入（去 BOM、CRLF→LF、单个结尾换行），单次上限 100,000 字符，超出返回 413。系统提示只带最新 2,000 字符摘要，不整份注入。智能体没有改写它的工具——只能由人在「压缩分档」面板里保存。

## 工作区规则

每个已注册工作区根目录的 `AGENTS.md` 是它自己的事实来源，官方指令加载器会在该工作区的会话里读取。面板从 `<DSH home>/storages/workspace.json` 读工作区清单，只允许编辑清单里的工作区（id 不在表里返回 404），写入与全局规则同样归一化、同样 100,000 字符上限。清单为空或读不出来时，这一块整块不渲染。

- **接口**：`GET /compression-tiers/api/workspace-rules`（列出工作区与各自规则）、`POST`（`{workspaceId, rules}`）。
- **选择器**：工作区是自绘下拉（触发器 + 挂在 body 的 listbox），和仓库菜单同一套弹层规范；原生 `<select>` 的系统弹层在深色主题下是浅底配浅字，选项不可见。
- **边界**：插件不改工作区注册表，也不写未注册目录；清空 draft 再保存得到空文件。

## 兼容性与限制

- **窗口**：五档按 ≥256k tokens 设计；128k 窗口下只剩保留量不同，≤64k 的窗口会被官方 65,536 输出余量卡住，可用 `compression_tiers` 的 `routeLines` 为该路由写更小的 `headroomTokens`。
- **宿主平面**：只更新预设隔离域里的引擎；如果别的插件也管理同一批引擎，两边会互相覆盖，只留一个。
- **网络**：GitHub 与 npm 相关操作需要能访问 `github.com`；代理死掉或 DNS 被污染时用「网络体检」定位。ffmpeg 需能访问 `www.gyan.dev`。
- **托管副本会盖过系统版本**：装了托管 git / Python 后，本进程内的 `git` / `python` 优先用托管副本；删掉 `<root>/git`、`<root>/python` 并重启即回退。
- **凭据**：`gh` 的登录凭据存在它自己的存储里，插件不读取；npm 发布需要 2FA。
- **仓库 UI**：没有仓库列表面板，也没有推送按钮。多仓库由智能体在各自会话里调用 `github_push`；输入框上方的胶囊只决定当前会话的推送目标。
- **浏览器刷新**：改档位对引擎立即生效；面板自身状态走接口刷新，个别情况需要刷新页面。

## 开发

```bash
npm test          # node:test：档位、路由、状态、引擎同步、规则、GitHub、发布、组件、下载位置、manifest
npm run check:secrets
```

```text
index.js              Host 入口：工具、系统提示、面板路由、reconciler
client.js             侧边栏面板、输入框上方的仓库胶囊与菜单
docs/UI.md            面板与弹层的 UI 规范（玻璃配方、分页导航、卡片、下拉）
src/levels.js         五档参数与阈值公式
src/presets.js        预设隔离域引擎同步
src/context-meter.js  实时占用与 [context] 尾行
src/manual-compact.js 主动压缩队列（真人输入优先）
src/store.js          状态读写（原子）
src/rules.js          全局规则：路径、校验、原子写入、摘要
src/workspace-rules.js 工作区规则：注册表读取、校验、原子写入
src/gh.js             GitHub CLI：托管下载、PATH、设备码登录、仓库列表
src/ffmpeg.js         ffmpeg / ffprobe 托管下载与 PATH
src/components.js     git / Python 托管下载与 PATH
src/component-rows.js 面板四行组件的统一形状
src/tools-path.js     下载根目录与整体迁移
src/publish.js        网络体检、push、密钥扫描、建仓
src/push-flow.js      发布流程（工具与面板共用）
test/                 node:test 用例与 manifest 检查
```

## 许可

本插件以 [MIT](LICENSE) 发布。四套托管组件不随插件分发，面板下载的是各自发行方的构建，它们的许可证随安装目录附带：GitHub CLI（MIT）、Git for Windows / MinGit（GPL-2.0）、FFmpeg（GPL-2.0-or-later）、python-build-standalone（PSF-2.0 · MIT）。
