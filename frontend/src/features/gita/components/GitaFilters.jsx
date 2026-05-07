import { GITA_THEME_ORDER, labelForTheme } from "../data/chapterThemes";

export default function GitaFilters({
  searchQuery,
  onSearchChange,
  themeFilter,
  onThemeChange,
}) {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-transparent p-3">
      <div className="grid gap-2">
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search by keyword, meaning, or verse number"
          className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-sm text-amber-50 outline-none placeholder:text-amber-100/60"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onThemeChange?.("all")}
          className="rounded-full border border-amber-300/30 bg-transparent px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
        >
          All
        </button>
        {GITA_THEME_ORDER.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => onThemeChange?.(theme)}
            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide transition ${
              themeFilter === theme
                ? "border-amber-300/25 bg-amber-400/10 text-amber-50"
                : "border-amber-300/30 bg-transparent text-amber-100 hover:bg-white/10"
            }`}
          >
            {labelForTheme(theme)}
          </button>
        ))}
      </div>
    </div>
  );
}
