import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { layoutLines } from './textLayout.js';

/**
 * Extract positioned text from a PDF buffer: one line per row, cells separated by tabs.
 * Field mapping (template-based or generic key/value detection) builds on top of this.
 */
export const extractText = async (buffer) => {
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
    return { text: pages.join('\n'), pages: doc.numPages };
  } finally {
    await doc.destroy();
  }
};
