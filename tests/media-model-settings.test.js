const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createModelSettingsStore } = require("../electron/model-settings-store");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-media-models-"));
const encrypt = (value) => Buffer.from(`媒体密钥:${value}`, "utf8").toString("base64");
const decrypt = (value) => Buffer.from(value, "base64").toString("utf8").replace(/^媒体密钥:/, "");
const imagePath = path.join(directory, "image-model-settings.json");
const videoPath = path.join(directory, "video-model-settings.json");
const imageStore = createModelSettingsStore({ filePath: imagePath, encrypt, decrypt });
const videoStore = createModelSettingsStore({ filePath: videoPath, encrypt, decrypt });

try {
  imageStore.persist({ provider: "openai", baseUrl: "https://image.example/v1", model: "image-model", apiKey: "image-secret" });
  videoStore.persist({ provider: "kling", baseUrl: "https://video.example/v1", model: "video-model", apiKey: "video-secret" });

  assert.equal(imageStore.load().apiKey, "image-secret");
  assert.equal(videoStore.load().apiKey, "video-secret");
  assert.notEqual(imageStore.load().apiKey, videoStore.load().apiKey);
  assert.equal(fs.readFileSync(imagePath, "utf8").includes("image-secret"), false);
  assert.equal(fs.readFileSync(videoPath, "utf8").includes("video-secret"), false);

  imageStore.clear();
  assert.equal(imageStore.status().configured, false);
  assert.equal(videoStore.status().configured, true);
  console.log("通过：生图与视频 API 配置独立加密、独立恢复和独立清除");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
