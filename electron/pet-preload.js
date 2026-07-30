const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petDesktop", Object.freeze({
  submitTask: (content) => ipcRenderer.invoke("pet:submit", content),
  openMain: () => ipcRenderer.invoke("pet:open-main"),
  quit: () => ipcRenderer.invoke("pet:quit"),
  onResponse: (listener) => { const handler = (_event, payload) => listener(payload); ipcRenderer.on("pet:response", handler); return () => ipcRenderer.removeListener("pet:response", handler); },
  onState: (listener) => { const handler = (_event, payload) => listener(payload); ipcRenderer.on("pet:state", handler); return () => ipcRenderer.removeListener("pet:state", handler); },
  onLocale: (listener) => { const handler = (_event, locale) => listener(locale); ipcRenderer.on("pet:locale", handler); return () => ipcRenderer.removeListener("pet:locale", handler); }
}));
