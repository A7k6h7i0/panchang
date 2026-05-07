import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const YEARS = Array.from({ length: 186 }, (_, i) => 1940 + i);
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

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
  const [tempDay, setTempDay] = useState(initialDay || 1);

  const monthScrollerRef = useRef(null);
  const dayScrollerRef = useRef(null);
  const yearScrollerRef = useRef(null);
  const daysInSelectedMonth = getDaysInMonth(tempYear, tempMonth);
  const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // When opened, sync state to initial values
  useEffect(() => {
    if (isOpen) {
      setTempYear(initialYear);
      setTempMonth(initialMonth);
      setTempDay(initialDay || 1);

      // Auto-scroll to correct positions when opening
      if (monthScrollerRef.current) {
        monthScrollerRef.current.scrollTop = initialMonth * ITEM_HEIGHT;
      }
      if (dayScrollerRef.current) {
        dayScrollerRef.current.scrollTop = Math.max(0, (initialDay || 1) - 1) * ITEM_HEIGHT;
      }
      if (yearScrollerRef.current) {
        const yearIndex = YEARS.indexOf(initialYear);
        if (yearIndex !== -1) {
          yearScrollerRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
        }
      }
    }
  }, [isOpen, initialYear, initialMonth, initialDay]);

  useEffect(() => {
    const maxDay = getDaysInMonth(tempYear, tempMonth);
    if (tempDay > maxDay) {
      setTempDay(maxDay);
      if (dayScrollerRef.current) {
        dayScrollerRef.current.scrollTo({ top: (maxDay - 1) * ITEM_HEIGHT, behavior: "auto" });
      }
    }
  }, [tempYear, tempMonth, tempDay]);

  // Handle snapping logic after scroll ends for Month
  const handleMonthScroll = () => {
    if (!monthScrollerRef.current) return;
    const scrollTop = monthScrollerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(11, index));
    if (tempMonth !== clampedIndex) {
      setTempMonth(clampedIndex);
    }
  };

  // Handle snapping logic after scroll ends for Day
  const handleDayScroll = () => {
    if (!dayScrollerRef.current) return;
    const scrollTop = dayScrollerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(dayOptions.length - 1, index));
    const selectedDay = dayOptions[clampedIndex];
    if (tempDay !== selectedDay) {
      setTempDay(selectedDay);
    }
  };

  // Handle snapping logic after scroll ends for Year
  const handleYearScroll = () => {
    if (!yearScrollerRef.current) return;
    const scrollTop = yearScrollerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(YEARS.length - 1, index));
    const selectedYear = YEARS[clampedIndex];
    if (tempYear !== selectedYear) {
      setTempYear(selectedYear);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      year: tempYear,
      month: tempMonth,
      day: tempDay,
    });
    onClose?.();
  };

  if (!isOpen) return null;

  const popup = (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-[#120b04] p-0 sm:items-center sm:p-4"
      style={{
        background: "rgba(18, 11, 4, 0.98)",
      }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl animate-slide-up sm:max-w-md sm:rounded-2xl sm:animate-none"
        style={{
          background: "linear-gradient(135deg, #3a0b0b 0%, #aa4b13 50%, #3a0b0b 100%)",
          border: "2px solid rgba(255, 140, 50, 0.4)",
          borderBottom: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-[rgba(255,140,50,0.3)] shadow-md relative z-20"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="text-[rgba(255,228,181,0.7)] font-semibold text-lg hover:text-[rgba(255,228,181,1)] transition-colors px-2"
          >
            {translations?.cancel || "Cancel"}
          </button>
          <div className="font-bold text-lg" style={{ color: "#FFE4B5", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            Select
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleConfirm}
            className="text-orange-400 font-bold text-lg hover:text-orange-300 transition-colors px-2"
          >
            {translations?.ok || "Done"}
          </button>
        </div>

        {/* Picker Area */}
        <div
          className="relative flex min-h-0 justify-center items-stretch bg-[rgba(20,5,3,0.3)]"
          style={{ height: `${ITEM_HEIGHT * VISIBLE_ITEMS}px` }}
        >

          {/* Highlight selection bar */}
          <div
            className="absolute left-4 right-4 h-[44px] rounded-xl pointer-events-none"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              background: "linear-gradient(90deg, rgba(255, 140, 50, 0.1) 0%, rgba(255, 180, 50, 0.25) 50%, rgba(255, 140, 50, 0.1) 100%)",
              borderTop: "1px solid rgba(255, 180, 50, 0.3)",
              borderBottom: "1px solid rgba(255, 180, 50, 0.3)",
              boxShadow: "0 0 15px rgba(255, 140, 50, 0.2)",
              zIndex: 0
            }}
          />

          {/* Month Column */}
          <div
            ref={monthScrollerRef}
            onScroll={handleMonthScroll}
            className="relative z-10 flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden picker-scroller"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehavior: "contain",
            }}
          >
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} /> {/* Top padding */}
            {translations.months.map((monthName, i) => {
              const isSelected = i === tempMonth;
              const distance = Math.abs(i - tempMonth);
              return (
                <div
                  key={i}
                  className="flex items-center justify-end pr-6 font-bold cursor-pointer transition-all duration-200"
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    fontSize: isSelected ? '22px' : '18px',
                    color: isSelected ? '#FFE4B5' : `rgba(255, 228, 181, ${Math.max(0.2, 0.6 - distance * 0.2)})`,
                    textShadow: isSelected ? '0 0 12px rgba(255, 180, 50, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : `scale(${Math.max(0.8, 1 - distance * 0.05)})`,
                    transformOrigin: 'right center'
                  }}
                  onClick={() => {
                    if (monthScrollerRef.current) {
                      monthScrollerRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                    }
                  }}
                >
                  {monthName}
                </div>
              );
            })}
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} /> {/* Bottom padding */}
          </div>

          {/* Day Column */}
          <div
            ref={dayScrollerRef}
            onScroll={handleDayScroll}
            className="relative z-10 flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden picker-scroller"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehavior: "contain",
            }}
          >
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} />
            {dayOptions.map((day) => {
              const isSelected = day === tempDay;
              const distance = Math.abs(day - tempDay);
              return (
                <div
                  key={day}
                  className="flex items-center justify-center font-bold cursor-pointer transition-all duration-200"
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    fontSize: isSelected ? '22px' : '18px',
                    color: isSelected ? '#FFE4B5' : `rgba(255, 228, 181, ${Math.max(0.2, 0.6 - distance * 0.08)})`,
                    textShadow: isSelected ? '0 0 12px rgba(255, 180, 50, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : `scale(${Math.max(0.8, 1 - distance * 0.03)})`,
                  }}
                  onClick={() => {
                    if (dayScrollerRef.current) {
                      dayScrollerRef.current.scrollTo({ top: (day - 1) * ITEM_HEIGHT, behavior: 'smooth' });
                    }
                  }}
                >
                  {String(day).padStart(2, "0")}
                </div>
              );
            })}
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} />
          </div>

          {/* Year Column */}
          <div
            ref={yearScrollerRef}
            onScroll={handleYearScroll}
            className="relative z-10 flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden picker-scroller"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehavior: "contain",
            }}
          >
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} /> {/* Top padding */}
            {YEARS.map((y, i) => {
              const isSelected = y === tempYear;
              const distance = Math.abs(i - YEARS.indexOf(tempYear));
              return (
                <div
                  key={y}
                  className="flex items-center justify-start pl-6 font-bold cursor-pointer transition-all duration-200"
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                    fontSize: isSelected ? '22px' : '18px',
                    color: isSelected ? '#FFE4B5' : `rgba(255, 228, 181, ${Math.max(0.2, 0.6 - distance * 0.2)})`,
                    textShadow: isSelected ? '0 0 12px rgba(255, 180, 50, 0.6)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : `scale(${Math.max(0.8, 1 - distance * 0.05)})`,
                    transformOrigin: 'left center'
                  }}
                  onClick={() => {
                    if (yearScrollerRef.current) {
                      yearScrollerRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                    }
                  }}
                >
                  {y}
                </div>
              );
            })}
            <div style={{ height: `${HALF_VISIBLE * ITEM_HEIGHT}px` }} /> {/* Bottom padding */}
          </div>

        </div>

        {/* Soft gradient fade overlays for top and bottom of picker to create cylinder effect */}
        <div className="absolute inset-x-0 top-[69px] h-[80px] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(58,11,11,0.95) 0%, rgba(58,11,11,0) 100%)", zIndex: 5 }} />
        <div className="absolute inset-x-0 bottom-0 h-[80px] pointer-events-none" style={{ background: "linear-gradient(0deg, rgba(58,11,11,0.95) 0%, rgba(58,11,11,0) 100%)", zIndex: 5 }} />

      </div>
    </div>
  );

  return typeof document === "undefined" ? popup : createPortal(popup, document.body);
}
