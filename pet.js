const shell = document.querySelector("#pet-shell");
const bubble = document.querySelector("#pet-bubble");
const form = document.querySelector("#pet-form");
const input = document.querySelector("#pet-input");
const message = document.querySelector("#pet-message");
const state = document.querySelector("#pet-state");
const presence = document.querySelector("#pet-presence");
const character = document.querySelector("#pet-character");
let locale = "zh-CN";
let petDrag = null;
let suppressCharacterClick = false;
const copy = {
  "zh-CN": { intro: "把任务告诉我，我会先分析，再决定交给哪位 Agent。", placeholder: "告诉灵灵要完成什么…", idle: "等待任务", thinking: "灵灵正在分析任务", speaking: "灵灵正在回答", online: "在线", thinkingPresence: "思考中", speakingPresence: "说话中", send: "发送任务", open: "打开完整对话", quit: "退出软件", failed: "任务发送失败", completed: "灵灵已经处理完成。" },
  "en-US": { intro: "Tell me the task. I will analyze it and choose the right agent.", placeholder: "Tell Lingling what to complete...", idle: "Waiting for a task", thinking: "Lingling is analyzing the task", speaking: "Lingling is responding", online: "Online", thinkingPresence: "Thinking", speakingPresence: "Speaking", send: "Send task", open: "Open full chat", quit: "Quit app", failed: "Failed to send task", completed: "Lingling has finished processing it." }
};

function words() { return copy[locale] || copy["zh-CN"]; }

function applyLocale(next) {
  locale = next === "en-US" ? "en-US" : "zh-CN";
  document.documentElement.lang = locale;
  if (!message.dataset.response) message.textContent = words().intro;
  input.placeholder = words().placeholder;
  form.querySelector('button[type="submit"]').textContent = words().send;
  document.querySelector("#pet-open-main").textContent = words().open;
  document.querySelector("#pet-quit").textContent = words().quit;
  setState(document.body.classList.contains("thinking") ? "thinking" : document.body.classList.contains("speaking") ? "speaking" : "idle");
}

function setState(next) {
  document.body.classList.toggle("thinking", next === "thinking");
  document.body.classList.toggle("speaking", next === "speaking");
  presence.textContent = next === "thinking" ? words().thinkingPresence : next === "speaking" ? words().speakingPresence : words().online;
  state.textContent = next === "thinking" ? words().thinking : next === "speaking" ? words().speaking : words().idle;
}

character.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  petDrag = { pointerId: event.pointerId, startX: event.screenX, startY: event.screenY, moved: false };
  character.setPointerCapture?.(event.pointerId);
  window.petDesktop.startDrag({ screenX: event.screenX, screenY: event.screenY });
});
character.addEventListener("pointermove", (event) => {
  if (!petDrag || event.pointerId !== petDrag.pointerId) return;
  if (Math.abs(event.screenX - petDrag.startX) + Math.abs(event.screenY - petDrag.startY) > 5) petDrag.moved = true;
  if (!petDrag.moved) return;
  character.classList.add("dragging");
  window.petDesktop.moveDrag({ screenX: event.screenX, screenY: event.screenY });
});
function finishPetDrag(event) {
  if (!petDrag || (event?.pointerId !== undefined && event.pointerId !== petDrag.pointerId)) return;
  suppressCharacterClick = petDrag.moved && event?.type === "pointerup";
  petDrag = null;
  character.classList.remove("dragging");
  window.petDesktop.endDrag();
}
character.addEventListener("pointerup", finishPetDrag);
character.addEventListener("pointercancel", finishPetDrag);
character.addEventListener("lostpointercapture", finishPetDrag);
character.addEventListener("click", (event) => { if (suppressCharacterClick) { suppressCharacterClick = false; event.preventDefault(); return; } bubble.hidden = false; input.focus(); });
document.querySelector("#pet-collapse").addEventListener("click", () => { bubble.hidden = true; });
document.querySelector("#pet-open-main").addEventListener("click", () => window.petDesktop.openMain());
document.querySelector("#pet-quit").addEventListener("click", () => window.petDesktop.quit());
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content) return;
  setState("thinking");
  message.dataset.response = "true";
  message.textContent = locale === "en-US" ? `Received: ${content}` : `收到：${content}`;
  input.value = "";
  form.querySelector('button[type="submit"]').disabled = true;
  try { await window.petDesktop.submitTask(content); }
  catch (error) { message.textContent = `${words().failed}：${error.message}`; setState("idle"); }
  finally { form.querySelector('button[type="submit"]').disabled = false; }
});
input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
window.petDesktop.onResponse((payload) => { bubble.hidden = false; message.dataset.response = "true"; message.textContent = payload.text || words().completed; setState(payload.speaking ? "speaking" : "idle"); });
window.petDesktop.onState((payload) => setState(payload.state || "idle"));
window.petDesktop.onLocale((next) => applyLocale(next));
shell.addEventListener("contextmenu", (event) => { event.preventDefault(); window.petDesktop.openMain(); });
applyLocale("zh-CN");
