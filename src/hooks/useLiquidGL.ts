import { useEffect, useRef } from 'react';
import liquidGL from 'liquid-gl';

const DEFAULT_OPTIONS = {
  target: '.liquid-panel',
  snapshot: 'body',
  resolution: 2.0,
  refraction: 0.008,
  aberration: 0,
  bevelDepth: 0.04,
  bevelWidth: 0.18,
  frost: 3,
  shadow: false,
  specular: false,
  reveal: 'none' as const,
  tilt: false,
  magnify: 1,
};

let liquidStarted = false;

type LiquidRenderer = {
  captureSnapshot?: () => void | Promise<unknown>;
  render?: () => void;
  lenses?: Array<{ updateMetrics?: () => void }>;
};

function getRenderer(): LiquidRenderer | undefined {
  return (window as Window & { __liquidGLRenderer__?: LiquidRenderer })
    .__liquidGLRenderer__;
}

/** Re-rasterise the page so glass matches the current theme / layout. */
export function refreshLiquidGL() {
  const renderer = getRenderer();
  if (!renderer?.captureSnapshot) return;

  void Promise.resolve(renderer.captureSnapshot()).then(() => {
    renderer.lenses?.forEach((lens) => lens.updateMetrics?.());
    renderer.render?.();
  });
}

export function useLiquidGL(ready = true, themeKey?: string) {
  const prevTheme = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!ready || liquidStarted) return;
    if (typeof window === 'undefined') return;

    const panels = document.querySelectorAll('.liquid-panel');
    if (panels.length === 0) return;

    liquidStarted = true;

    const frame = requestAnimationFrame(() => {
      liquidGL(DEFAULT_OPTIONS);
    });

    return () => cancelAnimationFrame(frame);
  }, [ready]);

  // Theme changes need a fresh snapshot — liquidGL doesn't watch CSS vars.
  useEffect(() => {
    if (!ready || !liquidStarted || themeKey == null) return;

    if (prevTheme.current === undefined) {
      prevTheme.current = themeKey;
      return;
    }
    if (prevTheme.current === themeKey) return;
    prevTheme.current = themeKey;

    let cancelled = false;
    const id = window.setTimeout(() => {
      if (!cancelled) refreshLiquidGL();
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [ready, themeKey]);
}
