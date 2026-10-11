import { isIPv6 } from 'node:net';
import { connectDB, isDbConfigured } from '../config/db.js';
import { RateLimit } from '../models/RateLimit.js';
import { HttpError } from './errorHandler.js';

/**
 * Rate limit key for a client. IPv4 counts per address; IPv6 per /64, because one
 * subscriber usually gets a whole /64 and could otherwise rotate addresses for free.
 */
export const clientKey = (ip = '') => {
  const v4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4) return v4[1];
  if (!isIPv6(ip)) return ip || 'unknown';

  const [head, tail = ''] = ip.toLowerCase().split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = ip.includes('::') ? 8 - headParts.length - tailParts.length : 0;
  const groups = [...headParts, ...Array(missing).fill('0'), ...tailParts];
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, '')).join(':')}::/64`;
};

const windowFor = (windowMs) => {
  const start = Math.floor(Date.now() / windowMs) * windowMs;
  return { start, end: new Date(start + windowMs) };
};

const docId = (name, key, start) => `${name}:${key}:${start}`;

const tooMany = (res, max, windowEnd) => {
  const retryAfter = Math.ceil((windowEnd.getTime() - Date.now()) / 1000);
  res.set('Retry-After', String(retryAfter));
  const minutes = Math.ceil(retryAfter / 60);
  return new HttpError(429, `Too many requests. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
};

const unavailable = () => new HttpError(503, 'The service is temporarily unavailable. Please try again shortly.');

/**
 * Fixed-window rate limit shared by every serverless instance (counters live in MongoDB).
 * `cost(req)` lets a request count as more than one unit, e.g. one per uploaded file.
 * `key(req)` picks the bucket: the client by default, or a constant for a global cap.
 * `failOpen`: allow requests when the database is unconfigured or unreachable. When false
 * (production extraction), such requests are refused so the limit can never be bypassed.
 */
export const rateLimit =
  ({ name, windowMs, max, cost = () => 1, key = (req) => clientKey(req.ip), failOpen = true, headers = true }) =>
  async (req, res, next) => {
    if (!isDbConfigured()) return failOpen ? next() : next(unavailable());

    const units = cost(req);
    const { start, end } = windowFor(windowMs);

    let count;
    try {
      await connectDB();
      const doc = await RateLimit.findOneAndUpdate(
        { _id: docId(name, key(req), start) },
        { $inc: { count: units }, $setOnInsert: { expiresAt: end } },
        { upsert: true, new: true },
      ).lean();
      count = doc.count;
    } catch (err) {
      console.error(`Rate limit check failed: ${err.message}`);
      return failOpen ? next() : next(unavailable());
    }

    if (headers) {
      res.set('RateLimit-Limit', String(max));
      res.set('RateLimit-Remaining', String(Math.max(0, max - count)));
    }
    if (count > max) return next(tooMany(res, max, end));
    next();
  };

/**
 * Read-only check that runs before the upload is parsed, so a client that is already over
 * its limit is turned away without the server buffering its files first.
 */
export const rateLimitGuard =
  ({ name, windowMs, max, key = (req) => clientKey(req.ip), failOpen = true }) =>
  async (req, res, next) => {
    if (!isDbConfigured()) return failOpen ? next() : next(unavailable());

    const { start, end } = windowFor(windowMs);
    try {
      await connectDB();
      const doc = await RateLimit.findById(docId(name, key(req), start)).lean();
      if (doc && doc.count >= max) return next(tooMany(res, max, end));
    } catch (err) {
      console.error(`Rate limit check failed: ${err.message}`);
      return failOpen ? next() : next(unavailable());
    }
    next();
  };
