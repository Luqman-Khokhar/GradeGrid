import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWorker, OEM, PSM } from 'tesseract.js';
import { cropRegion } from './renderPage.js';

// Language data is downloaded once per instance and cached in the writable temp dir
// (the deploy bundle is read-only on Vercel). Both workers share the legacy-capable file.
const CACHE_PATH = path.join(os.tmpdir(), 'tesseract');
const WORKER_OPTIONS = { cachePath: CACHE_PATH, legacyLang: true };

// Tesseract skips caching (and re-downloads every start) when the folder is missing.
mkdirSync(CACHE_PATH, { recursive: true });

const WHITELISTS = {
  number: '0123456789.-',
  grade: 'ABCDEF+-',
  status: 'ABCDEFLPRW-',
};

let textWorker = null;
let cellWorker = null;
let queue = Promise.resolve();

// LSTM engine: best for words and layout.
const getTextWorker = () =>
  (textWorker ??= createWorker('eng', OEM.LSTM_ONLY, WORKER_OPTIONS).catch((err) => {
    textWorker = null;
    throw err;
  }));

// Legacy engine: reads this font's digits (notably "1") far more reliably than LSTM.
const getCellWorker = () =>
  (cellWorker ??= createWorker('eng', OEM.TESSERACT_ONLY, { ...WORKER_OPTIONS, legacyCore: true }).catch((err) => {
    cellWorker = null;
    throw err;
  }));

// Workers hold global parameters (whitelist, page mode), so jobs run one at a time.
const exclusive = (job) => {
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
};

/**
 * OCR a region; returns words with page-pixel boxes and the region's text.
 * `block: true` reads a small region as one uniform text block (e.g. a wrapped table cell).
 */
export const readText = (canvas, region, { block = false } = {}) =>
  exclusive(async () => {
    const worker = await getTextWorker();
    await worker.setParameters({
      tessedit_char_whitelist: '',
      tessedit_pageseg_mode: block ? PSM.SINGLE_BLOCK : PSM.AUTO,
    });
    const padding = block ? 16 : 0;
    const image = cropRegion(canvas, region, padding);
    const { data } = await worker.recognize(image, {}, { blocks: true, text: true });
    const words = (data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((paragraph) =>
        paragraph.lines.flatMap((line) =>
          line.words.map((word) => ({
            text: word.text,
            confidence: word.confidence,
            x0: word.bbox.x0 + region.left - padding,
            x1: word.bbox.x1 + region.left - padding,
            y0: word.bbox.y0 + region.top - padding,
            y1: word.bbox.y1 + region.top - padding,
          })),
        ),
      ),
    );
    return { words, text: data.text };
  });

/** Read single-line cells: [{ rect, kind }] → [{ text, confidence }], in the same order. */
export const readCells = (canvas, cells) =>
  exclusive(async () => {
    const worker = await getCellWorker();
    const results = new Array(cells.length);
    for (const kind of Object.keys(WHITELISTS)) {
      const indexes = cells.map((cell, index) => (cell.kind === kind ? index : -1)).filter((index) => index >= 0);
      if (!indexes.length) continue;
      await worker.setParameters({ tessedit_char_whitelist: WHITELISTS[kind], tessedit_pageseg_mode: PSM.SINGLE_LINE });
      for (const index of indexes) {
        const { data } = await worker.recognize(cropRegion(canvas, cells[index].rect));
        results[index] = { text: data.text.trim(), confidence: data.confidence };
      }
    }
    return results;
  });
