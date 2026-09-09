import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAtlas } from '../src/sprites/atlas';

const hash = 'a'.repeat(64);
const valid = { schemaVersion: 'robot-world.robot-atlas/v1-prototype', sourceSha256: hash, imageSha256: hash, imageWidth: 32, imageHeight: 32, frames: [{ name: 'idle-00', rect: { x: 0, y: 0, w: 8, h: 8 }, foot: { x: 4, y: 7 }, group: 'idle' }], animations: { idle: ['idle-00'], walk: ['idle-00'], enable: ['idle-00'], shutdown: ['idle-00'] }, fps: { idle: 4, walk: 8, enable: 6, shutdown: 6 }, nominalHeight: 64, referenceHeightPx: 8 };

test('atlas validator accepts bounded metadata and rejects duplicate names', () => {
  assert.doesNotThrow(() => validateAtlas(valid));
  assert.throws(() => validateAtlas({ ...valid, frames: [valid.frames[0], valid.frames[0]] }));
});
