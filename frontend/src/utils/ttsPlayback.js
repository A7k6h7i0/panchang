import { speakText as speakLocalText } from "./speech";
import { createTTSCacheKey, getAudio, saveAudio } from "./ttsCache";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

let currentAudio = null;
let currentObjectUrl = "";
let currentResolve = null;
let currentAbortController = null;
let audioContext = null;
let activeRequestId = 0;

function initAudioContext() {
  if (!audioContext && typeof window !== "undefined") {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioContext = new Ctx();
      console.log("Audio context initialized");
    }
  }
}

function cleanupCurrentPlayback() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
    currentAudio.onerror = null;
  }
  currentAudio = null;

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }

  if (currentResolve) {
    currentResolve({ interrupted: true });
    currentResolve = null;
  }
}

function base64ToBlob(base64, contentType = "audio/mpeg") {
  if (!base64) return null;

  const cleanBase64 = String(base64).replace(/\s+/g, "");
  const binary = window.atob(cleanBase64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: contentType });
}

async function fetchTTSBlob(text, language) {
  if (!API_BASE) return null;

  const controller = new AbortController();
  currentAbortController = controller;

  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("TTS HTTP error", res.status);
      return null;
    }

    const data = await res.json();
    if (!data?.audio) return null;

    return base64ToBlob(data.audio);
  } finally {
    window.clearTimeout(timeoutId);
    if (currentAbortController === controller) {
      currentAbortController = null;
    }
  }
}

function playBlob(blob, requestId) {
  return new Promise((resolve) => {
    if (requestId !== activeRequestId) {
      resolve({ interrupted: true });
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.preload = "auto";

    currentAudio = audio;
    currentObjectUrl = objectUrl;
    currentResolve = resolve;

    const finish = (interrupted = false) => {
      if (requestId !== activeRequestId) {
        interrupted = true;
      }

      if (currentAudio === audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }

      if (currentObjectUrl === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        currentObjectUrl = "";
      }

      if (currentResolve === resolve) {
        currentResolve({ interrupted });
        currentResolve = null;
      }
    };

    audio.onended = () => finish(false);
    audio.onerror = () => finish(true);

    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch((error) => {
        console.log("Audio playback was blocked or failed:", error);
        finish(true);
      });
    }
  });
}

export function stopSpeech() {
  activeRequestId += 1;
  cleanupCurrentPlayback();

  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function initTTSContext() {
  initAudioContext();
}

export async function playTTS(key, text, language) {
  if (!text || !language) return { interrupted: true };

  initAudioContext();
  cleanupCurrentPlayback();
  const requestId = ++activeRequestId;

  const cacheKey = createTTSCacheKey(key, language, text);

  try {
    const cachedBlob = await getAudio(cacheKey);
    if (requestId !== activeRequestId) return { interrupted: true };

    if (cachedBlob instanceof Blob) {
      return await playBlob(cachedBlob, requestId);
    }

    const fetchedBlob = await fetchTTSBlob(text, language);
    if (requestId !== activeRequestId) return { interrupted: true };

    if (!(fetchedBlob instanceof Blob)) {
      return await speakLocalText(text, language);
    }

    void saveAudio(cacheKey, fetchedBlob);
    return await playBlob(fetchedBlob, requestId);
  } catch (error) {
    if (error?.name === "AbortError") {
      return { interrupted: true };
    }

    console.error("Speech error:", error);
    if (requestId !== activeRequestId) return { interrupted: true };
    return await speakLocalText(text, language);
  }
}

export async function preloadTTS(entries = []) {
  if (!Array.isArray(entries) || !entries.length) return [];

  const tasks = entries.map(async (entry) => {
    const text = String(entry?.text || "").trim();
    const language = String(entry?.language || "").trim();
    const key = createTTSCacheKey(entry?.key, language, text);

    if (!text || !language) return false;

    const cachedBlob = await getAudio(key);
    if (cachedBlob instanceof Blob) return true;

    const fetchedBlob = await fetchTTSBlob(text, language);
    if (!(fetchedBlob instanceof Blob)) return false;

    return saveAudio(key, fetchedBlob);
  });

  return Promise.allSettled(tasks);
}
