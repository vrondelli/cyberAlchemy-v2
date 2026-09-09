import type Phaser from 'phaser';
import { ACTIVE_BOUNDS, WORLD } from './projection';

export function configureCamera(camera: Phaser.Cameras.Scene2D.Camera): void {
  camera.setBounds(0, 0, WORLD.width, WORLD.height);
  camera.setScroll(0, 0);
  camera.centerOn(WORLD.width / 2, WORLD.height / 2);
  camera.setZoom(1);
}

export function applyZoom(camera: Phaser.Cameras.Scene2D.Camera, step: -1 | 1): number {
  const next = Math.max(0.75, Math.min(2, camera.zoom + step * 0.125));
  camera.setZoom(next);
  return next;
}

export function focusCamera(camera: Phaser.Cameras.Scene2D.Camera, x: number, y: number): void {
  camera.centerOn(Math.max(ACTIVE_BOUNDS.x, Math.min(ACTIVE_BOUNDS.x + ACTIVE_BOUNDS.width, x)), Math.max(ACTIVE_BOUNDS.y, Math.min(ACTIVE_BOUNDS.y + ACTIVE_BOUNDS.height, y)));
}
