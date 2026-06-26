import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { DatabaseConnection, DatabaseType, PostgresConfigSchema } from './types.js';

export const makePostgresConnection = (config: unknown): DatabaseConnection => {
  const parsed = PostgresConfigSchema.parse(config);
  let isConnectedState = false;

  const connect = async (): Promise<Result<void, DatabaseError>> => {
    if (isConnectedState) {
      console.warn('Postgres (stub) already connected 🔥');
      return Result.ok();
    }

    try {
      console.warn(`[OCP Validate] Simulating Postgres connection to ${parsed.connectionString}...`);
      isConnectedState = true;
      console.warn('Connected to Postgres stub successfully! 🔥');
      return Result.ok();
    } catch (err: any) {
      return Result.fail(new DatabaseError(err?.message || 'Postgres stub connection error'));
    }
  };

  const disconnect = async (): Promise<Result<void, DatabaseError>> => {
    if (!isConnectedState) {
      return Result.ok();
    }

    try {
      console.warn('Disconnecting from Postgres stub...');
      isConnectedState = false;
      return Result.ok();
    } catch (err: any) {
      return Result.fail(new DatabaseError(err?.message || 'Postgres stub disconnection error'));
    }
  };

  const isConnected = (): boolean => isConnectedState;

  return {
    type: DatabaseType.POSTGRES,
    connect,
    disconnect,
    isConnected
  };
};
