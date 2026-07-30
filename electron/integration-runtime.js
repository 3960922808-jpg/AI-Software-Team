const dns = require("dns").promises;
const net = require("net");

let githubToken = null;
const MAX_RESPONSE_BYTES = 1024 * 1024;

function configure(payload) {
  githubToken = String(payload?.githubToken || "").trim() || null;
  return status();
}

function clear() { githubToken = null; return status(); }
function status() { return { githubTokenConfigured: Boolean(githubToken) }; }

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) || parts[0] >= 224;
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
}

async function validatePublicUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("联网工具只允许使用 HTTPS 地址");
  if (url.username || url.password) throw new Error("网址中不能包含用户名或密码");
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) throw new Error("拒绝访问本机或局域网地址");
  return url;
}

async function readLimitedBody(response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error("远程内容超过一兆字节限制"); }
    chunks.push(value);
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}

async function safeFetch(value, options = {}) {
  let url = await validatePublicUrl(value);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const response = await fetch(url, { ...options, redirect: "manual", signal: AbortSignal.timeout(45000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("远程服务返回了无效跳转");
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    const body = await readLimitedBody(response);
    if (!response.ok) throw new Error(`远程服务返回 ${response.status}: ${body.slice(0, 240)}`);
    return { response, body, finalUrl: url.toString() };
  }
  throw new Error("远程地址跳转次数过多");
}

function cleanHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim();
}

async function fetchDocument(value) {
  const { response, body, finalUrl } = await safeFetch(value, { headers: { "user-agent": "AI-Software-Team/0.20" } });
  const contentType = response.headers.get("content-type") || "";
  const title = contentType.includes("html") ? (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || new URL(finalUrl).hostname) : new URL(finalUrl).pathname.split("/").pop() || new URL(finalUrl).hostname;
  const content = contentType.includes("html") ? cleanHtml(body) : body.trim();
  return { title: cleanHtml(title).slice(0, 160), url: finalUrl, contentType: contentType.split(";")[0], content: content.slice(0, 50000), fetchedAt: new Date().toISOString() };
}

function parseRepositoryLocation(value) {
  const input = String(value || "").trim();
  const normalized = input
    .replace(/^git@github\.com:/i, "")
    .replace(/^ssh:\/\/git@github\.com\//i, "")
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .split(/[?#]/)[0]
    .replace(/\/+$/, "");
  const match = normalized.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\/(tree|blob)\/([^/]+)(?:\/(.*))?|\/(?:releases|issues|pull|actions|settings)(?:\/.*)?)?$/i);
  if (!match) throw new Error("请输入 owner/repository 或完整的 GitHub 仓库地址");
  return { owner: match[1], repository: match[2], ref: match[4] || "", path: match[5] || "", view: match[3] || "" };
}

function parseRepository(value) {
  const { owner, repository } = parseRepositoryLocation(value);
  return { owner, repository };
}

async function githubRequest(endpoint) {
  const headers = { accept: "application/vnd.github+json", "user-agent": "AI-Software-Team/0.20", "x-github-api-version": "2022-11-28" };
  if (githubToken) headers.authorization = `Bearer ${githubToken}`;
  try {
    const { body, response } = await safeFetch(`https://api.github.com${endpoint}`, { headers });
    return { data: JSON.parse(body), headers: Object.fromEntries(response.headers.entries()) };
  } catch (error) {
    const message = String(error.message || error);
    if (/401/.test(message)) throw new Error("GitHub 令牌无效或已过期");
    if (/403/.test(message) && /rate limit/i.test(message)) throw new Error("GitHub 请求额度已用完，请配置有效令牌后重试");
    if (/404/.test(message)) throw new Error("GitHub 仓库不存在，或当前令牌没有访问权限");
    throw error;
  }
}

async function testConnection() {
  const endpoint = githubToken ? "/user" : "/rate_limit";
  const { data, headers } = await githubRequest(endpoint);
  return {
    connected: true,
    authenticated: Boolean(githubToken),
    account: githubToken ? data.login || "已认证账户" : "公开访问",
    remaining: Number(headers["x-ratelimit-remaining"] || data.rate?.remaining || 0),
    limit: Number(headers["x-ratelimit-limit"] || data.rate?.limit || 0),
  };
}

async function inspectRepository(value) {
  const { owner, repository, ref, path: requestedPath } = parseRepositoryLocation(value);
  const { data: metadata } = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`);
  let tree = { tree: [], truncated: false };
  const selectedBranch = ref || metadata.default_branch;
  if (selectedBranch) {
    try {
      const result = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(selectedBranch)}?recursive=1`);
      tree = result.data;
    } catch (error) {
      if (!/仓库不存在/.test(error.message)) throw error;
    }
  }
  const normalizedPrefix = requestedPath ? `${requestedPath.replace(/^\/+|\/+$/g, "")}/` : "";
  const blobs = (tree.tree || []).filter((item) => item.type === "blob" && (!normalizedPrefix || item.path === requestedPath || item.path.startsWith(normalizedPrefix)));
  const files = blobs.slice(0, 500).map((item) => ({ path: item.path, size: item.size || 0, sha: item.sha }));
  return {
    id: `${owner}/${repository}`,
    name: metadata.full_name,
    description: metadata.description || "",
    url: metadata.html_url,
    defaultBranch: metadata.default_branch,
    selectedBranch,
    selectedPath: requestedPath,
    language: metadata.language || "未识别",
    stars: metadata.stargazers_count || 0,
    private: Boolean(metadata.private),
    files,
    truncated: Boolean(tree.truncated) || blobs.length > files.length,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = { configure, clear, status, testConnection, fetchDocument, inspectRepository, validatePublicUrl, parseRepository, parseRepositoryLocation };
