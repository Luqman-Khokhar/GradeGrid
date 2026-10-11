// Bounds that keep one upload from exhausting memory or CPU. A result card is one page at
// screen resolution, so these leave plenty of room for real files.
export const UPLOAD_LIMITS = Object.freeze({
  // Decoded image or rendered page area, in pixels (25 MP ≈ 100 MB as RGBA).
  maxPixels: 25_000_000,
  maxSide: 12_000,
  maxPdfPages: 10,
});

export const isWithinPixelLimits = ({ width, height }) =>
  width <= UPLOAD_LIMITS.maxSide && height <= UPLOAD_LIMITS.maxSide && width * height <= UPLOAD_LIMITS.maxPixels;
