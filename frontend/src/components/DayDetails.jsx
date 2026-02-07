import { useEffect, useState, useRef } from "react";
import { translateText } from "../translations";
import { getTithiSpeech, getMuhurtaAlert, getMuhurtaImmediateAlert, getMuhurtaName, isAuspiciousMuhurta } from "../utils/speechTemplates";
import { speakCloud, stopSpeech, initAudioContext } from "../utils/cloudSpeech";

export default function DayDetails({ day, language, translations }) {
  const [notificationsSent, setNotificationsSent] = useState({});
  const [initialTithiSpoken, setInitialTithiSpoken] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [festivals, setFestivals] = useState([]);
  const prevLanguageRef = useRef(language);
  const isFirstLoadRef = useRef(true);

  // Handle user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        initAudioContext();
        setUserInteracted(true);
        console.log("✅ User interaction detected - audio enabled");
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
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
        // Convert DD/MM/YYYY to YYYY-MM-DD format for matching
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
          background: "linear-gradient(135deg, rgba(80, 20, 10, 0.95) 0%, rgba(120, 30, 15, 0.9) 100%)",
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
  const vShakaSamvat = day?.["Shaka Samvat"] || "-";

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
      te: "నామసంవత్సరం",
      ta: "ஆண்டு",
      ml: "വർഷം",
      kn: "ವರ್ಷ",
      hi: "वर्ष"
    };
    return labels[language] || "Year";
  };

  // 🔊 Speak Tithi ONLY on page load and language changes (for today only)
  useEffect(() => {
    if (!day || !isToday || !userInteracted || isSpeaking) return;

    const languageChanged = prevLanguageRef.current !== language;
    
    // On first load with any language (only once per session)
    if (isFirstLoadRef.current && !initialTithiSpoken) {
      console.log("🔊 Initial page load - Speaking Tithi in", language);
      setIsSpeaking(true);
      const tithiText = getTithiSpeech({ language, tithi: vTithi });
      speakCloud(tithiText, language);
      setInitialTithiSpoken(true);
      isFirstLoadRef.current = false;
      prevLanguageRef.current = language;
      
      // Wait 5 seconds after Tithi before checking muhurta alerts
      setTimeout(() => {
        setIsSpeaking(false);
        checkAndSpeakImmediateAlerts();
      }, 5000);
    }
    // On language change (not first load)
    else if (languageChanged && !isFirstLoadRef.current) {
      console.log("🌍 Language changed from", prevLanguageRef.current, "to", language);
      stopSpeech();
      setIsSpeaking(true);
      
      const tithiText = getTithiSpeech({ language, tithi: vTithi });
      console.log("🔊 Speaking Tithi in", language);
      speakCloud(tithiText, language);
      
      prevLanguageRef.current = language;
      
      // Wait 5 seconds after Tithi before speaking muhurta alerts
      setTimeout(() => {
        setIsSpeaking(false);
        checkAndSpeakImmediateAlerts();
      }, 5000);
    }
  }, [language, day, isToday, vTithi, userInteracted, initialTithiSpoken, isSpeaking]);

  // 🎯 Check and speak immediate alerts on language change (with combined muhurtas)
  const checkAndSpeakImmediateAlerts = async () => {
    if (!isToday) return;

    const muhurtas = [
      { key: "Dur Muhurtam", value: day["Dur Muhurtam"] },
      { key: "Rahu Kalam", value: day["Rahu Kalam"] },
      { key: "Yamaganda", value: day["Yamaganda"] },
      { key: "Gulikai Kalam", value: day["Gulikai Kalam"] },
      { key: "Abhijit", value: day["Abhijit"] },
      { key: "Amrit Kalam", value: day["Amrit Kalam"] },
      { key: "Varjyam", value: day["Varjyam"] },
    ];

    // Check all muhurtas and group ones that should trigger
    const triggeredMuhurtas = [];

    for (const muhurta of muhurtas) {
      if (!muhurta.value || muhurta.value === "-") continue;

      try {
        const response = await fetch("http://localhost:5000/check-durmuhurtham-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeString: muhurta.value }),
        });

        const data = await response.json();

        if (data.isWithinOneHour && !data.hasPassed) {
          triggeredMuhurtas.push({
            ...muhurta,
            minutesLeft: data.minutesUntilStart
          });
        }
      } catch (error) {
        console.error(`❌ Error checking ${muhurta.key} status:`, error);
      }
    }

    // If multiple muhurtas found, combine them
    if (triggeredMuhurtas.length > 0) {
      const names = triggeredMuhurtas.map(m => getMuhurtaName(m.key, language));
      const timings = triggeredMuhurtas.map(m => m.value);
      const isAuspicious = triggeredMuhurtas.every(m => isAuspiciousMuhurta(m.key));
      
      const text = getMuhurtaImmediateAlert({
        language,
        names,
        timings,
        minutesLeft: triggeredMuhurtas[0].minutesLeft,
        isAuspicious
      });

      console.log(`🔔 Speaking immediate alert for: ${triggeredMuhurtas.map(m => m.key).join(", ")}`);
      speakCloud(text, language);
    }
  };

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

    // Group muhurtas by their alert time to combine simultaneous ones
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
            // Group by alert time (rounded to nearest minute)
            const alertKey = data.alertTime.substring(0, 5); // e.g., "08:36"
            if (!muhurtaGroups.has(alertKey)) {
              muhurtaGroups.set(alertKey, []);
            }
            muhurtaGroups.get(alertKey).push(muhurta);
          }
        } catch (error) {
          console.error(`❌ Error checking ${muhurta.key} notification:`, error);
        }
      }

      // Speak combined alerts
      for (const [alertKey, groupedMuhurtas] of muhurtaGroups.entries()) {
        if (groupedMuhurtas.length === 0) continue;
        
        // Check if any have already been sent
        const alreadySent = groupedMuhurtas.some(m => notificationsSent[m.key]);
        if (alreadySent) continue;

        console.log(`🔔 TRIGGERING ALERT for: ${groupedMuhurtas.map(m => m.key).join(", ")}`);

        const names = groupedMuhurtas.map(m => getMuhurtaName(m.key, language));
        const timings = groupedMuhurtas.map(m => m.value);
        const isAuspicious = groupedMuhurtas.every(m => isAuspiciousMuhurta(m.key));

        const text = getMuhurtaAlert({
          language,
          names,
          timings,
          isAuspicious
        });

        console.log(`🗣️ Speaking in ${language}:`, text);
        await speakCloud(text, language);

        // Mark all as sent
        const updates = {};
        groupedMuhurtas.forEach(m => {
          updates[m.key] = true;
        });
        setNotificationsSent(prev => ({ ...prev, ...updates }));
      }
    };

    // Start checking
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
    setInitialTithiSpoken(false);
    setIsSpeaking(false);
    isFirstLoadRef.current = true;
    console.log("🔄 Notification flags reset for new day");
  }, [day?.date]);

  return (
    <div 
      className="relative rounded-3xl overflow-hidden backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
        border: "3px solid rgba(255, 140, 50, 0.8)",
        boxShadow: `
          0 0 35px rgba(255, 140, 50, 0.8),
          0 0 70px rgba(255, 100, 30, 0.6),
          0 0 105px rgba(255, 80, 20, 0.4),
          inset 0 0 30px rgba(255, 140, 50, 0.2)
        `,
      }}
    >
      {/* Particle overlay inside panel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 25%, rgba(255, 200, 100, 0.8), transparent),
            radial-gradient(1px 1px at 45% 35%, rgba(255, 180, 80, 0.7), transparent),
            radial-gradient(1px 1px at 75% 15%, rgba(255, 200, 100, 0.8), transparent),
            radial-gradient(1px 1px at 25% 65%, rgba(255, 180, 80, 0.7), transparent),
            radial-gradient(1px 1px at 85% 75%, rgba(255, 200, 100, 0.8), transparent),
            radial-gradient(1px 1px at 55% 85%, rgba(255, 180, 80, 0.7), transparent),
            radial-gradient(1px 1px at 10% 50%, rgba(255, 200, 100, 0.6), transparent),
            radial-gradient(1px 1px at 90% 40%, rgba(255, 180, 80, 0.7), transparent)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* HEADER: "📖 Day Details" with red dot */}
        <div 
          className="flex items-center justify-between mb-3 pb-3"
          style={{
            borderBottom: "2px solid rgba(255, 140, 50, 0.4)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl">📖</span>
            <h2 
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{
                color: "#FFE4B5",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 140, 50, 0.4)",
              }}
            >
              {translations.dayDetails || "Day Details"}
            </h2>
          </div>
          <div 
            className="h-3 w-3 rounded-full animate-pulse"
            style={{
              background: "#FF4444",
              boxShadow: "0 0 20px rgba(255, 68, 68, 0.9)",
            }}
          />
        </div>

        {/* MAIN DATE CARD - UPDATED LAYOUT */}
        <div 
          className="rounded-2xl p-4 sm:p-5 mb-4 backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(100, 30, 15, 0.95) 0%, rgba(120, 35, 18, 0.9) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.7)",
            boxShadow: `
              0 0 25px rgba(255, 140, 50, 0.7),
              0 0 50px rgba(255, 100, 30, 0.5),
              inset 0 0 20px rgba(255, 140, 50, 0.15)
            `,
          }}
        >
          {/* Date icon + Day Name + Tithi Name */}
          <div className="flex items-start gap-3 mb-3">
            {/* Calendar Icon Box */}
            <div
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, rgba(255, 180, 70, 0.3) 0%, rgba(180, 130, 50, 0.4) 100%)",
                border: "2.5px solid rgba(255, 140, 50, 0.8)",
                boxShadow: `
                  0 0 20px rgba(255, 140, 50, 0.8),
                  0 0 40px rgba(255, 100, 30, 0.6),
                  inset 0 0 15px rgba(255, 200, 100, 0.3)
                `,
              }}
            >
              <span 
                className="text-3xl sm:text-4xl font-black"
                style={{
                  color: "#FFE4B5",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 215, 0, 0.6)",
                }}
              >
                {dayNum}
              </span>
            </div>

            {/* Day Name and Tithi */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div 
                  className="text-xl sm:text-2xl font-black"
                  style={{
                    color: "#FFE4B5",
                    textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {weekday}
                </div>
                <div 
                  className="text-base sm:text-lg font-bold"
                  style={{
                    color: "#D4AF37",
                  }}
                >
                  • {vTithi}
                </div>
              </div>
            </div>
          </div>

          {/* Paksha moved here (where date was) */}
          {vPaksha !== "-" && (
            <div className="mb-3">
              <button
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
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
              </button>
            </div>
          )}

          {/* Year Name (Shaka Samvat) */}
          {vShakaSamvat !== "-" && (
            <div className="mb-3">
              <button
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(100, 120, 180, 0.5) 0%, rgba(80, 100, 160, 0.6) 100%)",
                  border: "2.5px solid rgba(120, 150, 220, 0.7)",
                  color: "#E0F0FF",
                  boxShadow: `
                    0 0 20px rgba(120, 150, 220, 0.6),
                    0 0 40px rgba(100, 130, 200, 0.4),
                    inset 0 0 15px rgba(150, 180, 240, 0.2)
                  `,
                }}
              >
                <span style={{ color: "#B0D0FF" }}>📅</span>
                <span style={{ color: "#B0D0FF" }}>{getYearLabel()}:</span>
                <span style={{ color: "#E0F0FF" }}>{vShakaSamvat}</span>
              </button>
            </div>
          )}

          {/* Festival Section */}
          {festivals.length > 0 && (
            <div className="space-y-2">
              {festivals.map((festival, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold mr-2 mb-2 backdrop-blur-sm"
                  style={{
                    background: "rgba(255, 100, 50, 0.3)",
                    border: "2px solid rgba(255, 100, 50, 0.6)",
                    color: "#FFE4B5",
                    boxShadow: "0 0 15px rgba(255, 100, 50, 0.5), inset 0 0 10px rgba(255, 140, 50, 0.2)",
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
              className="text-xs sm:text-sm"
              style={{
                color: "rgba(212, 175, 55, 0.6)",
              }}
            >
              {translations.noFestivalListed || "No festival listed."}
            </div>
          )}
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div 
          className="space-y-3 max-h-[calc(100vh-420px)] sm:max-h-[calc(100vh-380px)] overflow-y-auto pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 140, 50, 0.6) rgba(100, 30, 15, 0.3)",
          }}
        >
          {/* Panchang Elements - WITH DULL GREEN BACKGROUND */}
          <SectionCard title={translations.panchangElements || "Panchang Elements"} icon="✦">
            <InfoRow label={translations.nakshatra || "Nakshatra"} value={vNakshatra} />
            <InfoRow label={translations.yoga || "Yoga"} value={vYoga} />
            
            {/* Auspicious Timings moved here */}
            {vAbhijit !== "-" && (
              <InfoRow label={translations.abhijitAuspicious || "Abhijit (Auspicious)"} value={vAbhijit} />
            )}
            {vAmrit !== "-" && (
              <InfoRow label={translations.amritKalam || "Amrit Kalam (Auspicious)"} value={vAmrit} />
            )}
          </SectionCard>

          {/* Sun/Moon Timings */}
          <SectionCard title={translations.sunMoonTimings || "Sun & Moon Timings"} icon="☀">
            <div className="grid grid-cols-2 gap-2">
              <TimeBox label={translations.sunrise || "Sunrise"} value={vSunrise} color="orange" />
              <TimeBox label={translations.sunset || "Sunset"} value={vSunset} color="blue" />
              <TimeBox label={translations.moonrise || "Moonrise"} value={vMoonrise} color="lightblue" />
              <TimeBox label={translations.moonset || "Moonset"} value={vMoonset} color="darkblue" />
            </div>
          </SectionCard>

          {/* Inauspicious Timings */}
          <SectionCard title={translations.inauspiciousTimings || "Inauspicious Timings"} icon="⚠️">
            {vRahu !== "-" && (
              <DangerBox label={translations.rahuKalam || "Rahu Kalam"} value={vRahu} color="red" />
            )}
            {vYamaganda !== "-" && (
              <DangerBox label={translations.yamaganda || "Yamaganda"} value={vYamaganda} color="orange" />
            )}
            {vGulikai !== "-" && (
              <DangerBox label={translations.gulikaiKalam || "Gulikai Kalam"} value={vGulikai} color="red" />
            )}
            {vDur !== "-" && (
              <DangerBox label={translations.durMuhurtam || "Dur Muhurtam"} value={vDur} color="red" />
            )}
            {vVarjyam !== "-" && (
              <DangerBox label={translations.varjyam || "Varjyam"} value={vVarjyam} color="red" />
            )}
          </SectionCard>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(100, 30, 15, 0.3);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 140, 50, 0.6);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 140, 50, 0.8);
        }
      `}</style>
    </div>
  );
}

// ========== COMPONENT HELPERS ==========

function SectionCard({ title, icon, children }) {
  // Dull green background for Panchang Elements section
  const isDullGreen = title.includes("Panchang") || title.includes("పంచాంగం") || title.includes("पंचांग");
  
  return (
    <div 
      className="rounded-xl p-3 backdrop-blur-sm"
      style={{
        background: isDullGreen 
          ? "linear-gradient(135deg, rgba(80, 100, 70, 0.5) 0%, rgba(70, 90, 60, 0.55) 100%)"
          : "linear-gradient(135deg, rgba(120, 35, 18, 0.7) 0%, rgba(100, 30, 15, 0.75) 100%)",
        border: isDullGreen 
          ? "2px solid rgba(100, 140, 80, 0.6)"
          : "2px solid rgba(255, 140, 50, 0.5)",
        boxShadow: isDullGreen
          ? "0 0 20px rgba(100, 140, 80, 0.4), inset 0 0 15px rgba(100, 140, 80, 0.1)"
          : "0 0 20px rgba(255, 140, 50, 0.4), inset 0 0 15px rgba(255, 140, 50, 0.1)",
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
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div 
      className="rounded-lg p-2.5 backdrop-blur-sm"
      style={{
        background: "rgba(140, 100, 40, 0.35)",
        border: "1.5px solid rgba(255, 140, 50, 0.4)",
      }}
    >
      <div 
        className="text-xs uppercase tracking-wide mb-1 font-semibold"
        style={{
          color: "#D4AF37",
        }}
      >
        {label}
      </div>
      <div 
        className="text-sm font-bold"
        style={{
          color: "#FFE4B5",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TimeBox({ label, value, color }) {
  const getColor = () => {
    switch(color) {
      case 'orange': return '#FF8C32';
      case 'blue': return '#4A90E2';
      case 'lightblue': return '#87CEEB';
      case 'darkblue': return '#1E3A8A';
      default: return '#D4AF37';
    }
  };

  return (
    <div 
      className="rounded-lg p-2.5 backdrop-blur-sm"
      style={{
        background: "rgba(180, 130, 50, 0.3)",
        border: "1.5px solid rgba(255, 140, 50, 0.4)",
      }}
    >
      <div 
        className="text-xs uppercase tracking-wide mb-1 font-semibold"
        style={{
          color: "#D4AF37",
        }}
      >
        {label}
      </div>
      <div 
        className="text-xs sm:text-sm font-bold"
        style={{
          color: getColor(),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DangerBox({ label, value, color }) {
  const getColor = () => {
    switch(color) {
      case 'orange': return '#FF9966';
      case 'red': return '#FF0000';
      default: return '#FF6B4A';
    }
  };

  const getBorderColor = () => {
    switch(color) {
      case 'orange': return 'rgba(255, 153, 102, 0.6)';
      case 'red': return 'rgba(255, 0, 0, 0.6)';
      default: return 'rgba(255, 100, 60, 0.5)';
    }
  };

  const getBackground = () => {
    switch(color) {
      case 'orange': return 'rgba(255, 153, 102, 0.25)';
      case 'red': return 'rgba(200, 80, 50, 0.3)';
      default: return 'rgba(200, 80, 50, 0.3)';
    }
  };

  return (
    <div 
      className="rounded-lg p-2.5 mb-2 backdrop-blur-sm"
      style={{
        background: getBackground(),
        border: `2px solid ${getBorderColor()}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span 
          className="font-black text-sm"
          style={{ color: getColor() }}
        >
          !
        </span>
        <div 
          className="text-xs uppercase tracking-wide font-semibold"
          style={{
            color: "#FFB499",
          }}
        >
          {label}
        </div>
      </div>
      <div 
        className="text-sm font-bold"
        style={{
          color: getColor(),
        }}
      >
        {value}
      </div>
    </div>
  );
}