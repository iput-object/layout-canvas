export type ElementType =
  | 'Container'
  | 'Button'
  | 'Text'
  | 'Image'
  | 'Input'
  | 'Nav'
  | 'Note';

export type Tool = 'select' | 'box' | 'arrow';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface Box {
  id: string;
  type: ElementType;
  label: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  boxId?: string;
  x?: number;
  y?: number;
}

export interface Arrow {
  id: string;
  start: Point;
  end: Point;
  note: string;
}

export interface DrawBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CanvasDocument {
  boxes: Box[];
  arrows: Arrow[];
  drawBounds: DrawBounds;
}

export type BoundaryEdge = 'top' | 'right' | 'bottom' | 'left';

export type DragState =
  | { type: 'none' }
  | { type: 'draw_box'; start: { x: number; y: number } }
  | {
      type: 'move_bounds';
      startX: number;
      startY: number;
      initialBounds: DrawBounds;
      contentBounds: DrawBounds | null;
    }
  | {
      type: 'resize_bounds';
      edge: BoundaryEdge;
      initialBounds: DrawBounds;
      contentBounds: DrawBounds | null;
    }
  | {
      type: 'move_box';
      boxId: string;
      startX: number;
      startY: number;
      initialBoxX: number;
      initialBoxY: number;
    }
  | {
      type: 'move_arrow_point';
      arrowId: string;
      endpoint: 'start' | 'end';
    }
  | {
      type: 'move_arrow';
      arrowId: string;
      startX: number;
      startY: number;
      initialStart: { x: number; y: number };
      initialEnd: { x: number; y: number };
    }
  | {
      type: 'resize_box';
      boxId: string;
      startX: number;
      startY: number;
      initialBoxW: number;
      initialBoxH: number;
    };
