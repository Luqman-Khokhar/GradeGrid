import { Router } from 'express';
import { env } from '../config/env.js';
import { getHealth } from '../controllers/health.controller.js';
import { createPreset, deletePreset, listPresets } from '../controllers/presets.controller.js';
import { extractResults } from '../controllers/results.controller.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { uploadPdfs } from '../middleware/upload.js';

const HOUR = 60 * 60 * 1000;

const router = Router();

router.get('/health', getHealth);
router.post(
  '/results/extract',
  uploadPdfs,
  // After upload so each file counts once; OCR is the expensive part, not the upload.
  rateLimit({ name: 'extract', windowMs: HOUR, max: env.filesPerHour, cost: (req) => req.files?.length || 1 }),
  extractResults,
);

const presetWrites = rateLimit({ name: 'presets', windowMs: HOUR, max: 60 });
router.get('/presets', listPresets);
router.post('/presets', presetWrites, createPreset);
router.delete('/presets/:id', presetWrites, deletePreset);

export default router;
