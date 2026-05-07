export default function SlokaList({ verses = [], selectedVerseId, onSelect, compact = false }) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wide text-amber-100">Slokas</h2>
        <span className="text-[11px] text-amber-100/70">{verses.length} verses</span>
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1"}`}>
        {verses.map((verse) => {
          const active = String(selectedVerseId) === String(verse.id);
          return (
            <button
              key={verse.id}
              type="button"
              onClick={() => onSelect?.(verse)}
              className={`rounded-xl px-3 py-2 text-left transition hover:scale-[1.01] ${
                active ? "bg-amber-400/10 ring-1 ring-amber-300/25" : "bg-transparent"
              }`}
              style={{
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-amber-50">
                  {verse.chapter}.{verse.verse}
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-amber-100/70">
                  {Array.isArray(verse.tags) ? verse.tags.slice(0, 2).join(" • ") : ""}
                </div>
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-amber-100/80">
                {verse.meaning}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
