const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createMediaGenerationRuntime } = require("../electron/media-generation-runtime");

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-media-"));
  const originalFetch = global.fetch;
  try {
    const configurations = {
      image: { provider: "openai", baseUrl: "https://image.example/v1", model: "image-model", apiKey: "image-key" },
      video: { provider: "openai", baseUrl: "https://video.example/v1", model: "video-model", apiKey: "video-key" }
    };
    const requests = [];
    global.fetch = async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify(url.includes("image.example") ? { data: [{ b64_json: Buffer.from("fake-image").toString("base64") }] } : { id: "video-job-123", status: "queued" }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const runtime = createMediaGenerationRuntime({ getConfiguration: (kind) => configurations[kind], getWorkspace: () => directory });
    const image = await runtime.execute("image", { prompt: "白色工作室", width: 1024, height: 768, steps: 20 });
    assert.equal(image.status, "completed"); assert.ok(fs.existsSync(image.filePath)); assert.match(image.previewDataUrl, /^data:image/);
    assert.equal(requests[0].body.prompt, "白色工作室"); assert.equal(requests[0].body.size, "1024x768");
    const video = await runtime.execute("video", { prompt: "镜头缓慢推进", duration: 6, ratio: "16:9" });
    assert.equal(video.jobId, "video-job-123"); assert.equal(video.status, "queued");
    console.log("通过：图片请求与落盘、视频任务编号返回");
  } finally { global.fetch = originalFetch; fs.rmSync(directory, { recursive: true, force: true }); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
