import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

export const uploadPdfs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 50 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new HttpError(415, `Only PDF files are allowed: ${file.originalname}`));
    }
    cb(null, true);
  },
}).array('files');
