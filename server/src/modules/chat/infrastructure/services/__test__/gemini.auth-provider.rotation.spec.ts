import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiAuthProvider } from '../gemini.auth-provider.js';
import { GeminiAuthProviderConstants } from '../gemini.auth-provider.constants.js';
import { GeminiErrorResponseMother } from './gemini-error-response.mother.js';

const NO_SERVICE_ACCOUNT_ENV: Record<string, string> = {
  GEMINI_CREDENTIALS_PATH: '',
  GOOGLE_APPLICATION_CREDENTIALS: '',
  GEMINI_LOCATION: '',
};

const stubCleanEnv = (): void => {
  for (const [name, value] of Object.entries(NO_SERVICE_ACCOUNT_ENV)) {
    vi.stubEnv(name, value);
  }
};

describe('GeminiAuthProvider key rotation', () => {
  beforeEach(() => {
    stubCleanEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('round-robins across all configured keys in order', async () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1', 'key-2', 'key-3'] });

    const first = await provider.getPrimaryConfig('gemini-2.5-flash');
    const second = await provider.getPrimaryConfig('gemini-2.5-flash');
    const third = await provider.getPrimaryConfig('gemini-2.5-flash');
    const fourth = await provider.getPrimaryConfig('gemini-2.5-flash');

    expect([first.apiKey, second.apiKey, third.apiKey, fourth.apiKey]).toEqual([
      'key-1',
      'key-2',
      'key-3',
      'key-1',
    ]);
  });

  it('never returns an excluded key within the same request', async () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1', 'key-2', 'key-3'] });
    const excluded = new Set<string>();

    const first = await provider.getPrimaryConfig('gemini-2.5-flash', excluded);
    excluded.add(first.apiKey!);
    const second = await provider.getPrimaryConfig('gemini-2.5-flash', excluded);
    excluded.add(second.apiKey!);
    const third = await provider.getPrimaryConfig('gemini-2.5-flash', excluded);
    excluded.add(third.apiKey!);

    expect(new Set([first.apiKey, second.apiKey, third.apiKey]).size).toBe(3);
    await expect(provider.getPrimaryConfig('gemini-2.5-flash', excluded)).rejects.toThrow();
  });

  it('deduplicates repeated key values', () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['dup-key', 'dup-key', 'other-key'] });
    expect(provider.getApiKeyCount()).toBe(2);
  });

  it('applies a cooldown and switches to the next key on an RPM 429', async () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1', 'key-2'] });
    const before = Date.now();

    provider.handleKeyFailure('key-1', 429, GeminiErrorResponseMother.rateLimitedWithRetryDelay(30));

    const config = await provider.getPrimaryConfig('gemini-2.5-flash');
    expect(config.apiKey).toBe('key-2');

    const metrics = provider.getKeyMetrics();
    const key1Metric = metrics.find((m) => m.key === 'key-1')!;
    expect(key1Metric.status).toBe('RATE_LIMITED');
    expect(key1Metric.coolDownUntil).toBeGreaterThanOrEqual(before + 30_000);
  });

  it('falls back to the default cooldown when Google does not send a retryDelay', () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });
    const before = Date.now();

    provider.handleKeyFailure('key-1', 429, GeminiErrorResponseMother.rateLimitedWithoutRetryDelay());

    const metric = provider.getKeyMetrics()[0]!;
    expect(metric.coolDownUntil).toBeGreaterThanOrEqual(before + GeminiAuthProviderConstants.DEFAULT_COOLDOWN_MS);
  });

  it('revives a RATE_LIMITED key once its cooldown has elapsed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));

    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });
    provider.handleKeyFailure('key-1', 429, GeminiErrorResponseMother.rateLimitedWithRetryDelay(60));

    await expect(provider.getPrimaryConfig('gemini-2.5-flash')).rejects.toThrow();

    vi.setSystemTime(new Date(Date.now() + 61_000));

    const revived = await provider.getPrimaryConfig('gemini-2.5-flash');
    expect(revived.apiKey).toBe('key-1');
    expect(provider.getKeyMetrics()[0]!.status).toBe('ACTIVE');
  });

  it('marks a key QUOTA_EXHAUSTED on a daily-quota 429 and revives it after quotaResetAt', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));

    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });
    provider.handleKeyFailure('key-1', 429, GeminiErrorResponseMother.dailyQuotaExhausted());

    const metricAfterFailure = provider.getKeyMetrics()[0]!;
    expect(metricAfterFailure.status).toBe('QUOTA_EXHAUSTED');
    expect(metricAfterFailure.quotaResetAt).toBeDefined();

    await expect(provider.getPrimaryConfig('gemini-2.5-flash')).rejects.toThrow();

    vi.setSystemTime(new Date(metricAfterFailure.quotaResetAt! + 1_000));

    const revived = await provider.getPrimaryConfig('gemini-2.5-flash');
    expect(revived.apiKey).toBe('key-1');
    expect(provider.getKeyMetrics()[0]!.status).toBe('ACTIVE');
  });

  it('does not invalidate a key on HTTP 400 (unrelated to the key)', async () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });

    provider.handleKeyFailure('key-1', 400, GeminiErrorResponseMother.malformedRequest());

    const metric = provider.getKeyMetrics()[0]!;
    expect(metric.status).toBe('ACTIVE');
    expect(metric.failureCount).toBe(0);

    const config = await provider.getPrimaryConfig('gemini-2.5-flash');
    expect(config.apiKey).toBe('key-1');
  });

  it('invalidates a key only after consecutive 401 strikes reach the threshold', () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });
    const threshold = GeminiAuthProviderConstants.MAX_CONSECUTIVE_FAILURES_BEFORE_INVALID;

    for (let strike = 1; strike < threshold; strike++) {
      provider.handleKeyFailure('key-1', 401, GeminiErrorResponseMother.unauthorized());
      expect(provider.getKeyMetrics()[0]!.status).not.toBe('INVALID');
    }

    provider.handleKeyFailure('key-1', 401, GeminiErrorResponseMother.unauthorized());
    expect(provider.getKeyMetrics()[0]!.status).toBe('INVALID');
    expect(provider.getKeyMetrics()[0]!.failureCount).toBe(threshold);
  });

  it('resets the consecutive failure count on success', () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });

    provider.handleKeyFailure('key-1', 401, GeminiErrorResponseMother.unauthorized());
    provider.handleKeySuccess('key-1');

    expect(provider.getKeyMetrics()[0]!.failureCount).toBe(0);
  });

  it('fails explicitly once every key is INVALID or exhausted with no known reset', async () => {
    const provider = new GeminiAuthProvider({ apiKeys: ['key-1'] });
    const threshold = GeminiAuthProviderConstants.MAX_CONSECUTIVE_FAILURES_BEFORE_INVALID;

    for (let strike = 0; strike < threshold; strike++) {
      provider.handleKeyFailure('key-1', 401, GeminiErrorResponseMother.unauthorized());
    }

    expect(provider.getKeyMetrics()[0]!.status).toBe('INVALID');
    await expect(provider.getPrimaryConfig('gemini-2.5-flash')).rejects.toThrow();
    expect(provider.getEarliestAvailableWaitMs()).toBeNull();
  });
});
