import { match } from 'ts-pattern';
import { DateOnlyVO, DEFAULT_TIMEZONE } from '@shared-domain/shared/value-objects/date-only.vo';

export type PeriodType = 'day' | 'week' | 'month';

export interface PeriodRange {
  startDate: string;
  endDate: string;
}

export const getTodayDateOnly = (timezone: string = DEFAULT_TIMEZONE): string => {
  return DateOnlyVO.create(undefined, timezone).toString();
};

export const toStartOfDayISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const start = new Date(`${dateStr}T00:00:00`);
  return isNaN(start.getTime()) ? '' : start.toISOString();
};

export const toEndOfDayISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const end = new Date(`${dateStr}T23:59:59.999`);
  return isNaN(end.getTime()) ? '' : end.toISOString();
};

export const toDateOnlyString = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
};

export const getPeriodRange = (
  referenceDate: string,
  periodType: PeriodType,
  _timezone: string = DEFAULT_TIMEZONE
): PeriodRange => {
  const [year, month, day] = referenceDate.split('-').map(Number);
  const refDate = new Date(Date.UTC(year, month - 1, day));

  return match(periodType)
    .with('day', () => ({
      startDate: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString(),
      endDate: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString(),
    }))
    .with('week', () => {
      const dayOfWeek = refDate.getUTCDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(Date.UTC(year, month - 1, day + diffToMonday, 0, 0, 0, 0));
      const sunday = new Date(Date.UTC(year, month - 1, day + diffToMonday + 6, 23, 59, 59, 999));

      return {
        startDate: monday.toISOString(),
        endDate: sunday.toISOString(),
      };
    })
    .with('month', () => {
      const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      return {
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString(),
      };
    })
    .exhaustive();
};

export const navigatePeriod = (
  referenceDate: string,
  periodType: PeriodType,
  direction: 'prev' | 'next',
  _timezone: string = DEFAULT_TIMEZONE
): string => {
  const [year, month, day] = referenceDate.split('-').map(Number);
  const refDate = new Date(Date.UTC(year, month - 1, day));
  const delta = direction === 'next' ? 1 : -1;

  match(periodType)
    .with('day', () => refDate.setUTCDate(refDate.getUTCDate() + delta))
    .with('week', () => refDate.setUTCDate(refDate.getUTCDate() + delta * 7))
    .with('month', () => refDate.setUTCMonth(refDate.getUTCMonth() + delta))
    .exhaustive();

  const y = refDate.getUTCFullYear();
  const m = String(refDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(refDate.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

export const formatPeriodLabel = (
  referenceDate: string,
  periodType: PeriodType,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  const today = getTodayDateOnly(timezone);
  const todayParts = today.split('-').map(Number);
  const [year, month, day] = referenceDate.split('-').map(Number);
  const refDate = new Date(Date.UTC(year, month - 1, day));

  if (periodType === 'day') {
    if (referenceDate === today) return 'Today';
    
    const todayDate = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]));
    const yesterday = new Date(todayDate);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const tomorrow = new Date(todayDate);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    if (refDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (refDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return refDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  if (periodType === 'week') {
    const dayOfWeek = refDate.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(Date.UTC(year, month - 1, day + diffToMonday));

    const todayDayOfWeek = new Date(
      Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2])
    ).getUTCDay();
    const todayDiffToMonday = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
    const thisWeekStart = new Date(
      Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2] + todayDiffToMonday)
    );

    if (weekStart.getTime() === thisWeekStart.getTime()) return 'This Week';

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
    if (weekStart.getTime() === lastWeekStart.getTime()) return 'Last Week';

    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
    if (weekStart.getTime() === nextWeekStart.getTime()) return 'Next Week';

    const weekNumber = getWeekNumber(weekStart);
    return `Week ${weekNumber}, ${weekStart.getUTCFullYear()}`;
  }

  if (periodType === 'month') {
    if (year === todayParts[0] && month === todayParts[1]) return 'This Month';

    const lastMonth = todayParts[1] === 1 ? 12 : todayParts[1] - 1;
    const lastMonthYear = todayParts[1] === 1 ? todayParts[0] - 1 : todayParts[0];
    if (year === lastMonthYear && month === lastMonth) return 'Last Month';

    const nextMonth = todayParts[1] === 12 ? 1 : todayParts[1] + 1;
    const nextMonthYear = todayParts[1] === 12 ? todayParts[0] + 1 : todayParts[0];
    if (year === nextMonthYear && month === nextMonth) return 'Next Month';

    return refDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    });
  }

  return referenceDate;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
