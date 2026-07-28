const assert = require("assert");
const workflowState = require("../workflow-state");

const empty = workflowState.build([], null);
assert.strictEqual(empty.task, null);
assert.strictEqual(empty.nodes.length, 14);
assert.strictEqual(empty.summary.progress, 0);

const queued = workflowState.build([{
  id: "task-1",
  title: "创建桌面工具",
  status: "todo",
  agent: "技术主管 Agent"
}], "task-1");
assert.strictEqual(queued.task.id, "task-1");
assert.strictEqual(queued.nodes.find((node) => node.id === "request").state, "done");
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
}], "task-2");
assert.strictEqual(completed.nodes.find((node) => node.id === "backend").state, "done");
assert.strictEqual(completed.nodes.find((node) => node.id === "tester").state, "done");
assert.strictEqual(completed.nodes.find((node) => node.id === "delivery").state, "done");
assert.strictEqual(completed.summary.artifacts, 2);

const failed = workflowState.build([{
  id: "task-3",
  title: "失败任务",
  status: "todo",
  error: "自动验证未通过",
  runs: [{ delegateTo: "测试 Agent", title: "运行测试", verification: { passed: false, checks: [{}] } }]
}], "task-3");
assert.strictEqual(failed.nodes.find((node) => node.id === "tester").state, "failed");
assert.strictEqual(failed.nodes.find((node) => node.id === "delivery").state, "failed");
assert.ok(failed.edges.some((edge) => edge.state === "failed"));

console.log("可视化工作流状态测试通过");
