import { useEffect, useRef } from "react";
import { LANGUAGE_CHANGE_EVENT } from "../utils/appSettings";

const LANGUAGE_KEY = "panchang:selected-language";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION", "CODE", "PRE"]);
const CACHE_PREFIX = "panchang:auto-translate:";
const MAX_TEXT_LENGTH = 500;
const FAST_TRANSLATE_WINDOW_MS = 2000;
const FAST_TRANSLATE_DEBOUNCE_MS = 0;
const NORMAL_TRANSLATE_DEBOUNCE_MS = 120;
const originalTextMap = new WeakMap();

function getApiRoot() {
  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const base = String(rawBase).trim().replace(/\/+$/, "");
  if (!base) return "/api";
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

function getSelectedLanguage() {
  if (typeof window === "undefined") return "en";
  return String(localStorage.getItem(LANGUAGE_KEY) || "en").trim().toLowerCase() || "en";
}

function isTranslatableText(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t.length < 2 || t.length > MAX_TEXT_LENGTH) return false;
  if (/^[\d\s\W_]+$/u.test(t)) return false;
  return true;
}

function collectTextNodes(root, targetLang) {
  if (!root) return [];
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (!parent) {
      node = walker.nextNode();
      continue;
    }

    if (
      SKIP_TAGS.has(parent.tagName) ||
      parent.closest("[data-no-auto-translate='true']") ||
      parent.closest("[translate='no']") ||
      parent.closest(".notranslate") ||
      parent.closest("[contenteditable='true']") ||
      parent.closest("svg")
    ) {
      node = walker.nextNode();
      continue;
    }

    const raw = node.nodeValue || "";
    if (!isTranslatableText(raw)) {
      node = walker.nextNode();
      continue;
    }

    if (node.__translatedLang === targetLang && node.__translatedValue === raw) {
      node = walker.nextNode();
      continue;
    }

    nodes.push(node);
    node = walker.nextNode();
  }

  return nodes;
}

function getCacheKey(lang, text) {
  return `${CACHE_PREFIX}${lang}::${text}`;
}

function readCache(lang, text) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getCacheKey(lang, text));
  } catch {
    return null;
  }
}

function writeCache(lang, text, translated) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCacheKey(lang, text), translated);
  } catch {
    // Ignore storage quota failures.
  }
}

async function translateBatch(target, texts, signal) {
  if (!texts.length) return [];

  try {
    const res = await fetch(`${getApiRoot()}/translate/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, texts }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Translate API failed (${res.status})`);
    }

    const payload = await res.json();
    return Array.isArray(payload?.translations) ? payload.translations : texts;
  } catch (error) {
    console.warn("Auto translation failed, using original texts:", error?.message || error);
    return texts;
  }
}

export default function AutoTranslator() {
  const currentLangRef = useRef(getSelectedLanguage());
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);
  const lastLanguageChangeRef = useRef(0);

  useEffect(() => {
    let disposed = false;

    const applyTranslations = async () => {
      if (disposed || runningRef.current) {
        queuedRef.current = true;
        return;
      }

      const runId = ++runIdRef.current;
      runningRef.current = true;
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const lang = currentLangRef.current || "en";

        // English is the base language. Leave the DOM alone so React can
        // update labels naturally without this layer restoring stale text.
        if (lang === "en") {
          return;
        }

        const nodes = collectTextNodes(document.body, lang);
        if (!nodes.length) return;

        const sourceTexts = nodes.map((node) => {
          const current = node.nodeValue || "";
          if (!originalTextMap.has(node)) {
            originalTextMap.set(node, current);
          }
          return originalTextMap.get(node) || current;
        });

        const uniqueTexts = [...new Set(sourceTexts)];
        const translations = new Map();
        const misses = [];

        uniqueTexts.forEach((text) => {
          const cached = readCache(lang, text);
          if (cached != null) {
            translations.set(text, cached);
          } else {
            misses.push(text);
          }
        });

        for (let i = 0; i < misses.length; i += 50) {
          const chunk = misses.slice(i, i + 50);
          const translatedChunk = await translateBatch(lang, chunk, controller.signal);
          if (disposed || runId !== runIdRef.current || controller.signal.aborted) {
            return;
          }
          chunk.forEach((src, index) => {
            const out = translatedChunk[index] || src;
            translations.set(src, out);
            writeCache(lang, src, out);
          });
        }

        if (disposed || runId !== runIdRef.current || controller.signal.aborted) {
          return;
        }

        nodes.forEach((node) => {
          const src = originalTextMap.get(node) || node.nodeValue || "";

          const translated = translations.get(src) || src;
          if (translated !== src) {
            node.nodeValue = translated;
          }
          node.__translatedLang = lang;
          node.__translatedValue = node.nodeValue || "";
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Auto translation failed:", err?.message || err);
        }
      } finally {
        if (runId === runIdRef.current) {
          runningRef.current = false;
        } else {
          runningRef.current = false;
        }
        if (queuedRef.current) {
          queuedRef.current = false;
          applyTranslations();
        }
      }
    };

    const schedule = () => {
      if (disposed) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const now = Date.now();
      const debounceMs =
        now - lastLanguageChangeRef.current <= FAST_TRANSLATE_WINDOW_MS
          ? FAST_TRANSLATE_DEBOUNCE_MS
          : NORMAL_TRANSLATE_DEBOUNCE_MS;
      debounceRef.current = setTimeout(() => {
        applyTranslations();
      }, debounceMs);
    };

    const applyNow = () => {
      if (disposed) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      applyTranslations();
    };

    const observer = new MutationObserver(() => {
      if (runningRef.current) return;
      schedule();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    const handleLanguageChange = (event) => {
      const nextLang = event?.detail?.language || getSelectedLanguage();
      if (nextLang && nextLang !== currentLangRef.current) {
        currentLangRef.current = nextLang;
      }
      lastLanguageChangeRef.current = Date.now();
      applyNow();
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);

    const intervalId = setInterval(() => {
      const next = getSelectedLanguage();
      if (next !== currentLangRef.current) {
        currentLangRef.current = next;
        lastLanguageChangeRef.current = Date.now();
        applyNow();
      }
    }, 250);

    schedule();

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      clearInterval(intervalId);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return null;
}
