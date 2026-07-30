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
    const importPath = path.join(root, "custom-skill.json");
    fs.writeFileSync(importPath, JSON.stringify({ id: "visual-delivery", name: "视觉交付", version: "1.0.0", category: "扩展", description: "检查视觉交付", agents: ["前端 Agent"], skills: ["视觉验收"], prompt: "检查界面一致性。" }), "utf8");
    const imported = runtime.importManifest(importPath);
    assert.equal(imported.plugin.id, "visual-delivery");
    assert.ok(imported.plugins.some((plugin) => plugin.id === "visual-delivery"));
    assert.throws(() => runtime.importManifest(path.join(root, "invalid.txt")), /不存在|JSON/);
    const conflictPath = path.join(root, "conflict.json");
    fs.writeFileSync(conflictPath, JSON.stringify({ id: "database-foundation", name: "冲突", version: "1.0.0", agents: [], skills: ["冲突技能"], prompt: "冲突" }), "utf8");
    assert.throws(() => runtime.importManifest(conflictPath), /冲突/);
    const largePath = path.join(root, "large.json");
    fs.writeFileSync(largePath, JSON.stringify({ data: "x".repeat(70 * 1024) }), "utf8");
    assert.throws(() => runtime.importManifest(largePath), /64KB/);
    const markdownPath = path.join(root, "SKILL.md");
    fs.writeFileSync(markdownPath, "---\nid: release-review\nname: Release Review\nagents: [测试 Agent, DevOps Agent]\nskills: [release review, checksum]\ndescription: Validate a release before delivery.\n---\n# Release Review\nInspect tests, checksums and release notes before delivery.", "utf8");
    const markdownImport = runtime.importSkillFile(markdownPath);
    assert.equal(markdownImport.plugin.id, "release-review");
    assert.ok(markdownImport.plugin.skills.includes("checksum"));
    const directoryImport = runtime.importSkillDirectory(root);
    assert.equal(directoryImport.plugin.id, "release-review");
    console.log("通过：插件状态、自定义 Skill 导入、大小限制与内置 ID 冲突保护");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main();
