const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createVoiceSettingsStore } = require("../electron/voice-settings-store");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-voice-settings-"));
const filePath = path.join(directory, "voice-settings.json");
const store = createVoiceSettingsStore({
  filePath,
  encrypt: (value) => Buffer.from(`语音:${value}`, "utf8").toString("base64"),
  decrypt: (value) => Buffer.from(value, "base64").toString("utf8").replace(/^语音:/, ""),
});

try {
  assert.equal(store.status().configured, false);
  store.persist({
    asrProvider: "groq", asrBaseUrl: "https://api.groq.com/openai/v1/", asrModel: "whisper-large-v3-turbo", asrApiKey: "asr-secret",
    ttsProvider: "openai", ttsBaseUrl: "https://api.openai.com/v1/", ttsModel: "gpt-4o-mini-tts", ttsApiKey: "tts-secret",
    voice: "alloy", speed: 1.15, autoSpeak: true,
  });
  assert.equal(store.load().asrApiKey, "asr-secret");
  assert.equal(store.load().ttsApiKey, "tts-secret");
  assert.equal(store.status().autoSpeak, true);
  const raw = fs.readFileSync(filePath, "utf8");
  assert.equal(raw.includes("asr-secret"), false);
  assert.equal(raw.includes("tts-secret"), false);
  store.persist({ asrModel: "whisper-next", asrApiKey: "", ttsApiKey: "", speed: 9 });
  assert.equal(store.load().asrApiKey, "asr-secret");
  assert.equal(store.load().speed, 4);
  store.clear();
  assert.equal(fs.existsSync(filePath), false);
  console.log("通过：语音识别与合成配置独立加密、留空复用密钥和参数校验");
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
