const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const runtime = require("../electron/model-runtime");

function responseFor(system) {
  if (system.includes("拆成 1-6 个")) return JSON.stringify({ goal: "交付可运行模块", subtasks: [
    { title: "分析需求", delegateTo: "产品经理 Agent", instructions: "定义验收", dependsOn: [] },
    { title: "设计架构", delegateTo: "架构师 Agent", instructions: "定义模块", dependsOn: [0] },
    { title: "实现模块", delegateTo: "后端 Agent", instructions: "生成实现文件", dependsOn: [0, 1] },
    { title: "测试模块", delegateTo: "测试 Agent", instructions: "生成测试文件", dependsOn: [2] }
  ] });
  if (system.includes("4-6 个真实可执行")) return JSON.stringify({ goal: "交付可运行模块", subtasks: [
    { title: "分析需求", delegateTo: "产品经理 Agent", instructions: "定义验收", dependsOn: [] },
    { title: "设计架构", delegateTo: "架构师 Agent", instructions: "定义模块", dependsOn: [0] },
    { title: "实现模块", delegateTo: "后端 Agent", instructions: "生成实现文件", dependsOn: [0, 1] },
    { title: "测试模块", delegateTo: "测试 Agent", instructions: "生成测试文件", dependsOn: [2] }
  ] });
  if (system.includes("产品经理，")) return JSON.stringify({ summary: "验收标准完成", artifacts: [{ path: "docs/REQUIREMENTS.md", content: "# 验收标准\n\n- 模块可运行\n" }], checks: [] });
  if (system.includes("软件架构师")) return JSON.stringify({ summary: "架构完成", artifacts: [{ path: "docs/ARCHITECTURE.md", content: "# 架构\n\nNode.js 模块。\n" }], checks: [] });
  if (system.includes("修复自己刚才生成的项目")) return JSON.stringify({ summary: "根据真实语法错误完成修复", artifacts: [{ path: "src/service.js", content: "module.exports = () => 'ok';\n" }], checks: [{ command: "node", args: ["--check", "src/service.js"], cwd: ".", label: "修复后语法检查" }] });
  if (system.includes("后端工程师")) return JSON.stringify({ summary: "首次实现", artifacts: [{ path: "src/service.js", content: "module.exports = (\n" }], checks: [{ command: "node", args: ["--check", "src/service.js"], cwd: ".", label: "实现语法检查" }] });
  if (system.includes("测试工程师")) return JSON.stringify({ summary: "测试完成", artifacts: [{ path: "test/service.test.js", content: "const test = require('node:test');\nconst assert = require('node:assert');\nconst service = require('../src/service');\ntest('service', () => assert.equal(service(), 'ok'));\n" }], checks: [{ command: "node", args: ["--test"], cwd: ".", label: "自动化测试" }] });
  if (system.includes("审查所有子 Agent")) return "# 验收结果\n两个专业 Agent 均已交付文件。";
  if (system.includes("项目经理灵灵")) return JSON.stringify({ reply: "可以创建并执行。", action: { type: "create_and_execute", title: "实现模块", description: "交付并测试", priority: "high", agent: "后端 Agent" } });
  return "连接成功";
}

async function main() {
  const requestedModels = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const payload = JSON.parse(body);
      requestedModels.push(payload.model);
      const system = payload.messages?.[0]?.content || "";
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ choices: [{ message: { content: responseFor(system) } }] }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-v08-"));
  try {
    runtime.configure({ provider: "custom", baseUrl: `http://127.0.0.1:${server.address().port}/v1`, model: "mock-team", apiKey: "test-only" });
    runtime.configurePool({ profiles: [{ id: "backend-model", name: "后端专用模型", provider: "custom", baseUrl: `http://127.0.0.1:${server.address().port}/v1`, model: "mock-backend", apiKey: "test-only" }], assignments: { "后端 Agent": "backend-model" } });
    runtime.setWorkspace(tempWorkspace);
    const result = await runtime.executeTask({ task: { id: "task-test", title: "实现并测试模块", priority: "high", agent: "技术主管 Agent" }, skills: { "后端 Agent": ["API 设计"], "测试 Agent": ["自动化测试"] }, context: [] });
    assert.equal(result.runs.length, 4);
    assert.equal(result.runs[0].delegateTo, "产品经理 Agent");
    assert.equal(result.runs[2].delegateTo, "后端 Agent");
    assert.equal(result.runs[3].dependsOn[0], 2);
    assert.equal(result.runs[2].model, "mock-backend");
    assert.equal(result.runs[3].model, "mock-team");
    assert.equal(result.runs.flatMap((run) => run.artifacts).length, 4);
    for (const artifact of result.runs.flatMap((run) => run.artifacts)) assert.ok(fs.existsSync(artifact.absolutePath));
    assert.equal(result.verification.passed, true);
    assert.equal(result.verification.checkCount, 2);
    assert.equal(result.verification.repairCount, 1);
    assert.equal(result.runs[2].repairAttempts.length, 1);
    assert.equal(result.git.ok, true);
    assert.ok(fs.existsSync(path.join(result.taskRoot, ".git")));
    assert.ok(fs.existsSync(path.join(result.taskRoot, "src", "service.js")));
    assert.ok(fs.existsSync(path.join(result.taskRoot, "test", "service.test.js")));
    assert.match(result.result, /验收结果/);
    const chat = await runtime.chat({ messages: [{ role: "user", content: "帮我实现并执行" }] });
    assert.equal(chat.action.type, "create_and_execute");
    assert.ok(requestedModels.includes("mock-backend"));
    assert.ok(requestedModels.includes("mock-team"));
    console.log("通过：主智能体拆解、子智能体独立模型路由、产物、最终验收与对话动作");
  } finally {
    server.close();
    fs.rmSync(tempWorkspace, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
