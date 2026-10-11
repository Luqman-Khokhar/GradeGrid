import { toKey } from '../fieldExtractor.js';
import { readCells, readText } from './engine.js';
import { PART_KEYS, reconcile } from './reconcile.js';

/**
 * Parser for BISE (Board of Intermediate & Secondary Education) online result cards,
 * calibrated on the Gujranwala HSSC marks sheet. Rows are found from OCR'd words;
 * every mark is then re-read from its own cell, because full-page OCR drops digits.
 *
 * Positions are fractions of the calibration page (the PDF card: x of its width, y of its
 * height). Screenshots are framed differently, so `findFrame` maps any image onto that page
 * using two labels OCR always reads: "Roll No." and "Registration No.".
 */
const COLUMNS = [
  { key: 'max', label: 'Max', x: 0.296, kind: 'number' },
  { key: '11th', label: '11th', x: 0.35, kind: 'number' },
  { key: '12th', label: '12th', x: 0.398, kind: 'number' },
  { key: 'practical', label: 'Practical', x: 0.463, kind: 'number' },
  { key: 'total', label: 'Total', x: 0.533, kind: 'number' },
  { key: 'percentile', label: 'Percentile', x: 0.608, kind: 'number' },
  { key: 'grade', label: 'Grade', x: 0.695, kind: 'grade' },
  { key: 'status11', label: 'Status 11th', x: 0.753, kind: 'status' },
  { key: 'status12', label: 'Status 12th', x: 0.792, kind: 'status' },
  { key: 'statusPractical', label: 'Status Practical', x: 0.854, kind: 'status' },
];
const MAX_X = COLUMNS[0].x;
// Columns whose numbers mark a subject row; several, so one misread number cannot drop a row.
const ROW_MARKER_X = [COLUMNS[0].x, COLUMNS[4].x, COLUMNS[5].x];
const SUBJECT_X = [0.075, 0.27];
const CELL_HEIGHT = 0.023; // fraction of page height
const DEFAULT_ROW_SPACING = 0.033;
// Vertical range of the pass/fail banner, measured down from the totals row.
const BANNER_BELOW_TOTAL = [0.03, 0.15];
// Where the frame labels sit on the calibration page, and that page's height / width.
const REFERENCE = { rollX: 0.053, registrationX: 0.503, rollY: 0.246, pageRatio: 2546 / 1800 };

/**
 * Map between canvas pixels and calibration-page fractions. Uses the "Roll" and "Registration"
 * label positions for offset and scale (screenshots keep the aspect ratio, so one scale fits both
 * axes); falls back to the whole canvas when the labels are missing.
 */
export const findFrame = (words, width, height) => {
  const roll = words.find((w) => /^Roll$/i.test(w.text));
  const registration = words.find((w) => /^Registration$/i.test(w.text) && roll && w.x0 > roll.x1);
  if (!roll || !registration) {
    return {
      toPage: (x, y) => ({ x: x / width, y: y / height }),
      toPixels: (x, y) => ({ x: x * width, y: y * height }),
      scaleX: width,
      scaleY: height,
    };
  }

  const scaleX = (registration.x0 - roll.x0) / (REFERENCE.registrationX - REFERENCE.rollX);
  const scaleY = scaleX * REFERENCE.pageRatio;
  const rollY = (roll.y0 + roll.y1) / 2;
  return {
    toPage: (x, y) => ({
      x: REFERENCE.rollX + (x - roll.x0) / scaleX,
      y: REFERENCE.rollY + (y - rollY) / scaleY,
    }),
    toPixels: (x, y) => ({
      x: roll.x0 + (x - REFERENCE.rollX) * scaleX,
      y: rollY + (y - REFERENCE.rollY) * scaleY,
    }),
    scaleX,
    scaleY,
  };
};

const HEADER_PATTERNS = [
  ['Roll No', /Roll\s*No\.?\s*:?\s*(\d{3,})/i],
  ['Registration No', /Registration\s*No\.?\s*:?\s*(\d[\d-]+\d)/i],
  ['Name', /(?:^|\n)\s*Name\s*:?\s*(.+?)\s+Father/i],
  ["Father's Name", /Father'?s?\s*Name\s*:?\s*([^\n]+)/i],
  ['College', /College\s*:?\s*([^\n]+)/i],
  ['Session', /Session\s*:?\s*([^\n]+)/i],
  ['Class', /Marks\s*Sheet\s*([^\n]+)/i],
  ['Group', /Group\s*:?\s*([^\n]+)/i],
];

export const isBiseCard = (text) =>
  /Intermediate\s*&?\s*Secondary\s*Education/i.test(text) && /Marks\s*Obtained|Percentile/i.test(text);

const cleanText = (value) =>
  value
    .replace(/[|_~«»©®]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// OCR reads roman numerals in "HSSC (P-II)" as digits or l/I/|.
const fixClass = (value) => value.replace(/\(P\s*-?\s*([1Il|]{1,3})\)/, (_, n) => `(P-${'I'.repeat(n.length)})`);

export const parseHeader = (text) => {
  const header = {};
  HEADER_PATTERNS.forEach(([label, pattern]) => {
    const match = text.match(pattern);
    if (match) header[label] = cleanText(match[1]);
  });
  if (header.Class) header.Class = fixClass(header.Class);
  if (/has\s+passed/i.test(text)) header.Result = 'Pass';
  else if (/\bfail/i.test(text)) header.Result = 'Fail';
  return header;
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

const cleanCell = (kind, text) => {
  if (kind === 'number') {
    const value = text.replace(/[^0-9.-]/g, '');
    return /^-+$/.test(value) ? '-' : value;
  }
  const value = text.toUpperCase().replace(/[^A-Z+-]/g, '');
  return /^-+$/.test(value) ? '-' : value;
};

const halfWidth = (index) => {
  const gaps = [COLUMNS[index - 1], COLUMNS[index + 1]]
    .filter(Boolean)
    .map((column) => Math.abs(column.x - COLUMNS[index].x));
  return Math.max(0.018, Math.min(...gaps) / 2 - 0.002);
};

export const parseBiseCard = async ({ canvas, words, text }) => {
  const frame = findFrame(words, canvas.width, canvas.height);
  const center = (word) => frame.toPage((word.x0 + word.x1) / 2, (word.y0 + word.y1) / 2);
  const cx = (word) => center(word).x;
  const cy = (word) => center(word).y;
  // Page-fraction rectangle → pixel rectangle on this canvas.
  const toRect = (x, y, width, height) => {
    const corner = frame.toPixels(x, y);
    return {
      left: Math.round(corner.x),
      top: Math.round(corner.y),
      width: Math.round(width * frame.scaleX),
      height: Math.round(height * frame.scaleY),
    };
  };

  // Column headings ("Marks Obtained", "Score", "Relative") sit in a band just above the rows.
  const headingYs = words.filter((w) => /^(Obtained|Score|Relative)$/.test(w.text)).map(cy);
  const firstHeading = headingYs.length ? Math.min(...headingYs) : 0.3;
  const tableTop = Math.max(firstHeading, ...headingYs.filter((y) => y - firstHeading < 0.06));
  const totalWord = words.find((w) => /Over/i.test(w.text) && cy(w) > tableTop);
  const totalY = totalWord ? cy(totalWord) : 1;

  // The pass/fail banner sits just below the totals row. Screenshots framed differently can
  // leave it out of the first OCR pass, so read that strip on its own when it is missing.
  let cardText = text;
  if (totalWord && !/has\s+passed|\bfail/i.test(text)) {
    const strip = toRect(0, totalY + BANNER_BELOW_TOTAL[0], 1, BANNER_BELOW_TOTAL[1] - BANNER_BELOW_TOTAL[0]);
    const top = Math.max(0, strip.top);
    const bottom = Math.min(canvas.height, strip.top + strip.height);
    if (bottom > top) {
      cardText += `\n${(await readText(canvas, { left: 0, top, width: canvas.width, height: bottom - top })).text}`;
    }
  }

  // Subject rows carry numbers in the Max, Total and Percentile columns; cluster them by height.
  const markers = words
    .filter(
      (w) =>
        /^\d{1,4}(\.\d+)?$/.test(w.text) &&
        ROW_MARKER_X.some((x) => Math.abs(cx(w) - x) < 0.03) &&
        cy(w) > tableTop &&
        cy(w) < totalY - 0.01,
    )
    .sort((a, b) => cy(a) - cy(b));
  const rowYs = [];
  let cluster = [];
  markers.forEach((w) => {
    if (cluster.length && cy(w) - cy(cluster[cluster.length - 1]) > 0.01) {
      rowYs.push(median(cluster.map(cy)));
      cluster = [];
    }
    cluster.push(w);
  });
  if (cluster.length) rowYs.push(median(cluster.map(cy)));

  if (!rowYs.length) return { fields: [], warnings: ['No subject rows found on this result card.'] };

  const maxWords = markers.filter((w) => Math.abs(cx(w) - MAX_X) < 0.03);
  const dx = maxWords.length ? median(maxWords.map(cx)) - MAX_X : 0;
  const spacing = rowYs.length > 1 ? median(rowYs.slice(1).map((y, i) => y - rowYs[i])) : DEFAULT_ROW_SPACING;

  const rows = rowYs.map((y, i) => {
    const top = i ? (rowYs[i - 1] + y) / 2 : y - spacing / 2;
    const bottom = i < rowYs.length - 1 ? (y + rowYs[i + 1]) / 2 : Math.min(y + spacing / 2, totalY - 0.005);
    return {
      y,
      subjectRect: toRect(SUBJECT_X[0] + dx, top, SUBJECT_X[1] - SUBJECT_X[0], bottom - top),
    };
  });

  // Subject names can wrap onto two lines, so each name is read from its own block.
  for (const [i, row] of rows.entries()) {
    const { text: name } = await readText(canvas, row.subjectRect, { block: true });
    row.subject = cleanText(name.replace(/[^A-Za-z&().' \n-]/g, ' ')).toUpperCase() || `SUBJECT ${i + 1}`;
  }

  const cellAt = (column, index, y) => ({
    kind: column.kind,
    rect: toRect(column.x + dx - halfWidth(index), y - CELL_HEIGHT / 2, halfWidth(index) * 2, CELL_HEIGHT),
  });

  const cells = rows.flatMap((row) => COLUMNS.map((column, index) => cellAt(column, index, row.y)));
  const totalColumns = totalWord ? [0, 4, 6] : [];
  totalColumns.forEach((index) => cells.push(cellAt(COLUMNS[index], index, totalY)));

  const read = await readCells(canvas, cells);

  const tableRows = rows.map((row, r) => {
    const values = {};
    const confidence = {};
    COLUMNS.forEach((column, c) => {
      const cell = read[r * COLUMNS.length + c];
      values[column.key] = cleanCell(column.kind, cell.text);
      confidence[column.key] = cell.confidence;
    });
    return { subject: row.subject, values, confidence };
  });

  const grandRead = read.slice(rows.length * COLUMNS.length);
  const grand = totalWord
    ? {
        max: cleanCell('number', grandRead[0].text),
        total: cleanCell('number', grandRead[1].text),
        grade: cleanCell('grade', grandRead[2].text),
      }
    : {};

  const { rows: checked, warnings } = reconcile(tableRows, grand);

  const fields = [];
  const add = (label, value) => {
    if (value) fields.push({ key: toKey(label), label, value });
  };

  const header = parseHeader(cardText);
  Object.entries(header).forEach(([label, value]) => {
    if (label !== 'Result') add(label, value);
  });
  checked.forEach((row) => {
    COLUMNS.forEach((column) => add(`${row.subject} ${column.label}`, row.values[column.key]));
  });
  add('Grand Total Max', grand.max);
  add('Grand Total', grand.total);
  add('Overall Grade', grand.grade);
  add('Result', header.Result);

  // Parts are blank for subjects without that exam; only flag cells that should have a mark.
  const unreadable = checked.flatMap((row) =>
    [...PART_KEYS, 'total'].filter((key) => /[^0-9-]/.test(row.values[key])).map((key) => `${row.subject} ${key}`),
  );
  if (unreadable.length) warnings.push(`Unclear values: ${unreadable.join(', ')}.`);

  return { fields, warnings };
};
