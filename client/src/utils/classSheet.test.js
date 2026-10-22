import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildClassWorkbook } from './classSheet.js';

const subject = (name, max, obtained) => ({ name, max, obtained, status: 'PASS' });

test('writes the class sheet with title rows, headers, typed marks and red fails', async () => {
  const cards = [
    {
      rollNo: '417700',
      name: 'STUDENT A',
      fatherName: '=HYPERLINK("x")',
      className: 'HSSC (P-I)',
      session: 'First Annual, 2026',
      group: 'GENERAL SCIENCE',
      board: 'Gujranwala',
      result: 'Pass',
      subjects: [subject('URDU', '100', '48'), subject('TRANSLATION OF HOLY QURAN', '50', '8')],
      totalMax: '150',
      totalObtained: '56',
    },
  ];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await buildClassWorkbook(cards));
  const sheet = workbook.getWorksheet('General Science');

  assert.equal(sheet.getCell('A1').value, 'BISE Gujranwala - HSSC (P-I) First Annual Examination 2026');
  assert.ok(sheet.model.merges.includes('A1:H1'));
  assert.deepEqual(sheet.getRow(4).values.slice(1), [
    'Roll No',
    'Student Name',
    'Father Name',
    'Urdu (100)',
    'Holy Quran (50)',
    'Total Max Marks',
    'Total Obtained',
    'Overall Status',
  ]);
  assert.equal(sheet.getCell('A5').value, '417700', 'roll no stays text');
  assert.equal(sheet.getCell('C5').value, '=HYPERLINK("x")', 'formula-looking text stays plain text');
  assert.equal(sheet.getCell('C5').formula, undefined);
  assert.equal(sheet.getCell('D5').value, 48);
  assert.notEqual(sheet.getCell('D5').fill?.pattern, 'solid', '48/100 is not highlighted');
  assert.equal(sheet.getCell('E5').fill.fgColor.argb, 'FFFFC7CE', '8/50 is red');
  assert.equal(sheet.getCell('G5').value, 'THQ');
  assert.equal(sheet.getCell('H5').value, 'COMPARTMENT');
  assert.deepEqual(sheet.views[0], { ...sheet.views[0], state: 'frozen', xSplit: 2, ySplit: 4 });
});
