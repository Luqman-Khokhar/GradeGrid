/**
 * Cross-check OCR'd marks with the card's own arithmetic and repair single misreads.
 *
 * Each subject must satisfy: total = 11th + 12th + practical ("-" or blank = 0),
 * and subject totals must add up to the grand total. When a row does not add up,
 * the fix that also keeps the grand total consistent wins; otherwise the
 * lowest-confidence cell is recomputed. Every change is reported as a warning.
 */

export const PART_KEYS = ['11th', '12th', 'practical'];

const toNumber = (value) => {
  if (value === undefined || value === '' || /^-+$/.test(value)) return 0;
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
};

const sumParts = (values) => PART_KEYS.reduce((total, key) => total + toNumber(values[key]), 0);

const isConsistent = (row) => {
  const total = toNumber(row.values.total);
  const sum = sumParts(row.values);
  return Number.isFinite(total) && Number.isFinite(sum) && total === sum;
};

const candidatesFor = (row) => {
  const { values } = row;
  const max = toNumber(values.max);
  const total = toNumber(values.total);
  const sum = sumParts(values);
  const withinMax = (value) => Number.isInteger(value) && value >= 0 && (!max || value <= max);
  const candidates = [];

  if (Number.isFinite(sum) && withinMax(sum)) candidates.push({ key: 'total', value: sum, total: sum });

  if (Number.isFinite(total)) {
    PART_KEYS.forEach((key) => {
      if (values[key] === undefined || values[key] === '' || /^-+$/.test(values[key])) return;
      const others = PART_KEYS.filter((other) => other !== key).reduce((acc, other) => acc + toNumber(values[other]), 0);
      const value = total - others;
      if (Number.isFinite(others) && withinMax(value)) candidates.push({ key, value, total });
    });
  }
  return candidates;
};

export const reconcile = (rows, grand = {}) => {
  const fixed = rows.map((row) => ({ ...row, values: { ...row.values } }));
  const warnings = [];
  const grandTotal = toNumber(grand.total);
  const bad = fixed.filter((row) => !isConsistent(row));

  bad.forEach((row) => {
    const candidates = candidatesFor(row);
    if (!candidates.length) {
      warnings.push(`${row.subject}: marks do not add up and could not be corrected. Check this card.`);
      return;
    }

    const otherTotals = fixed
      .filter((other) => other !== row)
      .reduce((acc, other) => acc + toNumber(other.values.total), 0);
    const matchesGrand = (candidate) =>
      bad.length === 1 && Number.isFinite(grandTotal) && grandTotal > 0 && otherTotals + candidate.total === grandTotal;
    const confidence = (candidate) => row.confidence?.[candidate.key] ?? 100;

    const [best] = [...candidates].sort(
      (a, b) => Number(matchesGrand(b)) - Number(matchesGrand(a)) || confidence(a) - confidence(b),
    );

    const before = row.values[best.key] || 'blank';
    row.values[best.key] = String(best.value);
    warnings.push(`${row.subject} ${best.key}: read as ${before}, corrected to ${best.value} so the marks add up.`);
  });

  if (Number.isFinite(grandTotal) && grandTotal > 0) {
    const sum = fixed.reduce((acc, row) => acc + toNumber(row.values.total), 0);
    if (sum !== grandTotal) {
      warnings.push(`Subject totals add up to ${Number.isFinite(sum) ? sum : 'an unreadable value'}, but the card says ${grandTotal}.`);
    }
  }

  return { rows: fixed, warnings };
};
