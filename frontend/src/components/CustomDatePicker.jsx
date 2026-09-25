import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

/**
 * Custom 90-95% Black Depth Glassmorphic DatePicker
 * Supports Month/Year navigation, Today quick-pick, clear action, and dynamic theme accents.
 */
export default function CustomDatePicker({
  value = '',
  onChange,
  label = 'Date',
  placeholder = 'Select date (YYYY-MM-DD)',
  activeWebsite = null,
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value or default to current date
  const parsedDate = value ? new Date(value) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  const [currentYear, setCurrentYear] = useState(() => validDate ? validDate.getFullYear() : new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => validDate ? validDate.getMonth() : new Date().getMonth());

  // Close calendar popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Sync year/month when value changes externally
  useEffect(() => {
    if (validDate) {
      setCurrentYear(validDate.getFullYear());
      setCurrentMonth(validDate.getMonth());
    }
  }, [value]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Month navigation
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Select day handler
  const handleSelectDay = (dayNum, monthOffset = 0) => {
    let targetYear = currentYear;
    let targetMonth = currentMonth + monthOffset;

    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const formattedMonth = String(targetMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateString = `${targetYear}-${formattedMonth}-${formattedDay}`;

    if (onChange) {
      onChange(dateString);
    }
    setIsOpen(false);
  };

  // Quick Today picker
  const handlePickToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    if (onChange) onChange(formatted);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setIsOpen(false);
  };

  // Clear date handler
  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
    setIsOpen(false);
  };

  // Calculate calendar grid (42 days)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push(d);
  }

  const remainingDays = 42 - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = [];
  for (let d = 1; d <= remainingDays; d++) {
    nextMonthDays.push(d);
  }

  // Theme styling helpers
  const accentText = activeWebsite?.accentText || 'text-blue-400';
  const accentBorder = activeWebsite?.accentBorder || 'border-blue-500/40';
  const accentBg = activeWebsite?.accentBg || 'bg-blue-500/10';
  const gradient = activeWebsite?.gradient || 'from-blue-600 to-indigo-600';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className={`w-3.5 h-3.5 ${accentText}`} />
            <span>{label}</span>
            {required && <span className="text-rose-400">*</span>}
          </span>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </label>
      )}

      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[42px] px-3.5 py-2 rounded-lg bg-[#0d1018] border ${
          isOpen ? `${accentBorder} shadow-lg shadow-blue-500/10 bg-[#161a28]` : 'border-[#222738] hover:border-neutral-600'
        } text-sm text-left flex items-center justify-between transition-all duration-150 focus:outline-none`}
      >
        <span className={value ? 'text-neutral-100 font-mono text-xs font-medium' : 'text-neutral-500 text-xs'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <CalendarIcon className={`w-4 h-4 ${value ? accentText : 'text-neutral-400'}`} />
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          {/* Header: Month & Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222738] mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-400 hover:text-white border border-[#222738] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center font-bold text-xs sm:text-sm text-neutral-200 flex items-center gap-1.5">
              <span className="font-accent text-sm text-white">{monthNames[currentMonth]}</span>
              <span className="text-neutral-400 font-mono text-xs">{currentYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-400 hover:text-white border border-[#222738] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayLabels.map((d, i) => (
              <span key={i} className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Prev month padding days */}
            {prevMonthDays.map((d) => (
              <button
                key={`prev-${d}`}
                type="button"
                onClick={() => handleSelectDay(d, -1)}
                className="h-8 rounded-md text-neutral-500 hover:bg-[#0d1018] hover:text-neutral-300 text-xs transition-colors"
              >
                {d}
              </button>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((d) => {
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(d).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d, 0)}
                  className={`h-8 rounded-md text-xs font-semibold relative transition-all duration-150 flex items-center justify-center ${
                    isSelected
                      ? `bg-gradient-to-r ${gradient} text-white shadow-md shadow-blue-500/30 scale-105 font-bold z-10`
                      : isToday
                      ? 'bg-[#0d1018] text-blue-400 border border-blue-500/40 hover:bg-[#161a28]'
                      : 'text-neutral-200 hover:bg-[#161a28] hover:text-white'
                  }`}
                >
                  <span>{d}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400"></span>
                  )}
                </button>
              );
            })}

            {/* Next month padding days */}
            {nextMonthDays.map((d) => (
              <button
                key={`next-${d}`}
                type="button"
                onClick={() => handleSelectDay(d, 1)}
                className="h-8 rounded-md text-neutral-500 hover:bg-[#0d1018] hover:text-neutral-300 text-xs transition-colors"
              >
                {d}
              </button>
            ))}
          </div>

          {/* Footer Actions: Today & Clear */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#222738] text-xs">
            <button
              type="button"
              onClick={handlePickToday}
              className={`px-2.5 py-1 rounded-md ${accentBg} ${accentText} hover:brightness-110 font-bold flex items-center gap-1 transition-all`}
            >
              <Sparkles className="w-3 h-3" /> Today
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
