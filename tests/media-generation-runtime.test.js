const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createMediaGenerationRuntime, MAX_IMAGE_BYTES } = require("../electron/media-generation-runtime");

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-media-"));
  try {
    const configurations = {
      image: { provider: "openai", baseUrl: "https://image.example/v1", model: "image-model", apiKey: "image-key" },
      video: { provider: "openai", baseUrl: "https://video.example/v1", model: "video-model", apiKey: "video-key" }
    };
    const requests = [];
    const fetchImpl = async (url, options) => {
      requests.push({ url: String(url), body: options.body instanceof FormData ? options.body : JSON.parse(options.body) });
      return new Response(JSON.stringify(String(url).includes("image.example") ? { data: [{ b64_json: Buffer.from("fake-image").toString("base64") }] } : { id: "video-job-123", status: "queued" }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const runtime = createMediaGenerationRuntime({ getConfiguration: (kind) => configurations[kind], getWorkspace: () => directory, fetchImpl });
    const image = await runtime.execute("image", { prompt: "白色工作室", width: 1024, height: 768, steps: 20 });
    assert.equal(image.status, "completed"); assert.ok(fs.existsSync(image.filePath)); assert.match(image.previewDataUrl, /^data:image/);
    assert.equal(requests[0].body.prompt, "白色工作室"); assert.equal(requests[0].body.size, "1024x768");
    const video = await runtime.execute("video", { prompt: "镜头缓慢推进", duration: 6, ratio: "16:9" });
    assert.equal(video.jobId, "video-job-123"); assert.equal(video.status, "queued");
    const referencePath = path.join(directory, "reference.png");
    fs.writeFileSync(referencePath, Buffer.from("reference-image"));
    const edited = await runtime.execute("image", { prompt: "保持人物外观", referenceImagePath: referencePath });
    assert.equal(edited.status, "completed");
    assert.match(requests[2].url, /\/images\/edits$/);
    assert.ok(requests[2].body instanceof FormData);
    assert.equal(requests[2].body.get("prompt"), "保持人物外观");
    assert.ok(requests[2].body.get("image") instanceof Blob);
    await runtime.execute("video", { prompt: "人物向前走", referenceImagePath: referencePath });
    assert.match(requests[3].body.image_url, /^data:image\/png;base64,/);
    assert.equal(requests[3].body.image_url, requests[3].body.input_image);

    const invalidPath = path.join(directory, "reference.txt");
    fs.writeFileSync(invalidPath, "not an image");
    await assert.rejects(() => runtime.execute("image", { prompt: "测试", referenceImagePath: invalidPath }), /仅支持/);
    const largePath = path.join(directory, "too-large.png");
    fs.writeFileSync(largePath, "0"); fs.truncateSync(largePath, MAX_IMAGE_BYTES + 1);
    await assert.rejects(() => runtime.execute("video", { prompt: "测试", referenceImagePath: largePath }), /30MB/);
    assert.equal(requests.length, 4, "非法参考图不应发起网络请求");
    console.log("通过：媒体请求注入、参考图传输、文件限制与结果落盘");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
