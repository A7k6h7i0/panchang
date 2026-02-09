import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import CalendarGrid from "./CalendarGrid";

const YEARS = Array.from({ length: 186 }, (_, i) => 1940 + i);
const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function YearSelectorPopup({
  isOpen,
  onClose,
  onConfirm,
  initialYear,
  initialMonth,
  initialDay,
  language,
  translations,
  onSpeak,
}) {
  const [tempYear, setTempYear] = useState(initialYear);
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const [tempDay, setTempDay] = useState(initialDay);
  const [popupDays, setPopupDays] = useState([]);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popupViewportMaxHeight = "calc(100dvh - 1rem)";
  const calendarViewportMaxHeight = "calc(100dvh - 12rem)";

  const yearPickerRef = useRef(null);
  const popupRef = useRef(null);

  const selectedPopupDay = useMemo(() => {
    const dateStr = `${String(tempDay).padStart(2, "0")}/${String(
      tempMonth + 1
    ).padStart(2, "0")}/${tempYear}`;
    return popupDays.find((d) => d.date === dateStr) || null;
  }, [popupDays, tempDay, tempMonth, tempYear]);

  // Update temp state when initial values change
  useEffect(() => {
    if (isOpen) {
      setTempYear(initialYear);
      setTempMonth(initialMonth);
      setTempDay(initialDay);
    }
  }, [isOpen, initialYear, initialMonth, initialDay]);

  // Fetch days for tempYear/tempMonth when they change
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setPopupDays([]);
      fetch(`/data/${tempYear}.json`)
        .then((res) => res.json())
        .then((data) => {
          const monthDays = data.filter((d) => {
            const [, m] = d.date.split("/");
            const dateMonth = parseInt(m, 10) - 1;
            return dateMonth === tempMonth;
          });
          setPopupDays(monthDays);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching popup data:", err);
          setPopupDays([]);
          setIsLoading(false);
        });
    }
  }, [isOpen, tempYear, tempMonth]);

  // Keep tempDay valid for the currently loaded month data
  useEffect(() => {
    if (!isOpen || popupDays.length === 0) return;
    if (!selectedPopupDay) {
      const firstValidDay = parseInt(popupDays[0].date.split("/")[0], 10);
      setTempDay(firstValidDay);
    }
  }, [isOpen, popupDays, selectedPopupDay]);

  // Scroll to selected year when year picker opens
  useEffect(() => {
    if (showYearPicker && yearPickerRef.current) {
      setTimeout(() => {
        const yearIndex = YEARS.indexOf(tempYear);
        const itemHeight = 40;
        const containerHeight = 224;
        const scrollPosition =
          yearIndex * itemHeight - containerHeight / 2 + itemHeight / 2;

        yearPickerRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: "smooth",
        });
      }, 100);
    }
  }, [showYearPicker, tempYear]);

  // Handle click outside to close popup
  const handleBackdropClick = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      handleCancel();
    }
  };

  const goPrevMonth = () => {
    let newYear = tempYear;
    let newMonth = tempMonth - 1;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear = tempYear - 1;
    }
    
    if (newYear >= 1940) {
      setTempYear(newYear);
      setTempMonth(newMonth);
      
      fetch(`/data/${newYear}.json`)
        .then((res) => res.json())
        .then((data) => {
          const monthDays = data.filter((d) => {
            const [, m] = d.date.split("/");
            const dateMonth = parseInt(m, 10) - 1;
            return dateMonth === newMonth;
          });
          setPopupDays(monthDays);
        })
        .catch((err) => {
          console.error("Error fetching prev month data:", err);
        });
    }
  };

  const goNextMonth = () => {
    let newYear = tempYear;
    let newMonth = tempMonth + 1;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear = tempYear + 1;
    }
    
    if (newYear <= 2125) {
      setTempYear(newYear);
      setTempMonth(newMonth);
      
      fetch(`/data/${newYear}.json`)
        .then((res) => res.json())
        .then((data) => {
          const monthDays = data.filter((d) => {
            const [, m] = d.date.split("/");
            const dateMonth = parseInt(m, 10) - 1;
            return dateMonth === newMonth;
          });
          setPopupDays(monthDays);
        })
        .catch((err) => {
          console.error("Error fetching next month data:", err);
        });
    }
  };

  const handleYearSelect = (year) => {
    setTempYear(year);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month) => {
    setTempMonth(month);
    setShowMonthPicker(false);
  };

  const handleDateSelect = (day) => {
    if (!day || !day.date) return;
    setTempDay(parseInt(day.date.split("/")[0], 10));
  };

  const handleConfirm = () => {
    const dateStr = `${String(tempDay).padStart(2, "0")}/${String(tempMonth + 1).padStart(2, "0")}/${tempYear}`;
    const dayData = popupDays.find((d) => d.date === dateStr);
    
    onConfirm({
      year: tempYear,
      month: tempMonth,
      day: dayData ? parseInt(dayData.date.split("/")[0], 10) : tempDay,
      dayData: dayData
    });
  };

  const handleCancel = () => {
    setTempYear(initialYear);
    setTempMonth(initialMonth);
    setTempDay(initialDay);
    setShowYearPicker(false);
    setShowMonthPicker(false);
    onClose();
  };

  if (!isOpen) return null;

  const popupContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4 z-[1000]"
      onClick={handleBackdropClick}
    >
      <div 
        ref={popupRef}
        className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(135deg, #4a0e0e 0%, #6b1515 50%, #4a0e0e 100%)",
          maxHeight: popupViewportMaxHeight,
          zIndex: 1001
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-2 sm:p-3 pb-1 sm:pb-2 flex-shrink-0">
          {/* Month Navigation Row */}
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            {/* Month and Year Selectors */}
            <div className="flex gap-1 sm:gap-2 w-full justify-center">
              <button
                onClick={() => setShowMonthPicker(true)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold text-sm transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 140, 50, 0.4) 0%, rgba(255, 100, 30, 0.5) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.6)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 10px rgba(255, 140, 50, 0.3)",
                }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrevMonth();
                  }}
                >
                  ‹
                </span>
                <span>{translations.months[tempMonth]}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    goNextMonth();
                  }}
                >
                  ›
                </span>
              </button>
              <button
                onClick={() => setShowYearPicker(true)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold text-sm transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                  border: "2px solid rgba(255, 140, 50, 0.7)",
                  color: "#FFE4B5",
                  boxShadow: "0 0 10px rgba(255, 140, 50, 0.4)",
                }}
              >
                {tempYear}
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div
          className="px-2 sm:px-3"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            maxHeight: calendarViewportMaxHeight,
            paddingBottom: "0.25rem",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-orange-200">
              Loading...
            </div>
          ) : popupDays.length > 0 ? (
            <CalendarGrid
              days={popupDays}
              selectedDate={selectedPopupDay}
              onSelect={handleDateSelect}
              language={language}
              translations={translations}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-orange-200">
              No data available
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div
          className="p-2 sm:p-3 pt-1 sm:pt-2 flex-shrink-0"
          style={{ paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom))" }}
        >
          {/* Action Buttons */}
          <div className="flex justify-center gap-2 sm:gap-3">
            <button
              onClick={handleCancel}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm cursor-pointer"
            >
              {translations.cancel || "Cancel"}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm cursor-pointer"
            >
              {translations.ok || "OK"}
            </button>
          </div>
        </div>
      </div>

      {/* Year Picker Modal */}
      {showYearPicker && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1010]"
          onClick={(e) => {
            e.stopPropagation();
            setShowYearPicker(false);
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl p-4 max-w-xs w-full mx-4 flex flex-col"
            style={{
              background: "linear-gradient(135deg, #4a0e0e 0%, #6b1515 50%, #4a0e0e 100%)",
              maxHeight: "calc(100dvh - 1rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-orange-300 mb-3 text-center">
              {translations.selectYear || "Select Year"}
            </h3>
            <div
              ref={yearPickerRef}
              className="h-56 overflow-y-auto rounded-lg bg-black/20 shadow-inner p-2"
              style={{ flex: 1, minHeight: 0 }}
            >
              {YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 font-medium text-sm ${
                    year === tempYear
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-amber-900/80 hover:bg-amber-800 text-orange-200"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowYearPicker(false)}
              className="w-full mt-3 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-all duration-200 text-sm cursor-pointer"
            >
              {translations.cancel || "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1010]"
          onClick={(e) => {
            e.stopPropagation();
            setShowMonthPicker(false);
          }}
        >
          <div 
            className="rounded-2xl shadow-2xl p-4 max-w-xs w-full mx-4 flex flex-col"
            style={{
              background: "linear-gradient(135deg, #4a0e0e 0%, #6b1515 50%, #4a0e0e 100%)",
              maxHeight: "calc(100dvh - 1rem)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-orange-300 mb-3 text-center">
              {translations.selectMonth || "Select Month"}
            </h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
              {MONTHS.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(month)}
                  className={`px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                    month === tempMonth
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-orange-500/20 hover:bg-orange-500/40 text-orange-200"
                  }`}
                >
                  {translations.months[month]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMonthPicker(false)}
              className="w-full mt-3 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-all duration-200 text-sm cursor-pointer"
            >
              {translations.cancel || "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(popupContent, document.body);
}
