const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const AdmZip = require("adm-zip");
const { compareVersions, parseVersion, selectReleaseAsset, createUpdateRuntime } = require("../electron/update-runtime");

async function main() {
  assert.deepStrictEqual(parseVersion("v0.20.0"), { major: 0, minor: 20, patch: 0, prerelease: "" });
  assert.equal(compareVersions("0.20.0", "0.19.9"), 1);
  assert.equal(compareVersions("1.0.0-beta.1", "1.0.0"), -1);
  const selected = selectReleaseAsset({ assets: [{ name: "notes.txt", size: 2 }, { name: "AI Software Team-0.20.0-x64.zip", size: 42 }] });
  assert.equal(selected.name, "AI Software Team-0.20.0-x64.zip");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-update-"));
  try {
    const fakeFetch = async () => new Response(JSON.stringify({ tag_name: "v0.20.0", html_url: "https://github.com/example/release", body: "New", assets: [{ name: "AI.Software.Team-0.20.0-x64.zip", size: 100, browser_download_url: "https://example.com/update.zip" }] }), { status: 200, headers: { "content-type": "application/json" } });
    const runtime = createUpdateRuntime({ currentVersion: "0.19.0", userDataPath: root, fetchImpl: fakeFetch });
    const checked = await runtime.check();
    assert.equal(checked.available, true);
    assert.equal(checked.latestVersion, "0.20.0");
    assert.equal(checked.status, "available");
    assert.equal(runtime.setSettings({ autoDownload: false }).settings.autoDownload, false);
    assert.ok(fs.existsSync(path.join(root, "update-settings.json")));
    fs.writeFileSync(path.join(root, "update-state.json"), JSON.stringify({ currentVersion: "0.19.0", latestVersion: "0.20.0", status: "ready", downloaded: true, readyToInstall: true, packageRoot: "stale-package" }), "utf8");
    const updatedRuntime = createUpdateRuntime({ currentVersion: "0.20.0", userDataPath: root, fetchImpl: fakeFetch });
    assert.equal(updatedRuntime.status().currentVersion, "0.20.0");
    assert.equal(updatedRuntime.status().readyToInstall, false);
    assert.equal(updatedRuntime.status().status, "idle");

    const archivePath = path.join(root, "fixture.zip");
    const archive = new AdmZip();
    archive.addFile("AI Software Team.exe", Buffer.from("exe"));
    archive.addFile("resources/app.asar", Buffer.from("asar"));
    archive.writeZip(archivePath);
    const archiveSize = fs.statSync(archivePath).size;
    let fallbackCalls = 0;
    const releaseFetch = async (url) => {
      if (String(url).includes("api.github.com")) return new Response(JSON.stringify({ tag_name: "v0.22.1", html_url: "https://github.com/example/release", body: "Fix", assets: [{ name: "AI.Software.Team-0.22.1-x64.zip", size: archiveSize, browser_download_url: "https://example.com/update.zip" }] }), { status: 200 });
      throw new Error("模拟 Electron 网络失败");
    };
    const fallbackDownloadImpl = async (_url, targetPath, onProgress) => {
      fallbackCalls += 1;
      fs.copyFileSync(archivePath, targetPath);
      onProgress?.({ received: archiveSize, total: archiveSize, percent: 100, fallback: true });
      const crypto = require("crypto");
      return { bytes: archiveSize, sha256: crypto.createHash("sha256").update(fs.readFileSync(targetPath)).digest("hex") };
    };
    const fallbackRuntime = createUpdateRuntime({ currentVersion: "0.22.0", userDataPath: path.join(root, "fallback"), fetchImpl: releaseFetch, fallbackDownloadImpl });
    await fallbackRuntime.check();
    const firstDownload = fallbackRuntime.download();
    const duplicateDownload = fallbackRuntime.download();
    assert.strictEqual(firstDownload, duplicateDownload);
    const ready = await firstDownload;
    assert.equal(fallbackCalls, 1);
    assert.equal(ready.status, "ready");
    assert.equal(ready.downloadMethod, "system");
    assert.ok(fs.existsSync(path.join(ready.packageRoot, "resources", "app.asar")));
    console.log("通过：语义版本、资源选择、持久化、重复点击保护与系统备用下载");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
