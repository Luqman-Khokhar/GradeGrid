import { PDFParse } from 'pdf-parse';

/**
 * Extract raw text from a PDF buffer.
 * Field mapping (template-based or generic key/value detection) builds on top of this.
 */
export const extractText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const { text, total } = await parser.getText();
    return { text, pages: total };
  } finally {
    await parser.destroy();
  }
};
