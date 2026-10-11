import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

/**
 * In production, writes must come from the web client: browsers always send Origin on
 * cross-origin POSTs, and CORS has already checked it against CLIENT_ORIGINS. This only
 * turns away casual scripts (they can forge the header); Turnstile and rate limits do the rest.
 */
export const requireOrigin = (req, _res, next) => {
  if (!env.isProd || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.get('origin')) return next(new HttpError(403, 'Requests must come from the GradeGrid app.'));
  next();
};
