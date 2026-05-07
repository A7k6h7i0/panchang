import { useEffect, useRef, useState } from "react";
import { speakCloud, stopSpeech } from "../../../utils/cloudSpeech";
import { cacheAudio } from "../utils/gitaTts";

export default function SlokaPlayer({ verse, language = "en" }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!verse) return undefined;
    cacheAudio(verse, language).catch(() => {});
    return undefined;
  }, [verse, language]);

  const stop = () => {
    cancelRef.current = true;
    stopSpeech();
    setPlaying(false);
    setLoading(false);
  };

  const play = async () => {
    if (!verse) return;
    setError("");
    setLoading(true);
    setPlaying(true);
    cancelRef.current = false;

    try {
      await speakCloud(verse.slok || "", "hi", `${verse.id}:sanskrit`);
      if (cancelRef.current) return;
      await speakCloud(verse.meaning || "", language || "en", `${verse.id}:meaning:${language || "en"}`);
    } catch (err) {
      if (!cancelRef.current) {
        setError(err?.message || "Audio playback failed.");
      }
    } finally {
      if (!cancelRef.current) {
        setPlaying(false);
      }
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playing ? stop : play}
          className="rounded-xl border border-amber-300/40 bg-transparent px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10 hover:scale-[1.01]"
        >
          {loading ? "Loading..." : playing ? "Pause" : "Play Sloka"}
        </button>
        <span className="text-[11px] font-semibold text-amber-100/70">
          Sanskrit first, then meaning
        </span>
      </div>
      {error ? (
        <div className="mt-2 text-xs font-semibold text-rose-200">{error}</div>
      ) : null}
    </div>
  );
}
