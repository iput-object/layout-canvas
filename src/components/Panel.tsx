import type { HTMLAttributes, ReactNode } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({
  children,
  className = '',
  contentClassName = '',
  style,
  ...rest
}: PanelProps) {
  return (
    <div
      className={`border bg-[var(--panel-bg)] border-[var(--panel-border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${className}`}
      style={{ zIndex: 30, ...style }}
      {...rest}
    >
      <div className={`relative h-full w-full ${contentClassName}`}>{children}</div>
    </div>
  );
}
