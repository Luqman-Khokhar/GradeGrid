import { columnWidths, frozenColumnCount, highlightFor, toCellValue, uniqueHeaders } from './xlsxPlan.js';

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Colours inside the generated file (Excel ARGB), not app UI tokens.
// Table cells carry no font, so styled cells must name one or viewers fall back to a serif default.
const BASE_FONT = { name: 'Calibri', size: 11 };
const HEADER = { fill: 'FF4F46E5', font: 'FFFFFFFF' };
const FILLS = {
  fail: { fill: 'FFFDE2E1', font: 'FF9B1C1C' },
  low: { fill: 'FFFEF3C7', font: 'FF92400E' },
};

/**
 * Build an .xlsx where the data is an Excel table: every header has filter, sort and search,
 * numbers are real numbers, headers and identity columns stay frozen, and weak results are coloured.
 * exceljs is loaded on demand so it never weighs down the first page load.
 */
export const buildWorkbook = async (columns, rows) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GradeGrid';
  workbook.created = new Date();

  const headers = uniqueHeaders(columns);
  const frozen = frozenColumnCount(columns);
  const sheet = workbook.addWorksheet('Results', {
    views: [{ state: 'frozen', xSplit: frozen, ySplit: 1 }],
    pageSetup: {
      orientation: 'landscape',
      printTitlesRow: '1:1',
      ...(frozen && { printTitlesColumn: `A:${String.fromCharCode(64 + frozen)}` }),
    },
  });

  sheet.addTable({
    name: 'Results',
    ref: 'A1',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: headers.map((name) => ({ name, filterButton: true })),
    rows: rows.map((row) => columns.map((column) => toCellValue(row[column.key]))),
  });

  columnWidths(headers, columns, rows).forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // Explicit header style: LibreOffice and some viewers ignore Excel's built-in table themes.
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER.fill } };
    cell.font = { ...BASE_FONT, bold: true, color: { argb: HEADER.font } };
    cell.alignment = { vertical: 'middle' };
  });

  rows.forEach((row, r) => {
    columns.forEach((column, c) => {
      const level = highlightFor(column.key, row[column.key], row);
      if (!level) return;
      const cell = sheet.getCell(r + 2, c + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILLS[level].fill } };
      cell.font = { ...BASE_FONT, color: { argb: FILLS[level].font }, bold: level === 'fail' };
    });
  });

  return workbook.xlsx.writeBuffer();
};
