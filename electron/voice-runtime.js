const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 90000;

function endpoint(baseUrl, suffix) {
  return `${String(baseUrl || "").replace(/\/$/, "")}${suffix}`;
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetchImpl(url, { ...options, signal: controller.signal }); }
  catch (error) {
    if (error.name === "AbortError") throw new Error("语音服务响应超时");
    throw error;
  } finally { clearTimeout(timer); }
}

async function responseError(response) {
  const body = await response.text().catch(() => "");
  try { return JSON.parse(body)?.error?.message || JSON.parse(body)?.message || body; }
  catch { return body; }
}

function normalizeAudio(audio) {
  const buffer = Buffer.isBuffer(audio) ? audio : Buffer.from(audio || []);
  if (!buffer.length) throw new Error("没有收到录音数据");
  if (buffer.length > MAX_AUDIO_BYTES) throw new Error("录音超过 25MB 限制");
  return buffer;
}

function createVoiceRuntime({ getConfiguration, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (typeof getConfiguration !== "function") throw new Error("语音运行时缺少配置读取器");

  async function transcribe({ audio, mimeType = "audio/webm", language = "zh" } = {}) {
    const config = getConfiguration();
    if (!config?.asrApiKey) throw new Error("请先在设置中配置语音识别 API");
    const buffer = normalizeAudio(audio);
    let response;
    if (config.asrProvider === "deepgram") {
      const url = new URL(endpoint(config.asrBaseUrl, "/listen"));
      url.searchParams.set("model", config.asrModel);
      url.searchParams.set("language", language || "zh");
      url.searchParams.set("smart_format", "true");
      response = await fetchWithTimeout(url, { method: "POST", headers: { Authorization: `Token ${config.asrApiKey}`, "Content-Type": mimeType }, body: buffer }, timeoutMs, fetchImpl);
    } else {
      const form = new FormData();
      form.append("file", new Blob([buffer], { type: mimeType }), `recording.${mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm"}`);
      form.append("model", config.asrModel);
      if (language) form.append("language", language);
      response = await fetchWithTimeout(endpoint(config.asrBaseUrl, "/audio/transcriptions"), { method: "POST", headers: { Authorization: `Bearer ${config.asrApiKey}` }, body: form }, timeoutMs, fetchImpl);
    }
    if (!response.ok) throw new Error(`语音识别失败（${response.status}）：${await responseError(response) || "服务未返回详情"}`);
    const result = await response.json();
    const text = config.asrProvider === "deepgram" ? result?.results?.channels?.[0]?.alternatives?.[0]?.transcript : result?.text;
    if (!String(text || "").trim()) throw new Error("语音服务没有识别出文字");
    return { text: String(text).trim(), model: config.asrModel };
  }

  async function synthesize({ text, format = "mp3" } = {}) {
    const config = getConfiguration();
    if (!config?.ttsApiKey) throw new Error("请先在设置中配置语音合成 API");
    const input = String(text || "").trim();
    if (!input) throw new Error("朗读内容不能为空");
    if (input.length > 12000) throw new Error("单次朗读内容不能超过 12000 个字符");
    const response = await fetchWithTimeout(endpoint(config.ttsBaseUrl, "/audio/speech"), {
      method: "POST",
      headers: { Authorization: `Bearer ${config.ttsApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.ttsModel, voice: config.voice, input, speed: config.speed, response_format: format }),
    }, timeoutMs, fetchImpl);
    if (!response.ok) throw new Error(`语音合成失败（${response.status}）：${await responseError(response) || "服务未返回详情"}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error("语音服务返回了空音频");
    return { audio: bytes, mimeType: format === "wav" ? "audio/wav" : format === "opus" ? "audio/ogg" : "audio/mpeg", model: config.ttsModel };
  }

  async function test() {
    const result = await synthesize({ text: "语音连接测试成功。" });
    return { ok: true, bytes: result.audio.length, model: result.model };
  }

  return { transcribe, synthesize, test };
}

module.exports = { createVoiceRuntime, MAX_AUDIO_BYTES };
