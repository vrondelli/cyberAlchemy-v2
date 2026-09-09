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

test('core creates and revises lessons while retaining immutable event content', () => {
  const state = emptyState();
  const first = createLesson(state, {
    product_id: 'product',
    participant_id: 'person',
    lesson_id: 'lesson',
    instruction: 'Use concise output',
    source_ref: 'source-1',
    conditions: ['release']
  });
  const second = reviseLesson(state, {
    product_id: 'product',
    participant_id: 'person',
    lesson_id: 'lesson',
    expected_revision: 1,
    instruction: 'Use very concise output',
    source_ref: 'source-2'
  });

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.equal(state.events.length, 2);
  assert.equal(state.events[0].source_ref, 'source-1');
  assert.deepEqual(second.conditions, ['release']);
});

test('disable is idempotent and preserves revision', () => {
  const state = emptyState();
  createLesson(state, {
    product_id: 'p',
    participant_id: 'u',
    lesson_id: 'a',
    instruction: 'A',
    source_ref: 'ref-a'
  });

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

test('explain applies disposition priority and never mutates state', () => {
  const state = emptyState();
  createLesson(state, {
    product_id: 'p', participant_id: 'u', lesson_id: 'a',
    instruction: 'A', source_ref: 'ref-a'
  });
  createLesson(state, {
    product_id: 'p', participant_id: 'u', lesson_id: 'b',
    instruction: 'B', source_ref: 'ref-b', conditions: ['needed']
  });
  const before = JSON.stringify(state);
  const result = explain(state, {
    product_id: 'p', participant_id: 'u', text: 'This is needed',
    invalidated_refs: ['ref-a'], override_ids: ['b']
  });

  assert.deepEqual(result.items, []);
  assert.deepEqual(result.assessments, [
    { lesson_id: 'a', revision: 1, disposition: 'unsupported' },
    { lesson_id: 'b', revision: 1, disposition: 'overridden' }
  ]);
  assert.equal(JSON.stringify(state), before);
});

test('store persists across reopen and scopes reads', async () => {
  const { directory, file } = await temporaryStore();
  try {
    const store = await openStore(file);
    await store.create({
      product_id: 'p', participant_id: 'u', lesson_id: 'one',
      instruction: 'Keep it', source_ref: 'r'
    });
    await store.create({
      product_id: 'p', participant_id: 'other', lesson_id: 'hidden',
      instruction: 'Hidden', source_ref: 'r2'
    });
    await store.revise({
      product_id: 'p', participant_id: 'u', lesson_id: 'one', expected_revision: 1,
      instruction: 'Keep it short', source_ref: 'r3'
    });

    const reopened = await openStore(file);
    const lessons = await reopened.list({ product_id: 'p', participant_id: 'u' });
    assert.equal(lessons.length, 1);
    assert.equal(lessons[0].revision, 2);
    assert.equal((await reopened.history({
      product_id: 'p', participant_id: 'u', lesson_id: 'one'
    })).length, 2);
    const exported = await reopened.export({ product_id: 'p', participant_id: 'u' });
    assert.equal(exported.lessons.length, 1);
    assert.equal(exported.events.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

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
