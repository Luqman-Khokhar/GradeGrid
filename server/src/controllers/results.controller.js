import { HttpError } from '../middleware/errorHandler.js';
import { ACCEPTED_TYPES } from '../middleware/upload.js';
import { detectType } from '../services/fileSignature.js';
import { extractFromImage } from '../services/imageExtractor.js';
import { extractFromPdf } from '../services/pdfExtractor.js';

// Errors from parsers can carry internal details; only HttpErrors are written for users.
const userMessage = (err, fileName) => {
  if (err instanceof HttpError) return err.message;
  console.error(`Extraction failed for ${fileName}:`, err);
  return 'This file could not be read. Check that it is a result card PDF or screenshot.';
};

// POST /api/results/extract — multipart "files" (PDFs or screenshots). Returns labelled fields per file.
export const extractResults = async (req, res, next) => {
  try {
    if (!req.files?.length) throw new HttpError(400, 'Upload at least one PDF or image in the "files" field');

    // One file at a time: OCR is CPU-bound and shares a single worker.
    const results = [];
    for (const file of req.files) {
      try {
        // Trust the bytes, not the client's Content-Type.
        const type = detectType(file.buffer);
        if (!ACCEPTED_TYPES.has(type)) throw new HttpError(415, 'This file is not a PDF, PNG, JPG or WebP.');
        const extract = type === 'application/pdf' ? extractFromPdf : extractFromImage;
        const { pages, source, fields, warnings } = await extract(file.buffer);
        results.push({ fileName: file.originalname, pages, source, fields, warnings, ok: true });
      } catch (err) {
        results.push({ fileName: file.originalname, ok: false, error: userMessage(err, file.originalname) });
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
