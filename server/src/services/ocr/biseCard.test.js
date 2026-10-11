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
