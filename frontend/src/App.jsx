import { useEffect, useMemo, useState, useRef } from "react";
import CalendarGrid from "./components/CalendarGrid";
import DayDetails from "./components/DayDetails";
import YearSelectorPopup from "./components/YearSelectorPopup";
import { translations, languages } from "./translations";
import { translateText } from "./translations";
import { speakCloud } from "./utils/cloudSpeech";
import { getDateSelectionSpeech } from "./utils/speechTemplates";

const YEARS = Array.from({ length: 186 }, (_, i) => 1940 + i);
const DATE_STATE_KEY = "panchang:selected-date";

const getTodayInfo = () => {
  const today = new Date();
  return {
    day: today.getDate(),
    month: today.getMonth(), // 0-based
    year: today.getFullYear(),
  };
};

const formatDateString = (y, m, d) =>
  `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;

const loadInitialSelection = (today) => {
  if (typeof window === "undefined") return today;

  try {
    const raw = sessionStorage.getItem(DATE_STATE_KEY);
    if (!raw) return today;
    const parsed = JSON.parse(raw);

    if (
      typeof parsed?.year === "number" &&
      typeof parsed?.month === "number" &&
      typeof parsed?.day === "number"
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to read saved date:", error);
  }

  return today;
};

const getFestivalDateKeyFromSlashDate = (dateStr) => {
  const [day, month, year] = (dateStr || "").split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
};

const fetchFestivalMap = async (year) => {
  try {
    const res = await fetch(`/data/festivals/${year}.json`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

const withFestivalsFromMap = (dayData, festivalMap) => {
  if (!dayData?.date) return dayData;
  const key = getFestivalDateKeyFromSlashDate(dayData.date);
  const festivals = festivalMap?.[key] || [];
  return { ...dayData, Festivals: festivals };
};

function App() {
  const today = getTodayInfo();
  const initialSelection = loadInitialSelection(today);
  
  // Unified state - selectedDay is the single source of truth for date selection
  const [year, setYear] = useState(initialSelection.year);
  const [month, setMonth] = useState(initialSelection.month);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [preferredDay, setPreferredDay] = useState(initialSelection.day);
  const [language, setLanguage] = useState("en");
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Temp state for date picker popup only
  const [tempYear, setTempYear] = useState(initialSelection.year);
  const [tempMonth, setTempMonth] = useState(initialSelection.month);
  const [tempDay, setTempDay] = useState(initialSelection.day);

  const t = translations[language];

  // Helper to get day number from selectedDay
  const getSelectedDayNum = () => {
    if (selectedDay && selectedDay.date) {
      return parseInt(selectedDay.date.split("/")[0], 10);
    }
    return tempDay;
  };

  useEffect(() => {
    console.log("useEffect triggered: year=", year, "month=", month);
    Promise.all([
      fetch(`/data/${year}.json`).then((res) => res.json()),
      fetchFestivalMap(year),
    ])
      .then(([data, festivalMap]) => {
        console.log("Data fetched for year", year);
        const monthDays = data
          .filter((d) => {
          const [, m] = d.date.split("/");
          const dateMonth = parseInt(m, 10) - 1;
          return dateMonth === month;
          })
          .map((d) => withFestivalsFromMap(d, festivalMap));

        console.log("Days found for month", month, ":", monthDays.length);
        setDays(monthDays);

        if (monthDays.length === 0) return;

        // Try to keep the selected/persisted day first.
        const preferredDateStr = formatDateString(year, month, preferredDay);
        const preferredData = monthDays.find((d) => d.date === preferredDateStr);
        if (preferredData) {
          setSelectedDay(preferredData);
          return;
        }

        // If we're viewing current month/year, default to today.
        if (year === today.year && month === today.month) {
          const todayStr = formatDateString(today.year, today.month, today.day);
          const todayData = monthDays.find((d) => d.date === todayStr);

          if (todayData) {
            setSelectedDay(todayData);
            setPreferredDay(today.day);
            return;
          }
        }

        const firstDay = monthDays[0];
        setSelectedDay(firstDay);
        setPreferredDay(parseInt(firstDay.date.split("/")[0], 10));
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, [year, month, preferredDay, today.day, today.month, today.year]);

  // Keep selected date on refresh for this session only.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dayNum = selectedDay?.date
      ? parseInt(selectedDay.date.split("/")[0], 10)
      : preferredDay;

    sessionStorage.setItem(
      DATE_STATE_KEY,
      JSON.stringify({
        year,
        month,
        day: dayNum,
      })
    );
  }, [year, month, preferredDay, selectedDay]);

  const goPrevMonth = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    
    setMonth(newMonth);
    setYear(newYear);
    
    // Update selectedDay to first day of new month if valid
    const dateStr = formatDateString(newYear, newMonth, 1);
    Promise.all([
      fetch(`/data/${newYear}.json`).then((res) => res.json()),
      fetchFestivalMap(newYear),
    ])
      .then(([data, festivalMap]) => {
        const dayData = data.find((d) => d.date === dateStr);
        if (dayData) {
          setSelectedDay(withFestivalsFromMap(dayData, festivalMap));
          setPreferredDay(1);
        }
      });
  };

  const goNextMonth = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    
    setMonth(newMonth);
    setYear(newYear);
    
    // Update selectedDay to first day of new month if valid
    const dateStr = formatDateString(newYear, newMonth, 1);
    Promise.all([
      fetch(`/data/${newYear}.json`).then((res) => res.json()),
      fetchFestivalMap(newYear),
    ])
      .then(([data, festivalMap]) => {
        const dayData = data.find((d) => d.date === dateStr);
        if (dayData) {
          setSelectedDay(withFestivalsFromMap(dayData, festivalMap));
          setPreferredDay(1);
        }
      });
  };

  const monthLabel = useMemo(
    () => `${t.months[month]}`,
    [month, language]
  );

  // Get days in selected month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get calendar grid days with empty slots for alignment
  const getCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = getCalendarDays(tempYear, tempMonth);

  // Format the selected date for display
  const getFormattedDate = () => {
    const date = new Date(tempYear, tempMonth, tempDay);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[tempMonth]} ${tempDay}`;
  };

  const handleDatePickerOk = (data) => {
    const { year: newYear, month: newMonth, day: newDay, dayData } = data || {};
    
    const y = newYear ?? tempYear;
    const m = newMonth ?? tempMonth;
    const d = newDay ?? tempDay;
    
    // Always set year and month first
    setYear(y);
    setMonth(m);
    
    // Find or create dayData for the selected date
    const dateStr = formatDateString(y, m, d);
    setPreferredDay(d);
    
    Promise.all([
      fetchFestivalMap(y),
      dayData
        ? Promise.resolve(null)
        : fetch(`/data/${y}.json`).then((res) => res.json()),
    ])
      .then(([festivalMap, yearData]) => {
        if (dayData) {
          setSelectedDay(withFestivalsFromMap(dayData, festivalMap));
          return;
        }

        const foundDayData = yearData?.find((item) => item.date === dateStr);
        if (foundDayData) {
          setSelectedDay(withFestivalsFromMap(foundDayData, festivalMap));
        } else {
          // Create a minimal dayData object if not found
          const minimalDayData = {
            date: dateStr,
            Tithi: "Prathama",
            Nakshatra: "Ashwini",
            Paksha: "Shukla",
            Yoga: "Vishkumbha",
            Rahu: "-",
            Sunrise: "06:00",
            Sunset: "18:00",
            Festivals: festivalMap?.[getFestivalDateKeyFromSlashDate(dateStr)] || [],
          };
          setSelectedDay(minimalDayData);
        }
      })
      .catch((err) => {
        console.error("Error fetching date data:", err);
      });

    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    setTempYear(year);
    setTempMonth(month);
    setTempDay(selectedDay ? parseInt(selectedDay.date.split("/")[0]) : today.day);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempYear(year);
    setTempMonth(month);
    setTempDay(selectedDay ? parseInt(selectedDay.date.split("/")[0]) : today.day);
    setShowDatePicker(true);
  };

  // Speech handler for date click
  const handleDateClickSpeech = async (day) => {
    if (!day || !day.date) return;
    
    // Parse date from day object
    const dateParts = day.date.split("/");
    if (dateParts.length < 3) return;
    
    const dayNum = dateParts[0];
    const monthNum = parseInt(dateParts[1], 10) - 1;
    const monthName = t?.months?.[monthNum] || "";
    
    const tithi = translateText(day.Tithi, t);
    const paksha = translateText(day.Paksha, t);
    const yearName = day["Shaka Samvat"] || "";

    let festivals = Array.isArray(day.Festivals)
      ? day.Festivals.map((f) => translateText(f, t))
      : [];

    // Some data files store festivals in a separate year map.
    if (festivals.length === 0) {
      try {
        const festivalYear = dateParts[2];
        const festivalRes = await fetch(`/data/festivals/${festivalYear}.json`);
        if (festivalRes.ok) {
          const festivalMap = await festivalRes.json();
          const dateKey = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          const dayFestivals = festivalMap?.[dateKey] || [];
          festivals = dayFestivals.map((f) => translateText(f, t));
        }
      } catch (error) {
        console.error("Error loading date-click festivals:", error);
      }
    }
    
    const speechText = getDateSelectionSpeech({ 
      language, 
      day: dayNum, 
      month: monthName, 
      tithi, 
      paksha, 
      yearName,
      festivals,
    });
    speakCloud(speechText, language);
  };

  const handleMainDateSelect = (day) => {
    setSelectedDay(day);
    if (day?.date) {
      const dayNum = parseInt(day.date.split("/")[0], 10);
      setPreferredDay(dayNum);
      setTempYear(year);
      setTempMonth(month);
      setTempDay(dayNum);
    }
  };

  if (!days.length)
    return (
      <div 
        className="min-h-screen grid place-items-center px-4 sm:px-6"
        style={{
          background: "linear-gradient(180deg, #FF8C32 0%, #FF6347 20%, #FF4560 40%, #E63946 60%, #D32F2F 80%, #B71C1C 100%)",
          position: "relative",
        }}
      >
        {/* Particle Background */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 10% 20%, rgba(255, 220, 80, 0.9), transparent),
              radial-gradient(2px 2px at 30% 40%, rgba(255, 200, 50, 0.8), transparent),
              radial-gradient(2px 2px at 50% 10%, rgba(255, 220, 80, 0.9), transparent),
              radial-gradient(2px 2px at 70% 60%, rgba(255, 180, 40, 0.8), transparent),
              radial-gradient(2px 2px at 85% 30%, rgba(255, 220, 80, 0.9), transparent),
              radial-gradient(1px 1px at 20% 70%, rgba(255, 200, 50, 0.7), transparent),
              radial-gradient(1px 1px at 60% 80%, rgba(255, 180, 40, 0.9), transparent),
              radial-gradient(2px 2px at 90% 15%, rgba(255, 220, 80, 0.8), transparent),
              radial-gradient(1px 1px at 15% 50%, rgba(255, 200, 50, 0.7), transparent),
              radial-gradient(2px 2px at 75% 85%, rgba(255, 180, 40, 0.9), transparent)
            `,
            backgroundSize: "100% 100%",
            animation: "sparkle 3s ease-in-out infinite",
          }}
        />

        <div 
          className="relative w-full max-w-md rounded-3xl p-8 text-center backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.9) 0%, rgba(120, 30, 15, 0.85) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 30px rgba(255, 140, 50, 0.8),
              0 0 60px rgba(255, 100, 30, 0.6),
              inset 0 0 20px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <div 
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
              border: "4px solid #ff8c32",
              borderRadius: "24px",
              boxShadow: `
                0 0 40px rgba(255, 140, 50, 1),
                0 0 80px rgba(255, 100, 30, 0.8),
                0 0 120px rgba(255, 140, 50, 0.6),
                inset 0 0 30px rgba(255, 140, 50, 0.3),
                inset 0 4px 10px rgba(255, 200, 100, 0.4),
                inset 0 -2px 8px rgba(0, 0, 0, 0.6)
              `,
            }}
          >
            {/* Inner border layer */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                border: "2px solid rgba(255, 180, 80, 0.6)",
                margin: "4px",
                borderRadius: "18px",
              }}
            />
            <span
              className="text-4xl relative z-10"
              style={{
                background: "linear-gradient(135deg, #ffe9a0 0%, #ffd54f 25%, #ffb300 50%, #ff8f00 75%, #ff6f00 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 160, 0, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
                fontWeight: "900",
              }}
            >
              卐
            </span>
          </div>
          <p 
            className="mt-6 font-black text-xl"
            style={{
              color: "#FFFFFF",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 140, 50, 0.4)",
            }}
          >
            {t.loading}
          </p>
          <p 
            className="mt-2 text-base"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            {t.fetchingData} {year}.
          </p>
        </div>
      </div>
    );

  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FF8C32 0%, #FF6347 20%, #FF4560 40%, #E63946 60%, #D32F2F 80%, #B71C1C 100%)",
        position: "relative",
      }}
    >
      {/* ANIMATED PARTICLE BACKGROUND */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 10% 20%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(2px 2px at 30% 40%, rgba(255, 200, 50, 0.8), transparent),
            radial-gradient(2px 2px at 50% 10%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(2px 2px at 70% 60%, rgba(255, 180, 40, 0.8), transparent),
            radial-gradient(2px 2px at 85% 30%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(1px 1px at 20% 70%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(1px 1px at 60% 80%, rgba(255, 180, 40, 0.9), transparent),
            radial-gradient(2px 2px at 90% 15%, rgba(255, 220, 80, 0.8), transparent),
            radial-gradient(1px 1px at 15% 50%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(2px 2px at 75% 85%, rgba(255, 180, 40, 0.9), transparent),
            radial-gradient(1px 1px at 40% 25%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(2px 2px at 55% 45%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(1px 1px at 80% 75%, rgba(255, 180, 40, 0.8), transparent),
            radial-gradient(2px 2px at 25% 90%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(1px 1px at 65% 15%, rgba(255, 220, 80, 0.8), transparent),
            radial-gradient(2px 2px at 35% 65%, rgba(255, 180, 40, 0.9), transparent)
          `,
          backgroundSize: "100% 100%",
          animation: "sparkle 3s ease-in-out infinite",
        }}
      />

      {/* ============= HEADER WITH DAY DETAILS CARD ============= */}
      <header className="relative z-40">
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{
            background: "linear-gradient(180deg, rgba(15, 5, 5, 0.3) 0%, rgba(30, 10, 10, 0.1) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-1">
          {/* HEADER: Swastik + Title + Language Selector */}
          <div className="flex items-center justify-between gap-3 mb-1 pb-1" style={{ borderBottom: "2px solid rgba(255, 140, 50, 0.4)" }}>
            {/* Left: Swastik + Panchang Calendar Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* SWASTIK ICON BOX */}
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center flex-shrink-0 relative"
                style={{
                  background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
                  border: "3px solid #ff8c32",
                  borderRadius: "16px",
                  boxShadow: `
                    0 0 30px rgba(255, 140, 50, 1),
                    0 0 60px rgba(255, 100, 30, 0.8),
                    inset 0 0 20px rgba(255, 140, 50, 0.3),
                    inset 0 2px 6px rgba(255, 200, 100, 0.4),
                    inset 0 -2px 6px rgba(0, 0, 0, 0.6)
                  `,
                }}
              >
                {/* Inner border layer */}
                <div
                  className="absolute inset-0"
                  style={{
                    border: "2px solid rgba(255, 180, 80, 0.6)",
                    margin: "3px",
                    borderRadius: "12px",
                  }}
                />
                <span
                  className="text-xl sm:text-2xl relative z-10"
                  style={{
                    background: "linear-gradient(135deg, #ffe9a0 0%, #ffd54f 25%, #ffb300 50%, #ff8f00 75%, #ff6f00 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 1)) drop-shadow(0 0 30px rgba(255, 160, 0, 0.8))",
                    fontWeight: "900",
                  }}
                >
                  卐
                </span>
              </div>

              {/* PANCHANG CALENDAR TITLE */}
              <h1
                className="font-black tracking-tight min-w-0 flex-1"
                style={{
                  color: "#FFFFFF",
                  textShadow: `
                    0 1px 2px rgba(0, 0, 0, 0.85),
                    0 6px 18px rgba(255, 140, 50, 0.45)
                  `,
                  lineHeight: "1.05",
                  letterSpacing: "0.02em",
                  fontSize: "clamp(1rem, 2.6vw, 1.7rem)",
                  fontWeight: "900",
                }}
              >
                {t.appTitle}
              </h1>
            </div>

            {/* Right: Language Selector - Paksha Button Style */}
            <div className="flex-shrink-0">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold outline-none cursor-pointer transition-all hover:scale-105 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  color: "#FFE4B5",
                  border: "2.5px solid rgba(255, 140, 50, 0.7)",
                  boxShadow: `
                    0 0 20px rgba(255, 140, 50, 0.6),
                    0 0 40px rgba(255, 100, 30, 0.4),
                    inset 0 0 15px rgba(255, 200, 100, 0.2)
                  `,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFE4B5' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  backgroundSize: "10px",
                  paddingRight: "28px",
                }}
                aria-label="Select Language"
              >
                {languages.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="font-bold"
                    style={{
                      background: "#ff4d0d",
                      color: "#FFFFFF",
                    }}
                  >
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DAY DETAILS CARD - Compact Version for Header (without "Day Details" heading) */}
          <DayDetails day={selectedDay} language={language} translations={t} isHeaderMode={true} />
        </div>
      </header>

      {/* ============= MAIN CONTENT ============= */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1 sm:py-2 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-2 sm:gap-2">
        {/* CALENDAR SECTION */}
        <section 
          className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 35px rgba(255, 140, 50, 0.8),
              0 0 70px rgba(255, 100, 30, 0.6),
              inset 0 0 30px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          {/* Calendar Header: Month with Arrows + Year Button */}
          <div 
            className="flex items-center justify-between gap-2 mb-2 pb-2 px-3 py-1.5"
            style={{ 
              borderBottom: "2px solid rgba(255, 140, 50, 0.4)",
              background: "linear-gradient(180deg, rgba(80, 20, 10, 0.8) 0%, rgba(60, 15, 8, 0.7) 100%)",
              borderRadius: "12px"
            }}
          >
            {/* Month Button with Arrows Inside */}
            <button
              className="inline-flex items-center gap-3 rounded-full px-4 py-1.5 text-sm font-bold transition-all hover:scale-105 cursor-pointer"
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
              <span onClick={(e) => { e.stopPropagation(); goPrevMonth(); }} style={{ cursor: 'pointer', color: '#FFE4B5' }}>←</span>
              <span style={{ color: "#D4AF37" }}>{monthLabel}</span>
              <span onClick={(e) => { e.stopPropagation(); goNextMonth(); }} style={{ cursor: 'pointer', color: '#FFE4B5' }}>→</span>
            </button>

            {/* Year Button */}
            <button
              onClick={openDatePicker}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-all hover:scale-105 cursor-pointer"
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
              <span style={{ color: "#D4AF37" }}>📅</span>
              <span>{year}</span>
            </button>
          </div>

            {/* YearSelectorPopup - replaces inline date picker */}
            {showDatePicker && (
              <YearSelectorPopup
                isOpen={showDatePicker}
                onClose={handleDatePickerCancel}
                onConfirm={handleDatePickerOk}
                initialYear={tempYear}
                initialMonth={tempMonth}
                initialDay={tempDay}
                language={language}
                translations={t}
                onSpeak={handleDateClickSpeech}
              />
            )}

          <CalendarGrid
            days={days}
            selectedDate={selectedDay}
            onSelect={handleMainDateSelect}
            onSpeak={handleDateClickSpeech}
            language={language}
            translations={t}
          />
        </section>

        {/* RIGHT SIDEBAR - DayDetails only (Swastik/Title/Language moved to header) */}
        <section 
          className="rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 backdrop-blur-md"
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

          {/* PANCHANG ELEMENTS AND INAUSPICIOUS TIMINGS */}
          <DayDetails day={selectedDay} language={language} translations={t} isSidebarMode={true} />
        </section>
      </main>

      {/* FOOTER */}
      <footer 
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 text-center text-xs sm:text-sm font-bold"
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
        }}
      >
        {t.builtWith} {new Date().getFullYear()}
      </footer>

      {/* GLOBAL STYLES */}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        /* Smooth transitions for all interactive elements */
        button, select {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button:hover, select:hover {
          filter: brightness(1.15);
        }

        button:active {
          transform: scale(0.95);
        }

        /* Hide scrollbar for date picker columns */
        div::-webkit-scrollbar {
          display: none;
        }

        /* Scrollbar styling for main content */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(74, 21, 8, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(255, 140, 50, 0.7) 0%, rgba(255, 100, 30, 0.9) 100%);
          border-radius: 10px;
          border: 2px solid rgba(74, 21, 8, 0.3);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(255, 140, 50, 0.9) 0%, rgba(255, 100, 30, 1) 100%);
        }
      `}</style>
    </div>
  );
}

export default App;
