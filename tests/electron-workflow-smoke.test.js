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
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.equal(appSource.includes("event.currentTarget.apiKey"), false);
  const cleanupDefault = process.env.SMOKE_CLEAN_DEFAULT === "1";
  const userData = cleanupDefault ? null : fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-electron-smoke-"));
  const workspaceDirectory = cleanupDefault ? null : fs.mkdtempSync(path.join(os.tmpdir(), "ai-team-artifacts-"));
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
        importSkill: Boolean(document.querySelector('#import-plugin-button')),
        backButtons: document.querySelectorAll('[data-view-back]').length,
        agentRoutes: document.querySelectorAll('[data-settings-model-target]').length,
        integrationTest: typeof window.desktop?.testIntegration === 'function',
        mediaGet: typeof window.desktop?.getMediaModels === 'function',
        mediaConfigure: typeof window.desktop?.configureMediaModel === 'function',
        imageModelForm: Boolean(document.querySelector('#image-model-form')),
        videoModelForm: Boolean(document.querySelector('#video-model-form')),
        languageControls: document.querySelectorAll('[data-language]').length,
        demoPanels: document.querySelectorAll('.demo-panel,[data-demo]').length,
        templateColor: getComputedStyle(document.querySelector('[data-workflow-mode="software"]')).color,
        templateBackground: getComputedStyle(document.querySelector('[data-workflow-mode="software"]')).backgroundColor
      };
    })()`);
    assert.equal(initial.nodes, 21);
    assert.ok(initial.managerLeft < initial.firstAgentLeft);
    assert.equal(initial.managerBranches, 10);
    assert.ok(initial.chat && initial.modelSelect && initial.importSkill);
    assert.ok(initial.backButtons >= 10);
    assert.equal(initial.agentRoutes, 11);
    assert.equal(initial.integrationTest, true);
    assert.ok(initial.mediaGet && initial.mediaConfigure);
    assert.ok(initial.imageModelForm && initial.videoModelForm);
    assert.equal(initial.languageControls, 2);
    assert.equal(initial.demoPanels, 0);
    assert.notEqual(initial.templateColor, initial.templateBackground);

    const originalRoleValue = await client.evaluate("document.querySelector('#task-form [name=\"agent\"] option').value");
    await client.evaluate("window.AppI18n.setLanguage('en-US'); true");
    await delay(180);
    const englishLanguage = await client.evaluate(`(() => {
      const ignored = new Set(['SCRIPT', 'STYLE']);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const residual = [];
      let node;
      while ((node = walker.nextNode())) {
        if (ignored.has(node.parentElement?.tagName)) continue;
        const value = node.nodeValue.trim();
        if (value && /[\u4e00-\u9fff]/.test(value)) residual.push(value);
      }
      for (const element of document.querySelectorAll('*')) {
        for (const attribute of ['placeholder', 'title', 'aria-label']) {
          const value = element.getAttribute(attribute) || '';
          if (/[\u4e00-\u9fff]/.test(value)) residual.push(value);
        }
      }
      return {
        lang: document.documentElement.lang,
        title: document.title,
        stored: localStorage.getItem('ai-software-team.language'),
        roleValue: document.querySelector('#task-form [name="agent"] option').value,
        residual: [...new Set(residual)].slice(0, 80)
      };
    })()`);
    assert.equal(englishLanguage.lang, 'en-US');
    assert.equal(englishLanguage.stored, 'en-US');
    assert.match(englishLanguage.title, /Project Workspace/);
    assert.equal(englishLanguage.roleValue, originalRoleValue);
    assert.deepEqual(englishLanguage.residual, []);

    await client.evaluate(`(() => {
      activateView('settings');
      const form = document.querySelector('#model-settings-form');
      form.provider.value = 'custom';
      form.baseUrl.value = 'https://main.example/v1';
      form.model.value = 'main-smoke-model';
      form.apiKey.value = 'main-smoke-key';
      form.requestSubmit();
      return true;
    })()`);
    await delay(250);
    const mainSave = await client.evaluate(`(async () => ({ status: await window.desktop.getModelStatus(), feedback: document.querySelector('#model-save-feedback').textContent }))()`);
    assert.equal(mainSave.status.configured, true);
    assert.match(mainSave.feedback, /saved|success/i);

    await client.evaluate(`(() => {
      const image = document.querySelector('#image-model-form');
      image.provider.value = 'custom';
      image.baseUrl.value = 'https://image.example/v1';
      image.model.value = 'image-smoke-model';
      image.apiKey.value = 'image-smoke-key';
      image.requestSubmit();
      const video = document.querySelector('#video-model-form');
      video.provider.value = 'custom';
      video.baseUrl.value = 'https://video.example/v1';
      video.model.value = 'video-smoke-model';
      video.apiKey.value = 'video-smoke-key';
      video.requestSubmit();
      return true;
    })()`);
    await delay(300);
    const mediaSaved = await client.evaluate(`(async () => ({ models: await window.desktop.getMediaModels(), imageFeedback: document.querySelector('#image-model-feedback').textContent, videoFeedback: document.querySelector('#video-model-feedback').textContent }))()`);
    assert.equal(mediaSaved.models.image.configured, true);
    assert.equal(mediaSaved.models.video.configured, true);
    assert.match(mediaSaved.imageFeedback, /saved|success/i);
    assert.match(mediaSaved.videoFeedback, /saved|success/i);

    await client.evaluate("document.querySelector('#image-model-form [data-clear-media-model]').click(); true");
    await delay(180);
    const mediaCleared = await client.evaluate("window.desktop.getMediaModels()");
    assert.equal(mediaCleared.image.configured, false);
    assert.equal(mediaCleared.video.configured, true);

    const selectedWorkspace = await client.evaluate(`(async () => { const result = await window.desktop.setWorkspace(${JSON.stringify(workspaceDirectory)}); setWorkspaceState(result.path); return { path: result.path, input: document.querySelector('#workspace-path').value }; })()`);
    assert.equal(selectedWorkspace.path, path.resolve(workspaceDirectory));
    assert.equal(selectedWorkspace.input, path.resolve(workspaceDirectory));
    const dynamicResidual = await client.evaluate(`(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const values = [];
      let node;
      while ((node = walker.nextNode())) {
        if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
        const value = node.nodeValue.trim();
        if (value && /[\u4e00-\u9fff]/.test(value)) values.push(value);
      }
      for (const element of document.querySelectorAll('*')) {
        for (const attribute of ['placeholder', 'title', 'aria-label']) {
          const value = element.getAttribute(attribute) || '';
          if (/[\u4e00-\u9fff]/.test(value)) values.push(value);
        }
      }
      return [...new Set(values)].slice(0, 80);
    })()`);
    assert.deepEqual(dynamicResidual, []);
    await client.evaluate("window.AppI18n.setLanguage('zh-CN'); true");
    await delay(120);
    assert.match(await client.evaluate("document.title"), /项目工作台/);
    await client.evaluate("applyInterfaceMode('workflow'); true");
    await delay(120);

    const dialogLayout = await client.evaluate(`(() => {
      openWorkflowNodeDialog(currentWorkflow.nodes.find((node) => node.id === 'architect-output'));
      const dialog = document.querySelector('#workflow-node-dialog');
      const labels = [...dialog.querySelector('.form-row').children].map((item) => item.getBoundingClientRect());
      const result = { overflow: dialog.scrollWidth - dialog.clientWidth, aligned: Math.abs(labels[0].top - labels[1].top) < 2, widths: labels.map((item) => item.width) };
      dialog.close();
      return result;
    })()`);
    assert.ok(dialogLayout.overflow <= 1);
    assert.ok(dialogLayout.aligned && dialogLayout.widths.every((width) => width > 150));

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
      editor.customEdges = editor.customEdges.filter((edge) => edge.from !== 'frontend' || edge.to !== id);
      saveWorkflowEditor(); renderWorkflow(); return id;
    })()`);
    assert.equal(customId, "smoke-custom-node");
    const customState = await client.evaluate(`(() => { startWorkflowConnection('frontend'); updateWorkflowConnectionPreview({clientX:600,clientY:420}); const preview=document.querySelector('#workflow-link-preview'); const previewPath=preview.getAttribute('d') || ''; finishWorkflowConnection('smoke-custom-node'); const customEdge=currentWorkflow.edges.find((edge) => edge.custom && edge.from==='frontend' && edge.to==='smoke-custom-node'); const edge=document.querySelector('[data-workflow-edge="'+customEdge.id+'"]'); return { node:Boolean(document.querySelector('[data-workflow-node="smoke-custom-node"]')), edge:Boolean(edge), animation:getComputedStyle(edge).animationName, preview:previewPath }; })()`);
    assert.ok(customState.node && customState.edge);
    assert.match(customState.animation, /workflowFlow/);
    assert.match(customState.preview, /^M /);

    const contextRect = await client.evaluate(`(() => { const rect = document.querySelector('[data-workflow-node="frontend"]').getBoundingClientRect(); return { x:rect.x + 20, y:rect.y + 20 }; })()`);
    await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: contextRect.x, y: contextRect.y, button: "right", clickCount: 1 });
    await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: contextRect.x, y: contextRect.y, button: "right", clickCount: 1 });
    await delay(80);
    assert.equal(await client.evaluate("!document.querySelector('#workflow-context-menu').hidden"), true);
    const menuPosition = await client.evaluate(`(() => { const rect=document.querySelector('#workflow-context-menu').getBoundingClientRect(); return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:innerWidth,height:innerHeight}; })()`);
    assert.ok(menuPosition.left >= 0 && menuPosition.top >= 0 && menuPosition.right <= menuPosition.width && menuPosition.bottom <= menuPosition.height);
    assert.ok(Math.abs(menuPosition.left - contextRect.x) < 260 && Math.abs(menuPosition.top - contextRect.y) < 260);

    await client.evaluate("document.querySelector('[data-workflow-mode=\"image\"]').click(); true");
    await delay(150);
    const imageMode = await client.evaluate("({ mode: currentWorkflow.mode, manager: currentWorkflow.nodes.some((node) => node.manager), edges: currentWorkflow.edges.length })");
    assert.equal(imageMode.mode, "image");
    assert.ok(imageMode.manager && imageMode.edges > 0);
    await client.evaluate("window.AppI18n.setLanguage('en-US'); location.reload(); true");
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await delay(100);
      try { if (await client.evaluate("document.readyState === 'complete' && window.AppI18n?.getLanguage() === 'en-US'")) break; } catch {}
    }
    const persistedLanguage = await client.evaluate("({ language: window.AppI18n.getLanguage(), lang: document.documentElement.lang, title: document.title })");
    assert.equal(persistedLanguage.language, "en-US");
    assert.equal(persistedLanguage.lang, "en-US");
    assert.match(persistedLanguage.title, /Project Workspace/);
    console.log("通过：Electron 独立媒体配置、双语切换、用户任务、返回导航、模型路由、拖动、动画连线与右键定位");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    if (client) {
      try { await client.send("Browser.close"); } catch {}
      client.close();
    }
    await Promise.race([exited, delay(2000)]);
    if (child.exitCode === null) {
      child.kill();
      await Promise.race([exited, delay(1000)]);
    }
    if (userData) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try { fs.rmSync(userData, { recursive: true, force: true }); break; }
        catch { if (attempt < 4) await delay(200); }
      }
    }
    if (workspaceDirectory) fs.rmSync(workspaceDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
