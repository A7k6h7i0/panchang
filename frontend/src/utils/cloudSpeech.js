

let currentAudio = null;
let audioContext = null; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;


// Initialize audio context on first user interaction
export function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log("🔊 Audio context initialized");
  }
}

export async function speakCloud(text, language) {
  // Initialize audio context if needed
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

    const data = await res.json();
    if (!data.audio) return;

    currentAudio = new Audio("data:audio/mp3;base64," + data.audio);
    
    // Attempt to play
    const playPromise = currentAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("🔇 Audio blocked by browser - user interaction required");
      });
    }

    // Clear reference when audio ends
    currentAudio.onended = () => {
      currentAudio = null;
    };
  } catch (error) {
    console.error("Speech error:", error);
  }
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
