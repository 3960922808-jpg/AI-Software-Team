const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const RELEASES_API = "https://api.github.com/repos/3960922808-jpg/AI-Software-Team/releases/latest";

function parseVersion(value) {
  const match = String(value || "").trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)(?:[-+]([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] || "" };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) throw new Error("版本号必须使用语义化版本格式");
  for (const key of ["major", "minor", "patch"]) if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease, undefined, { numeric: true });
}

function selectReleaseAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const zipAssets = assets.filter((asset) => /ai[ ._-]*software[ ._-]*team.*x64\.zip$/i.test(asset.name || ""));
  return zipAssets.sort((a, b) => Number(b.size || 0) - Number(a.size || 0))[0] || null;
}

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function normalizeSettings(value) {
  return {
    autoCheck: value?.autoCheck !== false,
    autoDownload: value?.autoDownload !== false,
    installOnRestart: value?.installOnRestart !== false
  };
}

async function requestJson(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { accept: "application/vnd.github+json", "user-agent": "AI-Software-Team/0.20", "x-github-api-version": "2022-11-28" }, redirect: "follow", signal: AbortSignal.timeout(45000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`更新服务返回 ${response.status}: ${body.slice(0, 200)}`);
  return JSON.parse(body);
}

async function downloadFile(url, targetPath, fetchImpl, onProgress) {
  const response = await fetchImpl(url, { headers: { accept: "application/octet-stream", "user-agent": "AI-Software-Team/0.20" }, redirect: "follow", signal: AbortSignal.timeout(15 * 60 * 1000) });
  if (!response.ok || !response.body) throw new Error(`更新包下载失败：HTTP ${response.status}`);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = `${targetPath}.part`;
  fs.rmSync(temporary, { force: true });
  const writer = fs.createWriteStream(temporary);
  const reader = response.body.getReader();
  const total = Number(response.headers.get("content-length") || 0);
  let received = 0;
  const hash = crypto.createHash("sha256");
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      hash.update(chunk);
      received += chunk.length;
      if (!writer.write(chunk)) await new Promise((resolve) => writer.once("drain", resolve));
      onProgress?.({ received, total, percent: total ? Math.min(99, Math.round(received / total * 100)) : 0 });
    }
    await new Promise((resolve, reject) => writer.end((error) => error ? reject(error) : resolve()));
  } catch (error) {
    writer.destroy();
    fs.rmSync(temporary, { force: true });
    throw error;
  }
  fs.renameSync(temporary, targetPath);
  onProgress?.({ received, total: total || received, percent: 100 });
  return { bytes: received, sha256: hash.digest("hex") };
}

async function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  let bytes = 0;
  for await (const chunk of fs.createReadStream(filePath)) { hash.update(chunk); bytes += chunk.length; }
  return { bytes, sha256: hash.digest("hex") };
}

async function downloadFileWithPowerShell(url, targetPath, onProgress) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = `${targetPath}.part`;
  fs.rmSync(temporary, { force: true });
  onProgress?.({ received: 0, total: 0, percent: 0, fallback: true });
  try {
    await execFileAsync("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
      "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri $env:AI_TEAM_UPDATE_URL -OutFile $env:AI_TEAM_UPDATE_TARGET"
    ], { windowsHide: true, timeout: 20 * 60 * 1000, maxBuffer: 1024 * 1024, env: { ...process.env, AI_TEAM_UPDATE_URL: url, AI_TEAM_UPDATE_TARGET: temporary } });
    const result = await hashFile(temporary);
    if (!result.bytes) throw new Error("系统下载通道返回了空文件");
    fs.rmSync(targetPath, { force: true });
    fs.renameSync(temporary, targetPath);
    onProgress?.({ received: result.bytes, total: result.bytes, percent: 100, fallback: true });
    return result;
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}

function findPackagedRoot(directory) {
  const queue = [{ directory, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (fs.existsSync(path.join(current.directory, "AI Software Team.exe")) && fs.existsSync(path.join(current.directory, "resources", "app.asar"))) return current.directory;
    if (current.depth >= 2) continue;
    for (const entry of fs.readdirSync(current.directory, { withFileTypes: true })) if (entry.isDirectory()) queue.push({ directory: path.join(current.directory, entry.name), depth: current.depth + 1 });
  }
  return null;
}

function createInstallScript(scriptPath) {
  const content = `param([int]$ProcessId, [string]$Source, [string]$Target, [string]$Executable)\n$ErrorActionPreference = 'Stop'\ntry { Wait-Process -Id $ProcessId -Timeout 90 -ErrorAction SilentlyContinue } catch {}\nStart-Sleep -Milliseconds 800\nGet-ChildItem -LiteralPath $Target -Force | Where-Object { $_.Name -notin @('updates') } | Remove-Item -Recurse -Force\nCopy-Item -Path (Join-Path $Source '*') -Destination $Target -Recurse -Force\nStart-Process -FilePath (Join-Path $Target $Executable) -WorkingDirectory $Target\n`;
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, content, "utf8");
}

function createUpdateRuntime({ currentVersion, userDataPath, installPath, executablePath, fetchImpl = global.fetch, fallbackDownloadImpl = downloadFileWithPowerShell } = {}) {
  if (!currentVersion || !userDataPath) throw new Error("更新运行时缺少版本或用户数据目录");
  const settingsPath = path.join(userDataPath, "update-settings.json");
  const statePath = path.join(userDataPath, "update-state.json");
  let settings = normalizeSettings(readJson(settingsPath, {}));
  const persistedState = readJson(statePath, {});
  const installedPendingVersion = persistedState.readyToInstall && parseVersion(persistedState.latestVersion) && compareVersions(currentVersion, persistedState.latestVersion) >= 0;
  let state = { status: "idle", latestVersion: currentVersion, releaseUrl: "", releaseNotes: "", progress: 0, downloaded: false, readyToInstall: false, error: "", checkedAt: null, ...persistedState, currentVersion };
  if (installedPendingVersion) state = { ...state, status: "idle", available: false, downloaded: false, readyToInstall: false, packageRoot: "", zipPath: "", progress: 0, error: "" };
  const listeners = new Set();
  let activeDownload = null;

  function emit(patch) {
    state = { ...state, ...patch, currentVersion };
    writeJson(statePath, state);
    for (const listener of listeners) listener(status());
    return status();
  }
  function status() { return { ...state, settings: { ...settings } }; }
  function onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function setSettings(next) {
    settings = normalizeSettings({ ...settings, ...next });
    writeJson(settingsPath, settings);
    return status();
  }
  async function check() {
    emit({ status: "checking", error: "", progress: 0 });
    try {
      const release = await requestJson(RELEASES_API, fetchImpl);
      const latestVersion = String(release.tag_name || release.name || "").replace(/^v/i, "");
      const asset = selectReleaseAsset(release);
      if (!parseVersion(latestVersion)) throw new Error("最新 Release 没有有效的语义化版本号");
      const available = compareVersions(latestVersion, currentVersion) > 0;
      const result = emit({ status: available ? "available" : "up-to-date", latestVersion, available, releaseUrl: release.html_url || "", releaseNotes: String(release.body || "").slice(0, 12000), asset: asset ? { name: asset.name, size: asset.size, url: asset.browser_download_url } : null, checkedAt: new Date().toISOString(), error: "" });
      if (available && !asset) throw new Error("发现新版本，但 Release 中没有 Windows x64 ZIP 更新包");
      return result;
    } catch (error) {
      emit({ status: "error", error: error.message || String(error), checkedAt: new Date().toISOString() });
      throw error;
    }
  }
  async function performDownload() {
    if (!state.available || !state.asset?.url) await check();
    if (!state.available || !state.asset?.url) return status();
    const updateDirectory = path.join(userDataPath, "updates", state.latestVersion);
    const zipPath = path.join(updateDirectory, state.asset.name);
    const extractedPath = path.join(updateDirectory, "package");
    fs.mkdirSync(updateDirectory, { recursive: true });
    emit({ status: "downloading", progress: 0, error: "" });
    try {
      let lastProgress = -1;
      let lastProgressAt = 0;
      const progress = ({ percent, received, total, fallback }) => {
        const now = Date.now();
        if (percent === lastProgress && now - lastProgressAt < 250) return;
        lastProgress = percent; lastProgressAt = now;
        emit({ progress: percent, receivedBytes: received, totalBytes: total, downloadMethod: fallback ? "system" : "electron" });
      };
      let downloaded;
      let primaryError;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          downloaded = await downloadFile(state.asset.url, zipPath, fetchImpl, progress);
          break;
        } catch (error) {
          primaryError = error;
          fs.rmSync(zipPath, { force: true });
          fs.rmSync(`${zipPath}.part`, { force: true });
          if (attempt < 2) emit({ status: "downloading", progress: 0, error: "", downloadAttempt: attempt + 1 });
        }
      }
      if (!downloaded) {
        emit({ status: "downloading", progress: 0, error: "", downloadMethod: "system" });
        try { downloaded = await fallbackDownloadImpl(state.asset.url, zipPath, progress); }
        catch (fallbackError) { throw new Error(`Electron 下载失败：${primaryError?.message || primaryError}；系统备用下载也失败：${fallbackError.message || fallbackError}`); }
      }
      if (state.asset.size && downloaded.bytes !== Number(state.asset.size)) throw new Error("更新包大小与 GitHub Release 记录不一致");
      fs.rmSync(extractedPath, { recursive: true, force: true });
      fs.mkdirSync(extractedPath, { recursive: true });
      emit({ status: "extracting", progress: 100, sha256: downloaded.sha256 });
      await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -LiteralPath $env:AI_TEAM_UPDATE_ZIP -DestinationPath $env:AI_TEAM_UPDATE_PACKAGE -Force"], { windowsHide: true, timeout: 5 * 60 * 1000, env: { ...process.env, AI_TEAM_UPDATE_ZIP: zipPath, AI_TEAM_UPDATE_PACKAGE: extractedPath } });
      const packageRoot = findPackagedRoot(extractedPath);
      if (!packageRoot) throw new Error("更新包校验失败：未找到桌面程序和 app.asar");
      return emit({ status: "ready", downloaded: true, readyToInstall: true, packageRoot, zipPath, progress: 100, error: "" });
    } catch (error) {
      emit({ status: "error", error: error.message || String(error), readyToInstall: false });
      throw error;
    }
  }
  function download() {
    if (activeDownload) return activeDownload;
    activeDownload = performDownload().finally(() => { activeDownload = null; });
    return activeDownload;
  }
  function installOnExit(processId = process.pid) {
    if (!state.readyToInstall || !state.packageRoot) throw new Error("当前没有等待安装的更新");
    if (!installPath || !executablePath) throw new Error("当前运行环境不支持覆盖安装");
    const executableName = path.basename(executablePath);
    const scriptPath = path.join(userDataPath, "updates", "install-update.ps1");
    createInstallScript(scriptPath);
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-ProcessId", String(processId), "-Source", state.packageRoot, "-Target", installPath, "-Executable", executableName], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    emit({ status: "installing", installStartedAt: new Date().toISOString() });
    return { started: true };
  }
  return { status, setSettings, check, download, installOnExit, onChange };
}

module.exports = { RELEASES_API, parseVersion, compareVersions, selectReleaseAsset, downloadFileWithPowerShell, createUpdateRuntime };
