import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// pdf.js loads its worker with a dynamic import that Vercel's file tracer cannot see.
// Importing it statically bundles it, and pdf.js then runs it on the main thread.
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { extractFields } from './fieldExtractor.js';
import { ocrPage } from './ocr/index.js';
import { layoutLines } from './textLayout.js';

globalThis.pdfjsWorker ??= pdfjsWorker;

/**
 * Read a result card PDF into labelled fields.
 * Text PDFs use their text layer (fast, exact). Scanned/image PDFs have none, so the
 * first page is OCR'd instead; each result card is one student on one page.
 */
export const extractFromPdf = async (buffer) => {
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;

  try {
    const pages = [];
    for (let number = 1; number <= doc.numPages; number += 1) {
      const page = await doc.getPage(number);
      const { items } = await page.getTextContent();
      pages.push(layoutLines(items));
      page.cleanup();
    }
    const text = pages.join('\n');
    if (text.trim()) return { pages: doc.numPages, source: 'text', fields: extractFields(text), warnings: [] };

    const { fields, warnings } = await ocrPage(await doc.getPage(1));
    if (doc.numPages > 1) warnings.push(`Only page 1 of ${doc.numPages} was read.`);
    return { pages: doc.numPages, source: 'ocr', fields, warnings };
  } finally {
    await doc.destroy();
  }
};
