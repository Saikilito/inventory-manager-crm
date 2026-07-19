export function getISOWeekKey(date: Date): string;
export function getISOWeekKey(dateStr: string): string;
export function getISOWeekKey(yearStr: string, monthStr: string, dayStr: string): string;
export function getISOWeekKey(yearOrDate: string | Date, monthStr?: string, dayStr?: string): string {
  let date: Date;

  if (monthStr !== undefined && dayStr !== undefined) {
    // Treat yearOrDate as year string, monthStr as month string, dayStr as day string
    const y = parseInt(yearOrDate as string, 10);
    const m = parseInt(monthStr, 10) - 1;
    const d = parseInt(dayStr, 10);
    date = new Date(y, m, d);
  } else if (yearOrDate instanceof Date) {
    date = yearOrDate;
  } else if (typeof yearOrDate === 'string') {
    // yearOrDate is a string, representing a full date or ISO string
    if (yearOrDate.includes('-') && !yearOrDate.includes('T')) {
      const parts = yearOrDate.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(num => parseInt(num, 10));
        date = new Date(y, m - 1, d);
      } else {
        date = new Date(yearOrDate);
      }
    } else {
      date = new Date(yearOrDate);
    }
  } else {
    throw new Error(`Invalid yearOrDate argument type: ${typeof yearOrDate}`);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date provided to getISOWeekKey: ${yearOrDate}`);
  }

  const tempDate = new Date(date.getTime());
  // Thursday in current week decides the year.
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  const weekStr = String(weekNo).padStart(2, '0');
  const weekYear = tempDate.getFullYear();
  return `${weekYear}-W${weekStr}`;
}
