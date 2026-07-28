const fs = require("fs");
const path = require("path");

let configuration = null;
let modelPool = { profiles: new Map(), assignments: {} };
let workspacePath = null;

const agentRoles = {
  "产品经理 Agent": "你是产品经理，擅长需求分析、PRD、验收标准和优先级规划。",
  "架构师 Agent": "你是软件架构师，擅长系统架构、技术选型、接口契约和非功能需求。",
  "技术主管 Agent": "你是技术主管，擅长实施规划、代码质量、风险识别和跨模块协调。",
  "安全专家 Agent": "你是安全专家，擅长威胁建模、依赖审查、权限设计和安全验收。",
  "前端 Agent": "你是前端工程师，擅长桌面界面、组件设计、状态管理、性能和可访问性。",
  "后端 Agent": "你是后端工程师，擅长 API、领域模型、队列和外部服务集成。",
  "数据库 Agent": "你是数据库工程师，擅长数据模型、SQL 优化、索引与迁移管理。",
  "测试 Agent": "你是测试工程师，擅长测试策略、自动化测试、异常路径和质量报告。",
  "代码审查 Agent": "你是代码审查专家，擅长缺陷发现、规范检查、可维护性和重构建议。",
  "DevOps Agent": "你是运维与支持工程师，擅长构建、发布、部署、监控和故障恢复。"
};

function normalizeConfiguration(next) {
  if (!next || !next.apiKey || !next.model || !next.baseUrl) throw new Error("模型、API 地址和 API Key 均不能为空");
  const url = new URL(next.baseUrl);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("API 地址必须使用 HTTP 或 HTTPS");
  return { provider: next.provider, baseUrl: next.baseUrl.replace(/\/$/, ""), model: next.model, apiKey: next.apiKey, routingMode: next.routingMode || "balanced" };
}

function configure(next) {
  configuration = normalizeConfiguration(next);
  return status();
}

function clear() { configuration = null; }
function configurePool(next) {
  const profiles = new Map();
  for (const profile of next?.profiles || []) {
    const normalized = normalizeConfiguration(profile);
    profiles.set(profile.id, { ...normalized, id: profile.id, name: profile.name || profile.model });
  }
  const assignments = Object.fromEntries(Object.entries(next?.assignments || {}).filter(([, profileId]) => profiles.has(profileId)));
  modelPool = { profiles, assignments };
  return poolStatus();
}
function clearPool() { modelPool = { profiles: new Map(), assignments: {} }; }
function resolveConfiguration(target = "commander") {
  const profileId = modelPool.assignments[target];
  const profile = profileId ? modelPool.profiles.get(profileId) : null;
  if (profile) return profile;
  if (configuration) return { ...configuration, id: "primary", name: "主模型" };
  throw new Error(`请先为${target === "commander" ? "主 Agent" : target}绑定模型，或在设置中保存主模型 API`);
}
function describeRoute(target = "commander") {
  try {
    const selected = resolveConfiguration(target);
    return { target, profileId: selected.id, profileName: selected.name, provider: selected.provider, model: selected.model, fallback: selected.id === "primary" };
  } catch {
    return { target, profileId: null, profileName: null, provider: null, model: null, fallback: false };
  }
}
function poolStatus() {
  return {
    profileCount: modelPool.profiles.size,
    assignments: { ...modelPool.assignments },
    routes: Object.keys(modelPool.assignments).map(describeRoute),
  };
}
function status() {
  const commander = describeRoute("commander");
  return commander.model ? { configured: true, provider: commander.provider, model: commander.model, profileCount: modelPool.profiles.size } : { configured: false, profileCount: modelPool.profiles.size };
}
function setWorkspace(nextPath) {
  if (!nextPath) { workspacePath = null; return { path: null }; }
  const resolved = path.resolve(nextPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("所选工作目录不存在");
  workspacePath = resolved;
  return { path: workspacePath };
}
function getWorkspace() { return { path: workspacePath }; }

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`模型 API 返回 ${response.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

async function callModel(system, user, target = "commander") {
  const { provider, baseUrl, model, apiKey } = resolveConfiguration(target);
  if (provider === "anthropic") {
    const endpoint = baseUrl.endsWith("/v1") ? `${baseUrl}/messages` : `${baseUrl}/v1/messages`;
    const data = await requestJson(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 6000, system, messages: [{ role: "user", content: user }] }) });
    return data.content?.map((item) => item.text || "").join("") || "";
  }
  if (provider === "google") {
    const endpoint = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const data = await requestJson(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.2 } }) });
    return data.candidates?.[0]?.content?.parts?.map((item) => item.text || "").join("") || "";
  }
  const endpoint = baseUrl.endsWith("/v1") ? `${baseUrl}/chat/completions` : `${baseUrl}/chat/completions`;
  const data = await requestJson(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  return data.choices?.[0]?.message?.content || "";
}

function parseJson(text, fallback) {
  try {
    const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
    const source = fenced ? fenced[1] : String(text).slice(String(text).indexOf("{"), String(text).lastIndexOf("}") + 1);
    return JSON.parse(source);
  } catch { return fallback; }
}

function normalizePlan(raw, fallbackAgent) {
  const source = raw && typeof raw === "object" ? raw : {};
  const subtasks = (Array.isArray(source.subtasks) ? source.subtasks : []).slice(0, 6).map((item, index) => ({
    id: `step-${index + 1}`,
    title: String(item.title || `子任务 ${index + 1}`).slice(0, 100),
    delegateTo: agentRoles[item.delegateTo] ? item.delegateTo : fallbackAgent,
    instructions: String(item.instructions || item.title || "完成该子任务并提供可验证结果").slice(0, 4000),
    dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn.filter((value) => Number.isInteger(value) && value >= 0 && value < index).slice(0, 5) : []
  }));
  if (!subtasks.length) subtasks.push({ id: "step-1", title: "完成任务", delegateTo: fallbackAgent, instructions: "完成原始任务并提供可验证结果", dependsOn: [] });
  return { goal: String(source.goal || "完成任务").slice(0, 500), subtasks };
}

function normalizeChildResult(text) {
  const parsed = parseJson(text, null);
  if (!parsed || typeof parsed !== "object") return { summary: String(text).slice(0, 12000), artifacts: [], checks: [] };
  return {
    summary: String(parsed.summary || text).slice(0, 12000),
    artifacts: (Array.isArray(parsed.artifacts) ? parsed.artifacts : []).slice(0, 12).map((item) => ({ path: String(item.path || ""), content: String(item.content || "") })),
    checks: (Array.isArray(parsed.checks) ? parsed.checks : []).slice(0, 20).map(String)
  };
}

function safeSegment(value) { return String(value || "task").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "task"; }
function writeArtifacts(taskId, stepId, artifacts) {
  if (!artifacts.length) return [];
  if (!workspacePath) throw new Error("Agent 生成了文件，但尚未选择工作目录。请先点击设置旁的工作目录按钮");
  const root = path.join(workspacePath, ".ai-team-output", safeSegment(taskId), safeSegment(stepId));
  fs.mkdirSync(root, { recursive: true });
  let totalBytes = 0;
  return artifacts.map((artifact) => {
    const relative = artifact.path.replace(/\\/g, "/").replace(/^\.\//, "");
    if (!relative || path.isAbsolute(relative) || relative.split("/").includes("..")) throw new Error(`拒绝不安全的产物路径：${artifact.path}`);
    const bytes = Buffer.byteLength(artifact.content, "utf8");
    totalBytes += bytes;
    if (bytes > 512 * 1024 || totalBytes > 2 * 1024 * 1024) throw new Error("Agent 产物超过单文件 512KB 或总计 2MB 的安全限制");
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error(`拒绝越界产物路径：${artifact.path}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, artifact.content, { encoding: "utf8", flag: "wx" });
    return { relativePath: path.relative(workspacePath, target), absolutePath: target, bytes };
  });
}

async function testConnection() {
  const response = await callModel("你是连接测试助手。", "只回复：连接成功");
  return { ok: true, message: response.slice(0, 100) };
}

async function testProfile(profileId) {
  const profile = modelPool.profiles.get(profileId);
  if (!profile) throw new Error("要测试的模型连接不存在");
  const temporaryTarget = `test:${profileId}`;
  modelPool.assignments[temporaryTarget] = profileId;
  try {
    const response = await callModel("你是连接测试助手。", "只回复：连接成功", temporaryTarget);
    return { ok: true, message: response.slice(0, 100), model: profile.model, profileName: profile.name };
  } finally {
    delete modelPool.assignments[temporaryTarget];
  }
}

async function executeTask(payload) {
  const task = payload?.task || {};
  const fallbackAgent = agentRoles[task.agent] ? task.agent : "技术主管 Agent";
  const context = (payload.context || []).slice(0, 10).join("\n").slice(0, 24000);
  const available = Object.keys(agentRoles).filter((agent) => payload.skills?.[agent]?.length).join("、") || Object.keys(agentRoles).join("、");
  const commanderRoute = describeRoute("commander");
  const commanderText = await callModel(
    `你是软件研发团队的主 Agent。你必须把目标拆成 1-6 个真实可执行的子任务，并分派给不同专业子 Agent。只输出 JSON：{"goal":"目标","subtasks":[{"title":"子任务","delegateTo":"角色","instructions":"明确交付要求","dependsOn":[之前子任务的零基索引]}]}。可用角色：${available}。不要声称已经执行。`,
    `任务：${task.title}\n说明：${task.description || "无"}\n优先级：${task.priority || "medium"}\n建议角色：${fallbackAgent}\n工作目录：${workspacePath || "未选择，仅允许文本交付"}\n项目上下文：\n${context || "无"}`
  );
  const plan = normalizePlan(parseJson(commanderText, {}), fallbackAgent);
  const runs = [];
  for (let index = 0; index < plan.subtasks.length; index += 1) {
    const subtask = plan.subtasks[index];
    const dependencyContext = subtask.dependsOn.map((dependency) => runs[dependency]).filter(Boolean).map((run) => `${run.title}: ${run.summary}`).join("\n");
    const skills = payload.skills?.[subtask.delegateTo] || [];
    const route = describeRoute(subtask.delegateTo);
    const text = await callModel(
      `${agentRoles[subtask.delegateTo]}你是主 Agent 调度的专业子 Agent。你只能使用这些特调 Skill：${skills.join("、") || "通用分析"}。必须提供真实、具体、可验证的交付。需要创建文件时，只输出相对路径，不得包含 .. 或绝对路径。只输出 JSON：{"summary":"完成内容","artifacts":[{"path":"相对路径","content":"完整文件内容"}],"checks":["验证命令或检查项"]}。`,
      `团队目标：${plan.goal}\n你的子任务：${subtask.title}\n执行指令：${subtask.instructions}\n依赖结果：\n${dependencyContext || "无"}\n原始任务：${task.title}\n项目上下文：\n${context || "无"}`,
      subtask.delegateTo
    );
    const child = normalizeChildResult(text);
    const writtenArtifacts = writeArtifacts(task.id || Date.now(), subtask.id, child.artifacts);
    runs.push({ ...subtask, summary: child.summary, checks: child.checks, artifacts: writtenArtifacts, model: route.model, profileName: route.profileName, usedFallback: route.fallback });
  }
  const reviewText = await callModel(
    "你是软件研发团队的主 Agent。审查所有子 Agent 的结果，指出已完成内容、可用产物、验证方式和仍存风险。禁止虚构测试或文件。输出清晰的 Markdown。",
    `原始任务：${task.title}\n目标：${plan.goal}\n子 Agent 结果：\n${JSON.stringify(runs, null, 2).slice(0, 50000)}`
  );
  return { plan, runs, result: reviewText, delegateTo: runs.map((run) => run.delegateTo).filter((value, index, all) => all.indexOf(value) === index).join(" + "), model: commanderRoute.model, profileName: commanderRoute.profileName, modelRoutes: [commanderRoute, ...runs.map((run) => ({ target: run.delegateTo, model: run.model, profileName: run.profileName, fallback: run.usedFallback }))], workspacePath, completedAt: new Date().toISOString() };
}

async function chat(payload) {
  const history = (payload.messages || []).slice(-12).map((message) => `${message.role === "user" ? "用户" : "灵灵"}：${message.content}`).join("\n").slice(0, 24000);
  const context = (payload.context || []).slice(0, 10).join("\n").slice(0, 16000);
  const text = await callModel(
    "你是 AI 软件团队的项目经理灵灵。回答必须专业、具体、可执行。你可以回答、分析，也可以建议创建任务。只输出 JSON：{\"reply\":\"Markdown 回答\",\"action\":null}；需要行动时 action 为 {\"type\":\"create_task\"或\"create_and_execute\",\"title\":\"任务名\",\"description\":\"清晰交付要求\",\"priority\":\"high|medium|low\",\"agent\":\"建议 Agent\"}。未经用户明确要求不要自动执行。",
    `团队上下文：\n${context || "暂无"}\n工作目录：${workspacePath || "未选择"}\n\n对话记录：\n${history}`
  );
  const parsed = parseJson(text, null);
  const route = describeRoute("commander");
  if (!parsed) return { content: text, action: null, model: route.model, profileName: route.profileName };
  return { content: String(parsed.reply || text), action: parsed.action && typeof parsed.action === "object" ? parsed.action : null, model: route.model, profileName: route.profileName };
}

module.exports = { configure, clear, configurePool, clearPool, poolStatus, status, setWorkspace, getWorkspace, testConnection, testProfile, executeTask, chat };
