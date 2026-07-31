import fs from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { discoverGeminiApiKeysFromEnv } from '../../../../config/gemini-api-keys.js';
import { GeminiAuthProviderConstants } from './gemini.auth-provider.constants.js';
import {
  computeNextMidnightInTimeZone,
  isDailyQuotaExhaustedError,
  isInvalidKeyStatus,
  maskApiKey,
  parseRetryDelayMs,
} from './gemini.auth-provider.utils.js';

export interface IGeminiRequestConfig {
  url: string;
  headers: Record<string, string>;
  authMethod: 'service_account' | 'api_key';
  apiKey?: string;
  maskedKey?: string;
}

export interface IApiKeyStatus {
  key: string;
  maskedKey: string;
  envVarName?: string;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'QUOTA_EXHAUSTED' | 'INVALID';
  coolDownUntil?: number;
  quotaResetAt?: number;
  requestCount: number;
  lastUsedAt?: number;
  failureCount: number;
}

interface CachedServiceAccountConfig {
  config: IGeminiRequestConfig;
  expiresAtMs: number;
}

const SERVICE_ACCOUNT_KEY_IDENTIFIER = 'service_account';

export class GeminiAuthProvider {
  private googleAuth?: GoogleAuth;
  private projectId?: string;
  private location: string;
  private apiKeys: IApiKeyStatus[] = [];
  private currentKeyIndex = 0;
  private cachedServiceAccountConfig?: CachedServiceAccountConfig;

  constructor(options?: { credentialsPath?: string; apiKey?: string; apiKeys?: string[]; location?: string }) {
    const loc = options?.location || process.env.GEMINI_LOCATION;
    this.location = loc && loc !== 'global' ? loc : 'us-central1';

    this.initApiKeys(options);

    const potentialPath =
      options?.credentialsPath ||
      process.env.GEMINI_CREDENTIALS_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (potentialPath && fs.existsSync(potentialPath)) {
      try {
        const raw = fs.readFileSync(potentialPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.type === 'service_account' && parsed.project_id) {
          this.googleAuth = new GoogleAuth({
            keyFilename: potentialPath,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          });
          this.projectId = parsed.project_id;
          console.log(
            `[GeminiAuthProvider] Service Account configured (${parsed.client_email}) for project ${this.projectId}`,
          );
        }
      } catch (err) {
        console.warn('[GeminiAuthProvider] Failed to load service account JSON:', err);
      }
    }
  }

  private initApiKeys(options?: { apiKey?: string; apiKeys?: string[] }): void {
    const rawKeys: Array<{ key: string; envVarName?: string }> = [];

    if (options?.apiKeys && options.apiKeys.length > 0) {
      options.apiKeys.forEach((k, idx) => {
        if (k.trim()) rawKeys.push({ key: k.trim(), envVarName: `options.apiKeys[${idx}]` });
      });
    } else {
      if (options?.apiKey && options.apiKey.trim()) {
        rawKeys.push({ key: options.apiKey.trim(), envVarName: 'options.apiKey' });
      }
      rawKeys.push(...discoverGeminiApiKeysFromEnv(process.env));
    }

    const uniqueMap = new Map<string, string | undefined>();
    for (const item of rawKeys) {
      if (!uniqueMap.has(item.key)) {
        uniqueMap.set(item.key, item.envVarName);
      }
    }

    this.apiKeys = Array.from(uniqueMap.entries()).map(([key, envVarName]) => ({
      key,
      maskedKey: maskApiKey(key),
      envVarName,
      status: 'ACTIVE',
      requestCount: 0,
      failureCount: 0,
    }));

    if (this.apiKeys.length > 0) {
      console.log(
        `[GeminiAuthProvider] Loaded ${this.apiKeys.length} Gemini API key(s) for multi-key rotation:`,
        this.apiKeys.map((k) => `${k.envVarName || 'KEY'}: ${k.maskedKey}`).join(', '),
      );
    }
  }

  hasServiceAccount(): boolean {
    return !!(this.googleAuth && this.projectId);
  }

  hasApiKey(): boolean {
    return this.apiKeys.length > 0;
  }

  getApiKeyCount(): number {
    return this.apiKeys.length;
  }

  async getPrimaryConfig(modelName = 'gemini-2.5-flash', excludedKeys: Set<string> = new Set()): Promise<IGeminiRequestConfig> {
    if (this.hasServiceAccount() && !excludedKeys.has(SERVICE_ACCOUNT_KEY_IDENTIFIER)) {
      try {
        const config = await this.getServiceAccountConfig(modelName);
        if (config) return config;
      } catch (err) {
        console.warn('[GeminiAuthProvider] Service account primary auth failed:', err);
      }
    }

    if (this.hasApiKey()) {
      const selected = this.selectNextAvailableApiKey(excludedKeys);
      if (selected) {
        return this.buildApiKeyConfig(selected, modelName);
      }
    }

    throw new Error(
      'No valid active Gemini authentication key available (all keys are either rate-limited, exhausted, or invalid)',
    );
  }

  public invalidateServiceAccountCache(): void {
    this.cachedServiceAccountConfig = undefined;
  }

  public getEarliestAvailableWaitMs(excludedKeys: Set<string> = new Set()): number | null {
    const now = Date.now();
    const resetTimestamps = this.apiKeys
      .filter((k) => !excludedKeys.has(k.key))
      .map((k) => {
        if (k.status === 'RATE_LIMITED' && k.coolDownUntil) return k.coolDownUntil;
        if (k.status === 'QUOTA_EXHAUSTED' && k.quotaResetAt) return k.quotaResetAt;
        return undefined;
      })
      .filter((resetAt): resetAt is number => typeof resetAt === 'number' && resetAt > now);

    if (resetTimestamps.length === 0) return null;
    return Math.min(...resetTimestamps) - now;
  }

  private selectNextAvailableApiKey(excludedKeys: Set<string>): IApiKeyStatus | null {
    if (this.apiKeys.length === 0) return null;

    const now = Date.now();

    for (const keyObj of this.apiKeys) {
      if (keyObj.status === 'RATE_LIMITED' && keyObj.coolDownUntil && now >= keyObj.coolDownUntil) {
        keyObj.status = 'ACTIVE';
        keyObj.coolDownUntil = undefined;
        console.log(`[GeminiAuthProvider] Cooldown expired for key ${keyObj.maskedKey}. Resetting status to ACTIVE.`);
      }
      if (keyObj.status === 'QUOTA_EXHAUSTED' && keyObj.quotaResetAt && now >= keyObj.quotaResetAt) {
        keyObj.status = 'ACTIVE';
        keyObj.quotaResetAt = undefined;
        console.log(`[GeminiAuthProvider] Daily quota reset for key ${keyObj.maskedKey}. Resetting status to ACTIVE.`);
      }
    }

    const total = this.apiKeys.length;
    for (let i = 0; i < total; i++) {
      const idx = (this.currentKeyIndex + i) % total;
      const candidate = this.apiKeys[idx]!;

      if (candidate.status === 'ACTIVE' && !excludedKeys.has(candidate.key)) {
        this.currentKeyIndex = (idx + 1) % total;
        candidate.requestCount++;
        candidate.lastUsedAt = now;
        return candidate;
      }
    }

    return null;
  }

  public handleKeyFailure(keyOrMethod: string, statusCode: number, errorText: string): void {
    if (keyOrMethod === SERVICE_ACCOUNT_KEY_IDENTIFIER) {
      console.error(`[GeminiAuthProvider][ERROR] Service Account authentication request failed (HTTP ${statusCode}): ${errorText}`);
      return;
    }

    const keyObj = this.apiKeys.find((k) => k.key === keyOrMethod || k.maskedKey === keyOrMethod);
    if (!keyObj) {
      console.error(`[GeminiAuthProvider][ERROR] API key failure reported for unknown key (HTTP ${statusCode}): ${errorText}`);
      return;
    }

    if (statusCode === 400) {
      console.warn(
        `[GeminiAuthProvider][WARN] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) request rejected as malformed (HTTP 400, INVALID_ARGUMENT). Not counted against the key's health. Details: ${errorText}`,
      );
      return;
    }

    keyObj.failureCount++;
    const now = Date.now();

    if (statusCode === 429) {
      this.handleRateLimitFailure(keyObj, errorText, now);
      return;
    }

    if (isInvalidKeyStatus(statusCode, errorText)) {
      this.handleInvalidKeyCandidate(keyObj, statusCode, errorText);
      return;
    }

    if (statusCode >= 500) {
      console.error(
        `[GeminiAuthProvider][ANALYTICS-FAIL] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) Google Cloud service error (HTTP ${statusCode}). Details: ${errorText}`,
      );
      return;
    }

    console.error(
      `[GeminiAuthProvider][ANALYTICS-FAIL] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) failed (HTTP ${statusCode}). Details: ${errorText}`,
    );
  }

  public handleKeySuccess(keyOrMethod: string): void {
    if (keyOrMethod === SERVICE_ACCOUNT_KEY_IDENTIFIER) return;
    const keyObj = this.apiKeys.find((k) => k.key === keyOrMethod || k.maskedKey === keyOrMethod);
    if (keyObj) keyObj.failureCount = 0;
  }

  private handleRateLimitFailure(keyObj: IApiKeyStatus, errorText: string, now: number): void {
    if (isDailyQuotaExhaustedError(errorText)) {
      keyObj.status = 'QUOTA_EXHAUSTED';
      keyObj.quotaResetAt = computeNextMidnightInTimeZone(GeminiAuthProviderConstants.QUOTA_RESET_TIMEZONE, now);
      console.error(
        `[GeminiAuthProvider][ANALYTICS-FAIL] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) exhausted its daily quota (HTTP 429). Status: QUOTA_EXHAUSTED until ${new Date(keyObj.quotaResetAt).toISOString()}. Details: ${errorText}`,
      );
      return;
    }

    const retryDelayMs = parseRetryDelayMs(errorText) ?? GeminiAuthProviderConstants.DEFAULT_COOLDOWN_MS;
    keyObj.status = 'RATE_LIMITED';
    keyObj.coolDownUntil = now + retryDelayMs;
    console.error(
      `[GeminiAuthProvider][ANALYTICS-FAIL] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) hit its rate limit (HTTP 429). Status: RATE_LIMITED for ${Math.round(retryDelayMs / 1000)}s. Details: ${errorText}`,
    );
  }

  private handleInvalidKeyCandidate(keyObj: IApiKeyStatus, statusCode: number, errorText: string): void {
    if (keyObj.failureCount >= GeminiAuthProviderConstants.MAX_CONSECUTIVE_FAILURES_BEFORE_INVALID) {
      keyObj.status = 'INVALID';
      console.error(
        `[GeminiAuthProvider][ANALYTICS-FAIL] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) rejected by Google ${keyObj.failureCount} times in a row (HTTP ${statusCode}). Status: INVALID. Details: ${errorText}`,
      );
      return;
    }

    console.warn(
      `[GeminiAuthProvider][WARN] Key ${keyObj.maskedKey} (${keyObj.envVarName || 'KEY'}) rejected by Google (HTTP ${statusCode}), strike ${keyObj.failureCount}/${GeminiAuthProviderConstants.MAX_CONSECUTIVE_FAILURES_BEFORE_INVALID}. Details: ${errorText}`,
    );
  }

  public getKeyMetrics(): IApiKeyStatus[] {
    return this.apiKeys.map((k) => ({ ...k }));
  }

  private async getServiceAccountConfig(modelName: string): Promise<IGeminiRequestConfig | null> {
    if (!this.googleAuth || !this.projectId) return null;

    if (
      this.cachedServiceAccountConfig &&
      Date.now() < this.cachedServiceAccountConfig.expiresAtMs - GeminiAuthProviderConstants.SERVICE_ACCOUNT_TOKEN_REFRESH_MARGIN_MS
    ) {
      return this.cachedServiceAccountConfig.config;
    }

    const client = await this.googleAuth.getClient();
    const tokenRes = await client.getAccessToken();

    if (!tokenRes.token) return null;

    const expiresAtMs =
      client.credentials?.expiry_date ?? Date.now() + GeminiAuthProviderConstants.SERVICE_ACCOUNT_TOKEN_FALLBACK_TTL_MS;

    const config: IGeminiRequestConfig = {
      url: `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${modelName}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRes.token}`,
      },
      authMethod: 'service_account',
    };

    this.cachedServiceAccountConfig = { config, expiresAtMs };
    return config;
  }

  private buildApiKeyConfig(keyObj: IApiKeyStatus, modelName: string): IGeminiRequestConfig {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        [GeminiAuthProviderConstants.API_KEY_HEADER_NAME]: keyObj.key,
      },
      authMethod: 'api_key',
      apiKey: keyObj.key,
      maskedKey: keyObj.maskedKey,
    };
  }
}
