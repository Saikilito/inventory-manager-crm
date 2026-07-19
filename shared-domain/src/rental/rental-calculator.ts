import { DateTime, DateTimeVO } from "../shared/value-objects/date-time.vo.js";

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
}

export const getLocalParts = (date: Date, tz: string): LocalParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const dayOfWeek = weekdayMap[String(partMap.weekday).toLowerCase()] ?? 0;

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10),
    dayOfWeek,
  };
};

export const createDateInTimezone = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date => {
  const tentativeUtc = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );

  const parts = getLocalParts(tentativeUtc, tz);

  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const gotUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  const diffMs = targetUtcMs - gotUtcMs;
  return new Date(tentativeUtc.getTime() + diffMs);
};

export const adjustToBusinessHours = (date: Date, tz: string): Date => {
  let current = new Date(date.getTime());

  // To avoid infinite loops, set a safeguard of 10 iterations
  for (let i = 0; i < 10; i++) {
    const parts = getLocalParts(current, tz);

    // Weekend adjustment (0 = Sunday, 6 = Saturday)
    if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) {
      // Move to Monday 08:00:00
      const daysToAdd = parts.dayOfWeek === 0 ? 1 : 2;
      const nextMondayTemp = new Date(
        current.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
      );
      const nextMondayParts = getLocalParts(nextMondayTemp, tz);
      current = createDateInTimezone(
        nextMondayParts.year,
        nextMondayParts.month,
        nextMondayParts.day,
        8,
        0,
        0,
        tz,
      );
      continue;
    }

    // Weekday adjustment
    if (parts.hour < 8) {
      // Move to 08:00 of the same day
      current = createDateInTimezone(
        parts.year,
        parts.month,
        parts.day,
        8,
        0,
        0,
        tz,
      );
      continue;
    }

    if (parts.hour >= 18) {
      const nextDayTemp = new Date(current.getTime() + 12 * 60 * 60 * 1000);
      const nextDayParts = getLocalParts(nextDayTemp, tz);
      current = createDateInTimezone(
        nextDayParts.year,
        nextDayParts.month,
        nextDayParts.day,
        8,
        0,
        0,
        tz,
      );
      continue;
    }

    break;
  }

  return current;
};

export const RentalCalculator = {
  calculateRentalDueDate: (
    startDateTime: DateTime,
    durationHours: number,
  ): DateTime => {
    const tz =
      typeof process !== "undefined" && process.env && process.env.TIMEZONE
        ? process.env.TIMEZONE
        : "America/Caracas";
    const startDate = new Date(startDateTime);

    let current = adjustToBusinessHours(startDate, tz);
    let durationMinutes = Math.round(durationHours * 60);

    while (durationMinutes > 0) {
      const parts = getLocalParts(current, tz);
      const closingDate = createDateInTimezone(
        parts.year,
        parts.month,
        parts.day,
        18,
        0,
        0,
        tz,
      );

      const remainingMs = closingDate.getTime() - current.getTime();
      const remainingMinutes = Math.floor(remainingMs / (60 * 1000));

      if (durationMinutes <= remainingMinutes) {
        current = new Date(current.getTime() + durationMinutes * 60 * 1000);
        durationMinutes = 0;
      } else {
        durationMinutes -= remainingMinutes;
        // Move past 18:00 of today to force adjustment to next business day start
        const nextTemp = new Date(closingDate.getTime() + 12 * 60 * 60 * 1000);
        current = adjustToBusinessHours(nextTemp, tz);
      }
    }

    return DateTimeVO.create(current);
  },
};
