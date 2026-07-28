const storageKeys = {
  tasks: "ai-software-team.tasks",
  agents: "ai-software-team.office-agents",
  memory: "ai-software-team.memory",
  knowledge: "ai-software-team.knowledge",
  deployments: "ai-software-team.deployments",
  externalResources: "ai-software-team.external-resources"
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
let tasks = loadJson(storageKeys.tasks, []);
if (!Array.isArray(tasks)) tasks = [];
let officeAgents = loadJson(storageKeys.agents, defaultOfficeAgents);
let memories = loadJson(storageKeys.memory, []);
let knowledgeDocuments = loadJson(storageKeys.knowledge, []);
let deploymentRecords = loadJson(storageKeys.deployments, []);
let externalResources = loadJson(storageKeys.externalResources, []);
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
let enabledSkills = new Set(skillCatalog.flatMap(([, , skills]) => skills.map(([, description]) => description)));
let eventLog = ["灵灵已进入工作室", "Agent 团队等待新的任务"];
let selectedAgentId = null;
let complaintAgentId = null;
let complaintText = "";
let chatMessages = [];
let workspacePath = null;
let deliveryReport = null;
let lastReleasePath = null;
let modelPoolState = { profiles: [], assignments: {} };

const modelPoolTargets = [
  ["commander", "CO", "主 Agent", "任务拆解、路由与最终审查"],
  ...roleAgents.map(([code, role, specialty]) => [role, code, role, specialty]),
];

function saveTasks() { localStorage.setItem(storageKeys.tasks, JSON.stringify(tasks)); }
function saveAgents() { localStorage.setItem(storageKeys.agents, JSON.stringify(officeAgents)); }
function saveMemory() { localStorage.setItem(storageKeys.memory, JSON.stringify(memories)); localStorage.setItem(storageKeys.knowledge, JSON.stringify(knowledgeDocuments)); }
function saveDeployments() { localStorage.setItem(storageKeys.deployments, JSON.stringify(deploymentRecords)); }
function saveExternalResources() { localStorage.setItem(storageKeys.externalResources, JSON.stringify(externalResources)); }
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
  renderOffice(); renderOrchestrator(); renderMemory(); renderDeploymentHistory(); renderExternalResources(); renderAudit();
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
  list.innerHTML = filtered.length ? filtered.map((record) => `<details class="audit-record"><summary><span class="audit-kind">${escapeHtml(record.kind)}</span><div><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.agent)} · ${record.timestamp ? new Date(record.timestamp).toLocaleString("zh-CN") : "尚未开始"}</small></div><span class="audit-record-meta">${record.stepCount} 步 · ${record.artifactCount} 个产物</span><b class="audit-status ${record.status === "成功" ? "success" : record.status === "失败" ? "failure" : "pending"}">${record.status}</b></summary><div class="audit-record-body"><p>${escapeHtml(record.summary)}</p>${record.steps.length ? `<ol>${record.steps.map((step) => `<li><strong>${escapeHtml(step.agent)} · ${escapeHtml(step.title)}</strong><p>${escapeHtml(step.summary || "未返回摘要")}</p><small>${step.artifacts.length ? `产物：${step.artifacts.map(escapeHtml).join("、")}` : "无文件产物"}</small></li>`).join("")}</ol>` : ""}${record.url ? `<a href="${escapeHtml(record.url)}" target="_blank" rel="noreferrer">${escapeHtml(record.url)}</a>` : ""}</div></details>`).join("") : '<p class="empty-state">没有符合筛选条件的运行记录</p>';
}

function renderExternalResources() {
  const repositories = externalResources.filter((resource) => resource.type === "repository");
  const documents = externalResources.filter((resource) => resource.type === "document");
  const characters = externalResources.reduce((total, resource) => total + JSON.stringify(resource.data || {}).length, 0);
  document.querySelector("#repository-resource-count").textContent = repositories.length;
  document.querySelector("#document-resource-count").textContent = documents.length;
  document.querySelector("#resource-character-count").textContent = characters.toLocaleString("zh-CN");
  document.querySelector("#resource-updated-at").textContent = externalResources.length ? `更新于 ${new Date(externalResources[0].createdAt).toLocaleString("zh-CN")}` : "暂无资源";
  document.querySelector("#external-resources").innerHTML = externalResources.length ? externalResources.map((resource) => {
    if (resource.type === "repository") {
      const data = resource.data;
      return `<article class="external-resource"><header><span class="resource-type">代码仓库</span><button type="button" data-delete-resource="${resource.id}" title="移除资源">×</button></header><h3>${escapeHtml(data.name)}</h3><p>${escapeHtml(data.description || "未填写仓库说明")}</p><dl><div><dt>默认分支</dt><dd>${escapeHtml(data.defaultBranch)}</dd></div><div><dt>主要语言</dt><dd>${escapeHtml(data.language)}</dd></div><div><dt>文件路径</dt><dd>${data.files.length}</dd></div></dl><small>${data.truncated ? "文件列表已截断" : "文件列表完整"}</small></article>`;
    }
    const data = resource.data;
    return `<article class="external-resource"><header><span class="resource-type">网页资料</span><button type="button" data-delete-resource="${resource.id}" title="移除资源">×</button></header><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.content.slice(0, 220))}${data.content.length > 220 ? "…" : ""}</p><a href="${escapeHtml(data.url)}" target="_blank" rel="noreferrer">${escapeHtml(data.url)}</a><small>${data.content.length.toLocaleString("zh-CN")} 个字符</small></article>`;
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
  document.querySelector("#delivery-scan-time").textContent = `检查于 ${new Date(report.scannedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  document.querySelector("#delivery-artifacts").innerHTML = report.artifacts.length ? report.artifacts.map((file) => `<tr><td title="${escapeHtml(file.relativePath)}"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(file.relativePath)}</small></td><td>${formatFileSize(file.size)}</td><td><code title="${file.sha256}">${file.sha256.slice(0, 12)}</code></td><td>${new Date(file.modifiedAt).toLocaleString("zh-CN")}</td></tr>`).join("") : '<tr><td colspan="4">暂无智能体文件产物</td></tr>';
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
  document.querySelector("#deployment-history").innerHTML = deploymentRecords.length ? deploymentRecords.slice(0, 20).map((record) => `<article class="deployment-record"><span class="deployment-status ${record.status === "成功" ? "success" : "failure"}">${escapeHtml(record.status)}</span><div><strong>${escapeHtml(record.environment)} · ${escapeHtml(record.version || "未关联版本")}</strong><p>${escapeHtml(record.note || "未填写说明")}</p>${record.url ? `<a href="${escapeHtml(record.url)}" target="_blank" rel="noreferrer">${escapeHtml(record.url)}</a>` : ""}</div><time>${new Date(record.createdAt).toLocaleString("zh-CN")}</time></article>`).join("") : '<p class="empty-state">暂无部署记录</p>';
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

function setModelPoolFeedback(message, type = "") {
  const feedback = document.querySelector("#model-pool-feedback");
  feedback.textContent = message;
  feedback.className = `model-pool-feedback ${type}`.trim();
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
}

async function loadModelPool() {
  if (!window.desktop?.getModelPool) { renderModelPool(); setModelPoolFeedback("模型池仅在 Electron 桌面版中可用", "error"); return; }
  try { modelPoolState = await window.desktop.getModelPool(); renderModelPool(); }
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
  const button = document.querySelector("#run-queue-button"); button.disabled = true; button.textContent = "Agent 执行中";
  tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "progress", running: true, startedAt: Date.now() } : item); eventLog.unshift(`灵灵正在分析“${task.title}”`); saveTasks(); render();
  try {
    const response = await window.desktop.executeAgentTask({ task, skills: skillMap(), context: getTeamContext() });
    const files = response.runs.flatMap((run) => run.artifacts || []);
    tasks = tasks.map((item) => item.id === task.id ? { ...item, status: "done", running: false, agent: response.delegateTo, plan: response.plan, runs: response.runs, artifacts: files, result: response.result, completedAt: response.completedAt } : item);
    eventLog.unshift(`${response.runs.length} 个子 Agent 步骤已完成“${task.title}”，生成 ${files.length} 个文件`);
    const teamReport = response.runs.map((run, index) => `${index + 1}. ${run.delegateTo} · ${run.title}${run.model ? ` · ${run.model}` : ""}\n${run.summary}`).join("\n\n");
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
  const task = { id: crypto.randomUUID(), title: String(action.title || "AI 创建的任务").slice(0, 60), description: String(action.description || "").slice(0, 1000), agent: validAgents.includes(action.agent) ? action.agent : "技术主管 Agent", priority: ["high", "medium", "low"].includes(action.priority) ? action.priority : "medium", status: "todo", createdAt: new Date().toISOString() };
  tasks.unshift(task); message.action = null; saveTasks(); render(); renderChat();
  eventLog.unshift(`灵灵从对话创建了“${task.title}”`);
  if (action.type === "create_and_execute") await executeNextTask(task.id);
}

function activateView(name) { document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === name)); document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === name)); }
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => activateView(button.dataset.openView)));

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
  state.textContent = configured ? "令牌已配置" : "未配置令牌";
  state.classList.toggle("connected", configured);
  const status = document.querySelector("#integration-status");
  status.classList.toggle("connected", configured);
  status.querySelector("span:last-child").textContent = configured ? "令牌访问模式" : "公开访问模式";
}
document.querySelector("#integration-settings-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  try { const result = await window.desktop.configureIntegrations({ githubToken: data.get("githubToken").trim() }); setIntegrationStatus(result.githubTokenConfigured); event.currentTarget.githubToken.value = ""; }
  catch (error) { document.querySelector("#github-token-state").textContent = error.message; }
});
document.querySelector("#clear-integration-token").addEventListener("click", async () => { const result = await window.desktop?.clearIntegrations?.(); setIntegrationStatus(result?.githubTokenConfigured); document.querySelector("#integration-settings-form").reset(); });
document.querySelector("#repository-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "正在读取";
  try { const repository = await window.desktop.inspectRepository(data.get("repository")); externalResources = externalResources.filter((resource) => resource.type !== "repository" || resource.data.id !== repository.id); externalResources.unshift({ id: crypto.randomUUID(), type: "repository", data: repository, createdAt: new Date().toISOString() }); saveExternalResources(); renderExternalResources(); event.currentTarget.reset(); }
  catch (error) { eventLog.unshift(`仓库读取失败：${error.message}`); renderOrchestrator(); }
  finally { button.disabled = false; button.textContent = "连接仓库"; }
});
document.querySelector("#document-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); const data = new FormData(event.currentTarget);
  button.disabled = true; button.textContent = "正在读取";
  try { const documentResource = await window.desktop.fetchDocument(data.get("url")); externalResources = externalResources.filter((resource) => resource.type !== "document" || resource.data.url !== documentResource.url); externalResources.unshift({ id: crypto.randomUUID(), type: "document", data: documentResource, createdAt: new Date().toISOString() }); saveExternalResources(); renderExternalResources(); event.currentTarget.reset(); }
  catch (error) { eventLog.unshift(`资料读取失败：${error.message}`); renderOrchestrator(); }
  finally { button.disabled = false; button.textContent = "读取资料"; }
});
document.querySelector("#external-resources").addEventListener("click", (event) => { const id = event.target.dataset.deleteResource; if (!id) return; externalResources = externalResources.filter((resource) => resource.id !== id); saveExternalResources(); renderExternalResources(); });
document.querySelector("#clear-resources-button").addEventListener("click", () => { if (!externalResources.length || confirm("确定清空所有外部资源吗？")) { externalResources = []; saveExternalResources(); renderExternalResources(); } });

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
  if (deleteId && confirm("确定删除这个模型连接吗？相关智能体将自动回退到主模型。")) {
    try { modelPoolState = await window.desktop.deleteModelProfile(deleteId); renderModelPool(); setModelPoolFeedback("模型连接已删除，相关路由已回退", "success"); }
    catch (error) { setModelPoolFeedback(`删除失败：${error.message}`, "error"); }
  }
});
document.querySelector("#model-routing-list").addEventListener("change", async (event) => {
  const target = event.target.dataset.modelTarget;
  if (!target) return;
  event.target.disabled = true;
  try {
    modelPoolState = await window.desktop.assignModelProfile(target, event.target.value || null);
    renderModelPool();
    const selected = modelPoolState.profiles.find((profile) => profile.id === modelPoolState.assignments[target]);
    setModelPoolFeedback(`${target === "commander" ? "主 Agent" : target} 已${selected ? `绑定 ${selected.name}` : "回退到主模型"}`, "success");
    const runtime = await window.desktop.getModelStatus();
    setRuntimeState(runtime.configured, runtime.configured ? `${runtime.model} 已连接` : "模型待配置");
  } catch (error) { setModelPoolFeedback(`路由保存失败：${error.message}`, "error"); renderModelPool(); }
});

document.querySelector("#skills-grid").addEventListener("change", (event) => { const skill = event.target.dataset.skill; if (!skill) return; event.target.checked ? enabledSkills.add(skill) : enabledSkills.delete(skill); renderSkills(); });
document.querySelector("#provider-select").addEventListener("change", applyProviderDefaults);
document.querySelector("#model-settings-form").addEventListener("submit", async (event) => { event.preventDefault(); const button = document.querySelector("#save-model-button"); const config = getModelFormConfig(); button.disabled = true; button.textContent = "保存中"; setModelFeedback("正在调用 Windows 系统加密服务…"); try { const result = await configureRuntime(config); localStorage.removeItem("ai-software-team.model-settings"); event.currentTarget.apiKey.value = ""; applyModelSettings(result); setModelFeedback("保存成功，关闭并重新打开软件后仍可使用", "success"); eventLog.unshift(`灵灵已保存并连接 ${config.model}`); render(); } catch (error) { const status = await window.desktop?.getModelStatus?.().catch(() => null); if (status) setRuntimeState(status.configured, status.configured ? `${status.model} 已连接` : "模型待配置"); setModelFeedback(`保存失败：${error.message}`, "error"); eventLog.unshift(`配置失败：${error.message}`); renderOrchestrator(); } finally { button.disabled = false; button.textContent = "保存连接配置"; } });
document.querySelector("#test-api-button").addEventListener("click", async () => { const button = document.querySelector("#test-api-button"); button.disabled = true; button.textContent = "测试中"; setModelFeedback("正在保存当前配置并测试模型响应…"); try { const config = getModelFormConfig(); const configured = await configureRuntime(config); document.querySelector("#model-settings-form").apiKey.value = ""; applyModelSettings(configured); const result = await window.desktop.testModel(); setRuntimeState(true, `${configured.model} 已连接`); setModelFeedback(`连接测试成功：${result.message}`, "success"); eventLog.unshift(`连接测试成功：${result.message}`); } catch (error) { setModelFeedback(`连接测试失败：${error.message}`, "error"); eventLog.unshift(`连接测试失败：${error.message}`); } finally { button.disabled = false; button.textContent = "测试连接"; renderOrchestrator(); } });
document.querySelector("#clear-api-button").addEventListener("click", async () => { try { await window.desktop?.clearModel?.(); localStorage.removeItem("ai-software-team.model-settings"); sessionStorage.removeItem("ai-software-team.model-settings"); const form = document.querySelector("#model-settings-form"); form.reset(); form.apiKey.placeholder = "输入密钥"; document.querySelector("#api-key-hint").textContent = "密钥将由 Windows 系统加密后保存在本机"; applyProviderDefaults(); setRuntimeState(false, "模型待配置"); setModelFeedback("已删除本机保存的模型配置", "success"); } catch (error) { setModelFeedback(`清除失败：${error.message}`, "error"); } });

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

loadModelSettings(); loadModelPool(); renderSkills(); renderChat(); render();
window.desktop?.getWorkspace?.().then((result) => setWorkspaceState(result.path || null));
window.desktop?.getIntegrationStatus?.().then((result) => setIntegrationStatus(result.githubTokenConfigured));
