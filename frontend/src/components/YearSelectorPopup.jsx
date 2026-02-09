import { useState, useEffect, useRef } from "react";
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
  days,
  onYearMonthChange,
}) {
  const [tempYear, setTempYear] = useState(initialYear);
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const [tempDay, setTempDay] = useState(initialDay);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const yearPickerRef = useRef(null);

  // Update temp state when initial values change
  useEffect(() => {
    if (isOpen) {
      setTempYear(initialYear);
      setTempMonth(initialMonth);
      setTempDay(initialDay);
    }
  }, [isOpen, initialYear, initialMonth, initialDay]);

  // Scroll to selected year when year picker opens
  useEffect(() => {
    if (showYearPicker && yearPickerRef.current) {
      setTimeout(() => {
        const yearIndex = YEARS.indexOf(tempYear);
        const itemHeight = 48;
        const containerHeight = 240;
        const scrollPosition =
          yearIndex * itemHeight - containerHeight / 2 + itemHeight / 2;

        yearPickerRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: "smooth",
        });
      }, 100);
    }
  }, [showYearPicker, tempYear]);

  const goPrevMonth = () => {
    if (tempMonth === 0) {
      if (tempYear > 1940) {
        setTempYear(tempYear - 1);
        setTempMonth(11);
        onYearMonthChange(tempYear - 1, 11);
      }
    } else {
      setTempMonth(tempMonth - 1);
      onYearMonthChange(tempYear, tempMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (tempMonth === 11) {
      if (tempYear < 2125) {
        setTempYear(tempYear + 1);
        setTempMonth(0);
        onYearMonthChange(tempYear + 1, 0);
      }
    } else {
      setTempMonth(tempMonth + 1);
      onYearMonthChange(tempYear, tempMonth + 1);
    }
  };

  const handleYearSelect = (year) => {
    setTempYear(year);
    setShowYearPicker(false);
    // Immediately update parent state
    onYearMonthChange(year, tempMonth);
    
    // Also fetch and update selected day for the new year
    fetch(`/data/${year}.json`)
      .then((res) => res.json())
      .then((data) => {
        const dateStr = `${String(tempDay).padStart(2, "0")}/${String(tempMonth + 1).padStart(2, "0")}/${year}`;
        const dayData = data.find((d) => d.date === dateStr);
        if (dayData) {
          // Call onConfirm with updated year
          onConfirm({
            year: year,
            month: tempMonth,
            day: tempDay,
            dayData: dayData
          });
        } else {
          // If day not valid in new year, use first day of month
          const firstDayStr = `${String(1).padStart(2, "0")}/${String(tempMonth + 1).padStart(2, "0")}/${year}`;
          const firstDayData = data.find((d) => d.date === firstDayStr);
          if (firstDayData) {
            onConfirm({
              year: year,
              month: tempMonth,
              day: 1,
              dayData: firstDayData
            });
          }
        }
      });
  };

  const handleMonthSelect = (month) => {
    setTempMonth(month);
    setShowMonthPicker(false);
    // Immediately update parent state
    onYearMonthChange(tempYear, month);
    
    // Also fetch and update selected day for the new month
    fetch(`/data/${tempYear}.json`)
      .then((res) => res.json())
      .then((data) => {
        const dateStr = `${String(tempDay).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${tempYear}`;
        const dayData = data.find((d) => d.date === dateStr);
        if (dayData) {
          setTempDay(parseInt(dayData.date.split("/")[0], 10));
        } else {
          // If day not valid in new month, find last day of month
          const lastDay = new Date(tempYear, month + 1, 0).getDate();
          setTempDay(lastDay);
        }
      });
  };

  const handleDateSelect = (day) => {
    setTempDay(day);
  };

  const handleConfirm = () => {
    onConfirm({
      year: tempYear,
      month: tempMonth,
      day: tempDay,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-center">{tempYear}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goPrevMonth}
              className="flex items-center space-x-2 bg-white hover:bg-orange-50 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-orange-900 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>{translations.prev}</span>
            </button>

            <button
              onClick={() => setShowMonthPicker(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {translations.months[tempMonth]}
            </button>

            <button
              onClick={goNextMonth}
              className="flex items-center space-x-2 bg-white hover:bg-orange-50 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-orange-900 font-medium"
            >
              <span>{translations.next}</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <CalendarGrid
              days={days}
              selectedDate={`${String(tempDay).padStart(2, "0")}/${String(
                tempMonth + 1
              ).padStart(2, "0")}/${tempYear}`}
              onSelect={(day) => {
                const dayNum = parseInt(day.date.split("/")[0]);
                handleDateSelect(dayNum);
                // Trigger speech for selected date
                if (typeof onSpeak === 'function') {
                  onSpeak(day);
                }
              }}
              onSpeak={(day) => {
                if (typeof onSpeak === 'function') {
                  onSpeak(day);
                }
              }}
              language={language}
              translations={translations}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {translations.cancel || "Cancel"}
            </button>
            <button
              onClick={() => setShowYearPicker(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-105 cursor-pointer"
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
              <span>{translations.selectYear || "Select Year"}</span>
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {translations.ok || "OK"}
            </button>
          </div>
        </div>
      </div>

      {/* Year Picker Modal */}
      {showYearPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-orange-900 mb-4 text-center">
              {translations.selectYear || "Select Year"}
            </h3>
            <div
              ref={yearPickerRef}
              className="h-60 overflow-y-auto rounded-lg bg-white shadow-inner p-2"
            >
              {YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200 font-medium ${
                    year === tempYear
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                      : "hover:bg-orange-100 text-orange-900"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowYearPicker(false)}
              className="w-full mt-4 px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-all duration-200"
            >
              {translations.cancel || "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-orange-900 mb-4 text-center">
              {translations.selectMonth || "Select Month"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {MONTHS.map((month) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(month)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    month === tempMonth
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-white hover:bg-orange-100 text-orange-900 shadow-md"
                  }`}
                >
                  {translations.months[month]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMonthPicker(false)}
              className="w-full mt-4 px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-all duration-200"
            >
              {translations.cancel || "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
