# AI Software Team

AI Software Team 是一款基于 Electron 的 Windows 多智能体软件研发工作台。正式产品入口是 Windows 桌面程序，不是网页。

## 运行入口

普通用户从 GitHub Releases 下载 ZIP 免安装版或安装版，启动 `AI Software Team.exe`。

开发运行：

```powershell
pnpm install
pnpm start
```

运行全部自动化测试：

```powershell
pnpm test
```

构建 Windows ZIP 与安装版：

```powershell
pnpm build:windows
```

本项目使用 Node.js 与 Electron，因此不需要 Python 的 `requirements.txt`。

## 模型与密钥

在桌面软件的“模型与 API”中配置提供商、Base URL、模型名称与 API Key。API Key 由 Electron 主进程调用 Windows 系统加密服务保存，前端、任务数据和 Git 仓库都无法读取明文。

开发环境也可参考 `.env.example` 设置 `AI_TEAM_PROVIDER`、`AI_TEAM_BASE_URL`、`AI_TEAM_MODEL` 和 `AI_TEAM_API_KEY`。环境变量只作为本次进程的后备配置，不会写入磁盘。

## 真实 Agent 流程

每个研发任务至少经过以下阶段：

1. 产品经理 Agent：澄清需求、范围与验收标准。
2. 架构师 Agent：设计系统边界、目录结构与运行入口。
3. 开发 Agent：生成完整项目文件，不只输出代码片段。
4. 测试 Agent：在受控执行沙箱中运行真实检查。
5. 主 Agent：汇总产物、检查结果、风险与 Git 版本。

主 Agent 和十个专业子 Agent 可分别绑定不同模型。每个 Agent 只会获得技能中心中已启用的专属 Skill。

## 执行沙箱

- 所有生成文件只写入 `<工作目录>/.ai-team-output/<任务 ID>`，不覆盖原项目。
- 子进程使用 `shell: false`，拒绝 Shell 控制符和目录越界。
- 仅允许受控的 Node、npm、pnpm、Python、pytest 与只读 Git 检查。
- 单项命令默认 45 秒超时，日志最多 256 KB。
- 敏感环境变量不会传给生成项目。
- 检查失败后，真实错误会回传给原 Agent，最多自动修复两轮并重新运行。
- 验证通过后可在该任务目录自动初始化 Git 并创建本地版本。

这是策略隔离沙箱，不是虚拟机。不要运行来源不可信的模型或生成代码。

## 记忆与工具

- 短期记忆：当前任务、依赖步骤和对话上下文。
- 长期记忆：项目决策、约束、经验与导入的知识文档。
- 文件工具：创建目录、写入完整文件、限制文件大小与路径。
- 终端工具：白名单命令、真实退出码、标准输出和错误输出。
- 搜索工具：公开 HTTPS 文档与 GitHub 仓库文件树。
- Git 工具：隔离仓库初始化、状态检查与版本提交。
- 交付工具：项目识别、文件哈希、发布清单和部署审计。

## 可运行案例

“执行沙箱”页面提供三个按需创建的案例，不会在首次启动时自动添加项目：

- 响应式网站：页面、交互、测试、README 与启动命令。
- Windows 桌面工具：Electron 主进程、预加载桥、文件能力与打包入口。
- API 服务：接口、校验、错误响应、测试、环境示例与启动命令。

## 输出标准

完成状态必须同时满足：

- 生成完整项目文件。
- 包含 README 与明确启动方式。
- 至少一项真实检查通过。
- 自动修复后仍失败的任务不会标记为完成。
- 审计中心能查看 Agent 步骤、文件、检查与修复记录。

## 安全说明

不要提交 GitHub Token、模型 API Key、`.env` 或任何真实密钥。生成项目的 Git 快照会自动忽略 `.env`、依赖目录、缓存与构建产物。
