import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {diagnoseSourceSelection} from './provenance-validator.mjs';
import {DIAGNOSTIC_LIMITS} from '../../packages/coding-agent-runtime/patch-schema.mjs';
const hash = s => createHash('sha256').update(s).digest('hex');
function fixture(t) {
  const repoRoot = mkdtempSync(join(tmpdir(), 'are-provenance-validator-'));
  t.after(() => rmSync(repoRoot, {recursive: true, force: true}));
  const base = 'one\ntwo\nthree\n', current = 'one\nCHANGED\nthree\n';
  writeFileSync(join(repoRoot, 'a.txt'), base);
  const read = (id, text, start_line = 1, end_line = 3) => ({id: hash(id), path: 'a.txt',
    source_sha256: hash(text), start_line, end_line,
    body: text.split('\n').slice(start_line - 1, end_line).join('\n'), first_confirmed_receipt: 1});
  const reads = [read('base', base), read('changed', current), read('unchanged-line', current, 1, 1)];
  return {repoRoot, reads, snapshots: [{path: 'a.txt', source_sha256: hash(current), utf8: current}]};
}
const raw = ids => JSON.stringify({summary: 'done', context_read_ids: ids});
test('base reads and unchanged current fragments retain their exact IDs', t => {
  const f = fixture(t), ids = [f.reads[0].id, f.reads[2].id];
  const d = diagnoseSourceSelection({...f, raw: raw(ids)});
  assert.equal(d.ok, true); assert.deepEqual(d.value.context_read_ids, ids);
});
test('schema, delivered binding and changed-source failures appear together', t => {
  const f = fixture(t), missing = hash('not-delivered');
  const d = diagnoseSourceSelection({...f, raw: JSON.stringify({summary: 42, context_read_ids: [missing, f.reads[1].id], extra: true})});
  assert.equal(d.ok, false); assert.equal(d.instrument_error, false);
  assert.ok(d.issues.some(i => i.instance_path === '/summary'));
  assert.ok(d.issues.some(i => i.code === 'final-selection.undelivered-read-id'));
  assert.ok(d.issues.some(i => i.code === 'final-selection.changed-source-lines'));
  assert.deepEqual(d.value.context_read_ids, [missing, f.reads[1].id]);
});
test('edited selection remains rejected even when base evidence also selected', t => {
  const f = fixture(t), ids = f.reads.slice(0, 2).map(r => r.id);
  const d = diagnoseSourceSelection({...f, raw: raw(ids)});
  assert.equal(d.ok, false); assert.equal(d.issues.at(-1).changed_line_count, 1);
  assert.deepEqual(d.value.context_read_ids, ids);
});
test('corrupt snapshots are instrument failures, not model-correctable evidence', t => {
  const f = fixture(t); f.snapshots[0].utf8 = 'corrupt';
  const d = diagnoseSourceSelection({...f, raw: raw([f.reads[1].id])});
  assert.equal(d.instrument_error, true);
  assert.equal(d.category, 'source-integrity-failure');
});
test('invalid JSON remains bounded syntax feedback', t => {
  const f = fixture(t), d = diagnoseSourceSelection({...f, raw: 'not JSON'});
  assert.equal(d.ok, false); assert.equal(d.category, 'invalid-json');
  assert.equal(d.instrument_error, false);
});
test('combined diagnostics remain bounded and never silently pass truncation', t => {
  const f = fixture(t), d = diagnoseSourceSelection({...f, raw: raw(Array(256).fill(f.reads[1].id))});
  assert.equal(d.ok, false); assert.equal(d.truncated, true);
  assert.ok(d.issues.length <= DIAGNOSTIC_LIMITS.issues);
  assert.ok(Buffer.byteLength(JSON.stringify(d.issues)) <= DIAGNOSTIC_LIMITS.render_bytes);
});
