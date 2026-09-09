import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  AppError,
  createLesson,
  disableLesson,
  emptyState,
  explain,
  exportScope,
  history,
  listLessons,
  reviseLesson,
  validateState
} from './core.mjs';

async function atomicReplace(filePath, state) {
  validateState(state);
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
  const temporary = `${filePath}.${basename(filePath)}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', {
      encoding: 'utf8',
      flag: 'wx'
    });
    await rename(temporary, filePath);
  } catch (error) {
    try {
      await unlink(temporary);
    } catch {}
    throw error;
  }
}

async function loadOrCreate(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const state = emptyState();
    await atomicReplace(filePath, state);
    return state;
  }

  let state;
  try {
    state = JSON.parse(text);
  } catch {
    throw new AppError('invalid_store', 'Existing store contains malformed JSON', 500);
  }
  validateState(state);
  return state;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class Store {
  constructor(filePath, state) {
    this.filePath = filePath;
    this.state = state;
    this.tail = Promise.resolve();
  }

  async commit(operation) {
    const run = this.tail.then(async () => {
      const candidate = clone(this.state);
      const result = operation(candidate);
      await atomicReplace(this.filePath, candidate);
      this.state = candidate;
      return result;
    });
    this.tail = run.catch(() => {});
    return run;
  }

  create(input) {
    return this.commit(state => createLesson(state, input));
  }

  revise(input) {
    return this.commit(state => reviseLesson(state, input));
  }

  disable(input) {
    return this.commit(state => disableLesson(state, input));
  }

  list(input) {
    return Promise.resolve(listLessons(this.state, input));
  }

  history(input) {
    return Promise.resolve(history(this.state, input));
  }

  export(input) {
    return Promise.resolve(exportScope(this.state, input));
  }

  explain(input) {
    return Promise.resolve(explain(this.state, input));
  }
}

export async function openStore(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new AppError('validation_error', '--store must be a nonempty file path');
  }
  const state = await loadOrCreate(filePath);
  return new Store(filePath, state);
}

export async function loadStore(filePath) {
  return openStore(filePath);
}

export async function saveStore(filePath, state) {
  validateState(state);
  await atomicReplace(filePath, state);
}
