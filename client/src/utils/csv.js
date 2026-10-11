import { downloadBlob } from './download.js';

const NUMBER = /^[-+]?\d+(\.\d+)?$/;
// Spreadsheet apps run cells starting with these as formulas (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

export const escapeCell = (value) => {
  let text = value == null ? '' : String(value);
  if (FORMULA_START.test(text) && !NUMBER.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** columns: [{ key, label }], rows: [{ [key]: value }]. BOM so Excel reads UTF-8. */
export const toCsv = (columns, rows) => {
  const lines = [
    columns.map((column) => escapeCell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
};

export const downloadCsv = (fileName, csv) => downloadBlob(fileName, csv, 'text/csv;charset=utf-8');
