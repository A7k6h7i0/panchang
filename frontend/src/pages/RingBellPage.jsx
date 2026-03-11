import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function RingBellPage() {
  const [isRinging, setIsRinging] = useState(false);
  const [isRingContinuously, setIsRingContinuously] = useState(false);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const handleRingContinuously = () => {
    if (isRingContinuously) {
      handleStop();
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.6;
        audio.loop = true;
        audio.play().catch(err => console.error("Error playing bell:", err));
        setIsRingContinuously(true);
        setIsRinging(true);
      }
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
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
        background:
          "linear-gradient(180deg, rgba(10, 6, 4, 0.28) 0%, rgba(20, 10, 6, 0.42) 100%), url('/RingBell.png'), linear-gradient(135deg, rgba(74, 33, 16, 0.98) 0%, rgba(92, 42, 21, 0.95) 50%, rgba(112, 54, 27, 0.92) 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-3">
        <div
          className="mx-auto w-full max-w-6xl min-w-0 rounded-xl p-2 backdrop-blur-md"
          style={{
            background:
              "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow:
              "0 0 30px rgba(255, 140, 50, 0.6), 0 0 60px rgba(255, 100, 30, 0.45), inset 0 0 24px rgba(255, 140, 50, 0.18)",
          }}
        >
          <div
            className="grid grid-cols-[40px_1fr_40px] items-center gap-3 rounded-xl px-2 py-2"
            style={{
              background:
                "linear-gradient(135deg, #d84315 0%, #e64a19 15%, #ff6f00 35%, #ff8f00 50%, #ff6f00 65%, #e64a19 85%, #d84315 100%)",
              border: "1.5px solid rgba(255, 183, 77, 0.5)",
              boxShadow:
                "0 4px 20px rgba(255, 111, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(139, 69, 19, 0.3)",
            }}
          >
            <Link
              to="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amber-100 transition hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="Back"
              title="Back"
            >
              {"<"}
            </Link>
            <div
              className="text-center text-lg font-black tracking-wide"
              style={{
                color: "#FFE8C5",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              Ring Bell
            </div>
            <div />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-end min-h-[75vh] gap-1 px-4 pb-12">
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
        <div className="flex flex-row gap-2 w-full max-w-sm">
          <button
            type="button"
            onClick={handleRingOnce}
            disabled={isRingContinuously}
            className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)",
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
              background: isRingContinuously
                ? "linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)"
                : "linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)",
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
