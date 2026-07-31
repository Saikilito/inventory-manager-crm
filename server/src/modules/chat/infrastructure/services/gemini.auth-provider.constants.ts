export const GeminiAuthProviderConstants = {
  SERVICE_ACCOUNT_TOKEN_FALLBACK_TTL_MS: 50 * 60 * 1000,
  SERVICE_ACCOUNT_TOKEN_REFRESH_MARGIN_MS: 60_000,
  DEFAULT_COOLDOWN_MS: 60_000,
  MAX_CONSECUTIVE_FAILURES_BEFORE_INVALID: 3,
  QUOTA_RESET_TIMEZONE: 'America/Los_Angeles',
  API_KEY_HEADER_NAME: 'x-goog-api-key',
} as const;

export type GeminiAuthProviderConstants =
  (typeof GeminiAuthProviderConstants)[keyof typeof GeminiAuthProviderConstants];
