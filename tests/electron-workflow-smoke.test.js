const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const electron = require("electron");
const port = 9337;

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForPage() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
      const page = pages.find((item) => item.type === "page" && item.url.endsWith("/index.html"));
      if (page) return page;
    } catch {}
    await delay(250);
  }
  throw new Error("Electron 主界面未在限定时间内启动");
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    };
  }
  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => { this.socket.onopen = resolve; this.socket.onerror = reject; });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  close() { this.socket.close(); }
}

async function main() {
  const cleanupDefault = process.env.SMOKE_CLEAN_DEFAULT === "1";
  const userData = cleanupDefault ? null : fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-electron-smoke-"));
  const executable = process.env.SMOKE_EXECUTABLE || electron;
  const args = process.env.SMOKE_EXECUTABLE ? [`--remote-debugging-port=${port}`] : [root, `--remote-debugging-port=${port}`];
  if (userData) args.push(`--user-data-dir=${userData}`);
  const child = spawn(executable, args, { cwd: root, stdio: "ignore", env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" } });
  let client;
  try {
    const page = await waitForPage();
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (await client.evaluate("document.readyState === 'complete' && typeof applyInterfaceMode === 'function'")) break;
      await delay(100);
    }
    if (cleanupDefault) {
      await client.evaluate("localStorage.removeItem('ai-software-team.workflow-editor-v1'); true");
      console.log("已清理首次冒烟测试产生的临时工作流状态");
      return;
    }
    await client.evaluate("applyInterfaceMode('workflow'); true");
    await delay(300);

    const initial = await client.evaluate(`(() => {
      const nodes = [...document.querySelectorAll('[data-workflow-node]')];
      const manager = document.querySelector('[data-workflow-node="commander"]');
      const agents = nodes.filter((node) => node.classList.contains('agent'));
      return {
        nodes: nodes.length,
        managerLeft: parseFloat(manager.style.left),
        managerTop: parseFloat(manager.style.top),
        firstAgentLeft: Math.min(...agents.map((node) => parseFloat(node.style.left))),
        managerBranches: currentWorkflow.edges.filter((edge) => edge.from === 'commander').length,
        chat: Boolean(document.querySelector('#workflow-chat-form')),
        modelSelect: Boolean(document.querySelector('#workflow-node-model')),
        importSkill: Boolean(document.querySelector('#import-plugin-button'))
      };
    })()`);
    assert.equal(initial.nodes, 21);
    assert.ok(initial.managerLeft < initial.firstAgentLeft);
    assert.equal(initial.managerBranches, 10);
    assert.ok(initial.chat && initial.modelSelect && initial.importSkill);

    const managerRect = await client.evaluate(`(() => { const rect = document.querySelector('[data-workflow-node="commander"]').getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; })()`);
    await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: managerRect.x, y: managerRect.y, button: "left", clickCount: 1 });
    await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: managerRect.x + 36, y: managerRect.y + 24, button: "left" });
    await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: managerRect.x + 36, y: managerRect.y + 24, button: "left", clickCount: 1 });
    await delay(100);
    const moved = await client.evaluate("JSON.parse(localStorage.getItem(storageKeys.workflowEditor)).modes.software.positions.commander");
    assert.ok(Math.abs(moved.x - initial.managerLeft) + Math.abs(moved.y - initial.managerTop) > 10);

    const customId = await client.evaluate(`(() => {
      const editor = getWorkflowModeState();
      const id = 'smoke-custom-node';
      editor.customNodes = editor.customNodes.filter((node) => node.id !== id);
      editor.customNodes.push({ id, title:'冒烟测试节点', subtitle:'验证自定义节点', code:'TEST', type:'module', role:'', progress:20, x:1150, y:500, width:220 });
      editor.customEdges = editor.customEdges.filter((edge) => edge.id !== 'smoke-edge');
      editor.customEdges.push({ id:'smoke-edge', from:'frontend', to:id, kind:'branch' });
      saveWorkflowEditor(); renderWorkflow(); return id;
    })()`);
    assert.equal(customId, "smoke-custom-node");
    const customState = await client.evaluate(`({ node:Boolean(document.querySelector('[data-workflow-node="smoke-custom-node"]')), edge:Boolean(document.querySelector('[data-workflow-edge="smoke-edge"]')) })`);
    assert.ok(customState.node && customState.edge);

    const contextRect = await client.evaluate(`(() => { const rect = document.querySelector('[data-workflow-node="frontend"]').getBoundingClientRect(); return { x:rect.x + 20, y:rect.y + 20 }; })()`);
    await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: contextRect.x, y: contextRect.y, button: "right", clickCount: 1 });
    await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: contextRect.x, y: contextRect.y, button: "right", clickCount: 1 });
    await delay(80);
    assert.equal(await client.evaluate("!document.querySelector('#workflow-context-menu').hidden"), true);

    await client.evaluate("document.querySelector('[data-workflow-mode=\"image\"]').click(); true");
    await delay(150);
    const imageMode = await client.evaluate("({ mode: currentWorkflow.mode, manager: currentWorkflow.nodes.some((node) => node.manager), edges: currentWorkflow.edges.length })");
    assert.equal(imageMode.mode, "image");
    assert.ok(imageMode.manager && imageMode.edges > 0);
    console.log("通过：Electron 工作流模板、经理分支、拖动、节点、连线、右键、模型、对话与 Skill 入口");
  } finally {
    client?.close();
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await Promise.race([exited, delay(3000)]);
    if (userData) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try { fs.rmSync(userData, { recursive: true, force: true }); break; }
        catch { if (attempt < 4) await delay(200); }
      }
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
