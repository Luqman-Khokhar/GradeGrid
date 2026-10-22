import { buildClassSheets, SUBTITLE } from './classSheetPlan.js';

// Colours inside the generated file (Excel ARGB), matching the school's own marks sheet.
const FONT = 'Calibri';
const TITLE = { fill: 'FF1F4E78', font: 'FFFFFFFF' };
const HEADER = { fill: 'FF2F5597', font: 'FFFFFFFF' };
const FAIL = { fill: 'FFFFC7CE', font: 'FF9C0006' };
const BORDER_COLOR = 'FFD9D9D9';
const HEADER_ROW = 4;

const thin = { style: 'thin', color: { argb: BORDER_COLOR } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };
const CENTER = { horizontal: 'center', vertical: 'middle' };
const solid = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

const columnLetter = (number) => {
  let letters = '';
  for (let n = number; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
};

const widthFor = (header, rows, index) => {
  const longest = rows.reduce((max, row) => Math.max(max, String(row.values[index] ?? '').length), 0);
  // Headers wrap onto two lines, so they need about half their length.
  return Math.min(36, Math.max(10, Math.ceil(header.length / 2) + 4, longest + 3));
};

const writeSheet = (workbook, sheet) => {
  const last = columnLetter(sheet.headers.length);
  const ws = workbook.addWorksheet(sheet.name, {
    views: [{ state: 'frozen', xSplit: 2, ySplit: HEADER_ROW }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}` },
  });

  ws.mergeCells(`A1:${last}1`);
  Object.assign(ws.getCell('A1'), {
    value: sheet.title,
    fill: solid(TITLE.fill),
    font: { name: FONT, size: 16, bold: true, color: { argb: TITLE.font } },
    alignment: CENTER,
  });
  ws.getRow(1).height = 35;

  ws.mergeCells(`A2:${last}2`);
  Object.assign(ws.getCell('A2'), {
    value: SUBTITLE,
    font: { name: FONT, size: 12, italic: true, color: { argb: TITLE.fill } },
    alignment: CENTER,
  });

  const header = ws.getRow(HEADER_ROW);
  header.values = sheet.headers;
  header.height = 30;
  header.eachCell((cell) => {
    cell.fill = solid(HEADER.fill);
    cell.font = { name: FONT, size: 11, bold: true, color: { argb: HEADER.font } };
    cell.alignment = { ...CENTER, wrapText: true };
    cell.border = BORDER;
  });

  sheet.rows.forEach((row, r) => {
    const excelRow = ws.getRow(HEADER_ROW + 1 + r);
    sheet.headers.forEach((_, c) => {
      const cell = excelRow.getCell(c + 1);
      cell.value = row.values[c];
      cell.alignment = CENTER;
      cell.border = BORDER;
      const failed = row.fails.has(c);
      cell.font = { name: FONT, size: 11, bold: failed, ...(failed && { color: { argb: FAIL.font } }) };
      if (failed) cell.fill = solid(FAIL.fill);
    });
  });

  sheet.headers.forEach((text, index) => {
    ws.getColumn(index + 1).width = widthFor(text, sheet.rows, index);
  });
  ws.autoFilter = `A${HEADER_ROW}:${last}${HEADER_ROW + sheet.rows.length}`;
};

/**
 * Build the class sheet .xlsx: the school's marks-sheet layout, one worksheet per group.
 * exceljs is loaded on demand so it never weighs down the first page load.
 */
export const buildClassWorkbook = async (cards) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GradeGrid';
  workbook.created = new Date();
  buildClassSheets(cards).forEach((sheet) => writeSheet(workbook, sheet));
  return workbook.xlsx.writeBuffer();
};
