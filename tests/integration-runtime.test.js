const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const integration = require("../electron/integration-runtime");
const { createIntegrationSettingsStore } = require("../electron/integration-settings-store");

async function main() {
  assert.equal(integration.status().githubTokenConfigured, false);
  assert.equal(integration.configure({ githubToken: "temporary-test-token" }).githubTokenConfigured, true);
  assert.equal(integration.clear().githubTokenConfigured, false);
  assert.deepStrictEqual(integration.parseRepository("https://github.com/openai/codex/tree/main"), { owner: "openai", repository: "codex" });
  assert.deepStrictEqual(integration.parseRepository("git@github.com:openai/codex.git"), { owner: "openai", repository: "codex" });
  assert.deepStrictEqual(integration.parseRepository("github.com/openai/codex/"), { owner: "openai", repository: "codex" });
  await assert.rejects(() => integration.validatePublicUrl("http://example.com"), /只允许使用 HTTPS/);
  await assert.rejects(() => integration.validatePublicUrl("https://127.0.0.1/private"), /拒绝访问本机或局域网地址/);
  await assert.rejects(() => integration.validatePublicUrl("https://localhost/private"), /拒绝访问本机或局域网地址/);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-integration-"));
  try {
    const store = createIntegrationSettingsStore({ filePath: path.join(directory, "settings.json"), encrypt: (value) => Buffer.from(value).toString("base64"), decrypt: (value) => Buffer.from(value, "base64").toString() });
    store.persist({ githubToken: "encrypted-test-token" });
    assert.equal(store.status().persisted, true);
    assert.equal(store.load().githubToken, "encrypted-test-token");
    store.clear();
    assert.equal(store.status().persisted, false);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  console.log("通过：GitHub 地址兼容、联网凭据加密持久化、协议限制和本机网络访问防护");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
