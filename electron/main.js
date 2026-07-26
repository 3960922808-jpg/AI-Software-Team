const { app, BrowserWindow, ipcMain, shell } = require("electron");
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
    backgroundColor: "#f4f7f8",
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
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
