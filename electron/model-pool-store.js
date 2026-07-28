const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function createModelPoolStore({ filePath, encrypt, decrypt }) {
  if (!filePath || typeof encrypt !== "function" || typeof decrypt !== "function") {
    throw new Error("模型池存储初始化参数不完整");
  }

  function emptyRecord() {
    return { version: 1, profiles: [], assignments: {}, updatedAt: null };
  }

  function readRecord() {
    if (!fs.existsSync(filePath)) return emptyRecord();
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (record?.version !== 1 || !Array.isArray(record.profiles) || typeof record.assignments !== "object") {
      throw new Error("模型池配置文件格式无效");
    }
    return record;
  }

  function normalizeProfile(next, current = null) {
    const profile = {
      id: String(next?.id || current?.id || crypto.randomUUID()).trim(),
      name: String(next?.name || current?.name || "").trim(),
      provider: String(next?.provider || current?.provider || "openai").trim(),
      baseUrl: String(next?.baseUrl || current?.baseUrl || "").trim().replace(/\/$/, ""),
      model: String(next?.model || current?.model || "").trim(),
      apiKey: String(next?.apiKey || current?.apiKey || "").trim(),
    };
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(profile.id)) throw new Error("模型连接标识无效");
    if (!profile.name || profile.name.length > 60) throw new Error("连接名称不能为空且不能超过 60 个字符");
    if (!profile.baseUrl || !profile.model || !profile.apiKey) throw new Error("模型、API 地址和 API Key 均不能为空");
    const url = new URL(profile.baseUrl);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error("API 地址必须使用 HTTP 或 HTTPS");
    return profile;
  }

  function decryptProfile(profile) {
    return {
      id: profile.id,
      name: profile.name,
      provider: profile.provider,
      baseUrl: profile.baseUrl,
      model: profile.model,
      apiKey: decrypt(profile.encryptedApiKey),
    };
  }

  function writeRecord(record) {
    const next = { ...record, version: 1, updatedAt: new Date().toISOString() };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return next;
  }

  function load() {
    const record = readRecord();
    return {
      profiles: record.profiles.map(decryptProfile),
      assignments: { ...record.assignments },
    };
  }

  function status() {
    const record = readRecord();
    return {
      profiles: record.profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        provider: profile.provider,
        baseUrl: profile.baseUrl,
        model: profile.model,
        apiKeyConfigured: Boolean(profile.encryptedApiKey),
        updatedAt: profile.updatedAt || record.updatedAt || null,
      })),
      assignments: { ...record.assignments },
      updatedAt: record.updatedAt || null,
    };
  }

  function saveProfile(next) {
    const record = readRecord();
    const existingIndex = record.profiles.findIndex((profile) => profile.id === next?.id);
    const existing = existingIndex >= 0 ? decryptProfile(record.profiles[existingIndex]) : null;
    const normalized = normalizeProfile(next, existing);
    const stored = {
      id: normalized.id,
      name: normalized.name,
      provider: normalized.provider,
      baseUrl: normalized.baseUrl,
      model: normalized.model,
      encryptedApiKey: encrypt(normalized.apiKey),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) record.profiles[existingIndex] = stored;
    else record.profiles.push(stored);
    writeRecord(record);
    return normalized;
  }

  function deleteProfile(profileId) {
    const record = readRecord();
    if (!record.profiles.some((profile) => profile.id === profileId)) throw new Error("要删除的模型连接不存在");
    record.profiles = record.profiles.filter((profile) => profile.id !== profileId);
    record.assignments = Object.fromEntries(Object.entries(record.assignments).filter(([, value]) => value !== profileId));
    writeRecord(record);
    return load();
  }

  function assign(target, profileId) {
    const key = String(target || "").trim();
    if (!key || key.length > 80) throw new Error("模型路由目标无效");
    const record = readRecord();
    if (profileId && !record.profiles.some((profile) => profile.id === profileId)) throw new Error("所选模型连接不存在");
    if (profileId) record.assignments[key] = profileId;
    else delete record.assignments[key];
    writeRecord(record);
    return load();
  }

  function clear() {
    fs.rmSync(filePath, { force: true });
  }

  return { load, status, saveProfile, deleteProfile, assign, clear };
}

module.exports = { createModelPoolStore };
