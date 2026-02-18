import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProkeralaPanchang } from "./services/astrologyApi";
import { getAstroDefaults } from "./utils/appSettings";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "./astrology/components/formatters";


const TILES = [
  { to: "/month-view", title: "Month View", subtitle: "Phase and Tithi for month", icon: "▦" },
  { to: "/panchang", title: "Panchang", subtitle: "Day View, Sun and Moon rise/set times", icon: "⌖" },
  { to: "/festivals", title: "Festivals", subtitle: "Festival and event dates", icon: "✹" },
  { to: "/my-tithi", title: "My Tithi", subtitle: "Add and track your own tithis", icon: "◉" },
  { to: "/kundali", title: "Kundali", subtitle: "Time view, Planet Ephemeris, Lagna", icon: "✳" },
  { to: "/matchmaking", title: "Match Making", subtitle: "Guna Milan with Ashta Koota", icon: "◔" },
  { to: "/muhurat", title: "Muhurt", subtitle: "Muhurta, Choghadiya and Hora", icon: "◷" },
  { to: "/hindu-time", title: "Hindu Time", subtitle: "Watch Ishtkaal i.e Ghati or Nazhika", icon: "◴" },
  { to: "/settings", title: "Settings", subtitle: "Change location and preferences", icon: "⚙" },
  { to: "/info", title: "Info", subtitle: "Information about Hindu Calendar", icon: "?" },
];


const MENU_LINKS = [
  ["/month-view", "Month View"],
  ["/panchang", "Panchang"],
  ["/festivals", "Festivals"],
  ["/my-tithi", "My Tithi"],
  ["/kundali", "Kundali"],
  ["/matchmaking", "Match Making"],
  ["/muhurat", "Muhurt"],
  ["/hindu-time", "Hindu Time"],
  ["/compass", "Compass"],
  ["/sankalp-mantra", "Sankalp Mantra"],
  ["/info", "Info"],
];


function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      String(
        value?.name ??
          value?.vedic_name ??
          value?.title ??
          value?.value ??
          value?.label ??
          value?.display_name ??
          ""
      ).trim()
    );
  }
  return "";
}


function firstText(...values) {
  for (const v of values) {
    const t = textOf(v);
    if (t) return t;
  }
  return "";
}


function cleanDash(value) {
  if (!value) return "";
  const str = String(value).trim();
  return str.replace(/^\s*-\s*|\s*-\s*$/g, "").trim();
}


function joinClean(parts, sep = ", ") {
  return parts.map(v => cleanDash(textOf(v))).filter(Boolean).join(sep);
}


function pad2(n) {
  return String(n).padStart(2, "0");
}


function toHHMM(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  if (s.includes("T") && s.length >= 16) return s.slice(11, 16);
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}


function computeGhati(now, sunriseIso) {
  const sunrise = safeDateFromIso(sunriseIso);
  if (!sunrise) return null;
  const deltaSec = Math.max(0, Math.floor((now.getTime() - sunrise.getTime()) / 1000));
  return {
    ghati: Math.floor(deltaSec / 1440),
    pal: Math.floor((deltaSec % 1440) / 24),
  };
}


function shareApp() {
  const url = window.location.origin;
  const text = "Hindu Calendar";
  if (navigator.share) return navigator.share({ title: text, text, url });
  return navigator.clipboard?.writeText(url);
}


function Tile({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(255,178,51,0.5)]"
      style={{
        background: "linear-gradient(135deg, #ff6b35 0%, #ff8c42 25%, #ffa94d 50%, #ff8c42 75%, #ff6b35 100%)",
        border: "1.5px solid rgba(255, 200, 87, 0.6)",
        boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(139, 69, 19, 0.2)",
      }}
    >
      <div 
        className="mx-auto mb-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full text-lg"
        style={{
          background: "linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 50%, #f39c12 100%)",
          color: "#8B4513",
          boxShadow: "0 2px 8px rgba(253, 203, 110, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
        }}
      >
        {icon}
      </div>
      <div 
        className="text-[13px] font-bold leading-tight"
        style={{
          color: "#FFF9F0",
          textShadow: "0 1px 3px rgba(139, 69, 19, 0.4)",
        }}
      >
        {title}
      </div>
      <div 
        className="mt-1 text-[10px] leading-3"
        style={{
          color: "#FFE8C5",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
        }}
      >
        {subtitle}
      </div>
    </Link>
  );
}


export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [panchang, setPanchang] = useState(null);
  const [error, setError] = useState("");
  const [settingsNonce, setSettingsNonce] = useState(0);
  const abortRef = useRef(null);


  const defaults = useMemo(() => {
    void settingsNonce;
    return getAstroDefaults();
  }, [settingsNonce]);


  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    const refresh = () => setSettingsNonce((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);


  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");


    const run = async () => {
      try {
        const payload = await getProkeralaPanchang(
          {
            date: ymdToday(),
            time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: defaults.la,
          },
          { signal: controller.signal }
        );
        setPanchang(payload?.data || payload || null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setPanchang(null);
        setError(e?.message || "Failed to load Panchang");
      }
    };


    const t = setTimeout(run, 320);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [now.getMinutes(), settingsNonce]);


  const summary = useMemo(() => {
    if (!panchang) return null;
    const refDate = safeDateFromIso(
      buildIsoDatetime({
        date: ymdToday(),
        time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
        tzOffset: defaults.tzOffset,
      })
    );


    const activeTithi = findActiveByTime(panchang?.tithi, refDate);
    const activeNakshatra = findActiveByTime(panchang?.nakshatra, refDate);
    const activeChoghadiya = findActiveByTime(panchang?.choghadiya, refDate);
    const activeKarana = findActiveByTime(panchang?.karana, refDate);
    const ghati = computeGhati(now, panchang?.sunrise);


    const paksha = firstText(activeTithi?.paksha, panchang?.paksha, panchang?.advanced?.paksha);
    const weekday = firstText(
      panchang?.vaara,
      panchang?.weekday,
      panchang?.day,
      panchang?.advanced?.vaara,
      panchang?.advanced?.weekday
    );
    const lunarMonth = firstText(
      panchang?.lunar_month?.name,
      panchang?.lunar_month,
      panchang?.masa,
      panchang?.advanced?.lunar_month?.name,
      panchang?.advanced?.lunar_month,
      panchang?.advanced?.masa
    );
    const samvatsara = firstText(
      panchang?.samvatsara?.name,
      panchang?.samvatsara,
      panchang?.advanced?.samvatsara?.name,
      panchang?.advanced?.samvatsara
    );
    const purnimanthaMonth = firstText(
      panchang?.purnimantha_month?.name,
      panchang?.purnimanta_month?.name,
      panchang?.lunar_month?.purnimanta_name,
      panchang?.advanced?.purnimantha_month?.name,
      panchang?.advanced?.purnimanta_month?.name,
      panchang?.advanced?.lunar_month?.purnimanta_name
    );
    const ayana = firstText(
      panchang?.ayana?.name,
      panchang?.ayana,
      panchang?.advanced?.ayana?.name,
      panchang?.advanced?.ayana
    );
    const ritu = firstText(
      panchang?.ritu?.name,
      panchang?.ritu,
      panchang?.advanced?.ritu?.name,
      panchang?.advanced?.ritu,
      panchang?.season
    );


    const choghadiyaText = joinClean(
      [
        cleanDash(activeChoghadiya?.name),
        joinClean([toHHMM(activeChoghadiya?.start), toHHMM(activeChoghadiya?.end)], " - "),
      ],
      " "
    );


    return {
      headlineTime: ghati ? `${pad2(ghati.ghati)}:${pad2(ghati.pal)}` : "",
      tithi: firstText(activeTithi?.name),
      tithiFull: activeTithi,
      paksha,
      karana: firstText(activeKarana?.name),
      karanaFull: activeKarana,
      lunarMonth,
      nakshatra: firstText(activeNakshatra?.name),
      weekday,
      choghadiya: choghadiyaText,
      panchaka: firstText(panchang?.panchaka?.name, panchang?.panchaka),
      samvatsara,
      purnimanthaMonth,
      ayana,
      ritu,
    };
  }, [panchang, now, defaults.tzOffset]);


  const formattedTime = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [now]
  );
  const formattedDate = useMemo(
    () => now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }),
    [now]
  );


  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Segoe UI', 'Inter', 'Trebuchet MS', sans-serif",
        background: "radial-gradient(ellipse at top, #2a1810 0%, #1a0d08 40%, #0d0504 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-36 pt-4 md:max-w-6xl md:px-6 md:pb-40">
        <header 
          className="mb-3 grid grid-cols-[40px_1fr_84px] items-center gap-2 rounded-xl px-2 py-2 transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #d84315 0%, #e64a19 15%, #ff6f00 35%, #ff8f00 50%, #ff6f00 65%, #e64a19 85%, #d84315 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.5)",
            boxShadow: "0 4px 20px rgba(255, 111, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(139, 69, 19, 0.3)",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="h-9 w-9 rounded-lg text-xl transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
              color: "#FFF5E1",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 224, 130, 0.3)",
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div 
            className="text-center text-xl font-bold tracking-[0.01em] md:text-2xl"
            style={{
              color: "#FFF9F0",
              textShadow: "0 2px 8px rgba(255, 183, 77, 0.6), 0 0 20px rgba(255, 152, 0, 0.3)",
            }}
          >
            Hindu Calendar
          </div>
          <div className="flex justify-end gap-2">
            <Link
              to="/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                color: "#FFF5E1",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="Settings"
            >
              ⚙
            </Link>
            <button
              type="button"
              className="h-9 w-9 rounded-lg text-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                color: "#FFF5E1",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="More"
            >
              ⋮
            </button>
          </div>
        </header>


        <section 
          className="rounded-2xl px-4 py-5 text-center transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #d84315 0%, #e64a19 10%, #ff6f00 30%, #ff8f00 50%, #ff6f00 70%, #e64a19 90%, #d84315 100%)",
            border: "2px solid rgba(255, 193, 7, 0.5)",
            boxShadow: "0 8px 32px rgba(255, 152, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -3px 0 rgba(139, 69, 19, 0.25), 0 0 40px rgba(255, 183, 77, 0.2)",
          }}
        >
          {/* Date and Day Row */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Day Number Circle */}
            <div
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                border: "3px solid rgba(255, 200, 110, 0.95)",
                boxShadow: "0 0 20px rgba(255, 140, 50, 0.6), 0 0 40px rgba(255, 100, 30, 0.4), inset 0 0 15px rgba(255, 200, 100, 0.2)",
              }}
            >
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: "#D4AF37", textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)" }}>
                {now.getDate()}
              </span>
            </div>

            {/* Weekday */}
            <div className="text-left">
              <div className="text-lg sm:text-xl font-bold" style={{ color: "#FFF5E6", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                {summary?.weekday ? cleanDash(summary.weekday) : "-"}
              </div>
              <div className="text-xs sm:text-sm font-medium" style={{ color: "#FFE8C5" }}>
                {formattedTime}, {formattedDate}
              </div>
            </div>
          </div>

          {/* Tithi and Karana Row */}
          {summary?.tithi && (
            <div className="text-sm font-semibold mb-2" style={{ color: "#FFE8C5", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
              <span>● {cleanDash(summary.tithi)}</span>
              {summary?.karana && <span className="ml-3">● Karana: {cleanDash(summary.karana)}</span>}
            </div>
          )}

          {/* Paksha, Nakshatra, Yoga Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {summary?.paksha && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <span style={{ color: "#D4AF37" }}>◐</span>
                {cleanDash(summary.paksha)}
              </div>
            )}

            {summary?.nakshatra && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                ✦ {cleanDash(summary.nakshatra)}
              </div>
            )}

            {summary?.lunarMonth && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                ◈ {cleanDash(summary.lunarMonth)}
              </div>
            )}
          </div>

          {/* Hindu Time */}
          {summary?.headlineTime && (
            <div className="text-2xl font-semibold mb-2" style={{ color: "#FFD700", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              Hindu Time: <span style={{ color: "#FFF5E6" }}>{summary.headlineTime}</span>
            </div>
          )}

          {/* Choghadiya and Panchaka */}
          {summary?.choghadiya || summary?.panchaka ? (
            <div className="mt-2 flex items-center justify-center gap-4 text-xs">
              {summary?.choghadiya ? (
                <div className="font-medium" style={{ color: "#FFE082", textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)" }}>
                  Choghadiya: <span style={{ color: "#FFF9C4", textShadow: "0 0 8px rgba(255, 249, 196, 0.5)" }}>{cleanDash(summary.choghadiya)}</span>
                </div>
              ) : null}
              {summary?.panchaka ? (
                <div className="font-medium" style={{ color: "#FFCCBC", textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)" }}>
                  Panchak: <span style={{ color: "#FFE0B2", textShadow: "0 0 8px rgba(255, 224, 178, 0.5)" }}>{cleanDash(summary.panchaka)}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div 
              className="mt-2 text-xs"
              style={{
                color: "#FFCDD2",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              {error}
            </div>
          ) : null}
        </section>


        <section className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {TILES.map((tile) => (
            <Tile key={tile.to} {...tile} />
          ))}
        </section>
      </div>


      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="mx-auto w-full max-w-md px-4 pb-3 md:max-w-6xl md:px-6">
          <section 
            className="grid grid-cols-4 rounded-2xl p-2 text-center transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #bf360c 0%, #d84315 20%, #e64a19 40%, #ff6f00 60%, #e64a19 80%, #d84315 90%, #bf360c 100%)",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              boxShadow: "0 -4px 20px rgba(255, 111, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(139, 69, 19, 0.2)",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/compass")}
              className="rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE8C5",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="text-lg">⌖</div>
              Compass
            </button>
            <button
              type="button"
              onClick={() => navigate("/sankalp-mantra")}
              className="rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE8C5",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="text-lg">ॐ</div>
              Sankalp
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE8C5",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="text-lg">i</div>
              About
            </button>
            <button
              type="button"
              onClick={() => shareApp()}
              className="rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE8C5",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="text-lg">↗</div>
              Share
            </button>
          </section>


          {(summary?.purnimanthaMonth || summary?.samvatsara || summary?.ayana || summary?.ritu) ? (
            <section 
              className="mt-3 rounded-2xl px-4 py-3 text-center transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #bf360c 0%, #d84315 15%, #e64a19 35%, #ff6f00 50%, #e64a19 65%, #d84315 85%, #bf360c 100%)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                boxShadow: "0 4px 16px rgba(255, 111, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(139, 69, 19, 0.2)",
              }}
            >
              {joinClean([summary?.purnimanthaMonth, summary?.samvatsara]) ? (
                <div 
                  className="text-[13px] font-semibold"
                  style={{
                    color: "#FFE8C5",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {joinClean([summary?.purnimanthaMonth, summary?.samvatsara])}
                </div>
              ) : null}
              {joinClean([summary?.ayana, summary?.ritu]) ? (
                <div 
                  className="text-[12px] mt-1"
                  style={{
                    color: "#FFECB3",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.25), 0 0 10px rgba(255, 236, 179, 0.3)",
                  }}
                >
                  {joinClean([summary?.ayana, summary?.ritu])}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>


      {menuOpen ? (
        <div className="fixed inset-0 z-30">
          <button 
            type="button" 
            onClick={() => setMenuOpen(false)} 
            className="absolute inset-0"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(2px)",
            }}
          />
          <aside 
            className="absolute left-0 top-0 h-full w-[82%] max-w-sm p-4"
            style={{
              background: "linear-gradient(180deg, #FFF8E1 0%, #FFECB3 50%, #FFE0B2 100%)",
              boxShadow: "4px 0 30px rgba(255, 111, 0, 0.3)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div 
                className="text-lg font-semibold"
                style={{
                  color: "#6D4C41",
                  textShadow: "0 1px 2px rgba(255, 193, 7, 0.3)",
                }}
              >
                Menu
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-1 text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #FFE082 0%, #FFD54F 100%)",
                  color: "#6D4C41",
                  boxShadow: "0 2px 6px rgba(255, 193, 7, 0.3)",
                }}
              >
                Close
              </button>
            </div>
            <nav className="grid gap-2">
              {MENU_LINKS.map(([to, label]) => (
                <Link
                  key={`menu-${to}`}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)",
                    color: "#6D4C41",
                    boxShadow: "0 2px 8px rgba(255, 152, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    border: "1px solid rgba(255, 193, 7, 0.2)",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
