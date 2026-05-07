import { useEffect, useMemo, useRef, useState } from "react";
import SlokaPlayer from "./SlokaPlayer";

export default function DailySlokaCard({
  daily,
  language = "en",
  explainLanguage = "te",
  explainLanguageOptions = [],
  onExplainLanguageChange,
  onExplain,
  onBookmark,
  bookmarked = false,
  explanation = "",
  explainLoading = false,
  currentMode = "",
}) {
  const [localBookmarked, setLocalBookmarked] = useState(Boolean(bookmarked));
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageMenuRef = useRef(null);

  const processingMessage = useMemo(() => {
    const labels = {
      en: "Processing...",
      te: "Processing...",
      hi: "Processing...",
      ta: "Processing...",
      kn: "Processing...",
      ml: "Processing...",
    };
    return labels[explainLanguage] || labels.te;
  }, [explainLanguage]);

  const selectedLanguageLabel = useMemo(() => {
    const selected = explainLanguageOptions.find((option) => option.code === explainLanguage);
    return selected?.name || explainLanguage.toUpperCase();
  }, [explainLanguage, explainLanguageOptions]);

  useEffect(() => {
    if (!languageOpen) return undefined;

    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [languageOpen]);

  if (!daily?.verse) {
    return (
      <div className="rounded-3xl border border-amber-300/40 bg-transparent p-4">
        <div className="text-sm font-bold text-amber-100">Loading today&apos;s Gita sloka...</div>
      </div>
    );
  }

  const { verse } = daily;

  return (
    <div className="rounded-3xl border border-amber-300/40 bg-transparent p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
            Daily Gita Insight
          </div>
          <h2 className="mt-1 text-xl font-black text-amber-50">
            Bhagavad Gita {verse.chapter}.{verse.verse}
          </h2>
        </div>
      </div>

      <div className="mt-4">
        <SlokaPlayer verse={verse} language={language} />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Sanskrit</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-50">{verse.slok}</div>
        </div>
        <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Meaning</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-50">{verse.meaning}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative" ref={languageMenuRef}>
          <button
            type="button"
            onClick={() => setLanguageOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
          >
            <span>Explain in</span>
            <span className="text-amber-50">{selectedLanguageLabel}</span>
            <span aria-hidden="true">▾</span>
          </button>

          {languageOpen ? (
            <div
              className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl p-2 shadow-2xl"
              style={{
                background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
              }}
            >
              <div className="max-h-60 overflow-y-auto rounded-xl p-1 bg-transparent">
                {explainLanguageOptions.map((option) => {
                  const isActive = option.code === explainLanguage;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        onExplainLanguageChange?.(option.code);
                        setLanguageOpen(false);
                      }}
                      className={`mb-1 block w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all ${
                        isActive
                          ? "border-amber-300/25 bg-amber-400/10 text-amber-50"
                          : "border-transparent bg-transparent text-amber-100 hover:bg-white/5"
                      }`}
                    >
                      {option.name || option.code}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onExplain?.(verse, explainLanguage)}
          className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
        >
          Explain
        </button>
        <button
          type="button"
          onClick={() => {
            setLocalBookmarked((prev) => !prev);
            onBookmark?.(verse);
          }}
          className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
        >
          {localBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <span className="rounded-xl px-3 py-2 text-xs font-semibold text-amber-100/70">
          Mode: {currentMode || daily.mode}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/40 bg-transparent p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Explain</div>
        <div className="mt-2 text-sm leading-6 text-amber-50">
          {explainLoading
            ? processingMessage
            : explanation || "Tap Explain to see a simple explanation in the selected language."}
        </div>
      </div>
    </div>
  );
}
