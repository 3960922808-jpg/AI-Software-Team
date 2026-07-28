const fs = require("fs");
const path = require("path");

function createIntegrationSettingsStore({ filePath, encrypt, decrypt }) {
  if (!filePath || typeof encrypt !== "function" || typeof decrypt !== "function") throw new Error("联网配置存储初始化参数不完整");

  function readRecord() {
    if (!fs.existsSync(filePath)) return null;
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (record?.version !== 1 || !record.encryptedGithubToken) throw new Error("联网配置文件格式无效");
    return record;
  }

  function load() {
    const record = readRecord();
    return record ? { githubToken: decrypt(record.encryptedGithubToken) } : { githubToken: "" };
  }

  function persist(payload) {
    const githubToken = String(payload?.githubToken || "").trim();
    if (!githubToken) throw new Error("GitHub 令牌不能为空");
    const record = { version: 1, encryptedGithubToken: encrypt(githubToken), updatedAt: new Date().toISOString() };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return status();
  }

  function clear() { fs.rmSync(filePath, { force: true }); }

  function status() {
    const record = readRecord();
    return { githubTokenConfigured: Boolean(record), persisted: Boolean(record), updatedAt: record?.updatedAt || null };
  }

  return { load, persist, clear, status };
}

module.exports = { createIntegrationSettingsStore };
