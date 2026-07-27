# AI Software Team

基于 Electron 的 Windows 多 Agent 软件研发工作台。

## 当前功能

- 需求目标概览与项目指标
- 看板式任务生命周期：待处理、进行中、已完成
- 任务创建、Agent 分派、优先级管理和状态流转
- 浏览器 `localStorage` 数据持久化
- Agent 注册表、任务执行队列与调度事件记录
- 项目任务与调度中心实时联动，支持一键启动下一项待处理任务
- 主模型的提供商、Base URL、模型名称和 API Key 配置
- 模型配置可跨重启恢复，API Key 由 Electron 主进程调用 Windows 系统加密服务后保存在本机
- 指挥 Agent 的调度策略，以及 10 个专业 Agent 的专属 Skill 开关
- 主 Agent 真实拆解 1-6 个子任务，多专业 Agent 按各自 Skill 执行，主 Agent 最终审查汇总
- 可选本地工作目录，生成文件安全写入 `.ai-team-output`，不会覆盖原项目
- 灵灵 AI 对话可创建任务或直接启动多 Agent 执行
- 交付与部署中心：项目识别、构建检查、产物校验、版本候选、发布说明和部署审计
- 发布前评审可调用运维、测试、安全与代码审查 Agent 完成联合检查
- 联网与外部能力：安全读取公开网页、GitHub 仓库元数据和文件树，并注入智能体任务上下文
- 外部连接限制为公开 HTTPS 地址，拒绝本机与局域网目标，令牌仅保存在运行内存
- 运行与审计中心：汇总任务、子 Agent 步骤、产物与部署记录，支持状态筛选和 JSON 报告导出

## Electron Windows 桌面版

正式桌面版基于 Electron。开发运行：

```powershell
pnpm install
pnpm start
```

构建 Windows 安装包和 ZIP 免安装版：

```powershell
pnpm build:windows
```

构建结果输出到版本化的 `release-v*/` 目录。

## WPF 兼容启动器

双击 `start-windows-app.cmd` 可启动 PowerShell/WPF 兼容客户端。正式发布版本使用 Electron 安装包。

- 本地任务数据：`%APPDATA%\AI Software Team\workspace.json`
- API Key：由 Electron 主进程调用 Windows 系统加密服务后保存在本机，前端无法读取明文
- 功能页面：项目工作台、智能调度中心、模型与 API、Agent 技能中心
- 记忆与知识库：项目记忆、文档导入、本地检索与删除
- 真实模型运行时：支持 OpenAI、Anthropic、Google AI、DeepSeek 和兼容 OpenAI 的服务
- 多级 Agent 执行：主 Agent 拆解和分派，多个专业子 Agent 使用授权 Skill 完成任务，最后统一验收
- 执行结果自动回写任务、调度事件和主界面最新交付区
- 宠物 Agent 工作室：四组办公桌、角色工作动画和经理灵灵巡查动画
- Agent 右键菜单：当前任务进度、编辑角色和删除角色
- 长时间工作提醒：执行超过 45 秒后角色会随机说出专属牢骚
- 常驻灵灵 AI 对话框，可结合任务、记忆和知识库进行对话
- 新安装不再自动创建任何示例项目、任务或知识文档

API Key 不会写入前端存储、任务数据或 Git 仓库。持久化文件只包含由 Windows 系统加密后的密文，并保存在 Electron 用户数据目录。

`build-windows-exe.ps1` 是独立 `.exe` 构建脚本，需要在安装 Python 和 PyInstaller 的构建环境中执行。

## Web 原型

在仓库根目录执行：

```powershell
python -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

## 后续板块

1. 模型池：为主 Agent 和专业子 Agent 分配不同模型与独立连接。
2. 工具执行：受控终端、代码编辑、测试与构建工具契约。
3. 记忆增强：向量检索、分段索引和可追溯引用。
4. 运行监控：任务耗时、令牌统计、告警与失败重试。

> 不要将 GitHub Token、模型 API Key 或任何密钥提交到仓库；使用本机环境变量或密钥管理服务。

## 打包说明

当前发布包包含 Windows 桌面启动器、桌面程序源文件和 Web 原型。生产版将增加后端 API 代理、加密密钥管理和签名安装程序。
