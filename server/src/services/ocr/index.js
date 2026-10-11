import { extractFields } from '../fieldExtractor.js';
import { layoutLines } from '../textLayout.js';
import { isBiseCard, parseBiseCard } from './biseCard.js';
import { readText } from './engine.js';
import { prepareImage, renderPage } from './renderPage.js';

// Shape OCR words like pdf.js text items so the text-PDF layout code can be reused.
const wordsToText = (words) =>
  layoutLines(
    words.map((word) => {
      const height = word.y1 - word.y0;
      return { str: word.text, transform: [height, 0, 0, height, word.x0, -(word.y0 + word.y1) / 2], width: word.x1 - word.x0 };
    }),
  );

// BISE cards end in boilerplate notes; reading the top part first skips them (saves seconds per card).
const MAIN_PART = 0.8;

/** OCR a prepared canvas: known layouts get their own parser, anything else the generic one. */
const ocrCanvas = async (canvas) => {
  const split = Math.round(canvas.height * MAIN_PART);
  const main = await readText(canvas, { left: 0, top: 0, width: canvas.width, height: split });

  if (isBiseCard(main.text)) return parseBiseCard({ canvas, words: main.words, text: main.text });

  const rest = await readText(canvas, { left: 0, top: split, width: canvas.width, height: canvas.height - split });
  return { fields: extractFields(wordsToText([...main.words, ...rest.words])), warnings: [] };
};

/** OCR one scanned PDF page. */
export const ocrPage = async (page) => ocrCanvas(await renderPage(page));

/** OCR a PNG/JPG/WebP screenshot of a result card. */
export const ocrImage = async (buffer) => ocrCanvas(await prepareImage(buffer));
