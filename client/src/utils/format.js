const sizeFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatBytes = (bytes) => {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${sizeFormatter.format(value)} ${UNITS[unit]}`;
};
