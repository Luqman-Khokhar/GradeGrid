/**
 * Identify uploads by their bytes, not the client's Content-Type, and read image
 * dimensions from the header so oversized images are refused before they are decoded.
 */

const startsWith = (buffer, bytes, offset = 0) =>
  buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

const ascii = (text) => [...text].map((char) => char.charCodeAt(0));

export const detectType = (buffer) => {
  if (startsWith(buffer, ascii('%PDF-'))) return 'application/pdf';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buffer, ascii('RIFF')) && startsWith(buffer, ascii('WEBP'), 8)) return 'image/webp';
  return null;
};

const pngSize = (buffer) =>
  startsWith(buffer, ascii('IHDR'), 12) ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) } : null;

// Walk JPEG segments to the first start-of-frame marker (SOF0..SOF15 except DHT/JPG/DAC).
const jpegSize = (buffer) => {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
};

const webpSize = (buffer) => {
  if (buffer.length < 30) return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  return null;
};

const SIZE_READERS = { 'image/png': pngSize, 'image/jpeg': jpegSize, 'image/webp': webpSize };

/** { width, height } of a PNG/JPG/WebP from its header, or null when it cannot be read. */
export const imageSize = (buffer, type = detectType(buffer)) => {
  const size = SIZE_READERS[type]?.(buffer);
  return size && size.width > 0 && size.height > 0 ? size : null;
};
