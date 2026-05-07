const memoryStorage = new Map();

function getStorageBackend() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem(key) {
      return memoryStorage.has(key) ? memoryStorage.get(key) : null;
    },
    setItem(key, value) {
      memoryStorage.set(key, String(value));
    },
    removeItem(key) {
      memoryStorage.delete(key);
    },
  };
}

const backend = getStorageBackend();

export function storageGet(key) {
  try {
    return backend.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    backend.setItem(key, value);
  } catch {
    // Ignore storage quota/private-mode errors to keep UI responsive.
  }
}

export function storageRemove(key) {
  try {
    backend.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export function storageGetJson(key, fallback = null) {
  const raw = storageGet(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSetJson(key, value) {
  storageSet(key, JSON.stringify(value));
}
