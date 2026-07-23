export const FinancialDayField = {
  Date: 'date',
} as const;

export type FinancialDayField = (typeof FinancialDayField)[keyof typeof FinancialDayField];

export const EXCHANGE_RATE_FALLBACK_DAYS_LIMIT = 30;
