import { describe, it, expect, vi } from 'vitest';
import { makeWebEnricher, WEB_ENRICHER_TIMEOUT_MS } from '../web-enricher.js';

const buildOkResponse = (body: string) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => body,
  }) as unknown as Response;

const buildErrorResponse = (status: number) =>
  ({
    ok: false,
    status,
    statusText: 'Error',
  }) as unknown as Response;

describe('WebEnricher', () => {
  it('should fetch the URL and return the body when the response is OK', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(buildOkResponse('<html>Hello</html>'));
    const enricher = makeWebEnricher({ fetchImpl, timeoutMs: 1000, maxRetries: 0 });

    const result = await enricher.fetch('https://example.com');

    expect(result).toBe('<html>Hello</html>');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('should retry on non-2xx responses up to maxRetries', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(buildErrorResponse(500))
      .mockResolvedValueOnce(buildOkResponse('<html>Recovered</html>'));
    const enricher = makeWebEnricher({ fetchImpl, timeoutMs: 1000, maxRetries: 1 });

    const result = await enricher.fetch('https://example.com');

    expect(result).toBe('<html>Recovered</html>');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting retries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(buildErrorResponse(503));
    const enricher = makeWebEnricher({ fetchImpl, timeoutMs: 1000, maxRetries: 1 });

    await expect(enricher.fetch('https://example.com')).rejects.toThrow(/503/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('should abort the fetch when the timeout elapses', async () => {
    vi.useFakeTimers();
    try {
      let aborted = false;
      const fetchImpl = vi.fn().mockImplementation((_url, init: RequestInit | undefined) => {
        init?.signal?.addEventListener('abort', () => {
          aborted = true;
        });
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });
      const enricher = makeWebEnricher({ fetchImpl, timeoutMs: 50, maxRetries: 0 });

      const promise = enricher.fetch('https://example.com/slow');
      vi.advanceTimersByTime(60);
      await expect(promise).rejects.toThrow(/timed out/);
      expect(aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should reject non-http(s) URLs', async () => {
    const fetchImpl = vi.fn();
    const enricher = makeWebEnricher({ fetchImpl, timeoutMs: 1000, maxRetries: 0 });

    await expect(enricher.fetch('ftp://example.com')).rejects.toThrow(/Unsupported protocol/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('should reject malformed URLs', async () => {
    const enricher = makeWebEnricher({ fetchImpl: vi.fn(), timeoutMs: 1000, maxRetries: 0 });
    await expect(enricher.fetch('not a url')).rejects.toThrow(/Invalid URL/);
  });

  it('should expose the default timeout constant', () => {
    expect(WEB_ENRICHER_TIMEOUT_MS).toBe(10_000);
  });
});
