export interface DiscoveredGeminiApiKey {
  key: string;
  envVarName: string;
}

const GEMINI_API_KEYS_CSV_VAR = 'GEMINI_API_KEYS';
const GEMINI_API_KEY_VAR = 'GEMINI_API_KEY';
const GEMINI_API_KEY_PREFIX = 'GEMINI_API_KEY_';

export const discoverGeminiApiKeysFromEnv = (env: Record<string, string | undefined>): DiscoveredGeminiApiKey[] => {
  const rawKeys: DiscoveredGeminiApiKey[] = [];

  const csv = env[GEMINI_API_KEYS_CSV_VAR];
  if (csv) {
    csv
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((key, idx) => rawKeys.push({ key, envVarName: `${GEMINI_API_KEYS_CSV_VAR}[${idx}]` }));
  }

  const single = env[GEMINI_API_KEY_VAR]?.trim();
  if (single) {
    rawKeys.push({ key: single, envVarName: GEMINI_API_KEY_VAR });
  }

  Object.keys(env)
    .filter((k) => k.startsWith(GEMINI_API_KEY_PREFIX))
    .sort()
    .forEach((envName) => {
      const val = env[envName]?.trim();
      if (val) rawKeys.push({ key: val, envVarName: envName });
    });

  const uniqueByValue = new Map<string, string>();
  for (const item of rawKeys) {
    if (!uniqueByValue.has(item.key)) {
      uniqueByValue.set(item.key, item.envVarName);
    }
  }

  return Array.from(uniqueByValue.entries()).map(([key, envVarName]) => ({ key, envVarName }));
};
