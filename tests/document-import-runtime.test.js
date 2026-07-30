const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const AdmZip = require("adm-zip");
const { parseDocumentFile } = require("../electron/document-import-runtime");

function createDocx(filePath) {
  const zip = new AdmZip();
  zip.addFile("[Content_Types].xml", Buffer.from('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'));
  zip.addFile("_rels/.rels", Buffer.from('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'));
  zip.addFile("word/document.xml", Buffer.from('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>小说第一章，风从窗外吹来。</w:t></w:r></w:p></w:body></w:document>'));
  zip.writeZip(filePath);
}

function createPptx(filePath) {
  const zip = new AdmZip();
  zip.addFile("ppt/slides/slide1.xml", Buffer.from('<p:sld xmlns:p="x" xmlns:a="y"><a:t>项目路演标题</a:t><a:t>第二行内容</a:t></p:sld>'));
  zip.writeZip(filePath);
}

function createPdf(filePath) {
  fs.copyFileSync(path.join(__dirname, "..", "node_modules", "pdf-parse", "test", "data", "01-valid.pdf"), filePath);
}

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-documents-"));
  try {
    const txt = path.join(directory, "novel.txt"); const docx = path.join(directory, "novel.docx"); const pdf = path.join(directory, "novel.pdf"); const pptx = path.join(directory, "slides.pptx");
    fs.writeFileSync(txt, "第一章\n这是一个很长的故事。", "utf8"); createDocx(docx); createPdf(pdf); createPptx(pptx);
    assert.match((await parseDocumentFile(txt)).text, /第一章/);
    assert.match((await parseDocumentFile(docx)).text, /小说第一章/);
    assert.match((await parseDocumentFile(pdf)).text, /Trace-based Just-in-Time/);
    assert.match((await parseDocumentFile(pptx)).text, /项目路演标题/);
    console.log("通过：TXT、DOCX、PDF 与 PPTX 正文提取");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
