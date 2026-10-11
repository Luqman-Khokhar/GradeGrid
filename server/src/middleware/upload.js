import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

// Result cards arrive as the board's PDF or as a screenshot of it.
export const ACCEPTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

// The client sends at most 2 files per request (see client fileRules.js); a little headroom.
export const MAX_FILES_PER_REQUEST = 5;

export const uploadResultCards = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: MAX_FILES_PER_REQUEST,
    fields: 2,
    fieldSize: 1024,
    fieldNameSize: 50,
    parts: MAX_FILES_PER_REQUEST + 2,
    headerPairs: 50,
  },
  // First filter on the declared type; the controller then checks the actual bytes.
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_TYPES.has(file.mimetype)) {
      return cb(new HttpError(415, `Only PDF, PNG, JPG or WebP files are allowed: ${file.originalname}`));
    }
    cb(null, true);
  },
}).array('files');
