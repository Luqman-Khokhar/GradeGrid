import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFields } from './fieldExtractor.js';

const asObject = (fields) => Object.fromEntries(fields.map((field) => [field.label, field.value]));

test('reads label: value pairs, several per line', () => {
  const text = 'Name: Ali Khan\tRoll No: 101\nFather Name:  Khalid Khan    Class: 10th';
  assert.deepEqual(asObject(extractFields(text)), {
    Name: 'Ali Khan',
    'Roll No': '101',
    'Father Name': 'Khalid Khan',
    Class: '10th',
  });
});

test('takes the value from the next cell when the label cell ends with a colon', () => {
  assert.deepEqual(asObject(extractFields('Student Name:\tSara Ahmed')), { 'Student Name': 'Sara Ahmed' });
});

test('flattens a subject table into subject + column fields', () => {
  const text = [
    'Subject\tTotal\tObtained\tGrade',
    'Mathematics\t100\t85\tA',
    'English\t100\t72\tB',
    'Grand Total\t200\t157',
    'Result: Pass',
  ].join('\n');

  assert.deepEqual(asObject(extractFields(text)), {
    'Mathematics Total': '100',
    'Mathematics Obtained': '85',
    'Mathematics Grade': 'A',
    'English Total': '100',
    'English Obtained': '72',
    'English Grade': 'B',
    'Grand Total': '200',
    'Grand Total Obtained': '157',
    Result: 'Pass',
  });
});

test('ignores times, urls and empty values', () => {
  assert.deepEqual(extractFields('Issued at 10:30\nhttp://example.com\nRemarks:'), []);
});

test('suffixes repeated labels instead of overwriting them', () => {
  const fields = extractFields('Marks: 50\nMarks: 60');
  assert.deepEqual(
    fields.map((field) => [field.key, field.value]),
    [
      ['marks', '50'],
      ['marks (2)', '60'],
    ],
  );
});
