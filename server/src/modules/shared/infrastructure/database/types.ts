import { z } from 'zod';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';

export const DatabaseType = {
  MONGO: 'mongo',
  POSTGRES: 'postgres'
} as const;

export type DatabaseType = typeof DatabaseType[keyof typeof DatabaseType];

export const MongoConfigSchema = z.object({
  type: z.literal(DatabaseType.MONGO),
  uri: z.string().min(1)
});

export const PostgresConfigSchema = z.object({
  type: z.literal(DatabaseType.POSTGRES),
  connectionString: z.string().min(1)
});

export const DatabaseConfigSchema = z.discriminatedUnion('type', [
  MongoConfigSchema,
  PostgresConfigSchema
]);

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export interface DatabaseConnection {
  readonly type: DatabaseType;
  readonly connect: () => Promise<Result<void, DatabaseError>>;
  readonly disconnect: () => Promise<Result<void, DatabaseError>>;
  readonly isConnected: () => boolean;
}
