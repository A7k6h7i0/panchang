import { useEffect, useState, useRef } from "react";
import { translateText } from "../translations";
import {
  getTithiSpeech,
  getMuhurtaAlert,
  getMuhurtaImmediateAlert,
  getMuhurtaName,
  isAuspiciousMuhurta,
} from "../utils/speechTemplates";
import { speakCloud, stopSpeech, initAudioContext } from "../utils/cloudSpeech";

export default function DayDetails({
  day,
  language,
  translations,
  isHeaderMode = false,
  isSidebarMode = false,
}) {
  const [notificationsSent, setNotificationsSent] = useState({});
  const [festivals, setFestivals] = useState([]);
  const [userInteracted, setUserInteracted] = useState(false);

  // speech control
  const spokenLanguagesRef = useRef(new Set()); // languages already spoken in this app session
  const prevLanguageRef = useRef(language);
  const isSpeakingSequenceRef = useRef(false);

  // Handle user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        initAudioContext();
        setUserInteracted(true);
        console.log("✅ User interaction detected - audio enabled");
      }
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [userInteracted]);

  // Load festivals data
  useEffect(() => {
    if (!day) return;

    const [dayPart, monthPart, yearPart] = day.date.split("/");
    const year = parseInt(yearPart, 10);

    fetch(`/data/festivals/${year}.json`)
      .then((res) => res.json())
      .then((data) => {
        const dateKey = `${yearPart}-${monthPart}-${dayPart}`;
        const dayFestivals = data[dateKey] || [];
        setFestivals(dayFestivals);
      })
      .catch((err) => {
        console.error("Error fetching festivals:", err);
        setFestivals([]);
      });
  }, [day]);

  if (!day) {
    return (
      <div
        className="text-center p-6 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(80, 20, 10, 0.95) 0%, rgba(120, 30, 15, 0.9) 100%)",
          border: "3px solid rgba(255, 140, 50, 0.7)",
          boxShadow: `
            0 0 30px rgba(255, 140, 50, 0.6),
            0 0 60px rgba(255, 100, 30, 0.4),
            inset 0 0 20px rgba(255, 140, 50, 0.15)
          `,
          color: "rgba(255, 220, 150, 0.6)",
        }}
      >
        {translations.selectDate}
      </div>
    );
  }

  const parseDate = (dateStr) => {
    const [d, m, y] = dateStr.split("/");
    return new Date(y, m - 1, d);
  };

  const dateObj = parseDate(day.date);
  const today = new Date();

  const isToday =
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  const getLocalizedDate = () => {
    const dayNum = dateObj.getDate();
    const monthName = translations.months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const weekday = translations[day.Weekday] || day.Weekday;
    return { dayNum, monthName, year, weekday };
  };

  const { dayNum, monthName, year, weekday } = getLocalizedDate();

  const v = (key) => (day?.[key] ? translateText(day[key], translations) : "-");

  const vPaksha = v("Paksha");
  const vTithi = v("Tithi");
  const vNakshatra = v("Nakshatra");
  const vYoga = v("Yoga");

  // Extract only year name from "Shaka Samvat" field
  const getYearName = () => {
    const shakaSamvat = day?.["Shaka Samvat"] || "-";
    if (shakaSamvat === "-") return "-";
    const parts = shakaSamvat.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : shakaSamvat;
  };

  const vShakaSamvat = getYearName();

  const vSunrise = v("Sunrise");
  const vSunset = v("Sunset");
  const vMoonrise = v("Moonrise");
  const vMoonset = v("Moonset");

  const vAbhijit = v("Abhijit");
  const vRahu = v("Rahu Kalam");
  const vYamaganda = v("Yamaganda");
  const vGulikai = v("Gulikai Kalam");
  const vDur = v("Dur Muhurtam");
  const vAmrit = v("Amrit Kalam");
  const vVarjyam = v("Varjyam");

  // Get year label based on language
  const getYearLabel = () => {
    const labels = {
      en: "Year",
      te: "నామసం",
      ta: "ஆண்டு",
      ml: "വർഷം",
      kn: "ವರ್ಷ",
      hi: "वर्ष",
    };
    return labels[language] || "Year";
  };

  // ---------- SPEECH SEQUENCE CONTROL ----------

  // builds a combined muhurta alert text if needed (for current time)
  const buildImmediateMuhurtaTextIfNeeded = async () => {
    if (!isToday) return null;

    const muhurtas = [
      { key: "Dur Muhurtam", value: day["Dur Muhurtam"] },
      { key: "Rahu Kalam", value: day["Rahu Kalam"] },
      { key: "Yamaganda", value: day["Yamaganda"] },
      { key: "Gulikai Kalam", value: day["Gulikai Kalam"] },
      { key: "Abhijit", value: day["Abhijit"] },
      { key: "Amrit Kalam", value: day["Amrit Kalam"] },
      { key: "Varjyam", value: day["Varjyam"] },
    ];

    const triggered = [];

    for (const m of muhurtas) {
      if (!m.value || m.value === "-") continue;
      try {
        const res = await fetch("http://localhost:5000/check-durmuhurtham-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeString: m.value }),
        });
        const data = await res.json();
        if (data.isWithinOneHour && !data.hasPassed) {
          triggered.push({ ...m, minutesLeft: data.minutesUntilStart });
        }
      } catch (e) {
        console.error("check-durmuhurtham-status error:", e);
      }
    }

    if (!triggered.length) return null;

    const names = triggered.map((m) => getMuhurtaName(m.key, language));
    const timings = triggered.map((m) => m.value);
    const isAuspicious = triggered.every((m) => isAuspiciousMuhurta(m.key));

    return getMuhurtaImmediateAlert({
      language,
      names,
      timings,
      minutesLeft: triggered[0].minutesLeft,
      isAuspicious,
    });
  };

  // Single controlled sequence: Tithi first, then muhurta (if any)
  const speakSequence = async () => {
    if (!isToday || !userInteracted) return;
    if (isSpeakingSequenceRef.current) return;

    const spokenSet = spokenLanguagesRef.current;
    if (spokenSet.has(language)) {
      // this language already spoken in this app session
      return;
    }

    isSpeakingSequenceRef.current = true;
    try {
      // Always stop any current speech before new language starts
      stopSpeech();

      const tithiText = getTithiSpeech({ language, tithi: vTithi });
      if (tithiText) {
        await speakCloud(tithiText, language);
      }

      const muhurtaText = await buildImmediateMuhurtaTextIfNeeded();
      if (muhurtaText) {
        await speakCloud(muhurtaText, language);
      }

      spokenSet.add(language);
    } finally {
      isSpeakingSequenceRef.current = false;
    }
  };

  // Trigger speech:
  // - on first load for today
  // - on language changes for today
  useEffect(() => {
    if (!isToday || !userInteracted) return;

    const prevLang = prevLanguageRef.current;
    const langChanged = prevLang !== language;
    prevLanguageRef.current = language;

    if (langChanged) {
      stopSpeech();
    }

    speakSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isToday, userInteracted]);

  // 🔔 Universal Muhurta Notification Effect (with combined muhurtas)
  useEffect(() => {
    if (!isToday || !userInteracted) {
      console.log("⏸️ Notification checker paused:", { isToday, userInteracted });
      return;
    }

    const muhurtas = [
      { key: "Dur Muhurtam", value: day["Dur Muhurtam"] },
      { key: "Rahu Kalam", value: day["Rahu Kalam"] },
      { key: "Yamaganda", value: day["Yamaganda"] },
      { key: "Gulikai Kalam", value: day["Gulikai Kalam"] },
      { key: "Abhijit", value: day["Abhijit"] },
      { key: "Amrit Kalam", value: day["Amrit Kalam"] },
      { key: "Varjyam", value: day["Varjyam"] },
    ];

    const muhurtaGroups = new Map();

    const checkAllNotifications = async () => {
      muhurtaGroups.clear();

      for (const muhurta of muhurtas) {
        if (!muhurta.value || muhurta.value === "-") continue;
        if (notificationsSent[muhurta.key]) continue;

        try {
          const response = await fetch("http://localhost:5000/check-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeString: muhurta.value }),
          });

          const data = await response.json();

          if (data.shouldTrigger) {
            const alertKey = data.alertTime.substring(0, 5);
            if (!muhurtaGroups.has(alertKey)) {
              muhurtaGroups.set(alertKey, []);
            }
            muhurtaGroups.get(alertKey).push(muhurta);
          }
        } catch (error) {
          console.error(
            `❌ Error checking ${muhurta.key} notification:`,
            error
          );
        }
      }

      for (const [, groupedMuhurtas] of muhurtaGroups.entries()) {
        if (groupedMuhurtas.length === 0) continue;

        const alreadySent = groupedMuhurtas.some(
          (m) => notificationsSent[m.key]
        );
        if (alreadySent) continue;

        console.log(
          `🔔 TRIGGERING ALERT for: ${groupedMuhurtas
            .map((m) => m.key)
            .join(", ")}`
        );

        const names = groupedMuhurtas.map((m) =>
          getMuhurtaName(m.key, language)
        );
        const timings = groupedMuhurtas.map((m) => m.value);
        const isAuspicious = groupedMuhurtas.every((m) =>
          isAuspiciousMuhurta(m.key)
        );

        const text = getMuhurtaAlert({
          language,
          names,
          timings,
          isAuspicious,
        });

        console.log(`🗣️ Speaking in ${language}:`, text);
        await speakCloud(text, language);

        const updates = {};
        groupedMuhurtas.forEach((m) => {
          updates[m.key] = true;
        });
        setNotificationsSent((prev) => ({ ...prev, ...updates }));
      }
    };

    console.log("✅ Starting notification checker for all muhurtas");
    checkAllNotifications();
    const interval = setInterval(checkAllNotifications, 10000);

    return () => {
      clearInterval(interval);
      console.log("🛑 Stopping notification checker");
    };
  }, [day, language, notificationsSent, isToday, userInteracted]);

  // Reset notification flags when day changes
  useEffect(() => {
    setNotificationsSent({});
    console.log("🔄 Notification flags reset for new day");
  }, [day?.date]);

  // If in header mode, render compact version (without "Day Details" heading)
  if (isHeaderMode) {
    return (
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background:
            "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
          border: "3px solid rgba(255, 140, 50, 0.8)",
          boxShadow: `
            0 0 35px rgba(255, 140, 50, 0.8),
            0 0 70px rgba(255, 100, 30, 0.6),
            inset 0 0 30px rgba(255, 140, 50, 0.2)
          `,
        }}
      >
        <div className="p-4 sm:p-5">
          {/* MAIN DATE CARD */}
          <div
            className="rounded-xl p-3 sm:p-4 backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(100, 30, 15, 0.95) 0%, rgba(120, 35, 18, 0.9) 100%)",
              border: "3px solid rgba(255, 140, 50, 0.7)",
              boxShadow: `
                0 0 25px rgba(255, 140, 50, 0.7),
                0 0 50px rgba(255, 100, 30, 0.5),
                inset 0 0 20px rgba(255, 140, 50, 0.15)
              `,
            }}
          >
            {/* Date icon + Day Name + Tithi Name */}
            <div className="flex items-start gap-3 mb-2">
              {/* Calendar Icon Box */}
              <div
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 180, 70, 0.3) 0%, rgba(180, 130, 50, 0.4) 100%)",
                  border: "2.5px solid rgba(255, 140, 50, 0.8)",
                  boxShadow: `
                    0 0 20px rgba(255, 140, 50, 0.8),
                    0 0 40px rgba(255, 100, 30, 0.6),
                    inset 0 0 15px rgba(255, 200, 100, 0.3)
                  `,
                }}
              >
                <span
                  className="text-2xl sm:text-3xl font-black"
                  style={{
                    color: "#FFE4B5",
                    textShadow:
                      "0 2px 8px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 215, 0, 0.6)",
                  }}
                >
                  {dayNum}
                </span>
              </div>

              {/* Day Name and Tithi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="text-lg sm:text-xl font-black"
                    style={{
                      color: "#FFE4B5",
                      textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {weekday}
                  </div>
                  <div
                    className="text-sm sm:text-base font-bold"
                    style={{
                      color: "#D4AF37",
                    }}
                  >
                    • {vTithi}
                  </div>
                </div>
              </div>
            </div>

            {/* Paksha and Year ALWAYS in same row */}
            <div className="flex items-center gap-2 flex-wrap">
              {vPaksha !== "-" && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 backdrop-blur-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                    border: "2.5px solid rgba(255, 140, 50, 0.7)",
                    color: "#FFE4B5",
                    boxShadow: `
                      0 0 20px rgba(255, 140, 50, 0.6),
                      0 0 40px rgba(255, 100, 30, 0.4),
                      inset 0 0 15px rgba(255, 200, 100, 0.2)
                    `,
                  }}
                >
                  <span style={{ color: "#D4AF37" }}>◐</span>
                  {vPaksha}
                </div>
              )}

              {/* Year Name (only name, no number) - SAME STYLE AS KRISHNA PAKSHA */}
              {vShakaSamvat !== "-" && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 backdrop-blur-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                    border: "2.5px solid rgba(255, 140, 50, 0.7)",
                    color: "#FFE4B5",
                    boxShadow: `
                      0 0 20px rgba(255, 140, 50, 0.6),
                      0 0 40px rgba(255, 100, 30, 0.4),
                      inset 0 0 15px rgba(255, 200, 100, 0.2)
                    `,
                  }}
                >
                  <span style={{ color: "#D4AF37" }}>📅</span>
                  <span style={{ color: "#D4AF37" }}>{getYearLabel()}:</span>
                  <span>{vShakaSamvat}</span>
                </div>
              )}
            </div>

            {/* Festival Section */}
            {festivals.length > 0 && (
              <div className="space-y-1 mt-2">
                {festivals.map((festival, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold mr-2 mb-1 backdrop-blur-sm"
                    style={{
                      background: "rgba(255, 100, 50, 0.3)",
                      border: "2px solid rgba(255, 100, 50, 0.6)",
                      color: "#FFE4B5",
                      boxShadow:
                        "0 0 15px rgba(255, 100, 50, 0.5), inset 0 0 10px rgba(255, 140, 50, 0.2)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{
                        background: "#FF4444",
                        boxShadow: "0 0 10px rgba(255, 68, 68, 0.8)",
                      }}
                    />
                    {festival}
                  </div>
                ))}
              </div>
            )}

            {festivals.length === 0 && (
              <div
                className="text-xs mt-2"
                style={{
                  color: "rgba(212, 175, 55, 0.6)",
                }}
              >
                {translations.noFestivalListed || "No festival listed."}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SIDEBAR MODE – sections with new UI
  if (isSidebarMode) {
    return (
      <div className="space-y-3">
        {/* Panchang Elements - EXACT DATE-CELL GREEN */}
        <SectionCard
          title={translations.panchangElements || "Panchang Elements"}
          icon="✦"
          variant="panchang"
        >
          <InfoRow
            label={translations.nakshatra || "Nakshatra"}
            value={vNakshatra}
          />
          <InfoRow label={translations.yoga || "Yoga"} value={vYoga} />

          {/* Auspicious Timings - Amrit above Abhijit */}
          {vAmrit !== "-" && (
            <InfoRow
              label={
                translations.amritKalamAuspicious || "Amrit Kalam (Auspicious)"
              }
              value={vAmrit}
            />
          )}
          {vAbhijit !== "-" && (
            <InfoRow
              label={
                translations.abhijitAuspicious || "Abhijit (Auspicious)"
              }
              value={vAbhijit}
            />
          )}
        </SectionCard>

        {/* Sun/Moon Timings */}
        <SectionCard
          title={translations.sunMoonTimings || "Sun & Moon Timings"}
          icon="☀"
          variant="sunmoon"
        >
          <div className="grid grid-cols-2 gap-2">
            {/* Sunrise / Sunset – orange */}
            <TimeBox
              label={translations.sunrise || "Sunrise"}
              value={vSunrise}
              scheme="orange"
            />
            <TimeBox
              label={translations.sunset || "Sunset"}
              value={vSunset}
              scheme="orange"
            />
            {/* Moonrise / Moonset – blue */}
            <TimeBox
              label={translations.moonrise || "Moonrise"}
              value={vMoonrise}
              scheme="blue"
            />
            <TimeBox
              label={translations.moonset || "Moonset"}
              value={vMoonset}
              scheme="blue"
            />
          </div>
        </SectionCard>

        {/* Inauspicious Timings WITH BLINKING RED DOT */}
        <div className="relative">
          <div
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle, #FF0000 0%, #DC143C 50%, #8B0000 100%)",
              boxShadow:
                "0 0 10px rgba(255,0,0,0.9), 0 0 20px rgba(255,0,0,0.6)",
            }}
          />
          <SectionCard
            title={translations.inauspiciousTimings || "Inauspicious Timings"}
            icon="⚠️"
            variant="inauspicious"
          >
            {vRahu !== "-" && (
              <DangerBox
                label={translations.rahuKalam || "Rahu Kalam"}
                value={vRahu}
              />
            )}
            {vYamaganda !== "-" && (
              <DangerBox
                label={translations.yamaganda || "Yamaganda"}
                value={vYamaganda}
              />
            )}
            {vGulikai !== "-" && (
              <DangerBox
                label={translations.gulikaiKalam || "Gulikai Kalam"}
                value={vGulikai}
              />
            )}
            {vDur !== "-" && (
              <DangerBox
                label={translations.durMuhurtam || "Dur Muhurtam"}
                value={vDur}
              />
            )}
            {vVarjyam !== "-" && (
              <DangerBox
                label={translations.varjyam || "Varjyam"}
                value={vVarjyam}
              />
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  // Full version (original - not used anymore but kept for fallback)
  return null;
}

// ========== COMPONENT HELPERS ==========

function SectionCard({ title, icon, children, variant }) {
  const isPanchang = variant === "panchang";
  const isSunMoon = variant === "sunmoon";
  const isInauspicious = variant === "inauspicious";

  let background =
    "linear-gradient(135deg, rgba(120, 35, 18, 0.7) 0%, rgba(100, 30, 15, 0.75) 100%)";
  let border = "2px solid rgba(255, 140, 50, 0.5)";
  let boxShadow =
    "0 0 20px rgba(255, 140, 50, 0.4), inset 0 0 15px rgba(255, 140, 50, 0.1)";

  if (isPanchang) {
    // match date-cell green
    background =
      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)";
    border = "2.5px solid #d4a847";
    boxShadow =
      "0 0 18px rgba(212,168,71,0.3), inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2)";
  } else if (isSunMoon) {
    background =
      "linear-gradient(135deg, #FF6B35 0%, #FF8C32 40%, #FF9F45 100%)";
    border = "2px solid rgba(255, 180, 120, 0.9)";
    boxShadow =
      "0 0 22px rgba(255,140,50,0.5), inset 0 0 15px rgba(255,255,255,0.15)";
  } else if (isInauspicious) {
    background =
      "linear-gradient(135deg, #8B0000 0%, #B22222 40%, #DC143C 100%)";
    border = "2px solid rgba(255, 107, 107, 0.9)";
    boxShadow =
      "0 0 22px rgba(220,20,60,0.6), inset 0 0 15px rgba(0,0,0,0.3)";
  }

  return (
    <div
      className="rounded-xl p-3 backdrop-blur-sm"
      style={{
        background,
        border,
        boxShadow,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3
          className="text-xs sm:text-sm font-bold uppercase tracking-wide"
          style={{
            color: "#FFE4B5",
          }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      className="rounded-lg p-2.5 backdrop-blur-sm"
      style={{
        background: "rgba(0, 0, 0, 0.25)",
        border: "1.5px solid rgba(255, 237, 179, 0.4)",
      }}
    >
      <div
        className="text-xs uppercase tracking-wide mb-1 font-semibold"
        style={{
          color: "#ffedb3",
        }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold"
        style={{
          color: "#FFFFFF",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TimeBox({ label, value, scheme }) {
  const isOrange = scheme === "orange";
  const isBlue = scheme === "blue";
  const bg = isOrange
    ? "linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA458 100%)"
    : isBlue
      ? "linear-gradient(135deg, rgba(100, 120, 160, 0.5) 0%, rgba(80, 100, 140, 0.6) 100%)"
      : "transparent";
  const border = isOrange ? "#FFB380" : isBlue ? "rgba(120, 150, 180, 0.7)" : "transparent";
  const labelColor = isOrange ? "#FFF5E6" : "#E0E8F0";

  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        boxShadow:
          "0 0 15px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.2)",
      }}
    >
      <div
        className="text-[10px] sm:text-xs font-bold mb-1"
        style={{ color: labelColor }}
      >
        {label}
      </div>
      <div
        className="text-xs sm:text-sm md:text-base font-black"
        style={{
          color: "#FFFFFF",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DangerBox({ label, value }) {
  return (
    <div
      className="rounded-lg p-2.5 mb-2 backdrop-blur-sm flex justify-between items-center"
      style={{
        background:
          "linear-gradient(135deg, #DC143C 0%, #B22222 50%, #8B0000 100%)",
        border: "2px solid rgba(255, 0, 0, 0.6)",
        boxShadow:
          "0 0 15px rgba(220,20,60,0.5), inset 0 1px 2px rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="text-xs uppercase tracking-wide font-semibold"
        style={{
          color: "#FFF5F5",
        }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold"
        style={{
          color: "#FFFFFF",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
