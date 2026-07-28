const fs = require("fs");
const path = require("path");

function createWorkspaceSettingsStore({ filePath }) {
  if (!filePath) throw new Error("产物目录存储初始化参数不完整");

  function load() {
    if (!fs.existsSync(filePath)) return { path: null };
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const selectedPath = String(record?.path || "").trim();
    if (record?.version !== 1 || !selectedPath || !fs.existsSync(selectedPath) || !fs.statSync(selectedPath).isDirectory()) return { path: null };
    return { path: path.resolve(selectedPath), updatedAt: record.updatedAt || null };
  }

  function persist(selectedPath) {
    const resolved = path.resolve(String(selectedPath || ""));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error("所选产物目录不存在");
    const record = { version: 1, path: resolved, updatedAt: new Date().toISOString() };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    return { path: resolved, updatedAt: record.updatedAt };
  }

  function clear() { fs.rmSync(filePath, { force: true }); }
  return { load, persist, clear };
}

module.exports = { createWorkspaceSettingsStore };
