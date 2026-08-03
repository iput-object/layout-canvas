import { Check, Copy, Info } from 'lucide-react';
import { toBoundaryRect } from '../canvas/geometry';
import type { Arrow, Box, DrawBounds, Point } from '../types';
import { ElementTypeSelect } from './ElementTypeSelect';
import { Panel } from './Panel';
import { ElementsTree } from './ElementsTree';

interface PropertiesPanelProps {
  boxes: Box[];
  arrows: Arrow[];
  drawBounds: DrawBounds;
  selectedId: string | null;
  selectedBox?: Box;
  selectedArrow?: Arrow;
  copied: boolean;
  getPointLabel: (p: Point) => string;
  onSelect: (id: string) => void;
  onUpdateBox: (id: string, updates: Partial<Box>) => void;
  onUpdateArrow: (id: string, updates: Partial<Arrow>) => void;
  onCopySpec: () => void | Promise<void>;
}

const fieldClass =
  'w-full bg-[var(--control-bg)] border border-[var(--control-border)] rounded-[10px] py-2 px-3 text-[13px] text-[var(--control-text)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] resize-none';

export function PropertiesPanel({
  boxes,
  arrows,
  drawBounds,
  selectedId,
  selectedBox,
  selectedArrow,
  copied,
  getPointLabel,
  onSelect,
  onUpdateBox,
  onUpdateArrow,
  onCopySpec,
}: PropertiesPanelProps) {
  const relativeBox = selectedBox
    ? toBoundaryRect(selectedBox, drawBounds)
    : null;

  return (
    <Panel className="h-full w-full rounded-2xl pointer-events-auto">
      <div className="flex flex-col h-full overflow-hidden text-[var(--text)]">
        <div className="max-h-[62%] shrink-0 overflow-y-auto p-5 border-b border-[var(--panel-divider)]">
          <h2 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.06em] mb-4">
            Properties
          </h2>

          {selectedBox ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Element Type
                </label>
                <ElementTypeSelect
                  value={selectedBox.type}
                  onChange={(type) => onUpdateBox(selectedBox.id, { type })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Label (Name)
                </label>
                <input
                  type="text"
                  value={selectedBox.label}
                  onChange={(e) =>
                    onUpdateBox(selectedBox.id, { label: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={selectedBox.note}
                  onChange={(e) =>
                    onUpdateBox(selectedBox.id, { note: e.target.value })
                  }
                  rows={4}
                  placeholder="Optional notes"
                  className={fieldClass}
                />
              </div>

              <div className="pt-2">
                <div className="text-[10px] text-[var(--text-muted)] font-mono bg-[var(--control-bg)] p-2 rounded-xl border border-[var(--panel-divider)]">
                  Pos: x={Math.round(relativeBox!.x)}% y=
                  {Math.round(relativeBox!.y)}% <br />
                  Size: {Math.round(relativeBox!.w)}% ×{' '}
                  {Math.round(relativeBox!.h)}%
                </div>
              </div>
            </div>
          ) : selectedArrow ? (
            <div className="space-y-4">
              <div className="text-xs font-mono text-[var(--text)] break-words bg-[var(--control-bg)] p-3 rounded-xl border border-[var(--panel-divider)]">
                <div className="truncate">
                  {getPointLabel(selectedArrow.start)}
                </div>
                <div className="text-[var(--text-faint)] my-1">↓ connects to</div>
                <div className="truncate">
                  {getPointLabel(selectedArrow.end)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Note (Relationship meaning)
                </label>
                <textarea
                  value={selectedArrow.note}
                  onChange={(e) =>
                    onUpdateArrow(selectedArrow.id, { note: e.target.value })
                  }
                  rows={4}
                  placeholder="e.g. opens on click, feeds data to"
                  className={fieldClass}
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--text-muted)] flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="p-3 bg-[var(--control-bg)] rounded-full">
                <Info size={20} className="text-[var(--text-muted)]" />
              </div>
              <p>Select a box or arrow to edit its properties.</p>
            </div>
          )}
        </div>

        <ElementsTree
          boxes={boxes}
          arrows={arrows}
          selectedId={selectedId}
          getPointLabel={getPointLabel}
          onSelect={onSelect}
        />

        <div className="p-5">
          <button
            onClick={onCopySpec}
            disabled={boxes.length === 0 && arrows.length === 0}
            className={`w-full py-2.5 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors ${
              boxes.length === 0 && arrows.length === 0
                ? 'bg-[var(--control-bg)] text-[var(--text-faint)] cursor-not-allowed'
                : copied
                  ? 'selected-glass'
                  : 'selected-accent hover:brightness-110'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Spec'}
          </button>
        </div>
      </div>
    </Panel>
  );
}
