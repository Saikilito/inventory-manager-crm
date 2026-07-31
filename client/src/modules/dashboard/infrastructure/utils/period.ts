import { match } from "ts-pattern";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const parsePeriodToDateRange = (period?: string | null): DateRange => {
  const now = new Date();
  const p = period?.toUpperCase() || "MONTHLY";

  const { start, end } = match(p)
    .with("DAILY", () => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    })
    .with("WEEKLY", () => {
      const day = now.getDay();
      const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1);
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday,
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday + 6,
        23,
        59,
        59,
        999,
      );
      return { start, end };
    })
    .with("MONTHLY", () => ({
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    }))
    .with("QUARTERLY", () => {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0),
        end: new Date(
          now.getFullYear(),
          (currentQuarter + 1) * 3,
          0,
          23,
          59,
          59,
          999,
        ),
      };
    })
    .with("SEMESTRALLY", () => {
      const isSecondSemester = now.getMonth() >= 6;
      return {
        start: new Date(
          now.getFullYear(),
          isSecondSemester ? 6 : 0,
          1,
          0,
          0,
          0,
          0,
        ),
        end: new Date(
          now.getFullYear(),
          isSecondSemester ? 12 : 6,
          0,
          23,
          59,
          59,
          999,
        ),
      };
    })
    .with("ANNUALLY", () => ({
      start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999),
    }))
    .otherwise(() => ({
      start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    }));

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};
