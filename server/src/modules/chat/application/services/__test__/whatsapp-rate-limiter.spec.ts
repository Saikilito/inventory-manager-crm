import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWhatsappRateLimiter } from '../whatsapp-rate-limiter.js';

describe('WhatsappRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows messages under the threshold', () => {
    const limiter = makeWhatsappRateLimiter({ windowMs: 1000, maxMessages: 3 });

    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(true);
  });

  it('blocks messages once the threshold is exceeded', () => {
    const limiter = makeWhatsappRateLimiter({ windowMs: 1000, maxMessages: 2 });

    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(false);
    expect(limiter.checkAndRecord('+1')).toBe(false);
  });

  it('allows messages again once the window has fully elapsed', () => {
    const limiter = makeWhatsappRateLimiter({ windowMs: 1000, maxMessages: 2 });

    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(false);

    vi.setSystemTime(1001);

    expect(limiter.checkAndRecord('+1')).toBe(true);
  });

  it('tracks independent counters per whatsapp id', () => {
    const limiter = makeWhatsappRateLimiter({ windowMs: 1000, maxMessages: 1 });

    expect(limiter.checkAndRecord('+1')).toBe(true);
    expect(limiter.checkAndRecord('+1')).toBe(false);
    expect(limiter.checkAndRecord('+2')).toBe(true);
  });
});
