const root = document.documentElement;
const track = document.querySelector(".progress-track");
const status = document.querySelector("#startup-status");
const percent = document.querySelector("#startup-percent");
let currentProgress = 8;
let targetProgress = 14;

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
  if (nextStatus) status.textContent = String(nextStatus);
};

window.finishStartup = () => {
  currentProgress = 100;
  targetProgress = 100;
  root.style.setProperty("--startup-progress", "100%");
  track.setAttribute("aria-valuenow", "100");
  percent.textContent = "100%";
  status.textContent = "工作台已就绪";
  document.body.classList.add("is-complete");
  setTimeout(() => document.body.classList.add("is-leaving"), 260);
};

requestAnimationFrame(renderProgress);
