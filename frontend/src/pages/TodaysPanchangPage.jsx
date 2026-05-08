import { useEffect, useMemo, useRef, useState } from "react";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "../astrology/components/formatters";
import GlobalShortcutButtons from "../components/GlobalShortcutButtons";
import { useLanguage } from "../hooks/useLanguage";
import { getLocalPanchang } from "../services/astrologyApi";
import { translations } from "../translations";
import { getAstroDefaults } from "../utils/appSettings";
import { findLocalDayByYmd, normalizeDayRecord } from "../utils/localPanchang";
import "./TodaysPanchangPage.css";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return String(
      value?.name ?? value?.vedic_name ?? value?.title ?? value?.value ?? value?.label ?? value?.display_name ?? ""
    ).trim();
  }
  return "";
}

function firstText(...values) {
  for (const value of values) {
    const text = textOf(value);
    if (text) return text;
  }
  return "";
}

function formatClock(value) {
  const raw = String(value || "").trim();
  if (!raw) return "--";

  if (raw.includes("T")) {
    const parsed = safeDateFromIso(raw);
    if (parsed) {
      return parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (/^\d{2}:\d{2}$/.test(raw)) {
    const [hh, mm] = raw.split(":").map(Number);
    const dt = new Date();
    dt.setHours(hh, mm, 0, 0);
    return dt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return raw;
}

function formatRange(value) {
  const raw = String(value || "").trim();
  if (!raw) return "--";
  return raw.replace(/\s+to\s+/gi, " - ").replace(/\s+-\s+/g, " - ");
}

export default function TodaysPanchangPage() {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  const [panchang, setPanchang] = useState(null);
  const [dayRecord, setDayRecord] = useState(null);
  const [error, setError] = useState("");
  const languageRef = useRef(language);
  const defaults = useMemo(() => getAstroDefaults(), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const localDay = await findLocalDayByYmd(ymdToday(), { signal: controller.signal });
        if (active) {
          setDayRecord(normalizeDayRecord(localDay, { tzOffset: defaults.tzOffset }));
        }
      } catch {
        if (active) setDayRecord(null);
      }
    };

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [now.getDate(), now.getMonth(), now.getFullYear(), defaults.tzOffset]);

  useEffect(() => {
    const controller = new AbortController();
    setError("");

    const run = async () => {
      const currentLang = languageRef.current;
      try {
        const payload = await getLocalPanchang(
          {
            date: ymdToday(),
            time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: currentLang,
          },
          { signal: controller.signal }
        );

        if (languageRef.current === currentLang) {
          setPanchang(payload?.data || payload || null);
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        setPanchang(null);
        setError(e?.message || "Failed to load Panchang");
      }
    };

    const timeout = setTimeout(run, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [language, now.getMinutes(), defaults]);

  const t = translations[language] || translations.en;
  const translateTerm = (raw) => {
    if (!raw) return "--";
    const value = String(raw).trim();
    return t[value] || t[value.split(" ")[0]] || value;
  };

  const details = useMemo(() => {
    const refDate = safeDateFromIso(
      buildIsoDatetime({
        date: ymdToday(),
        time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
        tzOffset: defaults.tzOffset,
      })
    );

    const activeTithi = findActiveByTime(panchang?.tithi, refDate);
    const activeNakshatra = findActiveByTime(panchang?.nakshatra, refDate);
    const weekdayText = translateTerm(
      firstText(
        panchang?.vaara,
        panchang?.weekday,
        panchang?.day,
        dayRecord?.Weekday,
        now.toLocaleDateString("en-US", { weekday: "long" })
      )
    );

    const paksha = translateTerm(firstText(activeTithi?.paksha, panchang?.paksha, dayRecord?.Paksha));
    const tithi = translateTerm(firstText(activeTithi?.name, dayRecord?.Tithi));
    const shubhMuhurat = firstText(
      dayRecord?.Abhijit,
      dayRecord?.["Abhijit"],
      dayRecord?.["Abhijit Muhurat"],
      dayRecord?.["Abhijit Muhurtam"],
      dayRecord?.["Amrit Kalam"]
    );
    const yearNameRaw = firstText(dayRecord?.["Shaka Samvat"], panchang?.samvatsara?.name, panchang?.samvatsara);

    return {
      title: "Today's Panchang",
      // welcomeLine1: "Namaste 🙏",
      welcomeLine2: "Welcome to Talking Calendar",
      day: weekdayText || "--",
      pakshaTithi: [paksha, tithi].filter((value) => value && value !== "--").join(" ") || "--",
      rahukalam: formatRange(firstText(dayRecord?.["Rahu Kalam"], dayRecord?.RahuKalam)),
      shubhMuhurat: formatRange(shubhMuhurat),
      nakshatra: translateTerm(firstText(activeNakshatra?.name, dayRecord?.Nakshatra)),
      sunrise: formatClock(firstText(panchang?.sunrise, dayRecord?.Sunrise, dayRecord?.SunriseIso)),
      sunset: formatClock(firstText(panchang?.sunset, dayRecord?.Sunset, dayRecord?.SunsetIso)),
      yearName: String(translateTerm(yearNameRaw)).replace(/^\d+\s*/, "") || "--",
    };
  }, [dayRecord, defaults.tzOffset, now, panchang, t]);

  return (
    <div className="todays-panchang-shell">
      <GlobalShortcutButtons />
      <div className="todays-panchang-stage">
        <div
          className="todays-panchang-poster"
          style={{ background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)" }}
        >
          <div className="todays-panchang-fade" />

          <div className="poster-block poster-title">
            <div className="poster-title-text">{details.title}</div>
          </div>

          <div className="poster-block poster-welcome">
            <div className="poster-welcome-line1">{details.welcomeLine1}</div>
            <div className="poster-welcome-line2">{details.welcomeLine2}</div>
          </div>

          <div className="poster-block poster-day">
            <div className="poster-day-text">{details.day}</div>
          </div>

          <div className="poster-block poster-paksha">
            <div className="poster-paksha-text">{details.pakshaTithi}</div>
          </div>

          <div className="poster-block poster-rahu-label">
            <div className="poster-label">
              <span className="poster-icon poster-icon-rahu">☾</span>
              <span>Rahu Kalam</span>
            </div>
          </div>

          <div className="poster-block poster-rahu-time">
            <div className="poster-time-text">{details.rahukalam}</div>
          </div>

          <div className="poster-block poster-shubh-label">
            <div className="poster-label">
              <span className="poster-icon poster-icon-shubh">✦</span>
              <span>Shubh Muhurat</span>
            </div>
          </div>

          <div className="poster-block poster-shubh-time">
            <div className="poster-time-text">{details.shubhMuhurat}</div>
          </div>

          <div className="poster-block poster-nakshatra">
            <div className="poster-nakshatra-text">
              <span className="poster-icon poster-icon-nakshatra">✦</span>
              <span className="poster-nakshatra-label">Nakshatra:</span>{" "}
              <span className="poster-nakshatra-value">{details.nakshatra}</span>
            </div>
          </div>

          <div className="poster-block poster-sunrise">
            <div className="poster-sun-text">
              <span className="poster-icon poster-icon-sunrise">☀</span>
              <span className="poster-sun-label">Sunrise:</span> <span className="poster-sun-value">{details.sunrise}</span>
            </div>
          </div>

          <div className="poster-block poster-sunset">
            <div className="poster-sun-text">
              <span className="poster-icon poster-icon-sunset">☾</span>
              <span className="poster-sun-label">Sunset:</span> <span className="poster-sun-value">{details.sunset}</span>
            </div>
          </div>

          <div className="poster-block poster-yearname">
            <div className="poster-yearname-text">
              <span className="poster-icon poster-icon-sunrise">☀</span>
              <span className="poster-yearname-label">Year:</span> <span className="poster-yearname-value">{details.yearName}</span>
            </div>
          </div>

          {error ? (
            <div className="poster-error">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
