const storageKeys = {
  tasks: "ai-software-team.tasks",
  agents: "ai-software-team.office-agents",
  memory: "ai-software-team.memory",
  knowledge: "ai-software-team.knowledge"
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
  { id: "reviewer", name: "审审", role: "代码审查 Agent", sprite: "techlead", desk: 4 },
  { id: "devops", name: "小蓝", role: "DevOps Agent", sprite: "devops", desk: 4 }
];
const deskNames = ["产品与架构", "技术与安全", "前端与后端", "数据与测试", "审查与交付"];
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
let tasks = loadJson(storageKeys.tasks, []);
if (!Array.isArray(tasks)) tasks = [];
let officeAgents = loadJson(storageKeys.agents, defaultOfficeAgents);
let memories = loadJson(storageKeys.memory, []);
let knowledgeDocuments = loadJson(storageKeys.knowledge, []);
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
let enabledSkills = new Set(skillCatalog.flatMap(([, , skills]) => skills.map(([, description]) => description)));
let eventLog = ["灵灵已进入工作室", "Agent 团队等待新的任务"];
let selectedAgentId = null;
let complaintAgentId = null;
let complaintText = "";
let chatMessages = [];
let workspacePath = null;

function saveTasks() { localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks)); }
function saveAgents() { localStorage.setItem(storageKeys.agents, JSON.stringify(officeAgents)); }
function saveMemory() { localStorage.setItem(storageKeys.memory, JSON.stringify(memories)); localStorage.setItem(storageKeys.knowledge, JSON.stringify(knowledgeDocuments)); }
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
      return `<button class="agent-pet ${status.busy ? "busy" : ""}" type="button" data-agent-id="${agent.id}" aria-label="${escapeHtml(agent.name)}，${escapeHtml(agent.role)}"><img src="assets/agents/${agent.sprite}.png" alt="" draggable="false" /><small></small><span>${escapeHtml(agent.name)} · ${escapeHtml(agent.role.replace(" Agent", ""))}</span>${complaint}</button>`;
    }).join("");
    return `<section class="desk-station"><div class="desk-agents">${pets}</div><div class="desk-album"></div><div class="desk-surface"></div><span class="desk-label">${name}</span></section>`;
  }).join("");
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
  renderOffice(); renderOrchestrator(); renderMemory();
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
function loadModelSettings() {
  const settings = loadJson("ai-software-team.model-settings", null) || JSON.parse(sessionStorage.getItem("ai-software-team.model-settings") || "null");
  if (!settings) { applyProviderDefaults(); return; }
  const form = document.querySelector("#model-settings-form"); form.provider.value = settings.provider; form.baseUrl.value = settings.baseUrl; form.model.value = settings.model;
  document.querySelector("#routing-mode").value = settings.routingMode || "balanced";
}
function setRuntimeState(configured, label) {
  const pill = document.querySelector("#runtime-pill"); pill.classList.toggle("connected", configured); pill.querySelector("span:last-child").textContent = label;
  const state = document.querySelector("#connection-state"); state.classList.toggle("connected", configured); state.textContent = configured ? label : "未配置";
  document.querySelector("#chat-model-label").textContent = configured ? label : "等待模型配置";
}
function getModelFormConfig() { const form = document.querySelector("#model-settings-form"); const data = new FormData(form); return { provider: data.get("provider"), baseUrl: data.get("baseUrl"), model: data.get("model"), apiKey: data.get("apiKey").trim(), routingMode: document.querySelector("#routing-mode").value }; }
async function configureRuntime(config) { if (!window.desktop?.configureModel) throw new Error("真实模型执行仅在 Electron 桌面版中可用"); const result = await window.desktop.configureModel(config); setRuntimeState(true, `${result.model} 已连接`); return result; }
function skillMap() { return Object.fromEntries(skillCatalog.map(([, agent, skills]) => [agent, skills.filter(([, description]) => enabledSkills.has(description)).map(([name]) => name)])); }
function getTeamContext() { return [...tasks.map((task) => `任务[${task.status}] ${task.title}: ${task.result || task.description || ""}`), ...memories.map((item) => `记忆 ${item.title}: ${item.content}`), ...knowledgeDocuments.map((item) => `知识 ${item.title}: ${item.content.slice(0, 600)}`)]; }

async function executeNextTask(taskId) {
  const task = taskId ? tasks.find((item) => item.id === taskId) : tasks.find((item) => item.status === "todo");
  if (!task) { eventLog.unshift("没有可执行的待处理任务"); render(); return; }
  if (!window.desktop?.executeAgentTask) { eventLog.unshift("请使用 Electron 桌面版运行真实 Agent"); render(); return; }
  const button = document.querySelector("#run-queue-button"); button.disabled = true; button.textContent = "Agent 执行中";
  tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "progress", running: true, startedAt: Date.now() } : item); eventLog.unshift(`灵灵正在分析“${task.title}”`); saveTasks(); render();
  try {
    const response = await window.desktop.executeAgentTask({ task, skills: skillMap(), context: getTeamContext() });
    const files = response.runs.flatMap((run) => run.artifacts || []);
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "done", running: false, agent: response.delegateTo, plan: response.plan, runs: response.runs, artifacts: files, result: response.result, completedAt: response.completedAt } : item);
    eventLog.unshift(`${response.runs.length} 个子 Agent 步骤已完成“${task.title}”，生成 ${files.length} 个文件`);
    const teamReport = response.runs.map((run, index) => `${index + 1}. ${run.delegateTo} · ${run.title}\n${run.summary}`).join("\n\n");
    const artifactReport = files.length ? files.map((file) => `- ${file.relativePath}`).join("\n") : "- 本次仅交付文本结果";
    chatMessages.push({ role: "assistant", content: `## ${task.title} · 团队已完成\n\n${teamReport}\n\n### 生成文件\n${artifactReport}\n\n### 主 Agent 验收\n${response.result}` });
    renderChat();
  } catch (error) {
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "todo", running: false, error: error.message } : item); eventLog.unshift(`执行失败：${error.message}`);
  } finally { button.disabled = false; button.textContent = "AI 执行下一任务"; saveTasks(); render(); }
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
  menu.style.left = `${Math.min(x, innerWidth - 250)}px`; menu.style.top = `${Math.min(y, innerHeight - 235)}px`;
}
function hideAgentMenu() { document.querySelector("#agent-context-menu").hidden = true; }

function renderChat() {
  const messages = document.querySelector("#chat-messages");
  messages.innerHTML = `<article class="chat-message assistant"><p>告诉我你要交付什么。我可以分析问题，也可以创建任务并调用完整 Agent 团队执行。</p></article>${chatMessages.map((message, index) => `<article class="chat-message ${message.role} ${message.pending ? "pending" : ""}"><div>${formatChatContent(message.content)}</div>${message.action ? `<button class="chat-action-button" type="button" data-chat-action="${index}">${message.action.type === "create_and_execute" ? "创建并交给团队执行" : "创建任务"}</button>` : ""}</article>`).join("")}`;
  messages.scrollTop = messages.scrollHeight;
}
async function sendChat(content) {
  chatMessages.push({ role: "user", content }); chatMessages.push({ role: "assistant", content: "灵灵正在思考…", pending: true }); renderChat();
  try {
    if (!window.desktop?.chat) throw new Error("请先使用 Electron 桌面版并配置模型 API");
    const result = await window.desktop.chat({ messages: chatMessages.filter((message) => !message.pending), context: getTeamContext() });
    chatMessages[chatMessages.length - 1] = { role: "assistant", content: result.content, action: result.action };
  } catch (error) { chatMessages[chatMessages.length - 1] = { role: "assistant", content: `暂时无法回答：${error.message}` }; }
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
  const task = { id: crypto.randomUUID(), title: String(action.title || "AI 创建的任务").slice(0, 60), description: String(action.description || "").slice(0, 1000), agent: validAgents.includes(action.agent) ? action.agent : "技术主管 Agent", priority: ["high", "medium", "low"].includes(action.priority) ? action.priority : "medium", status: "todo" };
  tasks.unshift(task); message.action = null; saveTasks(); render(); renderChat();
  eventLog.unshift(`灵灵从对话创建了“${task.title}”`);
  if (action.type === "create_and_execute") await executeNextTask(task.id);
}

function activateView(name) { document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === name)); document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === name)); }
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.openView)));

const taskDialog = document.querySelector("#task-dialog");
document.querySelector("#new-task-button").addEventListener("click", () => taskDialog.showModal());
document.querySelector("#task-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); tasks.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), description: data.get("description").trim(), agent: data.get("agent"), priority: data.get("priority"), status: "todo" }); saveTasks(); render(); event.currentTarget.reset(); taskDialog.close(); });
document.querySelector("#run-queue-button").addEventListener("click", () => executeNextTask());

document.querySelector("#desk-grid").addEventListener("contextmenu", (event) => { const pet = event.target.closest("[data-agent-id]"); if (!pet) return; event.preventDefault(); showAgentMenu(pet.dataset.agentId, event.clientX, event.clientY); });
document.querySelector("#manager-character").addEventListener("contextmenu", (event) => { event.preventDefault(); showAgentMenu("manager", event.clientX, event.clientY); });
document.addEventListener("click", (event) => { if (!event.target.closest("#agent-context-menu")) hideAgentMenu(); });
document.querySelector("#context-edit-agent").addEventListener("click", () => { const agent = officeAgents.find((item) => item.id === selectedAgentId); if (!agent) return; const form = document.querySelector("#agent-form"); form.querySelector('[name="id"]').value = agent.id; form.querySelector('[name="name"]').value = agent.name; form.querySelector('[name="role"]').value = agent.role; hideAgentMenu(); document.querySelector("#agent-dialog").showModal(); });
document.querySelector("#context-delete-agent").addEventListener("click", () => { const agent = officeAgents.find((item) => item.id === selectedAgentId); if (!agent || !confirm(`确定删除 ${agent.name} 吗？`)) return; officeAgents = officeAgents.filter((item) => item.id !== selectedAgentId); saveAgents(); hideAgentMenu(); render(); });
document.querySelector("#agent-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); officeAgents = officeAgents.map((agent) => agent.id === data.get("id") ? { ...agent, name: data.get("name").trim(), role: data.get("role") } : agent); saveAgents(); render(); document.querySelector("#agent-dialog").close(); });

document.querySelector("#chat-form").addEventListener("submit", (event) => { event.preventDefault(); const input = document.querySelector("#chat-input"); const content = input.value.trim(); if (!content) return; input.value = ""; sendChat(content); });
document.querySelector("#chat-input").addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); document.querySelector("#chat-form").requestSubmit(); } });
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
}
document.querySelector("#workspace-button").addEventListener("click", chooseWorkspace);
document.querySelector("#settings-workspace-button").addEventListener("click", chooseWorkspace);

document.querySelector("#skills-grid").addEventListener("change", (event) => { const skill = event.target.dataset.skill; if (!skill) return; event.target.checked ? enabledSkills.add(skill) : enabledSkills.delete(skill); renderSkills(); });
document.querySelector("#provider-select").addEventListener("change", applyProviderDefaults);
document.querySelector("#model-settings-form").addEventListener("submit", async (event) => { event.preventDefault(); const config = getModelFormConfig(); try { await configureRuntime(config); sessionStorage.setItem("ai-software-team.model-settings", JSON.stringify({ provider: config.provider, baseUrl: config.baseUrl, model: config.model, routingMode: config.routingMode })); event.currentTarget.querySelector('[name="apiKey"]').value = ""; eventLog.unshift(`灵灵已连接 ${config.model}`); render(); } catch (error) { setRuntimeState(false, "模型待配置"); eventLog.unshift(`配置失败：${error.message}`); renderOrchestrator(); } });
document.querySelector("#test-api-button").addEventListener("click", async () => { const button = document.querySelector("#test-api-button"); button.disabled = true; button.textContent = "测试中"; try { const config = getModelFormConfig(); if (config.apiKey) await configureRuntime(config); const result = await window.desktop.testModel(); setRuntimeState(true, `${config.model} 已连接`); eventLog.unshift(`连接测试成功：${result.message}`); } catch (error) { eventLog.unshift(`连接测试失败：${error.message}`); } finally { button.disabled = false; button.textContent = "测试连接"; renderOrchestrator(); } });
document.querySelector("#clear-api-button").addEventListener("click", async () => { await window.desktop?.clearModel?.(); sessionStorage.removeItem("ai-software-team.model-settings"); document.querySelector("#model-settings-form").reset(); applyProviderDefaults(); setRuntimeState(false, "模型待配置"); });

const memoryDialog = document.querySelector("#memory-dialog");
document.querySelector("#new-memory-button").addEventListener("click", () => memoryDialog.showModal());
document.querySelector("#memory-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); memories.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), content: data.get("content").trim(), type: data.get("type"), createdAt: new Date().toISOString() }); saveMemory(); renderMemory(); event.currentTarget.reset(); memoryDialog.close(); });
document.querySelector("#memory-list").addEventListener("click", (event) => { const id = event.target.dataset.memoryDelete; if (!id) return; memories = memories.filter((memory) => memory.id !== id); saveMemory(); renderMemory(); });
document.querySelector("#knowledge-list").addEventListener("click", (event) => { const id = event.target.dataset.knowledgeDelete; if (!id) return; knowledgeDocuments = knowledgeDocuments.filter((document) => document.id !== id); saveMemory(); renderMemory(); });
document.querySelector("#knowledge-search").addEventListener("input", (event) => renderMemory(event.target.value));
document.querySelector("#import-knowledge-button").addEventListener("click", () => document.querySelector("#knowledge-file-input").click());
document.querySelector("#knowledge-file-input").addEventListener("change", async (event) => { for (const file of event.target.files) knowledgeDocuments.unshift({ id: crypto.randomUUID(), title: file.name, content: await file.text(), type: file.name.split(".").pop().toUpperCase(), size: `${Math.max(1, Math.round(file.size / 1024))} KB` }); saveMemory(); renderMemory(); event.target.value = ""; });

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

loadModelSettings(); renderSkills(); renderChat(); render();
window.desktop?.getModelStatus?.().then((status) => setRuntimeState(status.configured, status.configured ? `${status.model} 已连接` : "模型待配置"));
window.desktop?.getWorkspace?.().then((result) => setWorkspaceState(result.path || null));
