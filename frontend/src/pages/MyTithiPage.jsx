import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "./PageShell";
import { getLocalPanchang } from "../services/astrologyApi";
import { getAstroDefaults } from "../utils/appSettings";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "../astrology/components/formatters";
import CalendarDateInput from "../components/CalendarDateInput";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const STORAGE_KEY = "panchang:my-tithi";

function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function MyTithiPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const defaults = useMemo(() => getAstroDefaults(), []);
  const [items, setItems] = useState(() => (typeof window === "undefined" ? [] : readList()));
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(() => ymdToday());
  const [loadingId, setLoadingId] = useState(null);
  const [computed, setComputed] = useState(() => ({})); // id -> {tithi, paksha}
  const abortRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    writeList(items);
  }, [items]);

  const add = () => {
    const trimmed = label.trim();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setItems((s) => [{ id, label: trimmed || (t.my_tithi || "My Tithi"), date }, ...s]);
    setLabel("");
  };

  const remove = (id) => {
    setItems((s) => s.filter((x) => x.id !== id));
    setComputed((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
  };

  const compute = async (item) => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingId(item.id);
    try {
      const payload = await getLocalPanchang(
        {
          date: item.date,
          time: "06:00",
          lat: defaults.lat,
          lng: defaults.lng,
          tzOffset: defaults.tzOffset,
          ayanamsa: defaults.ayanamsa,
          la: defaults.la,
        },
        { signal: controller.signal }
      );
      const root = payload?.data || payload;
      const refDate = safeDateFromIso(buildIsoDatetime({ date: item.date, time: "06:00", tzOffset: defaults.tzOffset }));
      const t = findActiveByTime(root?.tithi, refDate);
      setComputed((s) => ({
        ...s,
        [item.id]: {
          tithi: t?.name || "-",
          paksha: t?.paksha || "",
        },
      }));
    } catch (e) {
      if (e?.name === "AbortError") return;
      setComputed((s) => ({
        ...s,
        [item.id]: { tithi: "Error", paksha: e?.message || "" },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <PageShell title={t.my_tithi || "My Tithi"} transparent>
      <div className="grid gap-4">
        <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="grid gap-3 md:grid-cols-[1fr_220px_140px] md:items-end">
            <label className="grid gap-1">
              <span className="text-xs font-black tracking-wide text-amber-100/70">LABEL</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                style={{ background: "transparent" }}
                placeholder={t.birthday_anniversary || "Birthday / Anniversary"}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black tracking-wide text-amber-100/70">DATE</span>
              <CalendarDateInput value={date} onChange={setDate} className="rounded-2xl px-4 py-3" transparent />
            </label>
            <button
              type="button"
              onClick={add}
              className="rounded-2xl px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-amber-300/25"
              style={{ background: "transparent" }}
            >
              Add
            </button>
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
          {items.length ? (
            <div className="grid gap-3">
              {items.map((it) => {
                const c = computed[it.id] || null;
                return (
                  <div key={it.id} className="app-surface-soft rounded-2xl p-4" style={{ background: "transparent", backdropFilter: "none" }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-black text-amber-100">{it.label}</div>
                        <div className="mt-1 text-xs text-amber-100/70">{it.date}</div>
                        {c ? (
                          <div className="mt-2 text-sm text-amber-50">
                            <span className="font-semibold">{c.tithi}</span>
                            {c.paksha ? ` • ${c.paksha}` : ""}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-amber-100/60">Tap “Fetch” to calculate tithi.</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => compute(it)}
                          disabled={loadingId === it.id}
                          className="rounded-xl px-4 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 disabled:opacity-60"
                          style={{ background: "transparent", backdropFilter: "none" }}
                        >
                          {loadingId === it.id ? "Loading…" : "Fetch"}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          className="rounded-xl px-3 py-2 text-xs font-black text-rose-200 ring-1 ring-rose-300/20"
                          style={{ background: "transparent", backdropFilter: "none" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-amber-100/70">No entries yet. Add a date above.</div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

