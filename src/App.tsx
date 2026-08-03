import { useCallback, useEffect, useRef, useState } from 'react';
import { Artboard } from './components/Artboard';
import { DeviceBar } from './components/DeviceBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SplashScreen } from './components/SplashScreen';
import { Toolbar } from './components/Toolbar';
import { generateId } from './constants';
import { useLiquidGL } from './hooks/useLiquidGL';
import { useTheme } from './hooks/useTheme';
import type {
  Arrow,
  Box,
  DeviceType,
  DragState,
  Point,
  Tool,
} from './types';

const SPLASH_KEY = 'layout-canvas-splash-seen';

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

  useLiquidGL(!showSplash, theme);

  const dismissSplash = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  }, []);

  useEffect(() => {
    document.title = 'Layout Canvas';
    const boot = document.getElementById('boot-splash');
    if (boot) boot.remove();
  }, []);

  const getCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(100, (px / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (py / rect.height) * 100)),
    };
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const coords = getCoords(e);

      if (dragState.type === 'draw_box') {
        setDrawCurrent(coords);
      } else if (dragState.type === 'move_box') {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === dragState.boxId
              ? {
                  ...b,
                  x: Math.max(
                    0,
                    Math.min(100 - b.w, dragState.initialBoxX + dx),
                  ),
                  y: Math.max(
                    0,
                    Math.min(100 - b.h, dragState.initialBoxY + dy),
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
                  w: Math.max(
                    2,
                    Math.min(100 - b.x, dragState.initialBoxW + dx),
                  ),
                  h: Math.max(
                    2,
                    Math.min(100 - b.y, dragState.initialBoxH + dy),
                  ),
                }
              : b,
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
  }, [dragState, tool, arrowStart]);

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
      setSelectedId(box.id);
      setDragState({
        type: 'move_box',
        boxId: box.id,
        startX: coords.x,
        startY: coords.y,
        initialBoxX: box.x,
        initialBoxY: box.y,
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

    let spec =
      'LAYOUT SPEC (coordinates are % of canvas, origin top-left)\n\n';

    sortedBoxes.forEach((b, i) => {
      spec += `${i + 1}. [${b.type}] "${b.label}"\n`;
      spec += `   position: x=${Math.round(b.x)}%, y=${Math.round(b.y)}%, size=${Math.round(b.w)}%×${Math.round(b.h)}%\n`;
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
    if (confirm('Clear all elements?')) {
      setBoxes([]);
      setArrows([]);
      setSelectedId(null);
      setTool('select');
      setDragState({ type: 'none' });
      setArrowStart(null);
      setDrawCurrent(null);
    }
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
        arrowStart={arrowStart}
        arrowCurrent={arrowCurrent}
        resolvePoint={resolvePoint}
        onCanvasPointerDown={handleCanvasPointerDown}
        onBoxPointerDown={handleBoxPointerDown}
        onResizePointerDown={handleResizePointerDown}
        onSelectArrow={(id) => {
          setTool('select');
          setSelectedId(id);
        }}
      />

      <div
        data-liquid-ignore
        className="absolute inset-0 pointer-events-none z-30 flex p-4 sm:p-6 lg:p-8 gap-4 sm:gap-6"
      >
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
    </div>
  );
}
