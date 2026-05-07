import { useEffect, useMemo, useRef, useState } from "react";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "../astrology/components/formatters";
import { getLocalPanchang } from "../services/astrologyApi";
import { translations } from "../translations";
import { getAstroDefaults } from "../utils/appSettings";
import { useLanguage } from "../hooks/useLanguage";
import { findLocalDayByYmd, normalizeDayRecord } from "../utils/localPanchang";
import "./PanchangPosterPage.css";

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

function PosterText({ className, children, as: Tag = "div" }) {
  return <Tag className={`poster-overlay-text ${className}`.trim()}>{children}</Tag>;
}

export default function PanchangPosterPage() {
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

    return {
      title: "Today's Panchang",
      namaste: "Namaste",
      welcome: "Welcome to today's Panchang",
      date: now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      weekday: weekdayText || "--",
      pakshaTithi: [paksha, tithi].filter((value) => value && value !== "--").join(" ") || "--",
      rahu: formatRange(firstText(dayRecord?.["Rahu Kalam"], dayRecord?.RahuKalam)),
      shubh: formatRange(shubhMuhurat),
      nakshatra: translateTerm(firstText(activeNakshatra?.name, dayRecord?.Nakshatra)),
      sunrise: formatClock(firstText(panchang?.sunrise, dayRecord?.Sunrise, dayRecord?.SunriseIso)),
      sunset: formatClock(firstText(panchang?.sunset, dayRecord?.Sunset, dayRecord?.SunsetIso)),
      blessing: "Stay Blessed",
    };
  }, [dayRecord, defaults.tzOffset, now, panchang, t]);

  return (
    <div className="panchang-poster-shell">
      <main className="panchang-poster-stage">
        <section className="panchang-poster-artboard" aria-label="Panchang poster">
          <img
            src="/today's panchng image.png"
            alt="Panchang poster background"
            className="panchang-poster-background"
          />

          <PosterText className="poster-title" as="h1">
            {details.title}
          </PosterText>

          <PosterText className="poster-namaste">{details.namaste}</PosterText>
          <PosterText className="poster-welcome">{details.welcome}</PosterText>
          <PosterText className="poster-date">{details.date}</PosterText>
          <PosterText className="poster-weekday">{details.weekday}</PosterText>
          <PosterText className="poster-paksha">{details.pakshaTithi}</PosterText>

          <PosterText className="poster-rahu-label">Rahu Kalam</PosterText>
          <PosterText className="poster-rahu-value">{details.rahu}</PosterText>

          <PosterText className="poster-shubh-label">Shubh Muhurat</PosterText>
          <PosterText className="poster-shubh-value">{details.shubh}</PosterText>

          <PosterText className="poster-nakshatra-label">Nakshatra</PosterText>
          <PosterText className="poster-nakshatra-value">{details.nakshatra}</PosterText>

          <PosterText className="poster-sunrise-label">Sunrise</PosterText>
          <PosterText className="poster-sunrise-value">{details.sunrise}</PosterText>

          <PosterText className="poster-sunset-label">Sunset</PosterText>
          <PosterText className="poster-sunset-value">{details.sunset}</PosterText>

          <PosterText className="poster-blessing">{details.blessing}</PosterText>

          {error ? <div className="poster-error-banner">{error}</div> : null}
        </section>
      </main>
    </div>
  );
}

