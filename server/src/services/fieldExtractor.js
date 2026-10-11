/**
 * Turn raw result card text into labelled fields without a known layout.
 *
 * Input text comes from pdf-parse with cells separated by tabs. Two patterns are detected:
 *   1. "Label: Value" pairs, several per line allowed ("Name: Ali    Roll No: 101").
 *   2. Subject tables: a header row containing "Subject" followed by rows of cells,
 *      flattened to fields like "Mathematics Obtained" = "85".
 */

const TABLE_HEADER = /^(subjects?|courses?|papers?|subject name)$/i;
const PAIR = /^([\p{L}][\p{L}\p{N} .'’/()#&-]*?)\s*[:：]\s*(.*)$/u;
const MAX_LABEL_LENGTH = 40;
const MAX_LABEL_WORDS = 6;

const clean = (value) => value.replace(/\s+/g, ' ').trim();

export const toKey = (label) =>
  clean(label)
    .toLowerCase()
    .replace(/[.:：]+$/, '');

const isValidLabel = (label) =>
  label.length > 0 && label.length <= MAX_LABEL_LENGTH && label.split(' ').length <= MAX_LABEL_WORDS;

const splitCells = (line) =>
  line
    .split('\t')
    .flatMap((cell) => cell.split(/\s{2,}/))
    .map(clean)
    .filter(Boolean);

const hasLetters = (value) => /\p{L}/u.test(value);

// "Grand Total" + "Total" stays "Grand Total" instead of "Grand Total Total".
const columnLabel = (rowLabel, header) =>
  rowLabel.toLowerCase().endsWith(header.toLowerCase()) ? rowLabel : `${rowLabel} ${header}`;

export const extractFields = (text) => {
  const fields = [];
  const seen = new Map();

  const add = (rawLabel, rawValue) => {
    const label = clean(rawLabel).replace(/[.:：]+$/, '');
    const value = clean(rawValue);
    if (!isValidLabel(label) || !value) return;

    let key = toKey(label);
    let displayLabel = label;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count > 0) {
      key = `${key} (${count + 1})`;
      displayLabel = `${label} (${count + 1})`;
    }
    fields.push({ key, label: displayLabel, value });
  };

  let headers = null;

  for (const line of text.split(/\r?\n/)) {
    const cells = splitCells(line);
    if (!cells.length) continue;

    if (cells.length >= 2 && TABLE_HEADER.test(cells[0])) {
      headers = cells;
      continue;
    }

    if (headers) {
      const isRow = cells.length >= 2 && hasLetters(cells[0]) && !cells.some((cell) => PAIR.test(cell));
      if (isRow && cells.length <= headers.length) {
        // Short rows (e.g. "Grand Total 200 157") fill the leftmost columns; trailing ones are blank.
        cells.slice(1).forEach((value, index) => add(columnLabel(cells[0], headers[index + 1]), value));
        continue;
      }
      headers = null;
    }

    for (let i = 0; i < cells.length; i += 1) {
      const match = cells[i].match(PAIR);
      if (!match) continue;
      let [, label, value] = match;
      // Skip urls ("http://") and times ("at 10:30").
      if (value.startsWith('//') || (/\d$/.test(label) && /^\d/.test(value))) continue;
      // "Name:" followed by the value in the next cell.
      if (!value && cells[i + 1] && !PAIR.test(cells[i + 1])) {
        value = cells[i + 1];
        i += 1;
      }
      add(label, value);
    }
  }

  return fields;
};
