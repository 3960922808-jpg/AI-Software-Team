const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");
const modelRuntime = require("./model-runtime");
const deliveryRuntime = require("./delivery-runtime");
const integrationRuntime = require("./integration-runtime");
const executionRuntime = require("./execution-runtime");
const { createModelSettingsStore } = require("./model-settings-store");
const { createModelPoolStore } = require("./model-pool-store");
const { createPluginRuntime } = require("./plugin-runtime");

let modelSettingsStore = null;
let modelPoolStore = null;
let pluginRuntime = null;

if (process.env.AI_TEAM_SCREENSHOT) app.disableHardwareAcceleration();

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const startupMinimumDuration = Math.max(1200, Number(process.env.AI_TEAM_STARTUP_MIN_MS) || 2200);

async function updateSplash(splashWindow, progress, message) {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  try { await splashWindow.webContents.executeJavaScript(`window.setStartupProgress?.(${Number(progress)}, ${JSON.stringify(message)})`); }
  catch { /* 启动页关闭时忽略迟到的进度更新。 */ }
}

async function createSplashWindow() {
  const splashWindow = new BrowserWindow({
    width: 960,
    height: 514,
    frame: false,
    resizable: false,
    movable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#f2f2f6",
    icon: path.join(__dirname, "..", "assets", "brand", "app-icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  await splashWindow.loadFile(path.join(__dirname, "..", "splash.html"));
  splashWindow.show();
  return splashWindow;
}

function initializeModelSettings() {
  const encryption = {
    encrypt: (value) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error("Windows 系统加密服务当前不可用，无法安全保存 API Key");
      return safeStorage.encryptString(value).toString("base64");
    },
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value, "base64")),
  };
  modelSettingsStore = createModelSettingsStore({
    filePath: path.join(app.getPath("userData"), "model-settings.json"),
    ...encryption,
  });
  modelPoolStore = createModelPoolStore({
    filePath: path.join(app.getPath("userData"), "model-pool.json"),
    ...encryption,
  });
  pluginRuntime = createPluginRuntime({
    directoryPath: path.join(app.getPath("userData"), "plugins"),
    statePath: path.join(app.getPath("userData"), "plugins-state.json"),
  });
  const saved = modelSettingsStore.load();
  if (saved) modelRuntime.configure(saved);
  else if (process.env.AI_TEAM_API_KEY && process.env.AI_TEAM_MODEL && process.env.AI_TEAM_BASE_URL) {
    modelRuntime.configure({
      provider: process.env.AI_TEAM_PROVIDER || "openai",
      baseUrl: process.env.AI_TEAM_BASE_URL,
      model: process.env.AI_TEAM_MODEL,
      apiKey: process.env.AI_TEAM_API_KEY,
      routingMode: process.env.AI_TEAM_ROUTING_MODE || "balanced",
    });
  }
  modelRuntime.configurePool(modelPoolStore.load());
}

const createWindow = (splashWindow = null, startupStartedAt = Date.now()) => {
  const window = new BrowserWindow({
    width: Number(process.env.AI_TEAM_WINDOW_WIDTH) || 1380,
    height: Number(process.env.AI_TEAM_WINDOW_HEIGHT) || 860,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "..", "assets", "brand", "app-icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  window.loadFile(path.join(__dirname, "..", "index.html"));
  window.once("ready-to-show", async () => {
    if (!splashWindow || splashWindow.isDestroyed()) { window.show(); return; }
    await updateSplash(splashWindow, 92, "正在准备工作台界面");
    await delay(Math.max(0, startupMinimumDuration - (Date.now() - startupStartedAt)));
    if (!splashWindow.isDestroyed()) {
      try { await splashWindow.webContents.executeJavaScript("window.finishStartup?.()"); } catch { /* 启动页可能已经关闭。 */ }
      await delay(620);
      if (!splashWindow.isDestroyed()) splashWindow.close();
    }
    window.show();
  });
  if (process.env.AI_TEAM_SCREENSHOT) {
    window.webContents.once("did-finish-load", async () => {
      await window.webContents.executeJavaScript(`(() => {
        const requestedView = ${JSON.stringify(process.env.AI_TEAM_SCREENSHOT_VIEW || "projects")};
        if (requestedView !== 'projects') {
          document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === requestedView));
          document.querySelectorAll('[data-view-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === requestedView));
          const panel = document.querySelector('[data-view-panel="' + requestedView + '"]');
          if (!panel?.classList.contains('active')) throw new Error('Requested view did not open');
          return;
        }
        if (${JSON.stringify(process.env.AI_TEAM_SCREENSHOT_CONTEXT_MENU || "1")} !== '0') {
          const pet = document.querySelector('.agent-pet');
          pet.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 520, clientY: 330 }));
          const menu = document.querySelector('#agent-context-menu');
          const bounds = menu.getBoundingClientRect();
          if (menu.hidden || getComputedStyle(menu).display === 'none' || bounds.width < 200) throw new Error('Agent context menu did not open');
          menu.style.outline = '3px solid #d34b4b';
        }
      })()`);
      await new Promise((resolve) => setTimeout(resolve, process.env.AI_TEAM_SCREENSHOT_VIEW ? 800 : 250));
      if (process.env.AI_TEAM_SCREENSHOT_VIEW && process.env.AI_TEAM_SCREENSHOT_VIEW !== "projects") {
        await window.webContents.executeJavaScript(`(() => {
          const requestedView = ${JSON.stringify(process.env.AI_TEAM_SCREENSHOT_VIEW)};
          document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === requestedView));
          document.querySelectorAll('[data-view-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === requestedView));
        })()`);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      const image = await window.webContents.capturePage();
      fs.writeFileSync(process.env.AI_TEAM_SCREENSHOT, image.toPNG());
      app.quit();
    });
  }
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });
  return window;
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    const startupStartedAt = Date.now();
    let splashWindow = null;
    if (!process.env.AI_TEAM_SCREENSHOT) {
      try { splashWindow = await createSplashWindow(); }
      catch (error) { console.error(`启动页加载失败：${error.message}`); }
    }
    await updateSplash(splashWindow, 24, "正在恢复模型与安全配置");
    try { initializeModelSettings(); }
    catch (error) { console.error(`恢复模型配置失败：${error.message}`); }
    await updateSplash(splashWindow, 46, "正在加载智能体与专属技能");
    if (process.env.AI_TEAM_SCREENSHOT_WORKSPACE) modelRuntime.setWorkspace(process.env.AI_TEAM_SCREENSHOT_WORKSPACE);
    ipcMain.handle("app:get-info", () => ({ version: app.getVersion(), platform: process.platform }));
    ipcMain.handle("model:configure", (_event, config) => {
      if (!modelSettingsStore) initializeModelSettings();
      const previous = modelSettingsStore.load();
      const merged = modelSettingsStore.merge(config);
      const result = modelRuntime.configure(merged);
      try { modelSettingsStore.persist(merged); }
      catch (error) {
        if (previous) modelRuntime.configure(previous); else modelRuntime.clear();
        throw error;
      }
      return { ...result, ...modelSettingsStore.status() };
    });
    ipcMain.handle("model:clear", () => {
      modelRuntime.clear();
      modelSettingsStore?.clear();
      return { persisted: false, apiKeyConfigured: false, ...modelRuntime.status() };
    });
    ipcMain.handle("model:status", () => ({ ...(modelSettingsStore?.status() || {}), ...modelRuntime.status() }));
    ipcMain.handle("model:test", () => modelRuntime.testConnection());
    ipcMain.handle("model-pool:get", () => modelPoolStore?.status() || { profiles: [], assignments: {} });
    ipcMain.handle("model-pool:save-profile", (_event, profile) => {
      if (!modelPoolStore) initializeModelSettings();
      modelPoolStore.saveProfile(profile);
      modelRuntime.configurePool(modelPoolStore.load());
      return modelPoolStore.status();
    });
    ipcMain.handle("model-pool:delete-profile", (_event, profileId) => {
      if (!modelPoolStore) initializeModelSettings();
      modelPoolStore.deleteProfile(profileId);
      modelRuntime.configurePool(modelPoolStore.load());
      return modelPoolStore.status();
    });
    ipcMain.handle("model-pool:assign", (_event, target, profileId) => {
      if (!modelPoolStore) initializeModelSettings();
      modelPoolStore.assign(target, profileId);
      modelRuntime.configurePool(modelPoolStore.load());
      return modelPoolStore.status();
    });
    ipcMain.handle("model-pool:test-profile", (_event, profileId) => modelRuntime.testProfile(profileId));
    ipcMain.handle("audit:export", async (_event, payload) => {
      const content = `${JSON.stringify(payload, null, 2)}\n`;
      if (Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) throw new Error("审计报告超过 5MB 限制");
      const date = new Date().toISOString().slice(0, 10);
      const result = await dialog.showSaveDialog({ title: "导出运行审计报告", defaultPath: `AI-Team-运行审计-${date}.json`, filters: [{ name: "JSON 审计报告", extensions: ["json"] }] });
      if (result.canceled || !result.filePath) return { canceled: true };
      fs.writeFileSync(result.filePath, content, "utf8");
      return { canceled: false, path: result.filePath, bytes: Buffer.byteLength(content, "utf8") };
    });
    ipcMain.handle("agent:execute", (_event, payload) => modelRuntime.executeTask({ ...payload, plugins: pluginRuntime?.context() || [] }));
    ipcMain.handle("agent:chat", (_event, payload) => modelRuntime.chat({ ...payload, plugins: pluginRuntime?.context() || [] }));
    ipcMain.handle("plugins:get", () => pluginRuntime?.status() || []);
    ipcMain.handle("plugins:set-enabled", (_event, pluginId, enabled) => pluginRuntime.setEnabled(pluginId, enabled));
    ipcMain.handle("plugins:open-directory", async () => {
      const error = await shell.openPath(pluginRuntime.directoryPath);
      if (error) throw new Error(error);
      return { opened: true, path: pluginRuntime.directoryPath };
    });
    ipcMain.handle("sandbox:status", () => executionRuntime.policyStatus());
    ipcMain.handle("sandbox:verify", (_event, taskId) => executionRuntime.runChecks(modelRuntime.getWorkspace().path, taskId));
    ipcMain.handle("sandbox:git-status", (_event, taskId) => executionRuntime.gitStatus(modelRuntime.getWorkspace().path, taskId));
    ipcMain.handle("sandbox:git-snapshot", (_event, taskId, message) => executionRuntime.gitSnapshot(modelRuntime.getWorkspace().path, taskId, message));
    ipcMain.handle("sandbox:open", async (_event, taskId) => {
      const target = executionRuntime.taskRootFor(modelRuntime.getWorkspace().path, taskId);
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("workspace:get", () => modelRuntime.getWorkspace());
    ipcMain.handle("workspace:set", (_event, selectedPath) => modelRuntime.setWorkspace(selectedPath));
    ipcMain.handle("workspace:choose", async () => {
      const result = await dialog.showOpenDialog({ title: "选择 Agent 产物工作目录", properties: ["openDirectory", "createDirectory"] });
      return result.canceled ? modelRuntime.getWorkspace() : modelRuntime.setWorkspace(result.filePaths[0]);
    });
    ipcMain.handle("delivery:inspect", () => deliveryRuntime.inspect(modelRuntime.getWorkspace().path));
    ipcMain.handle("delivery:create", (_event, payload) => deliveryRuntime.createRelease(modelRuntime.getWorkspace().path, payload));
    ipcMain.handle("delivery:open", async (_event, candidate) => {
      const target = deliveryRuntime.resolveOutputPath(modelRuntime.getWorkspace().path, candidate);
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("integration:configure", (_event, payload) => integrationRuntime.configure(payload));
    ipcMain.handle("integration:clear", () => integrationRuntime.clear());
    ipcMain.handle("integration:status", () => integrationRuntime.status());
    ipcMain.handle("integration:fetch-document", (_event, url) => integrationRuntime.fetchDocument(url));
    ipcMain.handle("integration:inspect-repository", (_event, repository) => integrationRuntime.inspectRepository(repository));
    await updateSplash(splashWindow, 72, "正在连接任务、记忆与审计中心");
    createWindow(splashWindow, startupStartedAt);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
