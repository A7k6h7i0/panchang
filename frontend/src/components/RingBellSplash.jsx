import { useEffect, useMemo, useRef, useState } from "react";
import TapIndicator from "./TapIndicator";
import "./RingBellSplash.css";

const SESSION_KEY = "ringBellSplashSeen";

const DEFAULT_TIMINGS = {
  fadeInMs: 700,
  audioPlayMs: 3000,
  fadeOutMs: 900,
};

export default function RingBellSplash({ bellSoundUrl = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsExiting(true);
    schedule(() => setIsVisible(false), timings.fadeOutMs);
  };

  const startSequence = () => {
    schedule(() => markSeenAndExit(), timings.audioPlayMs);
  };

  const attemptPlay = () => {
    if (!audioRef.current || !bellSoundUrl) return;

    clearTimers();

    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.6;

    audioRef.current
      .play()
      .then(() => {
        startSequence();
      })
      .catch(() => {
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
      style={{
        background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
      }}
    >
      <div className="ring-bell-splash__content">
        <div className="ring-bell-splash__headline">
          <span className="ring-bell-splash__headline-line">Introducing history’s first</span>
          <span className="ring-bell-splash__headline-line ring-bell-splash__headline-line--accent">
            Talking Panchang Calendar.
          </span>
        </div>
        <img className="ring-bell-splash__logo" src="/logo.png" alt="Panchang logo" />

        <div className="ring-bell-splash__cta">
          <button
            className="ring-bell-splash__button"
            type="button"
            onClick={attemptPlay}
          >
            Welcome to the Temple of Panchang
          </button>
          <TapIndicator />
        </div>
      </div>
    </div>
  );
}
