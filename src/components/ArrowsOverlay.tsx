import type { Arrow, Point, Tool } from '../types';

interface ArrowsOverlayProps {
  arrows: Arrow[];
  selectedId: string | null;
  tool: Tool;
  arrowStart: Point | null;
  arrowCurrent: { x: number; y: number } | null;
  resolvePoint: (p: Point) => { x: number; y: number } | null;
  onSelectArrow: (id: string) => void;
}

export function ArrowsOverlay({
  arrows,
  selectedId,
  tool,
  arrowStart,
  arrowCurrent,
  resolvePoint,
  onSelectArrow,
}: ArrowsOverlayProps) {
  const liveStart = arrowStart ? resolvePoint(arrowStart) : null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--board-ink-muted)" />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
        </marker>
      </defs>

      {arrows.map((a) => {
        const s = resolvePoint(a.start);
        const e = resolvePoint(a.end);
        if (!s || !e) return null;
        const isSelected = selectedId === a.id;
        return (
          <g
            key={a.id}
            className="pointer-events-auto cursor-pointer"
            onPointerDown={(evt) => {
              evt.stopPropagation();
              onSelectArrow(a.id);
            }}
          >
            <line
              x1={`${s.x}%`}
              y1={`${s.y}%`}
              x2={`${e.x}%`}
              y2={`${e.y}%`}
              stroke="transparent"
              strokeWidth="15"
            />
            <line
              x1={`${s.x}%`}
              y1={`${s.y}%`}
              x2={`${e.x}%`}
              y2={`${e.y}%`}
              stroke={
                isSelected ? 'var(--accent)' : 'var(--board-ink-muted)'
              }
              strokeWidth={isSelected ? '3' : '2'}
              markerEnd={`url(#arrowhead${isSelected ? '-selected' : ''})`}
            />
          </g>
        );
      })}

      {tool === 'arrow' && liveStart && arrowCurrent && (
        <line
          x1={`${liveStart.x}%`}
          y1={`${liveStart.y}%`}
          x2={`${arrowCurrent.x}%`}
          y2={`${arrowCurrent.y}%`}
          stroke="var(--board-ink-muted)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      )}
    </svg>
  );
}
