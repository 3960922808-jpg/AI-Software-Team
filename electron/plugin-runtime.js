const fs = require("fs");
const path = require("path");

const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_SKILL_BYTES = 512 * 1024;
const builtInPlugins = [
  {
    id: "database-foundation",
    name: "数据库基础设施",
    version: "1.0.0",
    category: "数据",
    description: "为数据类任务补充模型、迁移、索引、种子数据与回滚要求。",
    agents: ["架构师 Agent", "后端 Agent", "数据库 Agent", "测试 Agent"],
    skills: ["关系模型设计", "迁移与回滚", "索引检查", "数据层测试"],
    prompt: "涉及数据存储时，必须生成数据模型、初始化或迁移方案、约束、索引、回滚说明与可重复测试。",
    enabledByDefault: true,
  },
  {
    id: "frontend-production-template",
    name: "前端生产模板",
    version: "1.0.0",
    category: "前端",
    description: "要求前端交付完整状态、响应式布局、可访问性和可运行入口。",
    agents: ["产品经理 Agent", "架构师 Agent", "前端 Agent", "测试 Agent"],
    skills: ["响应式布局", "交互状态", "可访问性", "前端自动化测试"],
    prompt: "前端项目必须包含加载、空、错误和成功状态，支持键盘操作与响应式布局，并提供自动化测试和启动命令。",
    enabledByDefault: true,
  },
  {
    id: "api-service-generator",
    name: "API 服务生成器",
    version: "1.0.0",
    category: "后端",
    description: "为 API 项目补充契约、校验、错误处理、健康检查和接口测试。",
    agents: ["产品经理 Agent", "架构师 Agent", "后端 Agent", "安全专家 Agent", "测试 Agent"],
    skills: ["接口契约", "输入校验", "统一错误响应", "接口自动化测试"],
    prompt: "API 项目必须提供健康检查、输入校验、统一错误响应、清晰契约、最小权限设计和可重复执行的接口测试。",
    enabledByDefault: true,
  },
];

function normalizeManifest(raw, source, filePath = null) {
  if (!raw || typeof raw !== "object") throw new Error("插件清单必须是对象");
  const id = String(raw.id || "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(id)) throw new Error("插件 ID 格式无效");
  const name = String(raw.name || "").trim().slice(0, 80);
  if (!name) throw new Error("插件名称不能为空");
  const agents = (Array.isArray(raw.agents) ? raw.agents : []).slice(0, 12).map((item) => String(item).slice(0, 40));
  const skills = (Array.isArray(raw.skills) ? raw.skills : []).slice(0, 20).map((item) => String(item).trim().slice(0, 80)).filter(Boolean);
  const prompt = String(raw.prompt || "").trim().slice(0, 4000);
  if (!skills.length || !prompt) throw new Error("插件必须声明至少一项技能和提示词");
  return {
    id,
    name,
    version: String(raw.version || "1.0.0").slice(0, 30),
    category: String(raw.category || "扩展").slice(0, 30),
    description: String(raw.description || "").slice(0, 240),
    agents,
    skills,
    prompt,
    source,
    filePath,
    enabledByDefault: source === "built-in" && raw.enabledByDefault !== false,
  };
}

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function slugify(value) {
  const slug = String(value || "").toLowerCase().trim().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return /^[a-z0-9]/.test(slug) ? slug : `skill-${require("crypto").createHash("sha1").update(String(value || Date.now())).digest("hex").slice(0, 10)}`;
}

function parseList(value) {
  const text = String(value || "").trim();
  if (!text) return [];
  if (text.startsWith("[") && text.endsWith("]")) return text.slice(1, -1).split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
  return text.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function parseSkillMarkdown(content, sourcePath = "SKILL.md") {
  const text = String(content || "").replace(/^\uFEFF/, "");
  const metadata = {};
  let body = text;
  const frontmatter = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (frontmatter) {
    body = text.slice(frontmatter[0].length);
    for (const line of frontmatter[1].split(/\r?\n/)) {
      const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
      if (match) metadata[match[1].toLowerCase()] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const name = String(metadata.name || heading || path.basename(path.dirname(sourcePath)) || "Custom Skill").slice(0, 80);
  const description = String(metadata.description || body.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith("#")) || "").slice(0, 240);
  const skills = parseList(metadata.skills || metadata.skill || name).slice(0, 20);
  return {
    id: slugify(metadata.id || metadata.name || name),
    name,
    version: String(metadata.version || "1.0.0").slice(0, 30),
    category: String(metadata.category || "自定义 Skill").slice(0, 30),
    description,
    agents: parseList(metadata.agents || metadata.agent).slice(0, 12),
    skills: skills.length ? skills : [name],
    prompt: body.trim().slice(0, 4000)
  };
}

function createPluginRuntime({ directoryPath, statePath }) {
  if (!directoryPath || !statePath) throw new Error("插件目录和状态文件不能为空");
  fs.mkdirSync(directoryPath, { recursive: true });
  let state = readJson(statePath, { enabled: [] });

  function load() {
    const plugins = builtInPlugins.map((item) => normalizeManifest(item, "built-in"));
    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".json") continue;
      const filePath = path.join(directoryPath, entry.name);
      try {
        if (fs.statSync(filePath).size > MAX_MANIFEST_BYTES) continue;
        const plugin = normalizeManifest(readJson(filePath, null), "local", filePath);
        if (!plugins.some((item) => item.id === plugin.id)) plugins.push(plugin);
      } catch { /* 无效清单不进入运行时。 */ }
    }
    const explicit = new Set(Array.isArray(state.enabled) ? state.enabled : []);
    return plugins.map((plugin) => ({ ...plugin, enabled: explicit.has(plugin.id) || (state.initialized !== true && plugin.enabledByDefault) }));
  }

  function persistEnabled(plugins) {
    state = { initialized: true, enabled: plugins.filter((plugin) => plugin.enabled).map((plugin) => plugin.id), updatedAt: new Date().toISOString() };
    writeJson(statePath, state);
  }

  function status() {
    return load().map(({ prompt, filePath, enabledByDefault, ...plugin }) => plugin);
  }

  function setEnabled(pluginId, enabled) {
    const plugins = load();
    const plugin = plugins.find((item) => item.id === pluginId);
    if (!plugin) throw new Error("插件不存在");
    plugin.enabled = Boolean(enabled);
    persistEnabled(plugins);
    return status();
  }

  function context() {
    return load().filter((plugin) => plugin.enabled).map(({ id, name, version, agents, skills, prompt }) => ({ id, name, version, agents, skills, prompt }));
  }

  function importManifest(sourcePath) {
    const resolved = path.resolve(String(sourcePath || ""));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error("所选 Skill 文件不存在");
    if (path.extname(resolved).toLowerCase() !== ".json") throw new Error("Skill 文件必须使用 JSON 格式");
    if (fs.statSync(resolved).size > MAX_MANIFEST_BYTES) throw new Error("Skill 文件不能超过 64KB");
    const plugin = normalizeManifest(readJson(resolved, null), "local", resolved);
    if (builtInPlugins.some((item) => item.id === plugin.id)) throw new Error("Skill ID 与内置插件冲突");
    const targetPath = path.join(directoryPath, `${plugin.id}.json`);
    writeJson(targetPath, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      category: plugin.category,
      description: plugin.description,
      agents: plugin.agents,
      skills: plugin.skills,
      prompt: plugin.prompt,
    });
    return { plugin: status().find((item) => item.id === plugin.id), plugins: status() };
  }

  function importSkillFile(sourcePath) {
    const resolved = path.resolve(String(sourcePath || ""));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error("所选 Skill 文件不存在");
    if (path.extname(resolved).toLowerCase() === ".json") return importManifest(resolved);
    if (path.basename(resolved).toLowerCase() !== "skill.md" && path.extname(resolved).toLowerCase() !== ".md") throw new Error("Skill 文件必须是 JSON 或 SKILL.md");
    if (fs.statSync(resolved).size > MAX_SKILL_BYTES) throw new Error("SKILL.md 不能超过 512KB");
    const raw = parseSkillMarkdown(fs.readFileSync(resolved, "utf8"), resolved);
    const plugin = normalizeManifest(raw, "local", resolved);
    if (builtInPlugins.some((item) => item.id === plugin.id)) throw new Error("Skill ID 与内置插件冲突");
    writeJson(path.join(directoryPath, `${plugin.id}.json`), raw);
    fs.copyFileSync(resolved, path.join(directoryPath, `${plugin.id}.source.md`));
    return { plugin: status().find((item) => item.id === plugin.id), plugins: status() };
  }

  function importSkillDirectory(sourcePath) {
    const resolved = path.resolve(String(sourcePath || ""));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("所选 Skill 文件夹不存在");
    const skillPath = ["SKILL.md", "skill.md"].map((name) => path.join(resolved, name)).find((candidate) => fs.existsSync(candidate));
    if (!skillPath) throw new Error("所选文件夹中没有 SKILL.md");
    return importSkillFile(skillPath);
  }

  return { status, setEnabled, context, importManifest, importSkillFile, importSkillDirectory, directoryPath: path.resolve(directoryPath) };
}

module.exports = { createPluginRuntime, normalizeManifest, parseSkillMarkdown, builtInPlugins };
