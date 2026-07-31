const INVALID_KEY_ERROR_MARKERS = ['API_KEY_INVALID', 'PERMISSION_DENIED', 'SERVICE_DISABLED'] as const;

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
} as const;

const RETRY_DELAY_SECONDS_PATTERN = /^(\d+(?:\.\d+)?)s$/;

export const maskApiKey = (key: string): string => {
  if (!key) return '****';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

export const isDailyQuotaExhaustedError = (errorText: string): boolean => {
  const lower = errorText.toLowerCase();
  return (
    errorText.includes('RESOURCE_EXHAUSTED') &&
    (lower.includes('per-day') || lower.includes('daily') || lower.includes('quota exceeded'))
  );
};

export const isInvalidKeyStatus = (statusCode: number, errorText: string): boolean => {
  if (statusCode === HTTP_STATUS.UNAUTHORIZED) return true;
  if (statusCode === HTTP_STATUS.FORBIDDEN) {
    return INVALID_KEY_ERROR_MARKERS.some((marker) => errorText.includes(marker));
  }
  return false;
};

export const parseRetryDelayMs = (errorText: string): number | undefined => {
  try {
    const parsed = JSON.parse(errorText) as { error?: { details?: Array<{ retryDelay?: string }> } };
    const details = parsed.error?.details;
    if (!Array.isArray(details)) return undefined;

    const withDelay = details.find((detail) => typeof detail.retryDelay === 'string');
    const match = withDelay?.retryDelay ? RETRY_DELAY_SECONDS_PATTERN.exec(withDelay.retryDelay) : null;
    if (!match) return undefined;

    return Math.round(parseFloat(match[1]!) * 1000);
  } catch (err) {
    console.warn('[parseRetryDelayMs] Failed to parse retry delay from error text:', err);
    return undefined;
  }
};

export const computeNextMidnightInTimeZone = (timeZone: string, now: number = Date.now()): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(now));
  const get = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? '0');

  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');

  const msSinceMidnight = ((hour * 60 + minute) * 60 + second) * 1000;
  const msUntilMidnight = 24 * 60 * 60 * 1000 - msSinceMidnight;
  return now + msUntilMidnight;
};
