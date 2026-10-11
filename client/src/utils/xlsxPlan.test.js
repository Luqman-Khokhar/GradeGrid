import { test } from 'node:test';
import assert from 'node:assert/strict';
import { columnWidths, frozenColumnCount, highlightFor, toCellValue, uniqueHeaders } from './xlsxPlan.js';

test('types numbers so Excel sorts and sums them, keeps IDs as text', () => {
  assert.equal(toCellValue('146'), 146);
  assert.equal(toCellValue('57.89'), 57.89);
  assert.equal(toCellValue('2-2-6039372-24'), '2-2-6039372-24');
  assert.equal(toCellValue('0123'), '0123');
  assert.equal(toCellValue('1234567890123456'), '1234567890123456');
  assert.equal(toCellValue('-'), '-');
  assert.equal(toCellValue(''), null);
  assert.equal(toCellValue(undefined), null);
});

test('highlights fails and low marks using the subject max from the same row', () => {
  const row = { 'urdu max': '200', 'urdu total': '60', 'english max': '200', 'english total': '90', 'grand total max': '1200' };
  assert.equal(highlightFor('urdu total', '60', row), 'fail'); // 30%
  assert.equal(highlightFor('english total', '90', row), 'low'); // 45%
  assert.equal(highlightFor('english total', '146', row), null);
  assert.equal(highlightFor('grand total', '796', row), null);
  assert.equal(highlightFor('maths total', '10', row), null); // no max known
});

test('highlights grades, statuses, percentile and result', () => {
  assert.equal(highlightFor('urdu grade', 'F', {}), 'fail');
  assert.equal(highlightFor('urdu grade', 'D+', {}), 'low');
  assert.equal(highlightFor('urdu grade', 'B', {}), null);
  assert.equal(highlightFor('overall grade', 'E', {}), 'low');
  assert.equal(highlightFor('urdu status 12th', 'A', {}), 'fail');
  assert.equal(highlightFor('urdu status 12th', 'P', {}), null);
  assert.equal(highlightFor('urdu percentile', '48', {}), 'low');
  assert.equal(highlightFor('urdu percentile', '20', {}), 'fail');
  assert.equal(highlightFor('result', 'Fail', {}), 'fail');
  assert.equal(highlightFor('result', 'Pass', {}), null);
  assert.equal(highlightFor('name', 'F', {}), null);
});

test('makes headers unique and sizes columns to content', () => {
  const columns = [
    { key: 'a', label: 'Marks' },
    { key: 'b', label: 'marks' },
    { key: 'c', label: '' },
  ];
  assert.deepEqual(uniqueHeaders(columns), ['Marks', 'marks (2)', 'Column']);
  assert.deepEqual(columnWidths(['Marks', 'X'], columns, [{ a: '1', b: 'a very long value indeed' }]), [8, 26]);
});

test('freezes leading identity columns only', () => {
  const col = (key) => ({ key, label: key });
  assert.equal(frozenColumnCount([col('__file'), col('roll no'), col('name'), col('urdu total')]), 3);
  assert.equal(frozenColumnCount([col('roll no'), col('urdu total'), col('name')]), 1);
  assert.equal(frozenColumnCount([col('urdu total'), col('name')]), 0);
});
