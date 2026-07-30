const fs = require("fs");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");
const { parseDocumentFile } = require("./document-import-runtime");

const execFileAsync = promisify(execFile);
const MAX_ACTIONS = 8;
const applicationAliases = {
  "记事本": "notepad.exe", notepad: "notepad.exe",
  "计算器": "calc.exe", calculator: "calc.exe", calc: "calc.exe",
  "画图": "mspaint.exe", paint: "mspaint.exe",
  "文件资源管理器": "explorer.exe", explorer: "explorer.exe",
};

function truncate(value, limit = 24000) { return String(value || "").slice(0, limit); }

async function runPowerShell(script, args = [], timeout = 30000) {
  const { stdout, stderr } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, ...args.map(String)], { windowsHide: true, timeout, maxBuffer: 4 * 1024 * 1024 });
  return truncate(stdout || stderr || "完成");
}

function normalizeHotkey(keys) {
  const list = Array.isArray(keys) ? keys.map((key) => String(key).toLowerCase()) : String(keys || "").toLowerCase().split("+");
  const modifiers = `${list.includes("ctrl") || list.includes("control") ? "^" : ""}${list.includes("alt") ? "%" : ""}${list.includes("shift") ? "+" : ""}`;
  const key = list.find((item) => !["ctrl", "control", "alt", "shift"].includes(item));
  const safeKeys = { enter: "{ENTER}", escape: "{ESC}", esc: "{ESC}", tab: "{TAB}", backspace: "{BACKSPACE}", delete: "{DELETE}", up: "{UP}", down: "{DOWN}", left: "{LEFT}", right: "{RIGHT}", home: "{HOME}", end: "{END}", f5: "{F5}" };
  if (!key) throw new Error("快捷键缺少主按键");
  if (safeKeys[key]) return `${modifiers}${safeKeys[key]}`;
  if (!/^[a-z0-9]$/.test(key)) throw new Error("快捷键不在允许范围内");
  return `${modifiers}${key}`;
}

function createComputerAccessRuntime({ shell, clipboard, integrationRuntime, desktopCapturer, captureDirectory }) {
  if (!shell || !clipboard || !integrationRuntime) throw new Error("完全访问运行时初始化参数不完整");

  async function executeAction(action) {
    const type = String(action?.type || "").trim();
    if (type === "open_url") {
      const url = await integrationRuntime.validatePublicUrl(action.url);
      await shell.openExternal(url.toString());
      return { type, ok: true, summary: `已打开网页 ${url}` };
    }
    if (type === "read_webpage") {
      const document = await integrationRuntime.fetchDocument(action.url);
      return { type, ok: true, summary: `已读取网页 ${document.title}`, data: { title: document.title, url: document.url, content: truncate(document.content) } };
    }
    if (type === "open_path") {
      const target = path.resolve(String(action.path || ""));
      if (!fs.existsSync(target)) throw new Error("要打开的路径不存在");
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      return { type, ok: true, summary: `已打开 ${target}` };
    }
    if (type === "open_application") {
      const requested = String(action.target || "").trim();
      const candidate = applicationAliases[requested.toLowerCase()] || applicationAliases[requested] || requested;
      if (!candidate) throw new Error("应用名称不能为空");
      if (path.isAbsolute(candidate)) {
        if (!fs.existsSync(candidate)) throw new Error("应用程序不存在");
        const child = spawn(candidate, [], { detached: true, stdio: "ignore", windowsHide: false }); child.unref();
      } else {
        if (!/^[a-zA-Z0-9 ._-]{1,120}\.exe$/i.test(candidate)) throw new Error("只允许程序名称或完整路径");
        const child = spawn(candidate, [], { detached: true, stdio: "ignore", windowsHide: false }); child.unref();
      }
      return { type, ok: true, summary: `已启动 ${requested}` };
    }
    if (type === "read_file") {
      const parsed = await parseDocumentFile(action.path);
      return { type, ok: true, summary: `已读取 ${parsed.title}`, data: { title: parsed.title, type: parsed.extension, content: truncate(parsed.text), warning: parsed.warning } };
    }
    if (type === "list_directory") {
      const target = path.resolve(String(action.path || ""));
      const stat = await fs.promises.stat(target);
      if (!stat.isDirectory()) throw new Error("目标不是文件夹");
      const entries = (await fs.promises.readdir(target, { withFileTypes: true })).slice(0, 300).map((entry) => ({ name: entry.name, type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other" }));
      return { type, ok: true, summary: `已读取文件夹 ${target}`, data: { path: target, entries } };
    }
    if (type === "inspect_windows") {
      const output = await runPowerShell("Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object ProcessName,Id,MainWindowTitle | ConvertTo-Json -Compress");
      return { type, ok: true, summary: "已读取当前可见窗口", data: truncate(output) };
    }
    if (type === "read_clipboard") return { type, ok: true, summary: "已读取剪贴板", data: truncate(clipboard.readText(), 12000) };
    if (type === "set_clipboard") {
      clipboard.writeText(truncate(action.text, 200000));
      return { type, ok: true, summary: "已写入剪贴板" };
    }
    if (type === "type_text") {
      clipboard.writeText(truncate(action.text, 200000));
      await runPowerShell("Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Milliseconds 150; [System.Windows.Forms.SendKeys]::SendWait('^v')");
      return { type, ok: true, summary: "已向当前活动窗口输入文字" };
    }
    if (type === "hotkey") {
      const sequence = normalizeHotkey(action.keys);
      await runPowerShell("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait($args[0])", [sequence]);
      return { type, ok: true, summary: `已发送快捷键 ${Array.isArray(action.keys) ? action.keys.join("+") : action.keys}` };
    }
    if (type === "click") {
      const x = Math.round(Number(action.x)); const y = Math.round(Number(action.y));
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < -10000 || y < -10000 || x > 30000 || y > 30000) throw new Error("点击坐标无效");
      const script = "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class MouseCtl {[DllImport(\"user32.dll\")] public static extern bool SetCursorPos(int X,int Y); [DllImport(\"user32.dll\")] public static extern void mouse_event(uint f,uint dx,uint dy,uint d,UIntPtr e);}'; [MouseCtl]::SetCursorPos([int]$args[0],[int]$args[1])|Out-Null; [MouseCtl]::mouse_event(2,0,0,0,[UIntPtr]::Zero); [MouseCtl]::mouse_event(4,0,0,0,[UIntPtr]::Zero)";
      await runPowerShell(script, [x, y]);
      return { type, ok: true, summary: `已点击屏幕坐标 ${x}, ${y}` };
    }
    if (type === "capture_screen") {
      if (!desktopCapturer || !captureDirectory) throw new Error("当前环境不支持屏幕读取");
      const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 1920, height: 1080 } });
      const source = sources[0];
      if (!source || source.thumbnail.isEmpty()) throw new Error("无法读取屏幕画面");
      fs.mkdirSync(captureDirectory, { recursive: true });
      const filePath = path.join(captureDirectory, `screen-${Date.now()}.png`);
      fs.writeFileSync(filePath, source.thumbnail.toPNG());
      return { type, ok: true, summary: "已截取当前屏幕", data: { path: filePath, width: source.thumbnail.getSize().width, height: source.thumbnail.getSize().height } };
    }
    if (type === "wait") {
      const milliseconds = Math.max(100, Math.min(5000, Number(action.milliseconds) || 500));
      await new Promise((resolve) => setTimeout(resolve, milliseconds));
      return { type, ok: true, summary: `已等待 ${milliseconds} 毫秒` };
    }
    throw new Error(`不支持的完全访问操作：${type || "空操作"}`);
  }

  async function execute(actions) {
    const results = [];
    for (const action of (Array.isArray(actions) ? actions : []).slice(0, MAX_ACTIONS)) {
      try { results.push(await executeAction(action)); }
      catch (error) { results.push({ type: String(action?.type || "unknown"), ok: false, summary: error.message }); }
    }
    return results;
  }

  return { execute, executeAction };
}

module.exports = { createComputerAccessRuntime, normalizeHotkey, MAX_ACTIONS };
