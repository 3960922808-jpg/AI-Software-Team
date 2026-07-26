const storageKey = "ai-software-team.tasks";
const sampleTasks = [
  { id: "t1", title: "梳理 MVP 用户需求", description: "明确项目经理、研发 Agent 与交付流程的首批使用场景。", agent: "产品经理 Agent", priority: "high", status: "todo" },
  { id: "t2", title: "定义任务编排领域模型", description: "建立任务、Agent、状态流转及执行记录的基础契约。", agent: "架构师 Agent", priority: "high", status: "progress" },
  { id: "t3", title: "创建项目工作台原型", description: "完成需求概览、看板与任务分派的首个可用界面。", agent: "前端 Agent", priority: "medium", status: "done" }
];

function loadTasks() { try { return JSON.parse(localStorage.getItem(storageKey)) || sampleTasks; } catch { return sampleTasks; } }
let tasks = loadTasks();
const labels = { todo: "待处理", progress: "进行中", done: "已完成" };
const agents = [
  ["PM", "产品经理 Agent", "需求拆解与优先级规划"], ["AR", "架构师 Agent", "系统设计与技术决策"],
  ["TL", "技术主管 Agent", "技术路线与质量把控"], ["FE", "前端 Agent", "界面开发与体验实现"],
  ["BE", "后端 Agent", "服务与业务逻辑实现"], ["QA", "测试 Agent", "测试设计与质量验证"],
  ["SE", "安全专家 Agent", "安全审查与风险控制"], ["DO", "DevOps Agent", "构建、部署与运行保障"]
];
let eventLog = ["项目工作台已连接至调度中心", "Agent 注册表已加载", "等待新的任务进入队列"];
const skillCatalog = [
  ["CO", "指挥 Agent", [["任务分解", "将目标拆分为可执行任务"], ["Agent 路由", "按能力与容量分派任务"], ["结果汇总", "合并子 Agent 的执行结论"]]],
  ["PM", "产品经理 Agent", [["需求分析", "提炼用户目标与验收条件"], ["PRD 生成", "生成结构化产品需求文档"], ["优先级规划", "基于价值与风险排列任务"]]],
  ["AR", "架构师 Agent", [["架构设计", "制定服务、数据与接口边界"], ["技术选型", "输出可追溯的技术决策"], ["接口契约", "定义模块间数据与调用规范"]]],
  ["TL", "技术主管 Agent", [["代码评审", "检查实现质量与可维护性"], ["实施规划", "把技术方案转成开发计划"], ["风险识别", "发现依赖、复杂度和交付风险"]]],
  ["FE", "前端 Agent", [["界面实现", "构建响应式用户界面"], ["组件设计", "沉淀可复用交互组件"], ["体验验证", "检查可用性与状态反馈"]]],
  ["BE", "后端 Agent", [["API 设计", "实现服务接口和业务规则"], ["数据建模", "设计数据结构与迁移策略"], ["服务集成", "连接外部服务与消息流"]]],
  ["QA", "测试 Agent", [["测试设计", "覆盖核心流程与异常路径"], ["自动化测试", "维护可重复执行的测试集"], ["质量报告", "输出缺陷、覆盖率和验收结论"]]],
  ["SE", "安全专家 Agent", [["威胁建模", "识别资产、边界与攻击路径"], ["依赖审查", "检查组件与供应链风险"], ["安全验收", "验证认证、授权和数据保护"]]],
  ["DO", "DevOps Agent", [["构建流水线", "配置可重复的构建与发布"], ["部署编排", "管理环境与版本交付"], ["运行监控", "建立日志、指标和告警"]]]
];
let enabledSkills = new Set(skillCatalog.flatMap(([, , skills]) => skills.map(([, description]) => description)));
const memoryStorageKey = "ai-software-team.memory";
const knowledgeStorageKey = "ai-software-team.knowledge";
let memories = JSON.parse(localStorage.getItem(memoryStorageKey) || "null") || [{ id: "m1", title: "MVP 技术边界", content: "首个版本优先验证项目管理、Agent 编排和技能授权流程。", type: "架构决策", createdAt: new Date().toISOString() }];
let knowledgeDocuments = JSON.parse(localStorage.getItem(knowledgeStorageKey) || "null") || [{ id: "k1", title: "AI Software Team 架构说明", content: "指挥 Agent 负责拆解和路由任务，专业子 Agent 使用经过授权的 Skill 执行工作。", type: "内置文档", size: "1 KB" }];
function saveTasks() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function render() {
  document.querySelectorAll(".column").forEach((column) => {
    const status = column.dataset.status;
    const items = tasks.filter((task) => task.status === status);
    column.querySelector(".count").textContent = items.length;
    column.querySelector(".task-list").innerHTML = items.map((task) => {
      const previous = status === "progress" ? "todo" : status === "done" ? "progress" : null;
      const next = status === "todo" ? "progress" : status === "progress" ? "done" : null;
      return `<article class="task"><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.description || "未填写任务说明")}</p><div class="task-footer"><span class="agent">${escapeHtml(task.agent)}</span><span class="priority ${task.priority}">${({high:"高",medium:"中",low:"低"})[task.priority]}</span></div>${task.running ? "<span class=\"task-running\">模型正在执行</span>" : ""}${task.result ? `<div class="task-result">${escapeHtml(task.result)}</div>` : ""}<div class="task-actions">${previous ? `<button class="move-button" data-id="${task.id}" data-status="${previous}">← ${labels[previous]}</button>` : "<span></span>"}${next ? `<button class="move-button" data-id="${task.id}" data-status="${next}">${labels[next]} →</button>` : `<button class="move-button delete-button" data-delete="${task.id}">删除</button>`}</div></article>`;
    }).join("");
  });
  document.querySelector("#metric-todo").textContent = tasks.filter((task) => task.status === "todo").length;
  document.querySelector("#metric-progress").textContent = tasks.filter((task) => task.status === "progress").length;
  document.querySelector("#metric-done").textContent = tasks.filter((task) => task.status === "done").length;
  document.querySelector("#metric-high").textContent = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  document.querySelector("#task-total").textContent = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  document.querySelector("#project-progress").value = progress;
  document.querySelector("#project-progress-label").textContent = `${progress}%`;
  const activeAgents = new Set(tasks.filter((task) => task.status === "progress").map((task) => task.agent));
  document.querySelector("#dashboard-agents").innerHTML = agents.slice(0, 6).map(([code, name]) => `<div class="dashboard-agent"><b>${code}</b><div><strong>${name}</strong><small>${activeAgents.has(name) ? "正在执行任务" : "可接受调度"}</small></div><span class="agent-presence ${activeAgents.has(name) ? "busy" : ""}"></span></div>`).join("");
  const latest = tasks.find((task) => task.result);
  document.querySelector("#latest-output").innerHTML = latest ? `<h3>${escapeHtml(latest.title)}</h3><p>${escapeHtml(latest.result)}</p>` : "<p>Agent 完成任务后，交付结果会显示在这里。</p>";
  renderOrchestrator();
}
function renderOrchestrator() {
  const queued = tasks.filter((task) => task.status !== "done");
  const activeAgents = new Set(tasks.filter((task) => task.status === "progress").map((task) => task.agent));
  document.querySelector("#queue-count").textContent = queued.length;
  document.querySelector("#orchestrator-status").textContent = queued.length ? "调度队列就绪" : "等待任务";
  document.querySelector("#orchestrator-detail").textContent = queued.length ? `${queued.length} 个任务等待或正在执行` : "队列由项目工作台同步";
  document.querySelector("#execution-queue").innerHTML = queued.length ? queued.map((task) => `<article class="queue-item"><span class="queue-indicator ${task.priority}"></span><div><h3>${escapeHtml(task.title)}</h3><p>${task.status === "progress" ? "执行中" : "等待分派"} · ${escapeHtml(task.description || "未填写任务说明")}</p></div><span class="queue-agent">${escapeHtml(task.agent)}</span></article>`).join("") : "<p class=\"empty-state\">当前没有待调度任务</p>";
  document.querySelector("#agent-registry").innerHTML = agents.map(([code, name, specialty]) => { const busy = activeAgents.has(name); return `<article class="agent-card"><header><span class="agent-icon">${code}</span><h3>${name}</h3></header><p>${specialty}</p><span class="agent-state ${busy ? "busy" : ""}">${busy ? "执行中" : "可调度"}</span></article>`; }).join("");
  document.querySelector("#event-log").innerHTML = eventLog.slice(0, 5).map((event, index) => `<li><time>${index === 0 ? "刚刚" : `${index + 1} 分钟前`}</time><span><span class="event-tag">调度</span> ${escapeHtml(event)}</span></li>`).join("");
}
function renderSkills() {
  document.querySelector("#skills-summary").textContent = `${enabledSkills.size} 项技能已启用`;
  document.querySelector("#skills-grid").innerHTML = skillCatalog.map(([code, agent, skills]) => `<article class="skill-card"><header class="skill-card-header"><div class="skill-owner"><b>${code}</b><h2>${agent}</h2></div><span class="skill-count">${skills.length} 项专属技能</span></header><ul class="skill-list">${skills.map(([name, description]) => `<li><div><strong>${name}</strong><small>${description}</small></div><input class="skill-toggle" type="checkbox" data-skill="${escapeHtml(description)}" aria-label="切换 ${name}" ${enabledSkills.has(description) ? "checked" : ""} /></li>`).join("")}</ul></article>`).join("");
}
function saveMemory() { localStorage.setItem(memoryStorageKey, JSON.stringify(memories)); localStorage.setItem(knowledgeStorageKey, JSON.stringify(knowledgeDocuments)); }
function renderMemory(query = "") {
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
  const baseUrl = document.querySelector("#base-url");
  const defaults = { openai: "https://api.openai.com/v1", anthropic: "https://api.anthropic.com", google: "https://generativelanguage.googleapis.com", deepseek: "https://api.deepseek.com/v1", custom: "" };
  baseUrl.value = defaults[provider];
}
function loadModelSettings() {
  const settings = JSON.parse(sessionStorage.getItem("ai-software-team.model-settings") || "null");
  if (!settings) { applyProviderDefaults(); return; }
  const form = document.querySelector("#model-settings-form");
  form.provider.value = settings.provider; form.baseUrl.value = settings.baseUrl; form.model.value = settings.model;
  document.querySelector("#routing-mode").value = settings.routingMode || "balanced";
  const state = document.querySelector("#connection-state"); state.textContent = "已在当前会话配置"; state.classList.add("connected");
}
function skillMap() { return Object.fromEntries(skillCatalog.map(([, agent, skills]) => [agent, skills.filter(([, description]) => enabledSkills.has(description)).map(([name]) => name)])); }
function setRuntimeState(configured, label) {
  const pill = document.querySelector("#runtime-pill"); pill.classList.toggle("connected", configured); pill.querySelector("span:last-child").textContent = label;
  const state = document.querySelector("#connection-state"); state.classList.toggle("connected", configured); state.textContent = configured ? label : "未配置";
}
function getModelFormConfig() {
  const form = document.querySelector("#model-settings-form"); const data = new FormData(form);
  return { provider: data.get("provider"), baseUrl: data.get("baseUrl"), model: data.get("model"), apiKey: data.get("apiKey").trim(), routingMode: document.querySelector("#routing-mode").value };
}
async function configureRuntime(config) {
  if (!window.desktop?.configureModel) throw new Error("真实模型执行仅在 Electron 桌面版中可用");
  const result = await window.desktop.configureModel(config); setRuntimeState(true, `${result.model} 已连接`); return result;
}
async function executeNextTask(taskId) {
  const task = taskId ? tasks.find((item) => item.id === taskId) : tasks.find((item) => item.status === "todo");
  if (!task) { eventLog.unshift("没有可执行的待处理任务"); render(); return; }
  if (!window.desktop?.executeAgentTask) { eventLog.unshift("请使用 Electron 桌面版运行真实 Agent"); render(); return; }
  const button = document.querySelector("#run-queue-button"); button.disabled = true; button.textContent = "Agent 执行中";
  tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "progress", running: true } : item); eventLog.unshift(`指挥 Agent 正在分析“${task.title}”`); saveTasks(); render();
  try {
    const response = await window.desktop.executeAgentTask({ task, skills: skillMap(), context: [...memories.map((item) => `${item.title}: ${item.content}`), ...knowledgeDocuments.map((item) => `${item.title}: ${item.content.slice(0, 600)}`)] });
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "done", running: false, agent: response.delegateTo, plan: response.plan, result: response.result, completedAt: response.completedAt } : item);
    eventLog.unshift(`${response.delegateTo} 已完成“${task.title}”`);
  } catch (error) {
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "todo", running: false, error: error.message } : item); eventLog.unshift(`执行失败：${error.message}`);
  } finally { button.disabled = false; button.textContent = "AI 执行下一任务"; saveTasks(); render(); }
}
function escapeHtml(value) { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; }
document.querySelector("#board").addEventListener("click", (event) => {
  const { id, status, delete: deleteId } = event.target.dataset;
  if (id) tasks = tasks.map((task) => task.id === id ? { ...task, status } : task);
  if (deleteId) tasks = tasks.filter((task) => task.id !== deleteId);
  saveTasks(); render();
});
const dialog = document.querySelector("#task-dialog");
document.querySelector("#new-task-button").addEventListener("click", () => dialog.showModal());
document.querySelector("#task-form").addEventListener("submit", (event) => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  tasks.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), description: data.get("description").trim(), agent: data.get("agent"), priority: data.get("priority"), status: "todo" });
  saveTasks(); render(); event.currentTarget.reset(); dialog.close();
});
document.querySelector("#reset-button").addEventListener("click", () => { tasks = sampleTasks; saveTasks(); render(); });
function activateView(name) { document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === name)); document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === name)); }
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.openView)));
document.querySelector("#run-queue-button").addEventListener("click", () => executeNextTask());
document.querySelector("#quick-task-button").addEventListener("click", () => { const input = document.querySelector("#quick-task-input"); const title = input.value.trim(); if (!title) return; const task = { id: crypto.randomUUID(), title, description: "由研发指挥台快速创建", agent: "技术主管 Agent", priority: "high", status: "todo" }; tasks.unshift(task); input.value = ""; saveTasks(); render(); executeNextTask(task.id); });
document.querySelector("#skills-grid").addEventListener("change", (event) => {
  const skill = event.target.dataset.skill;
  if (!skill) return;
  event.target.checked ? enabledSkills.add(skill) : enabledSkills.delete(skill); renderSkills();
});
document.querySelector("#provider-select").addEventListener("change", applyProviderDefaults);
document.querySelector("#model-settings-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  const config = getModelFormConfig();
  try { await configureRuntime(config); sessionStorage.setItem("ai-software-team.model-settings", JSON.stringify({ provider: config.provider, baseUrl: config.baseUrl, model: config.model, routingMode: config.routingMode })); event.currentTarget.apiKey.value = ""; eventLog.unshift(`指挥 Agent 已连接 ${config.model}`); render(); } catch (error) { setRuntimeState(false, "模型待配置"); eventLog.unshift(`配置失败：${error.message}`); renderOrchestrator(); }
});
document.querySelector("#test-api-button").addEventListener("click", async () => { const button = document.querySelector("#test-api-button"); button.disabled = true; button.textContent = "测试中"; try { const config = getModelFormConfig(); if (config.apiKey) await configureRuntime(config); const result = await window.desktop.testModel(); setRuntimeState(true, `${config.model} 已连接`); eventLog.unshift(`连接测试成功：${result.message}`); } catch (error) { eventLog.unshift(`连接测试失败：${error.message}`); } finally { button.disabled = false; button.textContent = "测试连接"; renderOrchestrator(); } });
document.querySelector("#clear-api-button").addEventListener("click", async () => { await window.desktop?.clearModel?.(); sessionStorage.removeItem("ai-software-team.model-settings"); document.querySelector("#model-settings-form").reset(); applyProviderDefaults(); setRuntimeState(false, "模型待配置"); });
const memoryDialog = document.querySelector("#memory-dialog");
document.querySelector("#new-memory-button").addEventListener("click", () => memoryDialog.showModal());
document.querySelector("#memory-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); memories.unshift({ id: crypto.randomUUID(), title: data.get("title").trim(), content: data.get("content").trim(), type: data.get("type"), createdAt: new Date().toISOString() }); saveMemory(); renderMemory(); event.currentTarget.reset(); memoryDialog.close(); });
document.querySelector("#memory-list").addEventListener("click", (event) => { const id = event.target.dataset.memoryDelete; if (!id) return; memories = memories.filter((memory) => memory.id !== id); saveMemory(); renderMemory(); });
document.querySelector("#knowledge-list").addEventListener("click", (event) => { const id = event.target.dataset.knowledgeDelete; if (!id) return; knowledgeDocuments = knowledgeDocuments.filter((document) => document.id !== id); saveMemory(); renderMemory(document.querySelector("#knowledge-search").value); });
document.querySelector("#knowledge-search").addEventListener("input", (event) => renderMemory(event.target.value));
document.querySelector("#import-knowledge-button").addEventListener("click", () => document.querySelector("#knowledge-file-input").click());
document.querySelector("#knowledge-file-input").addEventListener("change", async (event) => { for (const file of event.target.files) { knowledgeDocuments.unshift({ id: crypto.randomUUID(), title: file.name, content: await file.text(), type: file.name.split(".").pop().toUpperCase(), size: `${Math.max(1, Math.round(file.size / 1024))} KB` }); } saveMemory(); renderMemory(); event.target.value = ""; });
loadModelSettings();
window.desktop?.getModelStatus?.().then((status) => setRuntimeState(status.configured, status.configured ? `${status.model} 已连接` : "模型待配置"));
renderSkills();
renderMemory();
render();
