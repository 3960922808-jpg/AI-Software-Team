const root = document.documentElement;
const track = document.querySelector(".progress-track");
const status = document.querySelector("#startup-status");
const percent = document.querySelector("#startup-percent");
let currentProgress = 8;
let targetProgress = 14;
const startupLanguage = localStorage.getItem("ai-software-team.language") === "en-US" ? "en-US" : "zh-CN";
const translateStartup = (value) => window.AppI18nCore?.translate(value, startupLanguage) || value;
document.documentElement.lang = startupLanguage;
document.title = translateStartup(document.title);
document.querySelector(".splash-shell").setAttribute("aria-label", translateStartup(document.querySelector(".splash-shell").getAttribute("aria-label")));
track.setAttribute("aria-label", translateStartup(track.getAttribute("aria-label")));
status.textContent = translateStartup(status.textContent);

function renderProgress() {
  if (currentProgress < targetProgress) {
    currentProgress = Math.min(targetProgress, currentProgress + Math.max(0.35, (targetProgress - currentProgress) * 0.12));
  }
  const rounded = Math.round(currentProgress);
  root.style.setProperty("--startup-progress", `${Math.max(8, currentProgress)}%`);
  track.setAttribute("aria-valuenow", String(rounded));
  percent.textContent = `${rounded}%`;
  requestAnimationFrame(renderProgress);
}

window.setStartupProgress = (nextProgress, nextStatus) => {
  targetProgress = Math.max(targetProgress, Math.min(100, Number(nextProgress) || 0));
  if (nextStatus) status.textContent = translateStartup(String(nextStatus));
};

window.finishStartup = () => {
  currentProgress = 100;
  targetProgress = 100;
  root.style.setProperty("--startup-progress", "100%");
  track.setAttribute("aria-valuenow", "100");
  percent.textContent = "100%";
  status.textContent = translateStartup("工作台已就绪");
  document.body.classList.add("is-complete");
  setTimeout(() => document.body.classList.add("is-leaving"), 260);
};

requestAnimationFrame(renderProgress);
