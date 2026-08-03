import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Moon,
  MousePointer2,
  MoveUpRight,
  Redo2,
  Square,
  Sun,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Panel } from './Panel';
import type { Theme } from '../hooks/useTheme';
import type { Tool } from '../types';

interface ToolbarProps {
  tool: Tool;
  theme: Theme;
  onToolChange: (tool: Tool) => void;
  onClear: () => void;
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onToggleTheme: () => void;
  onUndo: () => void;
}

function ToolButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      title={title}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`p-2.5 rounded-[10px] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'selected-glass'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  tool,
  theme,
  canRedo,
  canUndo,
  onToolChange,
  onClear,
  onRedo,
  onToggleTheme,
  onUndo,
}: ToolbarProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmClear) return;

    const onPointerDown = (e: PointerEvent) => {
      if (confirmRef.current?.contains(e.target as Node)) return;
      setConfirmClear(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmClear(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [confirmClear]);

  return (
    <div className="relative shrink-0 h-fit pointer-events-auto">
      <Panel className="w-[52px] rounded-[16px] h-fit max-h-full">
        <div className="flex flex-col items-center py-2.5 gap-1 px-1">
          <ToolButton
            title="Select Tool (V)"
            active={tool === 'select'}
            onClick={() => {
              setConfirmClear(false);
              onToolChange('select');
            }}
          >
            <MousePointer2 size={17} strokeWidth={1.75} />
          </ToolButton>
          <ToolButton
            title="Box Tool (B)"
            active={tool === 'box'}
            onClick={() => {
              setConfirmClear(false);
              onToolChange('box');
            }}
          >
            <Square size={17} strokeWidth={1.75} />
          </ToolButton>
          <ToolButton
            title="Arrow Tool (A)"
            active={tool === 'arrow'}
            onClick={() => {
              setConfirmClear(false);
              onToolChange('arrow');
            }}
          >
            <MoveUpRight size={17} strokeWidth={1.75} />
          </ToolButton>
          <div className="w-5 h-px bg-[var(--panel-divider)] my-1" />
          <ToolButton title="Undo" disabled={!canUndo} onClick={onUndo}>
            <Undo2 size={17} strokeWidth={1.75} />
          </ToolButton>
          <ToolButton title="Redo" disabled={!canRedo} onClick={onRedo}>
            <Redo2 size={17} strokeWidth={1.75} />
          </ToolButton>
          <div className="w-5 h-px bg-[var(--panel-divider)] my-1" />
          <ToolButton
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            onClick={() => {
              setConfirmClear(false);
              onToggleTheme();
            }}
          >
            {theme === 'dark' ? (
              <Sun size={17} strokeWidth={1.75} />
            ) : (
              <Moon size={17} strokeWidth={1.75} />
            )}
          </ToolButton>
          <ToolButton
            title="Clear All"
            active={confirmClear}
            onClick={() => setConfirmClear((v) => !v)}
          >
            <Trash2 size={17} strokeWidth={1.75} />
          </ToolButton>
        </div>
      </Panel>

      {confirmClear && (
        <div
          ref={confirmRef}
          role="alertdialog"
          aria-labelledby="clear-confirm-title"
          className="absolute left-[calc(100%+10px)] bottom-0 w-[200px] rounded-2xl border bg-[var(--panel-bg)] border-[var(--panel-border)] shadow-[0_10px_28px_rgba(0,0,0,0.16)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.5)] p-3 z-40"
        >
          <p
            id="clear-confirm-title"
            className="text-[13px] font-medium text-[var(--text)] leading-snug"
          >
            Clear all elements?
          </p>
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="flex-1 px-2.5 py-1.5 rounded-[9px] text-[12px] font-medium text-[var(--text)] bg-[var(--control-bg)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmClear(false);
                onClear();
              }}
              className="flex-1 px-2.5 py-1.5 rounded-[9px] text-[12px] font-medium text-white bg-[#ff453a] hover:brightness-110 transition-[filter]"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
