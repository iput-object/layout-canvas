import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Artboard } from './components/Artboard';
import { DeviceBar } from './components/DeviceBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SplashScreen } from './components/SplashScreen';
import { Toolbar } from './components/Toolbar';
import { DRAW_BOUNDS, generateId } from './constants';
import { useTheme } from './hooks/useTheme';
import type {
  Arrow,
  BoundaryEdge,
  Box,
  DeviceType,
  DragState,
  DrawBounds,
  Point,
  Tool,
} from './types';

const SPLASH_KEY = 'layout-canvas-splash-seen';
const MIN_DRAW_BOUNDS_SIZE = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const clampPointToBounds = (
  { x, y }: { x: number; y: number },
  bounds: DrawBounds,
) => ({
  x: clamp(x, bounds.minX, bounds.maxX),
  y: clamp(y, bounds.minY, bounds.maxY),
});

const getPointCoordinates = (
  point: Point,
  boxesById: Map<string, Box>,
): { x: number; y: number } | null => {
  if (point.boxId) {
    const box = boxesById.get(point.boxId);
    return box ? { x: box.x + box.w / 2, y: box.y + box.h / 2 } : null;
  }

  return point.x === undefined || point.y === undefined
    ? null
    : { x: point.x, y: point.y };
};

const getContentBounds = (boxes: Box[], arrows: Arrow[]): DrawBounds | null => {
  const boxesById = new Map(boxes.map((box) => [box.id, box]));
  const boxCorners = boxes.flatMap((box) => [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
  ]);
  const arrowPoints = arrows.flatMap((arrow) =>
    [arrow.start, arrow.end]
      .map((point) => getPointCoordinates(point, boxesById))
      .filter((point): point is { x: number; y: number } => point !== null),
  );
  const points = [...boxCorners, ...arrowPoints];

  if (points.length === 0) return null;

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

const resizeDrawBounds = (
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

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(SPLASH_KEY) !== '1';
  });
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [drawBounds, setDrawBounds] = useState<DrawBounds>(DRAW_BOUNDS);

  const [dragState, setDragState] = useState<DragState>({ type: 'none' });
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(
    null,
  );

  const [arrowStart, setArrowStart] = useState<Point | null>(null);
  const [arrowCurrent, setArrowCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dismissSplash = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  }, []);

  useEffect(() => {
    document.title = 'Layout Canvas';
    const boot = document.getElementById('boot-splash');
    if (boot) boot.remove();
  }, []);

  const getCanvasCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return {
      x: clamp((px / rect.width) * 100, 0, 100),
      y: clamp((py / rect.height) * 100, 0, 100),
    };
  };

  const getCoords = (e: React.PointerEvent | PointerEvent) =>
    clampPointToBounds(getCanvasCoords(e), drawBounds);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const canvasCoords = getCanvasCoords(e);
      const coords = clampPointToBounds(canvasCoords, drawBounds);

      if (dragState.type === 'move_bounds') {
        const rawDx = canvasCoords.x - dragState.startX;
        const rawDy = canvasCoords.y - dragState.startY;
        const contentBounds = dragState.contentBounds;
        const dx = clamp(
          rawDx,
          Math.max(
            -dragState.initialBounds.minX,
            contentBounds
              ? contentBounds.maxX - dragState.initialBounds.maxX
              : -Infinity,
          ),
          Math.min(
            100 - dragState.initialBounds.maxX,
            contentBounds
              ? contentBounds.minX - dragState.initialBounds.minX
              : Infinity,
          ),
        );
        const dy = clamp(
          rawDy,
          Math.max(
            -dragState.initialBounds.minY,
            contentBounds
              ? contentBounds.maxY - dragState.initialBounds.maxY
              : -Infinity,
          ),
          Math.min(
            100 - dragState.initialBounds.maxY,
            contentBounds
              ? contentBounds.minY - dragState.initialBounds.minY
              : Infinity,
          ),
        );

        setDrawBounds({
          minX: dragState.initialBounds.minX + dx,
          minY: dragState.initialBounds.minY + dy,
          maxX: dragState.initialBounds.maxX + dx,
          maxY: dragState.initialBounds.maxY + dy,
        });
      } else if (dragState.type === 'resize_bounds') {
        setDrawBounds(
          resizeDrawBounds(
            dragState.initialBounds,
            dragState.edge,
            canvasCoords,
            dragState.contentBounds,
          ),
        );
      } else if (dragState.type === 'draw_box') {
        setDrawCurrent(coords);
      } else if (dragState.type === 'move_box') {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === dragState.boxId
              ? {
                  ...b,
                  x: clamp(
                    dragState.initialBoxX + dx,
                    drawBounds.minX,
                    drawBounds.maxX - b.w,
                  ),
                  y: clamp(
                    dragState.initialBoxY + dy,
                    drawBounds.minY,
                    drawBounds.maxY - b.h,
                  ),
                }
              : b,
          ),
        );
      } else if (dragState.type === 'resize_box') {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === dragState.boxId
              ? {
                  ...b,
                  w: clamp(
                    dragState.initialBoxW + dx,
                    2,
                    drawBounds.maxX - b.x,
                  ),
                  h: clamp(
                    dragState.initialBoxH + dy,
                    2,
                    drawBounds.maxY - b.y,
                  ),
                }
              : b,
          ),
        );
      } else if (dragState.type === 'move_arrow') {
        const rawDx = coords.x - dragState.startX;
        const rawDy = coords.y - dragState.startY;
        const minX = Math.min(dragState.initialStart.x, dragState.initialEnd.x);
        const maxX = Math.max(dragState.initialStart.x, dragState.initialEnd.x);
        const minY = Math.min(dragState.initialStart.y, dragState.initialEnd.y);
        const maxY = Math.max(dragState.initialStart.y, dragState.initialEnd.y);
        const dx = clamp(rawDx, drawBounds.minX - minX, drawBounds.maxX - maxX);
        const dy = clamp(rawDy, drawBounds.minY - minY, drawBounds.maxY - maxY);

        setArrows((prev) =>
          prev.map((a) =>
            a.id === dragState.arrowId
              ? {
                  ...a,
                  start: {
                    x: dragState.initialStart.x + dx,
                    y: dragState.initialStart.y + dy,
                  },
                  end: {
                    x: dragState.initialEnd.x + dx,
                    y: dragState.initialEnd.y + dy,
                  },
                }
              : a,
          ),
        );
      } else if (dragState.type === 'move_arrow_point') {
        setArrows((prev) =>
          prev.map((a) =>
            a.id === dragState.arrowId
              ? { ...a, [dragState.endpoint]: { x: coords.x, y: coords.y } }
              : a,
          ),
        );
      } else if (tool === 'arrow' && arrowStart) {
        setArrowCurrent(coords);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (dragState.type === 'draw_box') {
        const coords = getCoords(e);
        const w = Math.abs(coords.x - dragState.start.x);
        const h = Math.abs(coords.y - dragState.start.y);
        if (w > 1 && h > 1) {
          const id = generateId();
          setBoxes((prev) => [
            ...prev,
            {
              id,
              type: 'Container',
              label: 'New element',
              note: '',
              x: Math.min(dragState.start.x, coords.x),
              y: Math.min(dragState.start.y, coords.y),
              w,
              h,
            },
          ]);
          setSelectedId(id);
          setTool('select');
        }
        setDrawCurrent(null);
      }
      setDragState({ type: 'none' });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState, tool, arrowStart, drawBounds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          setBoxes((prev) => prev.filter((b) => b.id !== selectedId));
          setArrows((prev) =>
            prev.filter(
              (a) =>
                a.id !== selectedId &&
                a.start.boxId !== selectedId &&
                a.end.boxId !== selectedId,
            ),
          );
          setSelectedId(null);
        }
      }
      if (e.key === 'Escape') {
        setDragState({ type: 'none' });
        setDrawCurrent(null);
        setArrowStart(null);
        setArrowCurrent(null);
        setTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const coords = getCoords(e);

    if (tool === 'select') {
      setSelectedId(null);
    } else if (tool === 'box') {
      setDragState({ type: 'draw_box', start: coords });
      setDrawCurrent(coords);
    } else if (tool === 'arrow') {
      if (!arrowStart) {
        setArrowStart({ x: coords.x, y: coords.y });
        setArrowCurrent({ x: coords.x, y: coords.y });
      } else {
        const newArrow: Arrow = {
          id: generateId(),
          start: arrowStart,
          end: { x: coords.x, y: coords.y },
          note: '',
        };
        setArrows((prev) => [...prev, newArrow]);
        setArrowStart(null);
        setArrowCurrent(null);
        setTool('select');
        setSelectedId(newArrow.id);
      }
    }
  };

  const handleBoxPointerDown = (e: React.PointerEvent, box: Box) => {
    if (e.button !== 0) return;
    const coords = getCoords(e);

    if (tool === 'select') {
      e.stopPropagation();
      const activeBox = e.altKey
        ? { ...box, id: generateId(), label: box.label + ' copy' }
        : box;

      if (e.altKey) {
        setBoxes((prev) => [...prev, activeBox]);
      }

      setSelectedId(activeBox.id);
      setDragState({
        type: 'move_box',
        boxId: activeBox.id,
        startX: coords.x,
        startY: coords.y,
        initialBoxX: activeBox.x,
        initialBoxY: activeBox.y,
      });
    } else if (tool === 'arrow') {
      e.stopPropagation();
      if (!arrowStart) {
        setArrowStart({ boxId: box.id });
        setArrowCurrent(coords);
      } else {
        const newArrow: Arrow = {
          id: generateId(),
          start: arrowStart,
          end: { boxId: box.id },
          note: '',
        };
        setArrows((prev) => [...prev, newArrow]);
        setArrowStart(null);
        setArrowCurrent(null);
        setTool('select');
        setSelectedId(newArrow.id);
      }
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent, box: Box) => {
    e.stopPropagation();
    const coords = getCoords(e);
    setDragState({
      type: 'resize_box',
      boxId: box.id,
      startX: coords.x,
      startY: coords.y,
      initialBoxW: box.w,
      initialBoxH: box.h,
    });
  };

  const handleBoundaryMovePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || tool !== 'select') return;
    e.stopPropagation();
    const coords = getCanvasCoords(e);
    setSelectedId(null);
    setDragState({
      type: 'move_bounds',
      startX: coords.x,
      startY: coords.y,
      initialBounds: drawBounds,
      contentBounds: getContentBounds(boxes, arrows),
    });
  };

  const handleBoundaryResizePointerDown = (
    e: React.PointerEvent,
    edge: BoundaryEdge,
  ) => {
    if (e.button !== 0 || tool !== 'select') return;
    e.stopPropagation();
    setSelectedId(null);
    setDragState({
      type: 'resize_bounds',
      edge,
      initialBounds: drawBounds,
      contentBounds: getContentBounds(boxes, arrows),
    });
  };

  const handleArrowPointerDown = (e: React.PointerEvent, arrow: Arrow) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const start = resolvePoint(arrow.start);
    const end = resolvePoint(arrow.end);
    if (!start || !end) return;

    const coords = getCoords(e);
    const activeArrow = e.altKey
      ? { ...arrow, id: generateId(), start, end }
      : { ...arrow, start, end };

    if (e.altKey) {
      setArrows((prev) => [...prev, activeArrow]);
    } else if (arrow.start.boxId || arrow.end.boxId) {
      setArrows((prev) =>
        prev.map((a) => (a.id === arrow.id ? activeArrow : a)),
      );
    }

    setSelectedId(activeArrow.id);
    setTool('select');
    setDragState({
      type: 'move_arrow',
      arrowId: activeArrow.id,
      startX: coords.x,
      startY: coords.y,
      initialStart: start,
      initialEnd: end,
    });
  };

  const handleArrowEndpointPointerDown = (
    e: React.PointerEvent,
    arrowId: string,
    endpoint: 'start' | 'end',
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedId(arrowId);
    setTool('select');
    setDragState({ type: 'move_arrow_point', arrowId, endpoint });
  };

  const updateBox = (id: string, updates: Partial<Box>) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const updateArrow = (id: string, updates: Partial<Arrow>) => {
    setArrows((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  };

  const resolvePoint = (p: Point): { x: number; y: number } | null => {
    if (p.boxId) {
      const b = boxes.find((bx) => bx.id === p.boxId);
      if (b) return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      return null;
    }
    return { x: p.x!, y: p.y! };
  };

  const getPointLabel = (p: Point) => {
    if (p.boxId) {
      const box = boxes.find((b) => b.id === p.boxId);
      return box ? `"${box.label}"` : '"Unknown Element"';
    }
    return 'free point';
  };

  const copySpec = () => {
    const sortedBoxes = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);

    const boundsWidth = drawBounds.maxX - drawBounds.minX;
    const boundsHeight = drawBounds.maxY - drawBounds.minY;

    let spec =
      "LAYOUT SPEC (coordinates are % of drawable boundary)\n\n";
    spec +=
      "Drawable boundary: x=" +
      Math.round(drawBounds.minX) +
      "%-" +
      Math.round(drawBounds.maxX) +
      "%, y=" +
      Math.round(drawBounds.minY) +
      "%-" +
      Math.round(drawBounds.maxY) +
      "%\n\n";

    sortedBoxes.forEach((b, i) => {
      spec += `${i + 1}. [${b.type}] "${b.label}"\n`;
      const relativeX = ((b.x - drawBounds.minX) / boundsWidth) * 100;
      const relativeY = ((b.y - drawBounds.minY) / boundsHeight) * 100;
      const relativeW = (b.w / boundsWidth) * 100;
      const relativeH = (b.h / boundsHeight) * 100;

      spec +=
        "   position: x=" +
        Math.round(relativeX) +
        "%, y=" +
        Math.round(relativeY) +
        "%, size=" +
        Math.round(relativeW) +
        "%×" +
        Math.round(relativeH) +
        "%\n";
      if (b.note) spec += `   note: ${b.note}\n`;
      spec += '\n';
    });

    if (arrows.length > 0) {
      spec += 'RELATIONSHIPS / POINTERS:\n';
      arrows.forEach((a) => {
        spec += `- ${getPointLabel(a.start)} → ${getPointLabel(a.end)}`;
        if (a.note) spec += `: ${a.note}`;
        spec += '\n';
      });
    }

    navigator.clipboard.writeText(spec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setBoxes([]);
    setArrows([]);
    setSelectedId(null);
    setTool('select');
    setDragState({ type: 'none' });
    setArrowStart(null);
    setDrawCurrent(null);
    setDrawBounds(DRAW_BOUNDS);
  };

  const selectedBox = boxes.find((b) => b.id === selectedId);
  const selectedArrow = arrows.find((a) => a.id === selectedId);

  return (
    <div
      className="h-screen w-screen overflow-hidden select-none relative bg-[var(--app-bg)] text-[var(--text)]"
      style={{ fontFamily: 'var(--font)' }}
    >
      {showSplash && <SplashScreen onDone={dismissSplash} />}

      <Artboard
        ref={canvasRef}
        device={device}
        tool={tool}
        boxes={boxes}
        arrows={arrows}
        selectedId={selectedId}
        dragState={dragState}
        drawCurrent={drawCurrent}
        drawBounds={drawBounds}
        arrowStart={arrowStart}
        arrowCurrent={arrowCurrent}
        resolvePoint={resolvePoint}
        onCanvasPointerDown={handleCanvasPointerDown}
        onBoxPointerDown={handleBoxPointerDown}
        onResizePointerDown={handleResizePointerDown}
        onBoundaryMovePointerDown={handleBoundaryMovePointerDown}
        onBoundaryResizePointerDown={handleBoundaryResizePointerDown}
        onArrowPointerDown={handleArrowPointerDown}
        onArrowEndpointPointerDown={handleArrowEndpointPointerDown}
        onSelectArrow={(id) => {
          setTool('select');
          setSelectedId(id);
        }}
      />

      <button
        type="button"
        title={controlsVisible ? "Hide options" : "Show options"}
        onClick={() => setControlsVisible((visible) => !visible)}
        className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 lg:left-8 lg:bottom-8 z-40 pointer-events-auto p-2.5 rounded-full selected-glass"
      >
        {controlsVisible ? (
          <EyeOff size={17} strokeWidth={1.75} />
        ) : (
          <Eye size={17} strokeWidth={1.75} />
        )}
      </button>

      {controlsVisible && (
        <div className="absolute inset-0 pointer-events-none z-30 flex p-4 sm:p-6 lg:p-8 gap-4 sm:gap-6">
        <Toolbar
          tool={tool}
          theme={theme}
          onToolChange={setTool}
          onClear={clearAll}
          onToggleTheme={toggleTheme}
        />
        <DeviceBar device={device} onDeviceChange={setDevice} />
        <PropertiesPanel
          boxes={boxes}
          selectedId={selectedId}
          selectedBox={selectedBox}
          selectedArrow={selectedArrow}
          copied={copied}
          getPointLabel={getPointLabel}
          onSelect={(id) => {
            setSelectedId(id);
            setTool('select');
          }}
          onUpdateBox={updateBox}
          onUpdateArrow={updateArrow}
          onCopySpec={copySpec}
        />
        </div>
      )}
    </div>
  );
}
