import type { Playback } from '../playback';

export type RobotId = 'explorer' | 'builder';
export type ViewMode = 'bench' | 'colony' | 'load';
export type Point = Readonly<{ x: number; y: number }>;

export interface SpriteAtlasFrame {
  readonly name: string;
  readonly rect: Readonly<{ x: number; y: number; w: number; h: number }>;
  readonly foot: Point;
  readonly group: 'idle' | 'walk' | 'enable' | 'shutdown';
}

export interface SpriteAtlasSpec {
  readonly schemaVersion: 'robot-world.robot-atlas/v1-prototype';
  readonly sourceSha256: string;
  readonly imageSha256: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly frames: readonly SpriteAtlasFrame[];
  readonly animations: Readonly<Record<'idle' | 'walk' | 'enable' | 'shutdown', readonly string[]>>;
  readonly fps: Readonly<Record<'idle' | 'walk' | 'enable' | 'shutdown', number>>;
  readonly nominalHeight: number;
  readonly referenceHeightPx: number;
}

export interface SpriteWorldOptions {
  readonly host: HTMLElement;
  readonly playback: Playback;
  readonly mode: ViewMode;
  readonly signal: AbortSignal;
  readonly onSelect: (id: RobotId | null) => void;
  readonly onProgress: (message: string) => void;
  readonly onError: (message: string) => void;
}

export interface SpriteDiagnostics {
  readonly build: Readonly<{ id: string; session: string }>;
  readonly backend: string;
  readonly phaserVersion: string;
  readonly mode: ViewMode;
  readonly canvas: Readonly<{ width: number; height: number }>;
  readonly css: Readonly<{ width: number; height: number }>;
  readonly dpr: number;
  readonly camera: Readonly<{ center: Point; zoom: number; bounds: Readonly<{ x: number; y: number; width: number; height: number }> }>;
  readonly selectedId: RobotId | null;
  readonly cursor: Readonly<{ index: number; playing: boolean; speed: number; tick: number; revision: number }>;
  readonly sourcePositions: Readonly<Record<RobotId, readonly [number, number]>>;
  readonly visualPositions: Readonly<Record<RobotId, Point>>;
  readonly atlasFrames: Readonly<Record<RobotId, string>>;
  readonly facing: Readonly<Record<RobotId, 'left' | 'right'>>;
  readonly textures: number;
  readonly objects: number;
  readonly activeGames: number;
  readonly realAgentCount: number;
  readonly syntheticAgentCount: number;
  readonly samples: readonly Readonly<{ label: string; cssHeight: number; nominalHeight: number }>[];
  readonly frameTiming: Readonly<{ medianMs: number; p95Ms: number; longStallCount: number }>;
  readonly loadState: 'loading' | 'ready' | 'error' | 'disposed';
}

export interface SpriteWorldHandle {
  select(id: RobotId | null): void;
  focus(id: RobotId): void;
  reset(): void;
  zoom(step: -1 | 1): void;
  resize(width: number, height: number): void;
  diagnostics(): Readonly<SpriteDiagnostics>;
  dispose(): Promise<void>;
}
