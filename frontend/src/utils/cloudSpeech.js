let currentAudio = null;
let audioContext = null;

// Use env, works in dev & production (Vercel/Netlify/etc)
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Initialize audio context on first user interaction
export function initAudioContext() {
  if (!audioContext && typeof window !== "undefined") {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioContext = new Ctx();
      console.log("🔊 Audio context initialized");
    }
  }
}

/**
 * Core play function. Ensures:
 * - any previous audio stops before new starts
 * - caller can await completion (returns a Promise that resolves on end)
 */
export async function speakCloud(text, language) {
  if (!text || !language) return;

  initAudioContext();

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  try {
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) {
      console.error("TTS HTTP error", res.status);
      return;
    }

    const data = await res.json();
    if (!data.audio) return;

    currentAudio = new Audio("data:audio/mp3;base64," + data.audio);

    return new Promise((resolve) => {
      const finish = () => {
        currentAudio = null;
        resolve();
      };

      currentAudio.onended = finish;
      currentAudio.onerror = finish;

      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log(
            "🔇 Audio blocked by browser (needs user interaction):",
            err
          );
          finish();
        });
      }
    });
  } catch (error) {
    console.error("Speech error:", error);
    currentAudio = null;
  }
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
