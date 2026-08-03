import { TYPE_CONFIG } from '../constants';
import type { Box, Tool } from '../types';

interface CanvasBoxProps {
  box: Box;
  isSelected: boolean;
  tool: Tool;
  onPointerDown: (e: React.PointerEvent, box: Box) => void;
  onResizePointerDown: (e: React.PointerEvent, box: Box) => void;
}

export function CanvasBox({
  box,
  isSelected,
  tool,
  onPointerDown,
  onResizePointerDown,
}: CanvasBoxProps) {
  const config = TYPE_CONFIG[box.type];

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, box)}
      className={`absolute border-2 flex flex-col cursor-pointer transition-[box-shadow,background,border-radius] duration-150 ${config.border} ${
        isSelected ? 'board-selected-glass z-10' : `${config.bg} z-0`
      }`}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.w}%`,
        height: `${box.h}%`,
        borderRadius: isSelected ? 12 : undefined,
      }}
    >
      <div
        className={`absolute -top-3 left-2 px-1.5 py-0.5 text-[10px] font-mono rounded-md whitespace-nowrap z-[4] ${
          isSelected
            ? 'bg-[var(--accent)] text-white border border-[var(--accent)]'
            : config.labelBg
        }`}
      >
        {box.type}
      </div>
      <div
        className={`relative z-[4] p-2 pt-3 flex-1 overflow-hidden text-xs leading-relaxed ${config.text} ${
          box.type === 'Note' ? 'whitespace-pre-wrap' : 'whitespace-nowrap truncate'
        }`}
      >
        {box.type === 'Note' ? box.note || 'Empty note...' : box.note || box.label}
      </div>
      {isSelected && tool === 'select' && (
        <div
          onPointerDown={(e) => onResizePointerDown(e, box)}
          className="absolute -bottom-1.5 -right-1.5 z-[5] w-3.5 h-3.5 cursor-nwse-resize rounded-full bg-[var(--accent)] border-2 border-white dark:border-[#1c1c1e]"
        />
      )}
    </div>
  );
}
