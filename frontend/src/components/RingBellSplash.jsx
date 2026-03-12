import { useEffect, useMemo, useRef, useState } from "react";
import "./RingBellSplash.css";

const SESSION_KEY = "ringBellSplashSeen";

const DEFAULT_TIMINGS = {
  fadeInMs: 700,
  audioPlayMs: 3000, // Play audio for 3 seconds
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
    return { fadeInMs: 0, audioPlayMs: 1000, fadeOutMs: 200 };
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
    // Stop audio when exiting
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsExiting(true);
    schedule(() => setIsVisible(false), timings.fadeOutMs);
  };

  const startSequence = () => {
    setIsRinging(true);
    // Stop ringing after audio play duration
    schedule(() => setIsRinging(false), timings.audioPlayMs);
    // Exit after audio play duration
    schedule(() => markSeenAndExit(), timings.audioPlayMs);
  };

  const attemptPlay = () => {
    if (!audioRef.current || !bellSoundUrl) return;

    // Clear any existing timers before scheduling new ones
    clearTimers();

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
        // Even if autoplay is blocked, auto-exit after audio play duration
        schedule(() => markSeenAndExit(), timings.audioPlayMs);
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
        // Even without audio, start sequence and auto-exit
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
            Welcome to the Temple of Panchang
          </button>
        )}
      </div>
    </div>
  );
}
