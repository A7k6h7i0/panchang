import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProkeralaPanchang } from "./services/astrologyApi";
import { getAstroDefaults, LANGUAGE_CHANGE_EVENT, loadLanguage, saveLanguage } from "./utils/appSettings";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "./astrology/components/formatters";
import { languages, translations } from "./translations";

const VOICE_KEY = "panchang:voice-enabled";
const VIEW_STATE_KEY = "panchang:current-view";


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

function getTimeRangeText(item) {
  if (!item || typeof item !== "object") return "";
  const start = toHHMM(item?.start);
  const end = toHHMM(item?.end);
  if (start && end) return `${start} - ${end}`;
  return end || start || "";
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

function loadInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const saved = loadLanguage();
  return languages.some((l) => l.code === saved) ? saved : "en";
}

function loadInitialVoiceEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VOICE_KEY) === "1";
}


function Tile({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(255,178,51,0.5)]"
      style={{
        background: "var(--calendar-orange-gradient)",
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
  const [languagePopupOpen, setLanguagePopupOpen] = useState(false);
  const [language, setLanguage] = useState(loadInitialLanguage);
  const [voiceEnabled, setVoiceEnabled] = useState(loadInitialVoiceEnabled);
  const [now, setNow] = useState(() => new Date());
  const [panchang, setPanchang] = useState(null);
  const [error, setError] = useState("");
  const [settingsNonce, setSettingsNonce] = useState(0);
  const abortRef = useRef(null);
  const titleByLanguage = translations[language]?.appTitle || "Talking Calendar";


  const defaults = useMemo(() => {
    void settingsNonce;
    return getAstroDefaults();
  }, [settingsNonce]);


  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (loadLanguage() !== language) saveLanguage(language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  useEffect(() => {
    if (!languagePopupOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLanguagePopupOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [languagePopupOpen]);


  useEffect(() => {
    const refresh = () => setSettingsNonce((n) => n + 1);
    const syncLanguage = () => {
      const next = loadInitialLanguage();
      setLanguage((prev) => (prev === next ? prev : next));
      refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", syncLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
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
            la: language,
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
  }, [now.getMinutes(), settingsNonce, language]);


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
    const activeYoga = findActiveByTime(panchang?.yoga, refDate);
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
      yoga: firstText(activeYoga?.name),
      yogaFull: activeYoga,
      lunarMonth,
      nakshatra: firstText(activeNakshatra?.name),
      nakshatraFull: activeNakshatra,
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

  const openDailyHoroscope = () => {
    try {
      sessionStorage.setItem(VIEW_STATE_KEY, "rashiphalalu");
    } catch {
      // ignore sessionStorage failures
    }
    navigate("/month-view");
  };
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Segoe UI', 'Inter', 'Trebuchet MS', sans-serif",
        background: "radial-gradient(ellipse at top, #2a1810 0%, #1a0d08 40%, #0d0504 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-36 pt-0 md:max-w-6xl md:px-6 md:pb-40">
        <header 
          className="mb-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-1 py-1 transition-all duration-300"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-base font-black flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
                border: "2px solid rgba(255, 140, 50, 0.8)",
                color: "#FFD54F",
              }}
              title="Swastik"
            >{"\u5350"}</div>
          </div>
          <div className="min-w-0 px-0.5">
            <div
              className="whitespace-nowrap font-black leading-tight tracking-tight"
              style={{
                color: "#FFFFFF",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.85), 0 6px 18px rgba(255, 140, 50, 0.45)",
                lineHeight: "1",
                letterSpacing: "0.02em",
                fontSize: "clamp(0.82rem, 4.2vw, 1.35rem)",
                fontWeight: "900",
              }}
            >
              {titleByLanguage}
            </div>
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                color: "#FFE4B5",
                border: "2px solid rgba(255, 140, 50, 0.7)",
                boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
              }}
              aria-label={voiceEnabled ? "Mute enabled" : "Mute disabled"}
              title={voiceEnabled ? "Mute enabled" : "Mute disabled"}
            >
              {voiceEnabled ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73z" />
                  <path d="M15 11.01V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setLanguagePopupOpen(true)}
              className="inline-flex h-7 min-w-[54px] items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black outline-none transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                color: "#FFF4D8",
                border: "2px solid rgba(255, 140, 50, 0.7)",
                boxShadow: "0 0 12px rgba(255, 140, 50, 0.45), inset 0 0 8px rgba(255, 200, 100, 0.25)",
              }}
              aria-label="Open language selector"
            >
              <span>{String(language || "").toUpperCase()}</span>
              <span aria-hidden="true" className="text-[10px]">▼</span>
            </button>
            <Link
              to="/settings"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                color: "#FFF5E1",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="Settings">{"\u2699"}</Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="h-7 w-7 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                color: "#FFF5E1",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 224, 130, 0.3)",
              }}
              aria-label="Open menu"
            >{"\u2630"}</button>
          </div>
        </header>


        <div
          className="rounded-xl p-2 backdrop-blur-md"
          style={{
            background: "var(--calendar-orange-shell)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: "0 0 35px rgba(255, 140, 50, 0.8), 0 0 70px rgba(255, 100, 30, 0.6), inset 0 0 30px rgba(255, 140, 50, 0.2)",
          }}
        >
          <section 
            className="rounded-2xl px-4 py-5 text-center transition-all duration-300"
            style={{
              background: "var(--calendar-orange-gradient)",
              border: "2px solid rgba(255, 193, 7, 0.5)",
              boxShadow: "0 8px 32px rgba(255, 152, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -3px 0 rgba(139, 69, 19, 0.25), 0 0 40px rgba(255, 183, 77, 0.2)",
            }}
          >
          {/* Date and Day Row */}
          <div className="mb-4 flex items-start gap-3">
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

            {/* Weekday and Date/Time */}
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg sm:text-xl font-bold" style={{ color: "#FFF5E6", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                  {summary?.weekday ? cleanDash(summary.weekday) : "-"}
                </div>
              </div>
              <div className="text-xs sm:text-sm font-medium" style={{ color: "#FFE8C5" }}>
                <span>{formattedDate}, </span><span className="whitespace-nowrap">{formattedTime}</span>
              </div>
            </div>
            {summary?.headlineTime && (
              <div
                className="ml-auto inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "1.5px solid rgba(255, 140, 50, 0.65)",
                  boxShadow: "0 0 10px rgba(255, 140, 50, 0.35), inset 0 0 8px rgba(255, 200, 100, 0.15)",
                }}
              >
                <span style={{ color: "#FFD700" }}>Hindu Time:</span>
                <span className="ml-1" style={{ color: "#FFF5E6" }}>{summary.headlineTime}</span>
              </div>
            )}
          </div>

          {/* Primary row: Thithi -> Nakshatra -> Yoga (always side by side) */}
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {summary?.tithi && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u25CF"} {cleanDash(summary.tithi)}</span>
                  {getTimeRangeText(summary.tithiFull) ? (
                    <span className="text-[10px] text-amber-100/80">{getTimeRangeText(summary.tithiFull)}</span>
                  ) : null}
                </div>
              </div>
            )}

            {summary?.nakshatra && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u2726"} {cleanDash(summary.nakshatra)}</span>
                  {getTimeRangeText(summary.nakshatraFull) ? (
                    <span className="text-[10px] text-amber-100/80">{getTimeRangeText(summary.nakshatraFull)}</span>
                  ) : null}
                </div>
              </div>
            )}

            {summary?.yoga && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u263C"} {cleanDash(summary.yoga)}</span>
                  {getTimeRangeText(summary.yogaFull) ? (
                    <span className="text-[10px] text-amber-100/80">{getTimeRangeText(summary.yogaFull)}</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Secondary row: Paksha + Karana + Choghadiya (same row) */}
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {summary?.paksha && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u25D0"} {cleanDash(summary.paksha)}</span>
                  {getTimeRangeText(summary.tithiFull) ? (
                    <span className="text-[10px] text-amber-100/80">{getTimeRangeText(summary.tithiFull)}</span>
                  ) : null}
                </div>
              </div>
            )}

            {summary?.karana && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u25D1"} {cleanDash(summary.karana)}</span>
                  {getTimeRangeText(summary.karanaFull) ? (
                    <span className="text-[10px] text-amber-100/80">{getTimeRangeText(summary.karanaFull)}</span>
                  ) : null}
                </div>
              </div>
            )}

            {summary?.choghadiya && (
              <div
                className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 15px rgba(255, 140, 50, 0.5), inset 0 0 10px rgba(255, 200, 100, 0.2)",
                }}
              >
                <div className="flex min-w-0 flex-col leading-tight text-center">
                  <span>{"\u29D7"} {cleanDash(summary.choghadiya)}</span>
                </div>
              </div>
            )}
          </div>

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
        </div>

        <div
          className="mt-1 rounded-xl p-2 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(74, 33, 16, 0.98) 0%, rgba(92, 42, 21, 0.95) 50%, rgba(112, 54, 27, 0.92) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.7)",
            boxShadow: "0 0 25px rgba(120, 58, 26, 0.55), inset 0 0 18px rgba(170, 94, 43, 0.2)",
          }}
        >
          <button
            type="button"
            onClick={openDailyHoroscope}
            className="w-full rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "var(--calendar-orange-gradient)",
              border: "2.5px solid rgba(212, 168, 71, 0.8)",
              color: "#ffedb3",
              boxShadow:
                "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            Daily Horoscope
          </button>
        </div>


        <div
          className="mt-1 rounded-xl p-2 backdrop-blur-md"
          style={{
            background: "var(--calendar-orange-shell)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: "0 0 35px rgba(255, 140, 50, 0.8), 0 0 70px rgba(255, 100, 30, 0.6), inset 0 0 30px rgba(255, 140, 50, 0.2)",
          }}
        >
          <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
            {TILES.map((tile) => (
              <Tile key={tile.to} {...tile} />
            ))}
          </section>
        </div>
      </div>


      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="mx-auto w-full max-w-md px-4 pb-3 md:max-w-6xl md:px-6">
          <section 
            className="grid grid-cols-4 rounded-2xl p-2 text-center transition-all duration-300"
            style={{
              background: "var(--calendar-orange-gradient)",
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
                background: "var(--calendar-orange-gradient)",
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
              background: "var(--calendar-orange-gradient)",
              boxShadow: "4px 0 30px rgba(255, 111, 0, 0.45)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div 
                className="text-lg font-semibold"
                style={{
                  color: "#FFF1DA",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)",
                }}
              >
                Menu
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-1 text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "var(--calendar-orange-gradient)",
                  color: "#FFF1DA",
                  boxShadow: "0 2px 8px rgba(255, 111, 0, 0.35)",
                  border: "1px solid rgba(255, 183, 77, 0.45)",
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
                    background: "var(--calendar-orange-gradient)",
                    color: "#FFE8C5",
                    boxShadow: "0 2px 10px rgba(255, 152, 0, 0.3), inset 0 1px 0 rgba(255, 220, 160, 0.22)",
                    border: "1px solid rgba(255, 183, 77, 0.35)",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      {languagePopupOpen ? (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setLanguagePopupOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-4 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #4a0e0e 0%, #d8691e 50%, #4a0e0e 100%)",
              border: "2px solid rgba(255, 220, 150, 0.85)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-lg font-bold text-orange-300">Select Language</h3>
            <div className="max-h-60 overflow-y-auto rounded-lg p-2" style={{ background: "linear-gradient(180deg, rgba(255, 110, 40, 0.35) 0%, rgba(255, 90, 25, 0.25) 100%)" }}>
              {languages.map((lang) => {
                const isActive = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      saveLanguage(lang.code);
                      setLanguagePopupOpen(false);
                    }}
                    className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-orange-500 text-white shadow-lg" : "bg-orange-700/95 text-orange-100 hover:bg-orange-600"
                    }`}
                  >
                    {String(lang.code || "").toUpperCase()} {lang.nativeName ? `• ${lang.nativeName}` : ""}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setLanguagePopupOpen(false)}
              className="mt-3 w-full rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}



