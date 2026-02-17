import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "./PageShell";
import { getProkeralaFestivals } from "../services/astrologyApi";
import { getAstroDefaults } from "../utils/appSettings";

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

function normalizeFestivalItems(payload) {
  const root = payload?.data || payload;
  if (!root || typeof root !== "object") return [];

  const candidates = [
    root?.festivals,
    root?.festival,
    root?.events,
    root?.holidays,
    root?.items,
    root?.data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c) && c.length) {
      return c
        .map((it) => {
          if (!it || typeof it !== "object") return null;
          const name =
            it?.name ||
            it?.title ||
            it?.event ||
            it?.festival ||
            it?.holiday ||
            it?.description ||
            null;
          const date =
            it?.date ||
            it?.start ||
            it?.start_date ||
            it?.start_time ||
            it?.datetime ||
            it?.date_time ||
            it?.iso_date ||
            null;
          return name ? { name: String(name), date: date ? String(date) : "" } : null;
        })
        .filter(Boolean);
    }
  }

  // Some responses are a map keyed by date -> [names]
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const out = [];
    for (const [key, value] of Object.entries(root)) {
      if (Array.isArray(value)) {
        value.forEach((name) => out.push({ name: String(name), date: key }));
      } else if (value && typeof value === "object") {
        const name = value?.name || value?.title || value?.event || value?.festival;
        if (name) out.push({ name: String(name), date: value?.date ? String(value.date) : key });
      }
    }
    return out;
  }

  return [];
}

async function loadLocalFestivalItems(year, month) {
  const res = await fetch(`/data/festivals/${year}.json`);
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];

  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`;
  const out = [];

  for (const [dateKey, names] of Object.entries(data)) {
    if (!String(dateKey).startsWith(prefix) || !Array.isArray(names)) continue;
    names.forEach((name) => {
      if (name == null || name === "") return;
      out.push({ name: String(name), date: String(dateKey) });
    });
  }

  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

function extractTithiName(tithiText) {
  return String(tithiText || "").split(" upto ")[0].trim();
}

function extractPakshaName(pakshaText) {
  return String(pakshaText || "").replace(" Paksha", "").trim();
}

function getPradoshPrefix(weekday) {
  const map = {
    Monday: "Soma",
    Tuesday: "Bhauma",
    Wednesday: "Budha",
    Thursday: "Guru",
    Friday: "Shukra",
    Saturday: "Shani",
    Sunday: "Ravi",
  };
  return map[String(weekday || "").trim()] || "";
}

function inferFestivalsFromDay(day) {
  const out = [];
  const tithi = extractTithiName(day?.Tithi);
  const paksha = extractPakshaName(day?.Paksha);
  const weekday = String(day?.Weekday || "").trim();

  if (tithi === "Ekadashi") out.push("Ekadashi");
  if (tithi === "Trayodashi") {
    const pref = getPradoshPrefix(weekday);
    out.push(pref ? `${pref} Pradosh Vrat` : "Pradosh Vrat");
  }
  if (tithi === "Chaturthi" && paksha === "Krishna") out.push("Sankashti Chaturthi");
  if (tithi === "Purnima") out.push("Purnima");
  if (tithi === "Amavasya") out.push("Amavasya");
  if ((tithi === "Padyami" || tithi === "Pratipada") && paksha === "Shukla") {
    out.push("Chandra Darshana");
  }

  return out;
}

async function loadDerivedFestivalItems(year, month) {
  const res = await fetch(`/data/${year}.json`);
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  if (!Array.isArray(data) || !data.length) return [];

  const out = [];
  const targetMonth = Number(month);

  data.forEach((day) => {
    const slashDate = String(day?.date || "");
    const [dd, mm, yyyy] = slashDate.split("/");
    if (!dd || !mm || !yyyy) return;
    if (Number(mm) !== targetMonth) return;

    const dateKey = `${yyyy}-${mm}-${dd}`;
    const names = inferFestivalsFromDay(day);
    names.forEach((name) => out.push({ name, date: dateKey }));
  });

  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

export default function FestivalsPage() {
  const today = useMemo(() => ymdToParts(todayYmd()), []);
  const defaults = useMemo(() => getAstroDefaults(), []);
  const [year, setYear] = useState(today.y);
  const [month, setMonth] = useState(today.m - 1); // 0-based
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setItems(null);
    setError("");

    const y = Number(year);
    const m = Number(month) + 1;
    const date = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;

    (async () => {
      try {
        const localItems = await loadLocalFestivalItems(y, m);
        if (localItems.length) {
          setError("");
          setItems(localItems);
          return;
        }

        const derivedItems = await loadDerivedFestivalItems(y, m);
        if (derivedItems.length) {
          setError("Showing derived Panchang festivals.");
          setItems(derivedItems);
          return;
        }

        const payload = await getProkeralaFestivals(
          {
            year: y,
            month: m,
            date,
            time: "00:00",
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: defaults.la,
          },
          { signal: controller.signal }
        );
        setItems(normalizeFestivalItems(payload));
      } catch (e) {
        if (e?.name === "AbortError") return;

        setError(e?.message || "Failed to load festivals from Prokerala.");
        setItems([]);
      }
    })();

    return () => controller.abort();
  }, [year, month, defaults]);

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
    <PageShell title="Festivals">
      <div className="grid gap-4">
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="flex-1 text-center">
              <div className="mx-auto inline-flex items-center justify-center rounded-full bg-amber-400/15 px-6 py-3 text-lg font-black text-amber-100 ring-1 ring-amber-300/25">
                {MONTHS[month]} {year}
              </div>
              <div className="mt-2 text-xs text-amber-100/60">Festivals and Events in this month</div>
            </div>
            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
          {error ? <div className="text-sm font-semibold text-amber-100/80">{error}</div> : null}
          {items == null ? (
            <div className="text-sm text-amber-100/70">Loading…</div>
          ) : items.length ? (
            <div className="grid gap-3">
              {items.map((f, idx) => (
                <div
                  key={`${f.date || "date"}-${idx}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4"
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
