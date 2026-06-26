import mongoose from 'mongoose';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
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

      // ObjectId workaround
      const ObjectId = mongoose.Types.ObjectId as any;
      ObjectId.prototype.valueOf = function () {
        return this.toString();
      };

      return Result.ok();
    } catch (err: any) {
      console.error('Error connecting to MongoDB:', err);
      return Result.fail(new DatabaseError(err?.message || 'Unknown MongoDB connection error'));
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
    } catch (err: any) {
      return Result.fail(new DatabaseError(err?.message || 'Error disconnecting MongoDB'));
    }
  };

  const isConnected = (): boolean => isConnectedState;

  return {
    type: DatabaseType.MONGO,
    connect,
    disconnect,
    isConnected
  };
};
