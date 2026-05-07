import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso } from "./astrology/components/formatters";
import Rashiphalalu from "./components/Rashiphalalu";
import Chatbot from "./components/Chatbot";
import CountrySelectorButton from "./components/CountrySelectorButton";
import YearSelectorPopup from "./components/YearSelectorPopup";
import { UiIcon } from "./components/UiIcons";
import { getLocalPanchang } from "./services/astrologyApi";
import { ensureLanguageLoaded, initialLanguageReady, languages, translateText, translations } from "./translations";
import LocalizedTimeRange from "./components/LocalizedTimeRange";
import {
  COUNTRY_CHANGE_EVENT,
  LANGUAGE_CHANGE_EVENT,
  formatTimeInTimeZone,
  getCountryAstroDefaults,
  getTimePartsInTimeZone,
  loadCountry,
  loadLanguage,
  normalizeCountryKey,
  saveCountry,
  saveLanguage,
} from "./utils/appSettings";
import { findLocalDayByYmd, normalizeDayRecord } from "./utils/localPanchang";
import { translateFestivalList } from "./utils/festivalTranslation";

const VOICE_KEY = "panchang:voice-enabled";
const VIEW_STATE_KEY = "panchang:current-view";
const ALARM_STORAGE_KEY = "panchangAlarmSettings";
const PANCHANG_RETURN_KEY = "panchang:return-to-panel";
const REMINDER_TIME_OPTIONS = [15, 30, 60, 90, 120];
const THICK_YELLOW = "#FFD700";

const WEEKDAY_AUDIO_FILES = {
  Sunday: "/audio/Sunday.mp3",
  Monday: "/audio/Monday.mp3",
  Tuesday: "/audio/Tuesday.mp3",
  Wednesday: "/audio/Wednesday.mp3",
  Thursday: "/audio/Thrusday.mp3",
  Friday: "/audio/Friday.mp3",
  Saturday: "/audio/Saturday.mp3",
};

const defaultAlarmSettings = {
  enabledMuhurtas: {
    rahu: true,
    yamaganda: true,
    gulika: true,
    durmuhurtham: true,
    varjyam: true,
  },
  audioEnabled: true,
  reminderTime: 60,
  silentMode: false,
  disabledDays: [],
};

function loadInitialPanchangOpen() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PANCHANG_RETURN_KEY) === "1";
  } catch {
    return false;
  }
}


function getTiles(t) {
  return [
    { to: "/month-view", title: t.tileMonthView || "Month View", subtitle: t.tileMonthViewSub || "Phase and Tithi for month", icon: "month" },
    { to: "/panchang", title: t.tilePanchang || "Panchang", subtitle: t.tilePanchangSub || "Day View, Sun and Moon rise/set times", icon: "panchang" },
    { to: "/festivals", title: t.tileFestivals || "Festivals", subtitle: t.tileFestivalsSub || "Festival and event dates", icon: "festivals" },
    { to: "/my-tithi", title: t.tileMyTithi || "My Tithi", subtitle: t.tileMyTithiSub || "Add and track your own tithis", icon: "myTithi" },
    { to: "/kundali", title: t.tileKundali || "Kundali", subtitle: t.tileKundaliSub || "Time view, Planet Ephemeris, Lagna", icon: "kundali" },
    { to: "/matchmaking", title: t.tileMatchMaking || "Match Making", subtitle: t.tileMatchMakingSub || "Guna Milan with Ashta Koota", icon: "matchmaking" },
    { to: "/muhurat", title: t.tileMuhurt || "Muhurt", subtitle: t.tileMuhurtSub || "Muhurta, Choghadiya and Hora", icon: "muhurt" },
    { to: "/hindu-time", title: t.tileHinduTime || "Hindu Time", subtitle: t.tileHinduTimeSub || "Watch Ishtkaal i.e Ghati or Nazhika", icon: "hinduTime" },
    { to: "/about", title: t.about || "About", subtitle: "Terms, Disclaimers and App Info", icon: "about" },
    { to: "/settings", title: t.tileSettings || "Settings", subtitle: t.tileSettingsSub || "Change location and preferences", icon: "settings" }
  ];
}


function getMenuLinks(t) {
  return [
    ["/month-view", t.tileMonthView || "Month View"],
    ["/panchang", t.tilePanchang || "Panchang"],
    ["/festivals", t.tileFestivals || "Festivals"],
    ["/my-tithi", t.tileMyTithi || "My Tithi"],
    ["/kundali", t.tileKundali || "Kundali"],
    ["/matchmaking", t.tileMatchMaking || "Match Making"],
    ["/muhurat", t.tileMuhurt || "Muhurt"],
    ["/hindu-time", t.tileHinduTime || "Hindu Time"],
    ["/gita", t.gita || "Bhagavad Gita"],
    ["/compass", t.tileCompass || "Compass"],
    ["/sankalp-mantra", t.tileSankalp || "Sankalp Mantra"],
  ];
}


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

function normalizeSamvatsara(raw) {
  if (!raw) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const tokens = text.split(/\s+/);
  const filtered = tokens.filter((token) => {
    if (/^\d+$/.test(token)) return false;
    const lower = token.toLowerCase();
    if (lower === "shaka" || lower === "samvat") return false;
    return true;
  });
  let yearKey = filtered.join(" ").trim() || text;
  if (yearKey === "Vishvavasu") yearKey = "Vishwavasu";
  return yearKey;
}

function stripFromLabel(value) {
  const text = textOf(value);
  if (!text) return "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^from\b/i.test(trimmed)) return "";
  return trimmed;
}


function joinClean(parts, sep = ", ") {
  return parts.map(v => cleanDash(textOf(v))).filter(Boolean).join(sep);
}

function isInauspiciousText(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return false;
  return [
    "rahu",
    "yamaganda",
    "gulika",
    "durmuhur",
    "varjyam",
    "rog",
    "udveg",
    "inauspicious",
  ].some((token) => text.includes(token));
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

function formatTimeValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("T")) {
    const d = safeDateFromIso(raw);
    if (d) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }
  return raw;
}

function getTimeRangeText(item, referenceDate, monthNames, monthNamesShort) {
  if (!item || typeof item !== "object") return "";
  return (
    <LocalizedTimeRange
      startIso={item?.start}
      endIso={item?.end}
      referenceDate={referenceDate}
      monthNames={monthNames}
      monthNamesShort={monthNamesShort}
    />
  );
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


function loadInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const saved = loadLanguage();
  return languages.some((l) => l.code === saved) ? saved : "en";
}

function loadInitialVoiceEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VOICE_KEY) === "1";
}

function Tile({ to, icon, title, subtitle, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-2xl p-3 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(255,178,51,0.5)]"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        boxShadow: "none",
      }}
    >
      <div
        className="home-tile-icon mx-auto mb-1.5 inline-flex items-center justify-center"
        style={{
          color: THICK_YELLOW,
        }}
      >
        <UiIcon name={icon} size={20} color={THICK_YELLOW} />
      </div>
      <div
        className="home-tile-title text-[13px] font-extrabold leading-tight"
        style={{
          color: "#FFF9F0",
          textShadow: "0 1px 3px rgba(139, 69, 19, 0.4)",
        }}
      >
        {title}
      </div>
      <div
        className="home-tile-subtitle mt-1 text-[10px] leading-3"
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

function HomeNavButton({ label, onClick, shellless = false }) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className="home-nav-btn home-highlight-text relative w-full rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        color: "#FFE11A",
        boxShadow:
          "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
      }}
    >
      <span className="home-highlight-text block text-center">{label}</span>
    </button>
  );

  if (shellless) return button;

  return (
    <div
      className="rounded-xl p-2 backdrop-blur-md home-panel-bg"
      style={{
        background: "transparent",
        border: "0",
        boxShadow: "none",
      }}
    >
      {button}
    </div>
  );
}

function formatPanchangStartLine(entry, monthNames, monthNamesShort, timeZone, startsLabel, displayDateKey) {
  if (!entry || typeof entry !== "object") return "";
  const start = safeDateFromIso(entry.start);
  if (!start) return "";
  const displayDate = displayDateKey ? safeDateFromIso(`${displayDateKey}T12:00:00`) : null;
  const dateSource = displayDate || start;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "2-digit",
    month: "short",
  }).formatToParts(dateSource);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const day = map.day || String(dateSource.getDate()).padStart(2, "0");
  const monthIndex = Number(new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric" }).format(dateSource)) - 1;
  const monthName =
    monthNames?.[monthIndex] ||
    monthNamesShort?.[monthIndex] ||
    map.month ||
    new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(dateSource);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(start);
  return `(${cleanDash(entry?.name || "")} ${startsLabel || "starts"} ${timeText} on ${day} ${monthName})`;
}

function buildNextDetailRecord(dayRecord, fieldName, fallbackStartField) {
  const value = dayRecord?.[fieldName];
  const start = value?.start || dayRecord?.[`${fieldName}Start`] || dayRecord?.[fallbackStartField];
  const name = value?.name || value || "";
  if (!start || !name) return null;
  return { name, start };
}

function PanchangInlineRow({ label, value, range, detail }) {
  const danger = isInauspiciousText(label) || isInauspiciousText(value);
  return (
    <div
      className={`home-panchang-row mb-3.5 flex min-w-0 flex-col gap-0.5 text-[17px] leading-tight font-bold sm:mb-3.5 sm:gap-0.5 sm:text-[17px] ${danger ? "home-panchang-danger" : ""}`}
      style={{
        background: "transparent",
        border: "0",
        color: "#FFE4B5",
        boxShadow: "none",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="home-panchang-label shrink-0 whitespace-nowrap text-[16px] font-semibold sm:text-[16px]" style={{ color: "#FFD39A" }}>
          {label}:
        </span>
        <span className="home-panchang-value min-w-0 truncate whitespace-nowrap text-[17px] font-extrabold sm:text-[17px]">{cleanDash(value)}</span>
      </div>
      {range ? (
        <span className="home-panchang-range block min-w-0 whitespace-normal leading-snug text-[16px] text-amber-100/80 font-bold sm:text-[16px]">
          {range}
        </span>
      ) : null}
      {detail ? (
        <span className="home-panchang-range home-panchang-detail mt-0.5 block min-w-0 whitespace-normal text-left leading-snug text-[16px] text-amber-100/70 font-semibold sm:text-[16px]">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "").split("-").map((value) => Number(value));
  if (![year, month, day].every(Number.isFinite)) return null;
  return { year, month, day };
}

function shiftDateKey(dateKey, offsetDays) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + offsetDays, 12, 0, 0));
  return `${String(shifted.getUTCFullYear()).padStart(4, "0")}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(
    shifted.getUTCDate()
  ).padStart(2, "0")}`;
}

function slashDateToYmd(dateStr) {
  const [day, month, year] = String(dateStr || "").split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
}

function getPickerParts(dateKey) {
  const parsed = parseDateKey(dateKey);
  return parsed || { year: 0, month: 1, day: 1 };
}

function PanchangCarouselSlide({
  dateKey,
  language,
  defaults,
  currentTimeParts,
  now,
  t,
  nextDayRecordNormalized,
  onPrevDay,
  onNextDay,
  onDateClick,
  festivals: festivalsProp = null,
}) {
  const [panchang, setPanchang] = useState(null);
  const [dayRecord, setDayRecord] = useState(null);
  const [festivals, setFestivals] = useState([]);
  const [festivalsLoaded, setFestivalsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const localizedMonths = t.months || translations.en.months;
  const localizedMonthsShort = t.monthsShort || translations.en.monthsShort;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setIsTranslating(true);
      setError("");
      try {
        const payload = await getLocalPanchang(
          {
            date: dateKey,
            time: `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: language,
          },
          { signal: controller.signal }
        );
        if (!active) return;
        setPanchang(payload?.data || payload || null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (!active) return;
        setPanchang(null);
        setError(e?.message || "Failed to load Panchang");
      } finally {
        if (active) setIsTranslating(false);
      }
    };

    const loadDayRecord = async () => {
      try {
        const record = await findLocalDayByYmd(dateKey, { signal: controller.signal });
        if (!active) return;
        setDayRecord(record || null);
      } catch {
        if (!active) return;
        setDayRecord(null);
      }
    };

    load();
    loadDayRecord();

    return () => {
      active = false;
      controller.abort();
    };
  }, [dateKey, language, defaults.ayanamsa, defaults.lat, defaults.lng, defaults.tzOffset, currentTimeParts.hour, currentTimeParts.minute]);

  useEffect(() => {
    let active = true;
    setFestivals([]);
    setFestivalsLoaded(false);

    const directPropFestivals = Array.isArray(festivalsProp) ? festivalsProp : [];
    if (directPropFestivals.length > 0) {
      setFestivals(translateFestivalList(directPropFestivals, language));
      setFestivalsLoaded(true);
      return () => {
        active = false;
      };
    }

    const directFestivals = Array.isArray(dayRecord?.Festivals) ? dayRecord.Festivals : [];
    if (directFestivals.length > 0) {
      setFestivals(translateFestivalList(directFestivals, language));
      setFestivalsLoaded(true);
      return () => {
        active = false;
      };
    }

    const festivalDateKey = slashDateToYmd(dayRecord?.date) || dateKey;
    const year = String(festivalDateKey || "").slice(0, 4);
    if (!year) return () => {
      active = false;
    };

    (async () => {
      try {
        const res = await fetch(`/data/festivals/${year}.json`);
        if (!active) return;
        if (!res.ok) {
          setFestivalsLoaded(true);
          return;
        }
        const data = await res.json().catch(() => null);
        const dayFestivals = data?.[festivalDateKey] || data?.[dateKey] || [];
        setFestivals(translateFestivalList(dayFestivals, language, data?.festivalTranslations));
        setFestivalsLoaded(true);
      } catch {
        if (!active) return;
        setFestivals([]);
        setFestivalsLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [dateKey, dayRecord, festivalsProp, language]);

  const summary = useMemo(() => {
    if (!panchang && !dayRecord) return null;

    const refDate = safeDateFromIso(
      buildIsoDatetime({
        date: dateKey,
        time: `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`,
        tzOffset: defaults.tzOffset,
      })
    );

    const activeTithi = findActiveByTime(panchang?.tithi, refDate);
    const activeNakshatra = findActiveByTime(panchang?.nakshatra, refDate);
    const activeYoga = findActiveByTime(panchang?.yoga, refDate);
    const activeKarana = findActiveByTime(panchang?.karana, refDate);
    const ghati = computeGhati(now, panchang?.sunrise);

    const pakshaRaw = firstText(activeTithi?.paksha, panchang?.paksha, panchang?.advanced?.paksha, dayRecord?.Paksha);
    const weekdayRaw = firstText(panchang?.vaara, panchang?.weekday, panchang?.day, dayRecord?.Weekday);
    const lunarMonthRaw = firstText(
      panchang?.lunar_month?.name,
      panchang?.lunar_month,
      panchang?.masa,
      panchang?.advanced?.lunar_month?.name,
      panchang?.advanced?.lunar_month,
      panchang?.advanced?.masa
    );
    const samvatsaraRaw = firstText(
      panchang?.samvatsara?.name,
      panchang?.samvatsara,
      panchang?.advanced?.samvatsara?.name,
      panchang?.advanced?.samvatsara,
      dayRecord?.["Shaka Samvat"]
    );
    const purnimanthaMonthRaw = firstText(
      panchang?.purnimantha_month?.name,
      panchang?.purnimanta_month?.name,
      panchang?.lunar_month?.purnimanta_name,
      panchang?.advanced?.purnimantha_month?.name,
      panchang?.advanced?.purnimanta_month?.name,
      panchang?.advanced?.lunar_month?.purnimanta_name
    );
    const ayanaRaw = firstText(
      panchang?.ayana?.name,
      panchang?.ayana,
      panchang?.advanced?.ayana?.name,
      panchang?.advanced?.ayana
    );
    const rituRaw = firstText(
      panchang?.ritu?.name,
      panchang?.ritu,
      panchang?.advanced?.ritu?.name,
      panchang?.advanced?.ritu,
      panchang?.season
    );

    return {
      headlineTime: ghati ? `${pad2(ghati.ghati)}:${pad2(ghati.pal)}` : "",
      tithi: translateText(
        firstText(activeTithi?.name !== "New Moon" && activeTithi?.name !== "Full Moon" ? activeTithi?.name : null, dayRecord?.Tithi, panchang?.tithi?.[0]?.name),
        t
      ),
      tithiFull: activeTithi,
      paksha: translateText(pakshaRaw, t),
      karana: translateText(firstText(activeKarana?.name, dayRecord?.Karana, dayRecord?.Karanam, panchang?.karana?.[0]?.name), t),
      karanaFull: activeKarana,
      yoga: translateText(firstText(activeYoga?.name, dayRecord?.Yoga, panchang?.yoga?.[0]?.name), t),
      yogaFull: activeYoga,
      lunarMonth: translateText(lunarMonthRaw, t),
      nakshatra: translateText(firstText(activeNakshatra?.name, dayRecord?.Nakshatra, panchang?.nakshatra?.[0]?.name), t),
      nakshatraFull: activeNakshatra,
      weekday: translateText(weekdayRaw, t),
      panchaka: translateText(firstText(panchang?.panchaka?.name, panchang?.panchaka), t),
      samvatsara: translateText(normalizeSamvatsara(samvatsaraRaw), t),
      purnimanthaMonth: translateText(purnimanthaMonthRaw, t),
      ayana: translateText(ayanaRaw, t),
      ritu: translateText(rituRaw, t),
    };
  }, [panchang, dayRecord, now, defaults.tzOffset, dateKey, currentTimeParts.hour, currentTimeParts.minute, t]);

  const parsed = useMemo(() => parseDateKey(dateKey), [dateKey]);
  const displayMonth = useMemo(() => {
    if (!parsed) return "";
    const index = Math.max(0, Math.min(11, parsed.month - 1));
    return t.months?.[index] || t.monthsShort?.[index] || new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
  }, [parsed, t.months, t.monthsShort]);
  const displayYear = parsed?.year || "";
  const formattedTime = useMemo(() => formatTimeInTimeZone(now, defaults.timeZone), [now, defaults.timeZone]);

  return (
    <section
      className="relative rounded-2xl px-4 py-6 min-h-[82svh] text-center transition-all duration-300 sm:min-h-0 sm:px-4 sm:py-4"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        boxShadow: "0 8px 32px rgba(255, 152, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -3px 0 rgba(139, 69, 19, 0.25), 0 0 40px rgba(255, 183, 77, 0.2)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-start gap-3 sm:gap-3">
        <button
          type="button"
          onClick={onDateClick}
          className="h-[60px] w-[60px] sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
            padding: 0,
            cursor: "pointer",
          }}
          aria-label="Select date"
        >
          <span className="text-[34px] sm:text-3xl font-bold" style={{ color: "#28c76f", textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)" }}>
            {parsed?.day || "--"}
          </span>
        </button>

        <div className="min-w-0 flex-1 text-left pl-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="home-weekday-text text-[17px] sm:text-lg font-bold leading-none" style={{ color: "#FFEFA6", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
              {summary?.weekday ? cleanDash(summary.weekday) : "-"}
            </div>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0 text-[13px] sm:text-sm font-medium leading-tight">
            <span className="home-date-text inline whitespace-nowrap text-left" style={{ color: "#FFFFFF" }}>
              {displayMonth}, {displayYear}
            </span>
            <span className="home-time-text inline whitespace-nowrap" style={{ color: "#87CEFA" }}>, {formattedTime}</span>
          </div>
        </div>
        {summary?.headlineTime && (
          <div
            className="ml-auto inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] sm:text-xs font-bold"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              boxShadow: "0 0 10px rgba(255, 140, 50, 0.35), inset 0 0 8px rgba(255, 200, 100, 0.15)",
            }}
          >
            <span style={{ color: "#FFD700" }}>{t.hinduTimeLabel || "Hindu Time:"}</span>
            <span className="home-time-text ml-1" style={{ color: "#87CEFA" }}>{summary.headlineTime}</span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[80px] flex items-center justify-between pl-0 pr-2 sm:top-[76px] sm:pr-3">
        <button
          type="button"
          onClick={onPrevDay}
          className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: "transparent",
            border: "1px solid rgba(255, 183, 77, 0.35)",
            color: THICK_YELLOW,
            boxShadow: "none",
            padding: 0,
            transform: "translateX(-3px)",
          }}
          aria-label="Previous day"
        >
          <UiIcon name="arrowLeft" size={12} color={THICK_YELLOW} />
        </button>
        <button
          type="button"
          onClick={onNextDay}
          className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: "transparent",
            border: "1px solid rgba(255, 183, 77, 0.35)",
            color: THICK_YELLOW,
            boxShadow: "none",
            padding: 0,
          }}
          aria-label="Next day"
        >
          <UiIcon name="arrowLeft" size={12} color={THICK_YELLOW} className="rotate-180" />
        </button>
      </div>

      {isTranslating ? (
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] font-bold uppercase tracking-wide"
          style={{
            background: "linear-gradient(135deg, rgba(255, 212, 120, 0.25) 0%, rgba(255, 152, 60, 0.25) 100%)",
            border: "1px solid rgba(255, 210, 120, 0.65)",
            color: "#FFF5D6",
          }}
          aria-live="polite"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
          {t.translating || "Translating content..."}
        </div>
      ) : null}

      <div className="mt-0.5">
        {summary?.tithi && (
          <PanchangInlineRow
            label={t.tithi || "Tithi"}
            value={summary.tithi}
            range={getTimeRangeText(summary.tithiFull, dateKey, localizedMonths, localizedMonthsShort)}
            detail={formatPanchangStartLine(buildNextDetailRecord(nextDayRecordNormalized, "Tithi"), localizedMonths, localizedMonthsShort, defaults.timeZone, t.starts, dateKey)}
          />
        )}

        {summary?.nakshatra && (
          <PanchangInlineRow
            label={t.nakshatra || "Nakshatra"}
            value={summary.nakshatra}
            range={getTimeRangeText(summary.nakshatraFull, dateKey, localizedMonths, localizedMonthsShort)}
            detail={formatPanchangStartLine(buildNextDetailRecord(nextDayRecordNormalized, "Nakshatra"), localizedMonths, localizedMonthsShort, defaults.timeZone, t.starts, dateKey)}
          />
        )}

        {summary?.yoga && (
          <PanchangInlineRow
            label={t.yoga || "Yoga"}
            value={summary.yoga}
            range={getTimeRangeText(summary.yogaFull, dateKey, localizedMonths, localizedMonthsShort)}
            detail={formatPanchangStartLine(buildNextDetailRecord(nextDayRecordNormalized, "Yoga"), localizedMonths, localizedMonthsShort, defaults.timeZone, t.starts, dateKey)}
          />
        )}

        {summary?.paksha && (
          <PanchangInlineRow
            label={t.paksha || "Paksha"}
            value={summary.paksha}
            range={getTimeRangeText(summary.tithiFull, dateKey, localizedMonths, localizedMonthsShort)}
            detail={formatPanchangStartLine(buildNextDetailRecord(nextDayRecordNormalized, "Paksha", "TithiStart"), localizedMonths, localizedMonthsShort, defaults.timeZone, t.starts, dateKey)}
          />
        )}

        {summary?.karana && (
          <PanchangInlineRow
            label={t.karana || "Karana"}
            value={summary.karana}
            range={getTimeRangeText(summary.karanaFull, dateKey, localizedMonths, localizedMonthsShort)}
            detail={formatPanchangStartLine(buildNextDetailRecord(nextDayRecordNormalized, "Karana"), localizedMonths, localizedMonthsShort, defaults.timeZone, t.starts, dateKey)}
          />
        )}

        {summary?.samvatsara && (
          <PanchangInlineRow
            label={t.year || "Year"}
            value={summary.samvatsara}
          />
        )}

        {festivals.length > 0 && (
          <PanchangInlineRow
            label={t.festivals || "Festivals"}
            value={festivals.join(", ")}
          />
        )}

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
      </div>
    </section>
  );
}


export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languagePopupOpen, setLanguagePopupOpen] = useState(false);
  const [language, setLanguage] = useState(loadInitialLanguage);
  const [country, setCountry] = useState(loadCountry);
  const languageRef = useRef(language);
  const [voiceEnabled, setVoiceEnabled] = useState(loadInitialVoiceEnabled);
  const [now, setNow] = useState(() => new Date());
  const [panchang, setPanchang] = useState(null);
  const [dayRecord, setDayRecord] = useState(null);
  const [nextDayRecord, setNextDayRecord] = useState(null);
  const [error, setError] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [festivalMap, setFestivalMap] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [alarmSettings, setAlarmSettings] = useState(defaultAlarmSettings);
  const [isAlarmPopupOpen, setIsAlarmPopupOpen] = useState(false);
  const [playingDay, setPlayingDay] = useState(null);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const weekdayAudioRef = useRef({});
  const [isRingContinuously, setIsRingContinuously] = useState(false);
  const ringBellRef = useRef(null);
  const ringOnceTimeoutRef = useRef(null);
  const [isRingBellOpen, setIsRingBellOpen] = useState(false);
  const [isHoroscopeOpen, setIsHoroscopeOpen] = useState(false);
  const [isPanchangOpen, setIsPanchangOpen] = useState(loadInitialPanchangOpen);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedRashi, setSelectedRashi] = useState(null);
  const [settingsNonce, setSettingsNonce] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState("");
  const carouselRef = useRef(null);
  const carouselScrollTimeoutRef = useRef(null);
  const carouselSyncingRef = useRef(false);
  const titleByLanguage = translations[language]?.appTitle || "Talking Calendar";


  const defaults = useMemo(() => {
    void settingsNonce;
    return getCountryAstroDefaults(country, language);
  }, [country, language, settingsNonce]);
  const currentTimeParts = useMemo(() => getTimePartsInTimeZone(now, defaults.timeZone), [now, defaults.timeZone]);
  const currentDateKey = useMemo(
    () =>
      `${String(currentTimeParts.year).padStart(4, "0")}-${String(currentTimeParts.month).padStart(2, "0")}-${String(
        currentTimeParts.day
      ).padStart(2, "0")}`,
    [currentTimeParts]
  );
  const carouselFestivalYear = useMemo(
    () => String((selectedDateKey || currentDateKey || "").slice(0, 4)),
    [selectedDateKey, currentDateKey]
  );

  useEffect(() => {
    if (!selectedDateKey) {
      setSelectedDateKey(currentDateKey);
    }
  }, [currentDateKey, selectedDateKey]);

  useEffect(() => {
    let active = true;
    if (!carouselFestivalYear) {
      setFestivalMap({});
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const res = await fetch(`/data/festivals/${carouselFestivalYear}.json`);
        if (!active) return;
        if (!res.ok) {
          setFestivalMap({});
          return;
        }
        const data = await res.json().catch(() => null);
        setFestivalMap(data || {});
      } catch {
        if (!active) return;
        setFestivalMap({});
      }
    })();

    return () => {
      active = false;
    };
  }, [carouselFestivalYear]);

  const loadPanchangData = useCallback(
    async ({ signal, time, date, showLoading = false } = {}) => {
      const currentLang = languageRef.current;
      const currentTime = time || `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`;
      const currentDate = date || selectedDateKey || currentDateKey;

      if (showLoading) {
        setIsTranslating(true);
      }

      setError("");

      try {
        const payload = await getLocalPanchang(
          {
            date: currentDate,
            time: currentTime,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: currentLang,
          },
          { signal }
        );

        if (languageRef.current === currentLang) {
          setPanchang(payload?.data || payload || null);
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        setPanchang(null);
        setError(e?.message || "Failed to load Panchang");
      } finally {
        if (showLoading && languageRef.current === currentLang) {
          setIsTranslating(false);
        }
      }
    },
    [currentDateKey, currentTimeParts.hour, currentTimeParts.minute, defaults, selectedDateKey]
  );


  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const day = await findLocalDayByYmd(selectedDateKey || currentDateKey);
        if (active) setDayRecord(day || null);
      } catch {
        if (active) setDayRecord(null);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [selectedDateKey, currentDateKey, country]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const run = async () => {
      try {
        const nextDateKey = shiftDateKey(selectedDateKey || currentDateKey, 1);
        const day = await findLocalDayByYmd(nextDateKey, { signal: controller.signal });
        if (active) setNextDayRecord(day || null);
      } catch {
        if (active) setNextDayRecord(null);
      }
    };
    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedDateKey, currentDateKey, country]);

  useEffect(() => {
    initialLanguageReady.then(() => {
      const next = loadInitialLanguage();
      setLanguage((prev) => (prev === next ? prev : next));
    });
  }, []);

  useEffect(() => {
    languageRef.current = language;
    if (loadLanguage() !== language) saveLanguage(language);
    // Do NOT clear panchang here — local translation lookup handles it instantly
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadCountry() !== country) saveCountry(country);
  }, [country]);

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, voiceEnabled ? "1" : "0");
  }, [voiceEnabled]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ALARM_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setAlarmSettings((prev) => ({
        ...prev,
        ...parsed,
        enabledMuhurtas: {
          ...prev.enabledMuhurtas,
          ...(parsed.enabledMuhurtas || {}),
        },
        disabledDays: Array.isArray(parsed.disabledDays)
          ? parsed.disabledDays
          : prev.disabledDays,
      }));
    } catch {
      // ignore invalid localStorage
    }
  }, []);

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
      ensureLanguageLoaded(next).finally(() => {
        setLanguage((prev) => (prev === next ? prev : next));
        refresh();
      });
    };
    const syncCountry = (event) => {
      const next = normalizeCountryKey(event?.detail?.country || loadCountry());
      setCountry((prev) => (prev === next ? prev : next));
      refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", syncLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    window.addEventListener(COUNTRY_CHANGE_EVENT, syncCountry);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
      window.removeEventListener(COUNTRY_CHANGE_EVENT, syncCountry);
    };
  }, []);


  // ── Fetch triggered by language change (fires immediately, no debounce) ──
  useEffect(() => {
    const controller = new AbortController();
    loadPanchangData({
      signal: controller.signal,
      time: `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`,
      date: selectedDateKey || currentDateKey,
      showLoading: true,
    });
    return () => {
      controller.abort();
    };
  }, [language, loadPanchangData, currentDateKey, selectedDateKey, currentTimeParts.hour, currentTimeParts.minute]);

  // ── Fetch triggered by minute tick or settings change (320ms debounce) ──
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      loadPanchangData({
        signal: controller.signal,
        time: `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`,
        date: selectedDateKey || currentDateKey,
      });
    }, 320);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [loadPanchangData, currentDateKey, selectedDateKey, currentTimeParts.hour, currentTimeParts.minute, settingsNonce]);


  // Local translation helper — looks up a term in translations.js, fallback to raw value
  const t = translations[language] || translations.en;
  const localizedMonths = t.months || translations.en.months;
  const localizedMonthsShort = t.monthsShort || translations.en.monthsShort;
  const extractLocalizedText = (raw) => {
    if (raw == null) return "";
    if (typeof raw === "string" || typeof raw === "number") return String(raw).trim();
    if (typeof raw !== "object") return "";

    const tryValue = (value) => {
      if (value == null) return "";
      if (typeof value === "string" || typeof value === "number") return String(value).trim();
      if (typeof value === "object") {
        const nested =
          value?.[language] ??
          value?.en ??
          value?.name ??
          value?.vedic_name ??
          value?.title ??
          value?.value ??
          value?.label ??
          value?.display_name;
        return tryValue(nested);
      }
      return "";
    };

    return tryValue(
      raw?.[language] ??
      raw?.en ??
      raw?.name ??
      raw?.vedic_name ??
      raw?.title ??
      raw?.value ??
      raw?.label ??
      raw?.display_name
    );
  };

  const translateTerm = (raw) => {
    const normalized = extractLocalizedText(raw);
    if (!normalized) return normalized;
    const s = String(normalized).trim();
    // Try exact match first, then first-word match (e.g. "Panchami Dwitiya" → "పంచమి")
    return t[s] || t[s.split(" ")[0]] || translateText(s, t) || s;
  };

  const summary = useMemo(() => {
    if (!panchang) return null;
    const refDate = safeDateFromIso(
      buildIsoDatetime({
        date: selectedDateKey || currentDateKey,
        time: `${pad2(currentTimeParts.hour)}:${pad2(currentTimeParts.minute)}`,
        tzOffset: defaults.tzOffset,
      })
    );


    const activeTithi = findActiveByTime(panchang?.tithi, refDate);
    const activeNakshatra = findActiveByTime(panchang?.nakshatra, refDate);
    const activeYoga = findActiveByTime(panchang?.yoga, refDate);
    const activeKarana = findActiveByTime(panchang?.karana, refDate);
    const ghati = computeGhati(now, panchang?.sunrise);


    const pakshaRaw = firstText(activeTithi?.paksha, panchang?.paksha, panchang?.advanced?.paksha);
    const weekdayRaw = firstText(
      panchang?.vaara,
      panchang?.weekday,
      panchang?.day,
      panchang?.advanced?.vaara,
      panchang?.advanced?.weekday
    );
    const lunarMonthRaw = firstText(
      panchang?.lunar_month?.name,
      panchang?.lunar_month,
      panchang?.masa,
      panchang?.advanced?.lunar_month?.name,
      panchang?.advanced?.lunar_month,
      panchang?.advanced?.masa
    );
    const samvatsaraRaw = firstText(
      panchang?.samvatsara?.name,
      panchang?.samvatsara,
      panchang?.advanced?.samvatsara?.name,
      panchang?.advanced?.samvatsara
    );
    const purnimanthaMonthRaw = firstText(
      panchang?.purnimantha_month?.name,
      panchang?.purnimanta_month?.name,
      panchang?.lunar_month?.purnimanta_name,
      panchang?.advanced?.purnimantha_month?.name,
      panchang?.advanced?.purnimanta_month?.name,
      panchang?.advanced?.lunar_month?.purnimanta_name
    );
    const ayanaRaw = firstText(
      panchang?.ayana?.name,
      panchang?.ayana,
      panchang?.advanced?.ayana?.name,
      panchang?.advanced?.ayana
    );
    const rituRaw = firstText(
      panchang?.ritu?.name,
      panchang?.ritu,
      panchang?.advanced?.ritu?.name,
      panchang?.advanced?.ritu,
      panchang?.season
    );
    return {
      headlineTime: ghati ? `${pad2(ghati.ghati)}:${pad2(ghati.pal)}` : "",
      tithi: translateTerm(firstText(activeTithi?.name !== "New Moon" && activeTithi?.name !== "Full Moon" ? activeTithi?.name : null, dayRecord?.Tithi, panchang?.tithi?.[0]?.name)),
      tithiFull: activeTithi,
      paksha: translateTerm(pakshaRaw),
      karana: translateTerm(firstText(activeKarana?.name)),
      karanaFull: activeKarana,
      yoga: translateTerm(firstText(activeYoga?.name)),
      yogaFull: activeYoga,
      lunarMonth: translateTerm(lunarMonthRaw),
      nakshatra: translateTerm(
        firstText(
          activeNakshatra?.name,
          dayRecord?.Nakshatra,
          panchang?.nakshatra?.[0]?.name
        )
      ),
      nakshatraFull: activeNakshatra,
      weekday: translateTerm(weekdayRaw),
      panchaka: translateTerm(firstText(panchang?.panchaka?.name, panchang?.panchaka)),
      samvatsara: translateTerm(normalizeSamvatsara(samvatsaraRaw)),
      purnimanthaMonth: translateTerm(purnimanthaMonthRaw),
      ayana: translateTerm(ayanaRaw),
      ritu: translateTerm(rituRaw),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panchang, now, defaults.tzOffset, language, dayRecord, selectedDateKey, currentDateKey, currentTimeParts.hour, currentTimeParts.minute]);

  const chatPanchang = useMemo(() => {
    if (!summary && !panchang && !dayRecord) return null;

    return {
      tithi: firstText(summary?.tithi !== "New Moon" && summary?.tithi !== "Full Moon" ? summary?.tithi : null, dayRecord?.Tithi, panchang?.tithi?.[0]?.name),
      nakshatra: firstText(
        summary?.nakshatra,
        dayRecord?.Nakshatra,
        panchang?.nakshatra?.[0]?.name
      ),
      karana: firstText(summary?.karana, dayRecord?.Karana, dayRecord?.Karanam, panchang?.karana?.[0]?.name),
      yoga: firstText(summary?.yoga, dayRecord?.Yoga, panchang?.yoga?.[0]?.name),
      shakaSamvat: translateTerm(
        normalizeSamvatsara(
          firstText(dayRecord?.["Shaka Samvat"], summary?.samvatsara, panchang?.samvatsara?.name)
        )
      ),
      sunrise: formatTimeValue(firstText(panchang?.sunrise, dayRecord?.Sunrise, dayRecord?.SunriseIso)),
      sunset: formatTimeValue(firstText(panchang?.sunset, dayRecord?.Sunset, dayRecord?.SunsetIso)),
      moonrise: formatTimeValue(firstText(panchang?.moonrise, dayRecord?.Moonrise, dayRecord?.MoonriseIso)),
      moonset: formatTimeValue(firstText(panchang?.moonset, dayRecord?.Moonset, dayRecord?.MoonsetIso)),
      rahuKalam: firstText(dayRecord?.["Rahu Kalam"], dayRecord?.RahuKalam, dayRecord?.["RahuKalam"]),
      abhijitMuhurat: firstText(
        dayRecord?.Abhijit,
        dayRecord?.["Abhijit"],
        dayRecord?.["Abhijit Muhurat"],
        dayRecord?.["Abhijit Muhurtam"]
      ),
    };
  }, [summary, panchang, dayRecord]);


  const nextDayRecordNormalized = useMemo(
    () =>
      nextDayRecord
        ? normalizeDayRecord(nextDayRecord, {
            tzOffset: defaults.tzOffset,
            sourceTzOffset: defaults.tzOffset,
          })
        : null,
    [nextDayRecord, defaults.tzOffset]
  );
  const selectedParts = useMemo(() => getPickerParts(selectedDateKey || currentDateKey), [selectedDateKey, currentDateKey]);
  const carouselDateKeys = useMemo(() => {
    const center = selectedDateKey || currentDateKey;
    return [shiftDateKey(center, -1), center, shiftDateKey(center, 1)];
  }, [selectedDateKey, currentDateKey]);

  const recenterCarousel = useCallback((behavior = "auto") => {
    const el = carouselRef.current;
    if (!el) return;
    carouselSyncingRef.current = true;
    el.scrollTo({ left: el.clientWidth, behavior });
    window.clearTimeout(carouselScrollTimeoutRef.current);
    carouselScrollTimeoutRef.current = window.setTimeout(() => {
      carouselSyncingRef.current = false;
    }, behavior === "smooth" ? 220 : 60);
  }, []);

  useEffect(() => {
    if (!selectedDateKey) return;
    const raf = window.requestAnimationFrame(() => {
      recenterCarousel("auto");
    });
    return () => window.cancelAnimationFrame(raf);
  }, [selectedDateKey, recenterCarousel]);

  const handleCarouselScroll = useCallback(() => {
    if (carouselSyncingRef.current) return;
    const el = carouselRef.current;
    if (!el) return;
    window.clearTimeout(carouselScrollTimeoutRef.current);
    carouselScrollTimeoutRef.current = window.setTimeout(() => {
      const width = el.clientWidth || 1;
      const left = el.scrollLeft;
      if (left < width * 0.45) {
        carouselSyncingRef.current = true;
        setSelectedDateKey((prev) => shiftDateKey(prev || currentDateKey, -1));
      } else if (left > width * 1.55) {
        carouselSyncingRef.current = true;
        setSelectedDateKey((prev) => shiftDateKey(prev || currentDateKey, 1));
      } else {
        recenterCarousel("auto");
      }
    }, 80);
  }, [currentDateKey, recenterCarousel]);

  const openDatePicker = useCallback(() => {
    setIsYearSelectorOpen(true);
  }, []);

  const handleDatePickerCancel = useCallback(() => {
    setIsYearSelectorOpen(false);
  }, []);

  const handleDatePickerOk = useCallback((data) => {
    const { year: newYear, month: newMonth, day: newDay } = data || {};
    if (!Number.isFinite(Number(newYear)) || !Number.isFinite(Number(newMonth)) || !Number.isFinite(Number(newDay))) {
      setIsYearSelectorOpen(false);
      return;
    }
    const nextDateKey = `${String(newYear).padStart(4, "0")}-${String(Number(newMonth) + 1).padStart(2, "0")}-${String(
      newDay
    ).padStart(2, "0")}`;
    setSelectedDateKey(nextDateKey);
    setIsYearSelectorOpen(false);
  }, []);

  const goPrevDay = useCallback(() => {
    setSelectedDateKey((prev) => shiftDateKey(prev || currentDateKey, -1));
  }, [currentDateKey]);

  const goNextDay = useCallback(() => {
    setSelectedDateKey((prev) => shiftDateKey(prev || currentDateKey, 1));
  }, [currentDateKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldReturn = sessionStorage.getItem(PANCHANG_RETURN_KEY) === "1";
    if (shouldReturn) {
      sessionStorage.removeItem(PANCHANG_RETURN_KEY);
    }
  }, []);

  const openDailyHoroscope = () => {
    setIsHoroscopeOpen(true);
  };

  const closeDailyHoroscope = () => {
    setIsHoroscopeOpen(false);
  };

  const openChantingAlarm = () => {
    setIsAlarmPopupOpen(true);
  };

  const closeChantingAlarm = () => {
    // Stop any playing audio when closing the popup
    if (playingDay) {
      const audio = weekdayAudioRef.current[playingDay];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingDay(null);
    }
    setIsAlarmPopupOpen(false);
  };

  // Ring Bell functions
  const getRingBellAudio = () => {
    if (!ringBellRef.current) {
      ringBellRef.current = new Audio("/audio/Low to high bell.mp3");
      ringBellRef.current.preload = "auto";
    }
    return ringBellRef.current;
  };

  const handleRingOnce = () => {
    // Stop any continuous ringing first
    if (isRingContinuously) {
      stopRingContinuously();
    }
    
    const audio = getRingBellAudio();
    audio.currentTime = 0;
    audio.volume = 0.6;
    
    audio.play().catch(err => console.error("Error playing ring bell:", err));
    
    // Stop after 3 seconds
    if (ringOnceTimeoutRef.current) {
      clearTimeout(ringOnceTimeoutRef.current);
    }
    ringOnceTimeoutRef.current = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
  };

  const handleRingContinuously = () => {
    if (isRingContinuously) {
      stopRingContinuously();
    } else {
      startRingContinuously();
    }
  };

  const startRingContinuously = () => {
    const audio = getRingBellAudio();
    audio.currentTime = 0;
    audio.volume = 0.6;
    audio.loop = true;
    audio.play().catch(err => console.error("Error playing ring bell:", err));
    setIsRingContinuously(true);
  };

  const stopRingContinuously = () => {
    const audio = ringBellRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    }
    setIsRingContinuously(false);
  };

  const closeRingBell = () => {
    // Stop any playing audio
    if (isRingContinuously) {
      stopRingContinuously();
    }
    if (ringBellRef.current) {
      ringBellRef.current.pause();
      ringBellRef.current.currentTime = 0;
    }
    if (ringOnceTimeoutRef.current) {
      clearTimeout(ringOnceTimeoutRef.current);
    }
    setIsRingBellOpen(false);
  };

  const openPanchangMenu = () => {
    setIsPanchangOpen(true);
  };

  const closePanchangMenu = () => {
    setIsPanchangOpen(false);
  };

  const openPanchangFromNav = () => {
    closeDailyHoroscope();
    closeChantingAlarm();
    openPanchangMenu();
  };

  const openHoroscopeFromNav = () => {
    closeChantingAlarm();
    closePanchangMenu();
    openDailyHoroscope();
  };

  const openChantingFromNav = () => {
    closeDailyHoroscope();
    closePanchangMenu();
    openChantingAlarm();
  };

  const markReturnToPanchang = () => {
    try {
      sessionStorage.setItem(PANCHANG_RETURN_KEY, "1");
    } catch {}
  };

  const saveAlarmSettings = () => {
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmSettings));
      setNotificationStatus("Settings saved!");
      setTimeout(() => setNotificationStatus(""), 3000);
    } catch {
      setNotificationStatus("Failed to save settings.");
    }
  };

  const resetAlarmSettings = () => {
    setAlarmSettings(defaultAlarmSettings);
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(defaultAlarmSettings));
      setNotificationStatus("Reset to defaults.");
      setTimeout(() => setNotificationStatus(""), 3000);
    } catch {
      setNotificationStatus("Failed to reset settings.");
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      setNotificationStatus("Notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationStatus("Notifications already enabled! ✓");
      setTimeout(() => setNotificationStatus(""), 3000);
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        setNotificationStatus("Notifications enabled! ✓");
        // Show a test notification
        new Notification("Hindu Calendar", {
          body: "Notifications are now enabled for auspicious time reminders.",
          icon: "/favicon.ico",
        });
      } else if (result === "denied") {
        setNotificationStatus(
          "Notifications blocked. Please allow them in your browser settings."
        );
      } else {
        setNotificationStatus("Notification permission was dismissed.");
      }
      setTimeout(() => setNotificationStatus(""), 5000);
    } catch {
      setNotificationStatus("Could not request notification permission.");
    }
  };

  return (
    <div
      className="home-page min-h-[100svh] w-screen max-w-none overflow-x-hidden pt-4 sm:pt-6 home-bg"
      style={{
        fontFamily: "'Segoe UI', 'Inter', 'Trebuchet MS', sans-serif",
        background:
          "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-36 md:max-w-6xl md:px-6 md:pb-40">
        <header
          className="mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-1 py-1 transition-all duration-300"
        >
          <div className="flex items-center gap-1.5">
            <img
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-base font-black flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
              src="/logo.png"
              alt="Logo"
              title="Logo"
            />
          </div>
          <div className="min-w-0 px-0.5">
            <div
              className="home-brand-title notranslate whitespace-nowrap font-black leading-tight tracking-tight"
              style={{
                color: "#FFEFA6",
                textShadow: "none",
                lineHeight: "1",
                letterSpacing: "0.02em",
                fontSize: "clamp(0.95rem, 5vw, 1.45rem)",
                fontWeight: "900",
              }}
              translate="no"
            >
              {titleByLanguage}
            </div>
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <CountrySelectorButton
              value={country}
              onChange={setCountry}
              language={language}
              style={{
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
            />
            <button
              type="button"
              onClick={() => setLanguagePopupOpen(true)}
              className="inline-flex h-6 min-w-[46px] items-center justify-center gap-1 rounded-lg px-1 text-[9px] font-black outline-none transition-all duration-200 hover:scale-105 sm:h-7 sm:min-w-[54px] sm:px-1.5 sm:text-[10px]"
              style={{
                background: "transparent",
                color: "#FFFFFF",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                boxShadow: "none",
              }}
              aria-label="Open language selector"
            >
              <span>{String(language || "").toUpperCase()}</span>
              <UiIcon name="chevronDown" size={12} color={THICK_YELLOW} />
            </button>
            <Link
              to="/settings"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "transparent",
                color: "#FFFFFF",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
              aria-label="Settings"><UiIcon name="settings" size={16} color={THICK_YELLOW} /></Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="h-7 w-7 rounded-lg text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "transparent",
                color: "#FFFFFF",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
              aria-label="Open menu"
            ><UiIcon name="menu" size={16} color={THICK_YELLOW} /></button>
          </div>
        </header>

        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="hide-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {carouselDateKeys.map((dateKey) => (
              <div key={dateKey} className="w-full shrink-0 snap-center">
                <PanchangCarouselSlide
                  dateKey={dateKey}
                  language={language}
                  defaults={defaults}
                  currentTimeParts={currentTimeParts}
                  now={now}
                  t={t}
                  nextDayRecordNormalized={nextDayRecordNormalized}
                  onPrevDay={goPrevDay}
                  onNextDay={goNextDay}
                  localizedMonths={localizedMonths}
                  localizedMonthsShort={localizedMonthsShort}
                  onDateClick={openDatePicker}
                  festivals={festivalMap[dateKey] || []}
                />
              </div>
            ))}
          </div>
        </div>

        <YearSelectorPopup
          isOpen={isYearSelectorOpen}
          onClose={handleDatePickerCancel}
          onConfirm={handleDatePickerOk}
          initialYear={selectedParts.year}
          initialMonth={Math.max(0, (selectedParts.month || 1) - 1)}
          initialDay={selectedParts.day || 1}
          language={language}
          translations={t}
        />

        <div
          className="mt-1"
          style={{
            background: "transparent",
            border: "0",
            boxShadow: "none",
          }}
        >
          <button
            type="button"
            onClick={openPanchangMenu}
            className="home-highlight-text relative w-full rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#FFE11A",
              boxShadow:
                "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span className="block text-center">{t.panchang || t.tilePanchang || "Panchang"}</span>
            <span
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{
                color: "#FFE11A",
                transform: isPanchangOpen ? "rotate(180deg)" : "rotate(0deg)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
              }}
            >
              <UiIcon name="chevronDown" size={12} />
            </span>
          </button>
        </div>

        <div
          aria-hidden={!isPanchangOpen}
          className="fixed left-0 top-0 w-full h-[100vh] z-[9997] transition-all duration-300 ease-out"
          style={{
            transform: isPanchangOpen ? "translateY(0%)" : "translateY(100%)",
            opacity: isPanchangOpen ? 1 : 0,
            pointerEvents: isPanchangOpen ? "auto" : "none",
          }}
        >
          <div 
            className="h-full w-full overflow-y-auto"
            style={{
              background:
                "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <header
              className="sticky top-0 z-10 px-4 py-3 backdrop-blur-md"
              style={{
                background: "transparent",
                borderBottom: "1.5px solid rgba(255, 183, 77, 0.25)",
                backdropFilter: "none",
              }}
            >
              <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
                <button
                  type="button"
                  onClick={closePanchangMenu}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all hover:scale-105"
                  style={{
                    background: "transparent",
                    border: "1.5px solid rgba(255, 183, 77, 0.4)",
                    color: "#FFE4B5",
                    boxShadow: "none",
                  }}
                >
                  <UiIcon name="arrowLeft" size={14} color={THICK_YELLOW} /> {t?.back || "Back"}
                </button>
                <div
                  className="text-base font-black uppercase tracking-wide"
                  style={{
                    background: "transparent",
                    color: "#FFF5E6",
                    textShadow: "0 2px 6px rgba(0,0,0,0.5)",
                  }}
                >
                  {t.panchang || t.tilePanchang || "Panchang"}
                </div>
              </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-4">
              <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
                {getTiles(t).map((tile) => (
                  <Tile key={tile.to} {...tile} onClick={markReturnToPanchang} />
                ))}
              </section>

              <div className="mt-4 grid gap-2">
                <HomeNavButton
                  label={t.dailyHoroscope || "Daily Horoscope"}
                  onClick={openHoroscopeFromNav}
                  shellless
                />
              <HomeNavButton
                label={t.chantingAlarm || "Chanting Tunes"}
                onClick={openChantingFromNav}
                shellless
              />
            </div>
          </div>
          </div>
        </div>

        <div
          className="mt-1"
          style={{
            background: "transparent",
            border: "0",
            boxShadow: "none",
          }}
        >
          <button
            type="button"
            onClick={openDailyHoroscope}
            className="home-highlight-text relative w-full rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#FFE11A",
              boxShadow:
                "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span className="block text-center">{t.dailyHoroscope || "Daily Horoscope"}</span>
            <span
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{
                color: THICK_YELLOW,
                transform: isHoroscopeOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <UiIcon name="chevronDown" size={12} color={THICK_YELLOW} />
            </span>
          </button>
        </div>

        <div
          className="mt-1"
          style={{
            background: "transparent",
            border: "0",
            boxShadow: "none",
          }}
        >
          <button
            type="button"
            onClick={openChantingAlarm}
            className="home-highlight-text relative w-full rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#FFE11A",
              boxShadow:
                "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span className="block text-center">{t.chantingAlarm || "Chanting Tunes"}</span>
            <span
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{
                color: THICK_YELLOW,
                transform: isAlarmPopupOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <UiIcon name="chevronDown" size={12} color={THICK_YELLOW} />
            </span>
          </button>
        </div>
        <div className="mt-1 sm:hidden">
          <HomeNavButton
            label={t.gita || "Bhagavad Gita"}
            onClick={() => navigate("/gita")}
            shellless
          />
        </div>


        <div className="mt-1 grid gap-1 sm:mt-4 sm:grid-cols-4 sm:gap-2">
          <HomeNavButton
            label={t.purohith || "Purohith"}
            onClick={() => navigate("/purohith")}
            shellless
          />
          <HomeNavButton
            label={t.temples || "Temples"}
            onClick={() => navigate("/temples")}
            shellless
          />
          <HomeNavButton
            label={t.poojaStores || "Pooja Stores"}
            onClick={() => navigate("/pooja-stores")}
            shellless
          />
          <HomeNavButton
            label={t.astrologers || "Astrologers"}
            onClick={() => navigate("/astrologers")}
            shellless
          />
          <HomeNavButton
            label="Dosha Parihara"
            onClick={() => navigate("/dosha-parihara")}
            shellless
          />
          <HomeNavButton
            label="365 Days Pooja"
            onClick={() => navigate("/365-days-pooja")}
            shellless
          />
          <div className="hidden sm:block">
            <HomeNavButton
              label={t.gita || "Bhagavad Gita"}
              onClick={() => navigate("/gita")}
              shellless
            />
          </div>
        </div>

        <div
          aria-hidden={!isHoroscopeOpen}
          className="fixed left-0 top-0 w-full h-[100vh] z-[9999] transition-all duration-300 ease-out"
          style={{
            transform: isHoroscopeOpen ? "translateY(0%)" : "translateY(100%)",
            opacity: isHoroscopeOpen ? 1 : 0,
            pointerEvents: isHoroscopeOpen ? "auto" : "none",
          }}
        >
          <div 
            className="h-full w-full overflow-y-auto"
            style={{
              background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <Rashiphalalu
              language={language}
              translations={t}
              selectedRashi={selectedRashi}
              setSelectedRashi={setSelectedRashi}
              onBack={closeDailyHoroscope}
              isInline={false}
            />

            <div className="mx-auto w-full max-w-6xl px-4 pb-6">
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <HomeNavButton
                  label={t.panchang || t.tilePanchang || "Panchang"}
                  onClick={openPanchangFromNav}
                  shellless
                />
                <HomeNavButton
                  label={t.chantingAlarm || "Chanting Tunes"}
                  onClick={openChantingFromNav}
                  shellless
                />
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden={!isAlarmPopupOpen}
          className="fixed left-0 top-0 w-full h-[100vh] z-[9998] transition-all duration-300 ease-out"
          style={{
            transform: isAlarmPopupOpen ? "translateY(0%)" : "translateY(100%)",
            opacity: isAlarmPopupOpen ? 1 : 0,
            pointerEvents: isAlarmPopupOpen ? "auto" : "none",
          }}
        >
          <div
            className="h-full w-full overflow-y-auto"
            style={{
              background:
                "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <header
              className="sticky top-0 z-10 px-4 py-3 backdrop-blur-md"
              style={{
                background: "transparent",
                borderBottom: "1.5px solid rgba(255, 183, 77, 0.25)",
                backdropFilter: "none",
              }}
            >
              <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
                <button
                  type="button"
                  onClick={closeChantingAlarm}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all hover:scale-105"
                  style={{
                    background: "transparent",
                    border: "1.5px solid rgba(255, 183, 77, 0.4)",
                    color: "#FFE4B5",
                    boxShadow: "none",
                  }}
                >
                  {"\u2190"} {t?.back || "Back"}
                </button>
                <div
                  className="text-base font-black uppercase tracking-wide"
                  style={{
                    background: "transparent",
                    color: "#FFF5E6",
                    textShadow: "0 2px 6px rgba(0,0,0,0.5)",
                  }}
                >
                  {t.chantingAlarm || "Chanting Tunes"}
                </div>
              </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-4">
              <HomeAlarmPanel
                language={language}
                translations={translations}
                alarmSettings={alarmSettings}
                setAlarmSettings={setAlarmSettings}
                onSave={saveAlarmSettings}
                onReset={resetAlarmSettings}
                onRequestNotification={requestNotificationPermission}
                notificationStatus={notificationStatus}
                playingDay={playingDay}
                setPlayingDay={setPlayingDay}
                weekdayAudioRef={weekdayAudioRef}
                weekdayAudioFiles={WEEKDAY_AUDIO_FILES}
              />

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <HomeNavButton
                  label={t.panchang || t.tilePanchang || "Panchang"}
                  onClick={openPanchangFromNav}
                  shellless
                />
                <HomeNavButton
                  label={t.dailyHoroscope || "Daily Horoscope"}
                  onClick={openHoroscopeFromNav}
                  shellless
                />
              </div>
            </div>
          </div>
        </div>


      </div>


      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="mx-auto w-full max-w-md px-4 pb-3 md:max-w-6xl md:px-6">
          <section
            className="grid grid-cols-4 rounded-2xl p-2 text-center transition-all duration-300"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              boxShadow: "0 -4px 20px rgba(255, 111, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(139, 69, 19, 0.2)",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/compass")}
              className="flex flex-col items-center justify-center rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE11A",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="mb-1 inline-flex items-center justify-center"><UiIcon name="compass" size={18} color="#FFFFFF" /></div>
              <span className="home-highlight-text">{t.compass || "Compass"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/sankalp-mantra")}
              className="flex flex-col items-center justify-center rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE11A",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="mb-1 inline-flex items-center justify-center"><UiIcon name="sankalp" size={18} color="#FFFFFF" /></div>
              <span className="home-highlight-text">{t.sankalp || "Sankalp"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/ring-bell")}
              className="flex flex-col items-center justify-center rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE11A",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="mb-1 inline-flex items-center justify-center"><UiIcon name="bell" size={18} color="#FFFFFF" /></div>
              <span className="home-highlight-text">{t.ringBellTitle || "Ring Bell"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="flex flex-col items-center justify-center rounded-xl py-2 text-[10px] font-bold transition-all duration-200 hover:bg-[rgba(255,224,130,0.15)]"
              style={{
                color: "#FFE11A",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="mb-1 inline-flex items-center justify-center"><UiIcon name="about" size={18} color="#FFFFFF" /></div>
              <span className="home-highlight-text">{t.about || "About"}</span>
            </button>
          </section>

          {(summary?.purnimanthaMonth || summary?.ayana || summary?.ritu) ? (
            <section
              className="mt-3 rounded-2xl px-4 py-3 text-center transition-all duration-300"
              style={{
                background: "var(--calendar-orange-gradient)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                boxShadow: "0 4px 16px rgba(255, 111, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(139, 69, 19, 0.2)",
              }}
            >
              {summary?.purnimanthaMonth ? (
                <div
                  className="text-[13px] font-semibold"
                  style={{
                    color: "#FFE8C5",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {summary?.purnimanthaMonth}
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
              background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
              borderRight: "1.5px solid rgba(255, 183, 77, 0.4)",
              boxShadow: "none",
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
                {t.menuLabel || "Menu"}
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-1 text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "transparent",
                  color: "#FFF1DA",
                  boxShadow: "none",
                  border: "1.5px solid rgba(255, 183, 77, 0.4)",
                }}
              >
                {t.close || "Close"}
              </button>
            </div>
            <nav className="grid gap-2">
              {getMenuLinks(t).map(([to, label]) => (
                <Link
                  key={`menu-${to}`}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "transparent",
                    color: "#FFE8C5",
                    boxShadow: "none",
                    border: "1.5px solid rgba(255, 183, 77, 0.4)",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      {/* ASTROLOGY NAV BUTTON */}
      <Link
        to="/astrology"
        aria-label="Open astrology pages"
        title="Astrology (Panchang / Kundali / Matchmaking / Muhurat)"
        className="fixed z-40 inline-flex items-center justify-center rounded-full h-12 w-12 sm:h-14 sm:w-14 backdrop-blur-md"
        style={{
          right: "1rem",
          bottom: "100px",  // Roughly 6.25rem to sit gracefully above the nav
          background: "linear-gradient(145deg, rgba(255, 210, 155, 0.18) 0%, rgba(255, 150, 80, 0.12) 55%, rgba(255, 120, 45, 0.16) 100%)",
          border: "2px solid rgba(255, 226, 176, 0.65)",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35), 0 0 26px rgba(255, 145, 65, 0.3), inset 0 1px 8px rgba(255, 250, 240, 0.18)",
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full h-8 w-8 sm:h-9 sm:w-9"
          style={{
            background: "linear-gradient(145deg, rgba(255, 176, 102, 0.32) 0%, rgba(255, 122, 55, 0.26) 100%)",
            border: "1px solid rgba(255, 224, 170, 0.55)",
            boxShadow: "inset 0 0 10px rgba(255, 239, 210, 0.16)",
            color: "#FFF1D6",
            fontSize: "17px",
            lineHeight: "1",
          }}
        >
          <UiIcon name="astrology" size={18} />
        </span>
      </Link>

      {/* CHATBOT BUTTON */}
      <button
        type="button"
        onClick={() => setIsChatbotOpen(true)}
        aria-label="Open chatbot"
        title="Chatbot"
        className="fixed z-40 inline-flex items-center justify-center rounded-full h-12 w-12 sm:h-14 sm:w-14 backdrop-blur-md"
        style={{
          right: "1rem",
          bottom: "160px",
          background: "linear-gradient(145deg, rgba(255, 210, 155, 0.2) 0%, rgba(255, 150, 80, 0.12) 55%, rgba(255, 120, 45, 0.18) 100%)",
          border: "2px solid rgba(255, 226, 176, 0.7)",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35), 0 0 26px rgba(255, 145, 65, 0.3), inset 0 1px 8px rgba(255, 250, 240, 0.2)",
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full h-8 w-8 sm:h-9 sm:w-9"
          style={{
            background: "linear-gradient(145deg, rgba(255, 176, 102, 0.35) 0%, rgba(255, 122, 55, 0.28) 100%)",
            border: "1px solid rgba(255, 224, 170, 0.6)",
            boxShadow: "inset 0 0 10px rgba(255, 239, 210, 0.18)",
            color: "#FFF1D6",
            fontSize: "17px",
            lineHeight: "1",
          }}
        >
          <UiIcon name="chat" size={18} />
        </span>
      </button>

      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        selectedDay={null}
        panchangData={chatPanchang}
        currentView="calendar"
        language={language}
      />

      {languagePopupOpen ? (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.08)",
            backdropFilter: "blur(12px)",
          }}
          onClick={() => setLanguagePopupOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-4 shadow-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "2px solid rgba(255, 220, 150, 0.85)",
              backdropFilter: "blur(10px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-lg font-bold text-orange-300">{t.selectLanguage || "Select Language"}</h3>
            <div
              className="notranslate max-h-60 overflow-y-auto rounded-lg p-2"
              data-no-auto-translate="true"
              translate="no"
              style={{ background: "rgba(255, 255, 255, 0.04)" }}
            >
              {languages.map((lang) => {
                const isActive = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={async () => {
                      // saveLanguage dispatches LANGUAGE_CHANGE_EVENT so the
                      // whole app updates immediately without needing a reload.
                      if (lang.code !== language) {
                        setIsTranslating(true);
                      }
                      await ensureLanguageLoaded(lang.code);
                      saveLanguage(lang.code);
                      setLanguage(lang.code);
                      setLanguagePopupOpen(false);
                    }}
                    className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-orange-500/20 text-white"
                      : "bg-transparent text-orange-100 hover:bg-orange-500/10"
                      }`}
                    style={{
                      border: "1px solid rgba(255, 183, 77, 0.35)",
                      boxShadow: isActive ? "inset 0 0 0 1px rgba(255, 220, 150, 0.35)" : "none",
                    }}
                  >
                    {String(lang.code || "").toUpperCase()} {lang.name ? `• ${lang.name}` : ""}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setLanguagePopupOpen(false)}
              className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "transparent",
                border: "2px solid rgba(255, 183, 77, 0.8)",
                boxShadow: "none",
              }}
            >
              {t.close || "Close"}
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function AlarmToggleRow({ label, checked, onChange }) {
  return (
    <div
      className="flex min-w-0 items-center justify-between w-full rounded-lg px-2 py-1"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
      }}
    >
      <div className="min-w-0 flex-1 pr-3">
        <div className="text-[10px] font-semibold truncate" style={{ color: "#FFE4B5" }}>
          {label}
        </div>
      </div>
      <input
        type="checkbox"
        className="h-3.5 w-3.5 shrink-0 accent-green-500"
        checked={!!checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}

function HomeAlarmPanel({
  language,
  translations,
  alarmSettings,
  setAlarmSettings,
  onSave,
  onReset,
  onRequestNotification,
  notificationStatus,
  playingDay,
  setPlayingDay,
  weekdayAudioRef,
  weekdayAudioFiles,
}) {
  const handlePlayPause = (dayName) => {
    const audioUrl = weekdayAudioFiles[dayName];
    if (!audioUrl) return;

    // If this day is already playing, pause it
    if (playingDay === dayName) {
      const audio = weekdayAudioRef.current[dayName];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingDay(null);
      return;
    }

    // Stop any currently playing audio
    if (playingDay) {
      const currentAudio = weekdayAudioRef.current[playingDay];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Get or create audio for this day
    let audio = weekdayAudioRef.current[dayName];
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.preload = "auto";
      weekdayAudioRef.current[dayName] = audio;
    }
    // Ensure looping is enabled
    audio.loop = true;
    audio.volume = 0.6;
    audio
      .play()
      .then(() => {
        setPlayingDay(dayName);
      })
      .catch((err) => {
        console.error(`Error playing ${dayName} audio:`, err);
        setPlayingDay(null);
      });
  };
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        boxShadow:
          "0 0 18px rgba(212,168,71,0.4), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3"
        style={{
          background: "transparent",
          border: "1.5px solid rgba(255, 183, 77, 0.4)",
          boxShadow:
            "0 0 20px rgba(255, 140, 50, 0.6), 0 0 40px rgba(255, 100, 30, 0.4), inset 0 0 15px rgba(255, 200, 100, 0.2)",
        }}
      >
        <UiIcon name="alarm" size={16} />
        <h3
          className="text-xs sm:text-sm font-bold uppercase tracking-wide"
          style={{ color: "#D4AF37" }}
        >
          {translations[language]?.alarmSettings || "Chanting Tunes"}
        </h3>
      </div>

      <div className="pt-2 grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-3 overflow-hidden flex flex-col h-full" style={{ border: "1px solid rgba(255, 183, 77, 0.28)" }}>
          <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#FFE4B5" }}>
            {translations[language]?.weekdaysLabel || translations[language]?.weekdays || "Weekdays"}
          </div>
          <div className="mt-6 grid grid-rows-7 gap-2 flex-1">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, index) => {
              const dayValue = dayName === "Sunday" ? 7 : index;
              const active = alarmSettings.disabledDays.includes(dayValue);
              const isPlaying = playingDay === dayName;
              const hasAudio = weekdayAudioFiles[dayName];
              return (
                <button
                  key={dayName}
                  type="button"
                  onClick={() => {
                    if (hasAudio) {
                      handlePlayPause(dayName);
                    }
                    setAlarmSettings((prev) => ({
                      ...prev,
                      disabledDays: active
                        ? prev.disabledDays.filter((d) => d !== dayValue)
                        : [...prev.disabledDays, dayValue],
                    }));
                  }}
                  className="w-full rounded-lg px-2 py-2 text-xs font-semibold transition flex items-center justify-between"
                  style={{
                    background: "transparent",
                    border: active
                      ? "2.5px solid rgba(255, 183, 77, 0.4)"
                      : "2px solid rgba(255, 183, 77, 0.4)",
                    color: "#FFE11A",
                    boxShadow: active
                      ? "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)"
                      : "0 0 12px rgba(212, 168, 71, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  <span className="flex-1 text-left">{translations[language]?.[dayName] || dayName}</span>
                  {hasAudio && (
                    <span
                      role="button"
                      tabIndex={0}
                      className={`ml-2 inline-flex h-5 w-5 items-center justify-center ${isPlaying ? "text-green-300" : "text-yellow-300"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(dayName);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePlayPause(dayName);
                        }
                      }}
                      aria-label={isPlaying ? `Pause ${dayName} audio` : `Play ${dayName} audio`}
                    >
                      <UiIcon name={isPlaying ? "pause" : "play"} size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-3 flex flex-col h-full" style={{ border: "1px solid rgba(255, 183, 77, 0.28)" }}>
          <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#FFE4B5" }}>
            {translations[language]?.notificationPreferences || "Notification Preferences"}
          </div>
          <div className="mt-2 grid grid-rows-7 gap-2 flex-1">
            <AlarmToggleRow
              label={translations[language]?.audioAlerts || "Audio Alerts"}
              checked={alarmSettings.audioEnabled}
              onChange={(checked) => setAlarmSettings((prev) => ({ ...prev, audioEnabled: checked }))}
            />
            <AlarmToggleRow
              label={translations[language]?.silentMode || "Silent Mode"}
              checked={alarmSettings.silentMode}
              onChange={(checked) => setAlarmSettings((prev) => ({ ...prev, silentMode: checked }))}
            />
            <div
              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
              }}
            >
              <div className="min-w-0 flex-1 truncate text-[10px] font-semibold" style={{ color: "#FFE11A" }}>
                {translations[language]?.reminderTime || "Reminder Time"}
              </div>
              <HomeReminderTimeDropdown
                value={alarmSettings.reminderTime}
                options={REMINDER_TIME_OPTIONS}
                suffix={translations[language]?.minutesBeforeStart || "minutes before start"}
                onChange={(nextValue) =>
                  setAlarmSettings((prev) => ({ ...prev, reminderTime: nextValue }))
                }
              />
            </div>
            <button
              type="button"
              onClick={onSave}
              className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                color: "#FFE11A",
                boxShadow:
                  "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
              }}
            >
              {translations[language]?.saveSettings || "Save Settings"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                color: "#FFE11A",
                boxShadow:
                  "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
              }}
            >
              {translations[language]?.resetDefaults || "Reset Defaults"}
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                color: "#FFE11A",
                boxShadow:
                  "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
              }}
            >
              {translations[language]?.scrollUp || "Scroll Up"}
            </button>
            {notificationStatus ? (
              <div
                className="w-full rounded-lg px-2 py-2 text-xs font-bold text-center animate-pulse"
                style={{
                  color: "#FFFFFF",
                  background: "linear-gradient(135deg, rgba(42, 90, 31, 0.9) 0%, rgba(90, 150, 69, 0.9) 100%)",
                  border: "2px solid #FFED70",
                  boxShadow: "0 0 15px rgba(255, 237, 112, 0.3)"
                }}
              >
                {notificationStatus}
              </div>
            ) : null}
            {!window.NativeApp && (
              <>
                <button
                  type="button"
                  onClick={onRequestNotification}
              className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                color: "#FFE11A",
                boxShadow:
                      "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UiIcon name="bell" size={14} color="#FFE11A" />
                    {translations[language]?.enableNotifications || "Enable Notifications"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeReminderTimeDropdown({ value, options, suffix, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedText = `${value} ${suffix}`;

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-[60%] sm:max-w-[58%]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full truncate rounded-lg px-2 py-1 text-left text-xs font-bold outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "2px solid rgba(212, 168, 71, 0.85)",
          color: "#FFE11A",
          boxShadow:
            "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
        }}
      >
        {selectedText}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-56 max-w-[85vw] overflow-hidden rounded-xl"
          role="listbox"
          style={{
            background: "transparent",
            border: "2px solid rgba(212, 168, 71, 0.9)",
            boxShadow:
              "0 12px 30px rgba(0, 0, 0, 0.35), 0 0 18px rgba(212, 168, 71, 0.18)",
          }}
        >
          <div className="max-h-64 overflow-auto">
            {options.map((optionValue) => {
              const isSelected = optionValue === value;
              return (
                <button
                  key={optionValue}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(42, 90, 31, 0.95) 0%, rgba(58, 110, 45, 0.95) 40%, rgba(90, 150, 69, 0.95) 100%)"
                      : "transparent",
                    color: "#ffffff",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
                  }}
                >
                  {optionValue} {suffix}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
