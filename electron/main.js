const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage, clipboard, desktopCapturer, net } = require("electron");
const fs = require("fs");
const path = require("path");
const modelRuntime = require("./model-runtime");
const deliveryRuntime = require("./delivery-runtime");
const integrationRuntime = require("./integration-runtime");
const executionRuntime = require("./execution-runtime");
const { createModelSettingsStore } = require("./model-settings-store");
const { createModelPoolStore } = require("./model-pool-store");
const { createIntegrationSettingsStore } = require("./integration-settings-store");
const { createWorkspaceSettingsStore } = require("./workspace-settings-store");
const { createPluginRuntime } = require("./plugin-runtime");
const { createMemoryGraphRuntime } = require("./memory-graph-runtime");
const { createUpdateRuntime } = require("./update-runtime");
const { createVoiceSettingsStore } = require("./voice-settings-store");
const { createVoiceRuntime } = require("./voice-runtime");
const { createKnowledgeLibraryRuntime } = require("./knowledge-library-runtime");
const { createConfigurationVaultRuntime } = require("./configuration-vault-runtime");
const { createComputerAccessRuntime } = require("./computer-access-runtime");
const { createMediaGenerationRuntime } = require("./media-generation-runtime");

let modelSettingsStore = null;
let modelPoolStore = null;
let integrationSettingsStore = null;
let workspaceSettingsStore = null;
let mediaModelStores = null;
let pluginRuntime = null;
let memoryGraphRuntime = null;
let updateRuntime = null;
let voiceSettingsStore = null;
let voiceRuntime = null;
let knowledgeLibraryRuntime = null;
let configurationVaultRuntime = null;
let computerAccessRuntime = null;
let mediaGenerationRuntime = null;
const computerAccessPermissions = new Map();
let updateInstallStarted = false;

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
  integrationSettingsStore = createIntegrationSettingsStore({
    filePath: path.join(app.getPath("userData"), "integration-settings.json"),
    ...encryption,
  });
  mediaModelStores = {
    image: createModelSettingsStore({ filePath: path.join(app.getPath("userData"), "image-model-settings.json"), ...encryption }),
    video: createModelSettingsStore({ filePath: path.join(app.getPath("userData"), "video-model-settings.json"), ...encryption }),
  };
  voiceSettingsStore = createVoiceSettingsStore({
    filePath: path.join(app.getPath("userData"), "voice-settings.json"),
    ...encryption,
  });
  voiceRuntime = createVoiceRuntime({ getConfiguration: () => voiceSettingsStore.load() });
  workspaceSettingsStore = createWorkspaceSettingsStore({ filePath: path.join(app.getPath("userData"), "workspace-settings.json") });
  pluginRuntime = createPluginRuntime({
    directoryPath: path.join(app.getPath("userData"), "plugins"),
    statePath: path.join(app.getPath("userData"), "plugins-state.json"),
  });
  memoryGraphRuntime = createMemoryGraphRuntime({ statePath: path.join(app.getPath("userData"), "memory-graph.json") });
  knowledgeLibraryRuntime = createKnowledgeLibraryRuntime({ directoryPath: path.join(app.getPath("userData"), "knowledge-library") });
  configurationVaultRuntime = createConfigurationVaultRuntime({ userDataPath: app.getPath("userData"), appVersion: app.getVersion() });
  mediaGenerationRuntime = createMediaGenerationRuntime({
    getConfiguration: (kind) => mediaModelStores?.[kind]?.load() || null,
    getWorkspace: () => modelRuntime.getWorkspace().path,
  });
  computerAccessRuntime = createComputerAccessRuntime({
    shell, clipboard, integrationRuntime, desktopCapturer,
    captureDirectory: path.join(app.getPath("userData"), "computer-access", "screenshots"),
  });
  updateRuntime = createUpdateRuntime({
    currentVersion: app.getVersion(),
    userDataPath: app.getPath("userData"),
    installPath: path.dirname(process.execPath),
    executablePath: process.execPath,
    fetchImpl: (url, options) => net.fetch(url, options),
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
  const integrations = integrationSettingsStore.load();
  if (integrations.githubToken) integrationRuntime.configure(integrations);
  const savedWorkspace = workspaceSettingsStore.load();
  if (savedWorkspace.path) modelRuntime.setWorkspace(savedWorkspace.path);
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
      spellcheck: false,
      backgroundThrottling: !process.env.AI_TEAM_SMOKE_TEST
    }
  });

  window.loadFile(path.join(__dirname, "..", "index.html"));
  computerAccessPermissions.set(window.webContents.id, false);
  const webContentsId = window.webContents.id;
  window.webContents.once("destroyed", () => computerAccessPermissions.delete(webContentsId));
  window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => callback(permission === "media"));
  window.once("ready-to-show", async () => {
    if (!splashWindow || splashWindow.isDestroyed()) { if (!process.env.AI_TEAM_SMOKE_TEST) window.show(); return; }
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
      if (process.env.AI_TEAM_SCREENSHOT_TARGET) {
        await window.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(process.env.AI_TEAM_SCREENSHOT_TARGET)})?.scrollIntoView({ block: "start" })`);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
      const image = await window.webContents.capturePage();
      fs.writeFileSync(process.env.AI_TEAM_SCREENSHOT, image.toPNG());
      app.quit();
    });
  }
  if (process.env.AI_TEAM_SMOKE_TEST) {
    window.webContents.once("did-finish-load", async () => {
      try {
        const result = await window.webContents.executeJavaScript(`(async () => {
          if (!window.WorkflowState) throw new Error("工作流状态引擎未加载");
          if (document.querySelectorAll(".workflow-node").length !== 22) throw new Error("工作流节点数量错误");
          if (document.querySelectorAll('.workflow-link').length !== 21) throw new Error("工作流连线数量错误");
          const initial = document.body.dataset.interfaceMode;
          await switchInterfaceMode("workflow");
          const managerBounds = document.querySelector('[data-workflow-node="commander"]').getBoundingClientRect();
          const productBounds = document.querySelector('[data-workflow-node="product"]').getBoundingClientRect();
          const frontendBounds = document.querySelector('[data-workflow-node="frontend"]').getBoundingClientRect();
          if (!(productBounds.right < managerBounds.left && managerBounds.right < frontendBounds.left)) throw new Error("经理没有位于十个 Agent 中央");
          const nodePositions = [...document.querySelectorAll('.workflow-node')].map((node) => { const bounds = node.getBoundingClientRect(); return Math.round(bounds.left) + ':' + Math.round(bounds.top); });
          if (new Set(nodePositions).size !== 22) throw new Error("工作流节点发生重叠");
          const skillSwitch = document.querySelector('.skill-toggle');
          const switchStyle = getComputedStyle(skillSwitch);
          const switchWidth = parseFloat(switchStyle.width);
          const switchHeight = parseFloat(switchStyle.height);
          if (switchWidth < 40 || switchHeight > 28 || switchWidth <= switchHeight) throw new Error("技能开关尺寸错误");
          const skillName = skillSwitch.dataset.skill;
          const originalSkillState = skillSwitch.checked;
          skillSwitch.click();
          const changedSkillSwitch = document.querySelector('[data-skill="' + CSS.escape(skillName) + '"]');
          if (!changedSkillSwitch || changedSkillSwitch.checked === originalSkillState) throw new Error("技能开关点击后状态未改变");
          const savedSkills = JSON.parse(localStorage.getItem("ai-software-team.enabled-skills") || "[]");
          if (savedSkills.includes(skillName) !== changedSkillSwitch.checked) throw new Error("技能开关状态未持久化");
          changedSkillSwitch.click();
          await switchInterfaceMode("studio");
          if (document.body.dataset.interfaceMode !== "studio") throw new Error("返回工作室失败");
          if (!document.querySelector("#mode-transition").hidden) throw new Error("切换动画没有结束");
          if (initial === "workflow") await switchInterfaceMode("workflow");
          return { nodes: document.querySelectorAll(".workflow-node").length, links: document.querySelectorAll('.workflow-link').length, skillSwitch: [Math.round(switchWidth), Math.round(switchHeight)], skillToggleWorks: true, managerCentered: true, initial, restored: document.body.dataset.interfaceMode };
        })()`);
        console.log(`桌面模式切换测试通过：${JSON.stringify(result)}`);
        app.exit(0);
      } catch (error) {
        console.error(`桌面模式切换测试失败：${error.stack || error.message}`);
        app.exit(1);
      }
    });
  }
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.once("destroyed", () => computerAccessPermissions.delete(window.webContents.id));
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
    if (!process.env.AI_TEAM_SCREENSHOT && !process.env.AI_TEAM_SMOKE_TEST) {
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
    ipcMain.handle("model:test-config", async (_event, config) => {
      if (!modelSettingsStore) initializeModelSettings();
      const previous = modelSettingsStore.load();
      const candidate = modelSettingsStore.merge(config);
      modelRuntime.configure(candidate);
      try { return await modelRuntime.testConnection(); }
      finally { if (previous) modelRuntime.configure(previous); else modelRuntime.clear(); }
    });
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
    ipcMain.handle("media-model:get", () => {
      if (!mediaModelStores) initializeModelSettings();
      return { image: mediaModelStores.image.status(), video: mediaModelStores.video.status() };
    });
    ipcMain.handle("media-model:configure", (_event, kind, payload) => {
      if (!mediaModelStores) initializeModelSettings();
      if (!mediaModelStores[kind]) throw new Error("媒体模型类型无效");
      mediaModelStores[kind].persist(payload);
      return { image: mediaModelStores.image.status(), video: mediaModelStores.video.status() };
    });
    ipcMain.handle("media-model:clear", (_event, kind) => {
      if (!mediaModelStores) initializeModelSettings();
      if (!mediaModelStores[kind]) throw new Error("媒体模型类型无效");
      mediaModelStores[kind].clear();
      return { image: mediaModelStores.image.status(), video: mediaModelStores.video.status() };
    });
    ipcMain.handle("audit:export", async (_event, payload) => {
      const content = `${JSON.stringify(payload, null, 2)}\n`;
      if (Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) throw new Error("审计报告超过 5MB 限制");
      const date = new Date().toISOString().slice(0, 10);
      const result = await dialog.showSaveDialog({ title: "导出运行审计报告", defaultPath: `AI-Team-运行审计-${date}.json`, filters: [{ name: "JSON 审计报告", extensions: ["json"] }] });
      if (result.canceled || !result.filePath) return { canceled: true };
      fs.writeFileSync(result.filePath, content, "utf8");
      return { canceled: false, path: result.filePath, bytes: Buffer.byteLength(content, "utf8") };
    });
    ipcMain.handle("agent:execute", (_event, payload) => {
      const query = `${payload?.title || ""} ${payload?.description || ""}`.trim();
      return modelRuntime.executeTask({ ...payload, plugins: pluginRuntime?.context() || [], memoryGraph: memoryGraphRuntime?.context(query) || null });
    });
    ipcMain.handle("agent:chat", async (_event, payload) => {
      const query = payload?.messages?.at?.(-1)?.content || "";
      const computerAccess = computerAccessPermissions.get(_event.sender.id) === true;
      let computerResults = [];
      let result = null;
      const executed = new Set();
      for (let round = 0; round < 3; round += 1) {
        result = await modelRuntime.chat({ ...payload, computerAccess, computerResults, plugins: pluginRuntime?.context() || [], memoryGraph: memoryGraphRuntime?.context(query) || null });
        const actions = computerAccess ? (result.computerActions || []).filter((action) => { const key = JSON.stringify(action); if (executed.has(key)) return false; executed.add(key); return true; }) : [];
        if (!actions.length) break;
        const roundResults = await computerAccessRuntime.execute(actions);
        computerResults = [...computerResults, ...roundResults].slice(-20);
      }
      return { ...result, computerAccess, computerResults };
    });
    ipcMain.handle("computer-access:status", (event) => ({ enabled: computerAccessPermissions.get(event.sender.id) === true, sessionOnly: true }));
    ipcMain.handle("computer-access:set", (event, enabled) => {
      computerAccessPermissions.set(event.sender.id, enabled === true);
      return { enabled: computerAccessPermissions.get(event.sender.id), sessionOnly: true };
    });
    ipcMain.handle("plugins:get", () => pluginRuntime?.status() || []);
    ipcMain.handle("plugins:set-enabled", (_event, pluginId, enabled) => pluginRuntime.setEnabled(pluginId, enabled));
    ipcMain.handle("plugins:import", async () => {
      const result = await dialog.showOpenDialog({ title: "上传自定义 Skill", properties: ["openFile"], filters: [{ name: "Skill 文件", extensions: ["json", "md"] }] });
      if (result.canceled || !result.filePaths[0]) return { canceled: true, plugins: pluginRuntime.status() };
      return { canceled: false, ...pluginRuntime.importSkillFile(result.filePaths[0]) };
    });
    ipcMain.handle("plugins:import-directory", async () => {
      const result = await dialog.showOpenDialog({ title: "导入包含 SKILL.md 的文件夹", properties: ["openDirectory"] });
      if (result.canceled || !result.filePaths[0]) return { canceled: true, plugins: pluginRuntime.status() };
      return { canceled: false, ...pluginRuntime.importSkillDirectory(result.filePaths[0]) };
    });
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
    ipcMain.handle("workspace:set", (_event, selectedPath) => {
      if (!selectedPath) { workspaceSettingsStore.clear(); return modelRuntime.setWorkspace(null); }
      const saved = workspaceSettingsStore.persist(selectedPath);
      return modelRuntime.setWorkspace(saved.path);
    });
    ipcMain.handle("memory-graph:get", () => memoryGraphRuntime.get());
    ipcMain.handle("memory-graph:search", (_event, query, limit) => memoryGraphRuntime.search(query, limit));
    ipcMain.handle("memory-graph:choose-folder", async (_event) => {
      const result = await dialog.showOpenDialog({ title: "选择长期记忆文件夹", properties: ["openDirectory"] });
      if (result.canceled || !result.filePaths[0]) return { canceled: true, graph: memoryGraphRuntime.get() };
      const sender = _event.sender;
      return { canceled: false, graph: await memoryGraphRuntime.reindex(result.filePaths[0], (progress) => { if (!sender.isDestroyed()) sender.send("memory-graph:progress", progress); }) };
    });
    ipcMain.handle("memory-graph:reindex", async (event) => memoryGraphRuntime.reindex(undefined, (progress) => { if (!event.sender.isDestroyed()) event.sender.send("memory-graph:progress", progress); }));
    ipcMain.handle("memory-graph:clear", () => memoryGraphRuntime.clear());
    ipcMain.handle("memory-graph:open-folder", async () => {
      const target = memoryGraphRuntime.get().rootPath;
      if (!target) throw new Error("尚未选择长期记忆文件夹");
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("knowledge:get", () => knowledgeLibraryRuntime.list());
    ipcMain.handle("knowledge:import", async () => {
      const result = await dialog.showOpenDialog({
        title: "导入知识文档或附件",
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "文档与附件", extensions: ["txt", "md", "docx", "doc", "pdf", "pptx", "ppt", "rtf", "csv", "json", "html", "epub"] }, { name: "所有文件", extensions: ["*"] }]
      });
      if (result.canceled || !result.filePaths.length) return { canceled: true, documents: knowledgeLibraryRuntime.list() };
      return { canceled: false, ...(await knowledgeLibraryRuntime.importFiles(result.filePaths)) };
    });
    ipcMain.handle("knowledge:migrate", (_event, documents) => knowledgeLibraryRuntime.migrate(documents));
    ipcMain.handle("knowledge:delete", (_event, id) => knowledgeLibraryRuntime.remove(String(id || "")));
    ipcMain.handle("knowledge:open", async (_event, id) => {
      const target = knowledgeLibraryRuntime.attachmentPath(String(id || ""));
      const error = await shell.openPath(target); if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("workspace:choose", async () => {
      const result = await dialog.showOpenDialog({ title: "选择 Agent 产物工作目录", properties: ["openDirectory", "createDirectory"] });
      if (result.canceled) return modelRuntime.getWorkspace();
      const saved = workspaceSettingsStore.persist(result.filePaths[0]);
      return modelRuntime.setWorkspace(saved.path);
    });
    ipcMain.handle("voice:get", () => voiceSettingsStore.status());
    ipcMain.handle("voice:configure", (_event, payload) => voiceSettingsStore.persist(payload));
    ipcMain.handle("voice:clear", () => { voiceSettingsStore.clear(); return voiceSettingsStore.status(); });
    ipcMain.handle("voice:test", () => voiceRuntime.test());
    ipcMain.handle("voice:transcribe", (_event, payload) => voiceRuntime.transcribe(payload));
    ipcMain.handle("voice:synthesize", async (_event, payload) => {
      const result = await voiceRuntime.synthesize(payload);
      return { ...result, audio: new Uint8Array(result.audio) };
    });
    ipcMain.handle("media:execute-workflow", (_event, kind, payload) => mediaGenerationRuntime.execute(kind, payload));
    ipcMain.handle("media:open-output", async (_event, filePath) => {
      const workspace = modelRuntime.getWorkspace().path;
      if (!workspace) throw new Error("尚未选择 Agent 产物目录");
      const target = path.resolve(String(filePath || ""));
      if (target !== workspace && !target.startsWith(`${path.resolve(workspace)}${path.sep}`)) throw new Error("媒体产物路径越界");
      const error = await shell.openPath(target); if (error) throw new Error(error);
      return { opened: true };
    });
    ipcMain.handle("config-vault:status", () => configurationVaultRuntime.status());
    ipcMain.handle("config-vault:open", async () => {
      const target = app.getPath("userData"); const error = await shell.openPath(target); if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("config-vault:export", async () => {
      const result = await dialog.showSaveDialog({ title: "导出本机加密模型配置", defaultPath: `AI-Team-model-settings-${new Date().toISOString().slice(0, 10)}.aiteam-config`, filters: [{ name: "AI Team 加密配置", extensions: ["aiteam-config"] }] });
      if (result.canceled || !result.filePath) return { canceled: true };
      return { canceled: false, ...configurationVaultRuntime.exportBundle(result.filePath) };
    });
    ipcMain.handle("config-vault:import", async () => {
      const result = await dialog.showOpenDialog({ title: "导入本机加密模型配置", properties: ["openFile"], filters: [{ name: "AI Team 加密配置", extensions: ["aiteam-config"] }] });
      if (result.canceled || !result.filePaths[0]) return { canceled: true };
      return { canceled: false, ...configurationVaultRuntime.importBundle(result.filePaths[0]) };
    });
    ipcMain.handle("app:relaunch", () => { app.relaunch(); app.exit(0); });
    ipcMain.handle("delivery:inspect", () => deliveryRuntime.inspect(modelRuntime.getWorkspace().path));
    ipcMain.handle("delivery:create", (_event, payload) => deliveryRuntime.createRelease(modelRuntime.getWorkspace().path, payload));
    ipcMain.handle("delivery:open", async (_event, candidate) => {
      const target = deliveryRuntime.resolveOutputPath(modelRuntime.getWorkspace().path, candidate);
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return { opened: true, path: target };
    });
    ipcMain.handle("integration:configure", (_event, payload) => {
      integrationSettingsStore.persist(payload);
      integrationRuntime.configure(integrationSettingsStore.load());
      return { ...integrationRuntime.status(), ...integrationSettingsStore.status() };
    });
    ipcMain.handle("integration:clear", () => {
      integrationSettingsStore.clear();
      integrationRuntime.clear();
      return { ...integrationRuntime.status(), ...integrationSettingsStore.status() };
    });
    ipcMain.handle("integration:status", () => ({ ...integrationRuntime.status(), ...integrationSettingsStore.status() }));
    ipcMain.handle("integration:test", () => integrationRuntime.testConnection());
    ipcMain.handle("integration:fetch-document", (_event, url) => integrationRuntime.fetchDocument(url));
    ipcMain.handle("integration:inspect-repository", (_event, repository) => integrationRuntime.inspectRepository(repository));
    ipcMain.handle("integration:open-external", async (_event, url) => {
      const validated = await integrationRuntime.validatePublicUrl(url);
      await shell.openExternal(validated.toString());
      return { opened: true };
    });
    ipcMain.handle("update:status", () => updateRuntime.status());
    ipcMain.handle("update:settings", (_event, settings) => updateRuntime.setSettings(settings));
    ipcMain.handle("update:check", () => updateRuntime.check());
    ipcMain.handle("update:download", () => updateRuntime.download());
    ipcMain.handle("update:restart", () => {
      if (!app.isPackaged) throw new Error("开发环境不能执行覆盖更新，请使用打包版本测试");
      updateRuntime.installOnExit(process.pid);
      updateInstallStarted = true;
      setImmediate(() => app.quit());
      return { restarting: true };
    });
    updateRuntime.onChange((state) => {
      for (const targetWindow of BrowserWindow.getAllWindows()) if (!targetWindow.isDestroyed()) targetWindow.webContents.send("update:state", state);
    });
    await updateSplash(splashWindow, 72, "正在连接任务、记忆与审计中心");
    createWindow(splashWindow, startupStartedAt);
    if (!process.env.AI_TEAM_SCREENSHOT && !process.env.AI_TEAM_SMOKE_TEST && updateRuntime.status().settings.autoCheck) {
      setTimeout(async () => {
        try {
          const result = await updateRuntime.check();
          if (result.available && result.settings.autoDownload) await updateRuntime.download();
        } catch (error) { console.error(`自动更新检查失败：${error.message}`); }
      }, 12000).unref();
      setInterval(async () => {
        try {
          const result = await updateRuntime.check();
          if (result.available && result.settings.autoDownload) await updateRuntime.download();
        } catch (error) { console.error(`定时更新检查失败：${error.message}`); }
      }, 6 * 60 * 60 * 1000).unref();
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (updateInstallStarted || !app.isPackaged || !updateRuntime) return;
  const state = updateRuntime.status();
  if (state.readyToInstall && state.settings.installOnRestart) {
    try { updateRuntime.installOnExit(process.pid); updateInstallStarted = true; }
    catch (error) { console.error(`安排更新安装失败：${error.message}`); }
  }
});
