const assert = require("assert");
const { createVoiceRuntime, MAX_AUDIO_BYTES } = require("../electron/voice-runtime");

async function main() {
  const requests = [];
  const configuration = {
    asrProvider: "openai", asrBaseUrl: "https://voice.example/v1", asrModel: "whisper-test", asrApiKey: "asr-key",
    ttsProvider: "openai", ttsBaseUrl: "https://speech.example/v1", ttsModel: "tts-test", ttsApiKey: "tts-key",
    voice: "alloy", speed: 1.2,
  };
  const runtime = createVoiceRuntime({
    getConfiguration: () => configuration,
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      if (String(url).endsWith("/audio/transcriptions")) return new Response(JSON.stringify({ text: "  转写成功  " }), { status: 200, headers: { "Content-Type": "application/json" } });
      if (String(url).endsWith("/audio/speech")) return new Response(Buffer.from("fake-mp3"), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
      return new Response("not found", { status: 404 });
    },
  });
  const transcription = await runtime.transcribe({ audio: Buffer.from("webm"), mimeType: "audio/webm", language: "zh" });
  assert.equal(transcription.text, "转写成功");
  assert.equal(requests[0].url, "https://voice.example/v1/audio/transcriptions");
  assert.equal(requests[0].options.headers.Authorization, "Bearer asr-key");
  const speech = await runtime.synthesize({ text: "你好" });
  assert.equal(speech.audio.toString(), "fake-mp3");
  assert.equal(requests[1].options.headers.Authorization, "Bearer tts-key");
  const body = JSON.parse(requests[1].options.body);
  assert.equal(body.model, "tts-test");
  assert.equal(body.speed, 1.2);
  await assert.rejects(() => runtime.transcribe({ audio: Buffer.alloc(MAX_AUDIO_BYTES + 1) }), /25MB/);
  console.log("通过：真实语音识别请求、语音合成请求、鉴权和音频大小边界");
}

main();
