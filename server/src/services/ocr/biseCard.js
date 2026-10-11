import { toKey } from '../fieldExtractor.js';
import { readCells, readText } from './engine.js';
import { PART_KEYS, reconcile } from './reconcile.js';

/**
 * Parser for BISE (Board of Intermediate & Secondary Education) online result cards,
 * calibrated on the Gujranwala HSSC marks sheet. Rows are found from OCR'd words;
 * every mark is then re-read from its own cell, because full-page OCR drops digits.
 *
 * Column positions are fractions of the page width (the card fills the page).
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
const SUBJECT_X = [0.075, 0.27];
const CELL_HEIGHT = 0.023; // fraction of page height
const DEFAULT_ROW_SPACING = 0.033;

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
  const W = canvas.width;
  const H = canvas.height;
  const cx = (word) => (word.x0 + word.x1) / 2 / W;
  const cy = (word) => (word.y0 + word.y1) / 2 / H;

  // Column headings ("Marks Obtained", "Score", "Relative") sit in a band just above the rows.
  const headingYs = words.filter((w) => /^(Obtained|Score|Relative)$/.test(w.text)).map(cy);
  const firstHeading = headingYs.length ? Math.min(...headingYs) : 0.3;
  const tableTop = Math.max(firstHeading, ...headingYs.filter((y) => y - firstHeading < 0.06));
  const totalWord = words.find((w) => /Over/i.test(w.text) && cy(w) > tableTop);
  const totalY = totalWord ? cy(totalWord) : 1;

  // Each subject row has a 2-4 digit "max marks" value in the first marks column.
  const anchors = words
    .filter((w) => /^\d{2,4}$/.test(w.text) && Math.abs(cx(w) - MAX_X) < 0.03 && cy(w) > tableTop && cy(w) < totalY - 0.01)
    .sort((a, b) => cy(a) - cy(b))
    .filter((w, i, list) => i === 0 || cy(w) - cy(list[i - 1]) > 0.01);

  if (!anchors.length) return { fields: [], warnings: ['No subject rows found on this result card.'] };

  const dx = median(anchors.map(cx)) - MAX_X;
  const rowYs = anchors.map(cy);
  const spacing = rowYs.length > 1 ? median(rowYs.slice(1).map((y, i) => y - rowYs[i])) : DEFAULT_ROW_SPACING;

  const rows = rowYs.map((y, i) => {
    const top = i ? (rowYs[i - 1] + y) / 2 : y - spacing / 2;
    const bottom = i < rowYs.length - 1 ? (y + rowYs[i + 1]) / 2 : Math.min(y + spacing / 2, totalY - 0.005);
    return {
      y,
      subjectRect: {
        left: Math.round((SUBJECT_X[0] + dx) * W),
        top: Math.round(top * H),
        width: Math.round((SUBJECT_X[1] - SUBJECT_X[0]) * W),
        height: Math.round((bottom - top) * H),
      },
    };
  });

  // Subject names can wrap onto two lines, so each name is read from its own block.
  for (const [i, row] of rows.entries()) {
    const { text: name } = await readText(canvas, row.subjectRect, { block: true });
    row.subject = cleanText(name.replace(/[^A-Za-z&().' \n-]/g, ' ')).toUpperCase() || `SUBJECT ${i + 1}`;
  }

  const cellAt = (column, index, y) => ({
    kind: column.kind,
    rect: {
      left: Math.round((column.x + dx - halfWidth(index)) * W),
      top: Math.round((y - CELL_HEIGHT / 2) * H),
      width: Math.round(halfWidth(index) * 2 * W),
      height: Math.round(CELL_HEIGHT * H),
    },
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

  Object.entries(parseHeader(text)).forEach(([label, value]) => {
    if (label !== 'Result') add(label, value);
  });
  checked.forEach((row) => {
    COLUMNS.forEach((column) => add(`${row.subject} ${column.label}`, row.values[column.key]));
  });
  add('Grand Total Max', grand.max);
  add('Grand Total', grand.total);
  add('Overall Grade', grand.grade);
  add('Result', parseHeader(text).Result);

  // Parts are blank for subjects without that exam; only flag cells that should have a mark.
  const unreadable = checked.flatMap((row) =>
    [...PART_KEYS, 'total'].filter((key) => /[^0-9-]/.test(row.values[key])).map((key) => `${row.subject} ${key}`),
  );
  if (unreadable.length) warnings.push(`Unclear values: ${unreadable.join(', ')}.`);

  return { fields, warnings };
};
