import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {POPULATED_STAGE_BYTES} from './recent-evidence-populated-stage-r3.mjs';
import {createStageOutputGuard} from './comparison-output-guard.mjs';

test('uses a capacity accepted by both output guards', t => {
  const root = mkdtempSync(join(tmpdir(), 'recent-populated-capacity-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const output = join(root, 'output'), supervision = join(root, 'supervision');
  mkdirSync(output); mkdirSync(supervision);
  assert.equal(POPULATED_STAGE_BYTES, 64 * 1024 ** 2);
  assert.doesNotThrow(() => createStageOutputGuard({root: output, maximum_bytes: POPULATED_STAGE_BYTES}));
  assert.doesNotThrow(() => createStageOutputGuard({root: supervision, maximum_bytes: POPULATED_STAGE_BYTES}));
  assert.throws(() => createStageOutputGuard({root: output, maximum_bytes: 96 * 1024 ** 2}), /fixed-capacity/);
});
