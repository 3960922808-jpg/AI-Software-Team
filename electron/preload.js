const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", Object.freeze({
  isElectron: true,
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  configureModel: (config) => ipcRenderer.invoke("model:configure", config),
  clearModel: () => ipcRenderer.invoke("model:clear"),
  getModelStatus: () => ipcRenderer.invoke("model:status"),
  testModel: () => ipcRenderer.invoke("model:test"),
  executeAgentTask: (payload) => ipcRenderer.invoke("agent:execute", payload),
  chat: (payload) => ipcRenderer.invoke("agent:chat", payload),
  getWorkspace: () => ipcRenderer.invoke("workspace:get"),
  setWorkspace: (selectedPath) => ipcRenderer.invoke("workspace:set", selectedPath),
  chooseWorkspace: () => ipcRenderer.invoke("workspace:choose")
}));
