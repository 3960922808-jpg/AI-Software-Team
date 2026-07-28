const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createWorkspaceSettingsStore } = require("../electron/workspace-settings-store");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-workspace-store-"));
const settingsPath = path.join(root, "settings", "workspace.json");
const outputPath = path.join(root, "任意产物目录");
const filePath = path.join(root, "不是目录.txt");

try {
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(filePath, "测试", "utf8");

  const first = createWorkspaceSettingsStore({ filePath: settingsPath });
  const saved = first.persist(outputPath);
  assert.equal(saved.path, path.resolve(outputPath));

  const restored = createWorkspaceSettingsStore({ filePath: settingsPath }).load();
  assert.equal(restored.path, path.resolve(outputPath));
  assert.ok(restored.updatedAt);

  assert.throws(() => first.persist(filePath), /不存在/);
  fs.rmSync(outputPath, { recursive: true, force: true });
  assert.equal(createWorkspaceSettingsStore({ filePath: settingsPath }).load().path, null);

  console.log("通过：任意产物目录保存、重启恢复、失效回退与非目录拦截");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
