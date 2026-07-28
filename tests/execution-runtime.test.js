const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const runtime = require("../electron/execution-runtime");

async function main() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-sandbox-"));
  try {
    const taskRoot = runtime.taskRootFor(workspace, "task-sandbox", true);
    fs.mkdirSync(path.join(taskRoot, "src"), { recursive: true });
    fs.writeFileSync(path.join(taskRoot, "src", "valid.js"), "module.exports = () => 'ok';\n", "utf8");

    const allowed = await runtime.runChecks(workspace, "task-sandbox", [{ command: process.execPath, args: ["--check", "src/valid.js"], label: "语法检查" }]);
    assert.equal(allowed.passed, true);
    assert.equal(allowed.checks[0].status, "passed");

    const inline = await runtime.runChecks(workspace, "task-sandbox", ["node -e \"process.exit(0)\""]);
    assert.equal(inline.passed, false);
    assert.equal(inline.checks[0].status, "rejected");
    assert.match(inline.checks[0].stderr, /禁止内联代码/);

    const escaped = await runtime.runChecks(workspace, "task-sandbox", [{ command: "node", args: ["--check", "src/valid.js"], cwd: ".." }]);
    assert.equal(escaped.checks[0].status, "rejected");
    assert.match(escaped.checks[0].stderr, /超出任务沙箱边界/);

    fs.writeFileSync(path.join(taskRoot, "package.json"), JSON.stringify({ name: "sandbox-fixture", scripts: { test: "node --check src/valid.js" } }), "utf8");
    const detected = runtime.detectChecks(taskRoot);
    assert.ok(detected.some((check) => check.command === "node" && check.args?.includes("src/valid.js")));
    assert.ok(!detected.some((check) => check.command === "npm"));
    const automatic = await runtime.runChecks(workspace, "task-sandbox");
    assert.equal(automatic.passed, true);

    const snapshot = await runtime.gitSnapshot(workspace, "task-sandbox", "测试隔离提交");
    assert.equal(snapshot.ok, true);
    assert.equal(snapshot.initialized, true);
    assert.ok(fs.existsSync(path.join(taskRoot, ".git")));
    assert.ok(fs.readFileSync(path.join(taskRoot, ".gitignore"), "utf8").includes(".env"));

    const status = await runtime.gitStatus(workspace, "task-sandbox");
    assert.equal(status.initialized, true);
    assert.equal(status.clean, true);
    assert.ok(status.revision);
    console.log("通过：受控终端白名单、沙箱边界、自动检查发现和隔离 Git 快照");
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
