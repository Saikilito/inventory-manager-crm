import { afterEach, describe, it, expect, vi } from 'vitest';
import { handleWebFetch } from '../web-fetch.handler.js';
import type { ToolDispatcherDependencies } from '../../types.js';

const dummyDependencies = {} as ToolDispatcherDependencies;

describe('handleWebFetch Tool Handler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return error if neither url nor query is provided', async () => {
    const res = await handleWebFetch({}, 'from-test', dummyDependencies);
    expect(res).toHaveProperty('error');
    expect(res.error).toContain('required for webFetch');
  });

  it('should perform web search when query parameter is provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(searchResponse('bujia CR8E motos compatibles')));
    const res = await handleWebFetch({ query: 'bujia CR8E motos compatibles' }, 'from-test', dummyDependencies);
    expect(res).toHaveProperty('content');
    expect(typeof res.content).toBe('string');
    expect(res.content).toContain('bujia CR8E motos compatibles');
  });

  it('should treat a non-HTTP url string as a search query', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(searchResponse('CR8E compatibility')));
    const res = await handleWebFetch({ url: 'para que motos sirven las bujias CR8E' }, 'from-test', dummyDependencies);
    expect(res).toHaveProperty('content');
    expect(typeof res.content).toBe('string');
    expect(res.content).toContain('CR8E');
  });

  it('should fetch direct URL if a valid HTTP URL is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(
      '<html><body><h1>Motos Compatibles</h1><p>Keeway, Yamaha</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    ));
    vi.stubGlobal('fetch', mockFetch);

    const res = await handleWebFetch({ url: 'https://93.184.216.34/cr8e-compatibility' }, 'from-test', dummyDependencies);
    expect(res).toHaveProperty('content');
    expect(res.content).toContain('Motos Compatibles Keeway, Yamaha');

  });

  it('should reject private network targets before fetch', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const res = await handleWebFetch({ url: 'http://127.0.0.1/admin' }, 'from-test', dummyDependencies);

    expect(res.error).toContain('Private network targets');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should validate redirect targets before following them', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: 'http://169.254.169.254/latest/meta-data' },
    }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await handleWebFetch({ url: 'https://93.184.216.34/start' }, 'from-test', dummyDependencies);

    expect(res.error).toContain('Private network targets');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

const searchResponse = (text: string): Response => new Response(
  `<div class="results_links"><a class="result__a" href="https://example.com">${text}</a><a class="result__snippet">Result snippet</a></div>`,
  { status: 200, headers: { 'Content-Type': 'text/html' } },
);
