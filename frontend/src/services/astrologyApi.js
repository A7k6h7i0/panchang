function getApiRoot() {
  // Prefer an explicit API URL, fallback to the backend base URL used elsewhere in this app.
  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const base = String(rawBase).trim().replace(/\/+$/, "");

  // When VITE_API_BASE_URL is not set, rely on Vite proxy (/api -> backend) in dev,
  // and same-origin deployment in production.
  if (!base) return "/api";

  // If someone sets VITE_API_URL to ".../api", don't double-append.
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

const API_ROOT = getApiRoot();
const providerBackoff = {
  until: 0,
  reason: "",
};

function isInsufficientCredit(payload) {
  const text = JSON.stringify(payload || "").toLowerCase();
  return text.includes("insufficient credit balance");
}

function maybeActivateBackoff(status, payload) {
  const now = Date.now();

  if (status === 429) {
    providerBackoff.until = now + 60_000;
    providerBackoff.reason = "rate_limit";
  } else if (status === 403 && isInsufficientCredit(payload)) {
    providerBackoff.until = now + 10 * 60_000;
    providerBackoff.reason = "insufficient_credit";
  }
}

async function requestJson(path, options = {}) {
  const { method = "GET", body, query, signal } = options;
  const now = Date.now();
  if (path.startsWith("/astrology/") && providerBackoff.until > now) {
    const err = new Error(
      providerBackoff.reason === "insufficient_credit"
        ? "Prokerala credits unavailable right now."
        : "Prokerala is rate-limited. Please wait."
    );
    err.status = providerBackoff.reason === "insufficient_credit" ? 403 : 429;
    err.payload = {
      error: err.message,
      code: "PROKERALA_BACKOFF",
      details: { reason: providerBackoff.reason, retryAt: new Date(providerBackoff.until).toISOString() },
    };
    throw err;
  }

  const url = new URL(`${API_ROOT}${path}`, window.location.origin);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    maybeActivateBackoff(res.status, payload);
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export function getProkeralaPanchang(
  { date, time, datetime, lat, lng, tzOffset, ayanamsa, la } = {},
  { signal } = {}
) {
  return requestJson("/astrology/panchang", {
    method: "GET",
    query: { date, time, datetime, lat, lng, tzOffset, ayanamsa, la },
    signal,
  });
}

export function getProkeralaFestivals(
  { year, month, date, time, datetime, lat, lng, tzOffset, ayanamsa, la } = {},
  { signal } = {}
) {
  return requestJson("/astrology/festivals", {
    method: "GET",
    query: { year, month, date, time, datetime, lat, lng, tzOffset, ayanamsa, la },
    signal,
  });
}

export function postKundali(body, { signal } = {}) {
  return requestJson("/astrology/kundali", { method: "POST", body, signal });
}

export function postMatchmaking(body, { signal } = {}) {
  return requestJson("/astrology/matchmaking", { method: "POST", body, signal });
}

export function postMuhurat(body, { signal } = {}) {
  return requestJson("/astrology/muhurat", { method: "POST", body, signal });
}
