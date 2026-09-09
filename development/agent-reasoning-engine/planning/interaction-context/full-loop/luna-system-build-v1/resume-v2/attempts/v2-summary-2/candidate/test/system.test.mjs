import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assessLessons } from '../src/core.mjs';
import { MemoryStore } from '../src/store.mjs';

function temporaryStore() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-observatory-'));
  return { file: path.join(directory, 'nested', 'store.json'), cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}

const base = (lesson_id, extra = {}) => ({ product_id: 'product-a', participant_id: 'participant-a', lesson_id, instruction: `instruction ${lesson_id}`, source_ref: `source:${lesson_id}`, ...extra });

test('creates, revises, disables, persists, and records immutable history', () => {
  const fixture = temporaryStore();
  try {
    const store = new MemoryStore(fixture.file);
    const created = store.create(base('one', { conditions: ['deploy'], expires_at: 5000 }));
    assert.equal(created.revision, 1);
    assert.equal(created.expires_at, 5000);
    const revised = store.revise({ ...base('one'), expected_revision: 1, instruction: 'revised instruction', source_ref: 'source:two' });
    assert.equal(revised.revision, 2);
    assert.equal(revised.expires_at, 5000);
    assert.deepEqual(revised.conditions, ['deploy']);
    const disabled = store.disable({ ...base('one'), expected_revision: 2 });
    assert.equal(disabled.disabled, true);
    assert.equal(store.disable({ ...base('one'), expected_revision: 2 }).disabled, true);
    assert.deepEqual(store.history({ ...base('one') }).map(event => [event.event_id, event.kind, event.revision]), [[1, 'created', 1], [2, 'revised', 2], [3, 'disabled', 2]]);
    const restarted = new MemoryStore(fixture.file);
    assert.equal(restarted.snapshot().schema_version, 2);
    assert.equal(restarted.list({ product_id: 'product-a', participant_id: 'participant-a' })[0].instruction, 'revised instruction');
    assert.equal(restarted.history({ ...base('one') })[0].source_ref, 'source:one');
  } finally { fixture.cleanup(); }
});

test('enforces scope, duplicate identity, and revision conflicts', () => {
  const fixture = temporaryStore();
  try {
    const store = new MemoryStore(fixture.file);
    store.create(base('same'));
    assert.throws(() => store.create(base('same')), error => error.code === 'DUPLICATE_LESSON');
    assert.throws(() => store.revise({ ...base('same'), expected_revision: 9 }), error => error.code === 'REVISION_CONFLICT');
    assert.deepEqual(store.list({ product_id: 'other', participant_id: 'participant-a' }), []);
    assert.deepEqual(store.exportScope({ product_id: 'other', participant_id: 'participant-a' }).events, []);
  } finally { fixture.cleanup(); }
});

test('applies expiry, conditions, exclusions, invalidation, override, and priority', () => {
  const lessons = [
    { ...base('a', { conditions: ['deploy'] }), revision: 1, disabled: false, expires_at: null },
    { ...base('b'), revision: 1, disabled: false, expires_at: 10 },
    { ...base('c', { exclusions: ['secret'] }), revision: 1, disabled: false, expires_at: null },
    { ...base('d'), revision: 1, disabled: true, expires_at: 0 },
    { ...base('e'), revision: 1, disabled: false, expires_at: null }
  ];
  const result = assessLessons({ product_id: 'product-a', participant_id: 'participant-a', text: 'Please DEPLOY this safely', now: 10, invalidated_refs: ['source:e'], override_ids: ['e'] }, lessons);
  assert.deepEqual(result.items.map(item => item.lesson_id), ['a', 'c']);
  assert.deepEqual(result.assessments.map(item => [item.lesson_id, item.disposition]), [['a', 'applicable'], ['b', 'expired'], ['c', 'applicable'], ['d', 'disabled'], ['e', 'unsupported']]);
});

test('migrates v1 storage once without changing event objects', () => {
  const fixture = temporaryStore();
  try {
    fs.mkdirSync(path.dirname(fixture.file), { recursive: true });
    const events = [{ event_id: 1, kind: 'created', identity: { product_id: 'p', participant_id: 'u', lesson_id: 'a' }, revision: 1, source_ref: 'old:1' }];
    fs.writeFileSync(fixture.file, JSON.stringify({ schema_version: 1, lessons: [{ ...base('a'), product_id: 'p', participant_id: 'u', revision: 1, disabled: false }], events }));
    const store = new MemoryStore(fixture.file);
    assert.equal(store.snapshot().schema_version, 2);
    assert.equal(store.snapshot().lessons[0].expires_at, null);
    assert.deepEqual(store.snapshot().events, events);
    const before = fs.readFileSync(fixture.file, 'utf8');
    const reopened = new MemoryStore(fixture.file);
    assert.equal(fs.readFileSync(fixture.file, 'utf8'), before);
    assert.deepEqual(reopened.history({ product_id: 'p', participant_id: 'u', lesson_id: 'a' }), events);
  } finally { fixture.cleanup(); }
});

test('rejects malformed existing storage without replacing it', () => {
  const fixture = temporaryStore();
  try {
    fs.mkdirSync(path.dirname(fixture.file), { recursive: true });
    fs.writeFileSync(fixture.file, 'not-json');
    assert.throws(() => new MemoryStore(fixture.file), error => error.code === 'STORE_CORRUPT');
    assert.equal(fs.readFileSync(fixture.file, 'utf8'), 'not-json');
  } finally { fixture.cleanup(); }
});

test('keeps explain projections transient and supports explicit expiry clearing', () => {
  const fixture = temporaryStore();
  try {
    const store = new MemoryStore(fixture.file);
    store.create(base('transient', { expires_at: 10 }));
    const revised = store.revise({ ...base('transient'), expected_revision: 1, expires_at: null });
    assert.equal(revised.expires_at, null);
    assert.deepEqual(store.explain({ product_id: 'product-a', participant_id: 'participant-a', text: 'anything', now: 10, invalidated_refs: ['source:transient'] }).items, []);
    assert.equal(store.list({ product_id: 'product-a', participant_id: 'participant-a' })[0].disabled, false);
  } finally { fixture.cleanup(); }
});
