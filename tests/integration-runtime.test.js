const assert = require("assert");
const integration = require("../electron/integration-runtime");

async function main() {
  assert.equal(integration.status().githubTokenConfigured, false);
  assert.equal(integration.configure({ githubToken: "temporary-test-token" }).githubTokenConfigured, true);
  assert.equal(integration.clear().githubTokenConfigured, false);
  await assert.rejects(() => integration.validatePublicUrl("http://example.com"), /只允许使用 HTTPS/);
  await assert.rejects(() => integration.validatePublicUrl("https://127.0.0.1/private"), /拒绝访问本机或局域网地址/);
  await assert.rejects(() => integration.validatePublicUrl("https://localhost/private"), /拒绝访问本机或局域网地址/);
  console.log("通过：联网凭据内存状态、协议限制和本机网络访问防护");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
