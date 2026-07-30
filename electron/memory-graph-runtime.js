const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_LIMITS = Object.freeze({ maxFiles: 1200, maxFileBytes: 2 * 1024 * 1024, maxConcepts: 100, maxRelatedEdges: 2500 });
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
  "await", "true", "false", "null", "undefined", "string", "number", "object", "array", "with", "that", "the",
  "and", "for", "are", "not", "use", "using", "一个", "这个", "文件", "项目", "可以", "以及", "进行", "通过",
  "我们", "你们", "他们", "需要", "相关", "内容", "功能", "实现", "当前", "系统"
]);

function emptyGraph() {
  return {
    version: 2, rootPath: "", rootName: "", scannedAt: null, truncated: false,
    stats: { files: 0, directories: 0, concepts: 0, nodes: 0, edges: 0 },
    diagnostics: { isolatedNodes: 0, unresolvedReferences: 0, unreadableFiles: 0, skippedLargeFiles: 0, truncatedReason: "" },
    nodes: [], edges: []
  };
}

function stableId(prefix, value) {
  return `${prefix}-${crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 14)}`;
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

function addToken(counts, token, weight = 1) {
  const normalized = String(token || "").toLowerCase().replace(/^[-_]+|[-_]+$/g, "");
  if (normalized.length < 2 || normalized.length > 40 || STOP_WORDS.has(normalized) || /^\d+$/.test(normalized)) return;
  counts.set(normalized, (counts.get(normalized) || 0) + weight);
}

function tokenizeWithScores(content) {
  const counts = new Map();
  const text = String(content || "").slice(0, 600000);
  for (const token of text.match(/[a-zA-Z][a-zA-Z0-9_-]{1,39}/g) || []) {
    addToken(counts, token);
    for (const part of token.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[-_\s]+/)) if (part !== token) addToken(counts, part, 0.65);
  }
  for (const phrase of text.match(/[\u4e00-\u9fff]{2,24}/g) || []) {
    if (phrase.length <= 8) addToken(counts, phrase, 1.4);
    const maxSize = Math.min(4, phrase.length);
    for (let size = 2; size <= maxSize; size += 1) {
      for (let index = 0; index <= phrase.length - size; index += 1) addToken(counts, phrase.slice(index, index + size), size === 2 ? 0.35 : 0.55);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20);
}

function tokenize(content) { return tokenizeWithScores(content).map(([word]) => word); }

function extractReferences(content) {
  const references = [];
  const patterns = [
    /(?:import\s+(?:[^'";]+?\s+from\s+)?|require\s*\()\s*['"]([^'"]+)['"]/g,
    /(?:export\s+[^'";]+?\s+from\s+)['"]([^'"]+)['"]/g,
    /\[[^\]]*\]\(([^)#?]+)(?:[?#][^)]*)?\)/g,
    /(?:src|href)\s*=\s*['"]([^'"#?]+)(?:[?#][^'"]*)?['"]/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(String(content || ""))) && references.length < 120) references.push(match[1]);
  }
  return [...new Set(references)];
}

function referenceCandidates(sourcePath, reference) {
  if (!reference || (!reference.startsWith(".") && !reference.startsWith("/"))) return [];
  const base = path.resolve(path.dirname(sourcePath), reference);
  const extensions = [...TEXT_EXTENSIONS];
  return [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => path.join(base, `index${extension}`))];
}

function resolveReference(sourcePath, reference, fileByPath) {
  return referenceCandidates(sourcePath, reference)
    .map((candidate) => path.normalize(candidate).toLowerCase())
    .find((candidate) => fileByPath.has(candidate)) || null;
}

async function collectFiles(rootPath, limits, onProgress) {
  const files = [];
  const directories = [];
  const queue = [rootPath];
  let unreadableFiles = 0;
  let skippedLargeFiles = 0;
  let visited = 0;
  while (queue.length && files.length < limits.maxFiles) {
    const directory = queue.shift();
    directories.push(directory);
    let entries;
    try { entries = await fs.promises.readdir(directory, { withFileTypes: true }); }
    catch { unreadableFiles += 1; continue; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= limits.maxFiles) break;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || IGNORED_DIRECTORIES.has(entry.name.toLowerCase()) || /^release-v/i.test(entry.name)) continue;
        queue.push(fullPath);
      } else if (entry.isFile() && isTextFile(fullPath)) {
        try {
          const stat = await fs.promises.stat(fullPath);
          if (stat.size > limits.maxFileBytes) skippedLargeFiles += 1;
          else files.push({ fullPath, size: stat.size, modifiedAt: stat.mtime.toISOString() });
        } catch { unreadableFiles += 1; }
      }
    }
    visited += 1;
    if (visited % 8 === 0) {
      onProgress?.({ phase: "scan", current: files.length, total: Math.max(files.length + queue.length, 1), message: `已发现 ${files.length} 个文本文件` });
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
  return { files, directories, unreadableFiles, skippedLargeFiles, truncated: queue.length > 0 || files.length >= limits.maxFiles };
}

async function buildGraph(rootPath, limits = DEFAULT_LIMITS, onProgress) {
  const resolvedRoot = path.resolve(String(rootPath || ""));
  let rootStat;
  try { rootStat = await fs.promises.stat(resolvedRoot); } catch { throw new Error("选择的长期记忆文件夹不存在"); }
  if (!rootStat.isDirectory()) throw new Error("长期记忆路径必须是文件夹");
  const options = { ...DEFAULT_LIMITS, ...limits };
  onProgress?.({ phase: "scan", current: 0, total: 1, message: "正在扫描目录" });
  const collected = await collectFiles(resolvedRoot, options, onProgress);
  const nodes = [];
  const edges = [];
  const edgeKeys = new Set();
  const directoryIds = new Map();
  const fileByPath = new Map();
  const fileData = [];

  for (const directory of collected.directories) {
    const relativePath = path.relative(resolvedRoot, directory) || ".";
    directoryIds.set(path.normalize(directory).toLowerCase(), stableId("dir", relativePath.toLowerCase()));
  }
  for (const directory of collected.directories) {
    const relativePath = path.relative(resolvedRoot, directory) || ".";
    const id = directoryIds.get(path.normalize(directory).toLowerCase());
    nodes.push({ id, type: directory === resolvedRoot ? "root" : "directory", label: directory === resolvedRoot ? path.basename(resolvedRoot) : path.basename(directory), path: relativePath, keywords: [] });
    if (directory !== resolvedRoot) {
      const parentId = directoryIds.get(path.normalize(path.dirname(directory)).toLowerCase());
      if (parentId) edges.push({ id: stableId("edge", `${parentId}:${id}:contains`), from: parentId, to: id, type: "contains", strength: 1 });
    }
  }

  let parsed = 0;
  for (const file of collected.files) {
    let content;
    try { content = (await fs.promises.readFile(file.fullPath, "utf8")).replace(/\0/g, ""); }
    catch { collected.unreadableFiles += 1; continue; }
    const relativePath = path.relative(resolvedRoot, file.fullPath);
    const id = stableId("file", relativePath.toLowerCase());
    const scoredKeywords = tokenizeWithScores(`${relativePath}\n${content}`);
    const keywords = scoredKeywords.map(([word]) => word);
    const summary = content.replace(/\s+/g, " ").trim().slice(0, 320);
    nodes.push({ id, type: "file", label: path.basename(file.fullPath), path: relativePath, extension: path.extname(file.fullPath).toLowerCase() || "file", size: file.size, modifiedAt: file.modifiedAt, keywords, summary });
    fileByPath.set(path.normalize(file.fullPath).toLowerCase(), id);
    fileData.push({ ...file, id, content, keywords, scoredKeywords });
    const parentId = directoryIds.get(path.normalize(path.dirname(file.fullPath)).toLowerCase());
    if (parentId) edges.push({ id: stableId("edge", `${parentId}:${id}:contains`), from: parentId, to: id, type: "contains", strength: 1 });
    parsed += 1;
    if (parsed % 20 === 0) {
      onProgress?.({ phase: "parse", current: parsed, total: collected.files.length, message: `正在分析文件 ${parsed}/${collected.files.length}` });
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  let unresolvedReferences = 0;
  for (const file of fileData) {
    for (const reference of extractReferences(file.content)) {
      const candidates = referenceCandidates(file.fullPath, reference);
      if (!candidates.length) continue;
      const targetPath = resolveReference(file.fullPath, reference, fileByPath);
      const targetId = targetPath ? fileByPath.get(targetPath) : null;
      if (!targetId) { unresolvedReferences += 1; continue; }
      const key = `${file.id}:${targetId}:references`;
      if (targetId !== file.id && !edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push({ id: stableId("edge", key), from: file.id, to: targetId, type: "references", strength: 0.82, directed: true });
      }
    }
  }

  const keywordFiles = new Map();
  for (const file of fileData) for (const keyword of file.keywords.slice(0, 12)) {
    if (!keywordFiles.has(keyword)) keywordFiles.set(keyword, new Set());
    keywordFiles.get(keyword).add(file.id);
  }
  const conceptEntries = [...keywordFiles.entries()]
    .map(([keyword, ids]) => [keyword, [...ids]])
    .filter(([, ids]) => ids.length >= 2 && ids.length <= 60)
    .sort((a, b) => b[1].length - a[1].length || b[0].length - a[0].length)
    .slice(0, options.maxConcepts);
  let relatedCount = 0;
  for (const [keyword, ids] of conceptEntries) {
    const conceptId = stableId("concept", keyword);
    nodes.push({ id: conceptId, type: "concept", label: keyword, path: "", keywords: [keyword], weight: ids.length });
    for (const fileId of ids) {
      if (relatedCount >= options.maxRelatedEdges) break;
      edges.push({ id: stableId("edge", `${fileId}:${conceptId}:related`), from: fileId, to: conceptId, type: "related", label: keyword, strength: 0.4 });
      relatedCount += 1;
    }
  }

  const degree = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) || 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) || 0) + 1);
  }
  const isolatedNodes = nodes.filter((node) => node.type !== "root" && !(degree.get(node.id) > 0)).length;
  const graph = {
    version: 2,
    rootPath: resolvedRoot,
    rootName: path.basename(resolvedRoot),
    scannedAt: new Date().toISOString(),
    truncated: collected.truncated,
    stats: { files: fileData.length, directories: collected.directories.length, concepts: conceptEntries.length, nodes: nodes.length, edges: edges.length },
    diagnostics: {
      isolatedNodes,
      unresolvedReferences,
      unreadableFiles: collected.unreadableFiles,
      skippedLargeFiles: collected.skippedLargeFiles,
      truncatedReason: collected.truncated ? `文件数量达到 ${options.maxFiles} 上限` : ""
    },
    nodes,
    edges
  };
  onProgress?.({ phase: "complete", current: nodes.length, total: nodes.length, message: `已建立 ${nodes.length} 个节点和 ${edges.length} 条关系` });
  return graph;
}

function scoreNode(node, queryTokens) {
  if (!queryTokens.length) return (node.keywords?.length || 0) + (node.type === "file" ? 2 : 0);
  const label = `${node.label || ""} ${node.path || ""}`.toLowerCase();
  const keywords = new Set(node.keywords || []);
  let score = 0;
  for (const token of queryTokens) {
    if (label.includes(token)) score += node.label?.toLowerCase().includes(token) ? 8 : 5;
    if (keywords.has(token)) score += 6;
    else if ([...keywords].some((keyword) => keyword.includes(token) || token.includes(keyword))) score += 2;
  }
  if (node.modifiedAt) {
    const ageDays = Math.max(0, (Date.now() - new Date(node.modifiedAt).getTime()) / 86400000);
    score += Math.max(0, 1.5 - ageDays / 365);
  }
  return score;
}

function createMemoryGraphRuntime({ statePath, limits } = {}) {
  if (!statePath) throw new Error("知识图谱状态文件不能为空");
  let graph = readJson(statePath, emptyGraph());
  function get() { return graph; }
  async function reindex(rootPath = graph.rootPath, onProgress) {
    graph = await buildGraph(rootPath, limits, onProgress);
    writeJson(statePath, graph);
    return graph;
  }
  function clear() {
    graph = emptyGraph();
    writeJson(statePath, graph);
    return graph;
  }
  function search(query, limit = 20) {
    const queryTokens = tokenize(query).slice(0, 12);
    return graph.nodes
      .map((node) => ({ node, score: scoreNode(node, queryTokens) }))
      .filter((item) => !queryTokens.length || item.score > 0)
      .sort((a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label))
      .slice(0, Math.max(1, Math.min(100, Number(limit) || 20)))
      .map(({ node, score }) => ({ ...node, relevance: Number(score.toFixed(2)) }));
  }
  function context(query = "") {
    const files = search(query, 80).filter((node) => node.type === "file");
    return {
      rootPath: graph.rootPath,
      scannedAt: graph.scannedAt,
      stats: graph.stats,
      query: String(query || "").slice(0, 500),
      files: files.map(({ path: filePath, summary, keywords, relevance }) => ({ path: filePath, summary, keywords, relevance }))
    };
  }
  return { get, reindex, clear, search, context };
}

module.exports = { buildGraph, createMemoryGraphRuntime, tokenize, extractReferences, scoreNode };
