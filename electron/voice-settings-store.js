const fs = require("fs");
const path = require("path");

const DEFAULTS = Object.freeze({
  asrProvider: "openai",
  asrBaseUrl: "https://api.openai.com/v1",
  asrModel: "gpt-4o-mini-transcribe",
  ttsProvider: "openai",
  ttsBaseUrl: "https://api.openai.com/v1",
  ttsModel: "gpt-4o-mini-tts",
  voice: "alloy",
  speed: 1,
  autoSpeak: false,
});

function normalizeUrl(value, fieldName) {
  const text = String(value || "").trim().replace(/\/$/, "");
  if (!text) throw new Error(`${fieldName}不能为空`);
  const url = new URL(text);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`${fieldName}必须使用 HTTP 或 HTTPS`);
  return text;
}

function createVoiceSettingsStore({ filePath, encrypt, decrypt }) {
  if (!filePath || typeof encrypt !== "function" || typeof decrypt !== "function") throw new Error("语音配置存储初始化参数不完整");

  function readRecord() {
    if (!fs.existsSync(filePath)) return null;
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (record?.version !== 1) throw new Error("语音配置文件格式无效");
    return record;
  }

  function load() {
    const record = readRecord();
    if (!record) return null;
    return {
      ...DEFAULTS,
      ...record,
      asrApiKey: record.encryptedAsrApiKey ? decrypt(record.encryptedAsrApiKey) : "",
      ttsApiKey: record.encryptedTtsApiKey ? decrypt(record.encryptedTtsApiKey) : "",
      encryptedAsrApiKey: undefined,
      encryptedTtsApiKey: undefined,
    };
  }

  function merge(next = {}) {
    const current = load() || {};
    const merged = {
      ...DEFAULTS,
      ...current,
      ...next,
      asrProvider: String(next.asrProvider || current.asrProvider || DEFAULTS.asrProvider).trim(),
      asrBaseUrl: normalizeUrl(next.asrBaseUrl || current.asrBaseUrl || DEFAULTS.asrBaseUrl, "语音识别 API 地址"),
      asrModel: String(next.asrModel || current.asrModel || DEFAULTS.asrModel).trim(),
      asrApiKey: String(next.asrApiKey || current.asrApiKey || "").trim(),
      ttsProvider: String(next.ttsProvider || current.ttsProvider || DEFAULTS.ttsProvider).trim(),
      ttsBaseUrl: normalizeUrl(next.ttsBaseUrl || current.ttsBaseUrl || DEFAULTS.ttsBaseUrl, "语音合成 API 地址"),
      ttsModel: String(next.ttsModel || current.ttsModel || DEFAULTS.ttsModel).trim(),
      ttsApiKey: String(next.ttsApiKey || current.ttsApiKey || "").trim(),
      voice: String(next.voice || current.voice || DEFAULTS.voice).trim(),
      speed: Math.max(0.25, Math.min(4, Number(next.speed ?? current.speed ?? DEFAULTS.speed) || 1)),
      autoSpeak: Boolean(next.autoSpeak ?? current.autoSpeak ?? DEFAULTS.autoSpeak),
    };
    if (!merged.asrModel || !merged.ttsModel || !merged.voice) throw new Error("语音识别模型、语音合成模型和音色不能为空");
    if (!merged.asrApiKey || !merged.ttsApiKey) throw new Error("语音识别和语音合成 API Key 均不能为空");
    return merged;
  }

  function persist(configuration) {
    const normalized = merge(configuration);
    const record = {
      version: 1,
      asrProvider: normalized.asrProvider,
      asrBaseUrl: normalized.asrBaseUrl,
      asrModel: normalized.asrModel,
      encryptedAsrApiKey: encrypt(normalized.asrApiKey),
      ttsProvider: normalized.ttsProvider,
      ttsBaseUrl: normalized.ttsBaseUrl,
      ttsModel: normalized.ttsModel,
      encryptedTtsApiKey: encrypt(normalized.ttsApiKey),
      voice: normalized.voice,
      speed: normalized.speed,
      autoSpeak: normalized.autoSpeak,
      updatedAt: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    return status();
  }

  function clear() { fs.rmSync(filePath, { force: true }); }

  function status() {
    const record = readRecord();
    if (!record) return { configured: false, asrConfigured: false, ttsConfigured: false, ...DEFAULTS };
    return {
      configured: Boolean(record.encryptedAsrApiKey && record.encryptedTtsApiKey),
      asrConfigured: Boolean(record.encryptedAsrApiKey),
      ttsConfigured: Boolean(record.encryptedTtsApiKey),
      asrProvider: record.asrProvider,
      asrBaseUrl: record.asrBaseUrl,
      asrModel: record.asrModel,
      ttsProvider: record.ttsProvider,
      ttsBaseUrl: record.ttsBaseUrl,
      ttsModel: record.ttsModel,
      voice: record.voice || DEFAULTS.voice,
      speed: Number(record.speed) || DEFAULTS.speed,
      autoSpeak: Boolean(record.autoSpeak),
      updatedAt: record.updatedAt || null,
    };
  }

  return { load, merge, persist, clear, status };
}

module.exports = { createVoiceSettingsStore, DEFAULTS };
