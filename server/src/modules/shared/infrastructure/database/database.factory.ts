import { match } from "ts-pattern";
import {
  DatabaseConnection,
  DatabaseType,
  DatabaseConfigSchema,
} from "./types.js";
import { makeMongoConnection } from "./mongo-connection.js";
import { makePostgresConnection } from "./postgres-connection.js";

export const makeDatabaseConnection = (config: unknown): DatabaseConnection => {
  const parsedConfig = DatabaseConfigSchema.parse(config);

  return match(parsedConfig)
    .with({ type: DatabaseType.MONGO }, (cfg) => makeMongoConnection(cfg))
    .with({ type: DatabaseType.POSTGRES }, (cfg) => makePostgresConnection(cfg))
    .exhaustive();
};
