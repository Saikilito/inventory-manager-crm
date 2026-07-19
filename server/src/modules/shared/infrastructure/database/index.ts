import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { DatabaseConfig, DatabaseConnection } from './types.js';
import { makeDatabaseConnection } from './database.factory.js';

let activeConnections: DatabaseConnection[] = [];

export const initDatabase = async (configs: DatabaseConfig[]): Promise<Result<void, DatabaseError>> => {
  console.warn(`[DB Facade] Initializing ${configs.length} database connection(s)...`);

  for (const config of configs) {
    try {
      const conn = makeDatabaseConnection(config);
      const connectResult = await conn.connect();
      
      if (connectResult.isFailure) {
        throw connectResult.getError();
      }

      activeConnections.push(conn);
    } catch (err: unknown) {
      const dbErr = err instanceof DatabaseError ? err : new DatabaseError(err instanceof Error ? err.message : 'Database initialization failed');
      console.error(`[DB Facade] Failure encountered during initialization. Initiating atomic rollback...`, dbErr);

      for (let i = activeConnections.length - 1; i >= 0; i--) {
        const activeConn = activeConnections[i];
        console.warn(`[DB Facade Rollback] Tearing down active ${activeConn.type} connection...`);
        await activeConn.disconnect();
      }

      activeConnections = [];
      return Result.fail(dbErr);
    }
  }

  console.warn('[DB Facade] All database connections successfully initialized! 🚀');
  return Result.ok();
};

export const closeDB = async (): Promise<Result<void, DatabaseError>> => {
  console.warn(`[DB Facade] Closing all active connections... count: ${activeConnections.length}`);
  let lastFailure: Result<void, DatabaseError> | null = null;

  for (let i = activeConnections.length - 1; i >= 0; i--) {
    const activeConn = activeConnections[i];
    try {
      console.warn(`[DB Facade Shutdown] Disconnecting active ${activeConn.type} connection...`);
      const res = await activeConn.disconnect();
      if (res.isFailure) {
        lastFailure = res;
      }
    } catch (err: unknown) {
      lastFailure = Result.fail(new DatabaseError(err instanceof Error ? err.message : 'Error closing database during shutdown'));
    }
  }

  activeConnections = [];
  return lastFailure ?? Result.ok();
};

export const getActiveConnections = (): readonly DatabaseConnection[] => {
  return activeConnections;
};

export * from './types.js';
