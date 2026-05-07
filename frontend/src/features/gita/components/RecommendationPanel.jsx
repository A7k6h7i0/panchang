import { useEffect, useMemo, useRef, useState } from "react";
import { GITA_MOOD_OPTIONS } from "../data/chapterThemes";

const MOOD_LABELS = {
  calm: "Calm",
  stressed: "Stressed",
  anxious: "Anxious",
  motivated: "Motivated",
  focused: "Focused",
  tired: "Tired",
  brave: "Brave",
};

function MoodPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedValue = String(value || "").toLowerCase();
  const selectedLabel = MOOD_LABELS[normalizedValue] || "Select Mood";

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-full rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-left text-sm font-bold text-amber-100 transition-all hover:scale-[1.01] hover:bg-white/5"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="block truncate">{selectedLabel}</span>
        <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-100/70">
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          {GITA_MOOD_OPTIONS.map((item) => {
            const active = item.value === normalizedValue;
            return (
              <button
                key={item.value}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onChange?.(item.value);
                  setOpen(false);
                }}
                onClick={() => {
                  onChange?.(item.value);
                  setOpen(false);
                }}
                className={`w-full border-b px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-amber-300/25 bg-amber-400/10 text-amber-50"
                    : "border-white/10 bg-transparent text-amber-100 hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildInstantTeluguExplanation(verse, mood) {
  const verseRef = `${verse?.chapter || ""}.${verse?.verse || ""}`.replace(/^\./, "");
  const moodText = MOOD_LABELS[String(mood || "").toLowerCase()] || "your current state";

  return [
    `This sloka (${verseRef || "unknown"}) fits ${moodText.toLowerCase()}.`,
    "It is meant to steady the mind and help with clearer decision-making.",
    "Read it slowly, then reflect on one practical step you can take now.",
  ].join(" ");
}

export default function RecommendationPanel({ recommendations = [], onSelect, mood, onMoodChange, onExplain }) {
  const best = recommendations?.[0]?.verse || null;
  const bestChapter = recommendations?.[0]?.chapter || null;
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);

  const instantExplanation = useMemo(() => {
    if (!best) return "";
    return buildInstantTeluguExplanation(best, mood);
  }, [best, mood]);

  useEffect(() => {
    setExplanation("");
    setExplaining(false);
  }, [best?.id, mood]);

  const handleExplain = async () => {
    if (!best) return;
    setExplanation(instantExplanation);
    setExplaining(true);
    try {
      const payload = await onExplain?.(best);
      if (payload) setExplanation(payload);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-amber-100">Recommendations</h2>
        <span className="text-[11px] text-amber-100/70">Time + mood based</span>
      </div>

      <div className="grid gap-3">
        <MoodPicker key={String(mood || "calm").toLowerCase()} value={mood} onChange={onMoodChange} />

        {best ? (
          <div className="rounded-xl border border-amber-300/40 bg-transparent p-3">
            <button type="button" onClick={() => onSelect?.(best)} className="w-full text-left">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                {bestChapter?.name || `Chapter ${best.chapter}`} {best.chapter}.{best.verse}
              </div>
              <div className="mt-1 line-clamp-3 text-sm text-amber-50">{best.meaning}</div>
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExplain}
                className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
              >
                {explaining ? "Processing..." : "Explain"}
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-amber-300/40 bg-transparent p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
                Telugu Explanation
              </div>
              <div className="mt-1 text-sm leading-6 text-amber-50">
                {explaining ? explanation || "Processing..." : explanation || "Tap Explain for a quick explanation."}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300/40 bg-transparent p-3 text-sm text-amber-100">
            No recommendation yet.
          </div>
        )}
      </div>
    </div>
  );
}
