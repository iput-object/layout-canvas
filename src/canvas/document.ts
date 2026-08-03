import type {
  Arrow,
  Box,
  CanvasDocument,
  DrawBounds,
  ElementType,
  Point,
} from '../types';

const STORAGE_KEY = 'layout-canvas-document';
const DOCUMENT_VERSION = 1;
const ELEMENT_TYPES = new Set<ElementType>([
  'Container',
  'Button',
  'Text',
  'Image',
  'Input',
  'Nav',
  'Note',
]);

interface StoredCanvasDocument {
  version: typeof DOCUMENT_VERSION;
  document: CanvasDocument;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPoint = (value: unknown): value is Point => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return typeof point.boxId === 'string' ||
    (isFiniteNumber(point.x) && isFiniteNumber(point.y));
};

const isBox = (value: unknown): value is Box => {
  if (!value || typeof value !== 'object') return false;
  const box = value as Record<string, unknown>;
  return (
    typeof box.id === 'string' &&
    typeof box.type === 'string' &&
    ELEMENT_TYPES.has(box.type as ElementType) &&
    typeof box.label === 'string' &&
    typeof box.note === 'string' &&
    isFiniteNumber(box.x) &&
    isFiniteNumber(box.y) &&
    isFiniteNumber(box.w) &&
    isFiniteNumber(box.h)
  );
};

const isArrow = (value: unknown): value is Arrow => {
  if (!value || typeof value !== 'object') return false;
  const arrow = value as Record<string, unknown>;
  return (
    typeof arrow.id === 'string' &&
    typeof arrow.note === 'string' &&
    isPoint(arrow.start) &&
    isPoint(arrow.end)
  );
};

const isDrawBounds = (value: unknown): value is DrawBounds => {
  if (!value || typeof value !== 'object') return false;
  const bounds = value as Record<string, unknown>;
  if (
    !isFiniteNumber(bounds.minX) ||
    !isFiniteNumber(bounds.minY) ||
    !isFiniteNumber(bounds.maxX) ||
    !isFiniteNumber(bounds.maxY)
  ) {
    return false;
  }

  return (
    bounds.minX >= 0 &&
    bounds.minY >= 0 &&
    bounds.maxX <= 100 &&
    bounds.maxY <= 100 &&
    bounds.minX < bounds.maxX &&
    bounds.minY < bounds.maxY
  );
};

const isCanvasDocument = (value: unknown): value is CanvasDocument => {
  if (!value || typeof value !== 'object') return false;
  const document = value as Record<string, unknown>;
  return (
    Array.isArray(document.boxes) &&
    document.boxes.every(isBox) &&
    Array.isArray(document.arrows) &&
    document.arrows.every(isArrow) &&
    isDrawBounds(document.drawBounds)
  );
};

export const createEmptyDocument = (drawBounds: DrawBounds): CanvasDocument => ({
  boxes: [],
  arrows: [],
  drawBounds: { ...drawBounds },
});

export const cloneDocument = (document: CanvasDocument): CanvasDocument => ({
  boxes: document.boxes.map((box) => ({ ...box })),
  arrows: document.arrows.map((arrow) => ({
    ...arrow,
    start: { ...arrow.start },
    end: { ...arrow.end },
  })),
  drawBounds: { ...document.drawBounds },
});

export const serializeDocument = (document: CanvasDocument) =>
  JSON.stringify({ version: DOCUMENT_VERSION, document }, null, 2);

export const parseDocument = (serialized: string): CanvasDocument => {
  const stored = JSON.parse(serialized) as Partial<StoredCanvasDocument>;
  if (stored.version !== DOCUMENT_VERSION || !isCanvasDocument(stored.document)) {
    throw new Error('Unsupported or invalid Layout Canvas document');
  }
  return cloneDocument(stored.document);
};

export const loadDocument = (fallbackBounds: DrawBounds): CanvasDocument => {
  if (typeof window === 'undefined') return createEmptyDocument(fallbackBounds);

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized
      ? parseDocument(serialized)
      : createEmptyDocument(fallbackBounds);
  } catch {
    return createEmptyDocument(fallbackBounds);
  }
};

export const saveDocument = (document: CanvasDocument) => {
  try {
    localStorage.setItem(STORAGE_KEY, serializeDocument(document));
  } catch {
    // The in-memory document remains usable when storage is unavailable.
  }
};
