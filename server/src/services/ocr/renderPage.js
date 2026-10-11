import { createCanvas } from '@napi-rs/canvas';

// About the native resolution of typical result card screenshots; larger is slower, not more accurate.
const TARGET_WIDTH = 1800;
// Contrast stretch: faint watermark (light grey) turns white, text stays black.
const BLACK_POINT = 90;
const WHITE_POINT = 230;

/** Render a pdf.js page to a greyscale, contrast-stretched canvas for OCR. */
export const renderPage = async (page) => {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d');
  await page.render({ canvasContext: context, viewport, canvas }).promise;

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

/** Copy a region of the canvas onto a white background with padding (Tesseract reads padded crops better). */
export const cropRegion = (canvas, { left, top, width, height }, padding = 16) => {
  const crop = createCanvas(Math.round(width) + padding * 2, Math.round(height) + padding * 2);
  const context = crop.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, crop.width, crop.height);
  context.drawImage(canvas, left, top, width, height, padding, padding, width, height);
  return crop.toBuffer('image/png');
};
