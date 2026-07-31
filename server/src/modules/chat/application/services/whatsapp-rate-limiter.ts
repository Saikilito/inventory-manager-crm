export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
export const DEFAULT_RATE_LIMIT_MAX_MESSAGES = 20;

export interface WhatsappRateLimiterOptions {
  windowMs?: number;
  maxMessages?: number;
}

export interface WhatsappRateLimiter {
  checkAndRecord(whatsappId: string): boolean;
}

export const makeWhatsappRateLimiter = (
  options?: WhatsappRateLimiterOptions
): WhatsappRateLimiter => {
  const windowMs = options?.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxMessages = options?.maxMessages ?? DEFAULT_RATE_LIMIT_MAX_MESSAGES;
  const hitsByWhatsappId = new Map<string, number[]>();

  const pruneOldHits = (whatsappId: string, now: number): number[] => {
    const hits = hitsByWhatsappId.get(whatsappId) ?? [];
    const freshHits = hits.filter((timestamp) => now - timestamp < windowMs);

    if (freshHits.length === 0) {
      hitsByWhatsappId.delete(whatsappId);
    } else {
      hitsByWhatsappId.set(whatsappId, freshHits);
    }

    return freshHits;
  };

  const checkAndRecord = (whatsappId: string): boolean => {
    const now = Date.now();
    const freshHits = pruneOldHits(whatsappId, now);

    if (freshHits.length >= maxMessages) {
      return false;
    }

    freshHits.push(now);
    hitsByWhatsappId.set(whatsappId, freshHits);
    return true;
  };

  return { checkAndRecord };
};
