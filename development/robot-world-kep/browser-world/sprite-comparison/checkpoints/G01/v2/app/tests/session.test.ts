import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSession, validateBytes } from '../src/session.ts';
import { Playback } from '../src/playback.ts';

const bytes = new Uint8Array(readFileSync(new URL('../public/session/session.json', import.meta.url)));
const source = () => JSON.parse(new TextDecoder().decode(bytes));
const manifest = () => JSON.parse(readFileSync(new URL('../public/session/session-manifest.json', import.meta.url), 'utf8'));

test('exact selected fixture keeps the final same-tick revision and freezes state', async () => {
  const s = await validateBytes(bytes, manifest());
  assert.equal(s.frames.length, 82);
  assert.deepEqual(s.frames.slice(-2).map(f => [f.tick, f.revision]), [[80, 240], [80, 241]]);
  assert.ok(Object.isFrozen(s.frames[0].robots[0].position));
});
test('manifest and byte tampering cannot substitute a different session', async () => {
  const m = manifest(); m.frameCount = 81; await assert.rejects(validateBytes(bytes, m), /frame count/);
  const changed = bytes.slice(); changed[100] ^= 1; await assert.rejects(validateBytes(changed, manifest()), /hash/);
  const wrong = manifest(); wrong.sourceCatalogSha256 = '0'.repeat(64); await assert.rejects(validateBytes(bytes, wrong), /association/);
  await assert.rejects(validateBytes(new Uint8Array(2 * 1024 * 1024 + 1), manifest()), /byte limit/);
});
test('identity, ordering, shape, vector and numeric violations fail before rendering', () => {
  const cases: Array<[string, (s: any) => void]> = [
    ['owner', s => { s.frames[1].robots[0].owner = 'someone-else'; }],
    ['robot', s => { s.frames[1].robots.pop(); }],
    ['world', s => { s.frames[1].worldId = 'other'; }],
    ['order', s => { s.frames[81].revision = 240; }],
    ['order', s => { s.frames[3].tick = 0; }],
    ['dimensions', s => { s.frames[1].robots[0].memory.pop(); }],
    ['position', s => { s.frames[0].robots[0].position[0] = Infinity; }],
    ['position', s => { s.frames[0].robots[0].position.push(0); }],
    ['energy', s => { s.frames[0].robots[0].energy = 101; }],
    ['cargo', s => { s.frames[0].robots[0].cargo = 1.5; }],
    ['resource', s => { s.frames[0].resource = '80'; }],
    ['fields', s => { s.frames[0].extra = 'surprise'; }],
    ['schema', s => { s.schemaVersion = 'live'; }],
    ['duplicate', s => { s.catalog.push(s.catalog[0]); }],
  ];
  for (const [name, mutate] of cases) { const s = source(); mutate(s); assert.throws(() => validateSession(s), new RegExp(name)); }
});
test('elapsed-time partitioning leaves identical authoritative cursor and position', () => {
  const s = validateSession(source()), a = new Playback(s), b = new Playback(s);
  a.play(); b.play(); a.update(5);
  for (let i = 0; i < 500; i++) b.update(0.01);
  assert.deepEqual(a.getSnapshot(), b.getSnapshot());
  assert.ok(Math.abs(a.fraction - b.fraction) < 1e-8);
  a.position('builder').forEach((v, i) => assert.ok(Math.abs(v - b.position('builder')[i]) < 1e-8));
  assert.deepEqual(s, source());
});
test('seek and pause restore exact source, final revision remains selectable', () => {
  const p = new Playback(validateSession(source()));
  p.play(); p.update(1.5); p.pause();
  assert.equal(p.fraction, 0);
  assert.deepEqual(p.position('builder'), p.frame.robots.find(r => r.id === 'builder')!.position);
  p.seek(80); assert.equal(p.frame.revision, 240);
  p.seek(81); assert.equal(p.frame.revision, 241);
  p.play(); assert.equal(p.getSnapshot().index, 0);
  p.update(1000); assert.equal(p.frame.revision, 241); assert.equal(p.getSnapshot().playing, false);
  p.seek(NaN); assert.equal(p.frame.revision, 241);
});
