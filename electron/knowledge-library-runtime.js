const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { parseDocumentFile } = require("./document-import-runtime");

function atomicWrite(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function createKnowledgeLibraryRuntime({ directoryPath }) {
  if (!directoryPath) throw new Error("知识库目录不能为空");
  const indexPath = path.join(directoryPath, "index.json");
  const contentsPath = path.join(directoryPath, "contents");
  const attachmentsPath = path.join(directoryPath, "attachments");

  function readIndex() {
    try {
      const record = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      return record?.version === 1 && Array.isArray(record.documents) ? record : { version: 1, documents: [] };
    } catch { return { version: 1, documents: [] }; }
  }

  function writeIndex(record) { atomicWrite(indexPath, { ...record, version: 1, updatedAt: new Date().toISOString() }); }
  function contentPath(id) { return path.join(contentsPath, `${id}.txt`); }

  function hydrate(document) {
    let content = "";
    try { content = fs.readFileSync(contentPath(document.id), "utf8"); } catch { content = document.preview || ""; }
    return { ...document, content };
  }

  function list(query = "") {
    const normalized = String(query || "").trim().toLowerCase();
    return readIndex().documents.map(hydrate).filter((document) => !normalized || `${document.title} ${document.content}`.toLowerCase().includes(normalized));
  }

  async function importFiles(filePaths) {
    const record = readIndex();
    const imported = [];
    fs.mkdirSync(contentsPath, { recursive: true });
    fs.mkdirSync(attachmentsPath, { recursive: true });
    for (const filePath of (Array.isArray(filePaths) ? filePaths : []).slice(0, 50)) {
      const parsed = await parseDocumentFile(filePath);
      const id = crypto.randomUUID();
      const extension = path.extname(parsed.sourcePath).toLowerCase();
      const attachmentName = `${id}${extension}`;
      await fs.promises.copyFile(parsed.sourcePath, path.join(attachmentsPath, attachmentName));
      await fs.promises.writeFile(contentPath(id), parsed.text || "", "utf8");
      const metadata = {
        id, title: parsed.title, type: parsed.extension, bytes: parsed.bytes,
        size: `${Math.max(1, Math.round(parsed.bytes / 1024))} KB`,
        modifiedAt: parsed.modifiedAt, importedAt: new Date().toISOString(),
        extractor: parsed.extractor, warning: parsed.warning, truncated: parsed.truncated,
        attachmentName, preview: parsed.text.slice(0, 500),
      };
      record.documents.unshift(metadata);
      imported.push(hydrate(metadata));
    }
    writeIndex(record);
    return { imported, documents: list() };
  }

  function migrate(documents) {
    const record = readIndex();
    fs.mkdirSync(contentsPath, { recursive: true });
    for (const source of (Array.isArray(documents) ? documents : []).slice(0, 200)) {
      const id = /^[a-zA-Z0-9_-]{1,80}$/.test(String(source.id || "")) ? String(source.id) : crypto.randomUUID();
      if (record.documents.some((item) => item.id === id)) continue;
      const content = String(source.content || "").slice(0, 4_000_000);
      fs.writeFileSync(contentPath(id), content, "utf8");
      record.documents.push({ id, title: String(source.title || "导入文档").slice(0, 260), type: String(source.type || "TEXT").slice(0, 20), bytes: Buffer.byteLength(content), size: source.size || `${Math.max(1, Math.round(Buffer.byteLength(content) / 1024))} KB`, importedAt: new Date().toISOString(), extractor: "legacy", warning: "", truncated: false, attachmentName: "", preview: content.slice(0, 500) });
    }
    writeIndex(record);
    return list();
  }

  function remove(id) {
    const record = readIndex();
    const document = record.documents.find((item) => item.id === id);
    if (!document) return list();
    record.documents = record.documents.filter((item) => item.id !== id);
    fs.rmSync(contentPath(id), { force: true });
    if (document.attachmentName) fs.rmSync(path.join(attachmentsPath, document.attachmentName), { force: true });
    writeIndex(record);
    return list();
  }

  function attachmentPath(id) {
    const document = readIndex().documents.find((item) => item.id === id);
    if (!document?.attachmentName) throw new Error("该知识条目没有原始附件");
    return path.join(attachmentsPath, document.attachmentName);
  }

  return { list, importFiles, migrate, remove, attachmentPath, directoryPath };
}

module.exports = { createKnowledgeLibraryRuntime };
