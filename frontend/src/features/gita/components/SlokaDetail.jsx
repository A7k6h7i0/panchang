import SlokaPlayer from "./SlokaPlayer";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-amber-300/40 bg-transparent p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">{label}</div>
      <div className="mt-1 text-sm text-amber-50">{value}</div>
    </div>
  );
}

export default function SlokaDetail({
  verse,
  chapter,
  language = "en",
  bookmarked = false,
  onBookmark,
}) {
  if (!verse) {
    return (
      <div className="rounded-2xl border border-amber-300/40 bg-transparent p-4 text-sm text-amber-100">
        Select a sloka to see details.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-100">
            Bhagavad Gita {verse.chapter}.{verse.verse}
          </div>
          <h3 className="mt-1 text-lg font-black text-amber-50">
            {chapter?.name || `Chapter ${verse.chapter}`}
          </h3>
          <p className="text-[11px] text-amber-100/70">
            {chapter?.translation || chapter?.summary?.en || ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onBookmark?.(verse)}
          className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
        >
          {bookmarked ? "Remove Bookmark" : "Bookmark"}
        </button>
      </div>

      <div className="mt-4">
        <SlokaPlayer verse={verse} language={language} />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <DetailRow label="Sanskrit" value={verse.slok} />
        <DetailRow label="Meaning" value={verse.meaning} />
      </div>
    </div>
  );
}
