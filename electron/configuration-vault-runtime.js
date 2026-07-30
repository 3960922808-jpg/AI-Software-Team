const fs = require("fs");
const path = require("path");
const { atomicWriteJson, removeJsonWithBackup } = require("./settings-file-utils");

const CONFIGURATION_FILES = ["model-settings.json", "model-pool.json", "image-model-settings.json", "video-model-settings.json", "voice-settings.json"];

function createConfigurationVaultRuntime({ userDataPath, appVersion = "" }) {
  if (!userDataPath) throw new Error("配置保险箱缺少 Windows 用户目录");

  function configurationPath(name) { return path.join(userDataPath, name); }

  function status() {
    const files = CONFIGURATION_FILES.map((name) => {
      const filePath = configurationPath(name);
      return { name, configured: fs.existsSync(filePath), backupReady: fs.existsSync(`${filePath}.bak`) };
    });
    return { rootPath: userDataPath, appVersion, files, configuredCount: files.filter((item) => item.configured).length, backupCount: files.filter((item) => item.backupReady).length, updateSafe: true };
  }

  function exportBundle(destinationPath) {
    const settings = {};
    for (const name of CONFIGURATION_FILES) {
      const filePath = configurationPath(name);
      settings[name] = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
    }
    const bundle = { format: "ai-software-team-encrypted-settings", version: 1, appVersion, exportedAt: new Date().toISOString(), machineBound: true, settings };
    atomicWriteJson(destinationPath, bundle, false);
    return { path: destinationPath, files: Object.values(settings).filter(Boolean).length, machineBound: true };
  }

  function importBundle(sourcePath) {
    const bundle = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    if (bundle?.format !== "ai-software-team-encrypted-settings" || bundle?.version !== 1 || typeof bundle.settings !== "object") throw new Error("配置备份文件格式无效");
    for (const name of CONFIGURATION_FILES) {
      const value = bundle.settings[name];
      const target = configurationPath(name);
      if (value === null || value === undefined) removeJsonWithBackup(target);
      else if (typeof value === "object" && Number(value.version) === 1) atomicWriteJson(target, value);
      else throw new Error(`备份中的 ${name} 格式无效`);
    }
    return { imported: true, files: CONFIGURATION_FILES.filter((name) => bundle.settings[name]).length, restartRequired: true, machineBound: true };
  }

  return { status, exportBundle, importBundle, configurationPath };
}

module.exports = { createConfigurationVaultRuntime, CONFIGURATION_FILES };
