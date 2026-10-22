/**
 * Lays out the class sheet, the school's own marks-sheet format: one worksheet per group,
 * one row per student, one column per subject. Subjects that take the same place on the card
 * (an elective slot such as Physics or Economics) share a column, so a mixed class stays narrow.
 * Plain data only; utils/classSheet.js writes it with exceljs.
 */
import { subjectInfo } from './subjects.js';
import { FAIL_PERCENT } from './xlsxPlan.js';

export const SUBTITLE = 'Student Marks Sheet & Subject Performance Summary';
export const ID_HEADERS = ['Roll No', 'Student Name', 'Father Name'];
export const TOTAL_HEADERS = ['Total Max Marks', 'Total Obtained', 'Overall Status'];

const NUMBER = /^\d+(\.\d+)?$/;
const ABSENT = /^(A|ABS|ABSENT)$/i;
const SHEET_NAME_MAX = 31; // Excel's limit

const numberOf = (value) => (NUMBER.test(value ?? '') ? Number(value) : null);

const titleCase = (text) => text.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

/** Failed or absent: the card's status says so, or the mark is under the pass percentage. */
export const subjectFailed = (subject) => {
  if (/^(F|FAIL)$/i.test(subject.status ?? '') || ABSENT.test(subject.status ?? '') || ABSENT.test(subject.obtained ?? '')) {
    return true;
  }
  const obtained = numberOf(subject.obtained);
  const max = numberOf(subject.max);
  return obtained !== null && max ? (obtained / max) * 100 < FAIL_PERCENT : false;
};

export const overallStatus = (result, failedCount) => {
  if (/fail/i.test(result ?? '')) return 'FAIL';
  if (failedCount || /compartment/i.test(result ?? '')) return 'COMPARTMENT';
  return 'PASS';
};

/** "BISE Gujranwala - HSSC (P-I) First Annual Examination 2026" from the card header. */
export const sheetTitle = (card) => {
  const session = (card.session ?? '').match(/^(.*?)[,\s]*(\d{4})$/);
  const exam = session ? `${session[1]} Examination ${session[2]}` : card.session;
  return [`BISE${card.board ? ` ${card.board}` : ''}`, [card.className, exam].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(' - ');
};

const sheetName = (text, used) => {
  const base = text.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, SHEET_NAME_MAX) || 'Results';
  let name = base;
  for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${base.slice(0, SHEET_NAME_MAX - 4)} (${n})`;
  used.add(name.toLowerCase());
  return name;
};

const mostCommon = (counts) => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];

/**
 * Columns for one sheet. Each subject sits at the place it most often has on the cards; subjects
 * at the same place share a column unless some student takes both.
 */
export const subjectColumns = (cards) => {
  const stats = new Map();
  cards.forEach((card, student) => {
    card.subjects.forEach((subject, index) => {
      const info = subjectInfo(subject.name);
      const stat = stats.get(info.id) ?? { info, positions: new Map(), maxes: new Set(), students: new Set() };
      stat.positions.set(index, (stat.positions.get(index) ?? 0) + 1);
      if (numberOf(subject.max) !== null) stat.maxes.add(Number(subject.max));
      stat.students.add(student);
      stats.set(info.id, stat);
    });
  });

  const ordered = [...stats.values()]
    .map((stat) => ({ ...stat, position: mostCommon(stat.positions) }))
    .sort((a, b) => a.position - b.position || b.students.size - a.students.size);

  const columns = [];
  ordered.forEach((stat) => {
    const shared = columns.find(
      (column) => column.position === stat.position && ![...stat.students].some((student) => column.students.has(student)),
    );
    if (shared) {
      shared.subjects.push(stat);
      stat.students.forEach((student) => shared.students.add(student));
    } else {
      columns.push({ position: stat.position, subjects: [stat], students: new Set(stat.students) });
    }
  });

  return columns.map((column) => {
    const maxes = [...new Set(column.subjects.flatMap((stat) => [...stat.maxes].sort((a, b) => a - b)))];
    const names = column.subjects.map((stat) => stat.info.label).join(' / ');
    return {
      ids: column.subjects.map((stat) => stat.info.id),
      header: maxes.length ? `${names} (${maxes.join('/')})` : names,
    };
  });
};

const studentRow = (card, columns) => {
  const subjects = card.subjects.map((subject) => ({ ...subject, info: subjectInfo(subject.name) }));
  const failed = subjects.filter(subjectFailed);
  const status = overallStatus(card.result, failed.length);
  const sum = (key) => subjects.reduce((acc, subject) => acc + (numberOf(subject[key]) ?? 0), 0);
  const marks = columns.map((column) => subjects.find((subject) => column.ids.includes(subject.info.id)));

  const values = [
    card.rollNo || null,
    card.name || null,
    card.fatherName || null,
    ...marks.map((subject) => {
      if (!subject) return null;
      if (ABSENT.test(subject.obtained ?? '')) return 'ABS';
      return numberOf(subject.obtained) ?? (subject.obtained || null);
    }),
    numberOf(card.totalMax) ?? sum('max'),
    failed.length
      ? failed
          .map((subject) => subject.info.code)
          .sort()
          .join(', ')
      : (numberOf(card.totalObtained) ?? sum('obtained')),
    status,
  ];

  const fails = new Set();
  marks.forEach((subject, index) => {
    if (subject && subjectFailed(subject)) fails.add(ID_HEADERS.length + index);
  });
  if (status !== 'PASS') {
    fails.add(values.length - 2);
    fails.add(values.length - 1);
  }
  return { values, fails };
};

const byRollNo = (a, b) =>
  (numberOf(a.rollNo) ?? Infinity) - (numberOf(b.rollNo) ?? Infinity) || String(a.rollNo).localeCompare(String(b.rollNo));

/**
 * cards: the `card` objects the API returns for recognised marks sheets.
 * → [{ name, title, headers, rows: [{ values, fails: Set<columnIndex> }] }]
 */
export const buildClassSheets = (cards) => {
  const classes = new Set(cards.map((card) => card.className));
  const groups = new Map();
  cards.forEach((card) => {
    const label = [titleCase(card.group || ''), classes.size > 1 ? card.className : ''].filter(Boolean).join(' ') || 'Results';
    groups.set(label, [...(groups.get(label) ?? []), card]);
  });

  const used = new Set();
  return [...groups.entries()].map(([label, group]) => {
    const sorted = [...group].sort(byRollNo);
    const columns = subjectColumns(sorted);
    return {
      name: sheetName(label, used),
      title: sheetTitle(sorted[0]),
      headers: [...ID_HEADERS, ...columns.map((column) => column.header), ...TOTAL_HEADERS],
      rows: sorted.map((card) => studentRow(card, columns)),
    };
  });
};
