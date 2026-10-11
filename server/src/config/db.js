import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';
import { env } from './env.js';

// Cached across warm serverless invocations so each request doesn't open a new pool.
let connectionPromise = null;

export const isDbConfigured = () => Boolean(env.mongoUri);

export const connectDB = async () => {
  if (!env.mongoUri) throw new HttpError(503, 'Database is not configured on this server.');
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
