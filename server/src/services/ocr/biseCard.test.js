import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBiseCard, parseHeader } from './biseCard.js';

// Shape of the OCR text from a BISE Gujranwala marks sheet (names are placeholders).
const OCR_TEXT = `Board of Intermediate & Secondary Education, rt
Gujranwala eat
Session : First Annual 2026
Marks Sheet HSSC (P-11)
Group: GENERAL SCIENCE
Roll No.: 123456 Registration No.: 1-2-3456789-24
Name: ALI KHAN Father's Name: KHALID KHAN
College: 111111-SAMPLE COLLEGE GUJRAT
" Marks Obtained status
© The candidate has passed and obtained marks: Five Hundred Only.`;

test('recognises a BISE result card', () => {
  assert.equal(isBiseCard(OCR_TEXT), true);
  assert.equal(isBiseCard('Name: Ali\nMarks: 50'), false);
});

test('reads the header fields and result', () => {
  assert.deepEqual(parseHeader(OCR_TEXT), {
    'Roll No': '123456',
    'Registration No': '1-2-3456789-24',
    Name: 'ALI KHAN',
    "Father's Name": 'KHALID KHAN',
    College: '111111-SAMPLE COLLEGE GUJRAT',
    Session: 'First Annual 2026',
    Class: 'HSSC (P-II)',
    Group: 'GENERAL SCIENCE',
    Result: 'Pass',
  });
});

test('fixes roman numerals OCR reads as digits', () => {
  assert.equal(parseHeader('Marks Sheet SSC (P-1)').Class, 'SSC (P-I)');
  assert.equal(parseHeader('Marks Sheet HSSC (P-Il)').Class, 'HSSC (P-II)');
});

test('maps screenshot pixels onto the calibration page using the Roll / Registration labels', async () => {
  const { findFrame } = await import('./biseCard.js');
  // Card drawn at half the reference scale, shifted right by 100 px and down by 50 px.
  const scale = 900;
  const word = (text, x, y) => ({ text, x0: x, x1: x + 30, y0: y - 5, y1: y + 5 });
  const rollY = 50 + 0.246 * scale * (2546 / 1800);
  const words = [word('Roll', 100 + 0.053 * scale, rollY), word('Registration', 100 + 0.503 * scale, rollY)];
  const frame = findFrame(words, 1200, 1600);

  const page = frame.toPage(100 + 0.296 * scale, rollY);
  assert.ok(Math.abs(page.x - 0.296) < 1e-9);
  assert.ok(Math.abs(page.y - 0.246) < 1e-9);
  const back = frame.toPixels(0.5, 0.5);
  assert.ok(Math.abs(frame.toPage(back.x, back.y).x - 0.5) < 1e-9);
});

test('falls back to whole-canvas fractions when the labels are missing', async () => {
  const { findFrame } = await import('./biseCard.js');
  const frame = findFrame([], 1000, 2000);
  assert.deepEqual(frame.toPage(500, 500), { x: 0.5, y: 0.25 });
});
