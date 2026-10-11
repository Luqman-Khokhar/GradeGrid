import { Router } from 'express';
import { env } from '../config/env.js';
import { getHealth } from '../controllers/health.controller.js';
import { extractResults } from '../controllers/results.controller.js';
import { rateLimit, rateLimitGuard } from '../middleware/rateLimit.js';
import { requireTurnstile } from '../middleware/turnstile.js';
import { uploadResultCards } from '../middleware/upload.js';

const HOUR = 60 * 60 * 1000;

// In production extraction is refused when the limits cannot be checked (fail closed).
const failOpen = !env.isProd;
const perClient = { name: 'extract', windowMs: HOUR, max: env.filesPerHour, failOpen };
const allClients = { name: 'extract-all', windowMs: HOUR, max: env.globalFilesPerHour, key: () => 'all', failOpen };
const fileCount = (req) => req.files?.length || 1;

const router = Router();

router.get('/health', getHealth);
router.post(
  '/results/extract',
  // Cheap checks first, so rejected clients never get their files buffered.
  rateLimitGuard(perClient),
  rateLimitGuard(allClients),
  requireTurnstile,
  uploadResultCards,
  // After upload so each file counts once; OCR is the expensive part, not the upload.
  rateLimit({ ...perClient, cost: fileCount }),
  rateLimit({ ...allClients, cost: fileCount, headers: false }),
  extractResults,
);

export default router;
