import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { TYPE_CONFIG } from '../constants';
import type { ElementType } from '../types';

const ELEMENT_TYPES = Object.keys(TYPE_CONFIG) as ElementType[];

interface ElementTypeSelectProps {
  value: ElementType;
  onChange: (value: ElementType) => void;
}

export function ElementTypeSelect({
  value,
  onChange,
}: ElementTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    ELEMENT_TYPES.indexOf(value),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleWindowBlur = () => setOpen(false);

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [open]);

  const openMenu = (index = ELEMENT_TYPES.indexOf(value)) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const selectActive = () => {
    const nextValue = ELEMENT_TYPES[activeIndex];
    if (nextValue && nextValue !== value) onChange(nextValue);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        (current) =>
          (current + direction + ELEMENT_TYPES.length) % ELEMENT_TYPES.length,
      );
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return;
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : ELEMENT_TYPES.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) selectActive();
      else openMenu();
      return;
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`flex min-h-10 w-full items-center justify-between rounded-[10px] border bg-[var(--control-bg)] px-3 py-2 text-left text-[13px] text-[var(--control-text)] outline-none transition-colors hover:bg-[var(--hover-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] ${
          open ? 'border-[var(--accent)]' : 'border-[var(--control-border)]'
        }`}
      >
        <span>{value}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-[var(--text-faint)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Element type"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto rounded-[8px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        >
          {ELEMENT_TYPES.map((type, index) => {
            const selected = type === value;
            const active = index === activeIndex;
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => {
                  if (!selected) onChange(type);
                  setOpen(false);
                }}
                className={`flex min-h-9 w-full items-center justify-between rounded-[6px] px-2.5 text-left text-[13px] transition-colors ${
                  active
                    ? 'bg-[var(--hover-bg)] text-[var(--text)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <span>{type}</span>
                {selected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
