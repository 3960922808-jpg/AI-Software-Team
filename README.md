# AI Software Team

面向 Windows 的多智能体软件研发工作台。它不是网页演示，而是可打包、可下载、可配置真实模型并生成项目文件的 Electron 桌面软件。

主 Agent 负责理解目标、拆解任务与最终审查；10 个专业 Agent 使用各自的模型路由和特调 Skill 完成产品、架构、前端、后端、数据库、测试、安全、代码审查与交付工作。所有执行步骤、文件产物、真实检查、自动修复和 Git 快照都有记录。

> 当前版本：`v0.22.0` · 支持简体中文和英文 · 提供 Windows x64 ZIP 免安装版

## 下载

在 [GitHub Releases](https://github.com/3960922808-jpg/AI-Software-Team/releases) 下载最新的 `AI Software Team-<版本>-x64.zip`，解压后运行 `AI Software Team.exe`。

软件内置 GitHub Release 更新器。它可以启动时自动检查、后台下载 Windows ZIP，并在退出或用户选择“立即重启更新”后覆盖旧版本。更新包会先校验大小、桌面程序和 `resources/app.asar`，不符合结构的包不会安装。

## 核心能力

### 真实多 Agent 研发闭环

```text
用户需求
  -> 主 Agent 拆解与路由
  -> 产品与架构 Agent 定义范围和系统设计
  -> 开发 Agent 生成完整文件
  -> 测试 Agent 运行真实检查
  -> 失败结果回传并自动修复（最多两轮）
  -> 主 Agent 审查、Git 快照与交付
```

- 主 Agent 和 10 个专业 Agent 可使用主模型的子 Agent，也可分别绑定模型池中的独立大模型。
- OpenAI、Anthropic、Google AI、DeepSeek 和 OpenAI 兼容服务均可配置。
- 生图与视频使用各自独立的 API Key，不与主模型共享。
- 语音识别与语音合成拥有独立服务、模型和 API Key，不与其他模型共享。
- API Key 和 GitHub Token 由 Electron 主进程调用 Windows 加密服务持久化，前端无法读取明文。
- 主模型、模型池、生图、视频和语音配置保存在 Windows 用户数据目录，采用原子写入与 `.bak` 自动恢复；版本更新不会覆盖本机配置。
- 设置页的本机配置保险箱可以查看持久化状态、打开目录，并导入或导出绑定当前 Windows 用户的加密配置。
- Agent 产物目录由用户自由选择，每个任务写入独立的 `.ai-team-output/<任务 ID>`。

### Agent 工作室与可视化工作流

- Agent 工作室以办公室和主对话框为中心，可查看 10 个 Agent 的真实任务状态、进度和工作反馈。
- 工作室与工作流对话都支持 `@Agent` 单独派活和 `/Skill` 调用技能，自动补全来自当前 Agent 与已启用 Skill。
- 可视化工作流支持软件研发、生图和视频模板；图片与视频模式使用 `3400 × 2100` 大画布和类似 ComfyUI 的端口节点编排。
- 节点可拖动、添加、编辑、删除和调整进度；连线可创建、预览和删除。
- 媒体节点显示输入/输出端口，支持按端口自定义连线、节点库复制、提示词/尺寸/采样/运动/导出参数编辑和流动连线动画。
- 图片工作流可调用真实生图 API 并保存、预览结果；视频工作流可保存直接返回的视频，或展示服务商任务编号。
- 每个工作流节点都能查看模型路由、Skill、执行证据、产物与真实检查结果。

### 会话级完全访问

- 工作室和工作流两个 AI 对话框都提供“完全访问”开关，状态实时同步。
- 权限每次启动默认关闭，不写入任何持久化存储；关闭后主进程立即拒绝新的电脑动作。
- 用户确认开启后，Agent 可以按白名单读取文件与文件夹、读取公开网页、打开应用或路径、查看窗口、操作剪贴板、输入文字、发送快捷键、点击坐标和读取屏幕。
- 主进程会再次校验每个动作，每轮最多执行 8 个动作；对话中会显示真实成功或失败记录。

### 真实语音交互

- 工作室主对话和可视化工作流对话都可以直接录音。
- Chromium `MediaRecorder` 采集麦克风音频，Electron 主进程调用真实语音识别 API，识别结果回填输入框供用户确认。
- 每条 Agent 回复均可朗读、随时停止，也可以开启自动朗读。
- 语音识别支持 OpenAI 兼容接口、Groq、Deepgram 和自定义服务；语音合成支持 OpenAI 兼容接口和自定义服务。
- 设置页可分别配置识别模型、合成模型、API 地址、两套独立密钥、音色、语速和自动朗读。
- 录音限制为 25 MB、最长 120 秒；服务请求有超时和错误反馈，不会把密钥发送到渲染进程。

### 长期记忆知识图谱

记忆中心支持选择任意本地项目或资料文件夹，并将其索引成可交互的蜘蛛网知识图谱：

- 扫描目录、源代码、Markdown、配置和常见文本文件。
- 识别文件包含关系、`import`、`require`、HTML/Markdown 链接和共享概念，并记录失效引用与不可读文件。
- 索引改为异步分批执行并显示真实阶段进度，大型目录扫描时不会长期阻塞桌面界面。
- 可缩放、平移、拖动节点、按类型和关系筛选；布局会持久化，筛选不会再重置节点位置。
- 搜索结果按相关性排序，点击即可居中定位；节点详情会列出直接关联节点。
- 支持适应画布、重置布局、鼠标位置缩放，以及孤立节点、失效引用、超大文件和截断原因诊断。
- 忽略 `.git`、`node_modules`、构建目录、缓存和大型文件。
- 图谱持久化到当前 Windows 用户数据目录，并按当前任务或对话的相关性进入主 Agent 与子 Agent 长期上下文。

知识文档库与图谱分开保存，适合产品资料、论文和长篇小说：

- 任意文件都能作为原始附件导入，单文件上限 200 MB。
- 可提取 TXT、Markdown、DOCX、DOC、PDF、PPTX、PPT、CSV、JSON、HTML 等正文；旧版 PPT 会尝试调用本机 PowerPoint 或 WPS。
- 单篇正文最多保留约 400 万字符，原文件、提取正文和索引均位于本机用户数据目录，不再受浏览器存储容量限制。
- 提取失败的格式仍会保留原附件、原因和元数据，可随时打开原文件。

语音与记忆职责分层参考了白龙马系开源项目 [okbabybo/nanai](https://github.com/okbabybo/nanai) 的设计思路。本项目针对现有 Electron 安全边界、模型池和桌面交互重新实现，没有引入其 Python 语音服务或直接复制业务模块。

### Skill 与工具系统

- 内置 Agent 专属技能可以逐项启用或停用。
- 用户可上传结构化 Skill JSON、单个 `SKILL.md`，或导入包含 `SKILL.md` 的文件夹。
- Markdown Skill 支持 `id`、`name`、`version`、`category`、`description`、`agents` 和 `skills` 前置元数据。
- 自定义 Skill 只会注入提示、约束和角色授权，不执行第三方脚本。
- 联网中心支持公开 HTTPS 网页、GitHub 公开或私有仓库、SSH 地址、分支页和文件页。
- GitHub 分支和子路径会被保留；连接后的资源可从桌面软件安全打开原链接。

### 执行、安全与交付

- 文件写入限制在任务隔离目录内，拒绝绝对路径和 `..` 越界。
- 子进程使用 `shell: false`，仅允许 Node、包管理器、Python、pytest 和只读 Git 等受控命令。
- 单项命令默认 45 秒超时，日志最大 256 KB，敏感环境变量不会传给生成项目。
- 测试失败会把真实错误回传原 Agent，自动修复后重新运行。
- 审计中心记录子任务、模型、产物、命令、错误、修复和 Git 版本。
- 交付中心检查项目入口、清单、测试脚本和文件 SHA-256，并生成版本候选与部署记录。

这是策略隔离沙箱，不是虚拟机。不要运行来源不可信的模型或生成代码。

## Skill 格式

结构化 JSON：

```json
{
  "id": "release-review",
  "name": "Release Review",
  "version": "1.0.0",
  "category": "Delivery",
  "description": "Validate a release before delivery.",
  "agents": ["测试 Agent", "DevOps Agent"],
  "skills": ["release review", "checksum"],
  "prompt": "Inspect tests, checksums and release notes before delivery."
}
```

`SKILL.md`：

```markdown
---
id: release-review
name: Release Review
agents: [测试 Agent, DevOps Agent]
skills: [release review, checksum]
---
# Release Review
Inspect tests, checksums and release notes before delivery.
```

## 本地开发

环境要求：Windows 10/11、Node.js 20+、pnpm。

```powershell
pnpm install
pnpm start
```

测试与构建：

```powershell
pnpm test
pnpm run test:electron
pnpm run build:windows
```

输出位于 `release-v0.22/`，生成 x64 ZIP 免安装版。GitHub Release 只发布 ZIP 包。

开发环境可以参考 `.env.example` 设置主模型后备配置。仓库中不要提交 API Key、GitHub Token、`.env` 或其他真实密钥。

## English

AI Software Team is a native Windows multi-agent software development workspace built with Electron. A primary agent decomposes and routes user goals to ten specialist agents, which generate real files, run controlled checks, repair failures, create Git snapshots, and produce auditable delivery records.

Version `0.22.0` adds a persistent document and novel library with TXT, DOCX, DOC, PDF, PPTX, and PPT extraction; a ComfyUI-style large-canvas image/video workflow with ports and editable parameters; session-only full computer access that is off by default; real media generation queues; and an update-safe encrypted configuration vault with automatic backup recovery. The entire interface can switch between Simplified Chinese and English from Settings.

Download the latest Windows build from [Releases](https://github.com/3960922808-jpg/AI-Software-Team/releases).

## License

MIT
