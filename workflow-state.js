(function registerWorkflowState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkflowState = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  const nodes = [
    { id: "request", code: "01", title: "用户需求", subtitle: "目标、约束与验收条件", layer: "需求层", x: 540, y: 24, width: 240 },
    { id: "commander", code: "CO", title: "主 Agent", subtitle: "拆解、路由与最终验收", layer: "管理层", x: 540, y: 134, width: 240 },
    { id: "orchestrator", code: "OR", title: "调度中心", subtitle: "状态同步与依赖编排", layer: "调度层", x: 540, y: 244, width: 240 },
    { id: "product", code: "PM", title: "产品经理 Agent", subtitle: "需求分析与验收标准", role: "产品经理 Agent", layer: "专业层", x: 50, y: 374, width: 210 },
    { id: "architect", code: "AR", title: "架构师 Agent", subtitle: "架构设计与接口契约", role: "架构师 Agent", layer: "专业层", x: 290, y: 374, width: 210 },
    { id: "techlead", code: "TL", title: "技术主管 Agent", subtitle: "实施规划与质量把控", role: "技术主管 Agent", layer: "专业层", x: 530, y: 374, width: 210 },
    { id: "security", code: "SE", title: "安全专家 Agent", subtitle: "威胁建模与安全验收", role: "安全专家 Agent", layer: "专业层", x: 770, y: 374, width: 210 },
    { id: "frontend", code: "FE", title: "前端 Agent", subtitle: "界面与交互实现", role: "前端 Agent", layer: "研发层", x: 10, y: 524, width: 185 },
    { id: "backend", code: "BE", title: "后端 Agent", subtitle: "服务与业务逻辑", role: "后端 Agent", layer: "研发层", x: 215, y: 524, width: 185 },
    { id: "database", code: "DB", title: "数据库 Agent", subtitle: "模型、迁移与优化", role: "数据库 Agent", layer: "研发层", x: 420, y: 524, width: 185 },
    { id: "tester", code: "QA", title: "测试 Agent", subtitle: "自动测试与质量报告", role: "测试 Agent", layer: "研发层", x: 625, y: 524, width: 185 },
    { id: "reviewer", code: "CR", title: "代码审查 Agent", subtitle: "缺陷审查与重构建议", role: "代码审查 Agent", layer: "研发层", x: 830, y: 524, width: 185 },
    { id: "devops", code: "DO", title: "DevOps Agent", subtitle: "构建、版本与运行保障", role: "DevOps Agent", layer: "研发层", x: 1035, y: 524, width: 185 },
    { id: "delivery", code: "OK", title: "审查与交付", subtitle: "检查、版本、部署与审计", layer: "交付层", x: 540, y: 674, width: 240 }
  ];

  const edges = [
    ["request", "commander"], ["commander", "orchestrator"],
    ["orchestrator", "product"], ["orchestrator", "architect"], ["orchestrator", "techlead"], ["orchestrator", "security"],
    ["product", "architect"], ["architect", "techlead"],
    ["techlead", "frontend"], ["techlead", "backend"], ["techlead", "database"],
    ["security", "frontend"], ["security", "backend"], ["security", "database"],
    ["frontend", "tester"], ["backend", "tester"], ["database", "tester"],
    ["frontend", "reviewer"], ["backend", "reviewer"],
    ["tester", "devops"], ["reviewer", "devops"], ["security", "devops"],
    ["devops", "delivery"]
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
    if (!task) return { state: "idle", detail: "等待任务" };
    const runs = Array.isArray(task.runs) ? task.runs : [];
    const run = runs.find((item) => item.delegateTo === role);
    if (run) {
      const failed = run.verification?.passed === false;
      return { state: failed ? "failed" : "done", detail: failed ? "检查未通过" : run.summary || "步骤已完成", run };
    }
    if (task.status === "progress" && task.agent === role) return { state: "active", detail: "正在执行" };
    if (task.status === "todo" && task.agent === role) return { state: "queued", detail: "等待调度" };
    return { state: "idle", detail: "本任务未路由" };
  }

  function systemStatus(task, nodeId) {
    if (!task) return { state: "idle", detail: "等待任务" };
    const failed = Boolean(task.error || task.verification?.passed === false);
    if (nodeId === "request") return { state: "done", detail: task.title };
    if (nodeId === "commander") {
      if (failed) return { state: "failed", detail: "验收未通过" };
      if (task.status === "done") return { state: "done", detail: "最终验收完成" };
      return { state: task.status === "progress" ? "active" : "queued", detail: task.status === "progress" ? "正在协调团队" : "等待接管" };
    }
    if (nodeId === "orchestrator") {
      if (failed) return { state: "failed", detail: "任务已退回" };
      if (task.status === "done") return { state: "done", detail: `${task.runs?.length || 0} 个步骤已完成` };
      return { state: task.status === "progress" ? "active" : "queued", detail: task.status === "progress" ? "编排执行中" : "等待执行" };
    }
    if (nodeId === "delivery") {
      if (failed) return { state: "failed", detail: "交付被检查阻断" };
      if (task.status === "done") return { state: "done", detail: `${task.artifacts?.length || 0} 个产物可交付` };
      return { state: "idle", detail: "等待研发闭环完成" };
    }
    return { state: "idle", detail: "等待任务" };
  }

  function build(tasks, selectedId) {
    const task = selectTask(tasks, selectedId);
    const resolvedNodes = nodes.map((node) => ({ ...node, ...(node.role ? roleStatus(task, node.role) : systemStatus(task, node.id)) }));
    const byId = Object.fromEntries(resolvedNodes.map((node) => [node.id, node]));
    const resolvedEdges = edges.map(([from, to]) => {
      const target = byId[to];
      const source = byId[from];
      const state = target.state === "failed" ? "failed" : ["active", "done"].includes(target.state) && source.state !== "idle" ? "active" : "idle";
      return { from, to, state };
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
        progress: task ? Math.round((completed / resolvedNodes.length) * 100) : 0,
        artifacts: task?.artifacts?.length || 0
      }
    };
  }

  return Object.freeze({ build, selectTask });
}));
