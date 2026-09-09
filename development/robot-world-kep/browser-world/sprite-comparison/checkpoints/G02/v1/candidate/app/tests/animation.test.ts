import test from 'node:test';
import assert from 'node:assert/strict';
import { benchFrame, chooseAnimation } from '../src/world/animation';
import type { SpriteAtlasSpec } from '../src/world/types';

const atlas = { animations: { idle: ['idle-00', 'idle-01'], walk: ['walk-00', 'walk-01'], enable: ['enable-00'], shutdown: ['shutdown-00'] }, fps: { idle: 4, walk: 8, enable: 6, shutdown: 6 } } as unknown as SpriteAtlasSpec;
const robot = (position: readonly [number, number]) => ({ id: 'explorer', owner: 'alice', position, energy: 100, cargo: 0, memory: [0, 0, 0, 0], prior: [0, 0, 0, 0] });
const frame = { tick: 0, revision: 0, worldId: 'w', built: 0, resource: 0, stock: 0, knowledge: [], robots: [robot([0, 0])] } as never;
const next = { ...frame, robots: [robot([1, 0])] } as never;

test('moving segments use walk frames and deterministic facing', () => {
  assert.deepEqual(chooseAnimation(frame, next, 'explorer', 0, atlas), { frame: 'walk-00', facing: 'right', moving: true });
  assert.equal(chooseAnimation(next, frame, 'explorer', 0, atlas).facing, 'left');
});

test('bench phase loops without playback state', () => {
  assert.equal(benchFrame(atlas, 'idle', 0), 'idle-00');
  assert.equal(benchFrame(atlas, 'idle', 0.5), 'idle-00');
  assert.equal(benchFrame(atlas, 'idle', 0.51), 'idle-00');
  assert.equal(benchFrame(atlas, 'idle', 0.75), 'idle-01');
});
