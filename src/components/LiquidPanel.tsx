import type { HTMLAttributes, ReactNode } from 'react';

interface LiquidPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function LiquidPanel({
  children,
  className = '',
  contentClassName = '',
  style,
  ...rest
}: LiquidPanelProps) {
  return (
    <div
      className={`liquid-panel border bg-[var(--panel-bg)] border-[var(--panel-border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${className}`}
      style={{ zIndex: 30, ...style }}
      {...rest}
    >
      {/* liquidGL sets pointer-events:none on the target; content must opt back in */}
      <div
        className={`relative z-[3] h-full w-full pointer-events-auto ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
