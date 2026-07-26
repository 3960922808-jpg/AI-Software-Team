const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const modelRuntime = require("./model-runtime");

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    backgroundColor: "#ffffff",
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
  window.once("ready-to-show", () => window.show());
  if (process.env.AI_TEAM_SCREENSHOT) {
    window.webContents.once("did-finish-load", async () => {
      await window.webContents.executeJavaScript(`(() => {
        const requestedView = ${JSON.stringify(process.env.AI_TEAM_SCREENSHOT_VIEW || "projects")};
        if (requestedView !== 'projects') {
          document.querySelector('[data-open-view="' + requestedView + '"]')?.click();
          document.querySelector('[data-view="' + requestedView + '"]')?.click();
          const panel = document.querySelector('[data-view-panel="' + requestedView + '"]');
          if (!panel?.classList.contains('active')) throw new Error('Requested view did not open');
          return;
        }
        const pet = document.querySelector('.agent-pet');
        pet.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 520, clientY: 330 }));
        const menu = document.querySelector('#agent-context-menu');
        const bounds = menu.getBoundingClientRect();
        if (menu.hidden || getComputedStyle(menu).display === 'none' || bounds.width < 200) throw new Error('Agent context menu did not open');
        menu.style.outline = '3px solid #d34b4b';
      })()`);
      await new Promise((resolve) => setTimeout(resolve, 250));
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
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    ipcMain.handle("app:get-info", () => ({ version: app.getVersion(), platform: process.platform }));
    ipcMain.handle("model:configure", (_event, config) => modelRuntime.configure(config));
    ipcMain.handle("model:clear", () => modelRuntime.clear());
    ipcMain.handle("model:status", () => modelRuntime.status());
    ipcMain.handle("model:test", () => modelRuntime.testConnection());
    ipcMain.handle("agent:execute", (_event, payload) => modelRuntime.executeTask(payload));
    ipcMain.handle("agent:chat", (_event, payload) => modelRuntime.chat(payload));
    ipcMain.handle("workspace:get", () => modelRuntime.getWorkspace());
    ipcMain.handle("workspace:set", (_event, selectedPath) => modelRuntime.setWorkspace(selectedPath));
    ipcMain.handle("workspace:choose", async () => {
      const result = await dialog.showOpenDialog({ title: "选择 Agent 产物工作目录", properties: ["openDirectory", "createDirectory"] });
      return result.canceled ? modelRuntime.getWorkspace() : modelRuntime.setWorkspace(result.filePaths[0]);
    });
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
