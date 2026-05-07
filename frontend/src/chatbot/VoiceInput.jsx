import { useEffect, useRef, useState, useCallback } from "react";

const labels = {
  en: {
    unsupported: "Your browser does not support voice input",
    permissionDenied: "Microphone permission denied",
    title: "Voice Input",
  },
  te: {
    unsupported: "మీ బ్రౌజర్ వాయిస్ ఇన్‌పుట్ ను సపోర్ట్ చేయదు",
    permissionDenied: "మైక్ అనుమతి ఇవ్వలేదు",
    title: "వాయిస్ ఇన్‌పుట్",
  },
  hi: {
    unsupported: "आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता",
    permissionDenied: "माइक अनुमति नहीं मिली",
    title: "वॉइस इनपुट",
  },
};

function getL(language) {
  return labels[language] || labels.en;
}

function getRecognitionLanguage(language) {
  const map = {
    en: "en-IN",
    te: "te-IN",
    hi: "hi-IN",
    ml: "ml-IN",
    kn: "kn-IN",
    ta: "ta-IN",
    gu: "gu-IN",
    bn: "bn-IN",
    mrw: "hi-IN",
  };

  return map[language] || "en-IN";
}

export default function VoiceInput({
  onTranscript,
  settings,
  isOpen = true,
  resetSignal = 0,
  onToggleSpeech,
}) {
  const l = getL(settings.language);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const labelsRef = useRef(l);
  const startingRef = useRef(false);
  const listeningRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    labelsRef.current = l;
  }, [l]);

  const setListeningState = useCallback((value) => {
    listeningRef.current = value;
    setIsListening(value);
    if (!value) {
      startingRef.current = false;
    }
  }, []);

  const finalizeRecognition = useCallback((recognitionInstance, updateState = true) => {
    if (recognitionRef.current === recognitionInstance) {
      recognitionRef.current = null;
    }
    startingRef.current = false;
    if (updateState) {
      setListeningState(false);
    }
  }, [setListeningState]);

  const stopRecognition = useCallback((updateState = true) => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // noop
      }
      finalizeRecognition(recognition, updateState);
      return;
    }
    if (updateState) {
      setListeningState(false);
    }
  }, [finalizeRecognition, setListeningState]);

  const createRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      return null;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.maxAlternatives = 1;
    recognitionInstance.lang = getRecognitionLanguage(settings.language);

    recognitionInstance.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        onTranscriptRef.current?.(transcript);
      }

      try {
        recognitionInstance.stop();
      } catch {
        // noop
      }
      finalizeRecognition(recognitionInstance);
    };

    recognitionInstance.onerror = (event) => {
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        alert(labelsRef.current.permissionDenied);
      }
      finalizeRecognition(recognitionInstance);
    };

    recognitionInstance.onstart = () => {
      setListeningState(true);
    };

    recognitionInstance.onend = () => {
      finalizeRecognition(recognitionInstance);
    };

    recognitionRef.current = recognitionInstance;
    return recognitionInstance;
  }, [finalizeRecognition, setListeningState, settings.language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.lang = getRecognitionLanguage(settings.language);
    }
  }, [settings.language]);

  useEffect(() => {
    if (!isOpen) {
      stopRecognition();
    }
  }, [isOpen, stopRecognition]);

  useEffect(() => {
    stopRecognition();
  }, [resetSignal, stopRecognition]);

  useEffect(() => {
    return () => {
      stopRecognition(false);
    };
  }, [stopRecognition]);

  const toggleListening = () => {
    onToggleSpeech?.();

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert(l.unsupported);
      return;
    }

    if (listeningRef.current) {
      stopRecognition();
      return;
    }

    if (startingRef.current) return;

    const recognition = recognitionRef.current || createRecognition();
    if (!recognition) {
      alert(l.unsupported);
      return;
    }

    try {
      startingRef.current = true;
      recognition.lang = getRecognitionLanguage(settings.language);
      recognition.start();
      setListeningState(true);
    } catch {
      finalizeRecognition(recognition, false);
      setListeningState(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border ${
        isListening
          ? "bg-red-500 border-red-500 animate-pulse"
          : "bg-[rgba(255,248,237,0.96)] border-[rgba(255,183,77,0.35)] hover:bg-[rgba(255,183,77,0.16)]"
      } ${!isListening ? "chatbot-mic-idle" : ""}`}
      style={!isListening ? { color: "#000" } : undefined}
      title={l.title}
      aria-label={l.title}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-5 h-5 ${isListening ? "text-white" : "text-black"}`}
        style={!isListening ? { color: "#000" } : undefined}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0a5 5 0 0 0 10 0Z" />
      </svg>
    </button>
  );
}
