import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalculateDeliveryFee } from '../../../application/use-cases/calculate-delivery-fee.use-case.js';
import type { CreateClient } from '../../../../client/application/use-cases/create-client.js';
import type { CreateOrder } from '../../../../order/application/use-cases/create-order.js';
import type { LogUnsatisfiedDemand } from '../../../application/use-cases/log-unsatisfied-demand.use-case.js';
import type { IAgentRepository } from '../../../application/repositories/agent.repository.js';
import type { IProductRepository } from '../../../../product/application/repositories/product.repository.js';
import type { IClientRepository } from '../../../../client/application/repositories/client.repository.js';
import { makeGeminiLlmAdapter } from '../gemini.adapter.js';
import { GeminiErrorResponseMother } from './gemini-error-response.mother.js';

const NO_SERVICE_ACCOUNT_ENV: Record<string, string> = {
  GEMINI_CREDENTIALS_PATH: '',
  GOOGLE_APPLICATION_CREDENTIALS: '',
  GEMINI_LOCATION: '',
};

const buildAdapterDependencies = (apiKeys: string[]) => ({
  calculateDeliveryFee: vi.fn() as unknown as CalculateDeliveryFee,
  createClient: vi.fn() as unknown as CreateClient,
  createOrder: vi.fn() as unknown as CreateOrder,
  logUnsatisfiedDemand: vi.fn() as unknown as LogUnsatisfiedDemand,
  agentRepository: {} as unknown as IAgentRepository,
  productRepository: {} as unknown as IProductRepository,
  clientRepository: {} as unknown as IClientRepository,
  config: {
    knowledgeInjectionEnabled: false,
    knowledgeInjectionTopN: 3,
    knowledgeInjectionTokenBudget: 500,
    geminiApiKeys: apiKeys,
  },
});

const okResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

const errorResponse = (status: number, body: string) => ({
  ok: false,
  status,
  text: async () => body,
});

describe('GeminiAdapter key rotation (executeWithKeyRotation)', () => {
  beforeEach(() => {
    for (const [name, value] of Object.entries(NO_SERVICE_ACCOUNT_ENV)) {
      vi.stubEnv(name, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('switches to the next key within the same request after a 429 and sends the key via header, not the URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(429, GeminiErrorResponseMother.rateLimitedWithRetryDelay(1)))
      .mockResolvedValueOnce(okResponse('Resumen compactado de la conversación.'));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = makeGeminiLlmAdapter(buildAdapterDependencies(['key-a', 'key-b']));

    const result = await adapter.compactMemory(null, 'Cliente: hola\nAsistente: hola, en qué te ayudo?');

    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe('Resumen compactado de la conversación.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [firstUrl, firstInit] = fetchMock.mock.calls[0]!;
    const [secondUrl, secondInit] = fetchMock.mock.calls[1]!;

    expect(String(firstUrl)).not.toContain('key-a');
    expect(String(secondUrl)).not.toContain('key-b');
    expect(firstInit.headers['x-goog-api-key']).toBe('key-a');
    expect(secondInit.headers['x-goog-api-key']).toBe('key-b');
  });

  it('stops after a single fetch call on HTTP 400 instead of rotating through every key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(400, GeminiErrorResponseMother.malformedRequest()));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = makeGeminiLlmAdapter(buildAdapterDependencies(['key-a', 'key-b', 'key-c', 'key-d']));

    const result = await adapter.compactMemory(null, 'Cliente: hola');

    expect(result.isFailure).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exposes key metrics without the raw key value', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(429, GeminiErrorResponseMother.rateLimitedWithoutRetryDelay()))
      .mockResolvedValueOnce(okResponse('ok'));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = makeGeminiLlmAdapter(buildAdapterDependencies(['key-a', 'key-b']));
    await adapter.compactMemory(null, 'Cliente: hola');

    const metrics = adapter.getKeyMetrics?.() ?? [];
    expect(metrics).toHaveLength(2);
    for (const metric of metrics) {
      expect(metric).not.toHaveProperty('key');
      expect(metric.maskedKey).toMatch(/\*\*\*\*|\.\.\./);
    }
  });
});
