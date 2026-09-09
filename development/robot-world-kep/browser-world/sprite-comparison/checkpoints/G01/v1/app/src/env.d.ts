/// <reference types="vite/client" />

import type { SpriteDiagnostics } from './world/types';

declare global {
  interface Window {
    readonly __robotWorldSprites?: SpriteDiagnostics;
  }
}

export {};
