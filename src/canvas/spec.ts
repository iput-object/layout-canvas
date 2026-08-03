import { resolvePoint, toBoundaryPoint, toBoundaryRect } from './geometry';
import type { CanvasDocument, Point } from '../types';

const round = (value: number) => Math.round(value);

const getPointDescription = (
  point: Point,
  document: CanvasDocument,
) => {
  if (point.boxId) {
    const box = document.boxes.find((candidate) => candidate.id === point.boxId);
    return box ? `"${box.label}"` : '"Unknown Element"';
  }

  const resolved = resolvePoint(point, document.boxes);
  if (!resolved) return 'unknown point';
  const relative = toBoundaryPoint(resolved, document.drawBounds);
  return `free point (x=${round(relative.x)}%, y=${round(relative.y)}%)`;
};

export const generateLayoutSpec = (document: CanvasDocument) => {
  const sortedBoxes = [...document.boxes].sort(
    (first, second) => first.y - second.y || first.x - second.x,
  );
  const { drawBounds } = document;
  let spec = 'LAYOUT SPEC (coordinates are % of drawable boundary)\n\n';
  spec += `Drawable boundary: x=${round(drawBounds.minX)}%-${round(
    drawBounds.maxX,
  )}%, y=${round(drawBounds.minY)}%-${round(drawBounds.maxY)}%\n\n`;

  sortedBoxes.forEach((box, index) => {
    const relative = toBoundaryRect(box, drawBounds);
    spec += `${index + 1}. [${box.type}] "${box.label}"\n`;
    spec += `   position: x=${round(relative.x)}%, y=${round(
      relative.y,
    )}%, size=${round(relative.w)}%×${round(relative.h)}%\n`;
    if (box.note) spec += `   note: ${box.note}\n`;
    spec += '\n';
  });

  if (document.arrows.length > 0) {
    spec += 'RELATIONSHIPS / POINTERS:\n';
    document.arrows.forEach((arrow) => {
      spec += `- ${getPointDescription(arrow.start, document)} → ${getPointDescription(
        arrow.end,
        document,
      )}`;
      if (arrow.note) spec += `: ${arrow.note}`;
      spec += '\n';
    });
  }

  return spec;
};
