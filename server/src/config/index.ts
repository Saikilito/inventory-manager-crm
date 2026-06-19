import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4555),
  database: z.string().min(1).default("mongodb://localhost:27017/CRM-Apollo"),
  secret: z.string().min(1).default("JWT_SECRET_DEFAULT"),
  corsOrigin: z.string().min(1).default("http://localhost:3000"),
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
