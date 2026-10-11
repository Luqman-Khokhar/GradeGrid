import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_HEADER = 'cf-turnstile-response';

/**
 * Require a Cloudflare Turnstile token on the request (sent by the client in a header).
 * Stops scripts from calling the API directly. Off when TURNSTILE_SECRET_KEY is not set.
 */
export const requireTurnstile = async (req, _res, next) => {
  if (!env.turnstileSecret) return next();

  const token = req.get(TURNSTILE_HEADER);
  if (!token || token.length > 2048) return next(new HttpError(403, 'Verification is missing. Reload the page and try again.'));

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret: env.turnstileSecret, response: token, remoteip: req.ip ?? '' }),
      signal: AbortSignal.timeout(5000),
    });
    const result = await response.json();
    if (!result.success) {
      return next(new HttpError(403, 'Verification failed. Reload the page and try again.'));
    }
  } catch (err) {
    console.error(`Turnstile verification failed: ${err.message}`);
    return next(new HttpError(503, 'Verification is temporarily unavailable. Please try again shortly.'));
  }
  next();
};
