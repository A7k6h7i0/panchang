import { useEffect, useMemo, useRef, useState } from "react";
import "./RingBellSplash.css";

const SESSION_KEY = "ringBellSplashSeen";

const DEFAULT_TIMINGS = {
  fadeInMs: 700,
  ringMs: 1400,
  holdMs: 600,
  fadeOutMs: 900,
};

const DEFAULT_BG_URL =
  "https://i.ibb.co/pBKzKBWj/Chat-GPT-Image-Mar-11-2026-11-41-42-AM.png";

export default function RingBellSplash({
  backgroundUrl = DEFAULT_BG_URL,
  bellSoundUrl = "",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef(null);
  const timersRef = useRef([]);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const timings = useMemo(() => {
    if (!prefersReducedMotion) return DEFAULT_TIMINGS;
    return { fadeInMs: 0, ringMs: 400, holdMs: 200, fadeOutMs: 200 };
  }, [prefersReducedMotion]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  const schedule = (fn, delay) => {
    const timer = setTimeout(fn, delay);
    timersRef.current.push(timer);
  };

  const markSeenAndExit = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsExiting(true);
    schedule(() => setIsVisible(false), timings.fadeOutMs);
  };

  const startSequence = () => {
    setIsRinging(true);
    schedule(() => setIsRinging(false), timings.ringMs);
    schedule(() => markSeenAndExit(), timings.ringMs + timings.holdMs);
  };

  const attemptPlay = () => {
    if (!audioRef.current || !bellSoundUrl) return;

    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.6;

    audioRef.current
      .play()
      .then(() => {
        setAutoplayBlocked(false);
        startSequence();
      })
      .catch(() => {
        setAutoplayBlocked(true);
      });
  };

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY) === "1";
    if (seen) return;

    setIsVisible(true);

    if (bellSoundUrl) {
      const audio = new Audio(bellSoundUrl);
      audio.preload = "auto";
      audioRef.current = audio;
    }

    const handleEnded = () => {
      if (!isExiting) markSeenAndExit();
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleEnded);
    }

    schedule(() => {
      if (bellSoundUrl) {
        attemptPlay();
      } else {
        startSequence();
      }
    }, timings.fadeInMs);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`ring-bell-splash ${isExiting ? "ring-bell-splash--exit" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Temple bell welcome screen"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="ring-bell-splash__overlay" />
      <div className="ring-bell-splash__content">
        <div
          className={`ring-bell-splash__bell ${isRinging ? "is-ringing" : ""} ${
            prefersReducedMotion ? "reduce-motion" : ""
          }`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 128 160"
            className="ring-bell-splash__bell-icon"
            focusable="false"
            aria-hidden="true"
          >
            <path
              d="M64 10c-22 0-40 18-40 40v34c0 6-2 11-6 16l-7 8c-2 3 0 7 4 7h98c4 0 6-4 4-7l-7-8c-4-5-6-10-6-16V50c0-22-18-40-40-40z"
              fill="currentColor"
            />
            <circle cx="64" cy="126" r="10" fill="currentColor" />
            <path
              d="M44 140c6 8 13 12 20 12s14-4 20-12"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="ring-bell-splash__glow" />
        </div>

        <div className="ring-bell-splash__text">Panchang</div>
        <div className="ring-bell-splash__subtext">
          A moment of peace before the day begins
        </div>

        {autoplayBlocked && bellSoundUrl && (
          <button
            className="ring-bell-splash__button"
            type="button"
            onClick={attemptPlay}
          >
            Enter Temple
          </button>
        )}
      </div>
    </div>
  );
}
