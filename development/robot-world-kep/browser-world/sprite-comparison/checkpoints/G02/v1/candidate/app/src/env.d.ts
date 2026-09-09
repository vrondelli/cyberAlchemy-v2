/// <reference types="vite/client" />

import type { SpriteDiagnostics } from './world/types';

declare global {
  interface Window {
    __robotWorldSprites?: SpriteDiagnostics;
  }
}

export {};
