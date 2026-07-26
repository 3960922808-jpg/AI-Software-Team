const storageKey = "ai-software-team.tasks";
const sampleTasks = [
  { id: "t1", title: "梳理 MVP 用户需求", description: "明确项目经理、研发 Agent 与交付流程的首批使用场景。", agent: "产品经理 Agent", priority: "high", status: "todo" },
  { id: "t2", title: "定义任务编排领域模型", description: "建立任务、Agent、状态流转及执行记录的基础契约。", agent: "架构师 Agent", priority: "high", status: "progress" },
  { id: "t3", title: "创建项目工作台原型", description: "完成需求概览、看板与任务分派的首个可用界面。", agent: "前端 Agent", priority: "medium", status: "done" }
];

function loadTasks() { try { return JSON.parse(localStorage.getItem(storageKey)) || sampleTasks; } catch { return sampleTasks; } }
let tasks = loadTasks();
const labels = { todo: "待处理", progress: "进行中", done: "已完成" };
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
render();
