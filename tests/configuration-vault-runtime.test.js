const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createConfigurationVaultRuntime, CONFIGURATION_FILES } = require("../electron/configuration-vault-runtime");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-vault-"));
try {
  fs.writeFileSync(path.join(directory, CONFIGURATION_FILES[0]), JSON.stringify({ version: 1, encryptedApiKey: "ZW5jcnlwdGVk" }), "utf8");
  const vault = createConfigurationVaultRuntime({ userDataPath: directory, appVersion: "0.22.0" });
  const destination = path.join(directory, "backup.aiteam-config");
  const result = vault.exportBundle(destination);
  assert.equal(result.files, 1);
  const content = fs.readFileSync(destination, "utf8");
  assert.equal(content.includes("plain-secret"), false);
  assert.equal(vault.status().configuredCount, 1);
  console.log("通过：配置保险箱仅导出本机密文并统计持久化文件");
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
