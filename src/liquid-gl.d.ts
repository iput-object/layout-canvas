declare module 'liquid-gl' {
  export interface LiquidGLOptions {
    target?: string;
    snapshot?: string;
    resolution?: number;
    refraction?: number;
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    reveal?: 'none' | 'fade';
    tilt?: boolean;
    tiltFactor?: number;
    tiltEase?: number;
    magnify?: number;
    on?: {
      init?: (instance: unknown) => void;
    };
  }

  export interface LiquidGLApi {
    (options?: LiquidGLOptions): unknown;
    registerDynamic: (selectorOrElements: string | Element | Element[]) => void;
    syncWith: () => { lenis?: unknown; locomotiveScroll?: unknown };
  }

  const liquidGL: LiquidGLApi;
  export default liquidGL;
}
