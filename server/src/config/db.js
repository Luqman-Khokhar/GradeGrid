import mongoose from 'mongoose';
import { env } from './env.js';

// Cached across warm serverless invocations so each request doesn't open a new pool.
let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  await connectionPromise;
  return mongoose.connection;
};
