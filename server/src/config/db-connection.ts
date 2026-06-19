import mongoose from 'mongoose';
import config from './index.js';

let isConnected = false;

const db = () => {
  if (isConnected) {
    console.warn('MongoDB already connected 🔥');
    return mongoose.connection;
  }

  mongoose
    .connect(config.database)
    .then(() => {
      isConnected = true;
      console.warn('Connected to MongoDB! 🔥');

      const ObjectId = mongoose.Types.ObjectId as any;
      ObjectId.prototype.valueOf = function () {
        return this.toString();
      };
    })
    .catch((err) => {
      console.error('Error connecting to MongoDB:', err);
      process.exit(1);
    });

  // Connection event handlers
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.warn('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Error in MongoDB connection:', err);
  });

  return mongoose.connection;
};

// Graceful shutdown
export const closeDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.warn('MongoDB connection closed successfully');
  }
};

export default db;
