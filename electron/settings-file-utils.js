const fs = require("fs");
const path = require("path");

function readJsonWithBackup(filePath, validate, fallback = null) {
  const candidates = [filePath, `${filePath}.bak`];
  let lastError = null;
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const value = JSON.parse(fs.readFileSync(candidate, "utf8"));
      if (typeof validate === "function" && !validate(value)) throw new Error("配置结构校验失败");
      if (candidate.endsWith(".bak")) atomicWriteJson(filePath, value, false);
      return value;
    } catch (error) { lastError = error; }
  }
  if (lastError) throw lastError;
  return fallback;
}

function atomicWriteJson(filePath, value, keepPrevious = true) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  const backup = `${filePath}.bak`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  if (keepPrevious && fs.existsSync(filePath)) fs.copyFileSync(filePath, backup);
  fs.renameSync(temporary, filePath);
  if (!fs.existsSync(backup)) fs.copyFileSync(filePath, backup);
}

function removeJsonWithBackup(filePath) {
  fs.rmSync(filePath, { force: true });
  fs.rmSync(`${filePath}.bak`, { force: true });
  fs.rmSync(`${filePath}.tmp`, { force: true });
}

module.exports = { readJsonWithBackup, atomicWriteJson, removeJsonWithBackup };
