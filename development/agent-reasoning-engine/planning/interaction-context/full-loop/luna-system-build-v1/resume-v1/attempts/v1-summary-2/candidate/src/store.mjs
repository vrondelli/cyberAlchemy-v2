import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  AppError,
  assessLessons,
  clone,
  identityKey,
  makeEvent,
  makeLesson,
  normalizeCreateInput,
  normalizeDisableInput,
  normalizeExplainInput,
  normalizeIdentity,
  normalizeReviseInput,
  normalizeScope,
  validateState
} from "./core.mjs";

const emptyState = () => ({ schema_version: 1, lessons: [], events: [] });

function storageFailure(message, cause) {
  const error = new AppError("STORAGE_FAILURE", message, 500);
  error.cause = cause;
  return error;
}

function atomicWrite(file, state) {
  const directory = path.dirname(file);
  const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, file);
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw storageFailure("could not atomically persist store", error);
  }
}

function loadExisting(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    validateState(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof AppError && error.code === "STORE_CORRUPT") throw error;
    throw new AppError("STORE_CORRUPT", "existing store is malformed", 500);
  }
}

export class MemoryStore {
  constructor(file) {
    if (typeof file !== "string" || file.length === 0) throw new AppError("INVALID_INPUT", "store path is required");
    this.file = file;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (fs.existsSync(file)) {
        this._state = loadExisting(file);
      } else {
        this._state = emptyState();
        atomicWrite(file, this._state);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw storageFailure("could not open store", error);
    }
  }

  snapshot() {
    return clone(this._state);
  }

  _commit(next) {
    try {
      validateState(next);
      atomicWrite(this.file, next);
      this._state = next;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw storageFailure("could not persist store", error);
    }
  }

  _find(identity) {
    return this._state.lessons.find(lesson => identityKey(lesson) === identityKey(identity));
  }

  _nextEventId() {
    return this._state.events.length === 0 ? 1 : this._state.events[this._state.events.length - 1].event_id + 1;
  }

  create(input) {
    const normalized = normalizeCreateInput(input);
    if (this._find(normalized)) throw new AppError("DUPLICATE_LESSON", "lesson already exists", 409);
    const lesson = makeLesson(normalized);
    const next = {
      schema_version: 1,
      lessons: [...this._state.lessons, lesson],
      events: [...this._state.events, makeEvent(this._nextEventId(), "created", lesson)]
    };
    this._commit(next);
    return clone(lesson);
  }

  revise(input) {
    const normalized = normalizeReviseInput(input);
    const current = this._find(normalized);
    if (!current) throw new AppError("LESSON_NOT_FOUND", "lesson was not found", 404);
    if (current.revision !== normalized.expected_revision) throw new AppError("REVISION_CONFLICT", "expected_revision does not match", 409);
    const lesson = {
      ...current,
      instruction: normalized.instruction,
      source_ref: normalized.source_ref,
      revision: current.revision + 1
    };
    if (Object.hasOwn(normalized, "conditions")) lesson.conditions = normalized.conditions;
    if (Object.hasOwn(normalized, "exclusions")) lesson.exclusions = normalized.exclusions;
    const next = {
      schema_version: 1,
      lessons: this._state.lessons.map(item => identityKey(item) === identityKey(current) ? lesson : item),
      events: [...this._state.events, makeEvent(this._nextEventId(), "revised", lesson)]
    };
    this._commit(next);
    return clone(lesson);
  }

  disable(input) {
    const normalized = normalizeDisableInput(input);
    const current = this._find(normalized);
    if (!current) throw new AppError("LESSON_NOT_FOUND", "lesson was not found", 404);
    if (current.revision !== normalized.expected_revision) throw new AppError("REVISION_CONFLICT", "expected_revision does not match", 409);
    if (current.disabled) return clone(current);
    const lesson = { ...current, disabled: true };
    const next = {
      schema_version: 1,
      lessons: this._state.lessons.map(item => identityKey(item) === identityKey(current) ? lesson : item),
      events: [...this._state.events, makeEvent(this._nextEventId(), "disabled", lesson)]
    };
    this._commit(next);
    return clone(lesson);
  }

  list(input) {
    const scope = normalizeScope(input);
    return clone(this._state.lessons
      .filter(lesson => lesson.product_id === scope.product_id && lesson.participant_id === scope.participant_id)
      .sort((a, b) => a.lesson_id < b.lesson_id ? -1 : a.lesson_id > b.lesson_id ? 1 : 0));
  }

  history(input) {
    const identity = normalizeIdentity(input);
    if (!this._find(identity)) throw new AppError("LESSON_NOT_FOUND", "lesson was not found", 404);
    return clone(this._state.events
      .filter(event => identityKey(event.identity) === identityKey(identity))
      .sort((a, b) => a.event_id - b.event_id));
  }

  exportScope(input) {
    const scope = normalizeScope(input);
    return {
      schema_version: 1,
      product_id: scope.product_id,
      participant_id: scope.participant_id,
      lessons: this.list(scope),
      events: clone(this._state.events
        .filter(event => event.identity.product_id === scope.product_id && event.identity.participant_id === scope.participant_id)
        .sort((a, b) => a.event_id - b.event_id))
    };
  }

  explain(input) {
    const request = normalizeExplainInput(input);
    return assessLessons(request, this._state.lessons);
  }
}

export function openStore(file) {
  return new MemoryStore(file);
}

export const Store = MemoryStore;
