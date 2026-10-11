// Per-subject column kinds, longest first so "Status Practical" wins over "Practical".
const SUFFIXES = [
  'Status Practical',
  'Status 11th',
  'Status 12th',
  'Percentile',
  'Practical',
  'Grade',
  'Total',
  'Max',
  '11th',
  '12th',
];

/** Group columns that share a kind across subjects ("URDU Total", "ENGLISH Total" → "Total"). */
export const groupColumns = (columns) => {
  const groups = new Map(SUFFIXES.map((suffix) => [suffix, []]));
  columns.forEach((column) => {
    const suffix = SUFFIXES.find((candidate) => column.label.endsWith(` ${candidate}`));
    if (suffix) groups.get(suffix).push(column.key);
  });
  return [...groups.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([label, keys]) => ({ label, keys }));
};
