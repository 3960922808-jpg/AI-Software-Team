const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const AdmZip = require("adm-zip");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const WordExtractor = require("word-extractor");

const execFileAsync = promisify(execFile);
const MAX_SOURCE_BYTES = 200 * 1024 * 1024;
const MAX_TEXT_CHARS = 4_000_000;
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".markdown", ".csv", ".json", ".jsonc", ".xml", ".html", ".htm", ".yaml", ".yml", ".toml", ".ini", ".log", ".rtf"]);

function normalizeText(value) {
  return String(value || "").replace(/\0/g, "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, MAX_TEXT_CHARS);
}

function decodeXml(value) {
  return String(value || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));
}

async function extractPptx(filePath) {
  const zip = new AdmZip(filePath);
  const slides = zip.getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
    .sort((a, b) => Number(a.entryName.match(/\d+/)?.[0]) - Number(b.entryName.match(/\d+/)?.[0]));
  return slides.map((entry, index) => {
    const xml = entry.getData().toString("utf8");
    const lines = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1])).filter(Boolean);
    return lines.length ? `第 ${index + 1} 页\n${lines.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
}

async function extractLegacyPpt(filePath) {
  const script = `
$ErrorActionPreference='Stop'
$powerPoint=$null
try {
  try { $powerPoint=New-Object -ComObject PowerPoint.Application } catch { $powerPoint=New-Object -ComObject KWPP.Application }
  $presentation=$powerPoint.Presentations.Open($args[0],$true,$true,$false)
  foreach($slide in $presentation.Slides){
    Write-Output ("第 " + $slide.SlideIndex + " 页")
    foreach($shape in $slide.Shapes){
      try { if($shape.HasTextFrame -and $shape.TextFrame.HasText){ Write-Output $shape.TextFrame.TextRange.Text } } catch {}
    }
    Write-Output ""
  }
  $presentation.Close()
} finally { if($powerPoint){$powerPoint.Quit()} }
`;
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, filePath], { windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

async function parseDocumentFile(filePath) {
  const resolved = path.resolve(String(filePath || ""));
  const stat = await fs.promises.stat(resolved);
  if (!stat.isFile()) throw new Error("所选项目不是文件");
  if (stat.size > MAX_SOURCE_BYTES) throw new Error(`文件 ${path.basename(resolved)} 超过 200MB 限制`);
  const extension = path.extname(resolved).toLowerCase();
  let text = "";
  let extractor = "attachment";
  let warning = "";
  try {
    if (TEXT_EXTENSIONS.has(extension)) {
      text = await fs.promises.readFile(resolved, "utf8");
      extractor = "text";
    } else if (extension === ".docx") {
      text = (await mammoth.extractRawText({ path: resolved })).value;
      extractor = "mammoth";
    } else if (extension === ".doc") {
      text = (await new WordExtractor().extract(resolved)).getBody();
      extractor = "word-extractor";
    } else if (extension === ".pdf") {
      text = (await pdfParse(await fs.promises.readFile(resolved))).text;
      extractor = "pdf-parse";
    } else if (extension === ".pptx") {
      text = await extractPptx(resolved);
      extractor = "pptx";
    } else if (extension === ".ppt") {
      text = await extractLegacyPpt(resolved);
      extractor = "office-com";
    } else {
      warning = "该格式已作为附件保存，当前没有可用的正文提取器";
    }
  } catch (error) {
    warning = `原文件已保存，但正文提取失败：${error.message}`;
  }
  text = normalizeText(text);
  if (!text && !warning) warning = "文件没有可提取的文字内容";
  return {
    sourcePath: resolved,
    title: path.basename(resolved),
    extension: extension.slice(1).toUpperCase() || "FILE",
    bytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    text,
    extractor,
    warning,
    truncated: text.length >= MAX_TEXT_CHARS,
  };
}

module.exports = { parseDocumentFile, extractPptx, normalizeText, MAX_SOURCE_BYTES, MAX_TEXT_CHARS };
