export const ContextMetricsConstants = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  WEEKLY_WINDOW_DAYS: 7,
  MONTHLY_WINDOW_DAYS: 30,
} as const;

export type ContextMetricsConstants = (typeof ContextMetricsConstants)[keyof typeof ContextMetricsConstants];
