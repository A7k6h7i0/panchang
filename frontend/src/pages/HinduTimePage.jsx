import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "./PageShell";
import { getProkeralaPanchang } from "../services/astrologyApi";
import { getAstroDefaults, loadLocation } from "../utils/appSettings";
import { buildIsoDatetime, safeDateFromIso, ymdToday } from "../astrology/components/formatters";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function computeGhati(now, sunriseIso) {
  const sunrise = safeDateFromIso(sunriseIso);
  if (!sunrise) return null;
  const deltaSec = Math.max(0, Math.floor((now.getTime() - sunrise.getTime()) / 1000));
  const ghati = Math.floor(deltaSec / 1440);
  const rem1 = deltaSec - ghati * 1440;
  const pal = Math.floor(rem1 / 24);
  const rem2 = rem1 - pal * 24;
  const vipal = Math.floor((rem2 * 60) / 24);
  return { ghati, pal, vipal, deltaSec };
}

export default function HinduTimePage() {
  const defaults = useMemo(() => getAstroDefaults(), []);
  const location = useMemo(() => loadLocation(), []);
  const [now, setNow] = useState(() => new Date());
  const [sunriseIso, setSunriseIso] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const [showConverter, setShowConverter] = useState(false);
  const [conv, setConv] = useState({ ghati: "0", pal: "0", vipal: "0" });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    (async () => {
      try {
        const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
        const payload = await getProkeralaPanchang(
          {
            date: ymdToday(),
            time,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: defaults.la,
          },
          { signal: controller.signal }
        );
        const root = payload?.data || payload;
        setSunriseIso(root?.sunrise || null);
        setError("");
      } catch (e) {
        if (e?.name === "AbortError") return;
        setSunriseIso(null);
        if (e?.status === 429 || e?.status === 403) {
          setError("");
          return;
        }
        setError(e?.message || "Failed to load sunrise.");
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.getMinutes()]);

  const gh = useMemo(() => computeGhati(now, sunriseIso), [now, sunriseIso]);
  const angle = useMemo(() => {
    if (!gh) return 0;
    const total = (gh.ghati + gh.pal / 60 + gh.vipal / 3600) % 60;
    return total * 6;
  }, [gh]);

  const convResult = useMemo(() => {
    if (!sunriseIso) return null;
    const sunrise = safeDateFromIso(sunriseIso);
    if (!sunrise) return null;
    const g = Number(conv.ghati);
    const p = Number(conv.pal);
    const v = Number(conv.vipal);
    if (![g, p, v].every((n) => Number.isFinite(n))) return null;
    const sec = g * 1440 + p * 24 + (v * 24) / 60;
    const dt = new Date(sunrise.getTime() + sec * 1000);
    return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [conv, sunriseIso]);

  return (
    <PageShell
      title="Hindu Time"
      right={
        <button
          type="button"
          onClick={() => setShowConverter((s) => !s)}
          className="rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
        >
          Converter
        </button>
      }
    >
      <div className="grid gap-4">
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_1fr] md:items-center">
            <div className="mx-auto w-full max-w-sm">
              <div className="relative mx-auto h-80 w-80">
                <div className="absolute inset-0 rounded-full border border-amber-300/25 bg-gradient-to-b from-amber-300/10 to-black/30 shadow-[0_30px_70px_rgba(0,0,0,0.55)]" />
                <div className="absolute inset-4 rounded-full border border-amber-300/15 bg-black/20" />
                <div className="absolute left-1/2 top-1/2 h-32 w-2 -translate-x-1/2 -translate-y-full rounded-full bg-amber-200 shadow-[0_0_26px_rgba(255,210,130,0.55)]"
                  style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)`, transformOrigin: "bottom center" }}
                />
                <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="text-5xl font-black text-amber-100">
                {gh ? `${pad2(gh.ghati)}:${pad2(gh.pal)}:${pad2(gh.vipal)}` : "--:--:--"}
              </div>
              <div className="mt-2 text-lg font-semibold text-amber-100/80">Ghati : Pal : Vipal</div>
              <div className="mt-6 text-4xl font-black text-amber-50">
                --:--:--
              </div>
              <div className="mt-2 text-sm text-amber-100/70">
                {location.name} • {new Date(buildIsoDatetime({ date: ymdToday(), time: "00:00", tzOffset: defaults.tzOffset })).toLocaleDateString()}
              </div>
              <div className="mt-2 text-sm text-amber-100/70">
                Sunrise {sunriseIso ? String(sunriseIso).slice(11, 16) : "--:--"} {error ? `• ${error}` : ""}
              </div>
            </div>
          </div>
        </section>

        {showConverter ? (
          <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="mx-auto max-w-4xl">
              <div className="text-base font-black text-amber-100">Ghati Pal Converter</div>
              <div className="mt-3 grid gap-3 md:grid-cols-4 md:items-end">
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">GHATI</span>
                  <input
                    value={conv.ghati}
                    onChange={(e) => setConv((s) => ({ ...s, ghati: e.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">PAL</span>
                  <input
                    value={conv.pal}
                    onChange={(e) => setConv((s) => ({ ...s, pal: e.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">VIPAL</span>
                  <input
                    value={conv.vipal}
                    onChange={(e) => setConv((s) => ({ ...s, vipal: e.target.value }))}
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                  />
                </label>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-amber-50">
                  <div className="text-xs font-black tracking-wide text-amber-100/70">CLOCK TIME</div>
                  <div className="mt-1 text-base font-black">{convResult || "—"}</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
