import type { ElementType } from './types';

export const TYPE_CONFIG: Record<
  ElementType,
  { border: string; bg: string; text: string; labelBg: string; ring: string }
> = {
  Container: {
    border: 'border-zinc-900/40 dark:border-zinc-100/40 border-dashed border-2',
    bg: 'bg-zinc-900/5 dark:bg-zinc-100/5',
    text: 'text-zinc-900 dark:text-zinc-100',
    labelBg:
      'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-900/20 dark:border-zinc-100/20',
    ring: 'ring-zinc-900/50 dark:ring-zinc-100/50 ring-offset-[var(--board-bg)]',
  },
  Button: {
    border: 'border-zinc-900 dark:border-zinc-100 border-solid border-[3px]',
    bg: 'bg-zinc-900/10 dark:bg-zinc-100/10',
    text: 'text-zinc-900 dark:text-zinc-100 font-bold',
    labelBg: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
    ring: 'ring-zinc-900 dark:ring-zinc-100 ring-offset-[var(--board-bg)]',
  },
  Text: {
    border: 'border-zinc-900/30 dark:border-zinc-100/30 border-dotted border-2',
    bg: 'bg-transparent',
    text: 'text-zinc-800 dark:text-zinc-200',
    labelBg:
      'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-900/10 dark:border-zinc-100/10',
    ring: 'ring-zinc-900/30 dark:ring-zinc-100/30 ring-offset-[var(--board-bg)]',
  },
  Image: {
    border: 'border-zinc-900/60 dark:border-zinc-100/60 border-solid border-2',
    bg: 'bg-zinc-900/15 dark:bg-zinc-100/15',
    text: 'text-zinc-900 dark:text-zinc-100',
    labelBg: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900',
    ring: 'ring-zinc-900/60 dark:ring-zinc-100/60 ring-offset-[var(--board-bg)]',
  },
  Input: {
    border: 'border-zinc-900/50 dark:border-zinc-100/50 border-solid border',
    bg: 'bg-white dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    labelBg:
      'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-900/50 dark:border-zinc-100/50',
    ring: 'ring-zinc-900/50 dark:ring-zinc-100/50 ring-offset-[var(--board-bg)]',
  },
  Nav: {
    border: 'border-zinc-900/80 dark:border-zinc-100/80 border-dashed border-[3px]',
    bg: 'bg-zinc-900/[0.08] dark:bg-zinc-100/[0.08]',
    text: 'text-zinc-900 dark:text-zinc-100 font-semibold',
    labelBg: 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900',
    ring: 'ring-zinc-900/80 dark:ring-zinc-100/80 ring-offset-[var(--board-bg)]',
  },
  Note: {
    border: 'border-transparent',
    bg: 'bg-transparent',
    text: 'text-zinc-600 dark:text-zinc-400 font-medium italic',
    labelBg: 'bg-transparent text-zinc-500 dark:text-zinc-400 border-transparent',
    ring: 'ring-zinc-400 dark:ring-zinc-500 ring-offset-[var(--board-bg)]',
  },
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const DEVICE_SIZE: Record<
  'desktop' | 'tablet' | 'mobile',
  { width: string; height: string }
> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '812px' },
};
