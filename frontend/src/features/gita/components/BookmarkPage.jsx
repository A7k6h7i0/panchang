import { Link } from "react-router-dom";

export default function BookmarkPage({ bookmarks = [], onSelect, onRemove }) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-amber-50">Bookmarked Slokas</h2>
          <p className="text-sm text-amber-100/70">Saved locally in your browser.</p>
        </div>
        <Link
          to="/gita"
          className="rounded-xl border border-amber-300/30 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
        >
          Back to Gita
        </Link>
      </div>

      <div className="mt-4 grid gap-2">
        {bookmarks.length ? (
          bookmarks.map((verse) => (
            <div
              key={verse.id}
              className="rounded-xl border border-amber-300/20 bg-white/5 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button type="button" onClick={() => onSelect?.(verse)} className="text-left">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                    Bhagavad Gita {verse.chapter}.{verse.verse}
                  </div>
                  <div className="mt-1 text-sm text-amber-50">{verse.meaning}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove?.(verse)}
                  className="rounded-lg border border-amber-300/30 bg-transparent px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-amber-300/20 bg-transparent p-3 text-sm text-amber-100">
            No bookmarks yet. Save a sloka from the detail view.
          </div>
        )}
      </div>
    </div>
  );
}
