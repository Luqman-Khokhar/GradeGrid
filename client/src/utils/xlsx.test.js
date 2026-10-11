import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildWorkbook } from './xlsx.js';

test('writes a filterable table with typed values, frozen panes and highlights', async () => {
  const columns = [
    { key: 'roll no', label: 'Roll No' },
    { key: 'name', label: 'Name' },
    { key: 'urdu total', label: 'URDU Total' },
    { key: 'urdu grade', label: 'URDU Grade' },
  ];
  const rows = [
    { 'roll no': '222570', name: 'Ali Khan', 'urdu max': '200', 'urdu total': '110', 'urdu grade': 'D+' },
    { 'roll no': '222571', name: '=cmd|calc', 'urdu max': '200', 'urdu total': '40', 'urdu grade': 'F' },
  ];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await buildWorkbook(columns, rows));
  const sheet = workbook.getWorksheet('Results');

  const table = sheet.getTable('Results');
  assert.ok(table, 'data is an Excel table');
  assert.deepEqual(
    table.table.columns.map((column) => column.filterButton),
    [true, true, true, true],
  );
  assert.deepEqual(sheet.views[0], { ...sheet.views[0], state: 'frozen', xSplit: 2, ySplit: 1 });

  assert.equal(sheet.getCell('A2').value, 222570);
  assert.equal(sheet.getCell('C2').value, 110);
  assert.equal(sheet.getCell('B3').value, '=cmd|calc', 'formula-looking text stays plain text');
  assert.equal(sheet.getCell('B3').formula, undefined);

  assert.equal(sheet.getCell('D2').fill.fgColor.argb, 'FFFEF3C7', 'D+ is amber');
  assert.equal(sheet.getCell('C3').fill.fgColor.argb, 'FFFDE2E1', '40/200 is red');
  assert.equal(sheet.getCell('C2').fill, undefined, '110/200 is not highlighted');
});
