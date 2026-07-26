import mongoose from 'mongoose';
import { TransactionModel } from '../../../../modules/financial/infrastructure/financial.model.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { createDatabaseError, DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { DatabaseConnection, DatabaseType, MongoConfigSchema } from './types.js';

export const makeMongoConnection = (config: unknown): DatabaseConnection => {
  const parsed = MongoConfigSchema.parse(config);
  let isConnectedState = false;

  mongoose.connection.on('disconnected', () => {
    isConnectedState = false;
    console.warn('MongoDB disconnected 🔌');
  });

  mongoose.connection.on('reconnected', () => {
    isConnectedState = true;
    console.warn('MongoDB reconnected 🔌🔥');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Error in MongoDB connection:', err);
  });

  const connect = async (): Promise<Result<void, DatabaseError>> => {
    if (isConnectedState) {
      console.warn('MongoDB already connected 🔥');
      return Result.ok();
    }

    try {
      await mongoose.connect(parsed.uri);
      isConnectedState = true;
      console.warn('Connected to MongoDB successfully via Factory! 🔥');

      (mongoose.Types.ObjectId.prototype as unknown as { valueOf: () => string }).valueOf = function () {
        return this.toString();
      };

      TransactionModel.syncIndexes().catch((syncErr) => {
        console.warn('TransactionModel syncIndexes notice:', syncErr.message);
      });

      return Result.ok();
    } catch (err: unknown) {
      console.error('Error connecting to MongoDB:', err);
      return Result.fail(createDatabaseError(err instanceof Error ? err.message : 'Unknown MongoDB connection error'));
    }
  };

  const disconnect = async (): Promise<Result<void, DatabaseError>> => {
    if (!isConnectedState) {
      return Result.ok();
    }

    try {
      await mongoose.connection.close();
      isConnectedState = false;
      console.warn('MongoDB connection closed successfully via Factory 🔌');
      return Result.ok();
    } catch (err: unknown) {
      return Result.fail(createDatabaseError(err instanceof Error ? err.message : 'Error disconnecting MongoDB'));
    }
  };

  const isConnected = (): boolean => isConnectedState;

  return {
    type: DatabaseType.MONGO,
    connect,
    disconnect,
    isConnected,
  };
};
