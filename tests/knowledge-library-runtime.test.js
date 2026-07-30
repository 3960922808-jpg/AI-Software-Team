const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createKnowledgeLibraryRuntime } = require("../electron/knowledge-library-runtime");

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-knowledge-"));
  try {
    const library = createKnowledgeLibraryRuntime({ directoryPath: path.join(root, "library") });
    const unknown = path.join(root, "draft.epub"); fs.writeFileSync(unknown, Buffer.from([1, 2, 3, 4]));
    const imported = await library.importFiles([unknown]);
    assert.equal(imported.documents.length, 1);
    assert.ok(imported.documents[0].attachmentName);
    assert.match(imported.documents[0].warning, /附件保存/);
    const novel = "章节内容。".repeat(300000);
    const migrated = library.migrate([{ id: "long-novel", title: "长篇小说", type: "TXT", content: novel }]);
    assert.equal(migrated.find((item) => item.id === "long-novel").content.length, novel.length);
    assert.equal(createKnowledgeLibraryRuntime({ directoryPath: path.join(root, "library") }).list().length, 2);
    console.log("通过：任意附件保留、长篇正文持久化与知识库重载");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
