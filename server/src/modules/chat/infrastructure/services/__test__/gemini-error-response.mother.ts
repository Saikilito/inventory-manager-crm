export const GeminiErrorResponseMother = {
  rateLimitedWithRetryDelay: (retryDelaySeconds: number): string =>
    JSON.stringify({
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: 'Rate limit exceeded for requests per minute',
        details: [
          { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: `${retryDelaySeconds}s` },
        ],
      },
    }),

  rateLimitedWithoutRetryDelay: (): string =>
    JSON.stringify({
      error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Rate limit exceeded for requests per minute' },
    }),

  dailyQuotaExhausted: (): string =>
    JSON.stringify({
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: 'Quota exceeded for quota metric requests per-day and limit',
      },
    }),

  malformedRequest: (): string =>
    JSON.stringify({
      error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Invalid function declaration in tools' },
    }),

  unauthorized: (): string =>
    JSON.stringify({
      error: { code: 401, status: 'UNAUTHENTICATED', message: 'API key not valid' },
    }),

  forbiddenInvalidKey: (): string =>
    JSON.stringify({
      error: { code: 403, status: 'PERMISSION_DENIED', message: 'API_KEY_INVALID' },
    }),

  forbiddenUnrelated: (): string =>
    JSON.stringify({
      error: { code: 403, status: 'FAILED_PRECONDITION', message: 'Consumer not enabled for this billing account' },
    }),
};
