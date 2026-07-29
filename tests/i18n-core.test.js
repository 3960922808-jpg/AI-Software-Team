const assert = require("assert");
const { translate, supportedLanguages } = require("../i18n-core");

assert.deepEqual(supportedLanguages, ["zh-CN", "en-US"]);
assert.equal(translate("模型与 API 配置", "en-US"), "Models & API Settings");
assert.equal(translate("产品经理 Agent", "en-US"), "Product Manager Agent");
assert.equal(translate("12 项技能已启用", "en-US"), "12 skills enabled");
assert.equal(translate("保存失败：连接超时", "en-US"), "Save failed: 连接超时");
assert.equal(translate("正在恢复模型与安全配置", "en-US"), "Restoring model and security settings");
assert.equal(translate("用户自己的任务", "en-US"), "用户自己的任务");
assert.equal(translate("模型与 API 配置", "zh-CN"), "模型与 API 配置");

console.log("通过：中英文词典、动态模板与用户内容保护");
