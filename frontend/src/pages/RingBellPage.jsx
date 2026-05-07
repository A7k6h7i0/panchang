import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

export default function RingBellPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [isRinging, setIsRinging] = useState(false);
  const [isRingContinuously, setIsRingContinuously] = useState(false);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const bufferLoadingRef = useRef(null);
  const loopSourceRef = useRef(null);
  const loopPointsRef = useRef({ start: 0, end: 0 });
  const loopTimerRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const loopActiveRef = useRef(false);

  useEffect(() => {
    // Create audio object
    audioRef.current = new Audio("/audio/Low to high bell.mp3");
    audioRef.current.preload = "auto";

    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (loopSourceRef.current) {
        try {
          loopSourceRef.current.stop(0);
        } catch {
          // noop
        }
        try {
          loopSourceRef.current.disconnect();
        } catch {
          // noop
        }
        loopSourceRef.current = null;
      }
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      if (activeSourcesRef.current.length) {
        activeSourcesRef.current.forEach((source) => {
          try {
            source.stop(0);
          } catch {
            // noop
          }
          try {
            source.disconnect();
          } catch {
            // noop
          }
        });
        activeSourcesRef.current = [];
      }
      loopActiveRef.current = false;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  };

  const loadAudioBuffer = async () => {
    if (audioBufferRef.current) return audioBufferRef.current;
    if (bufferLoadingRef.current) return bufferLoadingRef.current;
    const ctx = getAudioContext();
    bufferLoadingRef.current = fetch("/audio/Low to high bell.mp3")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        audioBufferRef.current = buffer;
        loopPointsRef.current = detectLoopPoints(buffer);
        bufferLoadingRef.current = null;
        return buffer;
      })
      .catch((err) => {
        bufferLoadingRef.current = null;
        console.error("Error loading bell audio buffer:", err);
        return null;
      });
    return bufferLoadingRef.current;
  };

  const detectLoopPoints = (buffer) => {
    const channelCount = buffer.numberOfChannels || 1;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const threshold = 0.0006;
    const tailPad = Math.floor(sampleRate * 0.02); // keep 20ms safety tail

    let startSample = 0;
    let endSample = length - 1;

    // Find first sample above threshold
    for (let i = 0; i < length; i += 1) {
      let max = 0;
      for (let ch = 0; ch < channelCount; ch += 1) {
        const v = Math.abs(buffer.getChannelData(ch)[i]);
        if (v > max) max = v;
      }
      if (max > threshold) {
        startSample = Math.max(0, i - tailPad);
        break;
      }
    }

    // Find last sample above threshold
    for (let i = length - 1; i >= 0; i -= 1) {
      let max = 0;
      for (let ch = 0; ch < channelCount; ch += 1) {
        const v = Math.abs(buffer.getChannelData(ch)[i]);
        if (v > max) max = v;
      }
      if (max > threshold) {
        endSample = Math.min(length - 1, i + tailPad);
        break;
      }
    }

    // Convert to seconds, and ensure sane range
    const start = startSample / sampleRate;
    const end = endSample / sampleRate;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 0.2) {
      return { start: 0, end: buffer.duration };
    }
    return { start, end };
  };

  const handleRingOnce = () => {
    // Stop continuous ringing if active
    if (isRingContinuously) {
      handleStop();
    }

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.6;
      audio.loop = false;
      audio.play().catch(err => console.error("Error playing bell:", err));
      setIsRinging(true);

      // Stop after 3 seconds
      timeoutRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setIsRinging(false);
      }, 3000);
    }
  };

  const handleRingContinuously = async () => {
    if (isRingContinuously) {
      handleStop();
    } else {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const buffer = await loadAudioBuffer();
      if (!buffer) return;
      const { start, end } = loopPointsRef.current || { start: 0, end: buffer.duration };
      const loopStart = Math.max(0, start);
      const loopEnd = Math.min(buffer.duration, end || buffer.duration);
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      if (activeSourcesRef.current.length) {
        activeSourcesRef.current.forEach((source) => {
          try {
            source.stop(0);
          } catch {
            // noop
          }
          try {
            source.disconnect();
          } catch {
            // noop
          }
        });
        activeSourcesRef.current = [];
      }

      if (loopSourceRef.current) {
        try {
          loopSourceRef.current.stop(0);
        } catch {
          // noop
        }
        try {
          loopSourceRef.current.disconnect();
        } catch {
          // noop
        }
        loopSourceRef.current = null;
      }

      loopActiveRef.current = true;

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = loopStart;
      source.loopEnd = loopEnd;
      source.connect(gain).connect(ctx.destination);

      // Smooth fade-in to avoid clicks on start.
      const startTime = ctx.currentTime;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(1, startTime + 0.02);
      source.start(startTime);

      loopSourceRef.current = source;

      setIsRingContinuously(true);
      setIsRinging(true);
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    }
    loopActiveRef.current = false;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (loopSourceRef.current) {
      try {
        loopSourceRef.current.stop(0);
      } catch {
        // noop
      }
      try {
        loopSourceRef.current.disconnect();
      } catch {
        // noop
      }
      loopSourceRef.current = null;
    }
    if (activeSourcesRef.current.length) {
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop(0);
        } catch {
          // noop
        }
        try {
          source.disconnect();
        } catch {
          // noop
        }
      });
      activeSourcesRef.current = [];
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsRingContinuously(false);
    setIsRinging(false);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-3">
        <div
          className="mx-auto w-full max-w-6xl min-w-0 rounded-xl p-2"
          style={{
            background: "transparent",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow:
              "0 0 30px rgba(255, 140, 50, 0.6), 0 0 60px rgba(255, 100, 30, 0.45), inset 0 0 24px rgba(255, 140, 50, 0.18)",
          }}
        >
          <div
            className="grid grid-cols-[40px_1fr_40px] items-center gap-3 rounded-xl px-2 py-2"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.5)",
              boxShadow:
                "0 4px 20px rgba(255, 111, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(139, 69, 19, 0.3)",
            }}
          >
            <Link
              to="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amber-100 transition hover:scale-105"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="Back"
              title="Back"
            >
              {"<"}
            </Link>
            <div
              className="text-center text-lg font-black tracking-wide"
              data-no-auto-translate="true"
              style={{
                color: "#FFE8C5",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              {t.ringBellTitle || "Ring Bell"}
            </div>
            <div />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex min-h-[75vh] flex-col items-center justify-center gap-4 px-4 pb-12">
        <div
          className="flex items-center justify-center"
          style={{
            filter: isRinging
              ? "drop-shadow(0 14px 28px rgba(255, 180, 80, 0.35))"
              : "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.35))",
            transform: isRinging ? "scale(1.03)" : "scale(1)",
            transition: "transform 180ms ease, filter 180ms ease",
          }}
          aria-hidden="true"
        >
          <div
            className="flex items-center justify-center p-2 sm:p-3"
            style={{
              background: "transparent",
              boxShadow: "none",
            }}
          >
            <img
              src="/belll.png"
              alt="Bell"
              className="h-72 w-72 object-contain sm:h-[22rem] sm:w-[22rem]"
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-sm font-bold text-amber-100 text-center">
          {isRingContinuously ? (
            <span className="text-red-400">Ringing Continuously...</span>
          ) : isRinging ? (
            <span className="text-yellow-300">Ringing...</span>
          ) : (
            <span className="text-amber-200">Tap to ring the bell</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex w-full max-w-md flex-row justify-center gap-3">
          <button
            type="button"
            onClick={handleRingOnce}
            disabled={isRingContinuously}
            className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
            style={{
              background: "transparent",
              border: "2px solid rgba(255, 215, 0, 0.6)",
              color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(255, 107, 0, 0.4)",
            }}
          >
            Ring Once
          </button>
          
          <button
            type="button"
            onClick={handleRingContinuously}
            className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background: "transparent",
              border: "2px solid rgba(255, 215, 0, 0.6)",
              color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(255, 107, 0, 0.4)",
            }}
          >
            {isRingContinuously ? 'Stop' : 'Ring Continuous'}
          </button>
        </div>
      </div>
    </div>
  );
}
