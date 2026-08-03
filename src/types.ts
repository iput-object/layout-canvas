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

export type DragState =
  | { type: 'none' }
  | { type: 'draw_box'; start: { x: number; y: number } }
  | {
      type: 'move_box';
      boxId: string;
      startX: number;
      startY: number;
      initialBoxX: number;
      initialBoxY: number;
    }
  | {
      type: 'resize_box';
      boxId: string;
      startX: number;
      startY: number;
      initialBoxW: number;
      initialBoxH: number;
    };
