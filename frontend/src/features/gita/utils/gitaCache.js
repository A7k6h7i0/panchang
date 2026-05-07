const SNAPSHOT_KEY = "gita:cache:v1:snapshot";
const EXPLANATION_KEY = "gita:cache:v1:explanations";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / serialization failures.
  }
}

function makeExplainKey(verse, mood, language) {
  const chapter = Number(verse?.chapter || 0);
  const verseNumber = Number(verse?.verse || 0);
  const verseId = String(verse?.id || `BG${chapter}.${verseNumber}`);
  return `${verseId}::${String(mood || "calm").toLowerCase()}::${String(language || "te").toLowerCase()}`;
}

export function loadCachedGitaSnapshot() {
  const snapshot = readJson(SNAPSHOT_KEY, null);
  if (!snapshot || snapshot.version !== 1) return null;
  return snapshot;
}

export function saveCachedGitaSnapshot(partial = {}) {
  const current = loadCachedGitaSnapshot() || { version: 1 };
  const next = {
    ...current,
    ...partial,
    version: 1,
    savedAt: Date.now(),
  };
  writeJson(SNAPSHOT_KEY, next);
  return next;
}

export function loadCachedGitaExplanation(verse, mood, language) {
  const cache = readJson(EXPLANATION_KEY, {});
  const key = makeExplainKey(verse, mood, language);
  const entry = cache?.[key];
  return typeof entry === "string" ? entry : "";
}

export function saveCachedGitaExplanation(verse, mood, language, explanation) {
  const text = String(explanation || "").trim();
  if (!text) return text;

  const cache = readJson(EXPLANATION_KEY, {});
  const key = makeExplainKey(verse, mood, language);
  cache[key] = text;
  writeJson(EXPLANATION_KEY, cache);
  return text;
}
