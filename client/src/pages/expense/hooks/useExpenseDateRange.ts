import { useEffect, useState } from 'react';
import { PeriodType, getPeriodRange, getTodayDateOnly, toStartOfDayISO, toEndOfDayISO } from '@utils/period-utils';

export const useExpenseDateRange = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('day');
  const [referenceDate, setReferenceDate] = useState<string>(getTodayDateOnly());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  useEffect(() => {
    if (isCustomMode) {
      setStartDate(customStart ? toStartOfDayISO(customStart) : '');
      setEndDate(customEnd ? toEndOfDayISO(customEnd) : '');
    } else {
      const range = getPeriodRange(referenceDate, periodType);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }, [periodType, referenceDate, customStart, customEnd, isCustomMode]);

  return {
    periodType,
    setPeriodType,
    referenceDate,
    setReferenceDate,
    startDate,
    endDate,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    isCustomMode,
    setIsCustomMode,
  };
};
