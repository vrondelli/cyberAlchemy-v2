import test from 'node:test';
import assert from 'node:assert/strict';
import { inverseProject, projectSource } from '../src/world/projection';

test('source projection preserves the bounded coordinate transform', () => {
  assert.deepEqual(projectSource([-3, 0]), { x: 400, y: 384 });
  assert.deepEqual(inverseProject({ x: 880, y: 336 }), [3, 1]);
});
