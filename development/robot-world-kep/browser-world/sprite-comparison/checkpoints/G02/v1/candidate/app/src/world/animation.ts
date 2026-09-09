import type { Frame } from '../session';
import type { SpriteAtlasSpec, RobotId } from './types';

export interface AnimationChoice {
  readonly frame: string;
  readonly facing: 'left' | 'right';
  readonly moving: boolean;
}

export function chooseAnimation(frame: Frame, next: Frame, id: RobotId, fraction: number, atlas: SpriteAtlasSpec): AnimationChoice {
  const current = frame.robots.find(robot => robot.id === id)!;
  const following = next.robots.find(robot => robot.id === id)!;
  const dx = following.position[0] - current.position[0];
  const dy = following.position[1] - current.position[1];
  const moving = Math.abs(dx) + Math.abs(dy) > 0.0001;
  const facing: 'left' | 'right' = dx < -0.0001 ? 'left' : 'right';
  const group = moving ? atlas.animations.walk : atlas.animations.idle;
  const fps = moving ? atlas.fps.walk : atlas.fps.idle;
  const phase = Math.max(0, fraction) * fps;
  return { frame: group[Math.floor(phase) % group.length], facing, moving };
}

export function benchFrame(atlas: SpriteAtlasSpec, group: 'idle' | 'walk', elapsedSeconds: number): string {
  const names = atlas.animations[group];
  const index = Math.floor(Math.max(0, elapsedSeconds) * atlas.fps[group]) % names.length;
  return names[index];
}
