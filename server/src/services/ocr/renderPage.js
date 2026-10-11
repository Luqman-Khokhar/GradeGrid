import { createCanvas, loadImage } from '@napi-rs/canvas';
import { HttpError } from '../../middleware/errorHandler.js';
import { imageSize } from '../fileSignature.js';
import { isWithinPixelLimits, UPLOAD_LIMITS } from '../uploadLimits.js';

// About the native resolution of typical result card screenshots; larger is slower, not more accurate.
const TARGET_WIDTH = 1800;
// Small screenshots are upscaled (helps OCR) but never beyond this.
const MAX_UPSCALE = 3;
// Contrast stretch: faint watermark (light grey) turns white, text stays black.
const BLACK_POINT = 90;
const WHITE_POINT = 230;
// A row/column whose brightness varies less than this is plain background (page margin, empty bar).
const UNIFORM_SPREAD = 12;

const stretchContrast = (canvas) => {
  const context = canvas.getContext('2d');
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  const range = WHITE_POINT - BLACK_POINT;
  for (let i = 0; i < data.length; i += 4) {
    const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const value = Math.min(255, Math.max(0, ((grey - BLACK_POINT) * 255) / range));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return canvas;
};

/** Render a pdf.js page to a greyscale, contrast-stretched canvas for OCR. */
export const renderPage = async (page) => {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
  // A page shaped like a thin strip would render millions of pixels tall at OCR width.
  if (!isWithinPixelLimits({ width: Math.ceil(viewport.width), height: Math.ceil(viewport.height) })) {
    throw new HttpError(422, 'This PDF page has an unusual size and cannot be read.');
  }
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
  return stretchContrast(canvas);
};

/**
 * Find the content box of a screenshot by trimming plain margins from each edge
 * (desktop page background, empty space around the card). Busy edges such as a
 * browser address bar are kept; the parser locates the card by its labels anyway.
 */
const contentBox = (image) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, image.width, image.height);
  const grey = (x, y) => {
    const i = (y * image.width + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const isUniform = (from, to, sample) => {
    let min = 255;
    let max = 0;
    for (let i = from; i <= to; i += 2) {
      const value = sample(i);
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return max - min < UNIFORM_SPREAD;
  };
  let top = 0;
  let bottom = image.height - 1;
  let left = 0;
  let right = image.width - 1;
  // Rows first, then columns only across the remaining rows: a plain top bar and a plain side
  // margin of different colours would otherwise make every edge column look busy.
  const rowUniform = (y) => isUniform(0, image.width - 1, (x) => grey(x, y));
  while (top < bottom && rowUniform(top)) top += 1;
  while (bottom > top && rowUniform(bottom)) bottom -= 1;
  const colUniform = (x) => isUniform(top, bottom, (y) => grey(x, y));
  while (left < right && colUniform(left)) left += 1;
  while (right > left && colUniform(right)) right -= 1;

  // Keep a small margin so text at the edge is not clipped.
  const pad = Math.round(image.width * 0.01);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  return {
    left,
    top,
    width: Math.min(image.width, right + pad) - left,
    height: Math.min(image.height, bottom + pad) - top,
  };
};

/** Load a PNG/JPG/WebP screenshot, trim plain margins, scale to OCR size and stretch contrast. */
export const prepareImage = async (buffer) => {
  // Check the size the header claims before decoding: a small file can expand to gigabytes.
  const size = imageSize(buffer);
  if (!size || !isWithinPixelLimits(size)) {
    throw new HttpError(422, 'This image is too large or damaged. Use a normal screenshot of the result card.');
  }
  const image = await loadImage(buffer);
  const box = contentBox(image);
  // Narrow, tall crops would otherwise upscale past the pixel budget.
  const scale = Math.min(MAX_UPSCALE, TARGET_WIDTH / box.width, Math.sqrt(UPLOAD_LIMITS.maxPixels / (box.width * box.height)));
  const canvas = createCanvas(Math.round(box.width * scale), Math.round(box.height * scale));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.drawImage(image, box.left, box.top, box.width, box.height, 0, 0, canvas.width, canvas.height);
  return stretchContrast(canvas);
};

/** Copy a region of the canvas onto a white background with padding (Tesseract reads padded crops better). */
export const cropRegion = (canvas, { left, top, width, height }, padding = 16) => {
  const crop = createCanvas(Math.round(width) + padding * 2, Math.round(height) + padding * 2);
  const context = crop.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, crop.width, crop.height);
  context.drawImage(canvas, left, top, width, height, padding, padding, width, height);
  return crop.toBuffer('image/png');
};
