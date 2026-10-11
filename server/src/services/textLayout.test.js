import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLines } from './textLayout.js';

// Helvetica-ish: ~0.5em per character at 11pt.
const item = (str, x, y, size = 11) => ({ str, transform: [size, 0, 0, size, x, y], width: str.length * size * 0.5, height: size });

test('separates far-apart items on one line with a tab', () => {
  const text = layoutLines([item('Name: Ali Khan', 72, 710), item('Roll No: 101', 330, 710)]);
  assert.equal(text, 'Name: Ali Khan\tRoll No: 101');
});

test('joins nearby fragments into words and orders lines top to bottom', () => {
  const text = layoutLines([
    item('Mathematics', 72, 630),
    item('85', 350, 630),
    item('Ali', 72, 710),
    item('Khan', 72 + 3 * 5.5 + 3, 710),
  ]);
  assert.equal(text, 'Ali Khan\nMathematics\t85');
});

test('keeps slightly offset baselines on the same line and skips blank items', () => {
  const text = layoutLines([item('Grade', 450, 650.8), item(' ', 300, 650), item('Subject', 72, 650)]);
  assert.equal(text, 'Subject\tGrade');
});
