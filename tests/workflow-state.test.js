const assert = require("assert");
const workflowState = require("../workflow-state");

const empty = workflowState.build([], null, "software");
assert.strictEqual(empty.task, null);
assert.strictEqual(empty.nodes.length, 21);
assert.strictEqual(empty.summary.progress, 0);

const manager = empty.nodes.find((node) => node.id === "commander");
const agents = empty.nodes.filter((node) => node.type === "agent");
const modules = empty.nodes.filter((node) => node.type === "module");
assert.ok(manager.x < Math.min(...agents.map((node) => node.x)), "经理必须位于所有 Agent 左侧");
assert.strictEqual(agents.length, 10);
assert.strictEqual(modules.length, 10);
assert.strictEqual(empty.edges.filter((edge) => edge.from === "commander").length, 10);
for (const agent of agents) {
  assert.ok(empty.edges.some((edge) => edge.from === "commander" && edge.to === agent.id), `经理缺少到 ${agent.id} 的支流`);
  assert.ok(empty.edges.some((edge) => edge.from === agent.id && edge.to === `${agent.id}-output`), `${agent.id} 缺少下游任务板块`);
}

const queued = workflowState.build([{
  id: "task-1",
  title: "创建桌面工具",
  status: "todo",
  agent: "技术主管 Agent"
}], "task-1", "software");
assert.strictEqual(queued.task.id, "task-1");
assert.strictEqual(queued.nodes.find((node) => node.id === "commander").state, "queued");
assert.strictEqual(queued.nodes.find((node) => node.id === "techlead").state, "queued");

const completed = workflowState.build([{
  id: "task-2",
  title: "完成 API 服务",
  status: "done",
  agent: "后端 Agent",
  artifacts: [{ relativePath: "server.js" }, { relativePath: "README.md" }],
  runs: [
    { delegateTo: "后端 Agent", title: "实现服务", summary: "接口已经完成", verification: { passed: true, checks: [{}] } },
    { delegateTo: "测试 Agent", title: "运行测试", summary: "测试已经通过", verification: { passed: true, checks: [{}, {}] } }
  ]
}], "task-2", "software");
assert.strictEqual(completed.nodes.find((node) => node.id === "backend").state, "done");
assert.strictEqual(completed.nodes.find((node) => node.id === "tester-output").state, "done");
assert.strictEqual(completed.summary.progress, 100);
assert.strictEqual(completed.summary.artifacts, 2);

const templateList = workflowState.templateList();
assert.deepStrictEqual(templateList.map((template) => template.id), ["software", "image", "video"]);
for (const mode of ["image", "video"]) {
  const workflow = workflowState.build([], null, mode);
  const modeManager = workflow.nodes.find((node) => node.manager);
  assert.ok(modeManager);
  assert.ok(workflow.edges.some((edge) => edge.to === modeManager.id));
  assert.equal(workflow.template.width, 3400);
  assert.equal(workflow.template.height, 2100);
  assert.ok(workflow.nodes.some((node) => node.inputs.length && node.outputs.length));
  assert.ok(workflow.edges.every((edge) => edge.sourcePort && edge.targetPort));
  assert.ok(workflow.nodes.some((node) => node.parameterSchema.length));
}

console.log("可编辑工作流模板与分支结构测试通过");
