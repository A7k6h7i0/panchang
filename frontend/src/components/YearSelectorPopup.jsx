import { useState, useEffect, useRef } from "react";

const YEARS = Array.from({ length: 186 }, (_, i) => 1940 + i);

export default function YearSelectorPopup({
  isOpen,
  onClose,
  onConfirm,
  initialYear,
  initialMonth,
  initialDay,
  language,
  translations,
}) {
  const [tempYear, setTempYear] = useState(initialYear);
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const [tempDay, setTempDay] = useState(initialDay);
  const [showYearPicker, setShowYearPicker] = useState(false);
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

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get calendar grid days
  const getCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    // Add empty slots
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

  const goPrevMonth = () => {
    if (tempMonth === 0) {
      if (tempYear > 1940) {
        setTempYear(tempYear - 1);
        setTempMonth(11);
      }
    } else {
      setTempMonth(tempMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (tempMonth === 11) {
      if (tempYear < 2125) {
        setTempYear(tempYear + 1);
        setTempMonth(0);
      }
    } else {
      setTempMonth(tempMonth + 1);
    }
  };

  const handleYearSelect = (year) => {
    setTempYear(year);
    // Adjust day if needed
    const daysInNewMonth = getDaysInMonth(year, tempMonth);
    if (tempDay > daysInNewMonth) {
      setTempDay(daysInNewMonth);
    }
    setShowYearPicker(false);
  };

  const handleDateSelect = (day) => {
    if (day) {
      setTempDay(day);
    }
  };

  const handleConfirm = () => {
    onConfirm({ year: tempYear, month: tempMonth, day: tempDay });
  };

  const handleCancel = () => {
    setTempYear(initialYear);
    setTempMonth(initialMonth);
    setTempDay(initialDay);
    setShowYearPicker(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full sm:w-auto sm:max-w-[540px] rounded-t-3xl sm:rounded-3xl overflow-hidden relative"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Orange Header with Month/Year Navigation */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: "linear-gradient(90deg, #FF8C42 0%, #FF6B35 50%, #FF5722 100%)",
          }}
        >
          <button
            onClick={goPrevMonth}
            className="text-white text-2xl font-bold transition-transform hover:scale-110"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ←
          </button>

          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowYearPicker(true)}
              className="text-white text-2xl font-bold tracking-wide transition-transform hover:scale-105"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {translations.months[tempMonth]} {tempYear}
            </button>
          </div>

          <button
            onClick={goNextMonth}
            className="text-white text-2xl font-bold transition-transform hover:scale-110"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>

        {/* Year Selector Modal */}
        {showYearPicker && (
          <div
            ref={yearPickerRef}
            className="absolute inset-0 z-20 bg-white overflow-y-scroll"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingTop: "96px",
              paddingBottom: "96px",
            }}
          >
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => handleYearSelect(y)}
                className="w-full text-center font-medium transition-all"
                style={{
                  height: "48px",
                  color: y === tempYear ? "#FF6C37" : "#999999",
                  fontSize: y === tempYear ? "20px" : "16px",
                  fontWeight: y === tempYear ? "700" : "400",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                }}
              >
                {y}
              </button>
            ))}
            {/* Close button for year picker */}
            <button
              onClick={() => setShowYearPicker(false)}
              className="w-full py-3 text-center font-semibold transition-all active:bg-gray-100"
              style={{
                color: "#757575",
                background: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                borderTop: "1px solid #E0E0E0",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="p-4 bg-white">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {translations.weekdaysShort.map((day, idx) => (
              <div
                key={idx}
                className="text-center py-2 text-sm font-semibold"
                style={{ color: "#757575" }}
              >
                {day}
              </div>
            ))}
          </div>
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => handleDateSelect(day)}
                disabled={day === null}
                className="aspect-square flex items-center justify-center text-center font-medium transition-all"
                style={{
                  height: "40px",
                  color:
                    day === tempDay
                      ? "#FFFFFF"
                      : day
                      ? "#333333"
                      : "transparent",
                  fontSize: day === tempDay ? "16px" : "14px",
                  fontWeight: day === tempDay ? "700" : "400",
                  background:
                    day === tempDay ? "#FF6C37" : day ? "rgba(0, 0, 0, 0.02)" : "transparent",
                  border:
                    day === tempDay
                      ? "none"
                      : day
                      ? "1px solid rgba(0, 0, 0, 0.08)"
                      : "none",
                  borderRadius: day === tempDay ? "50%" : "4px",
                  cursor: day ? "pointer" : "default",
                }}
              >
                {day || ""}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex border-t" style={{ borderTop: "1px solid #E0E0E0" }}>
          <button
            onClick={handleCancel}
            className="flex-1 py-4 text-center font-semibold transition-all active:bg-gray-100"
            style={{
              color: "#757575",
              background: "#FFFFFF",
              border: "none",
              borderRight: "1px solid #E0E0E0",
              cursor: "pointer",
              fontSize: "15px",
              letterSpacing: "0.5px",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 text-center font-bold transition-all active:bg-orange-50"
            style={{
              color: "#FF6C37",
              background: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              letterSpacing: "0.5px",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
