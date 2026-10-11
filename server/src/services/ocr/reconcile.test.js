import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile } from './reconcile.js';

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
