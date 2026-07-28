(function registerWorkflowState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkflowState = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  const nodes = [
    { id: "request", code: "01", title: "用户需求", subtitle: "目标、约束与验收条件", type: "system", x: 630, y: 24, width: 240 },
    { id: "commander", code: "CO", title: "灵灵 · 项目经理 Agent", subtitle: "任务拆解、十路调度与最终验收", type: "manager", x: 630, y: 360, width: 240 },

    { id: "product", code: "PM", title: "产品经理 Agent", subtitle: "需求分析与验收标准", role: "产品经理 Agent", type: "agent", x: 320, y: 54, width: 210 },
    { id: "architect", code: "AR", title: "架构师 Agent", subtitle: "架构设计与接口契约", role: "架构师 Agent", type: "agent", x: 320, y: 214, width: 210 },
    { id: "techlead", code: "TL", title: "技术主管 Agent", subtitle: "实施规划与质量把控", role: "技术主管 Agent", type: "agent", x: 320, y: 374, width: 210 },
    { id: "security", code: "SE", title: "安全专家 Agent", subtitle: "威胁建模与安全验收", role: "安全专家 Agent", type: "agent", x: 320, y: 534, width: 210 },
    { id: "reviewer", code: "CR", title: "代码审查 Agent", subtitle: "缺陷审查与重构建议", role: "代码审查 Agent", type: "agent", x: 320, y: 694, width: 210 },

    { id: "frontend", code: "FE", title: "前端 Agent", subtitle: "界面与交互实现", role: "前端 Agent", type: "agent", x: 970, y: 54, width: 210 },
    { id: "backend", code: "BE", title: "后端 Agent", subtitle: "服务与业务逻辑", role: "后端 Agent", type: "agent", x: 970, y: 214, width: 210 },
    { id: "database", code: "DB", title: "数据库 Agent", subtitle: "模型、迁移与优化", role: "数据库 Agent", type: "agent", x: 970, y: 374, width: 210 },
    { id: "tester", code: "QA", title: "测试 Agent", subtitle: "自动测试与质量报告", role: "测试 Agent", type: "agent", x: 970, y: 534, width: 210 },
    { id: "devops", code: "DO", title: "DevOps Agent", subtitle: "构建、版本与运行保障", role: "DevOps Agent", type: "agent", x: 970, y: 694, width: 210 },

    { id: "product-output", code: "PRD", title: "需求与产品板块", subtitle: "范围、优先级、PRD 与验收条件", sourceRole: "产品经理 Agent", type: "module", x: 24, y: 54, width: 220 },
    { id: "architect-output", code: "ADR", title: "架构与接口板块", subtitle: "系统边界、技术决策与接口契约", sourceRole: "架构师 Agent", type: "module", x: 24, y: 214, width: 220 },
    { id: "techlead-output", code: "GOV", title: "技术治理板块", subtitle: "实施计划、规范、风险与质量门禁", sourceRole: "技术主管 Agent", type: "module", x: 24, y: 374, width: 220 },
    { id: "security-output", code: "SEC", title: "安全审查板块", subtitle: "威胁模型、依赖审查与安全结论", sourceRole: "安全专家 Agent", type: "module", x: 24, y: 534, width: 220 },
    { id: "reviewer-output", code: "REV", title: "代码审查板块", subtitle: "缺陷清单、规范检查与重构建议", sourceRole: "代码审查 Agent", type: "module", x: 24, y: 694, width: 220 },

    { id: "frontend-output", code: "UI", title: "前端交付板块", subtitle: "页面、组件、交互与体验验证", sourceRole: "前端 Agent", type: "module", x: 1266, y: 54, width: 220 },
    { id: "backend-output", code: "API", title: "后端服务板块", subtitle: "接口、业务规则、集成与文档", sourceRole: "后端 Agent", type: "module", x: 1266, y: 214, width: 220 },
    { id: "database-output", code: "DATA", title: "数据工程板块", subtitle: "模型、迁移、索引与回滚脚本", sourceRole: "数据库 Agent", type: "module", x: 1266, y: 374, width: 220 },
    { id: "tester-output", code: "TEST", title: "测试验收板块", subtitle: "用例、真实检查、修复与质量报告", sourceRole: "测试 Agent", type: "module", x: 1266, y: 534, width: 220 },
    { id: "devops-output", code: "OPS", title: "交付运维板块", subtitle: "Git、构建、部署、监控与故障恢复", sourceRole: "DevOps Agent", type: "module", x: 1266, y: 694, width: 220 }
  ];

  const agentIds = ["product", "architect", "techlead", "security", "reviewer", "frontend", "backend", "database", "tester", "devops"];
  const edges = [
    ["request", "commander", "input"],
    ...agentIds.map((agentId) => ["commander", agentId, "branch"]),
    ...agentIds.map((agentId) => [agentId, `${agentId}-output`, "output"])
  ];

  function selectTask(tasks, selectedId) {
    const list = Array.isArray(tasks) ? tasks : [];
    return list.find((task) => task.id === selectedId)
      || list.find((task) => task.status === "progress")
      || list.find((task) => task.status === "todo")
      || list[0]
      || null;
  }

  function roleStatus(task, role) {
    if (!task) return { state: "idle", detail: "等待经理分派" };
    const runs = Array.isArray(task.runs) ? task.runs : [];
    const run = runs.find((item) => item.delegateTo === role);
    if (run) {
      const failed = run.verification?.passed === false;
      return { state: failed ? "failed" : "done", detail: failed ? "检查未通过" : run.summary || "步骤已完成", run };
    }
    if (task.status === "progress" && task.agent === role) return { state: "active", detail: "正在执行经理分派的任务" };
    if (task.status === "todo" && task.agent === role) return { state: "queued", detail: "已进入经理调度队列" };
    return { state: "idle", detail: "本任务未分派到该 Agent" };
  }

  function systemStatus(task, nodeId) {
    if (!task) return { state: "idle", detail: "等待任务" };
    const failed = Boolean(task.error || task.verification?.passed === false);
    if (nodeId === "request") return { state: "done", detail: task.title };
    if (nodeId === "commander") {
      if (failed) return { state: "failed", detail: "经理验收未通过，任务已退回" };
      if (task.status === "done") return { state: "done", detail: `已汇总 ${task.runs?.length || 0} 个 Agent 步骤并完成验收` };
      return { state: task.status === "progress" ? "active" : "queued", detail: task.status === "progress" ? "正在向专业 Agent 分派任务" : "等待接管并拆解任务" };
    }
    return { state: "idle", detail: "等待任务" };
  }

  function build(tasks, selectedId) {
    const task = selectTask(tasks, selectedId);
    const agentStates = Object.fromEntries(nodes.filter((node) => node.role).map((node) => [node.role, roleStatus(task, node.role)]));
    const resolvedNodes = nodes.map((node) => {
      if (node.role) return { ...node, ...agentStates[node.role] };
      if (node.sourceRole) {
        const source = agentStates[node.sourceRole] || { state: "idle", detail: "等待对应 Agent" };
        return { ...node, ...source, detail: source.state === "done" ? `${node.title}已生成可审计结果` : source.detail };
      }
      return { ...node, ...systemStatus(task, node.id) };
    });
    const byId = Object.fromEntries(resolvedNodes.map((node) => [node.id, node]));
    const resolvedEdges = edges.map(([from, to, kind]) => {
      const target = byId[to];
      const source = byId[from];
      const state = target.state === "failed" ? "failed" : ["active", "done"].includes(target.state) && source.state !== "idle" ? "active" : "idle";
      return { from, to, kind, state };
    });
    const completed = resolvedNodes.filter((node) => node.state === "done").length;
    return {
      task,
      nodes: resolvedNodes,
      edges: resolvedEdges,
      summary: {
        completed,
        active: resolvedNodes.filter((node) => node.state === "active").length,
        failed: resolvedNodes.filter((node) => node.state === "failed").length,
        progress: task ? (task.status === "done" && !task.error ? 100 : Math.round((completed / resolvedNodes.length) * 100)) : 0,
        artifacts: task?.artifacts?.length || 0
      }
    };
  }

  return Object.freeze({ build, selectTask, agentIds: Object.freeze([...agentIds]) });
}));
