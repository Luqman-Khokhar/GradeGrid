import { toKey } from '../fieldExtractor.js';
import { cardHeader, cleanCell, cleanText, clusterRows, findFrame, median, parseHeader, rectOn } from './biseCard.js';
import { readCells, readText } from './engine.js';
import { reconcileObtained } from './reconcile.js';

/**
 * Parser for BISE Part-I marks sheets (HSSC / SSC P-I). Part I is a single sitting, so each
 * subject has one marks column: Max, Obtained, Percentile, Grade, Status. Calibrated on the
 * Gujranwala HSSC (P-I) card; column positions are taken from the heading words when OCR reads
 * them, so small layout shifts do not move a mark into the wrong column.
 */
const COLUMNS = [
  { key: 'max', label: 'Max', x: 0.462, kind: 'number', heading: /^Max\.?$/ },
  { key: 'obtained', label: 'Total', x: 0.54, kind: 'number', heading: /^Obtained$/ },
  { key: 'percentile', label: 'Percentile', x: 0.623, kind: 'number', heading: /^(Percentile|Score)$/ },
  { key: 'grade', label: 'Grade', x: 0.705, kind: 'grade', heading: /^(Relative|Grade)$/ },
  // "Result Status" is one centred heading, so the column sits between the two words.
  { key: 'status', label: 'Status', x: 0.823, kind: 'word', heading: /^(Result|Status)$/ },
];
const NAME_LEFT = 0.085; // right of the "Sr." numbers
const CELL_HEIGHT = 0.023;
const DEFAULT_ROW_SPACING = 0.034;
const HEADING_BAND = 0.04; // heading lines sit within this distance above the first row

/** Part-I cards print "(P-I)"; without a readable class, the absence of 11th/12th columns decides. */
export const isPart1Card = (text, words) => {
  const className = parseHeader(text).Class ?? '';
  if (/\(P-I\)/.test(className)) return true;
  if (/\(P-II\)/.test(className)) return false;
  return !words.some((w) => /^(9|10|11|12)th$/i.test(w.text));
};

// Words sorted into reading order: lines top to bottom, words left to right.
const readingOrder = (words, cy, cx) => {
  const lines = [];
  [...words]
    .sort((a, b) => cy(a) - cy(b))
    .forEach((w) => {
      const line = lines.at(-1);
      if (line && cy(w) - cy(line[0]) < 0.008) line.push(w);
      else lines.push([w]);
    });
  return lines.flatMap((line) => line.sort((a, b) => cx(a) - cx(b))).map((w) => w.text);
};

const sumOf = (rows, key) => rows.reduce((acc, row) => acc + (/^\d+$/.test(row.values[key]) ? Number(row.values[key]) : Number.NaN), 0);

/** True when the page read can be trusted as is: statuses read and marks / max add up to the totals. */
export const pageReadAddsUp = (rows, grand) =>
  rows.length > 0 &&
  rows.every((row) => /^(PASS|FAIL|ABSENT)$/.test(row.values.status) && Number(row.values.obtained) <= Number(row.values.max)) &&
  /^\d+$/.test(grand.total ?? '') &&
  /^\d+$/.test(grand.max ?? '') &&
  sumOf(rows, 'obtained') === Number(grand.total) &&
  sumOf(rows, 'max') === Number(grand.max);

export const parsePart1Card = async ({ canvas, words, text }) => {
  const frame = findFrame(words, canvas.width, canvas.height);
  const center = (word) => frame.toPage((word.x0 + word.x1) / 2, (word.y0 + word.y1) / 2);
  const cx = (word) => center(word).x;
  const cy = (word) => center(word).y;
  const toRect = (x, y, width, height) => rectOn(frame, x, y, width, height);

  const headingYs = words.filter((w) => /^(Obtained|Score|Grade)$/.test(w.text)).map(cy);
  const tableTop = headingYs.length ? Math.max(...headingYs) : 0.36;
  const inHeading = (w) => cy(w) <= tableTop + 0.005 && cy(w) > tableTop - HEADING_BAND;
  const columns = COLUMNS.map((column) => {
    const found = words.filter((w) => column.heading.test(w.text) && inHeading(w)).map(cx);
    const x = found.length ? found.reduce((a, b) => a + b, 0) / found.length : column.x;
    return { ...column, x: Math.abs(x - column.x) < 0.06 ? x : column.x };
  });
  const halfWidth = (index) => {
    const gaps = [columns[index - 1], columns[index + 1]].filter(Boolean).map((c) => Math.abs(c.x - columns[index].x));
    return Math.min(0.05, Math.max(0.018, Math.min(...gaps) / 2 - 0.002));
  };

  const totalWord = words.find((w) => /^Total:?$/i.test(w.text) && cy(w) > tableTop);
  const totalY = totalWord ? cy(totalWord) : 1;

  const markerXs = columns.slice(0, 3).map((column) => column.x);
  const markers = words
    .filter(
      (w) =>
        /^\d{1,4}(\.\d+)?$/.test(w.text) &&
        markerXs.some((x) => Math.abs(cx(w) - x) < 0.03) &&
        cy(w) > tableTop + 0.005 &&
        cy(w) < totalY - 0.01,
    )
    .sort((a, b) => cy(a) - cy(b));
  const rowYs = clusterRows(markers, cy);
  if (!rowYs.length) return { fields: [], warnings: ['No subject rows found on this result card.'] };

  const spacing = rowYs.length > 1 ? median(rowYs.slice(1).map((y, i) => y - rowYs[i])) : DEFAULT_ROW_SPACING;
  const maxX = columns[0].x;
  const rows = rowYs.map((y, i) => ({
    y,
    top: i ? (rowYs[i - 1] + y) / 2 : y - spacing / 2,
    bottom: i < rowYs.length - 1 ? (y + rowYs[i + 1]) / 2 : Math.min(y + spacing / 2, totalY - 0.005),
  }));
  const inRow = (row, w) => cy(w) > row.top && cy(w) < row.bottom;

  // Names come from the full-page OCR (it keeps two-line names together); an empty name is re-read.
  for (const [i, row] of rows.entries()) {
    let name = readingOrder(
      words.filter((w) => inRow(row, w) && cx(w) > NAME_LEFT && cx(w) < maxX - 0.04),
      cy,
      cx,
    ).join(' ');
    if (!/\p{L}{2}/u.test(name)) {
      ({ text: name } = await readText(canvas, toRect(NAME_LEFT, row.top, maxX - 0.04 - NAME_LEFT, row.bottom - row.top), { block: true }));
    }
    row.subject = cleanText(name.replace(/[^A-Za-z&().' \n-]/g, ' ')).toUpperCase() || `SUBJECT ${i + 1}`;
  }

  // First pass: values from the full-page OCR words in each cell.
  const wordAt = (index, y, top, bottom) =>
    words
      .filter((w) => cy(w) > top && cy(w) < bottom && Math.abs(cx(w) - columns[index].x) < halfWidth(index))
      .map((w) => w.text)
      .join('');
  const pageRows = rows.map((row) => {
    const values = {};
    columns.forEach((column, c) => {
      values[column.key] = cleanCell(column.kind, wordAt(c, row.y, row.top, row.bottom));
    });
    // LSTM doubles some letters ("C" → "Cc"); a grade is one letter with an optional "+".
    values.grade = values.grade.match(/^[A-F]\+?/)?.[0] ?? values.grade;
    return { subject: row.subject, values };
  });
  const totalBand = [totalY - spacing / 3, totalY + spacing / 3];
  const pageGrand = totalWord
    ? { max: cleanCell('number', wordAt(0, totalY, ...totalBand)), total: cleanCell('number', wordAt(1, totalY, ...totalBand)) }
    : {};

  const cellAt = (index, y) => ({
    kind: columns[index].kind,
    rect: toRect(columns[index].x - halfWidth(index), y - CELL_HEIGHT / 2, halfWidth(index) * 2, CELL_HEIGHT),
  });
  let tableRows = pageRows;
  let grand = pageGrand;
  // Re-reading ~40 cells is most of the time per card, so it only happens when the page words
  // do not prove themselves: every status read and both columns adding up to the card's totals.
  if (!pageReadAddsUp(pageRows, pageGrand)) {
    const cells = rows.flatMap((row) => columns.map((_, index) => cellAt(index, row.y)));
    if (totalWord) cells.push(cellAt(0, totalY), cellAt(1, totalY));
    const read = await readCells(canvas, cells);

    tableRows = rows.map((row, r) => {
      const values = {};
      columns.forEach((column, c) => {
        values[column.key] = cleanCell(column.kind, read[r * columns.length + c].text);
      });
      const page = pageRows[r].values;
      // The cell engine can drop a decimal point ("42.35" → "4235"); a percentile is never above 100.
      if (!(Number(values.percentile) <= 100) && Number(page.percentile) <= 100) values.percentile = page.percentile;
      if (!values.status) values.status = page.status;
      const alt = /^\d+$/.test(page.obtained) ? page.obtained : undefined;
      return { subject: row.subject, values, alt };
    });

    const grandRead = read.slice(rows.length * columns.length);
    grand = totalWord
      ? {
          max: cleanCell('number', grandRead[0].text) || pageGrand.max,
          total: cleanCell('number', grandRead[1].text) || pageGrand.total,
        }
      : {};
  }

  const { rows: checked, warnings } = reconcileObtained(tableRows, grand);

  const fields = [];
  const add = (label, value) => {
    if (value) fields.push({ key: toKey(label), label, value });
  };
  const header = parseHeader(text);
  Object.entries(header).forEach(([label, value]) => {
    if (label !== 'Result') add(label, value);
  });
  checked.forEach((row) => {
    columns.forEach((column) => add(`${row.subject} ${column.label}`, row.values[column.key]));
  });
  add('Grand Total Max', grand.max);
  add('Grand Total', grand.total);
  add('Result', header.Result);

  const card = {
    layout: 'part1',
    ...cardHeader(header, text),
    subjects: checked.map((row) => ({
      name: row.subject,
      max: row.values.max,
      obtained: row.values.obtained,
      percentile: row.values.percentile,
      grade: row.values.grade,
      status: row.values.status,
    })),
    totalMax: grand.max ?? '',
    totalObtained: grand.total ?? '',
  };

  return { fields, warnings, card };
};
