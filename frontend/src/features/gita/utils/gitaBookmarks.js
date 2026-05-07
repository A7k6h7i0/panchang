const STORAGE_KEY = "gita:bookmarks";

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeVerse(verse) {
  if (!verse) return null;
  return {
    id: String(verse.id || `BG${verse.chapter}.${verse.verse}`),
    chapter: Number(verse.chapter),
    verse: Number(verse.verse),
    speaker: String(verse.speaker || "").trim(),
    slok: String(verse.slok || "").trim(),
    transliteration: String(verse.transliteration || "").trim(),
    meaning: String(verse.meaning || "").trim(),
    tags: Array.isArray(verse.tags) ? verse.tags : [],
    bookmarkedAt: verse.bookmarkedAt || new Date().toISOString(),
  };
}

export function loadBookmarks() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed.map(normalizeVerse).filter(Boolean) : [];
}

export function saveBookmarks(bookmarks) {
  if (typeof window === "undefined") return;
  const normalized = Array.isArray(bookmarks) ? bookmarks.map(normalizeVerse).filter(Boolean) : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function isBookmarked(verse, bookmarks = []) {
  const id = String(verse?.id || `BG${verse?.chapter}.${verse?.verse}`);
  return bookmarks.some((item) => String(item?.id) === id);
}

export function toggleBookmark(verse, bookmarks = []) {
  const id = String(verse?.id || `BG${verse?.chapter}.${verse?.verse}`);
  const exists = bookmarks.findIndex((item) => String(item?.id) === id);

  if (exists >= 0) {
    const next = [...bookmarks.slice(0, exists), ...bookmarks.slice(exists + 1)];
    saveBookmarks(next);
    return next;
  }

  const next = [normalizeVerse(verse), ...bookmarks].filter(Boolean);
  saveBookmarks(next);
  return next;
}
