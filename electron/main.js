const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

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
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
