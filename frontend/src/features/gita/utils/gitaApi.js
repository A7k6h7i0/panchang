const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

function getApiRoot() {
  const base = String(API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) return "/api";
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${getApiRoot()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload?.data ?? payload;
}

function buildParams(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
}

export async function getGitaIndex() {
  return requestJson("/gita/index");
}

export async function getDailySloka(params = {}) {
  const query = buildParams(params);
  return requestJson(`/gita/daily${query ? `?${query}` : ""}`);
}

export async function getGitaChapter(chapter) {
  return requestJson(`/gita/chapter/${encodeURIComponent(chapter)}`);
}

export async function getSloka(chapter, verse) {
  return requestJson(`/gita/${encodeURIComponent(chapter)}/${encodeURIComponent(verse)}`);
}

export async function searchSlokas(keyword) {
  const query = buildParams({ q: keyword });
  return requestJson(`/gita/search${query ? `?${query}` : ""}`);
}

export async function getRecommendations(params = {}) {
  const query = buildParams(params);
  return requestJson(`/gita/recommend${query ? `?${query}` : ""}`);
}

export async function explainSloka(payload = {}) {
  return requestJson("/gita/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
