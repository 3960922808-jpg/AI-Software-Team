const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createPluginRuntime } = require("../electron/plugin-runtime");

function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-plugins-"));
  try {
    const directoryPath = path.join(root, "plugins");
    const statePath = path.join(root, "plugins-state.json");
    const runtime = createPluginRuntime({ directoryPath, statePath });
    assert.equal(runtime.status().filter((plugin) => plugin.enabled).length, 3);

    fs.writeFileSync(path.join(directoryPath, "docs.json"), JSON.stringify({
      id: "documentation-quality",
      name: "文档质量",
      version: "1.0.0",
      agents: ["技术主管 Agent"],
      skills: ["README 检查"],
      prompt: "所有项目必须包含准确的启动和测试说明。",
    }), "utf8");
    assert.ok(runtime.status().some((plugin) => plugin.id === "documentation-quality" && !plugin.enabled));
    runtime.setEnabled("documentation-quality", true);
    assert.ok(runtime.context().some((plugin) => plugin.id === "documentation-quality" && plugin.prompt.includes("启动")));
    assert.ok(fs.existsSync(statePath));
    console.log("通过：内置插件、本地清单校验、启用状态持久化与调度上下文");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main();
