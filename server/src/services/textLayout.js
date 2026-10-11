/**
 * Rebuild readable lines from pdf.js text items using their positions.
 * Items on the same baseline form a line; wide horizontal gaps become tabs so
 * table cells and side-by-side "Label: value" pairs stay separate.
 */

const SAME_LINE = 0.5; // y distance, in font heights
const CELL_GAP = 1.5; // x gap that starts a new cell, in font heights
const WORD_GAP = 0.15; // x gap that needs a space, in font heights

const toBox = (item) => {
  const [, , , scaleY, x, y] = item.transform;
  const height = Math.abs(scaleY) || item.height || 10;
  return { text: item.str, x, y, width: item.width, height };
};

const joinLine = (boxes) => {
  boxes.sort((a, b) => a.x - b.x);
  let line = boxes[0].text;
  for (let i = 1; i < boxes.length; i += 1) {
    const prev = boxes[i - 1];
    const box = boxes[i];
    const gap = box.x - (prev.x + prev.width);
    const size = Math.max(prev.height, box.height);
    if (gap > size * CELL_GAP) line += '\t';
    else if (gap > size * WORD_GAP && !/\s$/.test(line) && !/^\s/.test(box.text)) line += ' ';
    line += box.text;
  }
  return line;
};

export const layoutLines = (items) => {
  const boxes = items.filter((item) => item.str?.trim()).map(toBox);
  boxes.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines = [];
  let current = [];
  for (const box of boxes) {
    const anchor = current[0];
    if (anchor && Math.abs(anchor.y - box.y) > Math.max(anchor.height, box.height) * SAME_LINE) {
      lines.push(joinLine(current));
      current = [];
    }
    current.push(box);
  }
  if (current.length) lines.push(joinLine(current));

  return lines.join('\n');
};
