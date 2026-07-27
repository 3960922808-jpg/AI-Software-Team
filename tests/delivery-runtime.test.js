const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const delivery = require("../electron/delivery-runtime");

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-delivery-"));
try {
  fs.writeFileSync(path.join(workspace, "package.json"), JSON.stringify({ name: "delivery-test", version: "1.2.3", scripts: { build: "node build.js", test: "node --test" } }));
  const artifactRoot = path.join(workspace, ".ai-team-output", "task-1", "step-1");
  fs.mkdirSync(artifactRoot, { recursive: true });
  const artifactContent = "module.exports = 'ready';\n";
  fs.writeFileSync(path.join(artifactRoot, "result.js"), artifactContent);

  const report = delivery.inspect(workspace);
  assert.equal(report.project.type, "Node.js");
  assert.deepEqual(report.project.scripts, ["build", "test"]);
  assert.equal(report.artifacts.length, 1);
  assert.equal(report.artifacts[0].sha256, crypto.createHash("sha256").update(artifactContent).digest("hex"));
  assert.equal(report.ready, true);

  const release = delivery.createRelease(workspace, { version: "v1.2.3", channel: "生产", notes: "通过全部验证。" });
  assert.ok(fs.existsSync(release.manifestPath));
  assert.ok(fs.existsSync(release.notesPath));
  const manifest = JSON.parse(fs.readFileSync(release.manifestPath, "utf8"));
  assert.equal(manifest.artifacts.length, 1);
  assert.equal(manifest.readiness, "ready");
  assert.throws(() => delivery.createRelease(workspace, { version: "v1.2.3" }), /已存在/);
  assert.throws(() => delivery.resolveOutputPath(workspace, path.dirname(workspace)), /只能打开/);
  assert.equal(delivery.resolveOutputPath(workspace, release.releasePath), release.releasePath);
  console.log("通过：项目识别、产物校验、版本清单、重复版本和目录越界防护");
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}
