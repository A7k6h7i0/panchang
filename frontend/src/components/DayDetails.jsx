import { useEffect, useState, useRef, useCallback } from "react";
import { translateText } from "../translations";
import {
  getTithiSpeech,
  getMuhurtaAlert,
  getMuhurtaImmediateAlert,
  getMuhurtaName,
  isAuspiciousMuhurta,
} from "../utils/speechTemplates";
import { speakCloud, stopSpeech } from "../utils/cloudSpeech";


// GLOBAL singleton to prevent multiple component instances from duplicating speech
const globalSpeechState = {
  spokenLanguages: new Set(),
  sentAlerts: new Set(),
  activeInterval: null,
  isSpeaking: false,
  currentDate: null,
};


const ALARM_STORAGE_KEY = "panchangAlarmSettings";

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


const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeDigits = (value) => {
  if (!value) return value;
  const digitMap = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    "੦": "0", "੧": "1", "੨": "2", "੩": "3", "੪": "4", "੫": "5", "੬": "6", "੭": "7", "੮": "8", "੯": "9",
    "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4", "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
    "୦": "0", "୧": "1", "୨": "2", "୩": "3", "୪": "4", "୫": "5", "୬": "6", "୭": "7", "୮": "8", "୯": "9",
    "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4", "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9",
    "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4", "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
    "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4", "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9",
    "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4", "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9",
    "๐": "0", "๑": "1", "๒": "2", "๓": "3", "๔": "4", "๕": "5", "๖": "6", "๗": "7", "๘": "8", "๙": "9",
  };
  return value.replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙]/g, (digit) => digitMap[digit] || digit);
};

const normalizeTimeString = (value, language, translations) => {
  if (!value) return value;
  let output = normalizeDigits(value);
  const lang = translations?.[language];
  const amToken = lang?.am;
  const pmToken = lang?.pm;
  if (amToken) {
    output = output.replace(new RegExp(escapeRegExp(amToken), "gi"), "AM");
  }
  if (pmToken) {
    output = output.replace(new RegExp(escapeRegExp(pmToken), "gi"), "PM");
  }
  return output;
};

const extractTimeRange = (value, language, translations) => {
  if (!value || value === "-") return { startTime: null, endTime: null };

  try {
    const normalized = normalizeDigits(value);
    
    // Find all time patterns in the string (language-independent)
    const timeMatches = normalized.match(/(\d{1,2})\s*[:.]\s*(\d{2})\s*(?:AM|PM|ఉదయం|पूर्वाह्न|రాత్రి|రేయి|సాయంత్రం|अपराह्न|രാവിലെ|വൈകുന്നേരം)?/gi);
    
    if (timeMatches && timeMatches.length >= 2) {
      return { startTime: timeMatches[0].trim(), endTime: timeMatches[1].trim() };
    }
    if (timeMatches && timeMatches.length === 1) {
      return { startTime: timeMatches[0].trim(), endTime: timeMatches[0].trim() };
    }
    
    // Fallback: try splitting by common separators
    const lang = translations?.[language];
    const extraTokens = [lang?.to, lang?.upto].filter(Boolean).map(escapeRegExp);
    const extraPattern = extraTokens.length ? `|${extraTokens.join("|")}` : "";
    const splitRegex = new RegExp(`\\s*(?:-|–|—|to|upto|up\\s*to${extraPattern})\\s*`, "i");
    const parts = normalized.split(splitRegex);
    if (parts.length === 2) {
      // Try to extract time from each part
      const startMatch = parts[0].match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
      const endMatch = parts[1].match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
      if (startMatch && endMatch) {
        return { 
          startTime: parts[0].trim(), 
          endTime: parts[1].trim() 
        };
      }
    }
  } catch (e) {
    console.error("Error parsing time range:", value, e);
  }

  return { startTime: null, endTime: null };
};

// Helper: Parse time string to minutes - language-independent version for timer
// Supports all languages by detecting AM/PM patterns from any translation
const parseTimeToMinutesEnglish = (timeStr) => {
  if (!timeStr || timeStr === "-") return null;

  try {
    const cleanTime = timeStr.trim().toUpperCase();
    
    // Detect AM in any language (English, Telugu, Hindi, Malayalam, Tamil, Kannada, etc.)
    const hasAM = /AM|ఉదయం|पूर्वाह्न|ராவிளೆ|రాత్రి|రేయి|காலை|ಬೆಳಗ್ಗೆ/i.test(cleanTime);
    // Detect PM in any language
    const hasPM = /PM|సాయంత్రం|अपराह्न|വൈകുந்நேரம்|పాత్ర|వేళ|மாலை|ಸಂಜೆ/i.test(cleanTime);
    
    // Extract hours and minutes - supports formats like: 10:30, 10.30, 10 : 30
    const timePart = cleanTime.replace(/AM|PM|ఉదయం|पूर्वाह्न|रావిలೆ|రాత్రి|రేయి|సాయంత్రం|अपराह्न|വൈകുന്നേരം|పాత్ర|వేళ/gi, "").trim();
    const match = timePart.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (isNaN(hours) || isNaN(minutes)) return null;

    // Handle 12-hour to 24-hour conversion
    let totalHours = hours;
    if (hasPM && hours !== 12) {
      totalHours = hours + 12;
    } else if (hasAM && hours === 12) {
      totalHours = 0;
    }

    return totalHours * 60 + minutes;
  } catch (e) {
    return null;
  }
};

// Helper: Parse time string like "10:30 AM" to minutes from midnight
const parseTimeToMinutes = (timeStr, language, translations) => {
  if (!timeStr || timeStr === "-") return null;

  try {
    const normalized = normalizeTimeString(timeStr, language, translations);
    const cleanTime = normalized.trim().toUpperCase();
    const hasAM = /\bAM\b/.test(cleanTime);
    const hasPM = /\bPM\b/.test(cleanTime);

    const timePart = cleanTime.replace(/\bAM\b|\bPM\b/gi, "").trim();
    const match = timePart.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (isNaN(hours) || isNaN(minutes)) return null;

    let totalHours = hours;
    if (hasPM && hours !== 12) {
      totalHours = hours + 12;
    } else if (hasAM && hours === 12) {
      totalHours = 0;
    }

    return totalHours * 60 + minutes;
  } catch (e) {
    return null;
  }
};


// Helper: Check if current time is within a time range
const isTimeInRange = (currentMinutes, startMinutes, endMinutes) => {
  if (startMinutes === null || endMinutes === null) return false;
  
  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};


// Helper: Calculate progress percentage
const calculateProgress = (currentMinutes, startMinutes, endMinutes) => {
  if (startMinutes === null || endMinutes === null) return 0;
  
  const totalDuration = endMinutes - startMinutes;
  if (totalDuration <= 0) return 100;
  
  const elapsed = currentMinutes - startMinutes;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
};


// MuhurthaTimer Component
function MuhurthaTimer({ startTime, endTime, isAuspicious, language, translations }) {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(null);
  const intervalRef = useRef(null);


  useEffect(() => {
    // Get current time in minutes
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    setCurrentMinutes(currentMins);


    // Use language-independent parsing for timer (works for all languages)
    const startMins = parseTimeToMinutesEnglish(startTime);
    const endMins = parseTimeToMinutesEnglish(endTime);


    if (startMins === null || endMins === null) {
      setIsActive(false);
      return;
    }


    const inRange = isTimeInRange(currentMins, startMins, endMins);
    setIsActive(inRange);


    if (inRange) {
      const prog = calculateProgress(currentMins, startMins, endMins);
      setProgress(prog);


      // Update every second
      intervalRef.current = setInterval(() => {
        const now2 = new Date();
        const mins = now2.getHours() * 60 + now2.getMinutes();
        setCurrentMinutes(mins);


        const p = calculateProgress(mins, startMins, endMins);
        setProgress(p);


        // Stop if time ended
        if (mins > endMins) {
          setIsActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 1000);
    }


    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, endTime]);


  // Don't render if not active
  if (!isActive) return null;


  // Calculate if the inauspicious period has completed
  const isCompleted = progress >= 100;


  // For auspicious: green progress bar
  // For inauspicious: red initially, green when completed
  const barColor = isAuspicious
    ? `linear-gradient(90deg, rgba(76, 175, 80, 1), rgba(76, 175, 80, 0.8))`
    : isCompleted
      ? `linear-gradient(90deg, rgba(76, 175, 80, 1), rgba(76, 175, 80, 0.8))`
      : `linear-gradient(90deg, rgba(220, 20, 60, 1), rgba(220, 20, 60, 0.9))`;


  const barShadow = isAuspicious
    ? "0 0 8px rgba(76, 175, 80, 0.8)"
    : isCompleted
      ? "0 0 8px rgba(76, 175, 80, 0.8)"
      : "0 0 8px rgba(220, 20, 60, 0.8)";


  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden mt-1"
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 213, 79, 0.4)",
      }}
    >
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${progress}%`,
          background: barColor,
          boxShadow: barShadow,
        }}
      />
    </div>
  );
}

// Global styles for select dropdown
const selectStyles = `
  select option {
    background-color: #FF8C32;
    color: #FFFFFF;
  }
  select option:hover {
    background-color: #FF6347 !important;
  }
  select option:checked {
    background-color: #FF6347 !important;
  }
`;

export default function DayDetails({
  day,
  language,
  translations,
  isHeaderMode = false,
  isSidebarMode = false,
  onRashiphalaluClick,
  voiceEnabled = false,
}) {
  const [notificationsSent, setNotificationsSent] = useState({});
  const [festivals, setFestivals] = useState([]);
  const [festivalsLoaded, setFestivalsLoaded] = useState(false);
  const [alarmSettings, setAlarmSettings] = useState(defaultAlarmSettings);


  // Local refs for this component instance
  const prevLanguageRef = useRef(language);
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const isActiveInstanceRef = useRef(false);


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
        setFestivalsLoaded(true);
      })
      .catch((err) => {
        console.error("Error fetching festivals:", err);
        setFestivals([]);
        setFestivalsLoaded(true);
      });
  }, [day]);

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
    } catch (err) {
      console.error("Failed to load alarm settings:", err);
    }
  }, []);

  const saveAlarmSettings = () => {
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarmSettings));
    } catch (err) {
      console.error("Failed to save alarm settings:", err);
    }
  };

  const resetAlarmSettings = () => {
    setAlarmSettings(defaultAlarmSettings);
    try {
      localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(defaultAlarmSettings));
    } catch (err) {
      console.error("Failed to reset alarm settings:", err);
    }
  };


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


  // Extract only year name from "Shaka Samvat" field and translate it
  const getYearName = () => {
    const shakaSamvat = day?.["Shaka Samvat"] || "-";
    if (shakaSamvat === "-") return "-";
    const parts = shakaSamvat.trim().split(/\s+/);
    let yearKey = parts.length > 1 ? parts.slice(1).join(" ") : shakaSamvat;
    // Data uses "Vishvavasu", translations use "Vishwavasu".
    if (yearKey === "Vishvavasu") {
      yearKey = "Vishwavasu";
    }
    return translateText(yearKey, translations) || yearKey;
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


  // Get rashiphalalu label based on language
  const getRashiphalaluLabel = () => {
    const labels = {
      en: "Rashiphalalu",
      te: "రాశిఫలాలు",
      ta: "ராசிபலம்",
      ml: "രാശിഫലം",
      kn: "ರಾಶಿಫಲ",
      hi: "राशिफल",
    };
    return labels[language] || "Rashiphalalu";
  };


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
    if (!isToday || !voiceEnabled) return;
    if (globalSpeechState.isSpeaking) {
      console.log("⏸️ Speech already in progress, skipping...");
      return;
    }


    // Check if this language was already spoken
    if (globalSpeechState.spokenLanguages.has(language)) {
      console.log(`✓ Tithi already spoken in ${language}, skipping`);
      return;
    }


    globalSpeechState.isSpeaking = true;
    console.log(`🎤 Starting speech sequence for ${language}`);


    try {
      stopSpeech();


      const tithiText = getTithiSpeech({
        language,
        tithi: vTithi,
        amToken: translations?.am,
        pmToken: translations?.pm,
      });
      if (tithiText) {
        console.log(`🗣️ Speaking Tithi in ${language}`);
        const tithiResult = await speakCloud(tithiText, language);
        if (tithiResult?.interrupted) {
          return;
        }
      }


      const muhurtaText = await buildImmediateMuhurtaTextIfNeeded();
      if (muhurtaText) {
        console.log(`🗣️ Speaking immediate muhurta in ${language}`);
        const muhurtaResult = await speakCloud(muhurtaText, language);
        if (muhurtaResult?.interrupted) {
          return;
        }
      }


      globalSpeechState.spokenLanguages.add(language);
      console.log(`✅ Speech sequence completed for ${language}`);
    } catch (error) {
      console.error(`❌ Speech error:`, error);
    } finally {
      globalSpeechState.isSpeaking = false;
    }
  };


  // Trigger speech on first load or language change
  useEffect(() => {
    if (!isToday || !voiceEnabled) return;


    const prevLang = prevLanguageRef.current;
    const langChanged = prevLang !== language;
    prevLanguageRef.current = language;


    if (langChanged) {
      console.log(`🔄 Language changed from ${prevLang} to ${language}`);
      stopSpeech();
      globalSpeechState.isSpeaking = false;
    }


    // Small delay to prevent double execution in StrictMode
    const timer = setTimeout(() => {
      speakSequence();
    }, 100);


    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isToday, voiceEnabled]);


  // 🔔 Universal Muhurta Notification Effect (SINGLETON PATTERN)
  useEffect(() => {
    // Reset alerts if date changed
    if (globalSpeechState.currentDate !== day?.date) {
      console.log("📅 Date changed - resetting all alerts");
      globalSpeechState.sentAlerts.clear();
      globalSpeechState.spokenLanguages.clear();
      globalSpeechState.currentDate = day?.date;
      setNotificationsSent({});
    }


    if (!isToday || !voiceEnabled) {
      console.log("⏸️ Notification checker paused:", { isToday, voiceEnabled });
      isActiveInstanceRef.current = false;
      return;
    }


    // Only ONE component instance should run the interval
    // First one to mount becomes the active instance
    if (globalSpeechState.activeInterval) {
      console.log(`⚠️ Instance ${componentIdRef.current} - another instance already running notifications`);
      isActiveInstanceRef.current = false;
      return;
    }


    isActiveInstanceRef.current = true;
    console.log(`✅ Instance ${componentIdRef.current} - becoming ACTIVE notification instance for ${language}`);


    const muhurtas = [
      { key: "Dur Muhurtam", value: day["Dur Muhurtam"] },
      { key: "Rahu Kalam", value: day["Rahu Kalam"] },
      { key: "Yamaganda", value: day["Yamaganda"] },
      { key: "Gulikai Kalam", value: day["Gulikai Kalam"] },
      { key: "Abhijit", value: day["Abhijit"] },
      { key: "Amrit Kalam", value: day["Amrit Kalam"] },
      { key: "Varjyam", value: day["Varjyam"] },
    ];


    const checkAllNotifications = async () => {
      const muhurtaGroups = new Map();


      for (const muhurta of muhurtas) {
        if (!muhurta.value || muhurta.value === "-") continue;


        // Create unique key per muhurta + language
        const alertKey = `${muhurta.key}-${language}`;


        // Skip if already sent for this language
        if (globalSpeechState.sentAlerts.has(alertKey)) {
          continue;
        }


        try {
          const response = await fetch("http://localhost:5000/check-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timeString: muhurta.value }),
          });


          const data = await response.json();


          if (data.shouldTrigger) {
            const timeKey = data.alertTime.substring(0, 5);
            if (!muhurtaGroups.has(timeKey)) {
              muhurtaGroups.set(timeKey, []);
            }
            muhurtaGroups.get(timeKey).push(muhurta);
          }
        } catch (error) {
          console.error(`❌ Error checking ${muhurta.key} notification:`, error);
        }
      }


      // Process grouped alerts
      for (const [, groupedMuhurtas] of muhurtaGroups.entries()) {
        if (groupedMuhurtas.length === 0) continue;


        // Check if ANY muhurta in this group was already sent for current language
        const alreadySent = groupedMuhurtas.some((m) =>
          globalSpeechState.sentAlerts.has(`${m.key}-${language}`)
        );


        if (alreadySent) {
          continue;
        }


        // Prevent duplicate speech
        if (globalSpeechState.isSpeaking) {
          console.log("⏸️ Speech in progress, delaying alert...");
          continue;
        }


        globalSpeechState.isSpeaking = true;


        console.log(
          `🔔 TRIGGERING ALERT (${language}) for:`,
          groupedMuhurtas.map((m) => m.key).join(", ")
        );


        const names = groupedMuhurtas.map((m) => getMuhurtaName(m.key, language));
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


        console.log(`🗣️ Speaking alert in ${language}:`, text);
        
        try {
          const result = await speakCloud(text, language);
          if (result?.interrupted) {
            return;
          }


          // Mark all muhurtas in this group as sent for current language
          groupedMuhurtas.forEach((m) => {
            const alertKey = `${m.key}-${language}`;
            globalSpeechState.sentAlerts.add(alertKey);
          });


          // Update state for UI consistency
          const updates = {};
          groupedMuhurtas.forEach((m) => {
            updates[`${m.key}-${language}`] = true;
          });
          setNotificationsSent((prev) => ({ ...prev, ...updates }));


          console.log(`✅ Alert completed for ${language}`);
        } catch (error) {
          console.error(`❌ Speech error:`, error);
        } finally {
          globalSpeechState.isSpeaking = false;
        }
      }
    };


    console.log(`✅ Starting notification checker for ${language}`);
    checkAllNotifications(); // Run immediately
    globalSpeechState.activeInterval = setInterval(checkAllNotifications, 10000);


    return () => {
      if (isActiveInstanceRef.current && globalSpeechState.activeInterval) {
        clearInterval(globalSpeechState.activeInterval);
        globalSpeechState.activeInterval = null;
        console.log(`🛑 Instance ${componentIdRef.current} - stopping notification checker`);
      }
      isActiveInstanceRef.current = false;
    };
  }, [day, language, isToday, voiceEnabled]);


  // If in header mode, render compact version
  if (isHeaderMode) {
    return (
      // Outer container for header mode
      <div className="w-full">
        <div
          className="rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-md"
          style={{
            background:
              "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 35px rgba(255, 140, 50, 0.8),
              0 0 70px rgba(255, 100, 30, 0.6),
              inset 0 0 30px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <div className="flex items-start gap-2 sm:gap-4">
            <div
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                border: "3px solid rgba(255, 200, 110, 0.95)",
                boxShadow: `
                  0 0 20px rgba(255, 140, 50, 0.6),
                  0 0 40px rgba(255, 100, 30, 0.4),
                  inset 0 0 15px rgba(255, 200, 100, 0.2)
                `,
              }}
            >
              <span
                className="text-xl sm:text-xl font-bold"
                style={{
                  color: "#D4AF37",
                  textShadow:
                    "0 2px 6px rgba(0, 0, 0, 0.6)",
                }}
              >
                {dayNum}
              </span>
            </div>


            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="text-lg sm:text-xl font-bold"
                  style={{
                    color: "#ffedb3",
                    textShadow: "0 2px 6px rgba(0,0,0,0.4)",
                  }}
                >
                  {weekday}
                </div>
              </div>
              {/* Tithi remains after weekday */}
              <div
                className="text-xs sm:text-sm font-semibold mt-1"
                style={{
                  color: "#ffedb3",
                  textShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              >
                • {vTithi}
              </div>
            </div>
          </div>


          {/* Paksha and Year in a row below date */}
          <div className="flex items-center gap-2 flex-nowrap mt-3 overflow-x-auto">
            {vPaksha !== "-" && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs sm:text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm flex-shrink-0"
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


            {vShakaSamvat !== "-" && (
              <div
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs sm:text-sm font-bold transition-all hover:scale-105 backdrop-blur-sm flex-shrink-0 ml-auto"
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
                <span style={{ color: "#D4AF37" }}>{getYearLabel()}:</span>
                <span>{vShakaSamvat}</span>
              </div>
            )}
          </div>


          {festivals.length > 0 && (
            <div className="space-y-2 mt-4">
            {festivals.map((festival, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold mr-1.5 mb-1 backdrop-blur-sm"
                style={{
                  background: "rgba(255, 100, 50, 0.3)",
                  border: "1.5px solid rgba(255, 100, 50, 0.6)",
                  color: "#FFE4B5",
                  boxShadow:
                    "0 0 10px rgba(255, 100, 50, 0.5), inset 0 0 6px rgba(255, 140, 50, 0.2)",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{
                    background: "#FF4444",
                    boxShadow: "0 0 6px rgba(255, 68, 68, 0.8)",
                  }}
                />
                {festival}
              </div>
            ))}
          </div>
        )}


        {festivalsLoaded && festivals.length === 0 && (
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
    );
  }


  // SIDEBAR MODE
  if (isSidebarMode) {
    return (
      <div className="space-y-3">
        <SectionCard
          title={translations.sunMoonTimings || "Sun & Moon Timings"}
          icon="☀"
          variant="sunmoon"
        >
          <div className="grid grid-cols-2 gap-2">
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


        <SectionCard
          title={translations.panchangElements || "Panchang Elements"}
          icon="✦"
          variant="panchang"
        >
          <InfoRow
            label={translations.nakshatra || "Nakshatra"}
            value={vNakshatra}
            isToday={isToday}
            variant="panchang"
            language={language}
            translations={translations}
          />
          <InfoRow
            label={translations.yoga || "Yoga"}
            value={vYoga}
            isToday={isToday}
            variant="panchang"
            language={language}
            translations={translations}
          />


          {vAmrit !== "-" && (
            <InfoRow
              label={translations.amritKalam || "Amrit Kalam"}
              value={vAmrit}
              isAuspicious={true}
              isToday={isToday}
              variant="panchang"
              language={language}
              translations={translations}
            />
          )}
          {vAbhijit !== "-" && (
            <InfoRow
              label={translations.abhijitAuspicious || "Abhijit (Auspicious)"}
              value={vAbhijit}
              isAuspicious={true}
              isToday={isToday}
              variant="panchang"
              language={language}
              translations={translations}
            />
          )}
        </SectionCard>


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
                isAuspicious={false}
                isToday={isToday}
                language={language}
                translations={translations}
              />
            )}
            {vYamaganda !== "-" && (
              <DangerBox
                label={translations.yamaganda || "Yamaganda"}
                value={vYamaganda}
                isAuspicious={false}
                isToday={isToday}
                language={language}
                translations={translations}
              />
            )}
            {vGulikai !== "-" && (
              <DangerBox
                label={translations.gulikaiKalam || "Gulikai Kalam"}
                value={vGulikai}
                isAuspicious={false}
                isToday={isToday}
                language={language}
                translations={translations}
              />
            )}
            {vDur !== "-" && (
              <DangerBox
                label={translations.durMuhurtam || "Dur Muhurtam"}
                value={vDur}
                isAuspicious={false}
                isToday={isToday}
                language={language}
                translations={translations}
              />
            )}
            {vVarjyam !== "-" && (
              <DangerBox
                label={translations.varjyam || "Varjyam"}
                value={vVarjyam}
                isAuspicious={false}
                isToday={isToday}
                language={language}
                translations={translations}
              />
            )}
          </SectionCard>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={onRashiphalaluClick}
            className="w-full py-2 px-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{
              background:
                "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)",
              border: "2.5px solid rgba(212, 168, 71, 0.8)",
              color: "#ffedb3",
              boxShadow:
                "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            {translations.rashiphalalu || "Daily Horoscope"}
          </button>
        </div>

        <SectionCard
          title={translations.alarmSettings || "Chanting Alarm"}
          icon="⏰"
          variant="alarm"
        >
          <style>{selectStyles}</style>
          <div className="pt-2 grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-3 overflow-hidden flex flex-col h-full" style={{ border: "1px solid rgba(212, 168, 71, 0.35)" }}>
              <div
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: "#FFE4B5" }}
              >
                {translations.weekdaysLabel || translations.weekdays || "Weekdays"}
              </div>
              <div className="mt-6 grid grid-rows-7 gap-2 flex-1">
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((dayName, index) => {
                  const dayValue = dayName === "Sunday" ? 7 : index;
                  const active = alarmSettings.disabledDays.includes(dayValue);
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() =>
                        setAlarmSettings((prev) => ({
                          ...prev,
                          disabledDays: active
                            ? prev.disabledDays.filter((d) => d !== dayValue)
                            : [...prev.disabledDays, dayValue],
                        }))
                      }
                      className="w-full rounded-lg px-2 py-2 text-xs font-semibold transition"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)"
                          : "linear-gradient(135deg, rgba(42, 90, 31, 0.7) 0%, rgba(58, 110, 45, 0.7) 50%, rgba(90, 150, 69, 0.7) 100%)",
                        border: active
                          ? "2.5px solid #d4a847"
                          : "2px solid rgba(212, 168, 71, 0.7)",
                        color: "#ffedb3",
                        boxShadow: active
                          ? "0 0 18px rgba(212, 168, 71, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)"
                          : "0 0 12px rgba(212, 168, 71, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                      }}
                    >
                      {translations[dayName] || dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl p-3 flex flex-col h-full" style={{ border: "1px solid rgba(212, 168, 71, 0.35)" }}>
              <div
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: "#FFE4B5" }}
              >
                {translations.notificationPreferences || "Notification Preferences"}
              </div>
              <div className="mt-2 grid grid-rows-7 gap-2 flex-1">
                <ToggleRow
                  label={translations.audioAlerts || "Audio Alerts"}
                  checked={alarmSettings.audioEnabled}
                  onChange={(checked) =>
                    setAlarmSettings((prev) => ({ ...prev, audioEnabled: checked }))
                  }
                  variant="panchang"
                  size="sm"
                  fullWidth
                />
                <ToggleRow
                  label={translations.silentMode || "Silent Mode"}
                  checked={alarmSettings.silentMode}
                  onChange={(checked) =>
                    setAlarmSettings((prev) => ({ ...prev, silentMode: checked }))
                  }
                  variant="panchang"
                  size="sm"
                  fullWidth
                />
                <div
                  className="flex w-full min-w-0 items-center justify-between rounded-lg px-2 py-1"
                  style={{
                    background:
                      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
                    border: "2px solid #d4a847",
                  }}
                >
                  <div
                    className="min-w-0 flex-1 truncate text-[10px] font-semibold"
                    style={{ color: "#ffedb3" }}
                  >
                    {translations.reminderTime || "Reminder Time"}
                  </div>
                  <select
                    className="min-w-0 max-w-[55%] truncate rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer chanting-alarm-select"
                    value={alarmSettings.reminderTime}
                    onChange={(e) =>
                      setAlarmSettings((prev) => ({
                        ...prev,
                        reminderTime: Number(e.target.value),
                      }))
                    }
                  >
                    {[15, 30, 60, 90, 120].map((value) => (
                      <option key={value} value={value}>
                        {value} {translations.minutesBeforeStart || "minutes before start"}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={saveAlarmSettings}
                  className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background:
                      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
                    border: "2px solid #d4a847",
                    color: "#ffedb3",
                    boxShadow:
                      "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  {translations.saveSettings || "Save Settings"}
                </button>
                <button
                  type="button"
                  onClick={resetAlarmSettings}
                  className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background:
                      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
                    border: "2px solid #d4a847",
                    color: "#ffedb3",
                    boxShadow:
                      "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  {translations.resetDefaults || "Reset Defaults"}
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background:
                      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
                    border: "2px solid #d4a847",
                    color: "#ffedb3",
                    boxShadow:
                      "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  {translations.scrollUp || "Scroll Up"}
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background:
                      "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
                    border: "2px solid #d4a847",
                    color: "#ffedb3",
                    boxShadow:
                      "0 0 12px rgba(212, 168, 71, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.08), inset 0 -1px 2px rgba(0, 0, 0, 0.18)",
                  }}
                >
                  {translations.addToAlbum || "Add To Album"}
                </button>
              </div>
            </div>
          </div>

        </SectionCard>
      </div>
    );
  }


  return null;
}


// ========== COMPONENT HELPERS ==========


function SectionCard({ title, icon, children, variant }) {
  const isPanchang = variant === "panchang";
  const isSunMoon = variant === "sunmoon";
  const isInauspicious = variant === "inauspicious";
  const isAlarm = variant === "alarm";


  const consistentBorder = "2.5px solid rgba(255, 140, 50, 0.7)";
  const consistentShadow =
    "0 0 20px rgba(255, 140, 50, 0.5), inset 0 0 15px rgba(255, 140, 50, 0.1)";


  let background =
    "linear-gradient(135deg, rgba(120, 35, 18, 0.7) 0%, rgba(100, 30, 15, 0.75) 100%)";
  let border = consistentBorder;
  let boxShadow = consistentShadow;


  if (isPanchang) {
    background =
      "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)";
    border = "2.5px solid rgba(255, 168, 67, 0.8)";
    boxShadow =
      "0 0 18px rgba(212,168,71,0.4), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)";
  } else if (isSunMoon) {
    background =
      "linear-gradient(135deg, #FF6B35 0%, #FF8C32 40%, #FF9F45 100%)";
    border = "2.5px solid rgba(255, 168, 67, 0.8)";
    boxShadow =
      "0 0 22px rgba(255,140,50,0.5), inset 0 0 15px rgba(255,255,255,0.15)";
  } else if (isInauspicious) {
    background =
      "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)";
    border = "2.5px solid rgba(255, 168, 67, 0.8)";
    boxShadow =
      "0 0 22px rgba(220,20,60,0.6), inset 0 0 15px rgba(0,0,0,0.3)";
  } else if (isAlarm) {
    background =
      "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)";
    border = "2.5px solid rgba(255, 168, 67, 0.8)";
    boxShadow =
      "0 0 18px rgba(212,168,71,0.4), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)";
  }


  return (
    <div
      className="rounded-2xl p-3 backdrop-blur-sm"
      style={{
        background,
        border,
        boxShadow,
      }}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3"
        style={{
          background: isAlarm
            ? "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)"
            : "linear-gradient(135deg, rgba(180, 130, 50, 0.4) 0%, rgba(140, 100, 40, 0.5) 100%)",
          border: isAlarm
            ? "2.5px solid rgba(255, 140, 50, 0.7)"
            : "2px solid rgba(255, 168, 67, 0.8)",
          boxShadow: isAlarm
            ? "0 0 20px rgba(255, 140, 50, 0.6), 0 0 40px rgba(255, 100, 30, 0.4), inset 0 0 15px rgba(255, 200, 100, 0.2)"
            : "0 0 15px rgba(255, 140, 50, 0.4), inset 0 0 10px rgba(255, 200, 100, 0.1)",
        }}
      >
        <span className="text-base">{icon}</span>
        <h3
          className="text-xs sm:text-sm font-bold uppercase tracking-wide"
          style={{
            color: isAlarm ? "#D4AF37" : "#FFE4B5",
          }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}


function ToggleRow({ label, checked, onChange, hint, variant, size = "md", fullWidth = false }) {
  const isPanchang = variant === "panchang";
  const isSmall = size === "sm";
  const background = isPanchang
    ? "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)"
    : "rgba(0, 0, 0, 0.25)";
  const border = isPanchang
    ? "2px solid #d4a847"
    : "1.5px solid rgba(255, 237, 179, 0.35)";

  return (
    <div
      className={`flex min-w-0 items-center justify-between ${fullWidth ? "w-full" : ""} ${isSmall ? "rounded-lg px-2 py-1" : "rounded-xl px-3 py-2"}`}
      style={{
        background,
        border,
      }}
    >
      <div className="min-w-0 flex-1 pr-3">
        <div className={`${isSmall ? "text-[10px]" : "text-xs"} font-semibold truncate`} style={{ color: "#FFE4B5" }}>
          {label}
        </div>
        {hint && (
          <div className="text-[10px] truncate" style={{ color: "#E9D3A7" }}>
            {hint}
          </div>
        )}
      </div>
      <input
        type="checkbox"
        className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} shrink-0 accent-green-500`}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}


function InfoRow({ label, value, isAuspicious, isToday = false, variant, language, translations }) {
  const { startTime, endTime } = extractTimeRange(value, language, translations);
  
  const isPanchang = variant === "panchang";
  const background = isPanchang
    ? "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)"
    : "rgba(0, 0, 0, 0.25)";
  const border = isPanchang
    ? "2px solid #d4a847"
    : "1.5px solid rgba(255, 237, 179, 0.4)";

  return (
    <div
      className="rounded-xl p-2.5 backdrop-blur-sm"
      style={{
        background,
        border,
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
      {/* Progress Timer (only show if valid time range AND isToday is true) */}
      {isToday && startTime && endTime && (
        <MuhurthaTimer
          startTime={startTime}
          endTime={endTime}
          isAuspicious={isAuspicious}
          language={language}
          translations={translations}
        />
      )}
    </div>
  );
}


function TimeBox({ label, value, scheme }) {
  const isOrange = scheme === "orange";
  const isBlue = scheme === "blue";
  const bg = isOrange
    ? "linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA458 100%)"
    : isBlue
      ? "linear-gradient(135deg, #B55A3C 0%, #CC6B46 50%, #D98555 100%)"
      : "transparent";
  const border = isOrange
    ? "#FFB380"
    : isBlue
      ? "#E2A57C"
      : "transparent";
  const labelColor = isOrange ? "#FFF5E6" : isBlue ? "#FFE8D8" : "#E0E8F0";


  return (
    <div
      className="rounded-xl p-2.5 text-center"
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


function AuspiciousBox({ label, value, isAuspicious = true, isToday = false, language, translations }) {
  const { startTime, endTime } = extractTimeRange(value, language, translations);
  
  return (
    <div
      className="rounded-xl p-2.5 mb-2 backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, #4CAF50 0%, #388E3C 50%, #2E7D32 100%)",
        border: "2px solid rgba(0, 255, 0, 0.6)",
        boxShadow:
          "0 0 15px rgba(76,175,80,0.5), inset 0 1px 2px rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="text-xs uppercase tracking-wide mb-1 font-semibold"
        style={{
          color: "#FFE4B5",
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
      {/* Progress Timer (only show if isToday is true) */}
      {isToday && startTime && endTime && (
        <MuhurthaTimer
          startTime={startTime}
          endTime={endTime}
          isAuspicious={isAuspicious}
          language={language}
          translations={translations}
        />
      )}
    </div>
  );
}


function DangerBox({ label, value, isAuspicious = false, isToday = false, language, translations }) {
  const { startTime, endTime } = extractTimeRange(value, language, translations);
  
  return (
    <div
      className="rounded-xl p-2.5 mb-2 backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, #DC143C 0%, #B22222 50%, #8B0000 100%)",
        border: "2px solid rgba(255, 0, 0, 0.6)",
        boxShadow:
          "0 0 15px rgba(220,20,60,0.5), inset 0 1px 2px rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="text-xs uppercase tracking-wide mb-1 font-semibold"
        style={{
          color: "#FFE4B5",
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
      {/* Progress Timer (only show if isToday is true) */}
      {isToday && startTime && endTime && (
        <MuhurthaTimer
          startTime={startTime}
          endTime={endTime}
          isAuspicious={isAuspicious}
          language={language}
          translations={translations}
        />
      )}
    </div>
  );
}




