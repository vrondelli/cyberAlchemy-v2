import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRetrievalAdapter, sha256 } from './adapter.mjs';

function fixture(t, extra = {}) {
  const root = mkdtempSync(join(tmpdir(), 'are-kite-contract-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = 'A verified observation.\nUnicode: é\n';
  writeFileSync(join(root, 'source.txt'), content);
  const source = { source_id: 'source-a', path: 'source.txt', sha256: sha256(content) };
  const row = { source_id: source.source_id, sha256: source.sha256, start_byte: 0, end_byte: 23 };
  const options = { root, sources: [source], backend: async () => ({ rows: [row] }), ...extra };
  return { root, content, source, row, options, make: (overrides = {}) => createRetrievalAdapter({ ...options, ...overrides }) };
}
const query = { query: 'What was observed?', invocation_id: 'opaque-1' };
const rejects = (operation, code) => assert.rejects(operation, { code });

test('hydrates exact source bytes; provider receives no scorer metadata', async (t) => {
  const f = fixture(t);
  let received;
  const adapter = f.make({ backend: async (input) => { received = input; return { rows: [f.row] }; } });
  const result = await adapter.query(query);
  assert.deepEqual(received, query);
  assert.equal(result.evidence[0].text, 'A verified observation.');
  assert.equal(result.evidence_bytes, Buffer.byteLength(JSON.stringify(result.evidence)));
  assert.equal(result.full_request_admission, 'required-by-caller');
  await rejects(() => adapter.query({ ...query, gold_answer: 'secret', task_id: 'held-out' }), 'INVALID_SHAPE');
  assert.equal(adapter.stats().calls, 1);
});
test('hash drift invalidates entire index before backend and remains sticky', async (t) => {
  const f = fixture(t); let calls = 0;
  const adapter = f.make({ backend: async () => { calls++; return { rows: [] }; } });
  writeFileSync(join(f.root, 'source.txt'), 'changed');
  await rejects(() => adapter.query(query), 'STALE_SOURCE');
  writeFileSync(join(f.root, 'source.txt'), f.content);
  await rejects(() => adapter.query(query), 'INDEX_INVALIDATED');
  assert.equal(calls, 0);
});
test('detects source changes during backend work', async (t) => {
  const f = fixture(t);
  const adapter = f.make({ backend: async () => {
    writeFileSync(join(f.root, 'source.txt'), 'new revision'); return { rows: [f.row] };
  } });
  await rejects(() => adapter.query(query), 'STALE_SOURCE');
});
test('rejects path escapes, symlinks and unknown source references', async (t) => {
  const f = fixture(t);
  for (const path of ['../source.txt', '/etc/passwd', 'x/../source.txt', 'x\\source.txt'])
    assert.throws(() => f.make({ sources: [{ ...f.source, path }] }), { code: 'INVALID_SOURCE' });
  symlinkSync('source.txt', join(f.root, 'link.txt'));
  assert.throws(() => f.make({ sources: [{ ...f.source, path: 'link.txt' }] }), { code: 'UNSAFE_SOURCE' });
  const adapter = f.make({ backend: async () => ({ rows: [{ ...f.row, source_id: 'unknown' }] }) });
  await rejects(() => adapter.query(query), 'INVALID_PROVENANCE');
});
test('rejects tampered hashes, invented text and invalid byte boundaries', async (t) => {
  const f = fixture(t);
  for (const [row, code] of [
    [{ ...f.row, sha256: '0'.repeat(64) }, 'INVALID_PROVENANCE'],
    [{ ...f.row, text: 'backend invention' }, 'INVALID_SHAPE'],
    [{ ...f.row, start_byte: -1 }, 'INVALID_SPAN'],
    [{ ...f.row, end_byte: 9999 }, 'INVALID_SPAN'],
    [{ ...f.row, start_byte: Buffer.byteLength(f.content) - 2, end_byte: Buffer.byteLength(f.content) - 1 }, 'INVALID_UTF8_SPAN'],
  ]) await rejects(() => f.make({ backend: async () => ({ rows: [row] }) }).query(query), code);
});
test('caps serialized evidence including metadata, rows and source bytes', async (t) => {
  const f = fixture(t);
  await rejects(() => f.make({ limits: { max_evidence_bytes: 50 } }).query(query), 'EVIDENCE_TOO_LARGE');
  await rejects(() => f.make({ limits: { max_rows: 1 }, backend: async () => ({ rows: [f.row, f.row] }) }).query(query), 'INVALID_ROWS');
  await rejects(() => f.make({ backend: async () => ({ rows: [f.row, f.row] }) }).query(query), 'DUPLICATE_SPAN');
  assert.throws(() => f.make({ limits: { max_source_bytes: 10 } }), { code: 'SOURCE_TOO_LARGE' });
});
test('counts failures, never retries and sanitizes backend errors', async (t) => {
  const f = fixture(t); let calls = 0;
  const adapter = f.make({ limits: { max_calls: 1 }, backend: async () => { calls++; throw new Error('credential bytes'); } });
  await rejects(() => adapter.query(query), 'BACKEND_FAILED');
  await rejects(() => adapter.query(query), 'CALL_LIMIT');
  assert.equal(calls, 1);
});
test('timeout aborts, invalidates session, and permits no automatic replay', async (t) => {
  const f = fixture(t); let signal;
  const adapter = f.make({ limits: { timeout_ms: 10 }, backend: (_, controls) => {
    signal = controls.signal; return new Promise(() => {});
  } });
  await rejects(() => adapter.query(query), 'BACKEND_TIMEOUT');
  assert.equal(signal.aborted, true);
  await rejects(() => adapter.query(query), 'INDEX_INVALIDATED');
});
test('concurrent callers cannot exceed the single in-flight boundary', async (t) => {
  const f = fixture(t); let resolve;
  const adapter = f.make({ backend: () => new Promise((r) => { resolve = r; }) });
  const pending = adapter.query(query);
  await rejects(() => adapter.query(query), 'QUERY_IN_PROGRESS');
  resolve({ rows: [] });
  assert.deepEqual((await pending).evidence, []);
  assert.equal(adapter.stats().calls, 1);
});
