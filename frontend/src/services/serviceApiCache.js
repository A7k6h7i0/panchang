const CACHE_PREFIX = "panchang:service-cache:v1";
const SNAPSHOT_PREFIX = "panchang:service-snapshot:v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTL_MS = 2 * DAY_MS;
const DEFAULT_REVALIDATE_AFTER_MS = 12 * 60 * 60 * 1000;
const DEFAULT_SNAPSHOT_TTL_MS = 2 * DAY_MS;

const inFlightRequests = new Map();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function inferServiceBucket(url) {
  const normalized = String(url || "").toLowerCase();
  if (normalized.includes("/purohit")) return "purohits";
  if (normalized.includes("/stores")) return "poojaStores";
  return "temples";
}

function makeStorageKey(url) {
  const bucket = inferServiceBucket(url);
  return `${CACHE_PREFIX}:${bucket}:${encodeURIComponent(String(url || ""))}`;
}

function makeSnapshotKey(serviceType) {
  return `${SNAPSHOT_PREFIX}:${String(serviceType || "temple").toLowerCase()}`;
}

function readCacheEntry(url) {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(makeStorageKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Number.isFinite(Number(parsed.cachedAt))) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCacheEntry(url, data) {
  if (!isBrowser()) return;
  const payload = JSON.stringify({
    cachedAt: Date.now(),
    data,
  });
  try {
    window.localStorage.setItem(makeStorageKey(url), payload);
  } catch {
    // Ignore storage quota errors; network data is still returned to UI.
  }
}

function normalizeFetchError(response, fallbackMessage) {
  return response
    .clone()
    .json()
    .then((body) => body?.error || fallbackMessage)
    .catch(() =>
      response
        .clone()
        .text()
        .then((text) => text || fallbackMessage)
        .catch(() => fallbackMessage)
    );
}

async function fetchNetworkJson(url, signal) {
  const response = await fetch(url, { method: "GET", signal });
  if (!response.ok) {
    const message = await normalizeFetchError(response, "Unable to fetch nearby results.");
    throw new Error(message);
  }
  return response.json();
}

function fetchAndCache(url, signal) {
  const requestKey = `GET:${String(url || "")}`;
  const active = inFlightRequests.get(requestKey);
  if (active) return active;

  const requestPromise = fetchNetworkJson(url, signal)
    .then((json) => {
      writeCacheEntry(url, json);
      return json;
    })
    .finally(() => {
      inFlightRequests.delete(requestKey);
    });

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export async function fetchServiceJsonCached(
  url,
  {
    signal,
    ttlMs = DEFAULT_TTL_MS,
    staleWhileRevalidate = true,
    revalidateAfterMs = DEFAULT_REVALIDATE_AFTER_MS,
  } = {}
) {
  const cache = readCacheEntry(url);
  const now = Date.now();
  const cacheAgeMs = cache ? now - Number(cache.cachedAt) : Number.POSITIVE_INFINITY;
  const isFresh = cacheAgeMs <= ttlMs;

  if (isFresh) {
    if (staleWhileRevalidate && cacheAgeMs >= revalidateAfterMs) {
      // Fire-and-forget refresh so UI can stay stable without blocking.
      fetchAndCache(url, undefined).catch(() => {});
    }
    return cache.data;
  }

  try {
    return await fetchAndCache(url, signal);
  } catch (error) {
    // Graceful fallback to stale cache on transient API failures.
    if (cache?.data) return cache.data;
    throw error;
  }
}

export function readServiceSnapshotCache(serviceType, ttlMs = DEFAULT_SNAPSHOT_TTL_MS) {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(makeSnapshotKey(serviceType));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Number.isFinite(Number(parsed.cachedAt))) return null;
    if (Date.now() - Number(parsed.cachedAt) > ttlMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeServiceSnapshotCache(serviceType, items, meta = {}) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      makeSnapshotKey(serviceType),
      JSON.stringify({
        cachedAt: Date.now(),
        serviceType: String(serviceType || "temple").toLowerCase(),
        items,
        meta,
      })
    );
  } catch {
    // Ignore storage quota errors; the panel still works normally.
  }
}
