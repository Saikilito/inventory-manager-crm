import { z } from "zod";
import { discoverGeminiApiKeysFromEnv } from "./gemini-api-keys.js";

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  });

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4555),
  database: z.string().min(1).default("mongodb://localhost:27017/CRM-Apollo"),
  secret: z
    .string()
    .min(1)
    .refine((value) => value !== "JWT_SECRET_DEFAULT", {
      message:
        "JWT_SECRET must be set to a strong, non-default value via the environment.",
    }),
  corsOrigin: z.string().min(1).default("http://localhost:3000"),
  knowledgeInjectionEnabled: booleanFromString.default(true),
  knowledgeInjectionTopN: z.coerce.number().int().positive().max(10).default(3),
  knowledgeInjectionTokenBudget: z.coerce.number().int().positive().max(2000).default(500),
  librarianEnabled: booleanFromString.default(true),
  graphUiEnabled: booleanFromString.default(true),
  chatMessageDebounceMs: z.coerce.number().int().positive().default(10000),
  chatMessageMaxWaitMs: z.coerce.number().int().positive().default(60000),
  chatMessageMaxCount: z.coerce.number().int().positive().default(5),
  geminiApiKeys: z.array(z.string().min(1)).default([]),
});

export type IConfig = z.infer<typeof configSchema>;

export const parseConfig = (
  env: Record<string, string | undefined>,
): IConfig => {
  const geminiApiKeys = discoverGeminiApiKeysFromEnv(env).map((entry) => entry.key);

  const result = configSchema.safeParse({
    PORT: env.PORT,
    database: env.MONGODB_URI,
    secret: env.JWT_SECRET,
    corsOrigin: env.CLIENT_URL,
    knowledgeInjectionEnabled: env.KNOWLEDGE_INJECTION_ENABLED,
    knowledgeInjectionTopN: env.KNOWLEDGE_INJECTION_TOP_N,
    knowledgeInjectionTokenBudget: env.KNOWLEDGE_INJECTION_TOKEN_BUDGET,
    librarianEnabled: env.LIBRARIAN_ENABLED,
    graphUiEnabled: env.GRAPH_UI_ENABLED,
    chatMessageDebounceMs: env.CHAT_MESSAGE_DEBOUNCE_MS,
    chatMessageMaxWaitMs: env.CHAT_MESSAGE_MAX_WAIT_MS,
    chatMessageMaxCount: env.CHAT_MESSAGE_MAX_COUNT,
    geminiApiKeys,
  });

  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(
      `❌ Invalid environment variables configuration:\n${errorDetails}`,
    );
  }

  const hasServiceAccountCredentials = Boolean(
    env.GEMINI_CREDENTIALS_PATH || env.GOOGLE_APPLICATION_CREDENTIALS,
  );
  if (result.data.geminiApiKeys.length === 0 && !hasServiceAccountCredentials) {
    console.error(
      "[Config] No Gemini API keys (GEMINI_API_KEY / GEMINI_API_KEYS / GEMINI_API_KEY_*) or service " +
        "account credentials (GEMINI_CREDENTIALS_PATH / GOOGLE_APPLICATION_CREDENTIALS) were found. " +
        "The Gemini-powered WhatsApp sales agent will not be able to authenticate.",
    );
  }

  return result.data;
};

const config = parseConfig(process.env);

export default config;
