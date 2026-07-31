import { beforeEach, describe, expect, it, vi } from 'vitest';

const { existsSync, readFileSync } = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: { existsSync, readFileSync },
  existsSync,
  readFileSync,
}));

const { getAccessToken, getClient, GoogleAuthMock, client } = vi.hoisted(() => {
  const getAccessToken = vi.fn();
  const client: { getAccessToken: typeof getAccessToken; credentials: { expiry_date?: number } } = {
    getAccessToken,
    credentials: {},
  };
  const getClient = vi.fn().mockResolvedValue(client);
  const GoogleAuthMock = vi.fn().mockImplementation(function () { return { getClient }; });
  return { getAccessToken, getClient, GoogleAuthMock, client };
});

vi.mock('google-auth-library', () => ({ GoogleAuth: GoogleAuthMock }));

import { GeminiAuthProvider } from '../gemini.auth-provider.js';

const SERVICE_ACCOUNT_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'proj-1',
  client_email: 'sa@proj-1.iam.gserviceaccount.com',
});

describe('GeminiAuthProvider service account token caching', () => {
  beforeEach(() => {
    existsSync.mockReset().mockReturnValue(true);
    readFileSync.mockReset().mockReturnValue(SERVICE_ACCOUNT_JSON);
    getClient.mockClear();
    getAccessToken.mockReset().mockResolvedValue({ token: 'token-1' });
    client.credentials = { expiry_date: Date.now() + 60 * 60 * 1000 };
  });

  it('reuses the cached token across repeated calls within the TTL', async () => {
    const provider = new GeminiAuthProvider({ credentialsPath: '/fake/path.json' });

    const first = await provider.getPrimaryConfig('gemini-2.5-flash');
    const second = await provider.getPrimaryConfig('gemini-2.5-flash');

    expect(getClient).toHaveBeenCalledTimes(1);
    expect(first.headers.Authorization).toBe('Bearer token-1');
    expect(second.headers.Authorization).toBe('Bearer token-1');
  });

  it('fetches a fresh token once the cached token is close to expiry', async () => {
    client.credentials = { expiry_date: Date.now() + 1_000 };
    const provider = new GeminiAuthProvider({ credentialsPath: '/fake/path.json' });

    await provider.getPrimaryConfig('gemini-2.5-flash');
    getAccessToken.mockResolvedValue({ token: 'token-2' });
    const second = await provider.getPrimaryConfig('gemini-2.5-flash');

    expect(getClient).toHaveBeenCalledTimes(2);
    expect(second.headers.Authorization).toBe('Bearer token-2');
  });

  it('invalidates the cache when invalidateServiceAccountCache is invoked after a request failure', async () => {
    const provider = new GeminiAuthProvider({ credentialsPath: '/fake/path.json' });

    await provider.getPrimaryConfig('gemini-2.5-flash');
    provider.invalidateServiceAccountCache();
    getAccessToken.mockResolvedValue({ token: 'token-2' });
    const afterInvalidation = await provider.getPrimaryConfig('gemini-2.5-flash');

    expect(getClient).toHaveBeenCalledTimes(2);
    expect(afterInvalidation.headers.Authorization).toBe('Bearer token-2');
  });
});
