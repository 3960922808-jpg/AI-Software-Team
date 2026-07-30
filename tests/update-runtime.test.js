const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
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
    console.log("通过：语义版本比较、Release 资源选择、更新检查与设置持久化");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
