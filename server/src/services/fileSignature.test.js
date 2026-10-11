import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { detectType, imageSize } from './fileSignature.js';

const image = (format, width, height) => createCanvas(width, height).toBuffer(format);

test('detects PDF, PNG, JPEG and WebP by their bytes', () => {
  assert.equal(detectType(Buffer.from('%PDF-1.7\n')), 'application/pdf');
  assert.equal(detectType(image('image/png', 4, 4)), 'image/png');
  assert.equal(detectType(image('image/jpeg', 4, 4)), 'image/jpeg');
  assert.equal(detectType(image('image/webp', 4, 4)), 'image/webp');
  assert.equal(detectType(Buffer.from('<html>not an image</html>')), null);
});

test('reads image dimensions from the header', () => {
  assert.deepEqual(imageSize(image('image/png', 321, 123)), { width: 321, height: 123 });
  assert.deepEqual(imageSize(image('image/jpeg', 640, 480)), { width: 640, height: 480 });
  assert.deepEqual(imageSize(image('image/webp', 300, 200)), { width: 300, height: 200 });
});

test('reads the size a PNG claims without decoding it (decompression bombs)', () => {
  const header = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(30000, 16);
  header.writeUInt32BE(30000, 20);
  assert.deepEqual(imageSize(header), { width: 30000, height: 30000 });
});
