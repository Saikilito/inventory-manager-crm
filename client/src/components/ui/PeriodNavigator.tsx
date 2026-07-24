import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DEFAULT_TIMEZONE } from '@shared-domain/shared/value-objects/date-only.vo';
import {
  PeriodType,
  navigatePeriod,
  formatPeriodLabel,
} from '@utils/period-utils';

interface PeriodNavigatorProps {
  periodType: PeriodType;
  referenceDate: string;
  onChangeDate: (date: string) => void;
  timezone?: string;
}

export const PeriodNavigator: React.FC<PeriodNavigatorProps> = ({
  periodType,
  referenceDate,
  onChangeDate,
  timezone = DEFAULT_TIMEZONE,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePrev = () => {
    const newDate = navigatePeriod(referenceDate, periodType, 'prev', timezone);
    onChangeDate(newDate);
  };

  const handleNext = () => {
    const newDate = navigatePeriod(referenceDate, periodType, 'next', timezone);
    onChangeDate(newDate);
  };

  const handleCenterClick = (e: React.MouseEvent) => {
    if (e.target === inputRef.current) return;
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch {
        inputRef.current.focus();
      }
    }
  };

  const label = formatPeriodLabel(referenceDate, periodType, timezone);

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 rounded-2xl shadow-sm w-fit">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400 cursor-pointer"
        title={`Previous ${periodType}`}
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
          value={referenceDate}
          onChange={(e) => {
            if (e.target.value) {
              onChangeDate(e.target.value);
            }
          }}
          className="bg-transparent border-none outline-none focus:ring-0 text-sm p-0 cursor-pointer text-stone-800 dark:text-stone-200 w-[110px]"
        />
        <span className="text-xs text-stone-500 dark:text-stone-400 font-normal shrink-0">
          ({label})
        </span>
      </div>

      <button
        onClick={handleNext}
        className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-all text-stone-600 dark:text-stone-400 cursor-pointer"
        title={`Next ${periodType}`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
