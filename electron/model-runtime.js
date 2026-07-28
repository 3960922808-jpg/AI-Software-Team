const fs = require("fs");
const path = require("path");
const executionRuntime = require("./execution-runtime");

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
  if (!commander.model) return { configured: false, profileCount: modelPool.profiles.size };
  const selected = resolveConfiguration("commander");
  return { configured: true, provider: commander.provider, baseUrl: selected.baseUrl, model: commander.model, profileCount: modelPool.profiles.size };
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
  let subtasks = (Array.isArray(source.subtasks) ? source.subtasks : []).slice(0, 6).map((item, index) => ({
    id: `step-${index + 1}`,
    title: String(item.title || `子任务 ${index + 1}`).slice(0, 100),
    delegateTo: agentRoles[item.delegateTo] ? item.delegateTo : fallbackAgent,
    instructions: String(item.instructions || item.title || "完成该子任务并提供可验证结果").slice(0, 4000),
    dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn.filter((value) => Number.isInteger(value) && value >= 0 && value < index).slice(0, 5) : []
  }));
  const hasProduct = subtasks.some((item) => item.delegateTo === "产品经理 Agent");
  const hasArchitecture = subtasks.some((item) => item.delegateTo === "架构师 Agent");
  const hasVerification = subtasks.some((item) => ["测试 Agent", "代码审查 Agent"].includes(item.delegateTo));
  const implementationRoles = new Set(["技术主管 Agent", "前端 Agent", "后端 Agent", "数据库 Agent", "DevOps Agent"]);
  const hasImplementation = subtasks.some((item) => implementationRoles.has(item.delegateTo));
  if (!hasProduct || !hasArchitecture || !hasImplementation || !hasVerification) {
    const implementationAgent = implementationRoles.has(fallbackAgent) ? fallbackAgent : "技术主管 Agent";
    subtasks = [
      { id: "step-1", title: "澄清需求与验收标准", delegateTo: "产品经理 Agent", instructions: "拆解用户目标、范围、约束与可验证验收标准", dependsOn: [] },
      { id: "step-2", title: "设计系统与文件结构", delegateTo: "架构师 Agent", instructions: "输出技术方案、模块边界、目录结构、运行入口与风险控制", dependsOn: [0] },
      { id: "step-3", title: "实现可运行项目", delegateTo: implementationAgent, instructions: "依据需求和架构生成完整可运行文件，不得只给片段或伪代码", dependsOn: [0, 1] },
      { id: "step-4", title: "执行测试与质量验证", delegateTo: "测试 Agent", instructions: "补齐自动化测试与启动检查，使用受控沙箱验证并报告真实结果", dependsOn: [2] },
    ];
  }
  return { goal: String(source.goal || "完成任务").slice(0, 500), subtasks };
}

function normalizeChildResult(text) {
  const parsed = parseJson(text, null);
  if (!parsed || typeof parsed !== "object") return { summary: String(text).slice(0, 12000), artifacts: [], checks: [] };
  return {
    summary: String(parsed.summary || text).slice(0, 12000),
    artifacts: (Array.isArray(parsed.artifacts) ? parsed.artifacts : []).slice(0, 12).map((item) => ({ path: String(item.path || ""), content: String(item.content || "") })),
    checks: (Array.isArray(parsed.checks) ? parsed.checks : []).slice(0, 8).map((item) => {
      if (typeof item === "string") return item.slice(0, 500);
      if (!item || typeof item !== "object") return null;
      return {
        command: String(item.command || "").slice(0, 120),
        args: (Array.isArray(item.args) ? item.args : []).slice(0, 20).map((value) => String(value).slice(0, 300)),
        cwd: String(item.cwd || ".").slice(0, 240),
        label: String(item.label || item.command || "验证").slice(0, 180),
      };
    }).filter(Boolean)
  };
}

function safeSegment(value) { return String(value || "task").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "task"; }
function writeArtifacts(taskId, stepId, artifacts) {
  if (!artifacts.length) return [];
  if (!workspacePath) throw new Error("Agent 生成了文件，但尚未选择工作目录。请先点击设置旁的工作目录按钮");
  const root = executionRuntime.taskRootFor(workspacePath, taskId, true);
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
    const overwritten = fs.existsSync(target);
    fs.writeFileSync(target, artifact.content, { encoding: "utf8" });
    return { relativePath: path.relative(workspacePath, target), projectPath: path.relative(root, target).replace(/\\/g, "/"), absolutePath: target, bytes, stepId, overwritten };
  });
}

function mergeArtifacts(current, next) {
  const merged = new Map(current.map((item) => [item.absolutePath, item]));
  for (const item of next) merged.set(item.absolutePath, item);
  return [...merged.values()];
}

function verificationFailure(verification) {
  return verification.checks.filter((check) => check.status !== "passed").map((check) => `${check.label}\n状态：${check.status}\n退出码：${check.exitCode ?? "无"}\n标准输出：\n${check.stdout || "无"}\n错误输出：\n${check.stderr || "无"}`).join("\n\n").slice(0, 24000);
}

async function verifyAndRepair({ task, plan, subtask, child, context, dependencyContext }) {
  let artifacts = writeArtifacts(task.id || Date.now(), subtask.id, child.artifacts);
  let checks = child.checks;
  let summary = child.summary;
  const repairAttempts = [];
  let verification = workspacePath && (artifacts.length || checks.length) ? await executionRuntime.runChecks(workspacePath, task.id, checks) : { checks: [], passed: true, skipped: true };
  for (let attempt = 1; !verification.passed && attempt <= 2; attempt += 1) {
    const failure = verificationFailure(verification);
    const repairText = await callModel(
      `${agentRoles[subtask.delegateTo]}你正在修复自己刚才生成的项目。只输出 JSON：{"summary":"修复内容","artifacts":[{"path":"相对路径","content":"修复后的完整文件内容"}],"checks":[{"command":"node|npm|pnpm|python|py|pytest","args":["参数"],"cwd":".","label":"检查名称"}]}。必须返回完整文件，不得输出补丁；禁止使用 shell 控制符、内联代码、绝对路径或 ..。`,
      `团队目标：${plan.goal}\n子任务：${subtask.title}\n原始说明：${task.description || task.title}\n依赖结果：\n${dependencyContext || "无"}\n项目上下文：\n${context || "无"}\n\n第 ${attempt} 轮真实执行失败：\n${failure}\n\n请定位原因、修复文件并给出可在受控沙箱运行的验证命令。`,
      subtask.delegateTo
    );
    const repaired = normalizeChildResult(repairText);
    const written = writeArtifacts(task.id, `${subtask.id}-repair-${attempt}`, repaired.artifacts);
    artifacts = mergeArtifacts(artifacts, written);
    checks = repaired.checks.length ? repaired.checks : checks;
    summary = `${summary}\n\n第 ${attempt} 轮修复：${repaired.summary}`.slice(0, 18000);
    verification = await executionRuntime.runChecks(workspacePath, task.id, checks);
    repairAttempts.push({ attempt, summary: repaired.summary, artifacts: written, verification });
  }
  return { artifacts, checks, summary, verification, repairAttempts };
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
  if (!task.id) task.id = `task-${Date.now()}`;
  const fallbackAgent = agentRoles[task.agent] ? task.agent : "技术主管 Agent";
  const context = (payload.context || []).slice(0, 10).join("\n").slice(0, 24000);
  const available = Object.keys(agentRoles).filter((agent) => payload.skills?.[agent]?.length).join("、") || Object.keys(agentRoles).join("、");
  const plugins = (Array.isArray(payload.plugins) ? payload.plugins : []).slice(0, 20);
  const pluginSummary = plugins.map((plugin) => `${plugin.name}：${plugin.skills.join("、")}`).join("；").slice(0, 8000);
  const commanderRoute = describeRoute("commander");
  const commanderText = await callModel(
    `你是软件研发团队的主 Agent。你必须把目标拆成 4-6 个真实可执行的阶段，至少依次覆盖产品经理需求与验收、架构师系统设计、开发 Agent 完整实现、测试 Agent 自动验证。只输出 JSON：{"goal":"目标","subtasks":[{"title":"子任务","delegateTo":"角色","instructions":"明确交付要求","dependsOn":[之前子任务的零基索引]}]}。可用角色：${available}。每个阶段必须能交付文件或验证结论，不要声称已经执行。`,
    `任务：${task.title}\n说明：${task.description || "无"}\n优先级：${task.priority || "medium"}\n建议角色：${fallbackAgent}\n已启用插件：${pluginSummary || "无"}\n工作目录：${workspacePath || "未选择，仅允许文本交付"}\n项目上下文：\n${context || "无"}`
  );
  const plan = normalizePlan(parseJson(commanderText, {}), fallbackAgent);
  const runs = [];
  for (let index = 0; index < plan.subtasks.length; index += 1) {
    const subtask = plan.subtasks[index];
    const dependencyContext = subtask.dependsOn.map((dependency) => runs[dependency]).filter(Boolean).map((run) => `${run.title}: ${run.summary}`).join("\n");
    const matchingPlugins = plugins.filter((plugin) => !plugin.agents?.length || plugin.agents.includes(subtask.delegateTo));
    const skills = [...new Set([...(payload.skills?.[subtask.delegateTo] || []), ...matchingPlugins.flatMap((plugin) => plugin.skills || [])])];
    const pluginInstructions = matchingPlugins.map((plugin) => `${plugin.name}：${plugin.prompt}`).join("\n").slice(0, 8000);
    const route = describeRoute(subtask.delegateTo);
    const text = await callModel(
      `${agentRoles[subtask.delegateTo]}你是主 Agent 调度的专业子 Agent。你只能使用这些特调 Skill：${skills.join("、") || "通用分析"}。必须提供真实、具体、可验证的交付。开发任务必须生成完整可运行项目、README、启动入口与必要测试，不能只给代码片段。需要创建文件时，只输出相对路径，不得包含 .. 或绝对路径。只输出 JSON：{"summary":"完成内容","artifacts":[{"path":"相对路径","content":"完整文件内容"}],"checks":[{"command":"node|npm|pnpm|python|py|pytest","args":["参数"],"cwd":".","label":"检查名称"}]}。非代码阶段可以把 checks 留空；禁止 Shell 控制符、内联代码和网络安装命令。`,
      `团队目标：${plan.goal}\n你的子任务：${subtask.title}\n执行指令：${subtask.instructions}\n插件约束：\n${pluginInstructions || "无"}\n依赖结果：\n${dependencyContext || "无"}\n原始任务：${task.title}\n项目上下文：\n${context || "无"}`,
      subtask.delegateTo
    );
    const child = normalizeChildResult(text);
    const verified = await verifyAndRepair({ task, plan, subtask, child, context, dependencyContext });
    runs.push({ ...subtask, summary: verified.summary, checks: verified.checks, artifacts: verified.artifacts, verification: verified.verification, repairAttempts: verified.repairAttempts, model: route.model, profileName: route.profileName, usedFallback: route.fallback });
  }
  const verification = {
    passed: runs.every((run) => run.verification?.passed !== false),
    checkCount: runs.reduce((total, run) => total + (run.verification?.checks?.length || 0), 0),
    repairCount: runs.reduce((total, run) => total + (run.repairAttempts?.length || 0), 0),
  };
  const git = verification.passed && workspacePath && runs.some((run) => run.artifacts.length) && payload.autoGit !== false
    ? await executionRuntime.gitSnapshot(workspacePath, task.id, `AI Team：完成 ${task.title}`)
    : { ok: false, skipped: true, message: verification.passed ? "未启用自动 Git 或本次没有文件产物" : "验证未通过，不创建 Git 版本" };
  const reviewText = await callModel(
    "你是软件研发团队的主 Agent。审查所有子 Agent 的结果，指出已完成内容、可用产物、真实执行结果、自动修复次数、Git 版本和仍存风险。任何检查未通过时必须明确标记未完成，禁止虚构测试或文件。输出清晰的 Markdown。",
    `原始任务：${task.title}\n目标：${plan.goal}\n验证汇总：${JSON.stringify(verification)}\nGit：${JSON.stringify(git)}\n子 Agent 结果：\n${JSON.stringify(runs, null, 2).slice(0, 50000)}`
  );
  return { plan, runs, result: reviewText, verification, git, pluginsUsed: plugins.map((plugin) => ({ id: plugin.id, name: plugin.name })), sandbox: executionRuntime.policyStatus(), taskRoot: workspacePath ? executionRuntime.taskRootFor(workspacePath, task.id, true) : null, delegateTo: runs.map((run) => run.delegateTo).filter((value, index, all) => all.indexOf(value) === index).join(" + "), model: commanderRoute.model, profileName: commanderRoute.profileName, modelRoutes: [commanderRoute, ...runs.map((run) => ({ target: run.delegateTo, model: run.model, profileName: run.profileName, fallback: run.usedFallback }))], workspacePath, completedAt: new Date().toISOString() };
}

async function chat(payload) {
  const history = (payload.messages || []).slice(-12).map((message) => `${message.role === "user" ? "用户" : "灵灵"}：${message.content}`).join("\n").slice(0, 24000);
  const context = (payload.context || []).slice(0, 10).join("\n").slice(0, 16000);
  const plugins = (Array.isArray(payload.plugins) ? payload.plugins : []).slice(0, 20).map((plugin) => `${plugin.name}：${plugin.skills.join("、")}`).join("；").slice(0, 6000);
  const text = await callModel(
    "你是 AI 软件团队的项目经理灵灵。回答必须专业、具体、可执行。你可以回答、分析，也可以建议创建任务。只输出 JSON：{\"reply\":\"Markdown 回答\",\"action\":null}；需要行动时 action 为 {\"type\":\"create_task\"或\"create_and_execute\",\"title\":\"任务名\",\"description\":\"清晰交付要求\",\"priority\":\"high|medium|low\",\"agent\":\"建议 Agent\"}。未经用户明确要求不要自动执行。",
    `团队上下文：\n${context || "暂无"}\n启用插件：${plugins || "无"}\n工作目录：${workspacePath || "未选择"}\n\n对话记录：\n${history}`
  );
  const parsed = parseJson(text, null);
  const route = describeRoute("commander");
  if (!parsed) return { content: text, action: null, model: route.model, profileName: route.profileName };
  return { content: String(parsed.reply || text), action: parsed.action && typeof parsed.action === "object" ? parsed.action : null, model: route.model, profileName: route.profileName };
}

module.exports = { configure, clear, configurePool, clearPool, poolStatus, status, setWorkspace, getWorkspace, testConnection, testProfile, executeTask, chat };
