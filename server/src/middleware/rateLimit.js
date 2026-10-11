import { connectDB, isDbConfigured } from '../config/db.js';
import { RateLimit } from '../models/RateLimit.js';
import { HttpError } from './errorHandler.js';

/**
 * Fixed-window rate limit shared by every serverless instance (counters live in MongoDB).
 * `cost(req)` lets a request count as more than one unit, e.g. one per uploaded file.
 * Fails open: if the database is unconfigured or unreachable, requests are allowed.
 */
export const rateLimit =
  ({ name, windowMs, max, cost = () => 1 }) =>
  async (req, res, next) => {
    if (!isDbConfigured()) return next();

    const units = cost(req);
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const windowEnd = new Date(windowStart + windowMs);

    let count;
    try {
      await connectDB();
      const doc = await RateLimit.findOneAndUpdate(
        { _id: `${name}:${req.ip}:${windowStart}` },
        { $inc: { count: units }, $setOnInsert: { expiresAt: windowEnd } },
        { upsert: true, new: true },
      ).lean();
      count = doc.count;
    } catch (err) {
      console.error(`Rate limit check skipped: ${err.message}`);
      return next();
    }

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - count)));
    if (count > max) {
      const retryAfter = Math.ceil((windowEnd.getTime() - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      const minutes = Math.ceil(retryAfter / 60);
      return next(new HttpError(429, `Too many requests. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`));
    }
    next();
  };
