import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { buildLongMemManifest, buildSmokeManifest, createGlmExecutor, verifySourceBindings } from './adapter.mjs';
import { runScheduler } from '../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/scheduler.mjs';

const row = task_id => ({ task_id, split: 'development', source_record_sha256: 'a'.repeat(64), question: 'FUTURE-QUERY-SECRET', question_date: '2025/01/03 (Fri) 00:00', history: [
  { session_id: 'first', date: '2025/01/01 (Wed) 00:00', messages: [{ role: 'user', content: 'I prefer DAG plans. '.repeat(4) }] },
  { session_id: 'second', date: '2025/01/02 (Thu) 00:00', messages: [{ role: 'user', content: 'My next project is blue. '.repeat(3) }] },
] });
const result = text => ({ output: text, finish_reason: 'stop', usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 } });
const experiment = () => buildLongMemManifest({ id: 'test', rows: [row('alpha'), row('beta')], repetitions: 2, chunk_limit: 200, token_budget: 200000 });

test('complete history, hidden query during ingestion, AB/BA task order, independent tasks', () => {
  const manifest = experiment();
  const alpha = manifest.jobs.filter(j => j.task_id === 'alpha');
  assert.deepEqual(alpha.filter(j => j.kind === 'answer').map(j => j.arm), ['control', 'treatment', 'treatment', 'control']);
  assert.deepEqual(manifest.jobs.find(j => j.task_id === 'beta').depends_on, []);
  assert.equal(manifest.source_manifests[0].unit_count, 2);
  for (const job of alpha.filter(j => j.kind === 'ingestion')) assert.ok(!JSON.stringify(job).includes('FUTURE-QUERY-SECRET'));
  for (const job of alpha.filter(j => j.kind === 'ingestion' && j.step === 0)) assert.equal(job.note_parent, null);
  assert.equal(alpha.find(j => j.arm === 'treatment').after[0], alpha.find(j => j.kind === 'answer').id);
  const sources = alpha.filter(j => j.kind === 'ingestion' && j.arm === 'control' && j.repetition === 1).flatMap(j => j.chunk);
  assert.deepEqual(sources.map(s => s.source_id), ['s0-m0', 's1-m0']);
});

test('dependent notes reach next ingestion and answer; no notes cross arm ordering edge', async () => {
  const observed = [], manifest = experiment(), completed = {};
  const provider = { tokenize: async (_id, messages) => { observed.push(messages); return { usage: { prompt_tokens: 20 } }; }, generate: async id => result('notes for ' + id) };
  const execute = createGlmExecutor({ provider });
  const jobs = manifest.jobs.filter(j => j.task_id === 'alpha' && j.repetition === 1);
  for (const job of jobs) completed[job.id] = await execute(job, { dependencies: Object.fromEntries(job.depends_on.map(id => [id, completed[id]])), attempt_id: job.id });
  assert.ok(observed[1][1].content.includes('notes for ' + jobs[0].id));
  assert.ok(observed[2][1].content.includes('notes for ' + jobs[1].id));
  assert.ok(observed[2].at(-1).content.includes('FUTURE-QUERY-SECRET'));
  assert.equal(observed[3][1].content, 'Previous retained notes:\n');
  assert.equal(completed[jobs[3].id].output.claims.length, 1);
  assert.equal(completed[jobs[4].id].output.claims.length, 2);
  assert.equal(completed[jobs[4].id].output.claims[1].event.content.posture, 'unverified-model-claim');
});

test('parallel task outputs and claim chains remain isolated', async () => {
  const jobs = experiment().jobs.filter(j => j.kind === 'ingestion' && j.arm === 'treatment' && j.repetition === 1 && j.step === 0);
  const execute = createGlmExecutor({ provider: { tokenize: async () => ({ usage: { prompt_tokens: 20 } }), generate: async id => result(id + ' s0-m0') } });
  const outputs = await Promise.all(jobs.map(job => execute(job, { dependencies: {}, attempt_id: job.id })));
  assert.equal(outputs[0].output.claims.length, 1);
  assert.equal(outputs[1].output.claims.length, 1);
  assert.ok(!outputs[0].output.text.includes(jobs[1].id));
  assert.notEqual(outputs[0].output.claims[0].event.event_digest, outputs[1].output.claims[0].event.event_digest);
});

test('exact admission and tokenizer failures spend zero model tokens and never generate', async () => {
  let generations = 0;
  const job = buildSmokeManifest().jobs[0];
  for (const tokenize of [async () => ({ usage: { prompt_tokens: 129 } }), async () => { throw Object.assign(Error('tokenizer failed'), { receipt: { status: 429, error_code: '1302' } }); }]) {
    const execute = createGlmExecutor({ provider: { tokenize, generate: async () => { generations++; } } });
    await assert.rejects(execute(job, { attempt_id: 'a' }), error => error.receipt.usage.total_tokens === 0 && error.model_started === false);
  }
  assert.equal(generations, 0);
});

test('generation failures and post-generation claim failures retain actual usage', async () => {
  const errorReceipt = { usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }, failure: 'incomplete-output' };
  const execute = createGlmExecutor({ provider: { tokenize: async () => ({ usage: { prompt_tokens: 20 } }), generate: async () => { throw Object.assign(Error('incomplete-output'), { receipt: errorReceipt }); } } });
  await assert.rejects(execute(buildSmokeManifest().jobs[0], { attempt_id: 'failure' }), error => error.receipt === errorReceipt && error.model_started === true);
  const job = experiment().jobs.find(j => j.arm === 'treatment');
  const invalid = { ...job, ledger: null };
  const claims = createGlmExecutor({ provider: { tokenize: async () => ({ usage: { prompt_tokens: 20 } }), generate: async () => result('a note') } });
  await assert.rejects(claims(invalid, { attempt_id: 'claims' }), error => error.receipt.usage.total_tokens === 30);
});

test('frozen preflight reservations replace conservative defaults; absent entry fails', () => {
  const calls = experiment().jobs.filter(j => j.task_id === 'alpha' && j.repetition === 1).map(j => ({ task_id: 'alpha', phase: j.kind, arm: j.arm, chunk: j.step, input_tokens: 100, carried_notes_reservation: 40, output_reserve: 80 }));
  const args = { id: 'preflight', rows: [row('alpha')], repetitions: 1, chunk_limit: 200, token_budget: 2000, preflight: { admitted: true, calls } };
  const manifest = buildLongMemManifest(args);
  assert.ok(manifest.jobs.every(j => j.input_cap === 140 && j.output_cap === 80 && j.reservation_tokens === 220));
  assert.throws(() => buildLongMemManifest({ ...args, preflight: { admitted: true, calls: [] } }), /missing frozen reservation/);
  assert.throws(() => buildLongMemManifest({ ...args, rows: [{ ...row('reserved'), split: 'reserved' }] }), /reserved tasks/);
});

test('scheduler adapter integration passes complete dependency results and resumes without dispatch', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'are-adapter-'));
  try {
    const manifest = buildLongMemManifest({ id: 'integration', rows: [row('alpha'), row('beta')], repetitions: 1, chunk_limit: 200, token_budget: 50000 });
    const seen = [];
    const provider = { tokenize: async (_id, messages) => { seen.push(messages); return { usage: { prompt_tokens: 20 } }; }, generate: async () => result('DAG plans s0-m0') };
    const execute = createGlmExecutor({ provider });
    const state = await runScheduler({ directory, manifest, execute, concurrency: 2 });
    assert.ok(Object.values(state.jobs).every(j => j.status === 'completed'));
    assert.equal(state.accounting.known_tokens, 360);
    assert.equal(seen.length, 12);
    await runScheduler({ directory, manifest, execute, concurrency: 2 });
    assert.equal(seen.length, 12);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('bound implementation changes fail before provider construction', async () => {
  const root = await mkdtemp(join(tmpdir(), 'are-binding-'));
  try {
    await writeFile(join(root, 'source.mjs'), 'original');
    const manifest = { source_bindings: [{ path: 'source.mjs', sha256: createHash('sha256').update('original').digest('hex') }] };
    assert.deepEqual(verifySourceBindings(manifest, root), { verified: 1 });
    await writeFile(join(root, 'source.mjs'), 'changed');
    assert.throws(() => verifySourceBindings(manifest, root), /source binding changed/);
    assert.throws(() => verifySourceBindings({ source_bindings: [{ path: '../escape', sha256: 'a'.repeat(64) }] }, root), /invalid source binding path/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
