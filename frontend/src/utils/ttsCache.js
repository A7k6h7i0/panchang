const DB_NAME = "panchang-tts-cache";
const DB_VERSION = 1;
const STORE_NAME = "audio";

const memoryCache = new Map();

let dbPromise = null;

function hasIndexedDbSupport() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  if (!hasIndexedDbSupport()) {
    return Promise.reject(new Error("IndexedDB is not supported in this browser"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Failed to open TTS cache database"));
      request.onblocked = () => {
        console.warn("TTS cache database is blocked by another tab or version change.");
      };
    });
  }

  return dbPromise;
}

function runTransaction(mode, executor) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        let finished = false;
        const finish = (handler, value) => {
          if (finished) return;
          finished = true;
          handler(value);
        };

        tx.oncomplete = () => finish(resolve, true);
        tx.onerror = () => finish(reject, tx.error || new Error("IndexedDB transaction failed"));
        tx.onabort = () => finish(reject, tx.error || new Error("IndexedDB transaction aborted"));

        try {
          executor(store, finish, reject);
        } catch (error) {
          finish(reject, error);
        }
      })
  );
}

export function createTTSCacheKey(key, language, text = "") {
  const explicitKey = String(key || "").trim().toLowerCase();
  if (explicitKey) {
    return explicitKey
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  const safeSource = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safeLanguage = String(language || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

  if (safeSource && safeLanguage) return `${safeSource}_${safeLanguage}`;
  if (safeSource) return safeSource;
  if (safeLanguage) return `tts_${safeLanguage}`;
  return "tts_audio";
}

export async function saveAudio(key, blob) {
  if (!key || !blob) return false;

  memoryCache.set(key, blob);

  try {
    await runTransaction("readwrite", (store) => {
      store.put({
        key,
        blob,
        contentType: blob.type || "audio/mpeg",
        updatedAt: Date.now(),
        byteSize: blob.size || 0,
      });
    });
    return true;
  } catch (error) {
    console.error("Failed to save TTS audio:", error);
    return false;
  }
}

export async function getAudio(key) {
  if (!key) return null;

  const hotBlob = memoryCache.get(key);
  if (hotBlob instanceof Blob) {
    return hotBlob;
  }

  try {
    const record = await openDatabase().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(key);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error || new Error("Failed to read TTS audio"));
        })
    );

    if (record?.blob instanceof Blob) {
      memoryCache.set(key, record.blob);
      return record.blob;
    }

    return null;
  } catch (error) {
    console.error("Failed to load TTS audio:", error);
    return null;
  }
}

export async function preloadAudio(entries = []) {
  if (!Array.isArray(entries) || !entries.length) return [];

  return Promise.all(
    entries.map(async (entry) => {
      const key = String(entry?.key || "").trim();
      const blob = entry?.blob instanceof Blob ? entry.blob : null;
      if (!key || !blob) return false;
      return saveAudio(key, blob);
    })
  );
}
