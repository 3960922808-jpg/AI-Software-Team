const fs = require("fs");
const path = require("path");

function createModelSettingsStore({ filePath, encrypt, decrypt }) {
  if (!filePath || typeof encrypt !== "function" || typeof decrypt !== "function") {
    throw new Error("模型配置存储初始化参数不完整");
  }

  function readRecord() {
    if (!fs.existsSync(filePath)) return null;
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (record?.version !== 1 || !record.encryptedApiKey) throw new Error("模型配置文件格式无效");
    return record;
  }

  function load() {
    const record = readRecord();
    if (!record) return null;
    return {
      provider: record.provider,
      baseUrl: record.baseUrl,
      model: record.model,
      routingMode: record.routingMode || "balanced",
      apiKey: decrypt(record.encryptedApiKey),
    };
  }

  function merge(next) {
    const current = load();
    const merged = {
      provider: String(next?.provider || current?.provider || "openai").trim(),
      baseUrl: String(next?.baseUrl || current?.baseUrl || "").trim().replace(/\/$/, ""),
      model: String(next?.model || current?.model || "").trim(),
      apiKey: String(next?.apiKey || current?.apiKey || "").trim(),
      routingMode: String(next?.routingMode || current?.routingMode || "balanced").trim(),
    };
    if (!merged.baseUrl || !merged.model || !merged.apiKey) throw new Error("模型、API 地址和 API Key 均不能为空");
    const url = new URL(merged.baseUrl);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("API 地址必须使用 HTTP 或 HTTPS");
    if (!["balanced", "quality", "speed"].includes(merged.routingMode)) merged.routingMode = "balanced";
    return merged;
  }

  function persist(configuration) {
    const normalized = merge(configuration);
    const record = {
      version: 1,
      provider: normalized.provider,
      baseUrl: normalized.baseUrl,
      model: normalized.model,
      routingMode: normalized.routingMode,
      encryptedApiKey: encrypt(normalized.apiKey),
      updatedAt: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return normalized;
  }

  function clear() {
    fs.rmSync(filePath, { force: true });
  }

  function status() {
    const record = readRecord();
    if (!record) return { configured: false, persisted: false, apiKeyConfigured: false };
    return {
      configured: true,
      persisted: true,
      apiKeyConfigured: true,
      provider: record.provider,
      baseUrl: record.baseUrl,
      model: record.model,
      routingMode: record.routingMode || "balanced",
      updatedAt: record.updatedAt || null,
    };
  }

  return { load, merge, persist, clear, status };
}

module.exports = { createModelSettingsStore };
