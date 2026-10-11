import { HttpError } from '../middleware/errorHandler.js';
import { extractText } from '../services/pdfExtractor.js';

// POST /api/results/extract — multipart "files" (PDFs). Returns raw text per file for now.
export const extractResults = async (req, res, next) => {
  try {
    if (!req.files?.length) throw new HttpError(400, 'Upload at least one PDF in the "files" field');

    const results = await Promise.all(
      req.files.map(async (file) => {
        try {
          const { text, pages } = await extractText(file.buffer);
          return { fileName: file.originalname, pages, text, ok: true };
        } catch (err) {
          return { fileName: file.originalname, ok: false, error: err.message };
        }
      }),
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};
