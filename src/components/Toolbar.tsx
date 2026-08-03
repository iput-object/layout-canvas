import type { ReactNode } from 'react';
import { Moon, MousePointer2, MoveUpRight, Square, Sun, Trash2 } from 'lucide-react';
import { LiquidPanel } from './LiquidPanel';
import type { Theme } from '../hooks/useTheme';
import type { Tool } from '../types';

interface ToolbarProps {
  tool: Tool;
  theme: Theme;
  onToolChange: (tool: Tool) => void;
  onClear: () => void;
  onToggleTheme: () => void;
}

function ToolButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2.5 rounded-[10px] transition-all duration-150 ${
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
  onToolChange,
  onClear,
  onToggleTheme,
}: ToolbarProps) {
  return (
    <LiquidPanel className="w-[52px] shrink-0 rounded-[16px] pointer-events-auto h-fit max-h-full">
      <div className="flex flex-col items-center py-2.5 gap-1 px-1">
        <ToolButton
          title="Select Tool (V)"
          active={tool === 'select'}
          onClick={() => onToolChange('select')}
        >
          <MousePointer2 size={17} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          title="Box Tool (B)"
          active={tool === 'box'}
          onClick={() => onToolChange('box')}
        >
          <Square size={17} strokeWidth={1.75} />
        </ToolButton>
        <ToolButton
          title="Arrow Tool (A)"
          active={tool === 'arrow'}
          onClick={() => onToolChange('arrow')}
        >
          <MoveUpRight size={17} strokeWidth={1.75} />
        </ToolButton>
        <div className="w-5 h-px bg-[var(--panel-divider)] my-1" />
        <ToolButton
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? (
            <Sun size={17} strokeWidth={1.75} />
          ) : (
            <Moon size={17} strokeWidth={1.75} />
          )}
        </ToolButton>
        <ToolButton title="Clear All" onClick={onClear}>
          <Trash2 size={17} strokeWidth={1.75} />
        </ToolButton>
      </div>
    </LiquidPanel>
  );
}
