const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createModelPoolStore } = require("../electron/model-pool-store");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-model-pool-"));
const filePath = path.join(directory, "model-pool.json");
const store = createModelPoolStore({
  filePath,
  encrypt: (value) => Buffer.from(`安全前缀:${value}`, "utf8").toString("base64"),
  decrypt: (value) => Buffer.from(value, "base64").toString("utf8").replace(/^安全前缀:/, ""),
});

try {
  assert.deepEqual(store.status(), { profiles: [], assignments: {}, updatedAt: null });
  const profile = store.saveProfile({ id: "architecture", name: "架构推理模型", provider: "custom", baseUrl: "https://example.com/v1/", model: "reasoning-model", apiKey: "pool-secret" });
  assert.equal(profile.baseUrl, "https://example.com/v1");
  assert.equal(store.load().profiles[0].apiKey, "pool-secret");
  assert.equal(fs.readFileSync(filePath, "utf8").includes("pool-secret"), false);

  store.assign("架构师 Agent", "architecture");
  assert.equal(store.status().assignments["架构师 Agent"], "architecture");
  store.saveProfile({ id: "architecture", name: "架构模型二号", provider: "custom", baseUrl: "https://example.com/v1", model: "reasoning-model-2", apiKey: "" });
  assert.equal(store.load().profiles[0].apiKey, "pool-secret");
  assert.equal(store.status().profiles[0].model, "reasoning-model-2");

  store.deleteProfile("architecture");
  assert.equal(store.status().profiles.length, 0);
  assert.equal(store.status().assignments["架构师 Agent"], undefined);
  console.log("通过：模型池连接加密、密钥复用、角色路由与删除回退");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
