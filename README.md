# AI Software Team

基于多 Agent 协作的软件研发平台。当前已完成前三个板块：**AI 项目经理工作台**、**Agent Orchestrator（智能调度中心）** 与 **模型/API 配置及技能中心**。

## 当前功能

- 需求目标概览与项目指标
- 看板式任务生命周期：待处理、进行中、已完成
- 任务创建、Agent 分派、优先级管理和状态流转
- 浏览器 `localStorage` 数据持久化
- Agent 注册表、任务执行队列与调度事件记录
- 项目任务与调度中心实时联动，支持一键启动下一项待处理任务
- 主模型的提供商、Base URL、模型名称和会话级 API Key 配置
- 指挥 Agent 的调度策略，以及 9 个 Agent 的专属 Skill 开关

## Electron Windows 桌面版

正式桌面版基于 Electron。开发运行：

```powershell
pnpm install
pnpm start
```

构建 Windows 安装包和便携版：

```powershell
pnpm build:windows
```

构建结果输出到版本化的 `release-v*/` 目录。

## WPF 兼容启动器

双击 `start-windows-app.cmd` 可启动 PowerShell/WPF 兼容客户端。正式发布版本使用 Electron 安装包。

- 本地任务数据：`%APPDATA%\AI Software Team\workspace.json`
- API Key：仅保留在应用运行内存中，关闭程序即清除
- 功能页面：项目工作台、智能调度中心、模型与 API、Agent 技能中心
- 记忆与知识库：项目记忆、文档导入、本地检索与删除
- 真实模型运行时：支持 OpenAI、Anthropic、Google AI、DeepSeek 和兼容 OpenAI 的服务
- 两级 Agent 执行：指挥 Agent 规划和路由，专业子 Agent 使用授权 Skill 完成任务
- 执行结果自动回写任务、调度事件和主界面最新交付区

API Key 只存在 Electron 主进程内存中，不会写入任务数据、配置文件或 Git 仓库。

`build-windows-exe.ps1` 是独立 `.exe` 构建脚本，需要在安装 Python 和 PyInstaller 的构建环境中执行。

## Web 原型

在仓库根目录执行：

```powershell
python -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

## 后续板块

1. Agent Orchestrator：任务路由、执行队列、Agent 状态与审计记录。
2. 专业 Agent：产品、架构、研发、测试、安全与 DevOps 的标准化工具契约。
3. 记忆与知识：项目上下文、向量检索和 RAG。
4. 交付平台：CI/CD、部署、监控与告警。

> 不要将 GitHub Token、模型 API Key 或任何密钥提交到仓库；使用本机环境变量或密钥管理服务。

## 打包说明

当前发布包包含 Windows 桌面启动器、桌面程序源文件和 Web 原型。生产版将增加后端 API 代理、加密密钥管理和签名安装程序。
