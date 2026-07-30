const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { atomicWriteJson, readJsonWithBackup } = require("../electron/settings-file-utils");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-settings-backup-"));
const filePath = path.join(directory, "settings.json");
try {
  atomicWriteJson(filePath, { version: 1, value: "first" });
  atomicWriteJson(filePath, { version: 1, value: "second" });
  fs.writeFileSync(filePath, "损坏的 JSON", "utf8");
  const restored = readJsonWithBackup(filePath, (value) => value.version === 1);
  assert.equal(restored.value, "first");
  assert.deepEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), restored);
  console.log("通过：配置损坏后自动从备份恢复");
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
