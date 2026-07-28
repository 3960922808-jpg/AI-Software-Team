(function registerWorkflowState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkflowState = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  const softwareAgents = [
    ["product", "PM", "产品经理 Agent", "需求分析与验收标准", "PRD", "需求与产品任务"],
    ["architect", "AR", "架构师 Agent", "架构设计与接口契约", "ADR", "架构与接口任务"],
    ["techlead", "TL", "技术主管 Agent", "实施规划与质量把控", "GOV", "技术治理任务"],
    ["security", "SE", "安全专家 Agent", "威胁建模与安全验收", "SEC", "安全审查任务"],
    ["frontend", "FE", "前端 Agent", "界面与交互实现", "UI", "前端实现任务"],
    ["backend", "BE", "后端 Agent", "服务与业务逻辑", "API", "后端服务任务"],
    ["database", "DB", "数据库 Agent", "模型、迁移与优化", "DATA", "数据工程任务"],
    ["tester", "QA", "测试 Agent", "自动测试与质量报告", "TEST", "测试验收任务"],
    ["reviewer", "CR", "代码审查 Agent", "缺陷审查与重构建议", "REV", "代码审查任务"],
    ["devops", "DO", "DevOps Agent", "构建、版本与运行保障", "OPS", "交付运维任务"]
  ];

  function createSoftwareTemplate() {
    const manager = { id: "commander", code: "CO", title: "灵灵 · 项目经理 Agent", subtitle: "拆解需求并向 10 个 Agent 派发任务", type: "manager", manager: true, x: 40, y: 490, width: 240 };
    const agents = softwareAgents.map(([id, code, title, subtitle], index) => ({ id, code, title, subtitle, role: title, type: "agent", x: 390, y: 20 + index * 105, width: 220 }));
    const modules = softwareAgents.map(([id, , role, , outputCode, outputTitle], index) => ({ id: `${id}-output`, code: outputCode, title: outputTitle, subtitle: `${role}继续拆分并交付的任务板块`, sourceNode: id, sourceRole: role, type: "module", x: 830, y: 20 + index * 105, width: 230 }));
    const edges = [
      ...softwareAgents.map(([id]) => ({ from: "commander", to: id, kind: "branch" })),
      ...softwareAgents.map(([id]) => ({ from: id, to: `${id}-output`, kind: "output" }))
    ];
    return { id: "software", name: "软件研发", description: "经理调度 10 个专业 Agent", width: 1500, height: 1120, nodes: [manager, ...agents, ...modules], edges };
  }

  function createMediaTemplate(id, name, description, workers) {
    const manager = { id: `${id}-manager`, code: "DIR", title: `${name}导演 Agent`, subtitle: description, type: "manager", manager: true, x: 40, y: 330, width: 240 };
    const agents = workers.map(([nodeId, code, title, role, subtitle], index) => ({ id: nodeId, code, title, role, subtitle, type: "agent", x: 390, y: 40 + index * 130, width: 220 }));
    const modules = workers.map(([nodeId, , title, role], index) => ({ id: `${nodeId}-output`, code: `T${index + 1}`, title: `${title.replace(" Agent", "")}任务`, subtitle: `${role}负责的可编辑任务板块`, sourceNode: nodeId, sourceRole: role, type: "module", x: 830, y: 40 + index * 130, width: 230 }));
    return {
      id, name, description, width: 1500, height: Math.max(860, workers.length * 130 + 120),
      nodes: [manager, ...agents, ...modules],
      edges: [...workers.map(([nodeId]) => ({ from: manager.id, to: nodeId, kind: "branch" })), ...workers.map(([nodeId]) => ({ from: nodeId, to: `${nodeId}-output`, kind: "output" }))]
    };
  }

  const templates = {
    software: createSoftwareTemplate(),
    image: createMediaTemplate("image", "生图", "从提示词到成图验收的可编辑流程", [
      ["image-prompt", "PT", "提示词 Agent", "产品经理 Agent", "整理主题、主体、构图和限制词"],
      ["image-style", "ST", "视觉风格 Agent", "前端 Agent", "确定风格、配色、镜头和参考方向"],
      ["image-model", "IM", "生图模型 Agent", "技术主管 Agent", "选择模型、尺寸、采样与生成参数"],
      ["image-refine", "RF", "图像精修 Agent", "前端 Agent", "修正细节、构图、文字和一致性"],
      ["image-review", "QA", "成图验收 Agent", "测试 Agent", "检查目标符合度、瑕疵和安全边界"]
    ]),
    video: createMediaTemplate("video", "视频", "从脚本到成片交付的可编辑流程", [
      ["video-script", "SC", "脚本 Agent", "产品经理 Agent", "拆解主题、受众、节奏与叙事结构"],
      ["video-board", "SB", "分镜 Agent", "架构师 Agent", "规划镜头、时长、转场与素材依赖"],
      ["video-visual", "VI", "画面 Agent", "前端 Agent", "生成关键帧、视觉素材与风格规范"],
      ["video-model", "VM", "视频模型 Agent", "技术主管 Agent", "选择视频模型并控制生成参数"],
      ["video-audio", "AU", "音频 Agent", "后端 Agent", "规划配音、音乐、音效与时间轴"],
      ["video-edit", "ED", "剪辑 Agent", "前端 Agent", "组织镜头、字幕、转场和成片结构"],
      ["video-review", "QA", "成片验收 Agent", "测试 Agent", "检查画面、音画同步、瑕疵与安全"]
    ])
  };

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
    return { state: "idle", detail: "当前任务尚未派发到这里" };
  }

  function managerStatus(task) {
    if (!task) return { state: "idle", detail: "等待任务" };
    if (task.error || task.verification?.passed === false) return { state: "failed", detail: "验收未通过，任务已退回" };
    if (task.status === "done") return { state: "done", detail: `已汇总 ${task.runs?.length || 0} 个 Agent 步骤` };
    return { state: task.status === "progress" ? "active" : "queued", detail: task.status === "progress" ? "正在向 Agent 派发任务" : "等待接管并拆解任务" };
  }

  function build(tasks, selectedId, mode = "software") {
    const template = templates[mode] || templates.software;
    const task = selectTask(tasks, selectedId);
    const resolved = [];
    const byId = {};
    for (const node of template.nodes) {
      let status;
      if (node.manager) status = managerStatus(task);
      else if (node.role) status = roleStatus(task, node.role);
      else status = { state: "idle", detail: "等待任务" };
      const next = { ...node, ...status };
      resolved.push(next);
      byId[next.id] = next;
    }
    for (const node of resolved.filter((item) => item.sourceNode)) {
      const source = byId[node.sourceNode];
      node.state = source?.state || "idle";
      node.run = source?.run;
      node.detail = source?.state === "done" ? `${node.title}已有可审计结果` : source?.detail || "等待上游 Agent";
    }
    const edges = template.edges.map((edge) => {
      const source = byId[edge.from];
      const target = byId[edge.to];
      const state = target?.state === "failed" ? "failed" : ["active", "done"].includes(target?.state) && source?.state !== "idle" ? "active" : "idle";
      return { ...edge, state };
    });
    const completed = resolved.filter((node) => node.state === "done").length;
    return {
      mode: template.id, template, task, nodes: resolved, edges,
      summary: {
        completed,
        active: resolved.filter((node) => node.state === "active").length,
        failed: resolved.filter((node) => node.state === "failed").length,
        progress: task ? (task.status === "done" && !task.error ? 100 : Math.round((completed / resolved.length) * 100)) : 0,
        artifacts: task?.artifacts?.length || 0
      }
    };
  }

  function templateList() {
    return Object.values(templates).map(({ id, name, description, nodes, edges }) => ({ id, name, description, nodeCount: nodes.length, edgeCount: edges.length }));
  }

  return Object.freeze({ build, selectTask, templateList, templates });
}));
