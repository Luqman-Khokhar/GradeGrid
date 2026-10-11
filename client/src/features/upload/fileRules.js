import { formatBytes } from '../../utils/format';

// Vercel rejects request bodies over 4.5 MB, so files and batches stay under 4 MB.
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_FILES = 20;

export const fileId = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const isPdf = (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

/** Split picked files into accepted items and human-readable rejection messages. */
export const validateFiles = (fileList, existingIds) => {
  const accepted = [];
  const rejected = [];
  const seen = new Set(existingIds);

  Array.from(fileList).forEach((file) => {
    const id = fileId(file);
    if (seen.has(id)) return;
    if (!isPdf(file)) {
      rejected.push(`${file.name} is not a PDF.`);
    } else if (file.size > MAX_FILE_BYTES) {
      rejected.push(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`);
    } else if (file.size === 0) {
      rejected.push(`${file.name} is empty.`);
    } else {
      seen.add(id);
      accepted.push({ id, file });
    }
  });

  return { accepted, rejected };
};

/** Group items so each request stays under the size and count limits. */
export const createBatches = (items) => {
  const batches = [];
  let current = [];
  let currentBytes = 0;

  items.forEach((item) => {
    const size = item.file.size;
    if (current.length && (currentBytes + size > MAX_BATCH_BYTES || current.length >= MAX_BATCH_FILES)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(item);
    currentBytes += size;
  });

  if (current.length) batches.push(current);
  return batches;
};
