import { Move } from 'lucide-react';
import { forwardRef } from 'react';
import { DEVICE_SIZE } from '../constants';
import type {
  Arrow,
  BoundaryEdge,
  Box,
  DeviceType,
  DragState,
  DrawBounds,
  Point,
  Tool,
} from '../types';
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
  drawBounds: DrawBounds;
  arrowStart: Point | null;
  arrowCurrent: { x: number; y: number } | null;
  resolvePoint: (p: Point) => { x: number; y: number } | null;
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onBoxPointerDown: (e: React.PointerEvent, box: Box) => void;
  onResizePointerDown: (e: React.PointerEvent, box: Box) => void;
  onBoundaryMovePointerDown: (e: React.PointerEvent) => void;
  onBoundaryResizePointerDown: (
    e: React.PointerEvent,
    edge: BoundaryEdge,
  ) => void;
  onArrowPointerDown: (e: React.PointerEvent, arrow: Arrow) => void;
  onArrowEndpointPointerDown: (
    e: React.PointerEvent,
    arrowId: string,
    endpoint: 'start' | 'end',
  ) => void;
  onSelectArrow: (id: string) => void;
}

function DrawingBoundary({
  bounds,
  dragState,
  isInteractive,
  onMovePointerDown,
  onResizePointerDown,
}: {
  bounds: DrawBounds;
  dragState: DragState;
  isInteractive: boolean;
  onMovePointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent, edge: BoundaryEdge) => void;
}) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const isMoveHandleInside = bounds.maxY > 95;
  const horizontalPattern = {
    backgroundImage:
      'repeating-linear-gradient(to right, var(--boundary-ruler) 0 1px, transparent 1px 10px), repeating-linear-gradient(to right, var(--boundary-line) 0 1px, transparent 1px 50px)',
    backgroundRepeat: 'repeat-x',
    backgroundSize: '10px 4px, 50px 8px',
  };
  const verticalPattern = {
    backgroundImage:
      'repeating-linear-gradient(to bottom, var(--boundary-ruler) 0 1px, transparent 1px 10px), repeating-linear-gradient(to bottom, var(--boundary-line) 0 1px, transparent 1px 50px)',
    backgroundRepeat: 'repeat-y',
    backgroundSize: '4px 10px, 8px 50px',
  };

  const renderRuler = (edge: BoundaryEdge) => {
    const isHorizontal = edge === 'top' || edge === 'bottom';
    const isActive =
      dragState.type === 'resize_bounds' && dragState.edge === edge;
    const position = isHorizontal
      ? {
          left: `${bounds.minX}%`,
          top: `${edge === 'top' ? bounds.minY : bounds.maxY}%`,
          width: `${width}%`,
          height: 28,
          transform: 'translateY(-50%)',
        }
      : {
          left: `${edge === 'left' ? bounds.minX : bounds.maxX}%`,
          top: `${bounds.minY}%`,
          width: 28,
          height: `${height}%`,
          transform: 'translateX(-50%)',
        };
    const trackClass = [
      'absolute border-[var(--boundary-line)] transition-opacity',
      isActive ? 'opacity-100' : 'opacity-65 group-hover:opacity-100',
      edge === 'top' && 'left-0 right-0 top-1/2 h-2 border-t',
      edge === 'bottom' && 'left-0 right-0 bottom-1/2 h-2 border-b',
      edge === 'left' && 'top-0 bottom-0 left-1/2 w-2 border-l',
      edge === 'right' && 'top-0 bottom-0 right-1/2 w-2 border-r',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={edge}
        type="button"
        aria-label={`Adjust ${edge} drawing ruler`}
        title={`Drag to adjust the ${edge} drawing ruler`}
        onPointerDown={(event) => onResizePointerDown(event, edge)}
        className={`group absolute z-30 touch-none border-0 bg-transparent p-0 ${
          isHorizontal ? 'cursor-ns-resize' : 'cursor-ew-resize'
        }`}
        style={{
          ...position,
          pointerEvents: isInteractive ? 'auto' : 'none',
        }}
      >
        <span
          aria-hidden="true"
          className={trackClass}
          style={isHorizontal ? horizontalPattern : verticalPattern}
        />
      </button>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {(['top', 'right', 'bottom', 'left'] as BoundaryEdge[]).map(renderRuler)}
      <button
        type="button"
        aria-label="Move drawing boundary"
        title="Drag to move the drawing boundary"
        onPointerDown={onMovePointerDown}
        className={`selected-glass absolute z-30 grid h-8 w-8 touch-none place-items-center rounded-full cursor-move transition-opacity ${
          dragState.type === 'move_bounds'
            ? 'opacity-100'
            : 'opacity-75 hover:opacity-100'
        }`}
        style={{
          left: `${bounds.minX + width / 2}%`,
          top: `${bounds.maxY}%`,
          transform: isMoveHandleInside
            ? 'translate(-50%, calc(-100% - 8px))'
            : 'translate(-50%, 8px)',
          pointerEvents: isInteractive ? 'auto' : 'none',
        }}
      >
        <Move size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
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
      drawBounds,
      arrowStart,
      arrowCurrent,
      resolvePoint,
      onCanvasPointerDown,
      onBoxPointerDown,
      onResizePointerDown,
      onBoundaryMovePointerDown,
      onBoundaryResizePointerDown,
      onArrowPointerDown,
      onArrowEndpointPointerDown,
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
          className={[
            'relative overflow-hidden touch-none transition-all duration-300 ease-in-out shrink-0 ring-1 ring-black/5',
            device === 'desktop' ? 'w-full h-full' : 'rounded-3xl',
          ].join(' ')}
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
          <DrawingBoundary
            bounds={drawBounds}
            dragState={dragState}
            isInteractive={tool === 'select'}
            onMovePointerDown={onBoundaryMovePointerDown}
            onResizePointerDown={onBoundaryResizePointerDown}
          />

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
                left: Math.min(dragState.start.x, drawCurrent.x) + '%',
                top: Math.min(dragState.start.y, drawCurrent.y) + '%',
                width: Math.abs(drawCurrent.x - dragState.start.x) + '%',
                height: Math.abs(drawCurrent.y - dragState.start.y) + '%',
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
            onArrowPointerDown={onArrowPointerDown}
            onArrowEndpointPointerDown={onArrowEndpointPointerDown}
          />
        </div>
      </div>
    );
  },
);
