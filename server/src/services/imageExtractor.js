import { ocrImage } from './ocr/index.js';

/** Read a result card screenshot (PNG/JPG/WebP) into labelled fields via OCR. */
export const extractFromImage = async (buffer) => {
  const { fields, warnings, card } = await ocrImage(buffer);
  return { pages: 1, source: 'ocr', fields, warnings, card };
};
