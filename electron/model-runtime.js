let configuration = null;

const agentRoles = {
  "产品经理 Agent": "你是产品经理，擅长需求分析、PRD、验收标准和优先级规划。",
  "架构师 Agent": "你是软件架构师，擅长系统架构、技术选型、接口契约和非功能需求。",
  "技术主管 Agent": "你是技术主管，擅长实施规划、代码质量、风险识别和跨模块协调。",
  "安全专家 Agent": "你是安全专家，擅长威胁建模、依赖审查、权限设计和安全验收。",
  "前端 Agent": "你是前端工程师，擅长桌面界面、组件设计、状态管理、性能和可访问性。",
  "后端 Agent": "你是后端工程师，擅长 API、领域模型、数据库、队列和外部服务集成。",
  "测试 Agent": "你是测试工程师，擅长测试策略、自动化测试、异常路径和质量报告。",
  "DevOps Agent": "你是 DevOps 工程师，擅长构建、发布、部署、监控和故障恢复。"
};

function configure(next) {
  if (!next || !next.apiKey || !next.model || !next.baseUrl) throw new Error("模型、API 地址和 API Key 均不能为空");
  const url = new URL(next.baseUrl);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("API 地址必须使用 HTTP 或 HTTPS");
  configuration = { provider: next.provider, baseUrl: next.baseUrl.replace(/\/$/, ""), model: next.model, apiKey: next.apiKey, routingMode: next.routingMode || "balanced" };
  return { configured: true, provider: configuration.provider, model: configuration.model };
}

function clear() { configuration = null; }
function status() { return configuration ? { configured: true, provider: configuration.provider, model: configuration.model } : { configured: false }; }

async function requestJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`模型 API 返回 ${response.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

async function callModel(system, user) {
  if (!configuration) throw new Error("请先在“模型与 API”页面保存连接配置");
  const { provider, baseUrl, model, apiKey } = configuration;
  if (provider === "anthropic") {
    const data = await requestJson(`${baseUrl}/v1/messages`, { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 3000, system, messages: [{ role: "user", content: user }] }) });
    return data.content?.map((item) => item.text || "").join("") || "";
  }
  if (provider === "google") {
    const data = await requestJson(`${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }] }) });
    return data.candidates?.[0]?.content?.parts?.map((item) => item.text || "").join("") || "";
  }
  const data = await requestJson(`${baseUrl}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  return data.choices?.[0]?.message?.content || "";
}

function parsePlan(text, fallbackAgent) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    return { plan: String(parsed.plan || "执行任务"), delegateTo: agentRoles[parsed.delegateTo] ? parsed.delegateTo : fallbackAgent, instructions: String(parsed.instructions || parsed.plan || "完成任务并提供可执行结果") };
  } catch {
    return { plan: text.slice(0, 1000), delegateTo: fallbackAgent, instructions: text };
  }
}

async function testConnection() {
  const response = await callModel("你是连接测试助手。", "只回复：连接成功");
  return { ok: true, message: response.slice(0, 100) };
}

async function executeTask(payload) {
  const fallbackAgent = agentRoles[payload.task.agent] ? payload.task.agent : "技术主管 Agent";
  const context = (payload.context || []).slice(0, 8).join("\n");
  const commanderText = await callModel(
    "你是软件研发团队的指挥 Agent。你负责分析目标并委派给一个专业 Agent。必须只输出 JSON，字段为 plan、delegateTo、instructions。delegateTo 必须是：产品经理 Agent、架构师 Agent、技术主管 Agent、安全专家 Agent、前端 Agent、后端 Agent、测试 Agent、DevOps Agent。",
    `任务：${payload.task.title}\n说明：${payload.task.description || "无"}\n优先级：${payload.task.priority}\n建议 Agent：${fallbackAgent}\n项目上下文：\n${context || "无"}`
  );
  const plan = parsePlan(commanderText, fallbackAgent);
  const skills = payload.skills?.[plan.delegateTo] || [];
  const result = await callModel(
    `${agentRoles[plan.delegateTo]}你是指挥 Agent 的专业子 Agent。你可使用的特调 Skill：${skills.join("、") || "通用分析"}。输出应具体、结构清晰、可以直接进入研发流程，不要虚构已执行的外部操作。`,
    `指挥计划：${plan.plan}\n执行指令：${plan.instructions}\n原始任务：${payload.task.title}\n任务说明：${payload.task.description || "无"}\n项目上下文：\n${context || "无"}`
  );
  return { ...plan, result, model: configuration.model, completedAt: new Date().toISOString() };
}

async function chat(payload) {
  const history = (payload.messages || []).slice(-12).map((message) => `${message.role === "user" ? "用户" : "灵灵"}：${message.content}`).join("\n");
  const context = (payload.context || []).slice(0, 10).join("\n");
  const result = await callModel(
    "你是 AI 软件开发团队的项目经理灵灵。你的语气温暖、简洁、专业。你可以回答问题、拆解需求、分析当前任务，但不能谎称已经执行未执行的操作。需要行动时给出明确下一步。",
    `团队上下文：\n${context || "暂无"}\n\n对话记录：\n${history}`
  );
  return { content: result, model: configuration.model };
}

module.exports = { configure, clear, status, testConnection, executeTask, chat };
