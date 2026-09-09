import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createLesson,
  disableLesson,
  emptyState,
  explain,
  reviseLesson
} from '../src/core.mjs';
import { openStore } from '../src/store.mjs';

async function temporaryStore(prefix = 'memory-observatory-') {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  return { directory, file: join(directory, 'nested', 'memory.json') };
}

function lessonInput(overrides = {}) {
  return {
    product_id: 'product',
    participant_id: 'person',
    lesson_id: 'lesson',
    instruction: 'Use concise output',
    source_ref: 'source-1',
    ...overrides
  };
}

test('core creates and revises lessons with expiry and immutable history', () => {
  const state = emptyState();
  const first = createLesson(state, lessonInput({ conditions: ['release'], expires_at: 500 }));
  const second = reviseLesson(state, {
    product_id: 'product',
    participant_id: 'person',
    lesson_id: 'lesson',
    expected_revision: 1,
    instruction: 'Use very concise output',
    source_ref: 'source-2'
  });

  assert.equal(first.revision, 1);
  assert.equal(first.expires_at, 500);
  assert.equal(second.revision, 2);
  assert.equal(second.expires_at, 500);
  assert.equal(state.events.length, 2);
  assert.equal(state.events[0].source_ref, 'source-1');
});

test('disable is idempotent and preserves revision', () => {
  const state = emptyState();
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'a' }));

  const first = disableLesson(state, {
    product_id: 'p', participant_id: 'u', lesson_id: 'a', expected_revision: 1
  });
  const second = disableLesson(state, {
    product_id: 'p', participant_id: 'u', lesson_id: 'a', expected_revision: 1
  });

  assert.equal(first.disabled, true);
  assert.equal(second.revision, 1);
  assert.equal(state.events.length, 2);
  assert.equal(state.events[1].kind, 'disabled');
});

test('explain applies disabled, expired, applicability, unsupported and override precedence', () => {
  const state = emptyState();
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'a', source_ref: 'a' }));
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'b', source_ref: 'b', expires_at: 10 }));
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'c', source_ref: 'c', conditions: ['needed'] }));
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'd', source_ref: 'd' }));
  createLesson(state, lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'e', source_ref: 'e' }));
  disableLesson(state, { product_id: 'p', participant_id: 'u', lesson_id: 'e', expected_revision: 1 });

  const before = JSON.stringify(state);
  const result = explain(state, {
    product_id: 'p', participant_id: 'u', text: 'This is needed', now: 10,
    invalidated_refs: ['d'], override_ids: ['a']
  });

  assert.deepEqual(result.items, [{ lesson_id: 'c', instruction: 'Use concise output', revision: 1, source_ref: 'c' }]);
  assert.deepEqual(result.assessments.map(item => [item.lesson_id, item.disposition]), [
    ['a', 'overridden'], ['b', 'expired'], ['c', 'applicable'], ['d', 'unsupported'], ['e', 'disabled']
  ]);
  assert.equal(JSON.stringify(state), before);
});

test('store persists across reopen and scopes reads', async () => {
  const { directory, file } = await temporaryStore();
  try {
    const store = await openStore(file);
    await store.create(lessonInput({ product_id: 'p', participant_id: 'u', lesson_id: 'one', expires_at: 100 }));
    await store.create(lessonInput({ product_id: 'p', participant_id: 'other', lesson_id: 'hidden' }));
    await store.revise({
      product_id: 'p', participant_id: 'u', lesson_id: 'one', expected_revision: 1,
      instruction: 'Keep it short', source_ref: 'r3', expires_at: null
    });

    const reopened = await openStore(file);
    const lessons = await reopened.list({ product_id: 'p', participant_id: 'u' });
    assert.equal(lessons.length, 1);
    assert.equal(lessons[0].revision, 2);
    assert.equal(lessons[0].expires_at, null);
    assert.equal((await reopened.history({ product_id: 'p', participant_id: 'u', lesson_id: 'one' })).length, 2);
    const exported = await reopened.export({ product_id: 'p', participant_id: 'u' });
    assert.equal(exported.schema_version, 2);
    assert.equal(exported.lessons.length, 1);
    assert.equal(exported.events.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('v1 stores migrate once, preserve events, and gain null expiry', async () => {
  const { directory, file } = await temporaryStore('memory-observatory-migration-');
  const oldState = {
    schema_version: 1,
    lessons: [{
      product_id: 'p1', participant_id: 'u1', lesson_id: 'a', instruction: 'Old',
      source_ref: 'source:1', conditions: [], exclusions: [], revision: 1, disabled: false
    }],
    events: [{
      event_id: 1, kind: 'created', product_id: 'p1', participant_id: 'u1', lesson_id: 'a',
      revision: 1, source_ref: 'source:1'
    }]
  };
  await mkdirForTest(file);
  await writeFile(file, JSON.stringify(oldState), 'utf8');
  try {
    const migrated = await openStore(file);
    assert.equal(migrated.state.schema_version, 2);
    assert.equal(migrated.state.lessons[0].expires_at, null);
    assert.deepEqual(migrated.state.events, oldState.events);
    const persisted = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(persisted.schema_version, 2);
    assert.deepEqual(persisted.events, oldState.events);
    const reopened = await openStore(file);
    assert.equal(reopened.state.events.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

async function mkdirForTest(file) {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(join(file, '..'), { recursive: true });
}

test('malformed existing store fails without replacement', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'memory-observatory-invalid-'));
  const file = join(directory, 'memory.json');
  await writeFile(file, '{not-json', 'utf8');
  try {
    await assert.rejects(() => openStore(file), /malformed JSON/);
    assert.equal(await readFile(file, 'utf8'), '{not-json');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
