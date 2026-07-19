export const FinancialDayField = {
  Date: "date",
} as const;

export type FinancialDayField = (typeof FinancialDayField)[keyof typeof FinancialDayField];
