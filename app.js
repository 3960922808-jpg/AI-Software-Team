const storageKeys = {
  tasks: "ai-software-team.tasks",
  agents: "ai-software-team.office-agents",
  memory: "ai-software-team.memory",
  knowledge: "ai-software-team.knowledge",
  deployments: "ai-software-team.deployments",
  externalResources: "ai-software-team.external-resources",
  executionSettings: "ai-software-team.execution-settings",
  enabledSkills: "ai-software-team.enabled-skills",
  interfaceMode: "ai-software-team.interface-mode",
  workflowEditor: "ai-software-team.workflow-editor-v1",
  workflowChat: "ai-software-team.workflow-chat-v1",
  memoryGraphLayout: "ai-software-team.memory-graph-layout-v2"
};

const roleAgents = [
  ["PM", "产品经理 Agent", "需求拆解与优先级规划"], ["AR", "架构师 Agent", "系统设计与技术决策"],
  ["TL", "技术主管 Agent", "技术路线与质量把控"], ["SE", "安全专家 Agent", "安全审查与风险控制"],
  ["FE", "前端 Agent", "界面开发与体验实现"], ["BE", "后端 Agent", "服务与业务逻辑实现"],
  ["DB", "数据库 Agent", "数据模型、SQL 与迁移管理"], ["QA", "测试 Agent", "测试设计与质量验证"],
  ["CR", "代码审查 Agent", "缺陷审查与重构建议"], ["DO", "DevOps Agent", "构建、部署与运行保障"]
];
const defaultOfficeAgents = [
  { id: "product", name: "芽芽", role: "产品经理 Agent", sprite: "product", desk: 0 },
  { id: "architect", name: "星眠", role: "架构师 Agent", sprite: "architect", desk: 0 },
  { id: "techlead", name: "墨墨", role: "技术主管 Agent", sprite: "techlead", desk: 1 },
  { id: "security", name: "焰焰", role: "安全专家 Agent", sprite: "security", desk: 1 },
  { id: "frontend", name: "糖糖", role: "前端 Agent", sprite: "frontend", desk: 2 },
  { id: "backend", name: "豆豆", role: "后端 Agent", sprite: "backend", desk: 2 },
  { id: "database", name: "桃桃", role: "数据库 Agent", sprite: "product", desk: 3 },
  { id: "tester", name: "琪琪", role: "测试 Agent", sprite: "tester", desk: 3 },
  { id: "reviewer", name: "审审", role: "代码审查 Agent", sprite: "techlead", desk: 2 },
  { id: "devops", name: "小蓝", role: "DevOps Agent", sprite: "devops", desk: 2 }
];
const deskNames = ["产品与架构", "技术与安全", "前端、后端、审查与交付", "数据与测试"];
const compactRoleNames = { "前端 Agent": "前端", "后端 Agent": "后端", "代码审查 Agent": "审查", "DevOps Agent": "交付" };
const complaints = {
  "产品经理 Agent": ["需求又变啦？让我先喝口云朵茶。", "这个优先级，真的不能再商量一下吗？"],
  "架构师 Agent": ["再画一张图，应该就是最后一张了……", "这个依赖关系，比毛线团还复杂。"],
  "技术主管 Agent": ["代码会写完的，会议能不能少一点？", "让我先把风险清单再看一遍。"],
  "安全专家 Agent": ["又发现一个边界条件，今晚别想早下班了。", "权限不能偷懒，真的不能。"],
  "前端 Agent": ["这个像素到底是谁挪了一格？", "再改一次样式，我的尾巴要打结了。"],
  "后端 Agent": ["接口很稳定，除非需求又悄悄变了。", "数据库说它也需要休息。"],
  "数据库 Agent": ["这张表又长胖了，索引也得跟上。", "迁移脚本要可回滚，别催我。"],
  "测试 Agent": ["我不是在挑错，我是在保护大家。", "这个用例已经跑到第八遍啦。"],
  "代码审查 Agent": ["这段代码能跑，但它还可以更诚实一点。", "命名很重要，我再看一遍。"],
  "DevOps Agent": ["发布窗口又在半夜，呜……", "流水线绿了，我的眼睛也快绿了。"]
};
const skillCatalog = [
  ["CO", "指挥 Agent", [["任务分解", "将目标拆分为可执行任务"], ["Agent 路由", "按能力与容量分派任务"], ["结果汇总", "合并子 Agent 的执行结论"]]],
  ["PM", "产品经理 Agent", [["需求分析", "提炼用户目标与验收条件"], ["PRD 生成", "生成结构化产品需求文档"], ["优先级规划", "基于价值与风险排列任务"]]],
  ["AR", "架构师 Agent", [["架构设计", "制定服务、数据与接口边界"], ["技术选型", "输出可追溯的技术决策"], ["接口契约", "定义模块间数据与调用规范"]]],
  ["TL", "技术主管 Agent", [["代码评审", "检查实现质量与可维护性"], ["实施规划", "把技术方案转成开发计划"], ["风险识别", "发现依赖、复杂度和交付风险"]]],
  ["FE", "前端 Agent", [["界面实现", "构建响应式用户界面"], ["组件设计", "沉淀可复用交互组件"], ["体验验证", "检查可用性与状态反馈"]]],
  ["BE", "后端 Agent", [["API 设计", "实现服务接口和业务规则"], ["数据建模", "设计数据结构与迁移策略"], ["服务集成", "连接外部服务与消息流"]]],
  ["DB", "数据库 Agent", [["数据模型", "设计实体、约束和关系"], ["SQL 优化", "分析查询计划与索引"], ["迁移管理", "编写可回滚的数据库迁移"]]],
  ["QA", "测试 Agent", [["测试设计", "覆盖核心流程与异常路径"], ["自动化测试", "维护可重复执行的测试集"], ["质量报告", "输出缺陷、覆盖率和验收结论"]]],
  ["CR", "代码审查 Agent", [["代码审查", "发现实现缺陷与潜在回归"], ["规范检查", "检查一致性、安全性和可读性"], ["重构建议", "给出低风险的可维护性改进"]]],
  ["SE", "安全专家 Agent", [["威胁建模", "识别资产、边界与攻击路径"], ["依赖审查", "检查组件与供应链风险"], ["安全验收", "验证认证、授权和数据保护"]]],
  ["DO", "DevOps Agent", [["构建流水线", "配置可重复的构建与发布"], ["部署编排", "管理环境与版本交付"], ["运行监控", "建立日志、指标和告警"]]]
];
function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function uiText(value) { return window.AppI18n?.t(value) || value; }
function uiLocale() { return window.AppI18n?.locale() || "zh-CN"; }
let tasks = loadJson(storageKeys.tasks, []);
if (!Array.isArray(tasks)) tasks = [];
let officeAgents = loadJson(storageKeys.agents, defaultOfficeAgents);
let memories = loadJson(storageKeys.memory, []);
let knowledgeDocuments = loadJson(storageKeys.knowledge, []);
let deploymentRecords = loadJson(storageKeys.deployments, []);
let externalResources = loadJson(storageKeys.externalResources, []);
let executionSettings = loadJson(storageKeys.executionSettings, { autoGit: true });
if (!localStorage.getItem("ai-software-team.office-migration-v1")) {
  tasks = tasks.filter((task) => !["t1", "t2", "t3"].includes(task.id));
  memories = memories.filter((item) => item.id !== "m1");
  knowledgeDocuments = knowledgeDocuments.filter((item) => item.id !== "k1");
  localStorage.setItem("ai-software-team.office-migration-v1", "done");
  localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks));
  localStorage.setItem(storageKeys.memory, JSON.stringify(memories));
  localStorage.setItem(storageKeys.knowledge, JSON.stringify(knowledgeDocuments));
}
if (!localStorage.getItem("ai-software-team.office-migration-v2")) {
  for (const agent of defaultOfficeAgents) if (!officeAgents.some((item) => item.id === agent.id)) officeAgents.push(agent);
  localStorage.setItem("ai-software-team.office-migration-v2", "done");
  localStorage.setItem(storageKeys.agents, JSON.stringify(officeAgents));
}
if (!localStorage.getItem("ai-software-team.office-migration-v3")) {
  officeAgents = officeAgents.map((agent) => ["reviewer", "devops"].includes(agent.id) ? { ...agent, desk: 2 } : agent);
  localStorage.setItem("ai-software-team.office-migration-v3", "done");
  localStorage.setItem(storageKeys.agents, JSON.stringify(officeAgents));
}
const savedSkills = loadJson(storageKeys.enabledSkills, null);
let enabledSkills = new Set(Array.isArray(savedSkills) ? savedSkills : skillCatalog.flatMap(([, , skills]) => skills.map(([, description]) => description)));
let eventLog = ["灵灵已进入工作室", "Agent 团队等待新的任务"];
let selectedAgentId = null;
let complaintAgentId = null;
let complaintText = "";
let chatMessages = [];
let workspacePath = null;
let deliveryReport = null;
let lastReleasePath = null;
let modelPoolState = { profiles: [], assignments: {} };
let mediaModelState = { image: { configured: false }, video: { configured: false } };
let sandboxPolicy = null;
let pluginState = [];
let memoryGraphState = { rootPath: "", stats: { nodes: 0, edges: 0 }, nodes: [], edges: [] };
let memoryGraphScene = { positions: new Map(), nodes: [], edges: [], scale: 1, offsetX: 0, offsetY: 0, dragging: null, selectedId: null, frame: 0, initializedRoot: "", activeEdgeTypes: new Set(["contains", "references", "related"]) };
let voiceState = { configured: false, autoSpeak: false, voice: "alloy", speed: 1 };
let voiceRecorder = null;
let voiceRecordingTarget = null;
let activeVoiceAudio = null;
let updateState = { status: "idle", currentVersion: "", latestVersion: "", progress: 0, settings: { autoCheck: true, autoDownload: true, installOnRestart: true } };
let interfaceMode = loadJson(storageKeys.interfaceMode, "studio") === "workflow" ? "workflow" : "studio";
let lastStudioView = "projects";
let workflowScale = 1;
let selectedWorkflowTaskId = null;
let selectedWorkflowNodeId = "commander";
let modeTransitionRunning = false;
let workflowEditorState = loadJson(storageKeys.workflowEditor, { version: 1, activeMode: "software", modes: {} });
if (!workflowEditorState || typeof workflowEditorState !== "object") workflowEditorState = { version: 1, activeMode: "software", modes: {} };
let workflowChatMessages = loadJson(storageKeys.workflowChat, []);
if (!Array.isArray(workflowChatMessages)) workflowChatMessages = [];
let currentWorkflow = null;
let workflowConnectSource = null;
let workflowDragging = null;
let workflowContextNodeId = null;
let workflowSuppressClick = false;
let workflowConnectionPoint = null;
let activeViewName = "projects";
let viewHistory = [];

const modelPoolTargets = [
  ["commander", "CO", "主 Agent", "任务拆解、路由与最终审查"],
  ...roleAgents.map(([code, role, specialty]) => [role, code, role, specialty]),
];

function saveTasks() { localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks)); }
function saveAgents() { localStorage.setItem(storageKeys.agents, JSON.stringify(officeAgents)); }
function saveMemory() { localStorage.setItem(storageKeys.memory, JSON.stringify(memories)); localStorage.setItem(storageKeys.knowledge, JSON.stringify(knowledgeDocuments)); }
function saveDeployments() { localStorage.setItem(storageKeys.deployments, JSON.stringify(deploymentRecords)); }
function saveExternalResources() { localStorage.setItem(storageKeys.externalResources, JSON.stringify(externalResources)); }
function saveExecutionSettings() { localStorage.setItem(storageKeys.executionSettings, JSON.stringify(executionSettings)); }
function saveEnabledSkills() { localStorage.setItem(storageKeys.enabledSkills, JSON.stringify([...enabledSkills])); }
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value ?? ""; return node.innerHTML; }

function getAgentStatus(agent) {
  const assigned = tasks.filter((task) => task.agent === agent.role);
  const running = assigned.find((task) => task.status === "progress");
  const queued = assigned.find((task) => task.status === "todo");
  const completed = assigned.filter((task) => task.status === "done").length;
  if (running) {
    const elapsed = Math.max(0, Date.now() - Number(running.startedAt || Date.now()));
    return { busy: true, progress: Math.min(92, 18 + Math.floor(elapsed / 1800)), task: running.title, startedAt: running.startedAt };
  }
  if (queued) return { busy: false, progress: 8, task: `等待：${queued.title}` };
  return { busy: false, progress: assigned.length ? Math.round((completed / assigned.length) * 100) : 0, task: assigned.length ? `已完成 ${completed}/${assigned.length}` : "当前空闲" };
}

function renderOffice() {
  document.querySelector("#studio-agent-count").textContent = officeAgents.length;
  document.querySelector("#desk-grid").innerHTML = deskNames.map((name, desk) => {
    const pets = officeAgents.filter((agent) => agent.desk === desk).map((agent) => {
      const status = getAgentStatus(agent);
      const complaint = complaintAgentId === agent.id ? `<span class="complaint">${escapeHtml(complaintText)}</span>` : "";
      const roleLabel = compactRoleNames[agent.role] || agent.role.replace(" Agent", "");
      return `<button class="agent-pet ${status.busy ? "busy" : ""}" type="button" data-agent-id="${agent.id}" aria-label="${escapeHtml(agent.name)}，${escapeHtml(agent.role)}"><img src="assets/agents/${agent.sprite}.png" alt="" draggable="false" /><small></small><span>${escapeHtml(agent.name)} · ${escapeHtml(roleLabel)}</span>${complaint}</button>`;
    }).join("");
    return `<section class="desk-station desk-${desk}"><div class="desk-agents">${pets}</div><div class="desk-album"></div><div class="desk-surface"></div><span class="desk-label">${name}</span></section>`;
  }).join("");
}

function generatedTasks() {
  return tasks.filter((task) => task.taskRoot || (Array.isArray(task.artifacts) && task.artifacts.length));
}

function renderSandbox() {
  const select = document.querySelector("#sandbox-task-select");
  if (!select) return;
  const current = select.value;
  const generated = generatedTasks();
  select.innerHTML = generated.length ? generated.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)}</option>`).join("") : '<option value="">暂无已生成工程</option>';
  if (generated.some((task) => task.id === current)) select.value = current;
  document.querySelector("#auto-git-toggle").checked = executionSettings.autoGit !== false;
  const runEntries = tasks.flatMap((task) => (task.runs || []).map((run) => ({ task, run })));
  const checkCount = runEntries.reduce((total, item) => total + (item.run.verification?.checks?.length || 0), 0);
  document.querySelector("#sandbox-run-count").textContent = `${checkCount} 次真实检查`;
  document.querySelector("#sandbox-run-list").innerHTML = runEntries.length ? runEntries.slice(0, 30).map(({ task, run }) => {
    const verification = run.verification || { checks: [], passed: true, skipped: true };
    const repairs = run.repairAttempts?.length || 0;
    const status = verification.skipped ? "无需执行" : verification.passed ? "通过" : "失败";
    const details = verification.checks.length ? verification.checks.map((check) => `<li><span class="sandbox-check-state ${check.status === "passed" ? "passed" : "failed"}">${check.status === "passed" ? "✓" : "!"}</span><div><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.command || "受控检查")} · ${Math.max(0, check.durationMs || 0)} ms</small>${check.stderr ? `<pre>${escapeHtml(check.stderr.slice(-1800))}</pre>` : ""}</div></li>`).join("") : '<li class="sandbox-check-empty">该阶段仅交付文档或分析结果</li>';
    return `<article class="sandbox-run-card"><header><div><span>${escapeHtml(task.title)}</span><strong>${escapeHtml(run.delegateTo)} · ${escapeHtml(run.title)}</strong></div><b class="sandbox-result ${verification.passed ? "passed" : "failed"}">${status}</b></header><div class="sandbox-run-meta"><span>${repairs} 轮修复</span><span>${run.artifacts?.length || 0} 个文件</span><span>${escapeHtml(run.model || "默认模型")}</span></div><ol>${details}</ol></article>`;
  }).join("") : '<p class="empty-state">Agent 生成项目后，真实检查、错误和修复记录会显示在这里</p>';
}

function applySandboxPolicy(policy) {
  sandboxPolicy = policy;
  if (!policy) return;
  document.querySelector("#sandbox-mode").textContent = policy.enabled ? "受控运行" : "未启用";
  document.querySelector("#sandbox-shell").textContent = policy.shell ? "已启用" : "已禁用";
  document.querySelector("#sandbox-timeout").textContent = `${Math.round(policy.timeoutMs / 1000)} 秒`;
  document.querySelector("#sandbox-repairs").textContent = `最多 ${policy.repairAttempts} 轮`;
  document.querySelector("#sandbox-boundary").textContent = policy.workspaceBoundary;
  document.querySelector("#sandbox-commands").textContent = policy.allowedCommands.join("、");
  document.querySelector("#sandbox-output-limit").textContent = `${Math.round(policy.maxOutputBytes / 1024)} KB`;
}

async function refreshSandboxPolicy() {
  const state = document.querySelector("#sandbox-action-state");
  try {
    if (!window.desktop?.getSandboxStatus) throw new Error("请使用 Electron 桌面版");
    applySandboxPolicy(await window.desktop.getSandboxStatus());
    renderWorkflow();
    state.textContent = "执行沙箱在线，系统 Shell 已禁用。";
    state.className = "success";
  } catch (error) {
    state.textContent = `沙箱状态读取失败：${error.message}`;
    state.className = "error";
  }
}

function workflowStateLabel(state) {
  return { idle: "未进入", queued: "等待", active: "执行中", done: "已完成", failed: "已阻断" }[state] || "未知";
}
if (!localStorage.getItem("ai-software-team.office-migration-v4-user-tasks")) {
  const builtInDemoTitles = new Set(["案例：生成响应式博客网站", "案例：生成 Windows 桌面工具", "案例：生成任务管理 API 服务", "案例：生成任务管理 API"]);
  tasks = tasks.filter((task) => !task.demoType && !builtInDemoTitles.has(task.title));
  localStorage.setItem("ai-software-team.office-migration-v4-user-tasks", "done");
  localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks));
}

function getWorkflowModeState(mode = workflowEditorState.activeMode || "software") {
  workflowEditorState.modes ||= {};
  workflowEditorState.modes[mode] ||= { positions: {}, nodeOverrides: {}, customNodes: [], customEdges: [], removedEdges: [], deletedNodes: [] };
  const state = workflowEditorState.modes[mode];
  state.positions ||= {};
  state.nodeOverrides ||= {};
  state.customNodes ||= [];
  state.customEdges ||= [];
  state.removedEdges ||= [];
  state.deletedNodes ||= [];
  return state;
}

function saveWorkflowEditor() { localStorage.setItem(storageKeys.workflowEditor, JSON.stringify(workflowEditorState)); }
function saveWorkflowChat() { localStorage.setItem(storageKeys.workflowChat, JSON.stringify(workflowChatMessages.slice(-80))); }

function workflowNodeTarget(node) {
  if (node.manager || node.type === "manager") return "commander";
  return node.role || node.sourceRole || "";
}

function stateFromProgress(progress, fallback = "idle") {
  if (progress >= 100) return "done";
  if (progress > 0) return "active";
  return fallback;
}

function buildEditableWorkflow() {
  const mode = workflowEditorState.activeMode || "software";
  const base = window.WorkflowState.build(tasks, selectedWorkflowTaskId, mode);
  const editor = getWorkflowModeState(mode);
  const deleted = new Set(editor.deletedNodes);
  const nodes = base.nodes.filter((node) => !deleted.has(node.id)).map((node) => {
    const position = editor.positions[node.id] || {};
    const override = editor.nodeOverrides[node.id] || {};
    const progress = Number.isFinite(Number(override.progress)) ? Number(override.progress) : ({ done: 100, active: 55, queued: 10, failed: 72 }[node.state] || 0);
    return { ...node, ...override, ...position, progress, state: override.progress === undefined ? node.state : stateFromProgress(progress, node.state) };
  });
  for (const custom of editor.customNodes) {
    if (deleted.has(custom.id)) continue;
    const position = editor.positions[custom.id] || {};
    const override = editor.nodeOverrides[custom.id] || {};
    const progress = Number(override.progress ?? custom.progress ?? 0);
    nodes.push({ ...custom, ...override, ...position, progress, state: stateFromProgress(progress), custom: true, width: Number(custom.width) || (custom.type === "manager" ? 240 : 220) });
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeId = (edge) => edge.id || `${edge.from}__${edge.to}`;
  const removed = new Set(editor.removedEdges);
  const edges = [...base.edges, ...editor.customEdges.map((edge) => ({ ...edge, custom: true, state: edge.state || "idle", kind: edge.kind || "branch" }))]
    .map((edge) => ({ ...edge, id: edgeId(edge) }))
    .filter((edge) => !removed.has(edge.id) && nodeIds.has(edge.from) && nodeIds.has(edge.to));
  const completed = nodes.filter((node) => node.state === "done").length;
  const progress = base.task?.status === "done" && !base.task?.error ? 100 : nodes.length ? Math.round(nodes.reduce((sum, node) => sum + node.progress, 0) / nodes.length) : 0;
  return { ...base, mode, nodes, edges, summary: { ...base.summary, completed, progress } };
}

function workflowNodeSkills(node) {
  const skillOwner = node.role || node.sourceRole;
  if (skillOwner) {
    const owner = skillCatalog.find(([, agent]) => agent === skillOwner);
    return (owner?.[2] || []).filter(([, description]) => enabledSkills.has(description)).map(([name]) => name);
  }
  if (node.id === "request") return ["目标解析", "约束识别", "验收提取"];
  if (node.id === "commander") return skillCatalog.find(([, agent]) => agent === "指挥 Agent")?.[2].filter(([, description]) => enabledSkills.has(description)).map(([name]) => name) || [];
  return [];
}

function workflowPath(edge, byId) {
  const source = byId[edge.from];
  const target = byId[edge.to];
  if (!source || !target) return "";
  const sourceWidth = source.width || 210;
  const targetWidth = target.width || 210;
  if (edge.kind === "input") {
    const x1 = source.x + sourceWidth / 2;
    const y1 = source.y + 76;
    const x2 = target.x + targetWidth / 2;
    const y2 = target.y;
    const middle = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
  }
  if (edge.kind === "branch" || edge.kind === "output") {
    const leftToRight = target.x > source.x;
    const x1 = source.x + (leftToRight ? sourceWidth : 0);
    const y1 = source.y + 38;
    const x2 = target.x + (leftToRight ? 0 : targetWidth);
    const y2 = target.y + 38;
    const middle = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`;
  }
  return "";
}

function modelProfileOptions(selectedId = "") {
  return `<option value="">跟随主模型</option>${(modelPoolState.profiles || []).map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === selectedId ? "selected" : ""}>${escapeHtml(profile.name)} · ${escapeHtml(profile.model)}</option>`).join("")}`;
}

function renderWorkflowInspector(workflow) {
  const node = workflow.nodes.find((item) => item.id === selectedWorkflowNodeId) || workflow.nodes.find((item) => item.manager || item.type === "manager") || workflow.nodes[0];
  if (!node) {
    document.querySelector("#workflow-inspector-title").textContent = "选择流程节点";
    return;
  }
  selectedWorkflowNodeId = node.id;
  document.querySelector("#workflow-inspector-title").textContent = node.title;
  document.querySelector("#workflow-inspector-state").textContent = workflowStateLabel(node.state);
  document.querySelector("#workflow-inspector-detail").textContent = node.detail || node.subtitle;
  document.querySelector("#workflow-node-progress").value = node.progress || 0;
  document.querySelector("#workflow-node-progress-label").textContent = `${node.progress || 0}%`;
  const skills = workflowNodeSkills(node);
  document.querySelector("#workflow-skill-list").innerHTML = skills.length ? skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("") : "<span>该节点没有启用技能</span>";
  const task = workflow.task;
  const routedRole = workflowNodeTarget(node);
  const editorOverride = getWorkflowModeState().nodeOverrides[node.id] || {};
  const profileId = routedRole ? modelPoolState.assignments?.[routedRole] : editorOverride.modelProfile || null;
  const profile = modelPoolState.profiles?.find((item) => item.id === profileId);
  document.querySelector("#workflow-node-model").innerHTML = modelProfileOptions(profileId || "");
  const run = node.run;
  const evidence = [
    ["任务", task?.title || "尚未选择任务"],
    ["节点状态", workflowStateLabel(node.state)],
    ["模型路由", profile ? `${profile.name} · ${profile.model}` : "跟随主模型"],
    ["执行步骤", run?.title || (node.role ? "暂无执行记录" : node.detail)],
    ["真实检查", run?.verification ? `${run.verification.checks?.length || 0} 项 · ${run.verification.passed ? "通过" : "未通过"}` : "暂无"],
    ["生成产物", `${run?.artifacts?.length || 0} 个文件`]
  ];
  document.querySelector("#workflow-evidence").innerHTML = evidence.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
  const relatedEdges = workflow.edges.filter((edge) => edge.from === node.id || edge.to === node.id);
  const byId = Object.fromEntries(workflow.nodes.map((item) => [item.id, item]));
  document.querySelector("#workflow-edge-list").innerHTML = relatedEdges.length ? relatedEdges.map((edge) => `<div><span>${escapeHtml(byId[edge.from]?.title || edge.from)} → ${escapeHtml(byId[edge.to]?.title || edge.to)}</span><button type="button" data-workflow-edge-delete="${escapeHtml(edge.id)}" title="删除连线" aria-label="删除连线">×</button></div>`).join("") : "<span>该节点暂无连线</span>";
}

function renderWorkflow() {
  if (!window.WorkflowState) return;
  const workflow = buildEditableWorkflow();
  currentWorkflow = workflow;
  if (workflow.task) selectedWorkflowTaskId = workflow.task.id;
  const select = document.querySelector("#workflow-task-select");
  const previous = selectedWorkflowTaskId;
  select.innerHTML = tasks.length ? tasks.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)} · ${task.status === "done" ? "已完成" : task.status === "progress" ? "执行中" : "等待"}</option>`).join("") : '<option value="">等待创建任务</option>';
  if (tasks.some((task) => task.id === previous)) select.value = previous;
  const state = workflow.summary.failed ? "检查阻断" : workflow.summary.active ? "团队执行中" : workflow.task?.status === "done" ? "闭环完成" : workflow.task ? "等待执行" : "等待任务";
  document.querySelector("#workflow-status").textContent = state;
  document.querySelector("#workflow-completed").textContent = `${workflow.summary.completed}/${workflow.nodes.length}`;
  document.querySelector("#workflow-artifacts").textContent = workflow.summary.artifacts;
  document.querySelector("#workflow-progress").textContent = `${workflow.summary.progress}%`;
  document.querySelector("#workflow-run-button").disabled = !workflow.task || workflow.task.status === "progress";
  document.querySelector("#workflow-run-button").textContent = workflow.task?.status === "done" ? "重新执行任务" : workflow.task?.status === "progress" ? "团队执行中" : "运行当前任务";
  document.querySelector("#workflow-template-label").textContent = workflow.template.name;
  document.querySelector("#workflow-canvas").style.width = `${workflow.template.width}px`;
  document.querySelector("#workflow-canvas").style.height = `${workflow.template.height}px`;
  const linkLayer = document.querySelector("#workflow-links");
  linkLayer.setAttribute("width", workflow.template.width);
  linkLayer.setAttribute("height", workflow.template.height);
  linkLayer.setAttribute("viewBox", `0 0 ${workflow.template.width} ${workflow.template.height}`);
  const byId = Object.fromEntries(workflow.nodes.map((node) => [node.id, node]));
  linkLayer.innerHTML = `<defs><marker id="workflow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"></path></marker></defs>${workflow.edges.map((edge) => `<path class="workflow-link ${edge.state} ${edge.custom ? "custom" : ""}" marker-end="url(#workflow-arrow)" data-workflow-edge="${escapeHtml(edge.id)}" d="${workflowPath(edge, byId)}"></path>`).join("")}<path id="workflow-link-preview" class="workflow-link preview" marker-end="url(#workflow-arrow)"></path>`;
  const nodeLayer = document.querySelector("#workflow-nodes");
  nodeLayer.innerHTML = workflow.nodes.map((node) => `<button class="workflow-node ${node.type} ${node.state} ${node.id === selectedWorkflowNodeId ? "selected" : ""}" type="button" data-workflow-node="${escapeHtml(node.id)}" aria-label="${escapeHtml(node.title)}，${workflowStateLabel(node.state)}"><span class="workflow-node-code">${escapeHtml(node.code || "ND")}</span><span class="workflow-node-copy"><strong>${escapeHtml(node.title)}</strong><small>${escapeHtml(node.detail || node.subtitle || "自定义节点")}</small><em><i></i></em></span><i class="workflow-node-state"></i></button>`).join("");
  nodeLayer.querySelectorAll("[data-workflow-node]").forEach((element) => {
    const node = byId[element.dataset.workflowNode];
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    element.style.width = `${node.width || 220}px`;
    element.querySelector("em i").style.width = `${Math.max(0, Math.min(100, node.progress || 0))}%`;
  });
  renderWorkflowInspector(workflow);
}

function setWorkflowScale(nextScale) {
  workflowScale = Math.min(1.2, Math.max(.7, Math.round(nextScale * 10) / 10));
  const canvas = document.querySelector("#workflow-canvas");
  canvas.style.transform = `scale(${workflowScale})`;
  document.querySelector("#workflow-scale-label").textContent = `${Math.round(workflowScale * 100)}%`;
}

function centerWorkflowCanvas() {
  const viewport = document.querySelector("#workflow-viewport");
  const canvas = document.querySelector("#workflow-canvas");
  const left = Math.max(0, (canvas.offsetWidth * workflowScale - viewport.clientWidth) / 2);
  const manager = currentWorkflow?.nodes.find((node) => node.manager || node.type === "manager");
  const top = Math.max(0, ((manager?.y || 0) - viewport.clientHeight / (2 * workflowScale)) * workflowScale);
  viewport.scrollTo({ left: Math.min(left, 120), top, behavior: "smooth" });
}

function updateWorkflowNodeProgress(nodeId, value) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const editor = getWorkflowModeState();
  editor.nodeOverrides[nodeId] = { ...(editor.nodeOverrides[nodeId] || {}), progress };
  saveWorkflowEditor();
  renderWorkflow();
}

function openWorkflowNodeDialog(node = null) {
  const form = document.querySelector("#workflow-node-form");
  form.reset();
  form.id.value = node?.id || "";
  form.title.value = node?.title || "";
  form.subtitle.value = node?.subtitle || node?.detail || "";
  form.type.value = node?.type || "module";
  form.code.value = node?.code || "";
  form.role.value = node?.role || node?.sourceRole || "";
  form.progress.value = node?.progress || 0;
  const target = node ? workflowNodeTarget(node) : "";
  const override = node ? getWorkflowModeState().nodeOverrides[node.id] || {} : {};
  const profileId = target ? modelPoolState.assignments?.[target] : override.modelProfile || "";
  form.modelProfile.innerHTML = modelProfileOptions(profileId);
  document.querySelector("#workflow-dialog-progress-label").textContent = `${form.progress.value}%`;
  document.querySelector("#workflow-node-dialog-title").textContent = node ? "编辑节点" : "添加节点";
  form.type.disabled = Boolean(node && !node.custom);
  document.querySelector("#workflow-node-dialog").showModal();
}

function removeWorkflowEdge(edgeId) {
  const editor = getWorkflowModeState();
  const customIndex = editor.customEdges.findIndex((edge) => (edge.id || `${edge.from}__${edge.to}`) === edgeId);
  if (customIndex >= 0) editor.customEdges.splice(customIndex, 1);
  else if (!editor.removedEdges.includes(edgeId)) editor.removedEdges.push(edgeId);
  saveWorkflowEditor();
  renderWorkflow();
}

function deleteWorkflowNode(nodeId) {
  const node = currentWorkflow?.nodes.find((item) => item.id === nodeId);
  if (!node || node.manager || node.type === "manager") return;
  const editor = getWorkflowModeState();
  if (node.custom) editor.customNodes = editor.customNodes.filter((item) => item.id !== nodeId);
  else if (!editor.deletedNodes.includes(nodeId)) editor.deletedNodes.push(nodeId);
  editor.customEdges = editor.customEdges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
  delete editor.positions[nodeId];
  delete editor.nodeOverrides[nodeId];
  selectedWorkflowNodeId = currentWorkflow.nodes.find((item) => item.manager)?.id || null;
  saveWorkflowEditor();
  renderWorkflow();
}

function startWorkflowConnection(nodeId) {
  workflowConnectSource = nodeId;
  const node = currentWorkflow?.nodes.find((item) => item.id === nodeId);
  workflowConnectionPoint = node ? { x: node.x + (node.width || 220) + 80, y: node.y + 38 } : null;
  document.querySelector("#workflow-connect").classList.add("active");
  document.querySelector("#workflow-canvas").classList.add("connecting");
  document.querySelectorAll("[data-workflow-node]").forEach((element) => element.classList.toggle("connection-source", element.dataset.workflowNode === nodeId));
  document.querySelector("#workflow-canvas-hint").textContent = `已选择“${node?.title || nodeId}”，点击目标节点完成连线`;
  updateWorkflowConnectionPreview();
}

function cancelWorkflowConnection() {
  workflowConnectSource = null;
  workflowConnectionPoint = null;
  document.querySelector("#workflow-connect").classList.remove("active");
  document.querySelector("#workflow-canvas").classList.remove("connecting");
  document.querySelectorAll("[data-workflow-node]").forEach((element) => element.classList.remove("connection-source"));
  document.querySelector("#workflow-canvas-hint").textContent = "拖动节点调整布局 · 右键编辑 · 可自定义连线";
  document.querySelector("#workflow-link-preview")?.removeAttribute("d");
}

function updateWorkflowConnectionPreview(event = null) {
  if (event) {
    const canvas = document.querySelector("#workflow-canvas");
    const rect = canvas.getBoundingClientRect();
    workflowConnectionPoint = { x: Math.max(0, (event.clientX - rect.left) / workflowScale), y: Math.max(0, (event.clientY - rect.top) / workflowScale) };
  }
  const preview = document.querySelector("#workflow-link-preview");
  const source = currentWorkflow?.nodes.find((node) => node.id === workflowConnectSource);
  if (!preview || !source || !workflowConnectionPoint) return;
  const x1 = source.x + (source.width || 220);
  const y1 = source.y + 38;
  const x2 = workflowConnectionPoint.x;
  const y2 = workflowConnectionPoint.y;
  const middle = x1 + Math.max(45, (x2 - x1) / 2);
  preview.setAttribute("d", `M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`);
}

function finishWorkflowConnection(targetId) {
  if (!workflowConnectSource) return false;
  if (workflowConnectSource !== targetId) {
    const editor = getWorkflowModeState();
    const id = `custom-${crypto.randomUUID()}`;
    if (!currentWorkflow.edges.some((edge) => edge.from === workflowConnectSource && edge.to === targetId)) editor.customEdges.push({ id, from: workflowConnectSource, to: targetId, kind: "branch" });
    saveWorkflowEditor();
  }
  cancelWorkflowConnection();
  renderWorkflow();
  return true;
}

function workflowMentionCatalog() {
  const catalog = [{ label: "灵灵", detail: "项目经理 · 团队总控", target: "commander" }, { label: "项目经理", detail: "拆解并调度完整团队", target: "commander" }];
  for (const [, role] of roleAgents) catalog.push({ label: role, detail: "专业 Agent", target: role });
  for (const agent of officeAgents) catalog.push({ label: agent.name, detail: agent.role, target: agent.role });
  return catalog.filter((item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index);
}

function workflowSkillCatalog() {
  const builtIn = skillCatalog.flatMap(([, agent, skills]) => skills.filter(([, description]) => enabledSkills.has(description)).map(([name]) => ({ label: name, detail: agent })));
  const plugins = pluginState.filter((plugin) => plugin.enabled).flatMap((plugin) => (plugin.skills || []).map((name) => ({ label: name, detail: plugin.name })));
  return [...builtIn, ...plugins].filter((item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index);
}

function parseWorkflowChatCommand(content) {
  const mentions = workflowMentionCatalog().sort((a, b) => b.label.length - a.label.length);
  const mention = mentions.find((item) => content.includes(`@${item.label}`));
  const invokedSkills = workflowSkillCatalog().filter((item) => content.includes(`/${item.label}`)).map((item) => item.label);
  return { targetAgent: mention?.target || "commander", targetLabel: mention?.label || "灵灵", invokedSkills };
}

function renderChatCandidates() {
  const input = document.querySelector("#chat-input");
  const popup = document.querySelector("#chat-candidates");
  const beforeCursor = input.value.slice(0, input.selectionStart);
  const token = beforeCursor.match(/(^|\s)([@/])([^\s@/]*)$/);
  if (!token) { popup.hidden = true; return; }
  const isMention = token[2] === "@";
  const query = token[3].toLowerCase();
  const items = (isMention ? workflowMentionCatalog() : workflowSkillCatalog()).filter((item) => item.label.toLowerCase().includes(query)).slice(0, 8);
  popup.innerHTML = items.map((item) => `<button type="button" data-chat-token="${isMention ? "@" : "/"}${escapeHtml(item.label)}"><b>${isMention ? "@" : "/"}${escapeHtml(item.label)}</b><small>${escapeHtml(item.detail)}</small></button>`).join("");
  popup.hidden = !items.length;
}

function renderWorkflowChat() {
  const container = document.querySelector("#workflow-chat-messages");
  if (!container) return;
  container.innerHTML = `<article class="assistant">使用 @ 指定经理或 Agent，使用 / 调用 Skill。</article>${workflowChatMessages.map((message, index) => `<article class="${message.role} ${message.pending ? "pending" : ""}"><small>${escapeHtml(message.label || (message.role === "user" ? "你" : "灵灵"))}</small><div>${formatChatContent(message.content)}</div>${message.role === "assistant" && !message.pending ? chatSpeakButton("workflow", index) : ""}</article>`).join("")}`;
  container.scrollTop = container.scrollHeight;
}

function renderWorkflowChatCandidates() {
  const input = document.querySelector("#workflow-chat-input");
  const popup = document.querySelector("#workflow-chat-candidates");
  const beforeCursor = input.value.slice(0, input.selectionStart);
  const token = beforeCursor.match(/(^|\s)([@/])([^\s@/]*)$/);
  if (!token) { popup.hidden = true; return; }
  const isMention = token[2] === "@";
  const query = token[3].toLowerCase();
  const items = (isMention ? workflowMentionCatalog() : workflowSkillCatalog()).filter((item) => item.label.toLowerCase().includes(query)).slice(0, 8);
  popup.innerHTML = items.map((item) => `<button type="button" data-chat-token="${isMention ? "@" : "/"}${escapeHtml(item.label)}"><b>${isMention ? "@" : "/"}${escapeHtml(item.label)}</b><small>${escapeHtml(item.detail)}</small></button>`).join("");
  popup.hidden = !items.length;
}

async function sendWorkflowChat(content) {
  const command = parseWorkflowChatCommand(content);
  workflowChatMessages.push({ role: "user", content, label: "你" }, { role: "assistant", content: "正在处理…", label: command.targetLabel, pending: true });
  saveWorkflowChat();
  renderWorkflowChat();
  document.querySelector("#workflow-chat-target").textContent = `${command.targetLabel} · ${command.targetAgent === "commander" ? "团队总控" : "单独执行"}`;
  try {
    if (!window.desktop?.chat) throw new Error("请先配置模型 API");
    const result = await window.desktop.chat({ messages: workflowChatMessages.filter((message) => !message.pending).map(({ role, content: text }) => ({ role, content: text })), context: getTeamContext(), targetAgent: command.targetAgent, invokedSkills: command.invokedSkills });
    workflowChatMessages[workflowChatMessages.length - 1] = { role: "assistant", content: result.content, label: command.targetLabel };
    maybeAutoSpeak(result.content);
  } catch (error) {
    workflowChatMessages[workflowChatMessages.length - 1] = { role: "assistant", content: `执行失败：${error.message}`, label: command.targetLabel };
  }
  saveWorkflowChat();
  renderWorkflowChat();
}

function applyInterfaceMode(mode) {
  interfaceMode = mode === "workflow" ? "workflow" : "studio";
  localStorage.setItem(storageKeys.interfaceMode, JSON.stringify(interfaceMode));
  document.body.dataset.interfaceMode = interfaceMode;
  document.querySelectorAll("[data-interface-mode]").forEach((button) => button.classList.toggle("active", button.dataset.interfaceMode === interfaceMode));
  if (interfaceMode === "workflow") {
    activateView("workflow");
    renderWorkflow();
    requestAnimationFrame(centerWorkflowCanvas);
  } else activateView(lastStudioView === "workflow" ? "projects" : lastStudioView);
}

function animateModeProgress(from, to, duration) {
  return new Promise((resolve) => {
    const started = performance.now();
    const step = (now) => {
      const ratio = Math.min(1, (now - started) / duration);
      const value = Math.round(from + (to - from) * (1 - Math.pow(1 - ratio, 3)));
      document.querySelector("#mode-progress-fill").style.width = `${value}%`;
      document.querySelector("#mode-progress-label").textContent = `${value}%`;
      if (ratio < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

async function switchInterfaceMode(targetMode) {
  if (modeTransitionRunning || targetMode === interfaceMode) return;
  modeTransitionRunning = true;
  const overlay = document.querySelector("#mode-transition");
  const targetName = targetMode === "workflow" ? "可视化工作流" : "Agent 工作室";
  overlay.hidden = false;
  overlay.classList.remove("complete");
  document.body.classList.add("mode-switching");
  document.querySelector("#mode-transition-title").textContent = `正在切换到${targetName}`;
  document.querySelector("#mode-progress-fill").style.width = "0%";
  document.querySelector("#mode-progress-label").textContent = "0%";
  const stages = [[18, "正在保存当前工作现场"], [42, "正在同步任务与记忆"], [68, "正在装载智能体和专属技能"], [88, "正在生成节点与依赖连线"], [100, `${targetName}已就绪`]];
  let current = 0;
  for (const [progress, message] of stages) {
    document.querySelector("#mode-transition-message").textContent = message;
    await animateModeProgress(current, progress, progress === 100 ? 260 : 320);
    current = progress;
    if (progress === 88) applyInterfaceMode(targetMode);
  }
  overlay.classList.add("complete");
  await new Promise((resolve) => setTimeout(resolve, 430));
  overlay.hidden = true;
  overlay.classList.remove("complete");
  document.body.classList.remove("mode-switching");
  modeTransitionRunning = false;
}

function render() {
  const todo = tasks.filter((task) => task.status === "todo").length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const done = tasks.filter((task) => task.status === "done").length;
  document.querySelector("#metric-todo").textContent = todo;
  document.querySelector("#metric-progress").textContent = progress;
  document.querySelector("#metric-done").textContent = done;
  document.querySelector("#metric-high").textContent = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  document.querySelector("#task-total").textContent = tasks.length;
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  document.querySelector("#project-progress").value = completion;
  document.querySelector("#project-progress-label").textContent = `${completion}%`;
  renderOffice(); renderOrchestrator(); renderSandbox(); renderMemory(); renderDeploymentHistory(); renderExternalResources(); renderAudit(); renderWorkflow();
}

function buildAuditRecords() {
  const taskRecords = tasks.map((task) => {
    const status = task.error ? "失败" : task.status === "done" ? "成功" : task.status === "progress" ? "执行中" : "等待";
    return {
      id: task.id,
      kind: "任务",
      status,
      title: task.title,
      agent: task.agent || "未分派",
      priority: task.priority || "medium",
      timestamp: task.completedAt || (task.startedAt ? new Date(task.startedAt).toISOString() : task.createdAt || null),
      stepCount: Array.isArray(task.runs) ? task.runs.length : 0,
      artifactCount: Array.isArray(task.artifacts) ? task.artifacts.length : 0,
      summary: task.error || task.result || task.description || "暂无执行结果",
      steps: (task.runs || []).map((run) => ({ title: run.title, agent: run.delegateTo, summary: run.summary, checks: run.checks || [], artifacts: (run.artifacts || []).map((artifact) => artifact.relativePath) })),
    };
  });
  const deployments = deploymentRecords.map((record) => ({
    id: record.id,
    kind: "部署",
    status: record.status === "成功" || record.status === "候选已创建" ? "成功" : record.status === "失败" || record.status === "已回滚" ? "失败" : "等待",
    title: `${record.environment} · ${record.version || "未关联版本"}`,
    agent: "DevOps Agent",
    timestamp: record.createdAt || null,
    stepCount: 0,
    artifactCount: 0,
    summary: record.note || record.status,
    url: record.url || "",
    steps: [],
  }));
  return [...taskRecords, ...deployments].sort((left, right) => String(right.timestamp || "").localeCompare(String(left.timestamp || "")));
}

function getFilteredAuditRecords() {
  const kind = document.querySelector("#audit-kind-filter")?.value || "all";
  const status = document.querySelector("#audit-status-filter")?.value || "all";
  const search = (document.querySelector("#audit-search")?.value || "").trim().toLowerCase();
  return buildAuditRecords().filter((record) => (kind === "all" || record.kind === kind) && (status === "all" || record.status === status) && (!search || `${record.title} ${record.agent} ${record.summary}`.toLowerCase().includes(search)));
}

function renderAudit() {
  const list = document.querySelector("#audit-list");
  if (!list) return;
  const all = buildAuditRecords();
  const completed = all.filter((record) => record.kind === "任务" && ["成功", "失败"].includes(record.status));
  const successful = completed.filter((record) => record.status === "成功").length;
  const filtered = getFilteredAuditRecords();
  document.querySelector("#audit-run-count").textContent = all.filter((record) => record.kind === "任务").length;
  document.querySelector("#audit-success-rate").textContent = completed.length ? `${Math.round((successful / completed.length) * 100)}%` : "0%";
  document.querySelector("#audit-step-count").textContent = all.reduce((total, record) => total + record.stepCount, 0);
  document.querySelector("#audit-artifact-count").textContent = all.reduce((total, record) => total + record.artifactCount, 0);
  document.querySelector("#audit-result-count").textContent = `${filtered.length} 条记录`;
  list.innerHTML = filtered.length ? filtered.map((record) => `<details class="audit-record"><summary><span class="audit-kind">${escapeHtml(record.kind)}</span><div><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.agent)} · ${record.timestamp ? new Date(record.timestamp).toLocaleString(uiLocale()) : "尚未开始"}</small></div><span class="audit-record-meta">${record.stepCount} 步 · ${record.artifactCount} 个产物</span><b class="audit-status ${record.status === "成功" ? "success" : record.status === "失败" ? "failure" : "pending"}">${record.status}</b></summary><div class="audit-record-body"><p>${escapeHtml(record.summary)}</p>${record.steps.length ? `<ol>${record.steps.map((step) => `<li><strong>${escapeHtml(step.agent)} · ${escapeHtml(step.title)}</strong><p>${escapeHtml(step.summary || "未返回摘要")}</p><small>${step.artifacts.length ? `产物：${step.artifacts.map(escapeHtml).join("、")}` : "无文件产物"}</small></li>`).join("")}</ol>` : ""}${record.url ? `<a href="${escapeHtml(record.url)}" target="_blank" rel="noreferrer">${escapeHtml(record.url)}</a>` : ""}</div></details>`).join("") : '<p class="empty-state">没有符合筛选条件的运行记录</p>';
}

function renderExternalResources() {
  const repositories = externalResources.filter((resource) => resource.type === "repository");
  const documents = externalResources.filter((resource) => resource.type === "document");
  const characters = externalResources.reduce((total, resource) => total + JSON.stringify(resource.data || {}).length, 0);
  document.querySelector("#repository-resource-count").textContent = repositories.length;
  document.querySelector("#document-resource-count").textContent = documents.length;
  document.querySelector("#resource-character-count").textContent = characters.toLocaleString(uiLocale());
  document.querySelector("#resource-updated-at").textContent = externalResources.length ? `更新于 ${new Date(externalResources[0].createdAt).toLocaleString(uiLocale())}` : "暂无资源";
  document.querySelector("#external-resources").innerHTML = externalResources.length ? externalResources.map((resource) => {
    if (resource.type === "repository") {
      const data = resource.data;
      return `<article class="external-resource"><header><span class="resource-type">代码仓库</span><button type="button" data-delete-resource="${resource.id}" title="移除资源">×</button></header><h3>${escapeHtml(data.name)}</h3><p>${escapeHtml(data.description || "未填写仓库说明")}</p><dl><div><dt>读取分支</dt><dd>${escapeHtml(data.selectedBranch || data.defaultBranch)}</dd></div><div><dt>主要语言</dt><dd>${escapeHtml(data.language)}</dd></div><div><dt>文件路径</dt><dd>${data.files.length}</dd></div></dl><button class="resource-open-button" type="button" data-open-resource="${escapeHtml(data.url)}">打开 GitHub 仓库</button><small>${data.truncated ? "文件列表已截断" : "文件列表完整"}</small></article>`;
    }
    const data = resource.data;
    return `<article class="external-resource"><header><span class="resource-type">网页资料</span><button type="button" data-delete-resource="${resource.id}" title="移除资源">×</button></header><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.content.slice(0, 220))}${data.content.length > 220 ? "…" : ""}</p><button class="resource-open-button" type="button" data-open-resource="${escapeHtml(data.url)}">打开原始资料</button><small>${data.content.length.toLocaleString(uiLocale())} 个字符</small></article>`;
  }).join("") : '<p class="empty-state">连接代码仓库或读取公开资料后，资源会显示在这里</p>';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} 字节`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} 千字节`;
  return `${(bytes / 1024 / 1024).toFixed(1)} 兆字节`;
}

function renderDeliveryReport(report) {
  deliveryReport = report;
  document.querySelector("#delivery-project").textContent = report.project.name;
  document.querySelector("#delivery-project-type").textContent = report.project.type;
  document.querySelector("#delivery-artifact-count").textContent = report.artifacts.length;
  document.querySelector("#delivery-readiness").textContent = report.ready ? "可创建版本" : "需要确认";
  document.querySelector("#delivery-readiness").classList.toggle("ready", report.ready);
  const passed = report.checks.filter((check) => check.status === "pass").length;
  document.querySelector("#delivery-check-count").textContent = `${passed}/${report.checks.length}`;
  document.querySelector("#delivery-checks").innerHTML = report.checks.map((check) => `<article class="delivery-check ${check.status}"><span>${check.status === "pass" ? "✓" : "!"}</span><div><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></div></article>`).join("");
  document.querySelector("#delivery-scan-time").textContent = `检查于 ${new Date(report.scannedAt).toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit" })}`;
  document.querySelector("#delivery-artifacts").innerHTML = report.artifacts.length ? report.artifacts.map((file) => `<tr><td title="${escapeHtml(file.relativePath)}"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(file.relativePath)}</small></td><td>${formatFileSize(file.size)}</td><td><code title="${file.sha256}">${file.sha256.slice(0, 12)}</code></td><td>${new Date(file.modifiedAt).toLocaleString(uiLocale())}</td></tr>`).join("") : '<tr><td colspan="4">暂无智能体文件产物</td></tr>';
}

function clearDeliveryReport(message = "选择工作目录后开始检查") {
  deliveryReport = null;
  document.querySelector("#delivery-project").textContent = "等待选择目录";
  document.querySelector("#delivery-project-type").textContent = "未识别";
  document.querySelector("#delivery-artifact-count").textContent = "0";
  document.querySelector("#delivery-readiness").textContent = "等待检查";
  document.querySelector("#delivery-check-count").textContent = "0/4";
  document.querySelector("#delivery-checks").innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  document.querySelector("#delivery-artifacts").innerHTML = '<tr><td colspan="4">暂无交付产物</td></tr>';
}

async function refreshDelivery() {
  if (!workspacePath || !window.desktop?.inspectDelivery) { clearDeliveryReport(); return; }
  const button = document.querySelector("#refresh-delivery-button");
  button.disabled = true; button.textContent = "检查中";
  try { renderDeliveryReport(await window.desktop.inspectDelivery()); }
  catch (error) { clearDeliveryReport(error.message); }
  finally { button.disabled = false; button.textContent = "重新检查"; }
}

function renderDeploymentHistory() {
  document.querySelector("#deployment-count").textContent = deploymentRecords.length;
  document.querySelector("#deployment-history").innerHTML = deploymentRecords.length ? deploymentRecords.slice(0, 20).map((record) => `<article class="deployment-record"><span class="deployment-status ${record.status === "成功" ? "success" : "failure"}">${escapeHtml(record.status)}</span><div><strong>${escapeHtml(record.environment)} · ${escapeHtml(record.version || "未关联版本")}</strong><p>${escapeHtml(record.note || "未填写说明")}</p>${record.url ? `<a href="${escapeHtml(record.url)}" target="_blank" rel="noreferrer">${escapeHtml(record.url)}</a>` : ""}</div><time>${new Date(record.createdAt).toLocaleString(uiLocale())}</time></article>`).join("") : '<p class="empty-state">暂无部署记录</p>';
}

function renderOrchestrator() {
  const queued = tasks.filter((task) => task.status !== "done");
  const activeAgents = new Set(tasks.filter((task) => task.status === "progress").map((task) => task.agent));
  document.querySelector("#queue-count").textContent = queued.length;
  document.querySelector("#orchestrator-status").textContent = queued.length ? "调度队列就绪" : "等待任务";
  document.querySelector("#orchestrator-detail").textContent = queued.length ? `${queued.length} 个任务等待或正在执行` : "工作室当前空闲";
  document.querySelector("#execution-queue").innerHTML = queued.length ? queued.map((task) => `<article class="queue-item"><span class="queue-indicator ${task.priority}"></span><div><h3>${escapeHtml(task.title)}</h3><p>${task.status === "progress" ? "执行中" : "等待分派"} · ${escapeHtml(task.description || "未填写任务说明")}</p></div><span class="queue-agent">${escapeHtml(task.agent)}</span></article>`).join("") : "<p class=\"empty-state\">当前没有待调度任务</p>";
  document.querySelector("#agent-registry").innerHTML = roleAgents.map(([code, name, specialty]) => { const profile = officeAgents.find((agent) => agent.role === name); const busy = activeAgents.has(name); return `<article class="agent-card"><header><span class="agent-icon">${code}</span><h3>${escapeHtml(profile?.name || name)} · ${name}</h3></header><p>${specialty}</p><span class="agent-state ${busy ? "busy" : ""}">${busy ? "执行中" : profile ? "可调度" : "未配置"}</span></article>`; }).join("");
  document.querySelector("#event-log").innerHTML = eventLog.slice(0, 6).map((event, index) => `<li><time>${index === 0 ? "刚刚" : `${index + 1} 分钟前`}</time><span><span class="event-tag">调度</span> ${escapeHtml(event)}</span></li>`).join("");
}

function renderSkills() {
  document.querySelector("#skills-summary").textContent = `${enabledSkills.size} 项技能已启用`;
  document.querySelector("#skills-grid").innerHTML = skillCatalog.map(([code, agent, skills]) => `<article class="skill-card"><header class="skill-card-header"><div class="skill-owner"><b>${code}</b><h2>${agent}</h2></div><span class="skill-count">${skills.length} 项专属技能</span></header><ul class="skill-list">${skills.map(([name, description]) => `<li><div><strong>${name}</strong><small>${description}</small></div><input class="skill-toggle" type="checkbox" data-skill="${escapeHtml(description)}" aria-label="切换 ${name}" ${enabledSkills.has(description) ? "checked" : ""} /></li>`).join("")}</ul></article>`).join("");
}

function renderMemory(query = document.querySelector("#knowledge-search")?.value || "") {
  const normalized = query.trim().toLowerCase();
  const documents = knowledgeDocuments.filter((document) => `${document.title} ${document.content}`.toLowerCase().includes(normalized));
  document.querySelector("#short-memory-count").textContent = tasks.filter((task) => task.status === "progress").length;
  document.querySelector("#project-memory-count").textContent = memories.length;
  document.querySelector("#knowledge-document-count").textContent = knowledgeDocuments.length;
  document.querySelector("#memory-count").textContent = memories.length;
  document.querySelector("#memory-list").innerHTML = memories.length ? memories.map((memory) => `<article class="memory-item"><header><h3>${escapeHtml(memory.title)}</h3><button class="memory-delete" data-memory-delete="${memory.id}" type="button">删除</button></header><p>${escapeHtml(memory.content)}</p><span class="memory-type">${escapeHtml(memory.type)}</span></article>`).join("") : "<p class=\"memory-empty\">暂无项目记忆</p>";
  document.querySelector("#knowledge-list").innerHTML = documents.length ? documents.map((document) => `<article class="knowledge-item"><header><h3>${escapeHtml(document.title)}</h3><button class="memory-delete" data-knowledge-delete="${document.id}" type="button">删除</button></header><p>${escapeHtml(document.content.slice(0, 180))}${document.content.length > 180 ? "…" : ""}</p><div class="document-meta"><span class="document-type">${escapeHtml(document.type)}</span> · ${escapeHtml(document.size)}</div></article>`).join("") : "<p class=\"memory-empty\">没有匹配的知识文档</p>";
}

function applyProviderDefaults() {
  const provider = document.querySelector("#provider-select").value;
  const defaults = { openai: "https://api.openai.com/v1", anthropic: "https://api.anthropic.com", google: "https://generativelanguage.googleapis.com", deepseek: "https://api.deepseek.com/v1", custom: "" };
  document.querySelector("#base-url").value = defaults[provider];
}
function applyModelSettings(settings) {
  if (!settings?.configured) { applyProviderDefaults(); return; }
  const form = document.querySelector("#model-settings-form");
  form.provider.value = settings.provider || "openai";
  form.baseUrl.value = settings.baseUrl || "";
  form.model.value = settings.model || "";
  document.querySelector("#routing-mode").value = settings.routingMode || "balanced";
  if (settings.apiKeyConfigured) {
    form.apiKey.placeholder = "已安全保存，留空则继续使用";
    document.querySelector("#api-key-hint").textContent = "密钥已由 Windows 系统加密保存；输入新密钥可替换";
  }
}
async function loadModelSettings() {
  if (!window.desktop?.getModelStatus) {
    const settings = loadJson("ai-software-team.model-settings", null);
    if (settings) applyModelSettings({ ...settings, configured: true }); else applyProviderDefaults();
    return;
  }
  try {
    const status = await window.desktop.getModelStatus();
    applyModelSettings(status);
    setRuntimeState(status.configured, status.configured ? `${status.model} 已连接` : "模型待配置");
    if (status.persisted) setModelFeedback("配置已安全保存在本机，重启后会自动恢复", "success");
  } catch (error) { setModelFeedback(`读取保存配置失败：${error.message}`, "error"); }
}
function setRuntimeState(configured, label) {
  const pill = document.querySelector("#runtime-pill"); pill.classList.toggle("connected", configured); pill.querySelector("span:last-child").textContent = label;
  const state = document.querySelector("#connection-state"); state.classList.toggle("connected", configured); state.textContent = configured ? label : "未配置";
  document.querySelector("#chat-model-label").textContent = configured ? label : "等待模型配置";
}
function getModelFormConfig() { const form = document.querySelector("#model-settings-form"); const data = new FormData(form); return { provider: data.get("provider"), baseUrl: data.get("baseUrl"), model: data.get("model"), apiKey: data.get("apiKey").trim(), routingMode: document.querySelector("#routing-mode").value }; }
async function configureRuntime(config) { if (!window.desktop?.configureModel) throw new Error("真实模型执行仅在 Electron 桌面版中可用"); const result = await window.desktop.configureModel(config); setRuntimeState(true, `${result.model} 已连接`); return result; }
function skillMap() { return Object.fromEntries(skillCatalog.map(([, agent, skills]) => [agent, skills.filter(([, description]) => enabledSkills.has(description)).map(([name]) => name)])); }
function getTeamContext() {
  const resources = externalResources.map((resource) => resource.type === "repository" ? `外部代码仓库 ${resource.data.name}：${resource.data.description || "无说明"}\n默认分支：${resource.data.defaultBranch}\n文件：${resource.data.files.slice(0, 300).map((file) => file.path).join("、")}` : `外部网页资料 ${resource.data.title}（${resource.data.url}）：${resource.data.content.slice(0, 8000)}`);
  return [...resources, ...tasks.map((task) => `任务[${task.status}] ${task.title}: ${task.result || task.description || ""}`), ...memories.map((item) => `记忆 ${item.title}: ${item.content}`), ...knowledgeDocuments.map((item) => `知识 ${item.title}: ${item.content.slice(0, 600)}`)];
}
function setModelFeedback(message, type = "") { const feedback = document.querySelector("#model-save-feedback"); feedback.textContent = message; feedback.className = `model-save-feedback ${type}`.trim(); }

const mediaProviderDefaults = {
  image: {
    openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-image-1" },
    stability: { baseUrl: "https://api.stability.ai/v2beta", model: "stable-image-core" },
    google: { baseUrl: "https://generativelanguage.googleapis.com", model: "imagen-4.0-generate-001" },
    custom: { baseUrl: "", model: "" }
  },
  video: {
    openai: { baseUrl: "https://api.openai.com/v1", model: "sora-2" },
    kling: { baseUrl: "https://api.klingai.com/v1", model: "kling-v2-1" },
    runway: { baseUrl: "https://api.dev.runwayml.com/v1", model: "gen4_turbo" },
    custom: { baseUrl: "", model: "" }
  }
};
function mediaForm(kind) { return document.querySelector(`#${kind}-model-form`); }
function setMediaModelFeedback(kind, message, type = "") {
  const feedback = document.querySelector(`#${kind}-model-feedback`);
  feedback.textContent = message;
  feedback.className = `model-save-feedback ${type}`.trim();
}

function memoryNodeColor(node) {
  if (node.type === "root") return "#111111";
  if (node.type === "directory") return "#176b63";
  if (node.type === "concept") return "#7a6fa5";
  const colors = { ".js": "#d0a820", ".ts": "#3578b9", ".py": "#4b7c58", ".md": "#555555", ".json": "#a35e31", ".html": "#c94d3f", ".css": "#4c69b3" };
  return colors[node.extension] || "#777777";
}

function seededValue(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}

function storedMemoryGraphLayout() {
  const stored = loadJson(storageKeys.memoryGraphLayout, null);
  return stored?.rootPath === memoryGraphState.rootPath ? stored : null;
}

function saveMemoryGraphLayout() {
  if (!memoryGraphState.rootPath) return;
  const positions = {};
  for (const [id, position] of memoryGraphScene.positions) positions[id] = [Math.round(position.x * 10) / 10, Math.round(position.y * 10) / 10];
  localStorage.setItem(storageKeys.memoryGraphLayout, JSON.stringify({ rootPath: memoryGraphState.rootPath, positions, scale: memoryGraphScene.scale, offsetX: memoryGraphScene.offsetX, offsetY: memoryGraphScene.offsetY }));
}

function seedMemoryNodePosition(node, index) {
  const angle = seededValue(node.id) * Math.PI * 2;
  const jitter = seededValue(`${node.id}:radius`);
  const radius = node.type === "root" ? 0 : node.type === "directory" ? 100 + jitter * 160 : node.type === "concept" ? 200 + jitter * 260 : 300 + jitter * 480;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .72, vx: 0, vy: 0, fixed: node.type === "root", index };
}

function buildMemoryGraphScene(options = {}) {
  const reset = Boolean(options.reset);
  const rootChanged = memoryGraphScene.initializedRoot !== memoryGraphState.rootPath;
  if (reset || rootChanged) {
    cancelAnimationFrame(memoryGraphScene.animationFrame);
    memoryGraphScene.positions = new Map();
    memoryGraphScene.initializedRoot = memoryGraphState.rootPath;
    const stored = reset ? null : storedMemoryGraphLayout();
    for (const [index, node] of (memoryGraphState.nodes || []).entries()) {
      const saved = stored?.positions?.[node.id];
      memoryGraphScene.positions.set(node.id, saved ? { x: saved[0], y: saved[1], vx: 0, vy: 0, fixed: node.type === "root", index } : seedMemoryNodePosition(node, index));
    }
    memoryGraphScene.scale = stored?.scale || 1;
    memoryGraphScene.offsetX = stored?.offsetX || 0;
    memoryGraphScene.offsetY = stored?.offsetY || 0;
    memoryGraphScene.autoFitAfterLayout = !stored;
  } else {
    for (const [index, node] of (memoryGraphState.nodes || []).entries()) if (!memoryGraphScene.positions.has(node.id)) memoryGraphScene.positions.set(node.id, seedMemoryNodePosition(node, index));
  }

  const filter = document.querySelector("#memory-graph-filter")?.value || "all";
  const allNodes = memoryGraphState.nodes || [];
  let visibleIds = new Set(allNodes.filter((node) => filter === "all" || node.type === filter || node.type === "root").map((node) => node.id));
  if (filter !== "all") {
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of memoryGraphState.edges || []) if (edge.type === "contains" && visibleIds.has(edge.to) && !visibleIds.has(edge.from)) { visibleIds.add(edge.from); changed = true; }
    }
  }
  memoryGraphScene.nodes = allNodes.filter((node) => visibleIds.has(node.id));
  memoryGraphScene.edges = (memoryGraphState.edges || []).filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to) && memoryGraphScene.activeEdgeTypes.has(edge.type));
  memoryGraphScene.frame = 0;
  if (options.layout !== false && memoryGraphScene.nodes.length) runMemoryGraphLayout(rootChanged || reset ? 85 : 28);
  else drawMemoryGraph();
}

function runMemoryGraphLayout(maxFrames = 70) {
  cancelAnimationFrame(memoryGraphScene.animationFrame);
  const step = () => {
    const positions = memoryGraphScene.positions;
    for (const edge of memoryGraphScene.edges) {
      const a = positions.get(edge.from); const b = positions.get(edge.to);
      if (!a || !b) continue;
      const dx = b.x - a.x; const dy = b.y - a.y; const distance = Math.max(1, Math.hypot(dx, dy));
      const target = edge.type === "contains" ? 105 : edge.type === "references" ? 155 : 190;
      const force = (distance - target) * .0015 * (edge.strength || 1);
      if (!a.fixed) { a.vx += dx / distance * force; a.vy += dy / distance * force; }
      if (!b.fixed) { b.vx -= dx / distance * force; b.vy -= dy / distance * force; }
    }
    const nodes = memoryGraphScene.nodes;
    const grid = new Map();
    const cellSize = 110;
    for (const node of nodes) {
      const position = positions.get(node.id); if (!position) continue;
      const key = `${Math.floor(position.x / cellSize)}:${Math.floor(position.y / cellSize)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(node.id);
    }
    for (const node of nodes) {
      const a = positions.get(node.id); if (!a || a.fixed) continue;
      a.vx += -a.x * .00013; a.vy += -a.y * .00013;
      const cellX = Math.floor(a.x / cellSize); const cellY = Math.floor(a.y / cellSize);
      for (let ox = -1; ox <= 1; ox += 1) for (let oy = -1; oy <= 1; oy += 1) for (const otherId of grid.get(`${cellX + ox}:${cellY + oy}`) || []) {
        if (otherId === node.id) continue;
        const b = positions.get(otherId); if (!b) continue;
        const dx = b.x - a.x; const dy = b.y - a.y; const square = Math.max(100, dx * dx + dy * dy);
        if (square > 19600) continue;
        const force = 28 / square;
        a.vx -= dx * force; a.vy -= dy * force;
      }
      a.vx *= .8; a.vy *= .8; a.x += a.vx; a.y += a.vy;
    }
    memoryGraphScene.frame += 1;
    drawMemoryGraph();
    if (memoryGraphScene.frame < maxFrames) memoryGraphScene.animationFrame = requestAnimationFrame(step);
    else {
      if (memoryGraphScene.autoFitAfterLayout) { memoryGraphScene.autoFitAfterLayout = false; fitMemoryGraph(); }
      else saveMemoryGraphLayout();
    }
  };
  memoryGraphScene.animationFrame = requestAnimationFrame(step);
}

function drawMemoryGraph() {
  const canvas = document.querySelector("#memory-graph-canvas");
  if (!canvas) return;
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(bounds.width)); const height = Math.max(1, Math.round(bounds.height));
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) { canvas.width = width * ratio; canvas.height = height * ratio; }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const { scale, offsetX, offsetY, positions } = memoryGraphScene;
  const centerX = width / 2 + offsetX; const centerY = height / 2 + offsetY;
  const search = (document.querySelector("#memory-graph-search")?.value || "").trim().toLowerCase();
  const matching = new Set(memoryGraphScene.nodes.filter((node) => !search || `${node.label} ${node.path} ${(node.keywords || []).join(" ")}`.toLowerCase().includes(search)).map((node) => node.id));
  const labels = [];
  context.lineWidth = 1;
  for (const edge of memoryGraphScene.edges) {
    const from = positions.get(edge.from); const to = positions.get(edge.to); if (!from || !to) continue;
    context.beginPath(); context.moveTo(centerX + from.x * scale, centerY + from.y * scale); context.lineTo(centerX + to.x * scale, centerY + to.y * scale);
    const selectedEdge = memoryGraphScene.selectedId && (edge.from === memoryGraphScene.selectedId || edge.to === memoryGraphScene.selectedId);
    context.strokeStyle = search && !(matching.has(edge.from) || matching.has(edge.to)) ? "rgba(0,0,0,.025)" : selectedEdge ? "rgba(0,0,0,.62)" : edge.type === "references" ? "rgba(23,107,99,.34)" : edge.type === "related" ? "rgba(122,111,165,.22)" : "rgba(0,0,0,.12)";
    context.lineWidth = selectedEdge ? 1.8 : 1;
    context.stroke();
  }
  for (const node of memoryGraphScene.nodes) {
    const position = positions.get(node.id); if (!position) continue;
    const x = centerX + position.x * scale; const y = centerY + position.y * scale;
    const radius = (node.type === "root" ? 11 : node.type === "directory" ? 7 : node.type === "concept" ? 5 : 4) * Math.min(1.25, Math.max(.75, scale));
    const muted = search && !matching.has(node.id);
    context.globalAlpha = muted ? .12 : 1;
    context.beginPath(); context.arc(x, y, radius + (memoryGraphScene.selectedId === node.id ? 4 : 0), 0, Math.PI * 2);
    if (memoryGraphScene.selectedId === node.id) { context.fillStyle = "rgba(23,107,99,.18)"; context.fill(); context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); }
    context.fillStyle = memoryNodeColor(node); context.fill();
    if (scale > .62) {
      const selected = memoryGraphScene.selectedId === node.id;
      const eligible = selected || (search && matching.has(node.id)) || node.type === "root" || node.type === "directory" || (node.type === "concept" && (node.weight || 0) >= 3) || memoryGraphScene.nodes.length < 90;
      if (eligible) labels.push({ node, x, y: y + radius + 12, priority: selected ? 1000 : search && matching.has(node.id) ? 800 : node.type === "root" ? 700 : node.type === "directory" ? 500 : node.type === "concept" ? 200 + (node.weight || 0) : 100 });
    }
    context.globalAlpha = 1;
  }
  const occupied = [];
  for (const label of labels.sort((a, b) => b.priority - a.priority).slice(0, 120)) {
    const text = label.node.label.slice(0, 24);
    const fontSize = label.node.type === "root" ? 11 : 9;
    const widthEstimate = Math.max(18, text.length * fontSize * (/[\u4e00-\u9fff]/.test(text) ? .95 : .58));
    const rectangle = { left: label.x - widthEstimate / 2 - 3, right: label.x + widthEstimate / 2 + 3, top: label.y - fontSize - 3, bottom: label.y + 4 };
    const forced = label.priority >= 700;
    if (!forced && occupied.some((item) => rectangle.left < item.right && rectangle.right > item.left && rectangle.top < item.bottom && rectangle.bottom > item.top)) continue;
    if (rectangle.right < 0 || rectangle.left > width || rectangle.bottom < 0 || rectangle.top > height) continue;
    occupied.push(rectangle);
    context.font = `${fontSize}px system-ui`; context.fillStyle = "#222"; context.textAlign = "center"; context.fillText(text, label.x, label.y);
  }
}

function renderMemoryGraph() {
  const stats = memoryGraphState.stats || {};
  document.querySelector("#memory-graph-summary").textContent = memoryGraphState.rootPath ? `${stats.nodes || 0} 个节点 · ${stats.edges || 0} 条连接` : "尚未建立图谱";
  document.querySelector("#memory-graph-path").textContent = memoryGraphState.rootPath || "选择一个文件夹，将代码与资料转为互相关联的长期记忆。";
  document.querySelector("#memory-graph-empty").hidden = Boolean(memoryGraphState.nodes?.length);
  document.querySelector("#memory-graph-open").disabled = !memoryGraphState.rootPath;
  document.querySelector("#memory-graph-reindex").disabled = !memoryGraphState.rootPath;
  const diagnostics = memoryGraphState.diagnostics || {};
  const diagnosticPanel = document.querySelector("#memory-graph-diagnostics");
  const diagnosticsItems = [
    diagnostics.isolatedNodes ? `孤立节点 ${diagnostics.isolatedNodes}` : "",
    diagnostics.unresolvedReferences ? `失效引用 ${diagnostics.unresolvedReferences}` : "",
    diagnostics.unreadableFiles ? `无法读取 ${diagnostics.unreadableFiles}` : "",
    diagnostics.skippedLargeFiles ? `跳过大文件 ${diagnostics.skippedLargeFiles}` : "",
    diagnostics.truncatedReason || ""
  ].filter(Boolean);
  diagnosticPanel.innerHTML = diagnosticsItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  diagnosticPanel.hidden = !diagnosticsItems.length;
  buildMemoryGraphScene();
}

function setMemoryGraphLoading(visible, title = "正在构建长期记忆") {
  const layer = document.querySelector("#memory-graph-loading");
  layer.hidden = !visible;
  document.querySelector("#memory-graph-loading-title").textContent = title;
  if (!visible) return;
  document.querySelector("#memory-graph-loading-fill").style.width = "4%";
  document.querySelector("#memory-graph-loading-detail").textContent = "正在准备目录扫描";
}

async function loadMemoryGraph() {
  try { memoryGraphState = await window.desktop?.getMemoryGraph?.() || memoryGraphState; renderMemoryGraph(); }
  catch (error) { document.querySelector("#memory-graph-path").textContent = `图谱加载失败：${error.message}`; }
}

async function chooseOrReindexMemoryGraph(choose) {
  setMemoryGraphLoading(true, choose ? "正在构建长期记忆" : "正在重新索引知识关系");
  try {
    const result = choose ? await window.desktop.chooseMemoryGraphFolder() : { graph: await window.desktop.reindexMemoryGraph() };
    if (!result.canceled) { memoryGraphState = result.graph; document.querySelector("#memory-graph-loading-fill").style.width = "100%"; renderMemoryGraph(); }
  } catch (error) { document.querySelector("#memory-graph-path").textContent = `索引失败：${error.message}`; }
  finally { setTimeout(() => setMemoryGraphLoading(false), 260); }
}

function showMemoryNode(node) {
  if (!node) return;
  memoryGraphScene.selectedId = node.id;
  document.querySelector("#memory-node-type").textContent = node.type.toUpperCase();
  document.querySelector("#memory-node-title").textContent = node.label;
  document.querySelector("#memory-node-path").textContent = node.path || memoryGraphState.rootPath;
  document.querySelector("#memory-node-summary").textContent = node.summary || (node.type === "concept" ? `由 ${node.weight || 0} 个文件共享的概念。` : "目录关系节点");
  document.querySelector("#memory-node-keywords").innerHTML = (node.keywords || []).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("");
  const nodesById = new Map((memoryGraphState.nodes || []).map((item) => [item.id, item]));
  const neighbors = (memoryGraphState.edges || []).filter((edge) => edge.from === node.id || edge.to === node.id).slice(0, 18).map((edge) => ({ edge, node: nodesById.get(edge.from === node.id ? edge.to : edge.from) })).filter((item) => item.node);
  document.querySelector("#memory-node-neighbors").innerHTML = neighbors.length ? neighbors.map(({ edge, node: neighbor }) => `<button type="button" data-memory-focus="${neighbor.id}"><span>${escapeHtml(neighbor.label)}</span><small>${edge.type === "contains" ? "包含" : edge.type === "references" ? "引用" : "概念"}</small></button>`).join("") : "<span>暂无关联节点</span>";
  document.querySelector("#memory-node-inspector").hidden = false;
  drawMemoryGraph();
}

function focusMemoryNode(nodeId, openInspector = true) {
  const node = (memoryGraphState.nodes || []).find((item) => item.id === nodeId);
  const position = memoryGraphScene.positions.get(nodeId);
  if (!node || !position) return;
  if (!memoryGraphScene.nodes.some((item) => item.id === nodeId)) {
    document.querySelector("#memory-graph-filter").value = "all";
    buildMemoryGraphScene({ layout: false });
  }
  memoryGraphScene.scale = Math.max(1.05, memoryGraphScene.scale);
  memoryGraphScene.offsetX = -position.x * memoryGraphScene.scale;
  memoryGraphScene.offsetY = -position.y * memoryGraphScene.scale;
  memoryGraphScene.selectedId = nodeId;
  if (openInspector) showMemoryNode(node); else drawMemoryGraph();
  saveMemoryGraphLayout();
}

function fitMemoryGraph() {
  const canvas = document.querySelector("#memory-graph-canvas");
  const bounds = canvas.getBoundingClientRect();
  const positions = memoryGraphScene.nodes.map((node) => memoryGraphScene.positions.get(node.id)).filter(Boolean);
  if (!positions.length || bounds.width < 20 || bounds.height < 20) return;
  const minX = Math.min(...positions.map((position) => position.x)); const maxX = Math.max(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y)); const maxY = Math.max(...positions.map((position) => position.y));
  memoryGraphScene.scale = Math.max(.28, Math.min(2.2, Math.min((bounds.width - 90) / Math.max(120, maxX - minX), (bounds.height - 90) / Math.max(120, maxY - minY))));
  memoryGraphScene.offsetX = -(minX + maxX) / 2 * memoryGraphScene.scale;
  memoryGraphScene.offsetY = -(minY + maxY) / 2 * memoryGraphScene.scale;
  drawMemoryGraph(); saveMemoryGraphLayout();
}

let memorySearchSequence = 0;
async function renderMemorySearchResults(query) {
  const results = document.querySelector("#memory-search-results");
  const normalized = String(query || "").trim();
  drawMemoryGraph();
  if (!normalized) { results.hidden = true; results.innerHTML = ""; return; }
  const sequence = ++memorySearchSequence;
  let matches = [];
  try { matches = await window.desktop.searchMemoryGraph(normalized, 12); }
  catch { matches = (memoryGraphState.nodes || []).filter((node) => `${node.label} ${node.path} ${(node.keywords || []).join(" ")}`.toLowerCase().includes(normalized.toLowerCase())).slice(0, 12); }
  if (sequence !== memorySearchSequence) return;
  results.innerHTML = matches.length ? matches.map((node) => `<button type="button" data-memory-focus="${node.id}"><b>${escapeHtml(node.label)}</b><small>${escapeHtml(node.path || node.type)}${node.relevance ? ` · 相关度 ${node.relevance}` : ""}</small></button>`).join("") : "<span class=\"memory-empty\">没有匹配节点</span>";
  results.hidden = false;
}
function applyMediaProviderDefaults(kind) {
  const form = mediaForm(kind);
  const defaults = mediaProviderDefaults[kind]?.[form.provider.value] || { baseUrl: "", model: "" };
  form.baseUrl.value = defaults.baseUrl;
  form.model.value = defaults.model;
}
function renderMediaModel(kind) {
  const form = mediaForm(kind);
  const state = mediaModelState[kind] || { configured: false };
  const badge = form.querySelector("[data-media-state]");
  badge.classList.toggle("connected", Boolean(state.configured));
  badge.textContent = state.configured ? `${state.model} 已保存` : "未配置";
  if (!state.configured) {
    form.reset();
    applyMediaProviderDefaults(kind);
    form.apiKey.placeholder = kind === "image" ? "输入生图专用密钥" : "输入视频专用密钥";
    form.querySelector("[data-media-key-hint]").textContent = kind === "image" ? "不会使用主模型或视频 API Key" : "不会使用主模型或生图 API Key";
    return;
  }
  form.provider.value = state.provider || "openai";
  form.baseUrl.value = state.baseUrl || "";
  form.model.value = state.model || "";
  form.apiKey.value = "";
  form.apiKey.placeholder = "已安全保存，留空则继续使用";
  form.querySelector("[data-media-key-hint]").textContent = "此媒体密钥已由 Windows 系统加密保存";
}
async function loadMediaModels() {
  if (!window.desktop?.getMediaModels) {
    renderMediaModel("image");
    renderMediaModel("video");
    return;
  }
  try {
    mediaModelState = await window.desktop.getMediaModels();
    for (const kind of ["image", "video"]) {
      renderMediaModel(kind);
      if (mediaModelState[kind]?.configured) setMediaModelFeedback(kind, "配置已安全保存在本机，重启后会自动恢复", "success");
    }
  } catch (error) {
    for (const kind of ["image", "video"]) setMediaModelFeedback(kind, `读取配置失败：${error.message}`, "error");
  }
}
async function saveMediaModel(kind, form) {
  if (!window.desktop?.configureMediaModel) throw new Error("媒体 API 配置仅在 Electron 桌面版中可用");
  const data = new FormData(form);
  const payload = {
    provider: String(data.get("provider") || "").trim(),
    baseUrl: String(data.get("baseUrl") || "").trim(),
    model: String(data.get("model") || "").trim(),
    apiKey: String(data.get("apiKey") || "").trim()
  };
  mediaModelState = await window.desktop.configureMediaModel(kind, payload);
  renderMediaModel(kind);
}

const voiceProviderDefaults = {
  asr: {
    openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini-transcribe" },
    groq: { baseUrl: "https://api.groq.com/openai/v1", model: "whisper-large-v3-turbo" },
    deepgram: { baseUrl: "https://api.deepgram.com/v1", model: "nova-3" },
    custom: { baseUrl: "", model: "" }
  },
  tts: {
    openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini-tts" },
    custom: { baseUrl: "", model: "" }
  }
};

function setVoiceFeedback(message, type = "") {
  const feedback = document.querySelector("#voice-model-feedback");
  feedback.textContent = message;
  feedback.className = `model-save-feedback ${type}`.trim();
}

function applyVoiceProviderDefaults(kind) {
  const form = document.querySelector("#voice-settings-form");
  const provider = form[`${kind}Provider`].value;
  const defaults = voiceProviderDefaults[kind][provider] || { baseUrl: "", model: "" };
  form[`${kind}BaseUrl`].value = defaults.baseUrl;
  form[`${kind}Model`].value = defaults.model;
}

function renderVoiceSettings() {
  const form = document.querySelector("#voice-settings-form");
  const badge = document.querySelector("#voice-connection-state");
  badge.textContent = voiceState.configured ? `${voiceState.asrModel} / ${voiceState.ttsModel}` : "未配置";
  badge.classList.toggle("connected", Boolean(voiceState.configured));
  if (voiceState.configured) {
    for (const field of ["asrProvider", "asrBaseUrl", "asrModel", "ttsProvider", "ttsBaseUrl", "ttsModel", "voice", "speed"]) if (voiceState[field] !== undefined) form[field].value = voiceState[field];
    form.asrApiKey.value = ""; form.ttsApiKey.value = "";
    form.asrApiKey.placeholder = "已安全保存，留空继续使用";
    form.ttsApiKey.placeholder = "已安全保存，留空继续使用";
  } else {
    form.reset();
    applyVoiceProviderDefaults("asr"); applyVoiceProviderDefaults("tts");
  }
  form.autoSpeak.checked = Boolean(voiceState.autoSpeak);
  document.querySelector("#voice-speed-label").textContent = `${Number(form.speed.value || 1).toFixed(2)}×`;
  renderChat(); renderWorkflowChat();
}

async function loadVoiceSettings() {
  try {
    voiceState = await window.desktop?.getVoiceSettings?.() || voiceState;
    renderVoiceSettings();
    if (voiceState.configured) setVoiceFeedback("语音配置已安全恢复，录音和朗读可以直接使用。", "success");
  } catch (error) { setVoiceFeedback(`语音配置读取失败：${error.message}`, "error"); }
}

function stopVoicePlayback() {
  if (activeVoiceAudio) { activeVoiceAudio.pause(); activeVoiceAudio.src = ""; activeVoiceAudio = null; }
  document.querySelectorAll("[data-stop-voice]").forEach((button) => { button.hidden = true; });
}

async function speakText(text) {
  stopVoicePlayback();
  if (!window.desktop?.synthesizeVoice) throw new Error("语音合成仅在 Electron 桌面版中可用");
  if (!voiceState.ttsConfigured) throw new Error("请先在设置中配置语音合成 API");
  const result = await window.desktop.synthesizeVoice({ text: String(text || "").slice(0, 12000) });
  const blob = new Blob([result.audio], { type: result.mimeType || "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  activeVoiceAudio = audio;
  document.querySelectorAll("[data-stop-voice]").forEach((button) => { button.hidden = false; });
  const cleanup = () => { if (activeVoiceAudio === audio) activeVoiceAudio = null; URL.revokeObjectURL(url); document.querySelectorAll("[data-stop-voice]").forEach((button) => { button.hidden = true; }); };
  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });
  await audio.play();
}

function maybeAutoSpeak(text) {
  if (voiceState.autoSpeak && voiceState.ttsConfigured) speakText(text).catch((error) => setVoiceFeedback(`自动朗读失败：${error.message}`, "error"));
}

function insertTranscript(input, transcript) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  const prefix = input.value.slice(0, start);
  const separator = prefix && !/\s$/.test(prefix) ? " " : "";
  input.value = `${prefix}${separator}${transcript}${input.value.slice(end)}`;
  const cursor = prefix.length + separator.length + transcript.length;
  input.setSelectionRange(cursor, cursor);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

function setRecordingButtonState(button, state) {
  document.querySelectorAll(".voice-record-button").forEach((item) => { item.classList.remove("recording", "transcribing"); item.disabled = state === "transcribing"; item.textContent = "●"; item.title = "开始录音"; });
  if (!button) return;
  if (state === "recording") { button.classList.add("recording"); button.disabled = false; button.textContent = "■"; button.title = "停止并转写"; }
  if (state === "transcribing") { button.classList.add("transcribing"); button.textContent = "…"; button.title = "正在转写"; }
}

async function toggleVoiceRecording(target) {
  const button = document.querySelector(target === "workflow" ? "#workflow-voice-button" : "#chat-voice-button");
  const input = document.querySelector(target === "workflow" ? "#workflow-chat-input" : "#chat-input");
  if (voiceRecorder?.state === "recording") { voiceRecorder.stop(); return; }
  if (!voiceState.asrConfigured) { setVoiceFeedback("请先在设置中配置语音识别 API。", "error"); activateView("settings"); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
    const chunks = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    voiceRecorder = recorder; voiceRecordingTarget = target;
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener("stop", async () => {
      setRecordingButtonState(button, "transcribing");
      stream.getTracks().forEach((track) => track.stop());
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const result = await window.desktop.transcribeVoice({ audio: await blob.arrayBuffer(), mimeType: blob.type || "audio/webm", language: uiLocale().startsWith("zh") ? "zh" : "en" });
        insertTranscript(input, result.text);
      } catch (error) { setVoiceFeedback(`语音识别失败：${error.message}`, "error"); }
      finally { voiceRecorder = null; voiceRecordingTarget = null; setRecordingButtonState(null, "idle"); }
    }, { once: true });
    recorder.start(250);
    setRecordingButtonState(button, "recording");
    setTimeout(() => { if (voiceRecorder === recorder && recorder.state === "recording") recorder.stop(); }, 120000);
  } catch (error) { setVoiceFeedback(`无法使用麦克风：${error.message}`, "error"); setRecordingButtonState(null, "idle"); }
}

function chatSpeakButton(scope, index) {
  return voiceState.ttsConfigured ? `<button class="chat-speak-button" type="button" data-speak-scope="${scope}" data-speak-index="${index}" title="朗读回复" aria-label="朗读回复">▶</button>` : "";
}

function setModelPoolFeedback(message, type = "") {
  const feedback = document.querySelector("#model-pool-feedback");
  feedback.textContent = message;
  feedback.className = `model-pool-feedback ${type}`.trim();
}

function renderPlugins() {
  const list = document.querySelector("#plugin-list");
  if (!list) return;
  const enabled = pluginState.filter((plugin) => plugin.enabled).length;
  document.querySelector("#plugin-summary").textContent = `${enabled} 个插件启用`;
  list.innerHTML = pluginState.length ? pluginState.map((plugin) => `<article class="plugin-item"><div class="plugin-mark">${escapeHtml(plugin.category.slice(0, 1))}</div><div class="plugin-copy"><header><strong>${escapeHtml(plugin.name)}</strong><span>${escapeHtml(plugin.version)} · ${plugin.source === "built-in" ? "内置" : "本地"}</span></header><p>${escapeHtml(plugin.description || "未填写说明")}</p><small>${escapeHtml(plugin.skills.join("、"))}</small></div><label class="plugin-switch"><input type="checkbox" data-plugin-id="${escapeHtml(plugin.id)}" ${plugin.enabled ? "checked" : ""} /><span>${plugin.enabled ? "已启用" : "已停用"}</span></label></article>`).join("") : '<p class="empty-state">没有可用插件</p>';
}

async function loadPlugins() {
  try { pluginState = await window.desktop?.getPlugins?.() || []; renderPlugins(); }
  catch (error) { document.querySelector("#plugin-state").textContent = `插件加载失败：${error.message}`; }
}

function renderModelPool() {
  const profiles = modelPoolState.profiles || [];
  const assignments = modelPoolState.assignments || {};
  const assignedCount = Object.values(assignments).filter((profileId) => profiles.some((profile) => profile.id === profileId)).length;
  const commander = profiles.find((profile) => profile.id === assignments.commander);
  document.querySelector("#model-profile-count").textContent = profiles.length;
  document.querySelector("#model-profile-badge").textContent = profiles.length;
  document.querySelector("#model-assignment-count").textContent = assignedCount;
  document.querySelector("#commander-model-label").textContent = commander?.model || "跟随主模型";
  document.querySelector("#model-routing-state").textContent = assignedCount ? `${assignedCount} 个角色独立路由` : "主模型回退已启用";
  document.querySelector("#model-profile-list").innerHTML = profiles.length ? profiles.map((profile) => `
    <article class="model-profile-item" data-profile-id="${escapeHtml(profile.id)}">
      <div class="model-profile-mark">${escapeHtml(profile.name.slice(0, 1).toUpperCase())}</div>
      <div class="model-profile-copy"><strong>${escapeHtml(profile.name)}</strong><span>${escapeHtml(profile.model)}</span><small>${escapeHtml(profile.provider)} · ${escapeHtml(profile.baseUrl)}</small></div>
      <span class="profile-secure-state">已加密</span>
      <div class="model-profile-actions">
        <button class="icon-button" type="button" data-profile-test="${escapeHtml(profile.id)}" title="测试连接" aria-label="测试 ${escapeHtml(profile.name)}">↻</button>
        <button class="icon-button" type="button" data-profile-edit="${escapeHtml(profile.id)}" title="编辑连接" aria-label="编辑 ${escapeHtml(profile.name)}">✎</button>
        <button class="icon-button danger" type="button" data-profile-delete="${escapeHtml(profile.id)}" title="删除连接" aria-label="删除 ${escapeHtml(profile.name)}">×</button>
      </div>
    </article>`).join("") : '<p class="empty-state">尚未添加独立模型连接</p>';
  const options = profiles.map((profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)} · ${escapeHtml(profile.model)}</option>`).join("");
  document.querySelector("#model-routing-list").innerHTML = modelPoolTargets.map(([target, code, name, specialty]) => `
    <label class="model-routing-row">
      <b>${escapeHtml(code)}</b>
      <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(specialty)}</small></span>
      <select data-model-target="${escapeHtml(target)}" aria-label="为 ${escapeHtml(name)} 选择模型">
        <option value="">跟随主模型</option>${options}
      </select>
    </label>`).join("");
  document.querySelectorAll("[data-model-target]").forEach((select) => { select.value = assignments[select.dataset.modelTarget] || ""; });
  renderSettingsAgentRouting();
}

function renderUpdateState(nextState = updateState) {
  updateState = nextState || updateState;
  const stateLabels = { idle: "等待检查", checking: "正在检查", available: "发现新版本", "up-to-date": "已是最新版本", downloading: "正在下载", extracting: "正在校验", ready: "等待重启", installing: "正在安装", error: "更新失败" };
  document.querySelector("#update-state").textContent = stateLabels[updateState.status] || updateState.status;
  document.querySelector("#update-state").classList.toggle("connected", ["up-to-date", "ready"].includes(updateState.status));
  document.querySelector("#update-current-version").textContent = `v${updateState.currentVersion || "--"}`;
  document.querySelector("#update-latest-version").textContent = updateState.checkedAt ? `最新版本 v${updateState.latestVersion}` : "尚未检查最新版本";
  document.querySelector("#update-auto-check").checked = updateState.settings?.autoCheck !== false;
  document.querySelector("#update-auto-download").checked = updateState.settings?.autoDownload !== false;
  document.querySelector("#update-install-restart").checked = updateState.settings?.installOnRestart !== false;
  document.querySelector("#update-release-button").hidden = !updateState.releaseUrl;
  document.querySelector("#update-download-button").hidden = !updateState.available || updateState.downloaded || ["downloading", "extracting"].includes(updateState.status);
  document.querySelector("#update-restart-button").hidden = !updateState.readyToInstall;
  const progressVisible = ["downloading", "extracting", "ready"].includes(updateState.status);
  document.querySelector("#update-progress").hidden = !progressVisible;
  const progress = Number(updateState.progress || 0);
  document.querySelector("#update-progress-bar").value = progress;
  document.querySelector("#update-progress-percent").textContent = `${progress}%`;
  document.querySelector("#update-progress-label").textContent = updateState.status === "extracting" ? "正在解压并校验更新包" : updateState.status === "ready" ? "更新已下载，重启后覆盖旧版本" : "正在从 GitHub Releases 下载";
  const messages = { idle: "软件会从 GitHub Releases 安全检查 Windows ZIP 新版本。", checking: "正在连接 GitHub Releases…", available: `v${updateState.latestVersion} 可以下载。`, "up-to-date": "当前已是最新版本。", downloading: "更新正在后台下载，您可以继续使用软件。", extracting: "下载完成，正在验证桌面程序结构。", ready: "更新已准备好。立即重启，或在下次退出时自动安装。", installing: "软件即将退出并覆盖安装新版本。" };
  const feedback = document.querySelector("#update-feedback");
  feedback.textContent = updateState.error ? `更新失败：${updateState.error}` : messages[updateState.status] || messages.idle;
  feedback.className = `model-save-feedback ${updateState.error ? "error" : ["up-to-date", "ready"].includes(updateState.status) ? "success" : ""}`.trim();
}

async function loadUpdateState() {
  try { renderUpdateState(await window.desktop?.getUpdateStatus?.() || updateState); }
  catch (error) { renderUpdateState({ ...updateState, status: "error", error: error.message }); }
}

function renderSettingsAgentRouting() {
  const list = document.querySelector("#settings-agent-routing-list");
  if (!list) return;
  const profiles = modelPoolState.profiles || [];
  const assignments = modelPoolState.assignments || {};
  const options = profiles.map((profile) => `<option value="${escapeHtml(profile.id)}">独立模型 · ${escapeHtml(profile.name)} · ${escapeHtml(profile.model)}</option>`).join("");
  list.innerHTML = modelPoolTargets.map(([target, code, name, specialty]) => `
    <label class="settings-agent-routing-row">
      <b>${escapeHtml(code)}</b>
      <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(specialty)}</small></span>
      <select data-settings-model-target="${escapeHtml(target)}" aria-label="为 ${escapeHtml(name)} 选择模型">
        <option value="">主模型的子 Agent</option>${options}
      </select>
    </label>`).join("");
  list.querySelectorAll("[data-settings-model-target]").forEach((select) => { select.value = assignments[select.dataset.settingsModelTarget] || ""; });
}

async function saveModelAssignment(target, profileId, feedbackTarget = "pool") {
  modelPoolState = await window.desktop.assignModelProfile(target, profileId || null);
  renderModelPool();
  renderWorkflow();
  const selected = modelPoolState.profiles.find((profile) => profile.id === modelPoolState.assignments[target]);
  const label = `${target === "commander" ? "项目经理" : target} 已切换为${selected ? `独立模型 ${selected.name}` : "主模型的子 Agent"}`;
  if (feedbackTarget === "settings") {
    const feedback = document.querySelector("#settings-agent-model-feedback");
    feedback.textContent = label;
    feedback.className = "model-save-feedback success";
  } else setModelPoolFeedback(label, "success");
  const runtime = await window.desktop.getModelStatus();
  setRuntimeState(runtime.configured, runtime.configured ? `${runtime.model} 已连接` : "模型待配置");
}

async function loadModelPool() {
  if (!window.desktop?.getModelPool) { renderModelPool(); setModelPoolFeedback("模型池仅在 Electron 桌面版中可用", "error"); return; }
  try { modelPoolState = await window.desktop.getModelPool(); renderModelPool(); renderWorkflow(); }
  catch (error) { setModelPoolFeedback(`读取模型池失败：${error.message}`, "error"); }
}

function applyPoolProviderDefaults() {
  const form = document.querySelector("#model-profile-form");
  const defaults = { openai: "https://api.openai.com/v1", anthropic: "https://api.anthropic.com", google: "https://generativelanguage.googleapis.com", deepseek: "https://api.deepseek.com/v1", custom: "" };
  form.baseUrl.value = defaults[form.provider.value];
}

function openModelProfileDialog(profile = null) {
  const dialog = document.querySelector("#model-profile-dialog");
  const form = document.querySelector("#model-profile-form");
  form.reset();
  form.id.value = profile?.id || "";
  form.name.value = profile?.name || "";
  form.provider.value = profile?.provider || "openai";
  form.model.value = profile?.model || "";
  if (profile) form.baseUrl.value = profile.baseUrl;
  else applyPoolProviderDefaults();
  form.apiKey.placeholder = profile?.apiKeyConfigured ? "已安全保存，留空则继续使用" : "输入密钥";
  document.querySelector("#pool-api-key-hint").textContent = profile?.apiKeyConfigured ? "密钥已加密保存；输入新密钥可替换" : "密钥由 Windows 系统加密后保存在本机";
  document.querySelector("#model-profile-dialog-title").textContent = profile ? "编辑模型连接" : "添加模型连接";
  dialog.showModal();
}

async function executeNextTask(taskId) {
  const task = taskId ? tasks.find((item) => item.id === taskId) : tasks.find((item) => item.status === "todo");
  if (!task) { eventLog.unshift("没有可执行的待处理任务"); render(); return; }
  if (!window.desktop?.executeAgentTask) { eventLog.unshift("请使用 Electron 桌面版运行真实 Agent"); render(); return; }
  const button = document.querySelector("#run-queue-button");
  const workflowButton = document.querySelector("#workflow-run-button");
  button.disabled = true; button.textContent = "Agent 执行中";
  workflowButton.disabled = true; workflowButton.textContent = "团队执行中";
  tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "progress", running: true, startedAt: Date.now() } : item); eventLog.unshift(`灵灵正在分析“${task.title}”`); saveTasks(); render();
  try {
    const response = await window.desktop.executeAgentTask({ task, skills: skillMap(), context: getTeamContext(), autoGit: executionSettings.autoGit !== false });
    const files = response.runs.flatMap((run) => run.artifacts || []);
    const passed = response.verification?.passed !== false;
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: passed ? "done" : "todo", running: false, error: passed ? null : "自动验证未通过", agent: response.delegateTo, plan: response.plan, runs: response.runs, artifacts: files, result: response.result, verification: response.verification, git: response.git, pluginsUsed: response.pluginsUsed, sandbox: response.sandbox, taskRoot: response.taskRoot, completedAt: response.completedAt } : item);
    eventLog.unshift(passed ? `${response.runs.length} 个子 Agent 步骤已完成“${task.title}”，${response.verification.checkCount} 项检查通过` : `“${task.title}”自动修复后仍有检查失败，已退回待处理`);
    const teamReport = response.runs.map((run, index) => `${index + 1}. ${run.delegateTo} · ${run.title}${run.model ? ` · ${run.model}` : ""}\n${run.summary}`).join("\n\n");
    const artifactReport = files.length ? files.map((file) => `- ${file.relativePath}`).join("\n") : "- 本次仅交付文本结果";
    const verificationReport = `检查 ${response.verification?.checkCount || 0} 项，自动修复 ${response.verification?.repairCount || 0} 轮，结果：${passed ? "通过" : "未通过"}${response.git?.revision ? `，Git ${response.git.revision}` : ""}`;
    chatMessages.push({ role: "assistant", content: `## ${task.title} · ${passed ? "团队已完成" : "需要继续处理"}\n\n${teamReport}\n\n### 生成文件\n${artifactReport}\n\n### 真实执行\n${verificationReport}\n\n### 主 Agent 验收\n${response.result}` });
    renderChat();
  } catch (error) {
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "todo", running: false, error: error.message } : item); eventLog.unshift(`执行失败：${error.message}`);
  } finally { button.disabled = false; button.textContent = "AI 执行下一任务"; workflowButton.disabled = false; saveTasks(); render(); }
}

function showAgentMenu(agentId, x, y) {
  selectedAgentId = agentId;
  const menu = document.querySelector("#agent-context-menu");
  const isManager = agentId === "manager";
  const agent = isManager ? { name: "灵灵", role: "项目经理 Agent", sprite: "manager" } : officeAgents.find((item) => item.id === agentId);
  if (!agent) return;
  const status = isManager ? { progress: tasks.length ? Math.round(tasks.filter((task) => task.status === "done").length / tasks.length * 100) : 0, task: "正在巡查团队" } : getAgentStatus(agent);
  document.querySelector("#context-agent-image").src = `assets/agents/${agent.sprite}.png`;
  document.querySelector("#context-agent-name").textContent = agent.name;
  document.querySelector("#context-agent-role").textContent = agent.role;
  document.querySelector("#context-progress").value = status.progress;
  document.querySelector("#context-progress-label").textContent = `${status.progress}%`;
  document.querySelector("#context-task-label").textContent = status.task;
  document.querySelector("#context-edit-agent").hidden = isManager;
  document.querySelector("#context-delete-agent").hidden = isManager;
  menu.hidden = false;
  positionFloatingMenu(menu, x, y);
}
function hideAgentMenu() { document.querySelector("#agent-context-menu").hidden = true; }

function renderChat() {
  const messages = document.querySelector("#chat-messages");
  messages.innerHTML = `<article class="chat-message assistant"><p>告诉我你要交付什么。我可以分析问题，也可以创建任务并调用完整 Agent 团队执行。</p></article>${chatMessages.map((message, index) => `<article class="chat-message ${message.role} ${message.pending ? "pending" : ""}"><div>${formatChatContent(message.content)}</div>${message.action ? `<button class="chat-action-button" type="button" data-chat-action="${index}">${message.action.type === "create_and_execute" ? "创建并交给团队执行" : "创建任务"}</button>` : ""}${message.role === "assistant" && !message.pending ? chatSpeakButton("main", index) : ""}</article>`).join("")}`;
  messages.scrollTop = messages.scrollHeight;
}
async function sendChat(content) {
  const command = parseWorkflowChatCommand(content);
  chatMessages.push({ role: "user", content }); chatMessages.push({ role: "assistant", content: `${command.targetLabel}正在处理…`, label: command.targetLabel, pending: true }); renderChat();
  document.querySelector("#chat-target").textContent = `@${command.targetLabel} · ${command.targetAgent === "commander" ? "主 Agent" : "单独执行"}`;
  try {
    if (!window.desktop?.chat) throw new Error("请先使用 Electron 桌面版并配置模型 API");
    const result = await window.desktop.chat({ messages: chatMessages.filter((message) => !message.pending).map(({ role, content: text }) => ({ role, content: text })), context: getTeamContext(), targetAgent: command.targetAgent, invokedSkills: command.invokedSkills });
    chatMessages[chatMessages.length - 1] = { role: "assistant", content: result.content, action: result.action, label: command.targetLabel };
    maybeAutoSpeak(result.content);
  } catch (error) { chatMessages[chatMessages.length - 1] = { role: "assistant", content: `暂时无法回答：${error.message}`, label: command.targetLabel }; }
  renderChat();
}
function formatChatContent(content) {
  const escaped = escapeHtml(content);
  return escaped.replace(/```([\w-]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
}
async function applyChatAction(index) {
  const message = chatMessages[index];
  const action = message?.action;
  if (!action || !["create_task", "create_and_execute"].includes(action.type)) return;
  const validAgents = roleAgents.map(([, name]) => name);
  const task = { id: crypto.randomUUID(), title: String(action.title || "AI 创建的任务").slice(0, 60), description: String(action.description || "").slice(0, 1000), agent: validAgents.includes(action.agent) ? action.agent : "技术主管 Agent", priority: ["high", "medium", "low"].includes(action.priority) ? action.priority : "medium", status: "todo", createdAt: new Date().toISOString() };
  tasks.unshift(task); message.action = null; saveTasks(); render(); renderChat();
  eventLog.unshift(`灵灵从对话创建了“${task.title}”`);
  if (action.type === "create_and_execute") await executeNextTask(task.id);
}

function selectedSandboxTask() {
  const taskId = document.querySelector("#sandbox-task-select").value;
  return tasks.find((task) => task.id === taskId) || null;
}

async function refreshSelectedGitStatus() {
  const task = selectedSandboxTask();
  const state = document.querySelector("#sandbox-action-state");
  if (!task) { state.textContent = "当前没有可操作的任务工程。"; state.className = ""; return; }
  try {
    const result = await window.desktop.getTaskGitStatus(task.id);
    state.textContent = result.initialized ? `Git ${result.revision || "已初始化"} · ${result.clean ? "工作区干净" : `${result.changes.length} 项变更`}` : "该任务尚未创建 Git 版本。";
    state.className = result.initialized && result.clean ? "success" : "";
  } catch (error) { state.textContent = `Git 状态读取失败：${error.message}`; state.className = "error"; }
}

async function verifySelectedTask() {
  const task = selectedSandboxTask();
  const state = document.querySelector("#sandbox-action-state");
  if (!task) { state.textContent = "请先选择任务工程。"; return; }
  const button = document.querySelector("#verify-task-button");
  button.disabled = true; button.textContent = "验证中";
  try {
    const verification = await window.desktop.verifyTaskProject(task.id);
    tasks = tasks.map((item) => item.id === task.id ? { ...item, manualVerification: verification } : item);
    saveTasks(); renderSandbox();
    state.textContent = verification.passed ? `${verification.checks.length} 项检查全部通过。` : `${verification.checks.filter((check) => check.status !== "passed").length} 项检查未通过。`;
    state.className = verification.passed ? "success" : "error";
  } catch (error) { state.textContent = `验证失败：${error.message}`; state.className = "error"; }
  finally { button.disabled = false; button.textContent = "重新验证"; }
}

async function snapshotSelectedTask() {
  const task = selectedSandboxTask();
  const state = document.querySelector("#sandbox-action-state");
  if (!task) { state.textContent = "请先选择任务工程。"; return; }
  const button = document.querySelector("#snapshot-task-button");
  button.disabled = true; button.textContent = "提交中";
  try {
    const git = await window.desktop.createTaskGitSnapshot(task.id, `AI Team：${task.title}`);
    tasks = tasks.map((item) => item.id === task.id ? { ...item, git } : item);
    saveTasks(); renderSandbox();
    state.textContent = git.ok ? (git.committed ? `Git 版本 ${git.revision} 已创建。` : git.message) : `Git 失败：${git.error}`;
    state.className = git.ok ? "success" : "error";
  } catch (error) { state.textContent = `Git 失败：${error.message}`; state.className = "error"; }
  finally { button.disabled = false; button.textContent = "创建 Git 版本"; }
}

function activateView(name, options = {}) {
  if (!name || name === activeViewName) return;
  if (!options.fromBack && !options.replace) viewHistory.push(activeViewName);
  activeViewName = name;
  if (name !== "workflow") lastStudioView = name;
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === name));
  if (name === "sandbox") refreshSandboxPolicy();
  if (name === "memory") requestAnimationFrame(drawMemoryGraph);
}

function goBackView() {
  if (activeViewName === "workflow" && interfaceMode === "workflow") { viewHistory = []; switchInterfaceMode("studio"); return; }
  const target = viewHistory.pop() || (interfaceMode === "workflow" ? "workflow" : "projects");
  activateView(target, { fromBack: true });
}

function installViewBackButtons() {
  document.querySelectorAll('[data-view-panel]:not([data-view-panel="projects"]) > .topbar').forEach((header) => {
    if (header.querySelector("[data-view-back]")) return;
    const title = header.firstElementChild;
    const group = document.createElement("div");
    group.className = "topbar-title-group";
    const button = document.createElement("button");
    button.className = "icon-button view-back-button";
    button.type = "button";
    button.dataset.viewBack = "";
    button.title = "返回上一页";
    button.setAttribute("aria-label", "返回上一页");
    button.textContent = "←";
    header.insertBefore(group, title);
    group.append(button, title);
  });
  document.querySelectorAll("[data-view-back]").forEach((button) => button.addEventListener("click", goBackView));
  document.body.append(document.querySelector("#workflow-context-menu"), document.querySelector("#agent-context-menu"));
}
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.openView)));
document.querySelectorAll("[data-interface-mode]").forEach((button) => button.addEventListener("click", () => switchInterfaceMode(button.dataset.interfaceMode)));
document.querySelector("#workflow-task-select").addEventListener("change", (event) => { selectedWorkflowTaskId = event.target.value || null; selectedWorkflowNodeId = "commander"; renderWorkflow(); });
document.querySelectorAll("[data-workflow-mode]").forEach((button) => button.addEventListener("click", () => {
  workflowEditorState.activeMode = button.dataset.workflowMode;
  const template = window.WorkflowState.templates[workflowEditorState.activeMode];
  selectedWorkflowNodeId = template.nodes.find((node) => node.manager)?.id || template.nodes[0]?.id;
  workflowConnectSource = null;
  saveWorkflowEditor();
  document.querySelectorAll("[data-workflow-mode]").forEach((item) => item.classList.toggle("active", item === button));
  renderWorkflow();
  requestAnimationFrame(centerWorkflowCanvas);
}));
document.querySelector("#workflow-add-node").addEventListener("click", () => openWorkflowNodeDialog());
document.querySelector("#workflow-connect").addEventListener("click", () => {
  if (document.querySelector("#workflow-canvas").classList.contains("connecting")) cancelWorkflowConnection();
  else {
    document.querySelector("#workflow-connect").classList.add("active");
    document.querySelector("#workflow-canvas").classList.add("connecting");
    document.querySelector("#workflow-canvas-hint").textContent = "连线模式：先点击起点，再点击目标节点";
  }
});
document.querySelector("#workflow-models").addEventListener("click", () => activateView("model-pool"));
document.querySelector("#workflow-nodes").addEventListener("click", (event) => {
  const element = event.target.closest("[data-workflow-node]");
  if (!element || workflowSuppressClick) return;
  const id = element.dataset.workflowNode;
  if (document.querySelector("#workflow-canvas").classList.contains("connecting")) {
    if (!workflowConnectSource) startWorkflowConnection(id); else finishWorkflowConnection(id);
    return;
  }
  selectedWorkflowNodeId = id;
  renderWorkflow();
});
document.querySelector("#workflow-nodes").addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || document.querySelector("#workflow-canvas").classList.contains("connecting")) return;
  const element = event.target.closest("[data-workflow-node]");
  if (!element) return;
  const node = currentWorkflow?.nodes.find((item) => item.id === element.dataset.workflowNode);
  if (!node) return;
  workflowDragging = { id: node.id, element, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y, moved: false };
  element.setPointerCapture?.(event.pointerId);
  element.classList.add("dragging");
});
document.addEventListener("pointermove", (event) => {
  if (!workflowDragging && workflowConnectSource) updateWorkflowConnectionPreview(event);
  if (!workflowDragging) return;
  const dx = (event.clientX - workflowDragging.startX) / workflowScale;
  const dy = (event.clientY - workflowDragging.startY) / workflowScale;
  if (Math.abs(dx) + Math.abs(dy) > 3) workflowDragging.moved = true;
  const x = Math.max(0, Math.round(workflowDragging.nodeX + dx));
  const y = Math.max(0, Math.round(workflowDragging.nodeY + dy));
  workflowDragging.element.style.left = `${x}px`;
  workflowDragging.element.style.top = `${y}px`;
  const node = currentWorkflow.nodes.find((item) => item.id === workflowDragging.id);
  if (node) { node.x = x; node.y = y; }
  const byId = Object.fromEntries(currentWorkflow.nodes.map((item) => [item.id, item]));
  document.querySelectorAll("[data-workflow-edge]").forEach((path) => { const edge = currentWorkflow.edges.find((item) => item.id === path.dataset.workflowEdge); if (edge) path.setAttribute("d", workflowPath(edge, byId)); });
});
document.addEventListener("pointerup", () => {
  if (!workflowDragging) return;
  workflowDragging.element.classList.remove("dragging");
  if (workflowDragging.moved) {
    const node = currentWorkflow.nodes.find((item) => item.id === workflowDragging.id);
    getWorkflowModeState().positions[workflowDragging.id] = { x: node.x, y: node.y };
    saveWorkflowEditor();
  }
  const moved = workflowDragging.moved;
  workflowDragging = null;
  if (moved) { workflowSuppressClick = true; setTimeout(() => { workflowSuppressClick = false; }, 0); }
});
function positionFloatingMenu(menu, clientX, clientY) {
  menu.style.left = "0px";
  menu.style.top = "0px";
  const bounds = menu.getBoundingClientRect();
  const margin = 10;
  const left = clientX + bounds.width + margin > innerWidth ? clientX - bounds.width - 8 : clientX + 8;
  const top = clientY + bounds.height + margin > innerHeight ? clientY - bounds.height - 8 : clientY + 8;
  menu.style.left = `${Math.max(margin, Math.min(left, innerWidth - bounds.width - margin))}px`;
  menu.style.top = `${Math.max(margin, Math.min(top, innerHeight - bounds.height - margin))}px`;
}

document.querySelector("#workflow-nodes").addEventListener("contextmenu", (event) => {
  const element = event.target.closest("[data-workflow-node]");
  if (!element) return;
  event.preventDefault();
  workflowContextNodeId = element.dataset.workflowNode;
  selectedWorkflowNodeId = workflowContextNodeId;
  renderWorkflowInspector(currentWorkflow);
  const menu = document.querySelector("#workflow-context-menu");
  const node = currentWorkflow.nodes.find((item) => item.id === workflowContextNodeId);
  menu.querySelector('[data-workflow-action="delete"]').hidden = Boolean(node?.manager || node?.type === "manager");
  menu.hidden = false;
  positionFloatingMenu(menu, event.clientX, event.clientY);
});
document.querySelector("#workflow-context-menu").addEventListener("click", (event) => {
  const action = event.target.dataset.workflowAction;
  const node = currentWorkflow?.nodes.find((item) => item.id === workflowContextNodeId);
  if (!action || !node) return;
  document.querySelector("#workflow-context-menu").hidden = true;
  if (action === "edit") openWorkflowNodeDialog(node);
  if (action === "progress") document.querySelector("#workflow-node-progress").focus();
  if (action === "connect") startWorkflowConnection(node.id);
  if (action === "delete" && confirm(uiText(`确定从当前工作流删除“${node.title}”吗？`))) deleteWorkflowNode(node.id);
});
document.addEventListener("click", (event) => { if (!event.target.closest("#workflow-context-menu")) document.querySelector("#workflow-context-menu").hidden = true; });
document.querySelector("#workflow-node-progress").addEventListener("input", (event) => { document.querySelector("#workflow-node-progress-label").textContent = `${event.target.value}%`; });
document.querySelector("#workflow-node-progress").addEventListener("change", (event) => { if (selectedWorkflowNodeId) updateWorkflowNodeProgress(selectedWorkflowNodeId, event.target.value); });
document.querySelector("#workflow-node-model").addEventListener("change", async (event) => {
  const node = currentWorkflow?.nodes.find((item) => item.id === selectedWorkflowNodeId);
  if (!node) return;
  const target = workflowNodeTarget(node);
  try {
    if (target && window.desktop?.assignModelProfile) modelPoolState = await window.desktop.assignModelProfile(target, event.target.value || null);
    else {
      const editor = getWorkflowModeState();
      editor.nodeOverrides[node.id] = { ...(editor.nodeOverrides[node.id] || {}), modelProfile: event.target.value || "" };
      saveWorkflowEditor();
    }
    renderWorkflow();
  } catch (error) { setModelPoolFeedback(`节点模型保存失败：${error.message}`, "error"); renderWorkflow(); }
});
document.querySelector("#workflow-edge-list").addEventListener("click", (event) => { if (event.target.dataset.workflowEdgeDelete) removeWorkflowEdge(event.target.dataset.workflowEdgeDelete); });
document.querySelector("#workflow-zoom-out").addEventListener("click", () => setWorkflowScale(workflowScale - .1));
document.querySelector("#workflow-zoom-in").addEventListener("click", () => setWorkflowScale(workflowScale + .1));
document.querySelector("#workflow-center").addEventListener("click", centerWorkflowCanvas);
document.querySelector("#workflow-run-button").addEventListener("click", () => { if (selectedWorkflowTaskId) executeNextTask(selectedWorkflowTaskId); });

document.querySelector("#auto-git-toggle").addEventListener("change", (event) => { executionSettings.autoGit = event.target.checked; saveExecutionSettings(); });
document.querySelector("#refresh-sandbox-button").addEventListener("click", async () => { await refreshSandboxPolicy(); await refreshSelectedGitStatus(); });
document.querySelector("#sandbox-task-select").addEventListener("change", refreshSelectedGitStatus);
document.querySelector("#verify-task-button").addEventListener("click", verifySelectedTask);
document.querySelector("#snapshot-task-button").addEventListener("click", snapshotSelectedTask);
document.querySelector("#open-task-project-button").addEventListener("click", async () => { const task = selectedSandboxTask(); const state = document.querySelector("#sandbox-action-state"); if (!task) { state.textContent = "请先选择任务工程。"; return; } try { const result = await window.desktop.openTaskProject(task.id); state.textContent = `已打开：${result.path}`; state.className = "success"; } catch (error) { state.textContent = `打开失败：${error.message}`; state.className = "error"; } });

const taskDialog = document.querySelector("#task-dialog");
document.querySelector("#new-task-button").addEventListener("click", () => taskDialog.showModal());
document.querySelector("#task-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); tasks.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), description: data.get("description").trim(), agent: data.get("agent"), priority: data.get("priority"), status: "todo", createdAt: new Date().toISOString() }); saveTasks(); render(); event.currentTarget.reset(); taskDialog.close(); });
document.querySelector("#run-queue-button").addEventListener("click", () => executeNextTask());
document.querySelectorAll("#audit-kind-filter,#audit-status-filter,#audit-search").forEach((control) => control.addEventListener("input", renderAudit));
document.querySelector("#refresh-audit-button").addEventListener("click", renderAudit);
document.querySelector("#export-audit-button").addEventListener("click", async () => { const button = document.querySelector("#export-audit-button"); const state = document.querySelector("#audit-export-state"); button.disabled = true; button.textContent = "导出中"; try { if (!window.desktop?.exportAudit) throw new Error("请在 Electron 桌面版中导出报告"); const records = getFilteredAuditRecords(); const result = await window.desktop.exportAudit({ formatVersion: 1, generatedAt: new Date().toISOString(), filters: { kind: document.querySelector("#audit-kind-filter").value, status: document.querySelector("#audit-status-filter").value, search: document.querySelector("#audit-search").value }, summary: { records: records.length, tasks: records.filter((record) => record.kind === "任务").length, deployments: records.filter((record) => record.kind === "部署").length }, records }); state.textContent = result.canceled ? "已取消导出" : `审计报告已导出：${result.path}`; state.className = "audit-export-state success"; } catch (error) { state.textContent = `导出失败：${error.message}`; state.className = "audit-export-state error"; } finally { button.disabled = false; button.textContent = "导出审计报告"; } });

document.querySelector("#desk-grid").addEventListener("contextmenu", (event) => { const pet = event.target.closest("[data-agent-id]"); if (!pet) return; event.preventDefault(); showAgentMenu(pet.dataset.agentId, event.clientX, event.clientY); });
document.querySelector("#manager-character").addEventListener("contextmenu", (event) => { event.preventDefault(); showAgentMenu("manager", event.clientX, event.clientY); });
document.addEventListener("click", (event) => { if (!event.target.closest("#agent-context-menu")) hideAgentMenu(); });
document.querySelector("#context-edit-agent").addEventListener("click", () => { const agent = officeAgents.find((item) => item.id === selectedAgentId); if (!agent) return; const form = document.querySelector("#agent-form"); form.querySelector('[name="id"]').value = agent.id; form.querySelector('[name="name"]').value = agent.name; form.querySelector('[name="role"]').value = agent.role; hideAgentMenu(); document.querySelector("#agent-dialog").showModal(); });
document.querySelector("#context-delete-agent").addEventListener("click", () => { const agent = officeAgents.find((item) => item.id === selectedAgentId); if (!agent || !confirm(uiText(`确定删除 ${agent.name} 吗？`))) return; officeAgents = officeAgents.filter((item) => item.id !== selectedAgentId); saveAgents(); hideAgentMenu(); render(); });
document.querySelector("#agent-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); officeAgents = officeAgents.map((agent) => agent.id === data.get("id") ? { ...agent, name: data.get("name").trim(), role: data.get("role") } : agent); saveAgents(); render(); document.querySelector("#agent-dialog").close(); });

document.querySelector("#chat-form").addEventListener("submit", (event) => { event.preventDefault(); const input = document.querySelector("#chat-input"); const content = input.value.trim(); if (!content) return; input.value = ""; document.querySelector("#chat-candidates").hidden = true; sendChat(content); });
document.querySelector("#chat-input").addEventListener("input", renderChatCandidates);
document.querySelector("#chat-input").addEventListener("keydown", (event) => { if (event.key === "Escape") document.querySelector("#chat-candidates").hidden = true; if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); document.querySelector("#chat-form").requestSubmit(); } });
document.querySelector("#chat-candidates").addEventListener("click", (event) => { const button = event.target.closest("[data-chat-token]"); if (!button) return; const input = document.querySelector("#chat-input"); const before = input.value.slice(0, input.selectionStart).replace(/(^|\s)[@/][^\s@/]*$/, (match, prefix) => `${prefix}${button.dataset.chatToken} `); input.value = before + input.value.slice(input.selectionStart); input.focus(); input.selectionStart = input.selectionEnd = before.length; document.querySelector("#chat-candidates").hidden = true; });
document.querySelectorAll(".chat-suggestions button").forEach((button) => button.addEventListener("click", () => sendChat(button.textContent)));
document.querySelector("#clear-chat-button").addEventListener("click", () => { chatMessages = []; renderChat(); });
document.querySelector("#chat-messages").addEventListener("click", (event) => { const index = event.target.dataset.chatAction; if (index !== undefined) applyChatAction(Number(index)); });

async function chooseWorkspace() {
  if (!window.desktop?.chooseWorkspace) return;
  const result = await window.desktop.chooseWorkspace();
  setWorkspaceState(result.path || null);
}
function setWorkspaceState(nextPath) {
  workspacePath = nextPath;
  const shortName = nextPath ? nextPath.split(/[\\/]/).filter(Boolean).pop() : "选择工作目录";
  document.querySelector("#workspace-label").textContent = shortName;
  document.querySelector("#workspace-path").value = nextPath || "";
  document.querySelector("#chat-workspace-label").textContent = nextPath ? `产物目录：${shortName}` : "未选择工作目录";
  if (nextPath) refreshDelivery(); else clearDeliveryReport();
}
document.querySelector("#workspace-button").addEventListener("click", chooseWorkspace);
document.querySelector("#settings-workspace-button").addEventListener("click", chooseWorkspace);

document.querySelector("#refresh-delivery-button").addEventListener("click", refreshDelivery);
document.querySelector("#open-delivery-button").addEventListener("click", async () => {
  try { await window.desktop?.openDeliveryPath?.(lastReleasePath || deliveryReport?.outputRoot); }
  catch (error) { eventLog.unshift(`打开交付目录失败：${error.message}`); renderOrchestrator(); }
});
document.querySelector("#release-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "正在生成";
  try {
    const release = await window.desktop.createDeliveryRelease({ version: data.get("version"), channel: data.get("channel"), notes: data.get("notes") });
    lastReleasePath = release.releasePath;
    document.querySelector("#release-form-state").textContent = `${release.version} 已生成`;
    document.querySelector("#release-form-state").classList.add("connected");
    deploymentRecords.unshift({ id: crypto.randomUUID(), version: release.version, environment: release.channel, status: "候选已创建", note: `包含 ${release.artifactCount} 个校验产物`, url: "", createdAt: release.createdAt });
    saveDeployments(); renderDeploymentHistory(); await refreshDelivery();
  } catch (error) { document.querySelector("#release-form-state").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "生成清单与发布说明"; }
});
document.querySelector("#deployment-form").addEventListener("submit", (event) => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  const version = document.querySelector('#release-form [name="version"]').value.trim();
  deploymentRecords.unshift({ id: crypto.randomUUID(), version, environment: data.get("environment"), status: data.get("status"), url: data.get("url").trim(), note: data.get("note").trim(), createdAt: new Date().toISOString() });
  saveDeployments(); renderDeploymentHistory(); event.currentTarget.reset();
});
document.querySelector("#agent-release-review-button").addEventListener("click", async () => {
  if (!deliveryReport) await refreshDelivery();
  const project = deliveryReport?.project?.name || "当前项目";
  const task = { id: crypto.randomUUID(), title: `发布前评审：${project}`.slice(0, 60), description: `对 ${project} 执行发布前联合评审。检查构建、自动化测试、安全风险、代码质量、回滚方案和交付产物完整性，输出明确的通过或阻断结论。`, agent: "DevOps Agent", priority: "high", status: "todo", createdAt: new Date().toISOString() };
  tasks.unshift(task); saveTasks(); render(); activateView("orchestrator"); await executeNextTask(task.id);
});

function setIntegrationStatus(configured) {
  const state = document.querySelector("#github-token-state");
  state.textContent = configured ? "令牌已加密保存" : "未配置令牌";
  state.classList.toggle("connected", configured);
  const status = document.querySelector("#integration-status");
  status.classList.toggle("connected", configured);
  status.querySelector("span:last-child").textContent = configured ? "令牌访问模式" : "公开访问模式";
}
function setIntegrationFeedback(id, message, type = "") {
  const state = document.querySelector(id);
  state.textContent = message;
  state.className = `integration-form-state ${type}`.trim();
}
document.querySelector("#integration-settings-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  try {
    const result = await window.desktop.configureIntegrations({ githubToken: data.get("githubToken").trim() });
    setIntegrationStatus(result.githubTokenConfigured);
    event.currentTarget.githubToken.value = "";
    setIntegrationFeedback("#integration-token-feedback", "连接已由 Windows 加密保存，重启后仍然有效。", "success");
  } catch (error) { setIntegrationFeedback("#integration-token-feedback", `保存失败：${error.message}`, "error"); }
});
document.querySelector("#test-integration-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true; button.textContent = "测试中";
  try {
    const result = await window.desktop.testIntegration();
    setIntegrationFeedback("#integration-token-feedback", `${result.account} 连接成功 · 剩余请求 ${result.remaining}/${result.limit}`, "success");
  } catch (error) { setIntegrationFeedback("#integration-token-feedback", `连接失败：${error.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "测试连接"; }
});
document.querySelector("#clear-integration-token").addEventListener("click", async () => { const result = await window.desktop?.clearIntegrations?.(); setIntegrationStatus(result?.githubTokenConfigured); document.querySelector("#integration-settings-form").reset(); setIntegrationFeedback("#integration-token-feedback", "已清除本机保存的 GitHub 令牌", "success"); });
document.querySelector("#repository-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "正在读取";
  try { const repository = await window.desktop.inspectRepository(data.get("repository")); externalResources = externalResources.filter((resource) => resource.type !== "repository" || resource.data.id !== repository.id); externalResources.unshift({ id: crypto.randomUUID(), type: "repository", data: repository, createdAt: new Date().toISOString() }); saveExternalResources(); renderExternalResources(); renderWorkflow(); setIntegrationFeedback("#repository-form-state", `已连接 ${repository.name} · ${repository.files.length} 个文件`, "success"); event.currentTarget.reset(); }
  catch (error) { eventLog.unshift(`仓库读取失败：${error.message}`); setIntegrationFeedback("#repository-form-state", `读取失败：${error.message}`, "error"); renderOrchestrator(); }
  finally { button.disabled = false; button.textContent = "连接仓库"; }
});
document.querySelector("#document-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "正在读取";
  try { const documentResource = await window.desktop.fetchDocument(data.get("url")); externalResources = externalResources.filter((resource) => resource.type !== "document" || resource.data.url !== documentResource.url); externalResources.unshift({ id: crypto.randomUUID(), type: "document", data: documentResource, createdAt: new Date().toISOString() }); saveExternalResources(); renderExternalResources(); renderWorkflow(); setIntegrationFeedback("#document-form-state", `已读取 ${documentResource.title}`, "success"); event.currentTarget.reset(); }
  catch (error) { eventLog.unshift(`资料读取失败：${error.message}`); setIntegrationFeedback("#document-form-state", `读取失败：${error.message}`, "error"); renderOrchestrator(); }
  finally { button.disabled = false; button.textContent = "读取资料"; }
});
document.querySelector("#external-resources").addEventListener("click", async (event) => { const id = event.target.dataset.deleteResource; const url = event.target.dataset.openResource; if (url) { try { await window.desktop.openExternal(url); } catch (error) { setIntegrationFeedback("#document-form-state", `无法打开链接：${error.message}`, "error"); } return; } if (!id) return; externalResources = externalResources.filter((resource) => resource.id !== id); saveExternalResources(); renderExternalResources(); renderWorkflow(); });
document.querySelector("#clear-resources-button").addEventListener("click", () => { if (!externalResources.length || confirm(uiText("确定清空所有外部资源吗？"))) { externalResources = []; saveExternalResources(); renderExternalResources(); renderWorkflow(); } });

document.querySelector("#new-model-profile-button").addEventListener("click", () => openModelProfileDialog());
document.querySelectorAll("[data-close-model-profile]").forEach((button) => button.addEventListener("click", () => document.querySelector("#model-profile-dialog").close()));
document.querySelector("#pool-provider-select").addEventListener("change", applyPoolProviderDefaults);
document.querySelector("#model-profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#save-model-profile-button");
  const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "保存中";
  try {
    modelPoolState = await window.desktop.saveModelProfile({ id: data.get("id") || undefined, name: data.get("name").trim(), provider: data.get("provider"), baseUrl: data.get("baseUrl").trim(), model: data.get("model").trim(), apiKey: data.get("apiKey").trim() });
    renderModelPool();
    document.querySelector("#model-profile-dialog").close();
    setModelPoolFeedback("模型连接已由 Windows 加密保存并加入路由池", "success");
  } catch (error) { setModelPoolFeedback(`保存失败：${error.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "保存连接"; }
});
document.querySelector("#model-profile-list").addEventListener("click", async (event) => {
  const editId = event.target.dataset.profileEdit;
  const testId = event.target.dataset.profileTest;
  const deleteId = event.target.dataset.profileDelete;
  if (editId) { openModelProfileDialog(modelPoolState.profiles.find((profile) => profile.id === editId)); return; }
  if (testId) {
    const button = event.target; button.disabled = true; button.classList.add("testing");
    try { const result = await window.desktop.testModelProfile(testId); setModelPoolFeedback(`${result.profileName} 连接成功：${result.message}`, "success"); }
    catch (error) { setModelPoolFeedback(`连接测试失败：${error.message}`, "error"); }
    finally { button.disabled = false; button.classList.remove("testing"); }
    return;
  }
  if (deleteId && confirm(uiText("确定删除这个模型连接吗？相关智能体将自动回退到主模型。"))) {
    try { modelPoolState = await window.desktop.deleteModelProfile(deleteId); renderModelPool(); setModelPoolFeedback("模型连接已删除，相关路由已回退", "success"); }
    catch (error) { setModelPoolFeedback(`删除失败：${error.message}`, "error"); }
  }
});
document.querySelector("#model-routing-list").addEventListener("change", async (event) => {
  const target = event.target.dataset.modelTarget;
  if (!target) return;
  event.target.disabled = true;
  try {
    await saveModelAssignment(target, event.target.value, "pool");
  } catch (error) { setModelPoolFeedback(`路由保存失败：${error.message}`, "error"); renderModelPool(); }
});
document.querySelector("#settings-agent-routing-list").addEventListener("change", async (event) => {
  const target = event.target.dataset.settingsModelTarget;
  if (!target) return;
  event.target.disabled = true;
  try { await saveModelAssignment(target, event.target.value, "settings"); }
  catch (error) {
    const feedback = document.querySelector("#settings-agent-model-feedback");
    feedback.textContent = `Agent 模型保存失败：${error.message}`;
    feedback.className = "model-save-feedback error";
    renderModelPool();
  }
});
document.querySelector("#settings-open-model-pool").addEventListener("click", () => activateView("model-pool"));

document.querySelectorAll("[data-close-workflow-node]").forEach((button) => button.addEventListener("click", () => document.querySelector("#workflow-node-dialog").close()));
document.querySelector("#workflow-node-form").progress.addEventListener("input", (event) => { document.querySelector("#workflow-dialog-progress-label").textContent = `${event.target.value}%`; });
document.querySelector("#workflow-node-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const editor = getWorkflowModeState();
  let id = data.get("id");
  const existing = currentWorkflow?.nodes.find((node) => node.id === id);
  if (existing) {
    editor.nodeOverrides[id] = { ...(editor.nodeOverrides[id] || {}), title: data.get("title").trim(), subtitle: data.get("subtitle").trim(), code: (data.get("code").trim() || existing.code || "ND").slice(0, 6), role: data.get("role") || existing.role || "", progress: Number(data.get("progress")) };
  } else {
    id = `node-${crypto.randomUUID()}`;
    const viewport = document.querySelector("#workflow-viewport");
    editor.customNodes.push({ id, title: data.get("title").trim(), subtitle: data.get("subtitle").trim(), code: (data.get("code").trim() || "TASK").slice(0, 6), type: data.get("type"), role: data.get("role") || "", progress: Number(data.get("progress")), x: Math.round((viewport.scrollLeft + 280) / workflowScale), y: Math.round((viewport.scrollTop + 180) / workflowScale), width: data.get("type") === "manager" ? 240 : 220 });
  }
  const role = data.get("role") || (existing ? workflowNodeTarget(existing) : "");
  if (role && window.desktop?.assignModelProfile) {
    try { modelPoolState = await window.desktop.assignModelProfile(role, data.get("modelProfile") || null); }
    catch (error) { setModelPoolFeedback(`节点已保存，但模型路由失败：${error.message}`, "error"); }
  } else editor.nodeOverrides[id] = { ...(editor.nodeOverrides[id] || {}), modelProfile: data.get("modelProfile") || "" };
  saveWorkflowEditor();
  selectedWorkflowNodeId = id;
  form.type.disabled = false;
  document.querySelector("#workflow-node-dialog").close();
  renderWorkflow();
});

document.querySelector("#workflow-chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#workflow-chat-input");
  const content = input.value.trim();
  if (!content) return;
  input.value = "";
  document.querySelector("#workflow-chat-candidates").hidden = true;
  sendWorkflowChat(content);
});
document.querySelector("#workflow-chat-input").addEventListener("input", renderWorkflowChatCandidates);
document.querySelector("#workflow-chat-input").addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); document.querySelector("#workflow-chat-form").requestSubmit(); } });
document.querySelector("#workflow-chat-candidates").addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-token]");
  if (!button) return;
  const input = document.querySelector("#workflow-chat-input");
  const before = input.value.slice(0, input.selectionStart).replace(/(^|\s)[@/][^\s@/]*$/, (match, prefix) => `${prefix}${button.dataset.chatToken} `);
  input.value = before + input.value.slice(input.selectionStart);
  input.focus();
  input.selectionStart = input.selectionEnd = before.length;
  document.querySelector("#workflow-chat-candidates").hidden = true;
});
document.querySelector("#workflow-clear-chat").addEventListener("click", () => { workflowChatMessages = []; saveWorkflowChat(); renderWorkflowChat(); });

document.querySelector("#skills-grid").addEventListener("change", (event) => { const skill = event.target.dataset.skill; if (!skill) return; event.target.checked ? enabledSkills.add(skill) : enabledSkills.delete(skill); saveEnabledSkills(); renderSkills(); renderWorkflow(); });
document.querySelector("#plugin-list").addEventListener("change", async (event) => { const pluginId = event.target.dataset.pluginId; if (!pluginId) return; const state = document.querySelector("#plugin-state"); event.target.disabled = true; try { pluginState = await window.desktop.setPluginEnabled(pluginId, event.target.checked); renderPlugins(); state.textContent = "插件状态已保存，下一次 Agent 调度立即生效。"; state.className = "plugin-note success"; } catch (error) { state.textContent = `插件保存失败：${error.message}`; state.className = "plugin-note error"; await loadPlugins(); } });
document.querySelector("#open-plugin-directory-button").addEventListener("click", async () => { const state = document.querySelector("#plugin-state"); try { const result = await window.desktop.openPluginDirectory(); state.textContent = `插件目录：${result.path}`; state.className = "plugin-note success"; } catch (error) { state.textContent = `无法打开插件目录：${error.message}`; state.className = "plugin-note error"; } });
document.querySelector("#import-plugin-button").addEventListener("click", async () => {
  const state = document.querySelector("#plugin-state");
  try {
    if (!window.desktop?.importPlugin) throw new Error("请使用 Electron 桌面版导入 Skill");
    const result = await window.desktop.importPlugin();
    if (result.canceled) { state.textContent = "已取消导入"; return; }
    pluginState = result.plugins || await window.desktop.getPlugins();
    renderPlugins();
    state.textContent = `已导入 ${result.plugin?.name || "自定义 Skill"}，启用后可通过 / 调用。`;
    state.className = "plugin-note success";
  } catch (error) { state.textContent = `Skill 导入失败：${error.message}`; state.className = "plugin-note error"; }
});
document.querySelector("#import-plugin-directory-button").addEventListener("click", async () => {
  const state = document.querySelector("#plugin-state");
  try {
    if (!window.desktop?.importPluginDirectory) throw new Error("请使用 Electron 桌面版导入 Skill 文件夹");
    const result = await window.desktop.importPluginDirectory();
    if (result.canceled) { state.textContent = "已取消导入"; return; }
    pluginState = result.plugins || await window.desktop.getPlugins();
    renderPlugins(); renderWorkflowChatCandidates(); renderChatCandidates();
    state.textContent = `已导入 ${result.plugin?.name || "自定义 Skill"}，启用后可通过 / 调用。`;
    state.className = "plugin-note success";
  } catch (error) { state.textContent = `Skill 文件夹导入失败：${error.message}`; state.className = "plugin-note error"; }
});
document.querySelector("#provider-select").addEventListener("change", applyProviderDefaults);
document.querySelector("#model-settings-form").addEventListener("submit", async (event) => { event.preventDefault(); const form = event.currentTarget; const button = document.querySelector("#save-model-button"); const config = getModelFormConfig(); button.disabled = true; button.textContent = "保存中"; setModelFeedback("正在调用 Windows 系统加密服务…"); try { const result = await configureRuntime(config); localStorage.removeItem("ai-software-team.model-settings"); form.apiKey.value = ""; applyModelSettings(result); setModelFeedback("保存成功，关闭并重新打开软件后仍可使用", "success"); eventLog.unshift(`灵灵已保存并连接 ${config.model}`); render(); } catch (error) { const status = await window.desktop?.getModelStatus?.().catch(() => null); if (status) setRuntimeState(status.configured, status.configured ? `${status.model} 已连接` : "模型待配置"); setModelFeedback(`保存失败：${error.message}`, "error"); eventLog.unshift(`配置失败：${error.message}`); renderOrchestrator(); } finally { button.disabled = false; button.textContent = "保存连接配置"; } });
document.querySelector("#test-api-button").addEventListener("click", async () => { const button = document.querySelector("#test-api-button"); button.disabled = true; button.textContent = "测试中"; setModelFeedback("正在保存当前配置并测试模型响应…"); try { const config = getModelFormConfig(); const configured = await configureRuntime(config); document.querySelector("#model-settings-form").apiKey.value = ""; applyModelSettings(configured); const result = await window.desktop.testModel(); setRuntimeState(true, `${configured.model} 已连接`); setModelFeedback(`连接测试成功：${result.message}`, "success"); eventLog.unshift(`连接测试成功：${result.message}`); } catch (error) { setModelFeedback(`连接测试失败：${error.message}`, "error"); eventLog.unshift(`连接测试失败：${error.message}`); } finally { button.disabled = false; button.textContent = "测试连接"; renderOrchestrator(); } });
document.querySelector("#clear-api-button").addEventListener("click", async () => { try { await window.desktop?.clearModel?.(); localStorage.removeItem("ai-software-team.model-settings"); sessionStorage.removeItem("ai-software-team.model-settings"); const form = document.querySelector("#model-settings-form"); form.reset(); form.apiKey.placeholder = "输入密钥"; document.querySelector("#api-key-hint").textContent = "密钥将由 Windows 系统加密后保存在本机"; applyProviderDefaults(); setRuntimeState(false, "模型待配置"); setModelFeedback("已删除本机保存的模型配置", "success"); } catch (error) { setModelFeedback(`清除失败：${error.message}`, "error"); } });
document.querySelectorAll("[data-media-kind]").forEach((form) => {
  const kind = form.dataset.mediaKind;
  form.provider.addEventListener("change", () => applyMediaProviderDefaults(kind));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const button = currentForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "保存中";
    setMediaModelFeedback(kind, "正在加密并保存独立密钥…");
    try {
      await saveMediaModel(kind, currentForm);
      setMediaModelFeedback(kind, "保存成功，此配置不会与其他模型共享", "success");
    } catch (error) { setMediaModelFeedback(kind, `保存失败：${error.message}`, "error"); }
    finally { button.disabled = false; button.textContent = kind === "image" ? "保存生图配置" : "保存视频配置"; }
  });
  form.querySelector("[data-clear-media-model]").addEventListener("click", async () => {
    try {
      if (!window.desktop?.clearMediaModel) throw new Error("媒体 API 配置仅在 Electron 桌面版中可用");
      mediaModelState = await window.desktop.clearMediaModel(kind);
      renderMediaModel(kind);
      setMediaModelFeedback(kind, "已删除本机保存的独立配置", "success");
    } catch (error) { setMediaModelFeedback(kind, `清除失败：${error.message}`, "error"); }
  });
});

const voiceForm = document.querySelector("#voice-settings-form");
function voiceFormPayload() {
  const data = new FormData(voiceForm);
  return {
    asrProvider: data.get("asrProvider"), asrBaseUrl: data.get("asrBaseUrl"), asrModel: data.get("asrModel"), asrApiKey: String(data.get("asrApiKey") || "").trim(),
    ttsProvider: data.get("ttsProvider"), ttsBaseUrl: data.get("ttsBaseUrl"), ttsModel: data.get("ttsModel"), ttsApiKey: String(data.get("ttsApiKey") || "").trim(),
    voice: data.get("voice"), speed: Number(data.get("speed")), autoSpeak: data.get("autoSpeak") === "on"
  };
}
voiceForm.asrProvider.addEventListener("change", () => applyVoiceProviderDefaults("asr"));
voiceForm.ttsProvider.addEventListener("change", () => applyVoiceProviderDefaults("tts"));
voiceForm.speed.addEventListener("input", () => { document.querySelector("#voice-speed-label").textContent = `${Number(voiceForm.speed.value).toFixed(2)}×`; });
voiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = voiceForm.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = "保存中"; setVoiceFeedback("正在加密并保存语音模型配置…");
  try { voiceState = await window.desktop.configureVoice(voiceFormPayload()); renderVoiceSettings(); setVoiceFeedback("语音配置已保存，主界面和工作流均可录音与朗读。", "success"); }
  catch (error) { setVoiceFeedback(`保存失败：${error.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "保存语音配置"; }
});
document.querySelector("#clear-voice-button").addEventListener("click", async () => {
  try { stopVoicePlayback(); voiceState = await window.desktop.clearVoice(); renderVoiceSettings(); setVoiceFeedback("已清除本机语音配置。", "success"); }
  catch (error) { setVoiceFeedback(`清除失败：${error.message}`, "error"); }
});
document.querySelector("#test-voice-button").addEventListener("click", async () => {
  const button = document.querySelector("#test-voice-button"); button.disabled = true; button.textContent = "测试中";
  try { voiceState = await window.desktop.configureVoice(voiceFormPayload()); renderVoiceSettings(); await speakText("语音连接测试成功，智能体已经可以朗读回复。"); setVoiceFeedback("测试成功，已播放测试语音。", "success"); }
  catch (error) { setVoiceFeedback(`测试失败：${error.message}`, "error"); }
  finally { button.disabled = false; button.textContent = "测试朗读"; }
});
document.querySelector("#chat-voice-button").addEventListener("click", () => toggleVoiceRecording("main"));
document.querySelector("#workflow-voice-button").addEventListener("click", () => toggleVoiceRecording("workflow"));
document.querySelectorAll("[data-stop-voice]").forEach((button) => button.addEventListener("click", stopVoicePlayback));
document.addEventListener("click", (event) => {
  const speakButton = event.target.closest("[data-speak-scope]");
  if (!speakButton) return;
  const messages = speakButton.dataset.speakScope === "workflow" ? workflowChatMessages : chatMessages;
  const message = messages[Number(speakButton.dataset.speakIndex)];
  if (message?.content) speakText(message.content).catch((error) => setVoiceFeedback(`朗读失败：${error.message}`, "error"));
});

const memoryDialog = document.querySelector("#memory-dialog");
document.querySelector("#new-memory-button").addEventListener("click", () => memoryDialog.showModal());
document.querySelector("#memory-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); memories.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), content: data.get("content").trim(), type: data.get("type"), createdAt: new Date().toISOString() }); saveMemory(); renderMemory(); renderWorkflow(); event.currentTarget.reset(); memoryDialog.close(); });
document.querySelector("#memory-list").addEventListener("click", (event) => { const id = event.target.dataset.memoryDelete; if (!id) return; memories = memories.filter((memory) => memory.id !== id); saveMemory(); renderMemory(); renderWorkflow(); });
document.querySelector("#knowledge-list").addEventListener("click", (event) => { const id = event.target.dataset.knowledgeDelete; if (!id) return; knowledgeDocuments = knowledgeDocuments.filter((document) => document.id !== id); saveMemory(); renderMemory(); renderWorkflow(); });
document.querySelector("#knowledge-search").addEventListener("input", (event) => renderMemory(event.target.value));
document.querySelector("#import-knowledge-button").addEventListener("click", () => document.querySelector("#knowledge-file-input").click());
document.querySelector("#knowledge-file-input").addEventListener("change", async (event) => { for (const file of event.target.files) knowledgeDocuments.unshift({ id: crypto.randomUUID(), title: file.name, content: await file.text(), type: file.name.split(".").pop().toUpperCase(), size: `${Math.max(1, Math.round(file.size / 1024))} KB` }); saveMemory(); renderMemory(); renderWorkflow(); event.target.value = ""; });

document.querySelector("#memory-graph-choose").addEventListener("click", () => chooseOrReindexMemoryGraph(true));
document.querySelector("#memory-graph-reindex").addEventListener("click", () => chooseOrReindexMemoryGraph(false));
document.querySelector("#memory-graph-open").addEventListener("click", async () => { try { await window.desktop.openMemoryGraphFolder(); } catch (error) { document.querySelector("#memory-graph-path").textContent = `无法打开文件夹：${error.message}`; } });
document.querySelector("#memory-graph-search").addEventListener("input", (event) => renderMemorySearchResults(event.target.value));
document.querySelector("#memory-graph-filter").addEventListener("change", buildMemoryGraphScene);
document.querySelectorAll("[data-memory-edge]").forEach((control) => control.addEventListener("change", () => {
  memoryGraphScene.activeEdgeTypes = new Set([...document.querySelectorAll("[data-memory-edge]:checked")].map((item) => item.dataset.memoryEdge));
  buildMemoryGraphScene({ layout: false });
}));
document.querySelector("#memory-graph-fit").addEventListener("click", fitMemoryGraph);
document.querySelector("#memory-graph-reset").addEventListener("click", () => { localStorage.removeItem(storageKeys.memoryGraphLayout); buildMemoryGraphScene({ reset: true }); setTimeout(fitMemoryGraph, 900); });
document.querySelector(".memory-graph-section").addEventListener("click", (event) => {
  const button = event.target.closest("[data-memory-focus]");
  if (!button) return;
  focusMemoryNode(button.dataset.memoryFocus);
  document.querySelector("#memory-search-results").hidden = true;
});
document.querySelector("#memory-node-close").addEventListener("click", () => { document.querySelector("#memory-node-inspector").hidden = true; memoryGraphScene.selectedId = null; drawMemoryGraph(); });
const memoryCanvas = document.querySelector("#memory-graph-canvas");
function memoryPointerPosition(event) {
  const bounds = memoryCanvas.getBoundingClientRect();
  return { screenX: event.clientX - bounds.left, screenY: event.clientY - bounds.top, x: (event.clientX - bounds.left - bounds.width / 2 - memoryGraphScene.offsetX) / memoryGraphScene.scale, y: (event.clientY - bounds.top - bounds.height / 2 - memoryGraphScene.offsetY) / memoryGraphScene.scale };
}
memoryCanvas.addEventListener("pointerdown", (event) => {
  const point = memoryPointerPosition(event);
  const node = [...memoryGraphScene.nodes].reverse().find((candidate) => { const position = memoryGraphScene.positions.get(candidate.id); return position && Math.hypot(position.x - point.x, position.y - point.y) <= 14 / memoryGraphScene.scale; });
  memoryGraphScene.dragging = { kind: node ? "node" : "canvas", id: node?.id || null, startX: event.clientX, startY: event.clientY, offsetX: memoryGraphScene.offsetX, offsetY: memoryGraphScene.offsetY, moved: false };
  if (node) memoryGraphScene.positions.get(node.id).fixed = true;
  memoryCanvas.classList.add("dragging"); memoryCanvas.setPointerCapture(event.pointerId);
});
memoryCanvas.addEventListener("pointermove", (event) => {
  const dragging = memoryGraphScene.dragging; if (!dragging) return;
  const dx = event.clientX - dragging.startX; const dy = event.clientY - dragging.startY; if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
  if (dragging.kind === "canvas") { memoryGraphScene.offsetX = dragging.offsetX + dx; memoryGraphScene.offsetY = dragging.offsetY + dy; }
  else { const point = memoryPointerPosition(event); const position = memoryGraphScene.positions.get(dragging.id); if (position) { position.x = point.x; position.y = point.y; position.vx = 0; position.vy = 0; } }
  drawMemoryGraph();
});
memoryCanvas.addEventListener("pointerup", (event) => {
  const dragging = memoryGraphScene.dragging; if (!dragging) return;
  if (dragging.kind === "node" && !dragging.moved) showMemoryNode(memoryGraphScene.nodes.find((node) => node.id === dragging.id));
  if (dragging.kind === "node") { const position = memoryGraphScene.positions.get(dragging.id); if (position) position.fixed = memoryGraphScene.nodes.find((node) => node.id === dragging.id)?.type === "root"; }
  memoryGraphScene.dragging = null; memoryCanvas.classList.remove("dragging");
  try { memoryCanvas.releasePointerCapture(event.pointerId); } catch { /* 指针捕获可能已经被系统释放。 */ }
  saveMemoryGraphLayout();
});
function cancelMemoryPointer() {
  const dragging = memoryGraphScene.dragging;
  if (dragging?.kind === "node") { const position = memoryGraphScene.positions.get(dragging.id); if (position) position.fixed = memoryGraphScene.nodes.find((node) => node.id === dragging.id)?.type === "root"; }
  memoryGraphScene.dragging = null; memoryCanvas.classList.remove("dragging");
}
memoryCanvas.addEventListener("pointercancel", cancelMemoryPointer);
memoryCanvas.addEventListener("lostpointercapture", () => { if (memoryGraphScene.dragging) cancelMemoryPointer(); });
window.addEventListener("blur", cancelMemoryPointer);
memoryCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const bounds = memoryCanvas.getBoundingClientRect();
  const point = memoryPointerPosition(event);
  const nextScale = Math.max(.28, Math.min(2.8, memoryGraphScene.scale * (event.deltaY > 0 ? .9 : 1.1)));
  const screenX = event.clientX - bounds.left - bounds.width / 2; const screenY = event.clientY - bounds.top - bounds.height / 2;
  memoryGraphScene.scale = nextScale;
  memoryGraphScene.offsetX = screenX - point.x * nextScale;
  memoryGraphScene.offsetY = screenY - point.y * nextScale;
  drawMemoryGraph(); saveMemoryGraphLayout();
}, { passive: false });
new ResizeObserver(() => drawMemoryGraph()).observe(document.querySelector("#memory-graph-stage"));
window.desktop?.onMemoryGraphProgress?.((progress) => {
  const phaseBase = { scan: 8, parse: 38, complete: 100 }[progress.phase] ?? 10;
  const phaseRange = { scan: 30, parse: 55, complete: 0 }[progress.phase] ?? 10;
  const ratio = progress.total ? Math.min(1, progress.current / progress.total) : 0;
  document.querySelector("#memory-graph-loading-fill").style.width = `${Math.round(phaseBase + phaseRange * ratio)}%`;
  document.querySelector("#memory-graph-loading-detail").textContent = progress.message || "正在分析知识关系";
});

document.querySelectorAll("#update-auto-check,#update-auto-download,#update-install-restart").forEach((control) => control.addEventListener("change", async () => {
  try { renderUpdateState(await window.desktop.setUpdateSettings({ autoCheck: document.querySelector("#update-auto-check").checked, autoDownload: document.querySelector("#update-auto-download").checked, installOnRestart: document.querySelector("#update-install-restart").checked })); }
  catch (error) { renderUpdateState({ ...updateState, status: "error", error: error.message }); }
}));
document.querySelector("#update-check-button").addEventListener("click", async () => { const button = document.querySelector("#update-check-button"); button.disabled = true; try { renderUpdateState(await window.desktop.checkForUpdates()); } catch { /* 更新状态事件已经包含具体错误。 */ } finally { button.disabled = false; } });
document.querySelector("#update-download-button").addEventListener("click", async () => { try { renderUpdateState(await window.desktop.downloadUpdate()); } catch { /* 更新状态事件已经包含具体错误。 */ } });
document.querySelector("#update-restart-button").addEventListener("click", async () => { document.querySelector("#update-restart-button").disabled = true; try { await window.desktop.restartToUpdate(); } catch (error) { renderUpdateState({ ...updateState, status: "error", error: error.message }); document.querySelector("#update-restart-button").disabled = false; } });
document.querySelector("#update-release-button").addEventListener("click", () => { if (updateState.releaseUrl) window.desktop.openExternal(updateState.releaseUrl).catch((error) => renderUpdateState({ ...updateState, status: "error", error: error.message })); });
window.desktop?.onUpdateState?.((state) => renderUpdateState(state));

setInterval(() => {
  const longRunning = officeAgents.filter((agent) => { const status = getAgentStatus(agent); return status.busy && status.startedAt && Date.now() - status.startedAt > 45000; });
  if (!longRunning.length) return;
  const agent = longRunning[Math.floor(Math.random() * longRunning.length)]; const lines = complaints[agent.role] || ["工作有点久啦，让我伸个懒腰。"];
  complaintAgentId = agent.id; complaintText = lines[Math.floor(Math.random() * lines.length)]; renderOffice(); setTimeout(() => { complaintAgentId = null; renderOffice(); }, 6500);
}, 16000);
const managerLines = ["大家加油，记得保存进度哦！", "我来看看有没有需要帮忙的地方。", "慢一点没关系，质量更重要。", "完成后记得把结果写进任务呀。"];
let managerLine = 0;
setInterval(() => { managerLine = (managerLine + 1) % managerLines.length; document.querySelector("#manager-speech").textContent = managerLines[managerLine]; }, 9000);
setInterval(() => renderOffice(), 3000);

document.addEventListener("app-language-change", () => {
  renderSkills();
  renderChat();
  renderWorkflowChat();
  renderModelPool();
  renderPlugins();
  renderVoiceSettings();
  render();
  queueMicrotask(() => window.AppI18n?.refresh());
});

if (!window.WorkflowState?.templates?.[workflowEditorState.activeMode]) workflowEditorState.activeMode = "software";
document.querySelectorAll("[data-workflow-mode]").forEach((button) => button.classList.toggle("active", button.dataset.workflowMode === workflowEditorState.activeMode));
selectedWorkflowNodeId = window.WorkflowState?.templates?.[workflowEditorState.activeMode]?.nodes.find((node) => node.manager)?.id || "commander";
installViewBackButtons(); loadModelSettings(); loadMediaModels(); loadVoiceSettings(); loadModelPool(); loadPlugins(); loadMemoryGraph(); loadUpdateState(); renderSkills(); renderChat(); renderWorkflowChat(); render(); refreshSandboxPolicy(); applyInterfaceMode(interfaceMode);
window.desktop?.getWorkspace?.().then((result) => setWorkspaceState(result.path || null));
window.desktop?.getIntegrationStatus?.().then((result) => setIntegrationStatus(result.githubTokenConfigured));
