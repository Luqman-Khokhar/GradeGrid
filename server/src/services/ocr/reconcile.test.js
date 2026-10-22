import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, reconcileObtained } from './reconcile.js';

const row = (subject, max, y11, y12, practical, total, confidence = {}) => ({
  subject,
  values: { max, '11th': y11, '12th': y12, practical, total },
  confidence,
});

test('leaves consistent rows alone, treating "-" and blanks as zero', () => {
  const rows = [row('ISLAMIC EDUCATION', '50', '39', '-', '', '39'), row('PHYSICS', '200', '64', '58', '16', '138')];
  const result = reconcile(rows, { total: '177' });
  assert.deepEqual(result.warnings, []);
  assert.equal(result.rows[1].values.total, '138');
});

test('fixes a misread total when that also matches the grand total', () => {
  const rows = [row('URDU', '200', '51', '59', '', '10', { total: 71 }), row('ENGLISH', '200', '85', '61', '', '146')];
  const result = reconcile(rows, { total: '256' });
  assert.equal(result.rows[0].values.total, '110');
  assert.match(result.warnings[0], /URDU total: read as 10, corrected to 110/);
});

test('fixes a misread part when the total is backed by the grand total', () => {
  const rows = [row('MATHEMATICS', '200', '55', '11', '', '96', { '12th': 86 }), row('ENGLISH', '200', '85', '61', '', '146')];
  const result = reconcile(rows, { total: '242' });
  assert.equal(result.rows[0].values['12th'], '41');
  assert.equal(result.rows[0].values.total, '96');
});

test('falls back to the lowest-confidence cell without a usable grand total', () => {
  const rows = [row('URDU', '200', '51', '59', '', '10', { total: 40, '11th': 95, '12th': 95 })];
  assert.equal(reconcile(rows).rows[0].values.total, '110');
});

test('reports rows it cannot repair and a grand total mismatch', () => {
  const rows = [row('URDU', '200', 'x1', '59', '', '??')];
  const { warnings } = reconcile(rows, { total: '110' });
  assert.match(warnings[0], /could not be corrected/);
  assert.match(warnings[1], /card says 110/);
});

const mark = (subject, max, obtained, alt) => ({ subject, values: { max, obtained }, alt });

test('Part-I: leaves marks alone when they add up to the card total', () => {
  const rows = [mark('URDU', '100', '81'), mark('PHYSICS', '85', '36')];
  assert.deepEqual(reconcileObtained(rows, { total: '117' }).warnings, []);
});

test('Part-I: swaps in the page reading when that makes the marks add up', () => {
  const rows = [mark('URDU', '100', '8', '81'), mark('PHYSICS', '85', '36', '36')];
  const result = reconcileObtained(rows, { total: '117' });
  assert.equal(result.rows[0].values.obtained, '81');
  assert.match(result.warnings[0], /URDU: read as 8, corrected to 81/);
});

test('Part-I: fills one unreadable mark from the card total, counts absent as zero', () => {
  const rows = [mark('URDU', '100', '??'), mark('PHYSICS', '85', 'ABS'), mark('ENGLISH', '100', '70')];
  const result = reconcileObtained(rows, { total: '151' });
  assert.equal(result.rows[0].values.obtained, '81');
  assert.equal(result.rows[1].values.obtained, 'ABS');
});

test('Part-I: reports a mark above its max and a total mismatch', () => {
  const { warnings } = reconcileObtained([mark('URDU', '100', '810'), mark('ENGLISH', '100', '70')], { total: '200' });
  assert.ok(warnings.some((w) => /card says 200/.test(w)));
  assert.ok(warnings.some((w) => /URDU: marks could not be read/.test(w)));
});
