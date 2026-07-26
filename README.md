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

## 本地运行

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

当前版本为零依赖静态 Web 软件。打开 `index.html` 即可使用；发布包可直接由系统下载。生产版将增加后端 API 代理、加密密钥管理和桌面安装程序。
