import type { Arrow, BoundaryEdge, Box, DrawBounds, Point } from '../types';

export const MIN_DRAW_BOUNDS_SIZE = 10;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const clampPointToBounds = (
  { x, y }: { x: number; y: number },
  bounds: DrawBounds,
) => ({
  x: clamp(x, bounds.minX, bounds.maxX),
  y: clamp(y, bounds.minY, bounds.maxY),
});

export const resolvePoint = (
  point: Point,
  boxes: Box[],
): { x: number; y: number } | null => {
  if (point.boxId) {
    const box = boxes.find((candidate) => candidate.id === point.boxId);
    return box ? { x: box.x + box.w / 2, y: box.y + box.h / 2 } : null;
  }

  return point.x === undefined || point.y === undefined
    ? null
    : { x: point.x, y: point.y };
};

export const getContentBounds = (
  boxes: Box[],
  arrows: Arrow[],
): DrawBounds | null => {
  const points = boxes.flatMap((box) => [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
  ]);

  arrows.forEach((arrow) => {
    const start = resolvePoint(arrow.start, boxes);
    const end = resolvePoint(arrow.end, boxes);
    if (start) points.push(start);
    if (end) points.push(end);
  });

  if (points.length === 0) return null;

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

export const resizeDrawBounds = (
  bounds: DrawBounds,
  edge: BoundaryEdge,
  pointer: { x: number; y: number },
  contentBounds: DrawBounds | null,
): DrawBounds => {
  if (edge === 'left') {
    const maxX = Math.min(
      bounds.maxX - MIN_DRAW_BOUNDS_SIZE,
      contentBounds?.minX ?? 100,
    );
    return { ...bounds, minX: clamp(pointer.x, 0, maxX) };
  }

  if (edge === 'right') {
    const minX = Math.max(
      bounds.minX + MIN_DRAW_BOUNDS_SIZE,
      contentBounds?.maxX ?? 0,
    );
    return { ...bounds, maxX: clamp(pointer.x, minX, 100) };
  }

  if (edge === 'top') {
    const maxY = Math.min(
      bounds.maxY - MIN_DRAW_BOUNDS_SIZE,
      contentBounds?.minY ?? 100,
    );
    return { ...bounds, minY: clamp(pointer.y, 0, maxY) };
  }

  const minY = Math.max(
    bounds.minY + MIN_DRAW_BOUNDS_SIZE,
    contentBounds?.maxY ?? 0,
  );
  return { ...bounds, maxY: clamp(pointer.y, minY, 100) };
};

export const toBoundaryPoint = (
  point: { x: number; y: number },
  bounds: DrawBounds,
) => ({
  x: ((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100,
  y: ((point.y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100,
});

export const toBoundaryRect = (box: Box, bounds: DrawBounds) => ({
  ...toBoundaryPoint(box, bounds),
  w: (box.w / (bounds.maxX - bounds.minX)) * 100,
  h: (box.h / (bounds.maxY - bounds.minY)) * 100,
});
