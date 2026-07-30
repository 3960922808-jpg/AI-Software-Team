const assert = require("assert");
const { createComputerAccessRuntime, normalizeHotkey, MAX_ACTIONS } = require("../electron/computer-access-runtime");

(async () => {
  assert.equal(normalizeHotkey(["ctrl", "shift", "s"]), "^+s");
  const opened = [];
  const runtime = createComputerAccessRuntime({
    shell: { openExternal: async (url) => opened.push(url), openPath: async () => "" },
    clipboard: { readText: () => "剪贴板内容", writeText: () => {} },
    integrationRuntime: { validatePublicUrl: async (url) => new URL(url), fetchDocument: async (url) => ({ title: "页面", url, content: "正文" }) }
  });
  const results = await runtime.execute([{ type: "read_clipboard" }, { type: "read_webpage", url: "https://example.com" }, { type: "not_allowed" }]);
  assert.equal(results[0].ok, true); assert.equal(results[1].data.content, "正文"); assert.equal(results[2].ok, false); assert.equal(MAX_ACTIONS, 8);
  console.log("通过：完全访问动作白名单、读取结果和批次上限");
})().catch((error) => { console.error(error); process.exitCode = 1; });
