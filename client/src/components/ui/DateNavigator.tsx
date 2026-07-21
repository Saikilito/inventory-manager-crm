import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DateOnlyVO, DEFAULT_TIMEZONE } from '@shared-domain/shared/value-objects/date-only.vo';

interface DateNavigatorProps {
  selectedDate: string; // Format: YYYY-MM-DD
  onChangeDate: (date: string) => void;
  timezone?: string; // defaults to DEFAULT_TIMEZONE ('America/Caracas')
}

export const formatDisplayDateInTimezone = (dateStr: string, timezone: string): string => {
  const parts = dateStr.split('-');
  const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  
  const todayStr = DateOnlyVO.create(undefined, timezone).toString();
  const todayParts = todayStr.split('-');
  const today = new Date(Date.UTC(parseInt(todayParts[0], 10), parseInt(todayParts[1], 10) - 1, parseInt(todayParts[2], 10)));
  
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onChangeDate,
  timezone = DEFAULT_TIMEZONE,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const adjustDate = (days: number) => {
    const parts = selectedDate.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    date.setUTCDate(date.getUTCDate() + days);
    
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    onChangeDate(`${y}-${m}-${d}`);
  };

  const handlePrevDay = () => adjustDate(-1);
  const handleNextDay = () => adjustDate(1);

  const handleCenterClick = (e: React.MouseEvent) => {
    // Avoid re-triggering if the actual input was clicked
    if (e.target === inputRef.current) {
      return;
    }
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (err) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 rounded-2xl shadow-sm w-fit">
      <button
        onClick={handlePrevDay}
        className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400 cursor-pointer"
        title="Previous Day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div
        onClick={handleCenterClick}
        className="flex items-center gap-2 px-3 py-1 font-semibold text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer select-none"
        title="Open calendar picker"
      >
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <input
          ref={inputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              onChangeDate(e.target.value);
            }
          }}
          className="bg-transparent border-none outline-none focus:ring-0 text-sm p-0 cursor-pointer text-stone-800 dark:text-stone-200 w-[110px]"
        />
        <span className="text-xs text-stone-500 dark:text-stone-400 font-normal shrink-0">
          ({formatDisplayDateInTimezone(selectedDate, timezone)})
        </span>
      </div>

      <button
        onClick={handleNextDay}
        className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400 cursor-pointer"
        title="Next Day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
