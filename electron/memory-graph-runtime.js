const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_LIMITS = { maxFiles: 800, maxFileBytes: 1024 * 1024, maxRelatedEdges: 1200 };
const TEXT_EXTENSIONS = new Set([
  ".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".py", ".java", ".kt",
  ".go", ".rs", ".cs", ".cpp", ".c", ".h", ".php", ".rb", ".swift", ".sql", ".html", ".css",
  ".scss", ".less", ".md", ".mdx", ".txt", ".json", ".jsonc", ".yaml", ".yml", ".toml", ".ini",
  ".xml", ".env", ".example", ".sh", ".ps1", ".bat", ".cmd"
]);
const IGNORED_DIRECTORIES = new Set([
  ".git", ".svn", ".hg", "node_modules", "dist", "build", "coverage", ".next", ".nuxt", ".cache",
  ".idea", ".vscode", "vendor", "target", "__pycache__", ".venv", "venv"
]);
const STOP_WORDS = new Set([
  "const", "let", "var", "function", "return", "class", "this", "from", "import", "export", "default", "async",
  "await", "true", "false", "null", "undefined", "string", "number", "object", "array", "with", "that", "this",
  "the", "and", "for", "are", "not", "use", "using", "一个", "这个", "文件", "项目", "可以", "以及", "进行", "通过"
]);

function stableId(prefix, value) {
  return `${prefix}-${crypto.createHash("sha1").update(value).digest("hex").slice(0, 14)}`;
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

function isTextFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(path.extname(name)) || ["dockerfile", "makefile", "license", "readme"].includes(name);
}

function collectFiles(rootPath, limits) {
  const files = [];
  const directories = new Set([rootPath]);
  const queue = [rootPath];
  while (queue.length && files.length < limits.maxFiles) {
    const directory = queue.shift();
    let entries = [];
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= limits.maxFiles) break;
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name.toLowerCase()) || /^release-v/i.test(entry.name)) continue;
        directories.add(fullPath);
        queue.push(fullPath);
      } else if (entry.isFile() && isTextFile(fullPath)) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size <= limits.maxFileBytes) files.push({ fullPath, size: stat.size, modifiedAt: stat.mtime.toISOString() });
        } catch { /* 扫描期间被移除的文件直接忽略。 */ }
      }
    }
  }
  return { files, directories: [...directories], truncated: queue.length > 0 || files.length >= limits.maxFiles };
}

function tokenize(content) {
  const counts = new Map();
  const matches = String(content || "").toLowerCase().match(/[a-z][a-z0-9_-]{2,31}|[\u4e00-\u9fff]{2,8}/g) || [];
  for (const token of matches) {
    if (STOP_WORDS.has(token) || /^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word]) => word);
}

function extractReferences(content) {
  const references = [];
  const patterns = [
    /(?:import\s+(?:[^'";]+?\s+from\s+)?|require\s*\()\s*['"]([^'"]+)['"]/g,
    /(?:export\s+[^'";]+?\s+from\s+)['"]([^'"]+)['"]/g,
    /\[[^\]]*\]\(([^)#?]+)(?:[?#][^)]*)?\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) references.push(match[1]);
  }
  return references.slice(0, 80);
}

function resolveReference(sourcePath, reference, fileByPath) {
  if (!reference || (!reference.startsWith(".") && !reference.startsWith("/"))) return null;
  const base = path.resolve(path.dirname(sourcePath), reference);
  const candidates = [base, ...[...TEXT_EXTENSIONS].map((extension) => `${base}${extension}`), ...[...TEXT_EXTENSIONS].map((extension) => path.join(base, `index${extension}`))];
  return candidates.map((candidate) => path.normalize(candidate).toLowerCase()).find((candidate) => fileByPath.has(candidate)) || null;
}

function buildGraph(rootPath, limits = DEFAULT_LIMITS) {
  const resolvedRoot = path.resolve(String(rootPath || ""));
  if (!resolvedRoot || !fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) throw new Error("选择的长期记忆文件夹不存在");
  const options = { ...DEFAULT_LIMITS, ...limits };
  const collected = collectFiles(resolvedRoot, options);
  const nodes = [];
  const edges = [];
  const directoryIds = new Map();
  const fileByPath = new Map();
  const fileData = [];

  for (const directory of collected.directories) {
    const relativePath = path.relative(resolvedRoot, directory) || ".";
    const id = stableId("dir", relativePath.toLowerCase());
    directoryIds.set(path.normalize(directory).toLowerCase(), id);
    nodes.push({ id, type: directory === resolvedRoot ? "root" : "directory", label: directory === resolvedRoot ? path.basename(resolvedRoot) : path.basename(directory), path: relativePath, keywords: [] });
    if (directory !== resolvedRoot) {
      const parentId = directoryIds.get(path.normalize(path.dirname(directory)).toLowerCase());
      if (parentId) edges.push({ id: stableId("edge", `${parentId}:${id}:contains`), from: parentId, to: id, type: "contains" });
    }
  }

  for (const file of collected.files) {
    let content = "";
    try { content = fs.readFileSync(file.fullPath, "utf8").replace(/\0/g, ""); } catch { continue; }
    const relativePath = path.relative(resolvedRoot, file.fullPath);
    const id = stableId("file", relativePath.toLowerCase());
    const keywords = tokenize(content);
    const summary = content.replace(/\s+/g, " ").trim().slice(0, 280);
    const node = { id, type: "file", label: path.basename(file.fullPath), path: relativePath, extension: path.extname(file.fullPath).toLowerCase() || "file", size: file.size, modifiedAt: file.modifiedAt, keywords, summary };
    nodes.push(node);
    fileByPath.set(path.normalize(file.fullPath).toLowerCase(), id);
    fileData.push({ ...file, id, content, keywords });
    const parentId = directoryIds.get(path.normalize(path.dirname(file.fullPath)).toLowerCase());
    if (parentId) edges.push({ id: stableId("edge", `${parentId}:${id}:contains`), from: parentId, to: id, type: "contains" });
  }

  for (const file of fileData) {
    for (const reference of extractReferences(file.content)) {
      const targetPath = resolveReference(file.fullPath, reference, fileByPath);
      const targetId = targetPath ? fileByPath.get(targetPath) : null;
      if (targetId && targetId !== file.id && !edges.some((edge) => edge.from === file.id && edge.to === targetId)) {
        edges.push({ id: stableId("edge", `${file.id}:${targetId}:references`), from: file.id, to: targetId, type: "references" });
      }
    }
  }

  const keywordFiles = new Map();
  for (const file of fileData) for (const keyword of file.keywords.slice(0, 8)) {
    if (!keywordFiles.has(keyword)) keywordFiles.set(keyword, []);
    keywordFiles.get(keyword).push(file.id);
  }
  const conceptEntries = [...keywordFiles.entries()].filter(([, ids]) => ids.length >= 2 && ids.length <= 40).sort((a, b) => b[1].length - a[1].length).slice(0, 60);
  let relatedCount = 0;
  for (const [keyword, ids] of conceptEntries) {
    const conceptId = stableId("concept", keyword);
    nodes.push({ id: conceptId, type: "concept", label: keyword, path: "", keywords: [keyword], weight: ids.length });
    for (const fileId of ids) {
      if (relatedCount >= options.maxRelatedEdges) break;
      edges.push({ id: stableId("edge", `${fileId}:${conceptId}:related`), from: fileId, to: conceptId, type: "related", label: keyword });
      relatedCount += 1;
    }
  }

  return {
    version: 1,
    rootPath: resolvedRoot,
    rootName: path.basename(resolvedRoot),
    scannedAt: new Date().toISOString(),
    truncated: collected.truncated,
    stats: { files: fileData.length, directories: collected.directories.length, concepts: conceptEntries.length, nodes: nodes.length, edges: edges.length },
    nodes,
    edges
  };
}

function createMemoryGraphRuntime({ statePath, limits } = {}) {
  if (!statePath) throw new Error("知识图谱状态文件不能为空");
  let graph = readJson(statePath, { version: 1, rootPath: "", rootName: "", scannedAt: null, truncated: false, stats: { files: 0, directories: 0, concepts: 0, nodes: 0, edges: 0 }, nodes: [], edges: [] });
  function get() { return graph; }
  function reindex(rootPath = graph.rootPath) {
    graph = buildGraph(rootPath, limits);
    writeJson(statePath, graph);
    return graph;
  }
  function clear() {
    graph = { version: 1, rootPath: "", rootName: "", scannedAt: null, truncated: false, stats: { files: 0, directories: 0, concepts: 0, nodes: 0, edges: 0 }, nodes: [], edges: [] };
    writeJson(statePath, graph);
    return graph;
  }
  function context() {
    const files = graph.nodes.filter((node) => node.type === "file").sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0)).slice(0, 80);
    return { rootPath: graph.rootPath, scannedAt: graph.scannedAt, stats: graph.stats, files: files.map(({ path: filePath, summary, keywords }) => ({ path: filePath, summary, keywords })) };
  }
  return { get, reindex, clear, context };
}

module.exports = { buildGraph, createMemoryGraphRuntime, tokenize, extractReferences };
