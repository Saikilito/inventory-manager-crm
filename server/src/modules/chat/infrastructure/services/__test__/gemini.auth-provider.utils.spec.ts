import { describe, expect, it } from 'vitest';
import {
  computeNextMidnightInTimeZone,
  isDailyQuotaExhaustedError,
  isInvalidKeyStatus,
  maskApiKey,
  parseRetryDelayMs,
} from '../gemini.auth-provider.utils.js';
import { GeminiErrorResponseMother } from './gemini-error-response.mother.js';

describe('gemini.auth-provider.utils', () => {
  describe('maskApiKey', () => {
    it('masks the middle of a long key', () => {
      expect(maskApiKey('AIzaSyABCDEFGHIJKLMNOP')).toBe('AIzaSy...MNOP');
    });

    it('returns a full mask for short or empty keys', () => {
      expect(maskApiKey('short')).toBe('****');
      expect(maskApiKey('')).toBe('****');
    });
  });

  describe('parseRetryDelayMs', () => {
    it('parses an integer-seconds retryDelay from the RetryInfo details', () => {
      const body = GeminiErrorResponseMother.rateLimitedWithRetryDelay(27);
      expect(parseRetryDelayMs(body)).toBe(27_000);
    });

    it('parses a fractional-seconds retryDelay', () => {
      const body = GeminiErrorResponseMother.rateLimitedWithRetryDelay(1.5);
      expect(parseRetryDelayMs(body)).toBe(1_500);
    });

    it('returns undefined when no RetryInfo details are present', () => {
      const body = GeminiErrorResponseMother.rateLimitedWithoutRetryDelay();
      expect(parseRetryDelayMs(body)).toBeUndefined();
    });

    it('returns undefined for a non-JSON error body', () => {
      expect(parseRetryDelayMs('not json at all')).toBeUndefined();
    });
  });

  describe('isDailyQuotaExhaustedError', () => {
    it('detects a per-day RESOURCE_EXHAUSTED message', () => {
      expect(isDailyQuotaExhaustedError(GeminiErrorResponseMother.dailyQuotaExhausted())).toBe(true);
    });

    it('does not classify a plain RPM rate limit as daily quota exhaustion', () => {
      expect(isDailyQuotaExhaustedError(GeminiErrorResponseMother.rateLimitedWithoutRetryDelay())).toBe(false);
    });
  });

  describe('isInvalidKeyStatus', () => {
    it('treats HTTP 401 as an invalid key regardless of body content', () => {
      expect(isInvalidKeyStatus(401, GeminiErrorResponseMother.unauthorized())).toBe(true);
    });

    it('treats HTTP 403 with an API_KEY_INVALID/PERMISSION_DENIED marker as invalid', () => {
      expect(isInvalidKeyStatus(403, GeminiErrorResponseMother.forbiddenInvalidKey())).toBe(true);
    });

    it('does not treat an unrelated HTTP 403 as an invalid key', () => {
      expect(isInvalidKeyStatus(403, GeminiErrorResponseMother.forbiddenUnrelated())).toBe(false);
    });

    it('does not treat HTTP 400 as an invalid key', () => {
      expect(isInvalidKeyStatus(400, GeminiErrorResponseMother.malformedRequest())).toBe(false);
    });
  });

  describe('computeNextMidnightInTimeZone', () => {
    it('returns the same wall-clock distance to midnight regardless of the reference instant', () => {
      const timeZone = 'America/Los_Angeles';
      const noon = Date.UTC(2026, 0, 15, 20, 0, 0);
      const nextMidnight = computeNextMidnightInTimeZone(timeZone, noon);

      expect(nextMidnight).toBeGreaterThan(noon);
      expect(nextMidnight - noon).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      expect(nextMidnight - noon).toBeGreaterThan(0);
    });

    it('returns a timestamp within the next 24h window', () => {
      const timeZone = 'America/Los_Angeles';
      const now = Date.UTC(2026, 5, 1, 8, 0, 0);
      const nextMidnight = computeNextMidnightInTimeZone(timeZone, now);

      expect(nextMidnight - now).toBeGreaterThan(0);
      expect(nextMidnight - now).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });
});
