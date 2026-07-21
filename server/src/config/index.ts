import { z } from "zod";

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
});

export type IConfig = z.infer<typeof configSchema>;

export const parseConfig = (
  env: Record<string, string | undefined>,
): IConfig => {
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
  });

  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(
      `❌ Invalid environment variables configuration:\n${errorDetails}`,
    );
  }

  return result.data;
};

const config = parseConfig(process.env);

export default config;
