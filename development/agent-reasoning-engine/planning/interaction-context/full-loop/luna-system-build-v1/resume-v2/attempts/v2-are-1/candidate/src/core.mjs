export const SCHEMA_VERSION = 2;

export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function errorBody(error) {
  if (error instanceof AppError) {
    return { error: { code: error.code, message: error.message } };
  }
  return { error: { code: 'internal_error', message: 'Internal server error' } };
}

function objectOrFail(value) {
  if (!isObject(value)) throw new AppError('validation_error', 'JSON body must be an object');
  return value;
}

function stringField(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError('validation_error', `${name} must be a nonempty string`);
  }
  return value;
}

function textField(value) {
  if (typeof value !== 'string') {
    throw new AppError('validation_error', 'text must be a string');
  }
  return value;
}

function stringArray(value, name) {
  if (!Array.isArray(value)) throw new AppError('validation_error', `${name} must be an array`);
  const result = [];
  const seen = new Set();
  for (const item of value) {
    stringField(item, `${name} item`);
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function storedStringArray(value, name) {
  if (!Array.isArray(value)) throw new AppError('invalid_store', `${name} must be an array`, 500);
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) {
      throw new AppError('invalid_store', `${name} contains an invalid string`, 500);
    }
    if (seen.has(item)) throw new AppError('invalid_store', `${name} contains duplicates`, 500);
    seen.add(item);
  }
}

function expiryField(value, name = 'expires_at') {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new AppError('validation_error', `${name} must be null or a nonnegative safe integer`);
  }
  return value;
}

function requiredExpiry(lesson, allowMissing) {
  if (!Object.hasOwn(lesson, 'expires_at')) {
    if (allowMissing) return null;
    throw new AppError('invalid_store', 'Lesson expires_at is missing', 500);
  }
  if (lesson.expires_at !== null && (!Number.isSafeInteger(lesson.expires_at) || lesson.expires_at < 0)) {
    throw new AppError('invalid_store', 'Lesson expires_at is invalid', 500);
  }
  return lesson.expires_at;
}

function requiredOrOptionalArray(value, name, fallback) {
  if (value === undefined) return fallback;
  return stringArray(value, name);
}

export function scopeOf(input) {
  const value = objectOrFail(input);
  return {
    product_id: stringField(value.product_id, 'product_id'),
    participant_id: stringField(value.participant_id, 'participant_id')
  };
}

export function identityOf(input) {
  const value = objectOrFail(input);
  const scope = scopeOf(value);
  return { ...scope, lesson_id: stringField(value.lesson_id, 'lesson_id') };
}

function expectedRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new AppError('validation_error', 'expected_revision must be a positive safe integer');
  }
  return value;
}

function contentFields(input, preserve) {
  const value = objectOrFail(input);
  const instruction = stringField(value.instruction, 'instruction');
  const source_ref = stringField(value.source_ref, 'source_ref');
  const conditions = requiredOrOptionalArray(
    value.conditions,
    'conditions',
    preserve ? [...preserve.conditions] : []
  );
  const exclusions = requiredOrOptionalArray(
    value.exclusions,
    'exclusions',
    preserve ? [...preserve.exclusions] : []
  );
  const expires_at = value.expires_at === undefined
    ? (preserve ? preserve.expires_at : null)
    : expiryField(value.expires_at);
  return { instruction, conditions, exclusions, source_ref, expires_at };
}

function sameIdentity(a, b) {
  return a.product_id === b.product_id &&
    a.participant_id === b.participant_id &&
    a.lesson_id === b.lesson_id;
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function emptyState() {
  return { schema_version: SCHEMA_VERSION, lessons: [], events: [] };
}

export function validateLesson(lesson, { allowMissingExpires = false } = {}) {
  if (!isObject(lesson)) throw new AppError('invalid_store', 'Lesson record is not an object', 500);
  for (const name of ['product_id', 'participant_id', 'lesson_id', 'instruction', 'source_ref']) {
    if (typeof lesson[name] !== 'string' || lesson[name].length === 0) {
      throw new AppError('invalid_store', `${name} is invalid`, 500);
    }
  }
  storedStringArray(lesson.conditions, 'conditions');
  storedStringArray(lesson.exclusions, 'exclusions');
  requiredExpiry(lesson, allowMissingExpires);
  if (!Number.isSafeInteger(lesson.revision) || lesson.revision < 1) {
    throw new AppError('invalid_store', 'Lesson revision is invalid', 500);
  }
  if (typeof lesson.disabled !== 'boolean') {
    throw new AppError('invalid_store', 'Lesson disabled flag is invalid', 500);
  }
}

export function validateEvent(event) {
  if (!isObject(event)) throw new AppError('invalid_store', 'Event record is not an object', 500);
  if (!Number.isSafeInteger(event.event_id) || event.event_id < 1) {
    throw new AppError('invalid_store', 'Event id is invalid', 500);
  }
  if (!['created', 'revised', 'disabled'].includes(event.kind)) {
    throw new AppError('invalid_store', 'Event kind is invalid', 500);
  }
  for (const name of ['product_id', 'participant_id', 'lesson_id', 'source_ref']) {
    if (typeof event[name] !== 'string' || event[name].length === 0) {
      throw new AppError('invalid_store', `${name} is invalid`, 500);
    }
  }
  if (!Number.isSafeInteger(event.revision) || event.revision < 1) {
    throw new AppError('invalid_store', 'Event revision is invalid', 500);
  }
}

export function validateState(state, { allowLegacy = false } = {}) {
  if (!isObject(state) || !Array.isArray(state.lessons) || !Array.isArray(state.events)) {
    throw new AppError('invalid_store', 'Store must contain schema_version, lessons and events', 500);
  }
  const isLegacy = state.schema_version === 1;
  if (state.schema_version !== SCHEMA_VERSION && !(allowLegacy && isLegacy)) {
    throw new AppError('invalid_store', 'Unsupported store schema_version', 500);
  }

  const identities = new Set();
  for (const lesson of state.lessons) {
    validateLesson(lesson, { allowMissingExpires: isLegacy });
    const key = identityKey(lesson);
    if (identities.has(key)) throw new AppError('invalid_store', 'Store contains duplicate lessons', 500);
    identities.add(key);
  }

  let previous = 0;
  const eventIds = new Set();
  for (const event of state.events) {
    validateEvent(event);
    if (event.event_id <= previous || eventIds.has(event.event_id)) {
      throw new AppError('invalid_store', 'Event ids must be unique and increasing', 500);
    }
    previous = event.event_id;
    eventIds.add(event.event_id);
  }
  return state;
}

export function identityKey(value) {
  return JSON.stringify([value.product_id, value.participant_id, value.lesson_id]);
}

function nextEventId(state) {
  return state.events.length ? state.events[state.events.length - 1].event_id + 1 : 1;
}

function findLesson(state, identity) {
  return state.lessons.find(lesson => sameIdentity(lesson, identity));
}

function notFound() {
  throw new AppError('not_found', 'Lesson was not found in the requested scope', 404);
}

export function createLesson(state, input) {
  validateState(state);
  const identity = identityOf(input);
  if (findLesson(state, identity)) {
    throw new AppError('duplicate_lesson', 'A lesson with this identity already exists', 409);
  }
  const content = contentFields(input);
  const lesson = { ...identity, ...content, revision: 1, disabled: false };
  state.lessons.push(lesson);
  state.events.push({
    event_id: nextEventId(state),
    kind: 'created',
    ...identity,
    revision: 1,
    source_ref: content.source_ref
  });
  return copy(lesson);
}

export function reviseLesson(state, input) {
  validateState(state);
  const identity = identityOf(input);
  const lesson = findLesson(state, identity);
  if (!lesson) notFound();
  const expected = expectedRevision(input.expected_revision);
  if (lesson.revision !== expected) {
    throw new AppError('revision_conflict', 'expected_revision does not match the current revision', 409);
  }
  const content = contentFields(input, lesson);
  Object.assign(lesson, content, { revision: lesson.revision + 1 });
  state.events.push({
    event_id: nextEventId(state),
    kind: 'revised',
    ...identity,
    revision: lesson.revision,
    source_ref: content.source_ref
  });
  return copy(lesson);
}

export function disableLesson(state, input) {
  validateState(state);
  const identity = identityOf(input);
  const lesson = findLesson(state, identity);
  if (!lesson) notFound();
  const expected = expectedRevision(input.expected_revision);
  if (lesson.revision !== expected) {
    throw new AppError('revision_conflict', 'expected_revision does not match the current revision', 409);
  }
  if (!lesson.disabled) {
    lesson.disabled = true;
    state.events.push({
      event_id: nextEventId(state),
      kind: 'disabled',
      ...identity,
      revision: lesson.revision,
      source_ref: lesson.source_ref
    });
  }
  return copy(lesson);
}

export function listLessons(state, input) {
  validateState(state);
  const scope = scopeOf(input);
  return state.lessons
    .filter(lesson => lesson.product_id === scope.product_id && lesson.participant_id === scope.participant_id)
    .sort((a, b) => compareStrings(a.lesson_id, b.lesson_id))
    .map(copy);
}

export function history(state, input) {
  validateState(state);
  const identity = identityOf(input);
  if (!findLesson(state, identity)) notFound();
  return state.events
    .filter(event => sameIdentity(event, identity))
    .sort((a, b) => a.event_id - b.event_id)
    .map(copy);
}

export function exportScope(state, input) {
  validateState(state);
  const scope = scopeOf(input);
  return {
    schema_version: SCHEMA_VERSION,
    product_id: scope.product_id,
    participant_id: scope.participant_id,
    lessons: listLessons(state, scope),
    events: state.events
      .filter(event => event.product_id === scope.product_id && event.participant_id === scope.participant_id)
      .sort((a, b) => a.event_id - b.event_id)
      .map(copy)
  };
}

function explainArray(value, name) {
  if (value === undefined) return [];
  return stringArray(value, name);
}

export function explain(state, input) {
  validateState(state);
  const value = objectOrFail(input);
  const scope = scopeOf(value);
  const text = textField(value.text);
  const now = value.now === undefined ? Date.now() : expiryField(value.now, 'now');
  const lowerText = text.toLowerCase();
  const invalidated = new Set(explainArray(value.invalidated_refs, 'invalidated_refs'));
  const overrides = new Set(explainArray(value.override_ids, 'override_ids'));
  const assessments = [];
  const items = [];

  for (const lesson of listLessons(state, scope)) {
    let disposition = 'applicable';
    if (lesson.disabled) {
      disposition = 'disabled';
    } else if (lesson.expires_at !== null && now >= lesson.expires_at) {
      disposition = 'expired';
    } else if (
      lesson.conditions.some(condition => !lowerText.includes(condition.toLowerCase())) ||
      lesson.exclusions.some(exclusion => lowerText.includes(exclusion.toLowerCase()))
    ) {
      disposition = 'inapplicable';
    } else if (invalidated.has(lesson.source_ref)) {
      disposition = 'unsupported';
    } else if (overrides.has(lesson.lesson_id)) {
      disposition = 'overridden';
    }

    assessments.push({
      lesson_id: lesson.lesson_id,
      revision: lesson.revision,
      disposition
    });

    if (disposition === 'applicable') {
      items.push({
        lesson_id: lesson.lesson_id,
        instruction: lesson.instruction,
        revision: lesson.revision,
        source_ref: lesson.source_ref
      });
    }
  }

  return { items, assessments };
}
