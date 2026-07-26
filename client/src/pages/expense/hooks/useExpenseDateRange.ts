import { useEffect, useState } from 'react';
import { PeriodType, getPeriodRange, getTodayDateOnly } from '@utils/period-utils';

export const useExpenseDateRange = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [referenceDate, setReferenceDate] = useState<string>(getTodayDateOnly());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  useEffect(() => {
    if (isCustomMode) {
      if (customStart) {
        const start = new Date(customStart + 'T00:00:00');
        setStartDate(start.toISOString());
      } else {
        setStartDate('');
      }
      if (customEnd) {
        const end = new Date(customEnd + 'T23:59:59.999');
        setEndDate(end.toISOString());
      } else {
        setEndDate('');
      }
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
