import { Eye, EyeOff, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Artboard } from './components/Artboard';
import { DeviceBar } from './components/DeviceBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SplashScreen } from './components/SplashScreen';
import { Toolbar } from './components/Toolbar';
import { loadDocument, saveDocument } from './canvas/document';
import {
  clamp,
  clampPointToBounds,
  getContentBounds,
  resizeDrawBounds,
  resolvePoint as resolveCanvasPoint,
} from './canvas/geometry';
import { generateLayoutSpec } from './canvas/spec';
import { generateId, getDefaultDrawBounds } from './constants';
import { useDocumentHistory } from './hooks/useDocumentHistory';
import { useTheme } from './hooks/useTheme';
import type {
  Arrow,
  BoundaryEdge,
  Box,
  CanvasDocument,
  DeviceType,
  DragState,
  DrawBounds,
  Point,
  Tool,
} from './types';

const SPLASH_KEY = 'layout-canvas-splash-seen';
const TOOL_SHORTCUTS: Partial<Record<string, Tool>> = {
  v: 'select',
  b: 'box',
  a: 'arrow',
};

const getViewportWidth = () =>
  typeof window === 'undefined' ? 1280 : window.innerWidth;

const hasSeenSplash = () => {
  if (typeof window === 'undefined') return false;

  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return false;
  }
};

const writeClipboardText = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall back for browsers that expose Clipboard API without granting access.
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const didCopy = document.execCommand('copy');
  textarea.remove();

  if (!didCopy) throw new Error('Clipboard copy failed');
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [initialDocument] = useState(() =>
    loadDocument(getDefaultDrawBounds(getViewportWidth())),
  );
  const [showSplash, setShowSplash] = useState(() => !hasSeenSplash());
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [boxes, setBoxes] = useState<Box[]>(initialDocument.boxes);
  const [arrows, setArrows] = useState<Arrow[]>(initialDocument.arrows);
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mobileInspectorVisible, setMobileInspectorVisible] = useState(false);
  const [drawBounds, setDrawBounds] = useState<DrawBounds>(
    initialDocument.drawBounds,
  );

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
  const copiedTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawBoundsRef = useRef(drawBounds);
  drawBoundsRef.current = drawBounds;

  const applyDocument = useCallback((document: CanvasDocument) => {
    setBoxes(document.boxes);
    setArrows(document.arrows);
    setDrawBounds(document.drawBounds);
    setSelectedId(null);
    setDragState({ type: 'none' });
    setDrawCurrent(null);
    setArrowStart(null);
    setArrowCurrent(null);
  }, []);

  const {
    beginTransaction,
    canRedo,
    canUndo,
    commitTransaction,
    recordChange,
    redo,
    undo,
  } = useDocumentHistory({ boxes, arrows, drawBounds }, applyDocument);

  const dismissSplash = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      // Storage can be unavailable in restricted browser modes.
    }
    setShowSplash(false);
  }, []);

  const changeTool = useCallback((nextTool: Tool) => {
    setTool(nextTool);
    setDragState({ type: 'none' });
    setDrawCurrent(null);
    setArrowStart(null);
    setArrowCurrent(null);
  }, []);

  useEffect(() => {
    document.title = 'Layout Canvas';
    const boot = document.getElementById('boot-splash');
    if (boot) boot.remove();
  }, []);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveDocument({ boxes, arrows, drawBounds });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [arrows, boxes, drawBounds]);

  const getCanvasCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return {
      x: clamp((px / rect.width) * 100, 0, 100),
      y: clamp((py / rect.height) * 100, 0, 100),
    };
  };

  const getCoords = (e: React.PointerEvent | PointerEvent) =>
    clampPointToBounds(getCanvasCoords(e), drawBoundsRef.current);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const canvasCoords = getCanvasCoords(e);
      const activeBounds = drawBoundsRef.current;
      const coords = clampPointToBounds(canvasCoords, activeBounds);

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
                    activeBounds.minX,
                    activeBounds.maxX - b.w,
                  ),
                  y: clamp(
                    dragState.initialBoxY + dy,
                    activeBounds.minY,
                    activeBounds.maxY - b.h,
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
                    activeBounds.maxX - b.x,
                  ),
                  h: clamp(
                    dragState.initialBoxH + dy,
                    2,
                    activeBounds.maxY - b.y,
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
        const dx = clamp(
          rawDx,
          activeBounds.minX - minX,
          activeBounds.maxX - maxX,
        );
        const dy = clamp(
          rawDy,
          activeBounds.minY - minY,
          activeBounds.maxY - maxY,
        );

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
          recordChange();
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
      } else {
        commitTransaction();
      }
      setDragState({ type: 'none' });
    };

    const handleCancel = () => {
      if (dragState.type === 'draw_box') setDrawCurrent(null);
      else commitTransaction();
      setDragState({ type: 'none' });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    window.addEventListener('blur', handleCancel);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
      window.removeEventListener('blur', handleCancel);
    };
  }, [
    arrowStart,
    commitTransaction,
    dragState,
    recordChange,
    tool,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      )
        return;

      const hasCommandModifier = e.ctrlKey || e.metaKey;
      if (hasCommandModifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (hasCommandModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          recordChange();
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
          setDragState({ type: 'none' });
        }
      }
      if (e.key === 'Escape') {
        changeTool('select');
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const nextTool = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (nextTool) {
          e.preventDefault();
          changeTool(nextTool);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeTool, recordChange, redo, selectedId, undo]);

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
        recordChange();
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
      beginTransaction();
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
        recordChange();
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
    if (e.button !== 0) return;
    e.stopPropagation();
    beginTransaction();
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
    beginTransaction();
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
    beginTransaction();
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
    if (!e.altKey && (arrow.start.boxId || arrow.end.boxId)) {
      setSelectedId(arrow.id);
      setTool('select');
      return;
    }

    beginTransaction();
    const activeArrow = e.altKey
      ? { ...arrow, id: generateId(), start, end }
      : { ...arrow, start, end };

    if (e.altKey) {
      setArrows((prev) => [...prev, activeArrow]);
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
    beginTransaction();
    setSelectedId(arrowId);
    setTool('select');
    setDragState({ type: 'move_arrow_point', arrowId, endpoint });
  };

  const updateBox = (id: string, updates: Partial<Box>) => {
    recordChange();
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const updateArrow = (id: string, updates: Partial<Arrow>) => {
    recordChange();
    setArrows((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  };

  const resolvePoint = (point: Point) => resolveCanvasPoint(point, boxes);

  const getPointLabel = (p: Point) => {
    if (p.boxId) {
      const box = boxes.find((b) => b.id === p.boxId);
      return box ? `"${box.label}"` : '"Unknown Element"';
    }
    return 'free point';
  };

  const copySpec = async () => {
    const spec = generateLayoutSpec({ boxes, arrows, drawBounds });

    try {
      await writeClipboardText(spec);
      setCopied(true);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const clearAll = () => {
    const defaultBounds = getDefaultDrawBounds(getViewportWidth());
    const boundaryIsDefault =
      drawBounds.minX === defaultBounds.minX &&
      drawBounds.minY === defaultBounds.minY &&
      drawBounds.maxX === defaultBounds.maxX &&
      drawBounds.maxY === defaultBounds.maxY;
    if (boxes.length === 0 && arrows.length === 0 && boundaryIsDefault) return;

    recordChange();
    setBoxes([]);
    setArrows([]);
    setSelectedId(null);
    setTool('select');
    setDragState({ type: 'none' });
    setArrowStart(null);
    setArrowCurrent(null);
    setDrawCurrent(null);
    setDrawBounds(defaultBounds);
  };

  const selectedBox = boxes.find((b) => b.id === selectedId);
  const selectedArrow = arrows.find((a) => a.id === selectedId);

  return (
    <div
      className="h-screen h-dvh w-screen overflow-hidden select-none relative bg-[var(--app-bg)] text-[var(--text)]"
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
      />

      <button
        type="button"
        aria-label={controlsVisible ? 'Hide options' : 'Show options'}
        title={controlsVisible ? 'Hide options' : 'Show options'}
        onClick={() => {
          setControlsVisible((visible) => !visible);
          setMobileInspectorVisible(false);
        }}
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
            canRedo={canRedo}
            canUndo={canUndo}
            onToolChange={changeTool}
            onClear={clearAll}
            onRedo={redo}
            onToggleTheme={toggleTheme}
            onUndo={undo}
          />
          <DeviceBar device={device} onDeviceChange={setDevice} />
          {mobileInspectorVisible && (
            <button
              type="button"
              aria-label="Close properties"
              onClick={() => setMobileInspectorVisible(false)}
              className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[2px] pointer-events-auto lg:hidden"
            />
          )}
          <div
            className={`${
              mobileInspectorVisible ? 'block' : 'hidden'
            } absolute inset-x-4 top-20 bottom-20 z-40 pointer-events-auto sm:inset-x-6 lg:static lg:block lg:w-[300px] lg:h-full lg:shrink-0`}
          >
            <PropertiesPanel
              boxes={boxes}
              arrows={arrows}
              drawBounds={drawBounds}
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
          <button
            type="button"
            aria-label={
              mobileInspectorVisible ? 'Close properties' : 'Open properties'
            }
            title={
              mobileInspectorVisible ? 'Close properties' : 'Open properties'
            }
            onClick={() =>
              setMobileInspectorVisible((visible) => !visible)
            }
            className="selected-glass absolute right-4 bottom-4 z-50 grid h-10 w-10 place-items-center rounded-full pointer-events-auto sm:right-6 sm:bottom-6 lg:hidden"
          >
            {mobileInspectorVisible ? (
              <X size={17} strokeWidth={1.75} />
            ) : (
              <SlidersHorizontal size={17} strokeWidth={1.75} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
