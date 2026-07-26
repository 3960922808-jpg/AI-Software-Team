const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", Object.freeze({
  isElectron: true,
  getAppInfo: () => ipcRenderer.invoke("app:get-info")
}));
