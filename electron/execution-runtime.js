const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_CHECKS = 8;
const SAFE_SCRIPT_NAMES = new Set(["test", "lint", "check", "build", "typecheck", "verify"]);
const SAFE_GIT_READ_COMMANDS = new Set(["status", "diff", "log", "rev-parse"]);

function safeSegment(value) {
  return String(value || "task").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "task";
}

function requireWorkspace(workspacePath) {
  if (!workspacePath) throw new Error("请先选择工作目录");
  const resolved = path.resolve(workspacePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("工作目录不存在");
  return resolved;
}

function taskRootFor(workspacePath, taskId, create = false) {
  const workspace = requireWorkspace(workspacePath);
  const outputRoot = path.resolve(workspace, ".ai-team-output");
  const taskRoot = path.resolve(outputRoot, safeSegment(taskId));
  if (taskRoot !== outputRoot && !taskRoot.startsWith(`${outputRoot}${path.sep}`)) throw new Error("任务目录越界");
  if (create) fs.mkdirSync(taskRoot, { recursive: true });
  if (!create && (!fs.existsSync(taskRoot) || !fs.statSync(taskRoot).isDirectory())) throw new Error("任务产物目录不存在");
  return taskRoot;
}

function resolveInside(root, candidate = ".") {
  const resolved = path.resolve(root, candidate || ".");
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error("工作目录超出任务沙箱边界");
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("检查命令的工作目录不存在");
  return resolved;
}

function tokenize(commandLine) {
  const input = String(commandLine || "").trim();
  if (!input) throw new Error("检查命令不能为空");
  if (/[\r\n;&|<>`]/.test(input)) throw new Error("检查命令包含被禁止的 Shell 控制符");
  const tokens = [];
  let current = "";
  let quote = null;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quote) {
      if (character === quote) quote = null;
      else if (character === "\\" && input[index + 1] === quote) current += input[++index];
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (/\s/.test(character)) {
      if (current) { tokens.push(current); current = ""; }
      continue;
    }
    current += character;
  }
  if (quote) throw new Error("检查命令的引号没有闭合");
  if (current) tokens.push(current);
  if (!tokens.length) throw new Error("检查命令不能为空");
  return tokens;
}

function commandName(value) {
  return path.basename(String(value || "")).toLowerCase().replace(/\.(exe|cmd|bat)$/i, "");
}

function validateNodeArgs(args) {
  const denied = new Set(["-e", "--eval", "-p", "--print", "-r", "--require", "--loader", "--experimental-loader", "--import"]);
  if (args.some((arg) => denied.has(String(arg).toLowerCase()))) throw new Error("Node 检查禁止内联代码、预加载器和外部注入参数");
}

function validatePackageManagerArgs(args) {
  const normalized = args.map((arg) => String(arg).toLowerCase());
  if (!normalized.length) throw new Error("包管理器命令必须指定安全脚本");
  if (SAFE_SCRIPT_NAMES.has(normalized[0])) return;
  if (normalized[0] === "run" && SAFE_SCRIPT_NAMES.has(normalized[1])) return;
  throw new Error("包管理器仅允许 test、lint、check、build、typecheck、verify 脚本");
}

function validatePythonArgs(args) {
  const normalized = args.map((arg) => String(arg).toLowerCase());
  if (normalized.includes("-c")) throw new Error("Python 检查禁止内联代码");
  if (normalized[0] === "-m" && !["pytest", "unittest", "compileall"].includes(normalized[1])) throw new Error("Python -m 仅允许 pytest、unittest 或 compileall");
}

function validateGitArgs(args) {
  if (!SAFE_GIT_READ_COMMANDS.has(String(args[0] || "").toLowerCase())) throw new Error("Agent 检查阶段只允许只读 Git 命令");
}

function normalizeSpec(spec, taskRoot) {
  const source = typeof spec === "string" ? { commandLine: spec } : (spec || {});
  const tokens = source.commandLine ? tokenize(source.commandLine) : [source.command, ...(Array.isArray(source.args) ? source.args : [])];
  const executable = String(tokens.shift() || "").trim();
  const args = tokens.map((arg) => String(arg));
  const name = commandName(executable);
  if (!["node", "npm", "pnpm", "python", "python3", "py", "pytest", "git"].includes(name)) throw new Error(`命令 ${name || executable} 不在沙箱白名单中`);
  if (name === "node") validateNodeArgs(args);
  if (["npm", "pnpm"].includes(name)) validatePackageManagerArgs(args);
  if (["python", "python3", "py"].includes(name)) validatePythonArgs(args);
  if (name === "git") validateGitArgs(args);
  const cwd = resolveInside(taskRoot, source.cwd || ".");
  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1000, Number(source.timeoutMs) || DEFAULT_TIMEOUT_MS));
  const command = name === "node" ? process.execPath : executable;
  const env = name === "node" && process.versions.electron ? { ELECTRON_RUN_AS_NODE: "1" } : {};
  return { command, logicalCommand: name, args, cwd, timeoutMs, env, label: String(source.label || [executable, ...args].join(" ")).slice(0, 180) };
}

function safeEnvironment(overrides = {}) {
  const allowed = ["PATH", "Path", "PATHEXT", "SystemRoot", "WINDIR", "TEMP", "TMP", "USERPROFILE", "HOME", "APPDATA", "LOCALAPPDATA"];
  const env = {};
  for (const key of allowed) if (process.env[key]) env[key] = process.env[key];
  env.CI = "1";
  env.NO_UPDATE_NOTIFIER = "1";
  env.NPM_CONFIG_FUND = "false";
  env.NPM_CONFIG_AUDIT = "false";
  return { ...env, ...overrides };
}

function terminateProcess(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32" && child.pid) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    killer.on("error", () => child.kill("SIGKILL"));
  } else child.kill("SIGKILL");
}

function runProcess(spec) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputLimited = false;
    let settled = false;
    const child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: safeEnvironment(spec.env),
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const append = (kind, chunk) => {
      const text = chunk.toString("utf8");
      const remaining = Math.max(0, MAX_OUTPUT_BYTES - outputBytes);
      const accepted = Buffer.from(text).subarray(0, remaining).toString("utf8");
      outputBytes += Buffer.byteLength(accepted, "utf8");
      if (kind === "stdout") stdout += accepted; else stderr += accepted;
      if (Buffer.byteLength(text, "utf8") > remaining && !outputLimited) {
        outputLimited = true;
        terminateProcess(child);
      }
    };
    child.stdout?.on("data", (chunk) => append("stdout", chunk));
    child.stderr?.on("data", (chunk) => append("stderr", chunk));
    const timer = setTimeout(() => { timedOut = true; terminateProcess(child); }, spec.timeoutMs);
    const finish = (exitCode, error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const status = timedOut ? "timeout" : outputLimited ? "output_limit" : error || exitCode !== 0 ? "failed" : "passed";
      resolve({
        label: spec.label,
        command: spec.command,
        args: spec.args,
        cwd: spec.cwd,
        status,
        exitCode: Number.isInteger(exitCode) ? exitCode : null,
        stdout: stdout.trim().slice(-12000),
        stderr: (error ? `${error.message}\n${stderr}` : stderr).trim().slice(-12000),
        durationMs: Date.now() - startedAt,
      });
    };
    child.on("error", (error) => finish(null, error));
    child.on("close", (code) => finish(code));
  });
}

async function runChecks(workspacePath, taskId, checks = []) {
  const taskRoot = taskRootFor(workspacePath, taskId);
  const source = checks.length ? checks.slice(0, MAX_CHECKS) : detectChecks(taskRoot);
  if (!source.length) return { taskRoot, checks: [], passed: true, skipped: true };
  const results = [];
  for (const check of source) {
    try { results.push(await runProcess(normalizeSpec(check, taskRoot))); }
    catch (error) {
      results.push({ label: typeof check === "string" ? check : String(check?.label || check?.command || "检查"), status: "rejected", exitCode: null, stdout: "", stderr: error.message, durationMs: 0 });
    }
  }
  return { taskRoot, checks: results, passed: results.every((result) => result.status === "passed"), skipped: false };
}

function walkFiles(root, current = root, files = []) {
  if (files.length >= 80 || !fs.existsSync(current)) return files;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) walkFiles(root, target, files);
    else if (entry.isFile()) files.push(path.relative(root, target).replace(/\\/g, "/"));
    if (files.length >= 80) break;
  }
  return files;
}

function detectChecks(taskRoot) {
  const checks = [];
  const packagePath = path.join(taskRoot, "package.json");
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      for (const script of ["test", "lint", "check", "build"]) {
        if (packageJson.scripts?.[script]) {
          try {
            const [command, ...args] = tokenize(packageJson.scripts[script]);
            checks.push({ command, args, label: `项目脚本 ${script}` });
          } catch { /* 包含 Shell 控制符的脚本不在自动执行范围内。 */ }
        }
        if (checks.length >= 3) break;
      }
    } catch { /* package.json 解析错误会由后续语法检查暴露。 */ }
  }
  const files = walkFiles(taskRoot);
  if (!checks.length) {
    const testFiles = files.filter((file) => /(^|\/)(test|tests)(\/|$)|\.(test|spec)\.[cm]?js$/i.test(file));
    if (testFiles.length) checks.push({ command: "node", args: ["--test"], label: "node --test" });
    for (const file of files.filter((file) => /\.[cm]?js$/i.test(file)).slice(0, Math.max(0, 6 - checks.length))) {
      checks.push({ command: "node", args: ["--check", file], label: `语法检查 ${file}` });
    }
  }
  if (!checks.length && files.some((file) => /(^|\/)test.*\.py$|(^|\/)tests\//i.test(file))) checks.push({ command: "python", args: ["-m", "unittest", "discover"], label: "Python 单元测试" });
  if (!checks.length && files.some((file) => file.endsWith(".py"))) checks.push({ command: "python", args: ["-m", "compileall", "-q", "."], label: "Python 语法检查" });
  return checks.slice(0, MAX_CHECKS);
}

function ensureGeneratedGitignore(taskRoot) {
  const filePath = path.join(taskRoot, ".gitignore");
  const required = [".env", ".env.*", "!.env.example", "node_modules/", "__pycache__/", "*.pyc", "dist/", "build/"];
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = new Set(current.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  let changed = false;
  for (const item of required) if (!lines.has(item)) { lines.add(item); changed = true; }
  if (changed || !fs.existsSync(filePath)) fs.writeFileSync(filePath, `${[...lines].join("\n")}\n`, "utf8");
}

async function runGit(taskRoot, args, timeoutMs = 30_000) {
  return runProcess({ command: "git", args, cwd: taskRoot, timeoutMs, label: `git ${args.join(" ")}` });
}

async function gitSnapshot(workspacePath, taskId, message = "AI Team 完成可运行版本") {
  const taskRoot = taskRootFor(workspacePath, taskId);
  ensureGeneratedGitignore(taskRoot);
  let initialized = fs.existsSync(path.join(taskRoot, ".git"));
  if (!initialized) {
    const init = await runGit(taskRoot, ["init"]);
    if (init.status !== "passed") return { ok: false, initialized: false, error: init.stderr || "Git 初始化失败" };
    initialized = true;
  }
  const add = await runGit(taskRoot, ["add", "-A"]);
  if (add.status !== "passed") return { ok: false, initialized, error: add.stderr || "Git 暂存失败" };
  const statusBefore = await runGit(taskRoot, ["status", "--porcelain"]);
  if (!statusBefore.stdout.trim()) return { ok: true, initialized, committed: false, taskRoot, message: "没有需要提交的变更" };
  const safeMessage = String(message || "AI Team 完成可运行版本").replace(/[\r\n]/g, " ").slice(0, 120);
  const commit = await runGit(taskRoot, ["-c", "user.name=AI Software Team", "-c", "user.email=ai-team@local", "commit", "-m", safeMessage], 60_000);
  if (commit.status !== "passed") return { ok: false, initialized, error: commit.stderr || "Git 提交失败" };
  const revision = await runGit(taskRoot, ["rev-parse", "--short", "HEAD"]);
  return { ok: true, initialized, committed: true, revision: revision.stdout.trim(), taskRoot, message: safeMessage };
}

async function gitStatus(workspacePath, taskId) {
  const taskRoot = taskRootFor(workspacePath, taskId);
  const initialized = fs.existsSync(path.join(taskRoot, ".git"));
  if (!initialized) return { initialized: false, clean: false, taskRoot, changes: [] };
  const status = await runGit(taskRoot, ["status", "--porcelain"]);
  if (status.status !== "passed") throw new Error(status.stderr || "无法读取 Git 状态");
  const changes = status.stdout.split(/\r?\n/).filter(Boolean).slice(0, 100);
  const revision = await runGit(taskRoot, ["rev-parse", "--short", "HEAD"]);
  return { initialized: true, clean: changes.length === 0, taskRoot, revision: revision.status === "passed" ? revision.stdout.trim() : null, changes };
}

function policyStatus() {
  return {
    enabled: true,
    shell: false,
    workspaceBoundary: ".ai-team-output/<task-id>",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxOutputBytes: MAX_OUTPUT_BYTES,
    maxChecks: MAX_CHECKS,
    allowedCommands: ["node", "npm", "pnpm", "python", "py", "pytest", "git（只读检查）"],
    repairAttempts: 2,
  };
}

module.exports = { taskRootFor, normalizeSpec, detectChecks, runChecks, gitSnapshot, gitStatus, policyStatus };
