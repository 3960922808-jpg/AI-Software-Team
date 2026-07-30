const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createMemoryGraphRuntime } = require("../electron/memory-graph-runtime");

function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-memory-graph-"));
  try {
    const project = path.join(root, "project");
    fs.mkdirSync(path.join(project, "src"), { recursive: true });
    fs.writeFileSync(path.join(project, "README.md"), "# Demo\nSee [app](src/app.js). Shared memory graph context.", "utf8");
    fs.writeFileSync(path.join(project, "src", "app.js"), "const helper = require('./helper');\nfunction memoryGraph(){ return helper(); }", "utf8");
    fs.writeFileSync(path.join(project, "src", "helper.js"), "module.exports = function memoryGraph(){ return 'context'; };", "utf8");
    fs.mkdirSync(path.join(project, "node_modules", "ignored"), { recursive: true });
    fs.writeFileSync(path.join(project, "node_modules", "ignored", "x.js"), "ignored", "utf8");
    const statePath = path.join(root, "graph.json");
    const runtime = createMemoryGraphRuntime({ statePath });
    const graph = runtime.reindex(project);
    assert.equal(graph.stats.files, 3);
    assert.ok(graph.stats.directories >= 2);
    assert.ok(graph.edges.some((edge) => edge.type === "references"));
    assert.ok(graph.nodes.some((node) => node.type === "concept"));
    assert.equal(runtime.context().rootPath, path.resolve(project));
    assert.ok(fs.existsSync(statePath));
    assert.equal(createMemoryGraphRuntime({ statePath }).get().stats.files, 3);
    console.log("通过：文件夹扫描、引用关系、概念节点、忽略目录与长期持久化");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main();
