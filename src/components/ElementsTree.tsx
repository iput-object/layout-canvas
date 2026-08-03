import type { Box } from '../types';

interface ElementsTreeProps {
  boxes: Box[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ElementsTree({ boxes, selectedId, onSelect }: ElementsTreeProps) {
  const sorted = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);

  return (
    <div className="flex-1 overflow-y-auto p-5 border-b border-[var(--panel-divider)]">
      <h2 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.06em] mb-3">
        Elements
      </h2>
      <div className="space-y-0.5">
        {sorted.map((box) => {
          const selected = selectedId === box.id;
          return (
            <button
              key={box.id}
              onClick={() => onSelect(box.id)}
              className={`w-full text-left px-3 py-2 rounded-[10px] text-[13px] flex items-center gap-2.5 transition-colors ${
                selected
                  ? 'selected-accent'
                  : 'text-[var(--text)] hover:bg-[var(--hover-bg)] border border-transparent'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                  selected ? 'bg-white/80' : 'bg-[var(--text-faint)]'
                }`}
              />
              <span
                className={`font-mono text-[10px] w-16 shrink-0 ${
                  selected ? 'opacity-80' : 'text-[var(--text-muted)]'
                }`}
              >
                [{box.type}]
              </span>
              <span className="truncate font-medium">{box.label}</span>
            </button>
          );
        })}
        {boxes.length === 0 && (
          <div className="text-[13px] text-[var(--text-faint)] text-center py-6">
            Canvas is empty
          </div>
        )}
      </div>
    </div>
  );
}
