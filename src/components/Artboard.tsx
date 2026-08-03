import { forwardRef } from 'react';
import { DEVICE_SIZE } from '../constants';
import type { Arrow, Box, DeviceType, DragState, Point, Tool } from '../types';
import { ArrowsOverlay } from './ArrowsOverlay';
import { CanvasBox } from './CanvasBox';

interface ArtboardProps {
  device: DeviceType;
  tool: Tool;
  boxes: Box[];
  arrows: Arrow[];
  selectedId: string | null;
  dragState: DragState;
  drawCurrent: { x: number; y: number } | null;
  arrowStart: Point | null;
  arrowCurrent: { x: number; y: number } | null;
  resolvePoint: (p: Point) => { x: number; y: number } | null;
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onBoxPointerDown: (e: React.PointerEvent, box: Box) => void;
  onResizePointerDown: (e: React.PointerEvent, box: Box) => void;
  onSelectArrow: (id: string) => void;
}

export const Artboard = forwardRef<HTMLDivElement, ArtboardProps>(
  function Artboard(
    {
      device,
      tool,
      boxes,
      arrows,
      selectedId,
      dragState,
      drawCurrent,
      arrowStart,
      arrowCurrent,
      resolvePoint,
      onCanvasPointerDown,
      onBoxPointerDown,
      onResizePointerDown,
      onSelectArrow,
    },
    ref,
  ) {
    const size = DEVICE_SIZE[device];

    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 overflow-hidden">
        <div
          ref={ref}
          onPointerDown={onCanvasPointerDown}
          className={`relative overflow-hidden touch-none transition-all duration-300 ease-in-out shrink-0 ring-1 ring-black/5 ${
            device === 'desktop' ? 'w-full h-full' : 'rounded-3xl'
          }`}
          style={{
            cursor: tool === 'select' ? 'default' : 'crosshair',
            width: size.width,
            height: size.height,
            backgroundColor: 'var(--board-bg)',
            backgroundImage:
              'radial-gradient(var(--board-dot) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            boxShadow: 'var(--board-shadow)',
          }}
        >

          {boxes.map((box) => (
            <CanvasBox
              key={box.id}
              box={box}
              isSelected={selectedId === box.id}
              tool={tool}
              onPointerDown={onBoxPointerDown}
              onResizePointerDown={onResizePointerDown}
            />
          ))}

          {dragState.type === 'draw_box' && drawCurrent && (
            <div
              className="absolute border-2 border-zinc-900/50 dark:border-zinc-100/50 border-dashed bg-zinc-900/5 dark:bg-zinc-100/5 pointer-events-none z-20"
              style={{
                left: `${Math.min(dragState.start.x, drawCurrent.x)}%`,
                top: `${Math.min(dragState.start.y, drawCurrent.y)}%`,
                width: `${Math.abs(drawCurrent.x - dragState.start.x)}%`,
                height: `${Math.abs(drawCurrent.y - dragState.start.y)}%`,
              }}
            />
          )}

          <ArrowsOverlay
            arrows={arrows}
            selectedId={selectedId}
            tool={tool}
            arrowStart={arrowStart}
            arrowCurrent={arrowCurrent}
            resolvePoint={resolvePoint}
            onSelectArrow={onSelectArrow}
          />
        </div>
      </div>
    );
  },
);
