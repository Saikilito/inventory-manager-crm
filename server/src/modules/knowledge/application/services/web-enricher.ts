export const WEB_ENRICHER_TIMEOUT_MS = 10_000;

export interface IWebEnricher {
  fetch(url: string): Promise<string>;
}

export const makeWebEnricher = (deps?: {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
}): IWebEnricher => {
  const fetchImpl = deps?.fetchImpl ?? globalThis.fetch;
  const timeoutMs = deps?.timeoutMs ?? WEB_ENRICHER_TIMEOUT_MS;
  const maxRetries = deps?.maxRetries ?? 1;

  return {
    fetch: async (url: string): Promise<string> => {
      if (!fetchImpl) {
        throw new Error('Global fetch is not available in this runtime.');
      }

      const validatedUrl = parseUrl(url);
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetchImpl(validatedUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'KnowledgeBrain/2.0 (enrichment)',
              Accept: 'text/html,application/xhtml+xml',
            },
          });

          clearTimeout(timer);

          if (!response.ok) {
            lastError = new Error(`Enricher fetch failed: ${response.status} ${response.statusText}`);
            continue;
          }

          return await response.text();
        } catch (err) {
          clearTimeout(timer);
          lastError = err instanceof Error ? err : new Error(String(err));
          if (lastError.name === 'AbortError') {
            lastError = new Error(`Enricher fetch timed out after ${timeoutMs}ms`);
          }
        }
      }

      throw lastError ?? new Error('Enricher fetch failed for unknown reason');
    },
  };
};

const parseUrl = (raw: string): string => {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Unsupported protocol: ${url.protocol}`);
    }
    return url.toString();
  } catch (err) {
    throw new Error(`Invalid URL: ${raw} (${err instanceof Error ? err.message : String(err)})`);
  }
};
