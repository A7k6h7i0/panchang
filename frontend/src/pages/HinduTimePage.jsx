import { useEffect, useMemo, useRef, useState } from "react";
import { buildIsoDatetime, safeDateFromIso, ymdToday } from "../astrology/components/formatters";
import { useLanguage } from "../hooks/useLanguage";
import { getLocalPanchang } from "../services/astrologyApi";
import { tr } from "../translations";
import { getAstroDefaults, loadLocation } from "../utils/appSettings";
import PageShell from "./PageShell";

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
  const { language } = useLanguage();
  const defaults = useMemo(() => getAstroDefaults(), []);
  const location = useMemo(() => loadLocation(), []);
  const [now, setNow] = useState(() => new Date());
  const [sunriseIso, setSunriseIso] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const [showConverter, setShowConverter] = useState(false);
  const [conv, setConv] = useState({ ghati: "0", pal: "0", vipal: "0" });
  const todayKey = ymdToday();

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
        // Sunrise changes only by date, so avoid minute-wise refetch/rate-limit churn.
        const time = "06:00";
        const payload = await getLocalPanchang(
          {
            date: todayKey,
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
        if (root?.sunrise) {
          setSunriseIso(root.sunrise);
        }
        setError("");
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (e?.status === 429 || e?.status === 403) {
          setError("");
          return;
        }
        setError(e?.message || tr("hinduTimeFailedSunrise", "Failed to load sunrise.", language));
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const gh = useMemo(() => computeGhati(now, sunriseIso), [now, sunriseIso]);
  const hinduAngle = useMemo(() => {
    if (!gh) return 0;
    const total = (gh.ghati + gh.pal / 60 + gh.vipal / 3600) % 60;
    return total * 6;
  }, [gh]);
  const hourAngle = useMemo(() => ((now.getHours() % 12) + now.getMinutes() / 60) * 30, [now]);
  const minuteAngle = useMemo(() => (now.getMinutes() + now.getSeconds() / 60) * 6, [now]);
  const secondAngle = useMemo(() => now.getSeconds() * 6, [now]);

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
      title={<span data-no-auto-translate="true">{tr("hinduTimeTitle", "Hindu Time", language)}</span>}
      transparent
      right={
        <button
          type="button"
          onClick={() => setShowConverter((s) => !s)}
          className="rounded-xl border border-amber-300/25 px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
          style={{ background: "transparent" }}
        >
          <span data-no-auto-translate="true">{tr("hinduTimeConverter", "Converter", language)}</span>
        </button>
      }
    >
      <div className="grid gap-4" data-no-auto-translate="true">
        <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_1fr] md:items-center">
            <div className="mx-auto w-full max-w-sm">
              <div
                className="relative mx-auto h-80 w-80 rounded-full border border-amber-300/25"
                style={{
                  background:
                    "radial-gradient(circle at 50% 42%, rgba(255, 244, 220, 0.08) 0%, rgba(255, 244, 220, 0.03) 18%, rgba(73, 8, 12, 1) 52%, rgba(46, 5, 8, 1) 100%)",
                  boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.45), 0 30px 70px rgba(0,0,0,0.55)",
                }}
              >
                <div className="absolute inset-0 rounded-full border border-amber-300/25 shadow-[0_30px_70px_rgba(0,0,0,0.55)]" style={{ background: "transparent", backdropFilter: "none" }} />
                <div className="absolute inset-2 rounded-full border border-amber-300/20" style={{ background: "transparent", backdropFilter: "none" }} />
                <svg id="hindu-time-clock-svg" viewBox="0 0 320 320" className="hindu-time-clock absolute inset-0 h-full w-full">
                  <defs>
                    <filter id="hGlow">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="hTextGlow">
                      <feGaussianBlur stdDeviation="0.8" result="textBlur" />
                      <feMerge>
                        <feMergeNode in="textBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <circle className="hindu-time-face" cx="160" cy="160" r="128" fill="#210406" stroke="rgba(255,210,130,0.28)" strokeWidth="1.5" />
                  <circle className="hindu-time-inner-ring" cx="160" cy="160" r="112" fill="none" stroke="rgba(255,241,214,0.12)" strokeWidth="1" />

                  {Array.from({ length: 60 }).map((_, i) => {
                    const a = (i * 6 - 90) * (Math.PI / 180);
                    const major = i % 5 === 0;
                    const r1 = major ? 111 : 116;
                    const r2 = 124;
                    const x1 = 160 + r1 * Math.cos(a);
                    const y1 = 160 + r1 * Math.sin(a);
                    const x2 = 160 + r2 * Math.cos(a);
                    const y2 = 160 + r2 * Math.sin(a);
                    return (
                      <line
                        key={`tick-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className={major ? "hindu-time-tick hindu-time-tick-major" : "hindu-time-tick hindu-time-tick-minor"}
                        stroke={major ? "rgba(255,227,165,0.9)" : "rgba(255,227,165,0.48)"}
                        strokeWidth={major ? "1.8" : "1"}
                      />
                    );
                  })}

                  {Array.from({ length: 12 }).map((_, i) => {
                    // Clock numbers 1 to 12
                    const hour = i === 0 ? 12 : i;
                    const label = String(hour);
                    const a = (i * 30 - 90) * (Math.PI / 180);
                    const x = 160 + 101 * Math.cos(a);
                    const y = 160 + 101 * Math.sin(a);
                    return (
                      <text
                        key={`label-${i}`}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="hindu-time-label"
                        fill="#FFF9F0"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {label}
                      </text>
                    );
                  })}

                  <g transform={`rotate(${hourAngle} 160 160)`}>
                    <line className="hindu-time-hand hindu-time-hour-hand" x1="160" y1="160" x2="160" y2="106" stroke="#FFF9F0" strokeWidth="5" strokeLinecap="round" />
                  </g>
                  <g transform={`rotate(${minuteAngle} 160 160)`}>
                    <line className="hindu-time-hand hindu-time-minute-hand" x1="160" y1="160" x2="160" y2="92" stroke="#FFF9F0" strokeWidth="3.6" strokeLinecap="round" />
                  </g>
                  <g transform={`rotate(${secondAngle} 160 160)`}>
                    <line className="hindu-time-hand hindu-time-second-hand" x1="160" y1="165" x2="160" y2="84" stroke="#FFF9F0" strokeWidth="1.4" strokeLinecap="round" />
                  </g>

                  <g transform={`rotate(${hinduAngle} 160 160)`}>
                    <line className="hindu-time-hand hindu-time-hindu-hand" x1="160" y1="160" x2="160" y2="78" stroke="#f5c242" strokeWidth="14" strokeLinecap="round" />
                  </g>

                  <circle className="hindu-time-center" cx="160" cy="160" r="8" fill="#f5d470" />
                </svg>
              </div>
            </div>

            <div className="text-center md:text-left">
              <div className="text-5xl font-black text-amber-100">
                {gh ? `${pad2(gh.ghati)}:${pad2(gh.pal)}:${pad2(gh.vipal)}` : "--:--:--"}
              </div>
              <div className="mt-2 text-lg font-semibold text-amber-100/80">{tr("hinduTimeGhatiPalVipal", "Ghati : Pal : Vipal", language)}</div>
              <div className="mt-6 text-4xl font-black text-amber-50">
                {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="mt-2 text-sm text-amber-100/70">
                {location.name} • {new Date(buildIsoDatetime({ date: ymdToday(), time: "00:00", tzOffset: defaults.tzOffset })).toLocaleDateString()}
              </div>
              <div className="mt-2 text-sm text-amber-100/70">
                {tr("hinduTimeSunrise", "Sunrise", language)} {sunriseIso ? String(sunriseIso).slice(11, 16) : "--:--"} {error ? `• ${error}` : ""}
              </div>
            </div>
          </div>
        </section>

        {showConverter ? (
          <section className="app-surface rounded-3xl p-5" style={{ background: "transparent", backdropFilter: "none" }}>
            <div className="mx-auto max-w-4xl">
              <div className="text-base font-black text-amber-100">{tr("hinduTimeConverterTitle", "Ghati Pal Converter", language)}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-4 md:items-end">
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">{tr("hinduTimeGhati", "GHATI", language)}</span>
                  <input
                    value={conv.ghati}
                    onChange={(e) => setConv((s) => ({ ...s, ghati: e.target.value }))}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                    style={{ background: "transparent" }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">{tr("hinduTimePal", "PAL", language)}</span>
                  <input
                    value={conv.pal}
                    onChange={(e) => setConv((s) => ({ ...s, pal: e.target.value }))}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                    style={{ background: "transparent" }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black tracking-wide text-amber-100/70">{tr("hinduTimeVipal", "VIPAL", language)}</span>
                  <input
                    value={conv.vipal}
                    onChange={(e) => setConv((s) => ({ ...s, vipal: e.target.value }))}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-amber-50 outline-none focus:border-amber-300/35"
                    style={{ background: "transparent" }}
                  />
                </label>
                <div className="app-surface-soft rounded-2xl px-4 py-3 text-amber-50" style={{ background: "transparent", backdropFilter: "none" }}>
                  <div className="text-xs font-black tracking-wide text-amber-100/70">{tr("hinduTimeClockTime", "CLOCK TIME", language)}</div>
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

