import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClassSheets, sheetTitle, subjectFailed } from './classSheetPlan.js';
import { subjectInfo } from './subjects.js';

const ICS = ['ISLAMIC EDUCATION', 'TRANSLATION OF HOLY QURAN', 'URDU', 'ENGLISH', 'MATHEMATICS'];
const MAX = { 'ISLAMIC EDUCATION': '50', 'TRANSLATION OF HOLY QURAN': '50', PHYSICS: '85', ECONOMICS: '100', 'COMPUTER SCIENCE & ENTREPRENEURSHIP': '75' };

// Names are placeholders; marks follow the school's sample sheet.
const card = (rollNo, elective, marks, extra = {}) => {
  const names = [...ICS, elective, 'COMPUTER SCIENCE & ENTREPRENEURSHIP'];
  return {
    rollNo,
    name: `STUDENT ${rollNo}`,
    fatherName: `FATHER ${rollNo}`,
    className: 'HSSC (P-I)',
    session: 'First Annual, 2026',
    group: 'GENERAL SCIENCE',
    board: 'Gujranwala',
    result: 'Pass',
    subjects: names.map((name, i) => ({ name, max: MAX[name] ?? '100', obtained: String(marks[i]), status: 'PASS' })),
    totalMax: elective === 'PHYSICS' ? '560' : '575',
    totalObtained: String(marks.reduce((a, b) => a + b, 0)),
    ...extra,
  };
};

const cards = [
  card('418796', 'PHYSICS', [45, 50, 81, 82, 67, 36, 60]),
  card('417700', 'PHYSICS', [30, 8, 48, 81, 19, 21, 37]),
  card('417849', 'ECONOMICS', [43, 47, 77, 70, 81, 67, 56]),
  card('417739', 'PHYSICS', [43, 46, 72, 77, 76, 58, 43]),
];

test('lays a mixed ICS class out exactly like the school sheet', () => {
  const [sheet, ...rest] = buildClassSheets(cards);
  assert.equal(rest.length, 0);
  assert.equal(sheet.name, 'General Science');
  assert.equal(sheet.title, 'BISE Gujranwala - HSSC (P-I) First Annual Examination 2026');
  assert.deepEqual(sheet.headers, [
    'Roll No',
    'Student Name',
    'Father Name',
    'Islamic Edu (50)',
    'Holy Quran (50)',
    'Urdu (100)',
    'English (100)',
    'Maths (100)',
    'Phy / Eco (85/100)',
    'CS & Ent. (75)',
    'Total Max Marks',
    'Total Obtained',
    'Overall Status',
  ]);
  assert.deepEqual(
    sheet.rows.map((row) => row.values[0]),
    ['417700', '417739', '417849', '418796'],
    'sorted by roll no',
  );
  assert.deepEqual(sheet.rows[3].values.slice(3), [45, 50, 81, 82, 67, 36, 60, 560, 421, 'PASS']);
  assert.equal(sheet.rows[2].values[8], 67, 'economics mark sits in the shared elective column');
  assert.equal(sheet.rows[2].values[10], 575);
  assert.equal(sheet.rows[3].fails.size, 0);
});

test('lists failed subject codes and marks the student for compartment', () => {
  const [sheet] = buildClassSheets(cards);
  const row = sheet.rows[0];
  assert.deepEqual(row.values.slice(10), [560, 'MTH, PHY, THQ', 'COMPARTMENT']);
  // Holy Quran 8/50, Maths 19/100, Physics 21/85, then Total Obtained and Overall Status.
  assert.deepEqual([...row.fails].sort((a, b) => a - b), [4, 7, 8, 11, 12]);
});

test('puts each group on its own sheet and keeps absent marks visible', () => {
  const premed = {
    ...card('420001', 'PHYSICS', [40, 40, 70, 70, 0, 50, 0]),
    group: 'PRE-MEDICAL',
    subjects: [...ICS.slice(0, 4), 'BIOLOGY', 'CHEMISTRY', 'PHYSICS'].map((name) => ({
      name,
      max: MAX[name] ?? '100',
      obtained: name === 'CHEMISTRY' ? 'ABS' : '60',
      status: name === 'CHEMISTRY' ? 'ABSENT' : 'PASS',
    })),
  };
  const sheets = buildClassSheets([...cards, premed]);
  assert.deepEqual(sheets.map((sheet) => sheet.name), ['General Science', 'Pre-Medical']);
  assert.deepEqual(sheets[1].headers.slice(7, 10), ['Bio (100)', 'Chem (100)', 'Phy (85)']);
  assert.equal(sheets[1].rows[0].values[8], 'ABS');
  assert.equal(sheets[1].rows[0].values[12], 'COMPARTMENT');
});

test('never merges two subjects one student takes into the same column', () => {
  const odd = card('419000', 'ECONOMICS', [40, 40, 70, 70, 70, 70, 50]);
  odd.subjects[4] = { name: 'STATISTICS', max: '100', obtained: '70' };
  odd.subjects[5] = { name: 'MATHEMATICS', max: '100', obtained: '70' };
  const [sheet] = buildClassSheets([...cards, odd]);
  const row = sheet.rows.find((r) => r.values[0] === '419000');
  const filled = row.values.slice(3, -3).filter((value) => value !== null);
  assert.equal(filled.length, 7, 'all seven marks land in a column');
});

test('recognises subject names despite OCR misreads', () => {
  assert.equal(subjectInfo('PHYSlCS').id, 'phy');
  assert.equal(subjectInfo('COMPUTER SCIENCE & ENTREPRENEURSHlP').id, 'cse');
  assert.equal(subjectInfo('HEALTH AND PHYSICAL EDUCATION').id, 'ped');
  assert.equal(subjectInfo('ISLAMIC EDUCATION').id, 'isl');
  assert.equal(subjectInfo('ENGLlSH').id, 'eng');
  assert.equal(subjectInfo('CHEMISTRV').id, 'che');
  assert.equal(subjectInfo('ASTRONOMY').label, 'Astronomy');
});

test('fails under 33%, a failed or absent status, and builds a title without a board', () => {
  assert.equal(subjectFailed({ max: '50', obtained: '16' }), true);
  assert.equal(subjectFailed({ max: '50', obtained: '17' }), false);
  assert.equal(subjectFailed({ max: '100', obtained: '50', status: 'FAIL' }), true);
  assert.equal(subjectFailed({ max: '100', obtained: 'ABS' }), true);
  assert.equal(sheetTitle({ className: 'SSC (P-II)', session: 'Second Annual 2025' }), 'BISE - SSC (P-II) Second Annual Examination 2025');
});
