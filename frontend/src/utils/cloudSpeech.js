import { initTTSContext, playTTS, preloadTTS, stopSpeech } from "./ttsPlayback";

export function initAudioContext() {
  initTTSContext();
}

/**
 * Cache-first speech playback.
 * The optional third argument lets callers provide a stable cache key
 * for repeated phrases like "rahukalam_telugu".
 */
export async function speakCloud(text, language, cacheKey) {
  return playTTS(cacheKey || text, text, language);
}

export { preloadTTS, stopSpeech };
