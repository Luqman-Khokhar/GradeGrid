import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPart1Card, pageReadAddsUp } from './bisePart1.js';

const row = (max, obtained, status = 'PASS') => ({ values: { max, obtained, status } });

test('tells Part-I cards from Part-II ones', () => {
  assert.equal(isPart1Card('Marks Sheet HSSC (P-1)', []), true);
  assert.equal(isPart1Card('Marks Sheet HSSC (P-11)', []), false);
  assert.equal(isPart1Card('no class line', [{ text: '11th' }]), false);
  assert.equal(isPart1Card('no class line', [{ text: 'Obtained' }]), true);
});

test('trusts the page read only when every status is read and both columns add up', () => {
  const rows = [row('50', '45'), row('85', '36')];
  assert.equal(pageReadAddsUp(rows, { max: '135', total: '81' }), true);
  assert.equal(pageReadAddsUp(rows, { max: '135', total: '80' }), false, 'marks off by one');
  assert.equal(pageReadAddsUp(rows, { max: '130', total: '81' }), false, 'max misread');
  assert.equal(pageReadAddsUp([row('50', '45', ''), row('85', '36')], { max: '135', total: '81' }), false, 'status missing');
  assert.equal(pageReadAddsUp([row('50', '45'), row('85', '90')], { max: '135', total: '135' }), false, 'mark above max');
});
