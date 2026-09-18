import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScheduler, validateManifest } from './scheduler.mjs';
const job = (id, depends_on = [], reservation_tokens = 10) => ({ id, depends_on, reservation_tokens });
const manifest = (jobs, token_budget = 100) => ({ id: 'test', jobs, token_budget });
const usage = n => ({ prompt_tokens: n, completion_tokens: 0, total_tokens: n });
async function dir(t) { const d = await mkdtemp(join(tmpdir(), 'scheduler-')); t.after(() => rm(d, { recursive: true, force: true })); return d; }

test('independent jobs overlap; dependent jobs see durable parent results; resume never repeats', async t => {
  const directory = await dir(t), m = manifest([job('a'), job('b'), job('c', ['a'])]);
  let active = 0, peak = 0; const calls = [];
  let releasePair;
  const pairStarted = new Promise(resolve => { releasePair = resolve; });
  const result = await runScheduler({ directory, manifest: m, execute: async (j, context) => {
    calls.push(j.id); active++; peak = Math.max(peak, active);
    if (j.id === 'c') assert.equal(context.dependencies.a.output, 'a');
    if (j.id === 'b') releasePair();
    if (j.id !== 'c') await pairStarted;
    active--;
    return { usage: usage(5), output: j.id };
  }});
  assert.equal(peak, 2); assert.equal(result.accounting.known_tokens, 15);
  const resumed = await runScheduler({ directory, manifest: m, execute: () => assert.fail('repeated generation') });
  assert.deepEqual(resumed.jobs, result.jobs); assert.equal(calls.length, 3);
  await assert.rejects(runScheduler({ directory, manifest: { ...m, token_budget: 101 }, execute() {} }), /differs/);
});

test('shared reservations prevent budget races, and released tokens admit later work', async t => {
  const directory = await dir(t); let active = 0, peak = 0;
  const state = await runScheduler({ directory, manifest: manifest([job('a'), job('b'), job('c')], 15), concurrency: 3,
    execute: async () => { active++; peak = Math.max(peak, active); await new Promise(r => setTimeout(r, 5)); active--; return { usage: usage(3) }; } });
  assert.equal(peak, 1); assert.equal(state.jobs.a.status, 'completed'); assert.equal(state.jobs.b.status, 'completed');
  assert.equal(state.jobs.c.status, 'budget_blocked'); assert.equal(state.accounting.known_tokens, 6);
});

test('failed branches block descendants but independent branch completes', async t => {
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([job('a'), job('b', ['a']), job('c')]),
    execute: async j => { if (j.id === 'a') throw new Error('unmetered transport failure'); return { usage: usage(2) }; } });
  assert.equal(state.jobs.a.status, 'failed'); assert.equal(state.jobs.b.status, 'blocked'); assert.equal(state.jobs.c.status, 'completed');
  assert.equal(state.accounting.unknown_reserved_tokens, 10);
});

test('interrupted running checkpoint becomes unknown and retains reservation on resume', async t => {
  const directory = await dir(t), m = manifest([job('a'), job('b', ['a']), job('c')], 20);
  await writeFile(join(directory, 'checkpoint.json'), JSON.stringify({ version: 1, manifest_hash: validateManifest(m), concurrency: 2,
    halt_reason: null, jobs: { a: { status: 'running', attempt_id: 'interrupted' }, b: { status: 'pending' }, c: { status: 'pending' } } }));
  const seen = [];
  const state = await runScheduler({ directory, manifest: m, execute: async j => { seen.push(j.id); return { usage: usage(2) }; } });
  assert.deepEqual(seen, ['c']); assert.equal(state.jobs.a.status, 'unknown'); assert.equal(state.jobs.b.status, 'blocked');
  assert.equal(state.accounting.unknown_reserved_tokens, 10);
});

test('existing lock is never stolen', async t => {
  const directory = await dir(t); await mkdir(join(directory, '.scheduler-lock'));
  await assert.rejects(runScheduler({ directory, manifest: manifest([job('a')]), execute() {} }), /lock exists/);
});

test('duplicate IDs, cycles, missing dependencies and invalid values rejected', () => {
  for (const m of [manifest([job('a'), job('a')]), manifest([job('a', ['b']), job('b', ['a'])]), manifest([job('a', ['missing'])]),
    manifest([job('../unsafe')]), manifest([job('a', [], 0)]), manifest([job('a')], -1), { ...manifest([job('a')]), bad: undefined }]) {
    assert.throws(() => validateManifest(m));
  }
});

test('rate limit reduces shared concurrency without retrying a failed attempt', async t => {
  let attempts = 0;
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([job('a'), job('b'), job('c')]), concurrency: 2,
    execute: async j => { attempts++; if (j.id === 'a') throw Object.assign(new Error('rate limited'), { receipt: { error_code: '1302', usage: usage(0) } });
      await new Promise(r => setTimeout(r, 10)); return { usage: usage(2) }; } });
  assert.equal(attempts, 3); assert.equal(state.concurrency, 1); assert.equal(state.accounting.unknown_reserved_tokens, 0);
});

test('reservation overrun records actual tokens and halts new dispatch', async t => {
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([job('a'), job('b')]), concurrency: 1,
    execute: async () => ({ usage: usage(11) }) });
  assert.equal(state.accounting.known_tokens, 11); assert.match(state.halt_reason, /Reservation exceeded/); assert.equal(state.jobs.b.status, 'budget_blocked');
});

test('malformed usage never becomes successful or free', async t => {
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([job('a')]), execute: async () => ({ usage: { ...usage(2), total_tokens: 1 } }) });
  assert.equal(state.jobs.a.status, 'unknown'); assert.equal(state.accounting.unknown_reserved_tokens, 10);
});

test('ordering edges preserve sequence without coupling failure or budget feasibility', async t => {
  const seen = [];
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([
    job('a', [], 30), { ...job('b'), after: ['a'] }, { ...job('c'), after: ['b'] }
  ], 20), execute: async j => {
    seen.push(j.id);
    if (j.id === 'b') throw Object.assign(new Error('failed'), { receipt: { usage: usage(0) } });
    return { usage: usage(2) };
  }});
  assert.deepEqual(seen, ['b', 'c']); assert.equal(state.jobs.a.status, 'budget_blocked'); assert.equal(state.jobs.c.status, 'completed');
  assert.throws(() => validateManifest(manifest([{ ...job('a'), after: ['b'] }, { ...job('b'), after: ['a'] }])), /cycle/);
});

test('coordinator write failure retains lock until active effects settle', async t => {
  const directory = await dir(t); let release, launched;
  const started = new Promise(r => { launched = r; });
  const gate = new Promise(r => { release = r; });
  const pending = runScheduler({ directory, manifest: manifest([job('a'), job('b')]), execute: async j => {
    if (j.id === 'b') {
      await rm(join(directory, 'checkpoint.json'));
      await mkdir(join(directory, 'checkpoint.json'));
      launched();
    } else await gate;
    return { usage: usage(2) };
  }});
  // Observe rejection immediately to avoid an unhandled rejection during the assertion.
  const caught = pending.then(() => null, e => e);
  await started;
  await new Promise(r => setTimeout(r, 20));
  await assert.rejects(runScheduler({ directory, manifest: manifest([job('a')]), execute() {} }), /lock exists/);
  release();
  assert.ok(await caught);
});

test('failed ingestion chain releases an ordering-only independent arm', async t => {
  const seen = [];
  const state = await runScheduler({ directory: await dir(t), manifest: manifest([
    { ...job('independent'), after: ['answer'] }, job('answer', ['note2']), job('note2', ['note1']), job('note1')
  ]), execute: async j => { seen.push(j.id); if (j.id === 'note1') throw new Error('failed'); return { usage: usage(2) }; } });
  assert.deepEqual(seen, ['note1', 'independent']); assert.equal(state.jobs.answer.status, 'blocked'); assert.equal(state.jobs.independent.status, 'completed');
});
