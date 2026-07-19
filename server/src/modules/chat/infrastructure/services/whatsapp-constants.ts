export const WhatsAppConstants = {
  QR_TIMEOUT_MS: 180000,
  RECONNECT_DELAY_NORMAL_MS: 1000,
  RECONNECT_DELAY_FAST_MS: 500,
  RECONNECT_DELAY_AFTER_TIMEOUT_MS: 5000,
  MAX_SANDBOX_HISTORY_MESSAGES: 20,
  DEFAULT_BAILEYS_SESSION_ID: "default-session",
  BUSINESS_HOURS_START_MINUTES: 10 * 60,
  BUSINESS_HOURS_END_MINUTES: 18 * 60,
} as const;

export type WhatsAppConstants = (typeof WhatsAppConstants)[keyof typeof WhatsAppConstants];
