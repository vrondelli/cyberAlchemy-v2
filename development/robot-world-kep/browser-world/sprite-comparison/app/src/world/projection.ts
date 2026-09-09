import type { Point } from './types';

export const WORLD = Object.freeze({ width: 1280, height: 768 });
export const ACTIVE_BOUNDS = Object.freeze({ x: 128, y: 64, width: 1024, height: 640 });

export function projectSource(position: readonly [number, number]): Point {
  return { x: 640 + 80 * position[0], y: 384 - 48 * position[1] };
}

export function sourceInsideBounds(position: readonly [number, number]): boolean {
  return position.every(value => Number.isFinite(value) && value >= -5 && value <= 5);
}

export function inverseProject(point: Point): readonly [number, number] {
  return [(point.x - 640) / 80, (384 - point.y) / 48];
}

export function depthFor(point: Point, id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return point.y * 1000 + hash / 1000;
}
