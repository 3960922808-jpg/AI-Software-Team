const fs = require("fs");
const path = require("path");

const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_BYTES = 180 * 1024 * 1024;
const IMAGE_MIME_TYPES = Object.freeze({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp" });

function baseEndpoint(baseUrl, suffix) { return `${String(baseUrl || "").replace(/\/$/, "")}${suffix}`; }
function decodeBase64(value) { return Buffer.from(String(value || "").replace(/^data:[^;]+;base64,/, ""), "base64"); }

function outputDirectory(workspacePath) {
  if (!workspacePath) throw new Error("请先选择 Agent 产物工作目录");
  const resolved = path.resolve(workspacePath, ".ai-team-media");
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

function saveOutput(workspacePath, kind, buffer, extension) {
  const directory = outputDirectory(workspacePath);
  const fileName = `${kind}-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, buffer);
  return { filePath, relativePath: path.relative(workspacePath, filePath), bytes: buffer.length, fileName };
}

function firstOutput(data) {
  return data?.data?.[0] || data?.output?.[0] || data?.result || data;
}

function readReferenceImage(candidatePath) {
  const value = String(candidatePath || "").trim();
  if (!value) return null;
  const filePath = path.resolve(value);
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[extension];
  if (!mimeType) throw new Error("参考图片仅支持 PNG、JPG、WEBP、GIF 或 BMP");
  let stat;
  try { stat = fs.statSync(filePath); }
  catch { throw new Error("参考图片不存在或已经被移动"); }
  if (!stat.isFile()) throw new Error("参考图片路径不是文件");
  if (stat.size > MAX_IMAGE_BYTES) throw new Error("参考图片不能超过 30MB");
  const buffer = fs.readFileSync(filePath);
  return { filePath, fileName: path.basename(filePath), mimeType, buffer, dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}` };
}

function createMediaGenerationRuntime({ getConfiguration, getWorkspace, fetchImpl = globalThis.fetch }) {
  if (typeof getConfiguration !== "function" || typeof getWorkspace !== "function") throw new Error("媒体运行时初始化参数不完整");
  if (typeof fetchImpl !== "function") throw new Error("媒体运行时缺少网络请求实现");

  async function request(url, options, timeoutMs = 180000) {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`媒体 API 返回 ${response.status}：${detail.slice(0, 600)}`);
    }
    return response;
  }

  async function download(url, apiKey, maxBytes) {
    const parsed = new URL(String(url));
    if (parsed.protocol !== "https:") throw new Error("媒体下载地址必须使用 HTTPS");
    const response = await request(parsed, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} }, 300000);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > maxBytes) throw new Error("媒体结果超过保存限制");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error("媒体结果超过保存限制");
    return { buffer, contentType: response.headers.get("content-type") || "" };
  }

  async function generateImage(payload = {}) {
    const config = getConfiguration("image");
    if (!config?.apiKey) throw new Error("请先在设置中配置生图 API");
    const prompt = String(payload.prompt || "").trim();
    if (!prompt) throw new Error("正向提示词不能为空");
    const negativePrompt = String(payload.negativePrompt || "").trim();
    const referenceImage = readReferenceImage(payload.referenceImagePath);
    const width = Math.max(256, Math.min(4096, Number(payload.width) || 1024));
    const height = Math.max(256, Math.min(4096, Number(payload.height) || 1024));
    let response;
    if (config.provider === "stability") {
      const form = new FormData();
      form.append("prompt", prompt); if (negativePrompt) form.append("negative_prompt", negativePrompt);
      form.append("output_format", "png");
      if (referenceImage) { form.append("image", new Blob([referenceImage.buffer], { type: referenceImage.mimeType }), referenceImage.fileName); form.append("strength", String(Math.max(0, Math.min(1, Number(payload.referenceStrength) || 0.65)))); }
      response = await request(baseEndpoint(config.baseUrl, "/stable-image/generate/core"), { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, Accept: "image/*" }, body: form });
    } else if (config.provider === "google") {
      const parts = [{ text: negativePrompt ? `${prompt}\n不要出现：${negativePrompt}` : prompt }];
      if (referenceImage) parts.push({ inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.buffer.toString("base64") } });
      response = await request(`${baseEndpoint(config.baseUrl, `/v1beta/models/${encodeURIComponent(config.model)}:generateContent`)}?key=${encodeURIComponent(config.apiKey)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } })
      });
    } else if (referenceImage) {
      const form = new FormData();
      form.append("model", config.model); form.append("prompt", prompt); form.append("n", "1"); form.append("size", `${width}x${height}`);
      if (negativePrompt) form.append("negative_prompt", negativePrompt);
      form.append("image", new Blob([referenceImage.buffer], { type: referenceImage.mimeType }), referenceImage.fileName);
      response = await request(baseEndpoint(config.baseUrl, "/images/edits"), { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}` }, body: form });
    } else {
      response = await request(baseEndpoint(config.baseUrl, "/images/generations"), {
        method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: config.model, prompt, n: 1, size: `${width}x${height}`, quality: payload.quality || "standard", response_format: "b64_json", negative_prompt: negativePrompt || undefined, seed: Number(payload.seed) || undefined, steps: Number(payload.steps) || undefined, cfg_scale: Number(payload.cfg) || undefined })
      });
    }
    const contentType = response.headers.get("content-type") || "";
    let buffer; let extension = "png";
    if (contentType.startsWith("image/")) {
      buffer = Buffer.from(await response.arrayBuffer()); extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    } else {
      const data = await response.json();
      const googlePart = data?.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
      const output = googlePart?.inlineData ? { b64_json: googlePart.inlineData.data, mimeType: googlePart.inlineData.mimeType } : firstOutput(data);
      if (output?.b64_json || output?.base64 || output?.data) buffer = decodeBase64(output.b64_json || output.base64 || output.data);
      else if (output?.url || data?.url) { const downloaded = await download(output.url || data.url, "", MAX_IMAGE_BYTES); buffer = downloaded.buffer; }
      else throw new Error("生图服务没有返回图片数据或下载地址");
      if (googlePart?.inlineData?.mimeType?.includes("jpeg") || output?.mimeType?.includes("jpeg")) extension = "jpg";
    }
    if (!buffer?.length || buffer.length > MAX_IMAGE_BYTES) throw new Error("生成图片为空或超过 30MB 限制");
    const saved = saveOutput(getWorkspace(), "image", buffer, extension);
    return { kind: "image", status: "completed", ...saved, model: config.model, previewDataUrl: `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${buffer.toString("base64")}` };
  }

  async function generateVideo(payload = {}) {
    const config = getConfiguration("video");
    if (!config?.apiKey) throw new Error("请先在设置中配置视频 API");
    const prompt = String(payload.prompt || "").trim();
    if (!prompt) throw new Error("视频提示词不能为空");
    const referenceImage = readReferenceImage(payload.referenceImagePath);
    const endpoint = config.provider === "runway" ? "/text_to_video" : config.provider === "kling" ? "/videos/text2video" : config.provider === "openai" ? "/videos" : "/videos/generations";
    const headers = { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" };
    if (config.provider === "runway") headers["X-Runway-Version"] = "2024-11-06";
    const response = await request(baseEndpoint(config.baseUrl, endpoint), {
      method: "POST", headers,
      body: JSON.stringify({ model: config.model, prompt, negative_prompt: String(payload.negativePrompt || "") || undefined, duration: Math.max(1, Math.min(60, Number(payload.duration) || 5)), seconds: Math.max(1, Math.min(60, Number(payload.duration) || 5)), ratio: payload.ratio || "16:9", size: payload.size || "1280x720", seed: Number(payload.seed) || undefined, motion: Number(payload.motion) || undefined, image_url: referenceImage?.dataUrl, input_image: referenceImage?.dataUrl, promptImage: referenceImage?.dataUrl })
    }, 300000);
    const contentType = response.headers.get("content-type") || "";
    let buffer = null; let data = null;
    if (contentType.startsWith("video/")) buffer = Buffer.from(await response.arrayBuffer());
    else data = await response.json();
    const output = firstOutput(data);
    if (!buffer && (output?.b64_json || output?.base64)) buffer = decodeBase64(output.b64_json || output.base64);
    if (!buffer && (output?.url || data?.url || data?.video_url)) ({ buffer } = await download(output.url || data.url || data.video_url, "", MAX_VIDEO_BYTES));
    if (buffer) {
      if (buffer.length > MAX_VIDEO_BYTES) throw new Error("生成视频超过 180MB 限制");
      return { kind: "video", status: "completed", ...saveOutput(getWorkspace(), "video", buffer, "mp4"), model: config.model };
    }
    const jobId = output?.id || data?.id || data?.task_id;
    if (!jobId) throw new Error("视频服务既没有返回视频，也没有返回任务编号");
    return { kind: "video", status: output?.status || data?.status || "queued", jobId: String(jobId), model: config.model, detail: "视频任务已提交到服务商，可在服务商控制台查看进度" };
  }

  async function execute(kind, payload) { return kind === "image" ? generateImage(payload) : kind === "video" ? generateVideo(payload) : Promise.reject(new Error("媒体工作流类型无效")); }
  return { execute, generateImage, generateVideo };
}

module.exports = { createMediaGenerationRuntime, readReferenceImage, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES };
