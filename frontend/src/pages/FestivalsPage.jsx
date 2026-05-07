import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "./PageShell";
import { LANGUAGE_CHANGE_EVENT, loadLanguage } from "../utils/appSettings";
import { translateFestivalList } from "../utils/festivalTranslation";
import { translations } from "../translations";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ymdToParts(ymd) {
  const [y, m, d] = String(ymd || "").split("-");
  return { y: Number(y), m: Number(m), d: Number(d) };
}

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function loadLocalFestivalItems(year, month, language) {
  const res = await fetch(`/data/festivals/${year}.json`);
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];

  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`;
  const out = [];

  for (const [dateKey, names] of Object.entries(data)) {
    if (!String(dateKey).startsWith(prefix) || !Array.isArray(names)) continue;
    translateFestivalList(names, language, data?.festivalTranslations).forEach((name) => {
      if (name == null || name === "") return;
      out.push({ name: String(name), date: String(dateKey) });
    });
  }

  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

export default function FestivalsPage() {
  const today = useMemo(() => ymdToParts(todayYmd()), []);
  const [year, setYear] = useState(today.y);
  const [month, setMonth] = useState(today.m - 1); // 0-based
  const [language, setLanguage] = useState(loadLanguage);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const t = translations[language] || translations.en;

  useEffect(() => {
    const syncLanguage = () => setLanguage(loadLanguage());
    syncLanguage();
    window.addEventListener("storage", syncLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    };
  }, []);

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setItems(null);
    setError("");

    const y = Number(year);
    const m = Number(month) + 1;

    (async () => {
      try {
        const localItems = await loadLocalFestivalItems(y, m, language);
        setError("");
        setItems(localItems);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load local festivals.");
        setItems([]);
      }
    })();

    return () => controller.abort();
  }, [year, month, language]);

  const goPrev = () => {
    const next = new Date(year, month - 1, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const goNext = () => {
    const next = new Date(year, month + 1, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  return (
    <PageShell title={t.festivals || "Festivals"} transparent>
      <div className="grid gap-4">
        <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-2xl px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              style={{ background: "transparent" }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="flex-1 text-center">
              <div className="mx-auto inline-flex items-center justify-center rounded-full px-6 py-3 text-lg font-black text-amber-100 ring-1 ring-amber-300/25" style={{ background: "transparent" }}>
                {MONTHS[month]} {year}
              </div>
              <div className="mt-2 text-xs text-amber-100/60">Festivals and Events in this month</div>
            </div>
            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              style={{ background: "transparent" }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
          {error ? <div className="text-sm font-semibold text-amber-100/80">{error}</div> : null}
          {items == null ? (
            <div className="text-sm text-amber-100/70">Loading…</div>
          ) : items.length ? (
            <div className="grid gap-3">
              {items.map((f, idx) => (
                <div
                  key={`${f.date || "date"}-${idx}`}
                  className="app-surface-soft flex items-center justify-between gap-4 rounded-2xl p-4"
                  style={{ background: "transparent", backdropFilter: "none" }}
                >
                  <div>
                    <div className="text-base font-black text-amber-100">{String(f.name)}</div>
                    <div className="mt-1 text-xs text-amber-100/70">
                      {String(f.date || "-")}
                    </div>
                  </div>
                  <div className="text-amber-100/80">🗓</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-amber-100/70">No festivals found in this month.</div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
