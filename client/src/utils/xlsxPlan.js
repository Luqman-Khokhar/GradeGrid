/**
 * Decides what goes into the Excel export (typed values, highlights, widths, frozen columns)
 * without touching exceljs, so the rules are plain functions that are easy to test.
 */

// Pakistani boards pass at 33%; below 50% is worth a second look.
export const FAIL_PERCENT = 33;
export const LOW_PERCENT = 50;

const NUMBER = /^-?\d+(\.\d+)?$/;
const IDENTITY_KEYS = new Set(['__file', 'roll no', 'name']);
const FAIL_GRADES = new Set(['F', 'U']);
const LOW_GRADES = new Set(['D', 'D+', 'E']);
const FAIL_STATUSES = new Set(['F', 'A', 'ABS', 'FAIL', 'ABSENT']);

/** Numbers become real numbers (sort/sum correctly); IDs with leading zeros or 16+ digits stay text. */
export const toCellValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value);
  if (!NUMBER.test(text)) return text;
  const digits = text.replace(/^-/, '').split('.')[0];
  if ((digits.length > 1 && digits.startsWith('0')) || digits.length > 15) return text;
  return Number(text);
};

const percentOf = (value, max) => {
  const obtained = Number(value);
  const total = Number(max);
  return Number.isFinite(obtained) && Number.isFinite(total) && total > 0 ? (obtained / total) * 100 : null;
};

const byPercent = (percent) => {
  if (percent === null) return null;
  if (percent < FAIL_PERCENT) return 'fail';
  if (percent < LOW_PERCENT) return 'low';
  return null;
};

/** 'fail' | 'low' | null for one cell, using the rest of the row for context (e.g. the subject's max). */
export const highlightFor = (key, value, row) => {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim().toUpperCase();

  if (key === 'result') return text === 'FAIL' ? 'fail' : null;
  if (/ status (11th|12th|practical)$/.test(key)) return FAIL_STATUSES.has(text) ? 'fail' : null;
  if (key.endsWith(' grade') || key === 'overall grade') {
    if (FAIL_GRADES.has(text)) return 'fail';
    return LOW_GRADES.has(text) ? 'low' : null;
  }
  if (key.endsWith(' percentile')) return byPercent(NUMBER.test(text) ? Number(text) : null);
  if (key === 'grand total') return byPercent(percentOf(value, row['grand total max']));
  if (key.endsWith(' total')) {
    const subject = key.slice(0, -' total'.length);
    return byPercent(percentOf(value, row[`${subject} max`]));
  }
  return null;
};

/** Excel tables need unique, non-empty header names. */
export const uniqueHeaders = (columns) => {
  const seen = new Map();
  return columns.map((column) => {
    const base = column.label.trim() || 'Column';
    const count = seen.get(base.toLowerCase()) ?? 0;
    seen.set(base.toLowerCase(), count + 1);
    return count ? `${base} (${count + 1})` : base;
  });
};

/** Character widths that fit the header and the longest value, within sensible bounds. */
export const columnWidths = (headers, columns, rows) =>
  headers.map((header, index) => {
    const longest = rows.reduce((max, row) => Math.max(max, String(row[columns[index].key] ?? '').length), 0);
    return Math.min(40, Math.max(8, header.length + 2, longest + 2));
  });

/** Keep file name / roll no / name visible while scrolling if they lead the selection. */
export const frozenColumnCount = (columns) => {
  let count = 0;
  while (count < Math.min(columns.length, 3) && IDENTITY_KEYS.has(columns[count].key)) count += 1;
  return count;
};
