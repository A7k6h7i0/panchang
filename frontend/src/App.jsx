import { useEffect, useMemo, useState, useRef } from "react";
import CalendarGrid from "./components/CalendarGrid";
import DayDetails from "./components/DayDetails";
import { translations, languages } from "./translations";
import { speakText } from "./utils/speech";

const YEARS = Array.from({ length: 186 }, (_, i) => 1940 + i);

const getTodayInfo = () => {
  const today = new Date();
  return {
    day: today.getDate(),
    month: today.getMonth(), // 0-based
    year: today.getFullYear(),
  };
};

function App() {
  const today = getTodayInfo();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [language, setLanguage] = useState("en");
  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearPickerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const t = translations[language];

  useEffect(() => {
    fetch(`/data/${year}.json`)
      .then((res) => res.json())
      .then((data) => {
        const monthDays = data.filter((d) => {
          const [, m] = d.date.split("/");
          const dateMonth = parseInt(m, 10) - 1;
          return dateMonth === month;
        });

        setDays(monthDays);
        
        // Check if we're viewing the current month and year
        if (year === today.year && month === today.month) {
          // Find today's date in the data
          const todayStr = `${String(today.day).padStart(2, "0")}/${String(
            today.month + 1
          ).padStart(2, "0")}/${today.year}`;
          const todayData = monthDays.find((d) => d.date === todayStr);
          
          if (todayData) {
            setSelectedDay(todayData);
          } else if (monthDays.length > 0) {
            setSelectedDay(monthDays[0]);
          }
        } else if (monthDays.length > 0) {
          setSelectedDay(monthDays[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, [year, month]);

  // Close year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target)) {
        setShowYearPicker(false);
      }
    };

    if (showYearPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showYearPicker]);

  // Scroll to selected year when picker opens
  useEffect(() => {
    if (showYearPicker && scrollContainerRef.current) {
      const selectedIndex = YEARS.indexOf(year);
      const itemHeight = 60;
      const containerHeight = 300;
      const scrollPosition = selectedIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
      
      setTimeout(() => {
        scrollContainerRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: "smooth"
        });
      }, 50);
    }
  }, [showYearPicker, year]);

  const goPrevMonth = () => {
    if (month === 0) {
      if (year > 1940) {
        setYear(year - 1);
        setMonth(11);
      }
    } else {
      setMonth(month - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      if (year < 2125) {
        setYear(year + 1);
        setMonth(0);
      }
    } else {
      setMonth(month + 1);
    }
  };

  const monthLabel = useMemo(
    () => `${t.months[month]}`,
    [month, language]
  );

  const handleYearSelect = (selectedYear) => {
    setYear(selectedYear);
    setShowYearPicker(false);
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

      {/* ============= COMPACT HEADER WITH REDUCED HEIGHT ============= */}
      <header className="relative z-40">
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{
            background: "linear-gradient(180deg, rgba(15, 5, 5, 0.3) 0%, rgba(30, 10, 10, 0.1) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4">
          {/* ROW 1: Icon + Title + Language */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-4">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* SWASTIK ICON BOX */}
              <div
                className="h-11 w-11 sm:h-13 sm:w-13 md:h-16 md:w-16 flex items-center justify-center flex-shrink-0 relative"
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
                  className="absolute inset-0"
                  style={{
                    border: "2px solid rgba(255, 180, 80, 0.6)",
                    margin: "4px",
                    borderRadius: "18px",
                  }}
                />
                <span
                  className="text-2xl sm:text-3xl md:text-4xl relative z-10"
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

              {/* TITLE TEXT */}
              <div className="min-w-0 flex-1">
                <h1
                  className="font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{
                    color: "#FFFFFF",
                    textShadow: `
                      0 2px 10px rgba(0, 0, 0, 0.7),
                      0 0 30px rgba(255, 140, 50, 0.5),
                      0 4px 20px rgba(0, 0, 0, 0.5)
                    `,
                    lineHeight: "1.1",
                    fontSize: "clamp(0.95rem, 3.5vw, 3rem)",
                  }}
                >
                  {t.appTitle}
                </h1>
              </div>
            </div>

            {/* Right: Language Selector */}
            <div className="flex items-center flex-shrink-0">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-bold outline-none cursor-pointer transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)",
                  color: "#FFFFFF",
                  border: "2.5px solid #66BB6A",
                  borderRadius: "14px",
                  boxShadow: `
                    0 0 25px rgba(102, 187, 106, 0.9),
                    0 0 50px rgba(76, 175, 80, 0.7),
                    inset 0 0 20px rgba(129, 199, 132, 0.25),
                    inset 0 2px 4px rgba(200, 230, 201, 0.3)
                  `,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  backgroundSize: "12px",
                  paddingRight: "30px",
                }}
                aria-label="Select Language"
              >
                {languages.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="font-bold"
                    style={{
                      background: "#1B5E20",
                      color: "#FFFFFF",
                    }}
                  >
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 2: Month Navigation with Arrows Inside and iOS-Style Year Picker */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap pb-2">
            {/* MONTH DISPLAY WITH INTEGRATED ARROWS */}
            <div className="flex items-center gap-0">
              {/* MONTH CONTAINER WITH ARROWS INSIDE */}
              <div
                className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-xl md:text-2xl font-black min-w-[200px] sm:min-w-[280px]"
                style={{
                  background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)",
                  color: "#FFFFFF",
                  border: "3px solid #66BB6A",
                  borderRadius: "16px",
                  boxShadow: `
                    0 0 35px rgba(102, 187, 106, 0.95),
                    0 0 70px rgba(76, 175, 80, 0.85),
                    0 0 105px rgba(56, 142, 60, 0.65),
                    inset 0 0 30px rgba(129, 199, 132, 0.35)
                  `,
                  textShadow: `
                    0 2px 10px rgba(0, 0, 0, 0.6),
                    0 0 25px rgba(200, 230, 201, 0.5)
                  `,
                }}
              >
                {/* LEFT ARROW BUTTON */}
                <button
                  onClick={goPrevMonth}
                  className="px-2 py-1 text-lg sm:text-xl font-black transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
                  style={{
                    background: "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label="Previous month"
                >
                  ←
                </button>

                {/* MONTH NAME */}
                <span className="flex-1 text-center px-2">
                  {monthLabel}
                </span>

                {/* RIGHT ARROW BUTTON */}
                <button
                  onClick={goNextMonth}
                  className="px-2 py-1 text-lg sm:text-xl font-black transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
                  style={{
                    background: "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            {/* MONTH DROPDOWN */}
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-bold outline-none cursor-pointer transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)",
                color: "#FFFFFF",
                border: "2.5px solid #66BB6A",
                borderRadius: "14px",
                boxShadow: `
                  0 0 25px rgba(102, 187, 106, 0.9),
                  0 0 50px rgba(76, 175, 80, 0.7),
                  inset 0 0 20px rgba(129, 199, 132, 0.25)
                `,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFFFFF' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "12px",
                paddingRight: "30px",
              }}
              aria-label="Select month"
            >
              {t.months.map((m, idx) => (
                <option
                  key={idx}
                  value={idx}
                  className="font-bold"
                  style={{
                    background: "#1B5E20",
                    color: "#FFFFFF",
                  }}
                >
                  {m}
                </option>
              ))}
            </select>

            {/* iOS-STYLE YEAR PICKER */}
            <div className="relative" ref={yearPickerRef}>
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-bold outline-none cursor-pointer transition-all hover:scale-105 min-w-[80px] text-center"
                style={{
                  background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)",
                  color: "#FFFFFF",
                  border: "2.5px solid #66BB6A",
                  borderRadius: "14px",
                  boxShadow: `
                    0 0 25px rgba(102, 187, 106, 0.9),
                    0 0 50px rgba(76, 175, 80, 0.7),
                    inset 0 0 20px rgba(129, 199, 132, 0.25)
                  `,
                }}
                aria-label="Select year"
              >
                {year}
              </button>

              {/* iOS-STYLE YEAR ROLLER PICKER */}
              {showYearPicker && (
                <div
                  className="absolute z-50 mt-2 rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    border: "3px solid #E0E0E0",
                    boxShadow: `
                      0 10px 40px rgba(0, 0, 0, 0.2),
                      0 0 0 1px rgba(0, 0, 0, 0.05)
                    `,
                    width: "140px",
                    right: 0,
                  }}
                >
                  {/* Date display at top */}
                  <div
                    className="text-center py-3 border-b"
                    style={{
                      background: "#F5F5F5",
                      borderBottom: "1px solid #E0E0E0",
                    }}
                  >
                    <div
                      className="text-xs font-semibold"
                      style={{ color: "#757575" }}
                    >
                      {`${String(month + 1).padStart(2, "0")}/${String(today.day).padStart(2, "0")}/${year}`}
                    </div>
                  </div>

                  {/* Column labels */}
                  <div
                    className="flex justify-center py-2 border-b"
                    style={{
                      background: "#FAFAFA",
                      borderBottom: "1px solid #E0E0E0",
                    }}
                  >
                    <div
                      className="text-xs font-bold"
                      style={{ color: "#424242" }}
                    >
                      Year
                    </div>
                  </div>

                  {/* Top fade overlay */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10"
                    style={{
                      top: "82px",
                      height: "60px",
                      background: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 40%, transparent 100%)",
                    }}
                  />

                  {/* Selection highlight bar */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10"
                    style={{
                      top: "50%",
                      transform: "translateY(-50%)",
                      height: "60px",
                      background: "rgba(240, 240, 240, 0.6)",
                      borderTop: "1px solid rgba(200, 200, 200, 0.4)",
                      borderBottom: "1px solid rgba(200, 200, 200, 0.4)",
                    }}
                  />

                  {/* Scrollable year list */}
                  <div
                    ref={scrollContainerRef}
                    className="overflow-y-scroll"
                    style={{
                      height: "300px",
                      paddingTop: "120px",
                      paddingBottom: "120px",
                      scrollBehavior: "smooth",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => handleYearSelect(y)}
                        className="w-full py-3 text-center font-medium transition-all"
                        style={{
                          height: "60px",
                          color: y === year ? "#212121" : "#757575",
                          fontSize: y === year ? "22px" : "18px",
                          fontWeight: y === year ? "600" : "400",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  {/* Bottom fade overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                    style={{
                      height: "60px",
                      background: "linear-gradient(0deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 40%, transparent 100%)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============= MAIN CONTENT ============= */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6">
        {/* CALENDAR SECTION */}
        <section 
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.94)",
            border: "3px solid rgba(255, 140, 50, 0.6)",
            boxShadow: "0 8px 32px rgba(255, 100, 30, 0.4), 0 0 80px rgba(255, 140, 50, 0.2)",
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 
              className="text-base sm:text-lg md:text-xl font-black drop-shadow-sm"
              style={{
                color: "#c62828",
              }}
            >
              {t.calendar}
            </h2>
            <div 
              className="text-xs sm:text-sm md:text-base font-bold"
              style={{
                color: "rgba(198, 40, 40, 0.7)",
              }}
            >
              {t.tapDate}
            </div>
          </div>

          <CalendarGrid
            year={year}
            month={month}
            days={days}
            selectedDate={selectedDay}
            onSelect={setSelectedDay}
            language={language}
            translations={t}
          />
        </section>

        {/* DAY DETAILS SECTION */}
        <DayDetails day={selectedDay} language={language} translations={t} />
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

        /* Hide scrollbar for year picker */
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