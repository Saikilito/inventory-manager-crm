export interface DateRange {
  startDate: string;
  endDate: string;
}

export const parsePeriodToDateRange = (period?: string | null): DateRange => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  const p = period?.toUpperCase() || "MONTHLY";

  switch (p) {
    case "DAILY": {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "WEEKLY": {
      const day = now.getDay();
      // Monday is 1, Sunday is 0 (convert Sunday to 7)
      const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1);
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday,
        0,
        0,
        0,
        0,
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday + 6,
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "MONTHLY": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "QUARTERLY": {
      const currentQuarter = Math.floor(now.getMonth() / 3); // 0-based
      start = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      end = new Date(
        now.getFullYear(),
        (currentQuarter + 1) * 3,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "SEMESTRALLY": {
      const isSecondSemester = now.getMonth() >= 6;
      start = new Date(
        now.getFullYear(),
        isSecondSemester ? 6 : 0,
        1,
        0,
        0,
        0,
        0,
      );
      end = new Date(
        now.getFullYear(),
        isSecondSemester ? 12 : 6,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "ANNUALLY": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
      break;
    }
    default: {
      // Fallback: Monthly range
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};
