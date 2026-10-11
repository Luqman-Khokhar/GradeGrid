import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

// Result cards arrive as the board's PDF or as a screenshot of it.
export const ACCEPTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

export const uploadResultCards = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 50 },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_TYPES.has(file.mimetype)) {
      return cb(new HttpError(415, `Only PDF, PNG, JPG or WebP files are allowed: ${file.originalname}`));
    }
    cb(null, true);
  },
}).array('files');
