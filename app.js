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
function saveTasks() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function render() {
  document.querySelectorAll(".column").forEach((column) => {
    const status = column.dataset.status;
    const items = tasks.filter((task) => task.status === status);
    column.querySelector(".count").textContent = items.length;
    column.querySelector(".task-list").innerHTML = items.map((task) => {
      const previous = status === "progress" ? "todo" : status === "done" ? "progress" : null;
      const next = status === "todo" ? "progress" : status === "progress" ? "done" : null;
      return `<article class="task"><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.description || "未填写任务说明")}</p><div class="task-footer"><span class="agent">${escapeHtml(task.agent)}</span><span class="priority ${task.priority}">${({high:"高",medium:"中",low:"低"})[task.priority]}</span></div><div class="task-actions">${previous ? `<button class="move-button" data-id="${task.id}" data-status="${previous}">← ${labels[previous]}</button>` : "<span></span>"}${next ? `<button class="move-button" data-id="${task.id}" data-status="${next}">${labels[next]} →</button>` : "<button class=\"move-button delete-button\" data-delete=\"${task.id}\">删除</button>"}</div></article>`;
    }).join("");
  });
  document.querySelector("#metric-todo").textContent = tasks.filter((task) => task.status === "todo").length;
  document.querySelector("#metric-progress").textContent = tasks.filter((task) => task.status === "progress").length;
  document.querySelector("#metric-done").textContent = tasks.filter((task) => task.status === "done").length;
  document.querySelector("#metric-high").textContent = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  document.querySelector("#task-total").textContent = `${tasks.length} 项任务`;
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
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === button.dataset.view));
}));
document.querySelector("#run-queue-button").addEventListener("click", () => {
  const nextTask = tasks.find((task) => task.status === "todo");
  if (!nextTask) { eventLog.unshift("没有可启动的待处理任务"); renderOrchestrator(); return; }
  tasks = tasks.map((task) => task.id === nextTask.id ? { ...task, status: "progress" } : task);
  eventLog.unshift(`${nextTask.agent} 已接收任务“${nextTask.title}”`); saveTasks(); render();
});
render();
