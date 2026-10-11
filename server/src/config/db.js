import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';
import { env } from './env.js';

// Cached across warm serverless invocations so each request doesn't open a new pool.
let connectionPromise = null;
let lastIssue = null;

export const isDbConfigured = () => Boolean(env.mongoUri);

/** Short, non-secret hint about the last failed connection (shown by /api/health). */
export const getDbIssue = () => lastIssue;

const describeFailure = (err) => {
  if (/auth/i.test(err.message)) return 'authentication failed: check the username and password in MONGODB_URI';
  if (err.name === 'MongoParseError' || /invalid scheme|URI must|querySrv/i.test(err.message)) {
    return 'MONGODB_URI is malformed or the cluster host is wrong';
  }
  return 'cannot reach the cluster: check Atlas Network Access allows 0.0.0.0/0';
};

export const connectDB = async () => {
  if (!env.mongoUri) throw new HttpError(503, 'Database is not configured on this server.');
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 })
      .then((connection) => {
        lastIssue = null;
        return connection;
      })
      .catch((err) => {
        connectionPromise = null;
        lastIssue = describeFailure(err);
        console.error(`MongoDB connection failed (${lastIssue}): ${err.message}`);
        throw new HttpError(503, 'The database is temporarily unavailable. Please try again shortly.');
      });
  }

  await connectionPromise;
  return mongoose.connection;
};
