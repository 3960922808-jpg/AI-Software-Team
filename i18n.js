(function initializeApplicationI18n() {
  const storageKey = "ai-software-team.language";
  const core = window.AppI18nCore;
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const translatedAttributes = ["placeholder", "title", "aria-label"];
  let language = localStorage.getItem(storageKey) === "en-US" ? "en-US" : "zh-CN";

  function translatedValue(source, targetLanguage = language) {
    const value = String(source || "");
    const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${match[1]}${core.translate(match[2], targetLanguage)}${match[3]}`;
  }

  function translateTextNode(node) {
    const current = node.nodeValue || "";
    let source = originalText.get(node);
    if (source === undefined || (current !== source && current !== translatedValue(source, "en-US"))) {
      source = current;
      originalText.set(node, source);
    }
    const target = language === "en-US" ? translatedValue(source, "en-US") : source;
    if (current !== target) node.nodeValue = target;
  }

  function translateAttribute(element, attribute) {
    if (!element.hasAttribute(attribute)) return;
    let values = originalAttributes.get(element);
    if (!values) { values = new Map(); originalAttributes.set(element, values); }
    const current = element.getAttribute(attribute) || "";
    let source = values.get(attribute);
    if (source === undefined || (current !== source && current !== core.translate(source, "en-US"))) {
      source = current;
      values.set(attribute, source);
    }
    const target = language === "en-US" ? core.translate(source, "en-US") : source;
    if (current !== target) element.setAttribute(attribute, target);
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
    for (const element of elements) {
      if (element.tagName === "OPTION" && !element.hasAttribute("value")) element.setAttribute("value", element.textContent.trim());
      for (const attribute of translatedAttributes) translateAttribute(element, attribute);
      for (const child of element.childNodes) if (child.nodeType === Node.TEXT_NODE) translateTextNode(child);
    }
  }

  function renderLanguageControls() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const state = document.querySelector("#language-setting-state");
    if (state) state.textContent = language === "en-US" ? "English is active. This choice will persist after restart." : "语言设置会立即生效并在重启后保留。";
  }

  function applyLanguage(nextLanguage, persist = true) {
    language = nextLanguage === "en-US" ? "en-US" : "zh-CN";
    if (persist) localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
    translateTree(document);
    renderLanguageControls();
    document.dispatchEvent(new CustomEvent("app-language-change", { detail: { language } }));
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-language]");
    if (button) applyLanguage(button.dataset.language);
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") translateTextNode(mutation.target);
      if (mutation.type === "childList") for (const node of mutation.addedNodes) translateTree(node);
      if (mutation.type === "attributes") translateAttribute(mutation.target, mutation.attributeName);
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });

  window.AppI18n = Object.freeze({
    setLanguage: applyLanguage,
    getLanguage: () => language,
    locale: () => language,
    t: (value) => core.translate(value, language),
    refresh: () => translateTree(document)
  });
  applyLanguage(language, false);
})();
