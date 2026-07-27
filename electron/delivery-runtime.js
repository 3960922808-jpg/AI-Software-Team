const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const MAX_FILES = 500;
const MAX_HASH_BYTES = 64 * 1024 * 1024;

function requireWorkspace(workspacePath) {
  if (!workspacePath) throw new Error("请先选择工作目录");
  const resolved = path.resolve(workspacePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("工作目录不存在");
  return resolved;
}

function detectProject(workspacePath) {
  const candidates = [
    ["package.json", "Node.js"], ["pyproject.toml", "Python"], ["requirements.txt", "Python"],
    ["Cargo.toml", "Rust"], ["go.mod", "Go"], ["pom.xml", "Java"], ["build.gradle", "Java"]
  ];
  const detected = candidates.find(([file]) => fs.existsSync(path.join(workspacePath, file)));
  const project = { type: detected?.[1] || "通用项目", manifest: detected?.[0] || null, scripts: [] };
  const packagePath = path.join(workspacePath, "package.json");
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      project.name = String(packageJson.productName || packageJson.name || path.basename(workspacePath));
      project.version = String(packageJson.version || "未设置");
      project.scripts = Object.keys(packageJson.scripts || {}).filter((name) => /build|pack|test|lint|check|release/i.test(name)).slice(0, 20);
    } catch { project.warning = "package.json 无法解析"; }
  }
  project.name ||= path.basename(workspacePath);
  project.version ||= "未设置";
  return project;
}

function collectFiles(root, current = root, files = []) {
  if (!fs.existsSync(current) || files.length >= MAX_FILES) return files;
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    if (files.length >= MAX_FILES) break;
    const target = path.join(current, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) collectFiles(root, target, files);
    if (entry.isFile()) {
      const stat = fs.statSync(target);
      if (stat.size > MAX_HASH_BYTES) continue;
      const hash = crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
      files.push({
        name: entry.name,
        relativePath: path.relative(root, target).replace(/\\/g, "/"),
        absolutePath: target,
        size: stat.size,
        sha256: hash,
        modifiedAt: stat.mtime.toISOString()
      });
    }
  }
  return files;
}

function inspect(workspacePath) {
  const workspace = requireWorkspace(workspacePath);
  const outputRoot = path.join(workspace, ".ai-team-output");
  const project = detectProject(workspace);
  const artifacts = collectFiles(outputRoot).filter((file) => !file.relativePath.startsWith("releases/"));
  const checks = [
    { id: "workspace", label: "工作目录可访问", status: "pass", detail: workspace },
    { id: "manifest", label: "项目清单", status: project.manifest ? "pass" : "warn", detail: project.manifest || "未识别到常见项目清单" },
    { id: "scripts", label: "构建与测试脚本", status: project.scripts.length ? "pass" : "warn", detail: project.scripts.length ? project.scripts.join("、") : "未检测到构建或测试脚本" },
    { id: "artifacts", label: "智能体交付产物", status: artifacts.length ? "pass" : "warn", detail: artifacts.length ? `${artifacts.length} 个文件已完成校验` : "暂无智能体生成文件" }
  ];
  return {
    workspacePath: workspace,
    outputRoot,
    project,
    artifacts,
    checks,
    ready: checks.every((check) => check.status === "pass"),
    scannedAt: new Date().toISOString(),
    truncated: artifacts.length >= MAX_FILES
  };
}

function safeVersion(value) {
  const version = String(value || "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,39}$/.test(version)) throw new Error("版本号只能包含字母、数字、点、横线和下划线");
  return version;
}

function createRelease(workspacePath, payload) {
  const report = inspect(workspacePath);
  const version = safeVersion(payload?.version);
  const channel = ["测试", "预发布", "生产"].includes(payload?.channel) ? payload.channel : "测试";
  const releaseRoot = path.join(report.outputRoot, "releases", version);
  if (fs.existsSync(releaseRoot)) throw new Error(`版本 ${version} 已存在，请使用新的版本号`);
  fs.mkdirSync(releaseRoot, { recursive: true });
  const createdAt = new Date().toISOString();
  const manifest = {
    schemaVersion: 1,
    version,
    channel,
    project: report.project,
    createdAt,
    readiness: report.ready ? "ready" : "review_required",
    checks: report.checks,
    artifacts: report.artifacts.map(({ relativePath, size, sha256, modifiedAt }) => ({ relativePath, size, sha256, modifiedAt }))
  };
  const notes = String(payload?.notes || "本版本由智能体团队完成交付检查。").trim().slice(0, 12000);
  const noteText = `# ${report.project.name} ${version}\n\n发布通道：${channel}\n创建时间：${createdAt}\n\n## 发布说明\n\n${notes}\n\n## 交付状态\n\n${manifest.readiness === "ready" ? "全部检查通过" : "存在需要人工确认的检查项"}\n\n## 产物\n\n${manifest.artifacts.length ? manifest.artifacts.map((item) => `- ${item.relativePath}  (${item.size} 字节)`).join("\n") : "- 暂无文件产物"}\n`;
  const manifestPath = path.join(releaseRoot, "release-manifest.json");
  const notesPath = path.join(releaseRoot, "RELEASE_NOTES.md");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  fs.writeFileSync(notesPath, noteText, { encoding: "utf8", flag: "wx" });
  return { version, channel, releasePath: releaseRoot, manifestPath, notesPath, artifactCount: manifest.artifacts.length, readiness: manifest.readiness, createdAt };
}

function resolveOutputPath(workspacePath, candidate) {
  const workspace = requireWorkspace(workspacePath);
  const outputRoot = path.resolve(workspace, ".ai-team-output");
  const target = path.resolve(candidate || outputRoot);
  if (target !== outputRoot && !target.startsWith(`${outputRoot}${path.sep}`)) throw new Error("只能打开智能体交付目录");
  if (!fs.existsSync(target)) throw new Error("交付目录尚不存在");
  return target;
}

module.exports = { inspect, createRelease, resolveOutputPath };
