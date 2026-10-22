/**
 * BISE (Punjab) subjects: the short header the class sheet uses and the code listed when a
 * student has to reappear. Subject names reach us through OCR, so a name that matches no
 * pattern is compared letter by letter with each full name before it counts as a new subject.
 * Order matters: specific names come before the ones they contain (Islamic Studies before Islamic Edu).
 */
const SUBJECTS = [
  { id: 'thq', name: 'TRANSLATION OF HOLY QURAN', match: /QURAN/, label: 'Holy Quran', code: 'THQ' },
  { id: 'ist', name: 'ISLAMIC STUDIES', match: /ISLAMIC STUD/, label: 'Islamic St.', code: 'IST' },
  { id: 'isl', name: 'ISLAMIC EDUCATION', match: /ISLAMI(C|YAT)/, label: 'Islamic Edu', code: 'ISL' },
  { id: 'ped', name: 'HEALTH AND PHYSICAL EDUCATION', match: /PHYSICAL EDU|HEALTH/, label: 'Phys. Edu', code: 'PED' },
  { id: 'urd', name: 'URDU', match: /URDU/, label: 'Urdu', code: 'URD' },
  { id: 'eng', name: 'ENGLISH', match: /ENGLISH/, label: 'English', code: 'ENG' },
  { id: 'pst', name: 'PAKISTAN STUDIES', match: /PAK/, label: 'Pak Studies', code: 'PST' },
  { id: 'mth', name: 'MATHEMATICS', match: /MATH/, label: 'Maths', code: 'MTH' },
  { id: 'phy', name: 'PHYSICS', match: /PHYSIC/, label: 'Phy', code: 'PHY' },
  { id: 'che', name: 'CHEMISTRY', match: /CHEMI/, label: 'Chem', code: 'CHE' },
  { id: 'bio', name: 'BIOLOGY', match: /BIOLOG/, label: 'Bio', code: 'BIO' },
  { id: 'cse', name: 'COMPUTER SCIENCE & ENTREPRENEURSHIP', match: /ENTREPRENEUR/, label: 'CS & Ent.', code: 'CSE' },
  { id: 'cs', name: 'COMPUTER SCIENCE', match: /COMPUTER|INFORMATION TECH/, label: 'CS', code: 'CS' },
  { id: 'eco', name: 'ECONOMICS', match: /ECONOMIC/, label: 'Eco', code: 'ECO' },
  { id: 'sta', name: 'STATISTICS', match: /STATISTIC/, label: 'Stats', code: 'STA' },
  { id: 'civ', name: 'CIVICS', match: /CIVIC/, label: 'Civics', code: 'CIV' },
  { id: 'psy', name: 'PSYCHOLOGY', match: /PSYCHOLOG/, label: 'Psy', code: 'PSY' },
  { id: 'soc', name: 'SOCIOLOGY', match: /SOCIOLOG/, label: 'Sociology', code: 'SOC' },
  { id: 'geo', name: 'GEOGRAPHY', match: /GEOGRAPH/, label: 'Geo', code: 'GEO' },
  { id: 'his', name: 'HISTORY', match: /HISTORY/, label: 'History', code: 'HIS' },
  { id: 'phi', name: 'PHILOSOPHY', match: /PHILOSOPH/, label: 'Philosophy', code: 'PHI' },
  { id: 'pun', name: 'PUNJABI', match: /PUNJABI/, label: 'Punjabi', code: 'PUN' },
  { id: 'arb', name: 'ARABIC', match: /ARABIC/, label: 'Arabic', code: 'ARB' },
  { id: 'per', name: 'PERSIAN', match: /PERSIAN/, label: 'Persian', code: 'PER' },
  { id: 'fin', name: 'FINE ARTS', match: /FINE ART/, label: 'Fine Arts', code: 'FAR' },
  { id: 'lib', name: 'LIBRARY SCIENCE', match: /LIBRARY/, label: 'Library Sc.', code: 'LIB' },
  { id: 'nut', name: 'FOOD AND NUTRITION', match: /NUTRITION/, label: 'Nutrition', code: 'NUT' },
  { id: 'nur', name: 'NURSING', match: /NURSING/, label: 'Nursing', code: 'NUR' },
  { id: 'edu', name: 'EDUCATION', match: /EDUCATION/, label: 'Education', code: 'EDU' },
];

const SIMILAR = 0.8;

const normalise = (name) =>
  String(name ?? '')
    .toUpperCase()
    .replace(/&/g, ' & ')
    .replace(/[^A-Z& ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const distance = (a, b) => {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
};

const similarity = (a, b) => 1 - distance(a, b) / Math.max(a.length, b.length, 1);

const titleCase = (text) => text.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

/** { id, label, code } for a subject name as read from a card. */
export const subjectInfo = (rawName) => {
  const name = normalise(rawName);
  const known =
    SUBJECTS.find((subject) => subject.match.test(name)) ??
    SUBJECTS.find((subject) => similarity(name.replace(/ /g, ''), subject.name.replace(/[^A-Z&]/g, '')) >= SIMILAR);
  if (known) return { id: known.id, label: known.label, code: known.code };
  const letters = name.replace(/[^A-Z]/g, '');
  return { id: `other:${name}`, label: titleCase(name) || 'Subject', code: letters.slice(0, 3) || '?' };
};
