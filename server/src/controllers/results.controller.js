import { HttpError } from '../middleware/errorHandler.js';
import { extractFromPdf } from '../services/pdfExtractor.js';

// POST /api/results/extract — multipart "files" (PDFs). Returns labelled fields per file.
export const extractResults = async (req, res, next) => {
  try {
    if (!req.files?.length) throw new HttpError(400, 'Upload at least one PDF in the "files" field');

    // One file at a time: OCR is CPU-bound and shares a single worker.
    const results = [];
    for (const file of req.files) {
      try {
        const { pages, source, fields, warnings } = await extractFromPdf(file.buffer);
        results.push({ fileName: file.originalname, pages, source, fields, warnings, ok: true });
      } catch (err) {
        results.push({ fileName: file.originalname, ok: false, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
