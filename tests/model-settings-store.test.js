const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createModelSettingsStore } = require("../electron/model-settings-store");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-model-settings-"));
const filePath = path.join(directory, "model-settings.json");
const store = createModelSettingsStore({
  filePath,
  encrypt: (value) => Buffer.from(`安全前缀:${value}`, "utf8").toString("base64"),
  decrypt: (value) => Buffer.from(value, "base64").toString("utf8").replace(/^安全前缀:/, ""),
});

try {
  assert.deepEqual(store.status(), { configured: false, persisted: false, apiKeyConfigured: false });
  const initial = store.merge({ provider: "openai", baseUrl: "https://api.openai.com/v1/", model: "gpt-test", apiKey: "secret-value", routingMode: "quality" });
  store.persist(initial);
  assert.equal(store.load().apiKey, "secret-value");
  assert.equal(store.status().baseUrl, "https://api.openai.com/v1");
  assert.equal(fs.readFileSync(filePath, "utf8").includes("secret-value"), false);

  const updated = store.merge({ provider: "openai", baseUrl: "https://example.com/v1", model: "gpt-next", apiKey: "", routingMode: "speed" });
  assert.equal(updated.apiKey, "secret-value");
  store.persist(updated);
  assert.equal(store.load().model, "gpt-next");
  assert.equal(store.load().apiKey, "secret-value");

  store.clear();
  assert.equal(fs.existsSync(filePath), false);
  console.log("通过：模型配置加密保存、恢复、留空复用密钥与清除");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
