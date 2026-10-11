import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCell, toCsv } from './csv.js';

test('quotes commas, quotes and newlines', () => {
  assert.equal(escapeCell('Khan, Ali'), '"Khan, Ali"');
  assert.equal(escapeCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(escapeCell('line\nbreak'), '"line\nbreak"');
});

test('neutralises formula cells but keeps signed numbers', () => {
  assert.equal(escapeCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(escapeCell('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(escapeCell('-5'), '-5');
  assert.equal(escapeCell('+3.5'), '+3.5');
});

test('builds rows in column order with blanks for missing values', () => {
  const csv = toCsv(
    [
      { key: 'name', label: 'Name' },
      { key: 'marks', label: 'Marks' },
    ],
    [{ name: 'Ali', marks: 85 }, { name: 'Sara' }],
  );
  assert.equal(csv, '\uFEFFName,Marks\r\nAli,85\r\nSara,\r\n');
});
