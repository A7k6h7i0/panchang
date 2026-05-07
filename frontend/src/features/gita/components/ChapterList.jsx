import { labelForTheme } from "../data/chapterThemes";

export default function ChapterList({ chapters = [], selectedChapter, onSelect }) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wide text-amber-100">Chapters</h2>
        <span className="text-[11px] text-amber-100/70">18 Adhyayas</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {chapters.map((chapter) => {
          const active = Number(selectedChapter) === Number(chapter.chapter);
          const themes = Array.isArray(chapter.themes) ? chapter.themes.slice(0, 3) : [];

          return (
            <button
              key={chapter.chapter}
              type="button"
              onClick={() => onSelect?.(chapter.chapter)}
              className={`rounded-xl p-3 text-left transition hover:scale-[1.01] ${
                active ? "bg-amber-400/10 ring-1 ring-amber-300/25" : "bg-transparent"
              }`}
              style={{
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                boxShadow: active ? "0 0 18px rgba(255, 201, 102, 0.18)" : "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">
                    Chapter {chapter.chapter}
                  </div>
                  <div className="mt-1 text-sm font-bold text-amber-50">{chapter.name}</div>
                  <div className="text-[11px] text-amber-100/70">{chapter.translation}</div>
                </div>
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-black text-amber-50"
                  style={{
                    background: active ? "rgba(255, 214, 102, 0.12)" : "transparent",
                    border: "1.5px solid rgba(255, 183, 77, 0.4)",
                  }}
                >
                  {chapter.verses_count}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100"
                  >
                    {labelForTheme(theme)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
