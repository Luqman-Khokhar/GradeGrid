import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { prepareImage } from './renderPage.js';

// 1600x1000 "desktop screenshot": white top bar, grey page, white card with text bars inside.
const screenshot = () => {
  const canvas = createCanvas(1600, 1000);
  const context = canvas.getContext('2d');
  context.fillStyle = '#e5e7eb';
  context.fillRect(0, 0, 1600, 1000);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 1600, 60);
  context.fillRect(200, 150, 1200, 700);
  context.fillStyle = '#000000';
  context.fillRect(220, 170, 1160, 20);
  context.fillRect(220, 820, 1160, 20);
  return canvas.toBuffer('image/png');
};

test('trims the plain top bar and page margins, then scales the content to OCR width', async () => {
  const prepared = await prepareImage(screenshot());
  // Content box ≈ 1191 x 731 px (text area plus 1% padding) scaled by 1800 / 1191.
  assert.equal(prepared.width, 1800);
  assert.ok(prepared.height > 1080 && prepared.height < 1130, `height ${prepared.height}`);
});

test('outputs greyscale with the faint background pushed to white', async () => {
  const prepared = await prepareImage(screenshot());
  const { data } = prepared.getContext('2d').getImageData(0, 0, prepared.width, prepared.height);
  const [r, g, b] = data;
  assert.equal(r, g);
  assert.equal(g, b);
  assert.equal(r, 255, 'light grey margin becomes white');
});
