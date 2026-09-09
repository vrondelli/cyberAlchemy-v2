export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

const record = value => value !== null && typeof value === "object" && !Array.isArray(value);

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function requireRecord(value, message = "JSON object required") {
  if (!record(value)) throw new AppError("INVALID_INPUT", message);
  return value;
}

export function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("INVALID_INPUT", `${field} must be a nonempty string`);
  }
  return value;
}

function stringList(value, field) {
  if (!Array.isArray(value)) throw new AppError("INVALID_INPUT", `${field} must be an array`);
  const result = [];
  const seen = new Set();
  for (const item of value) {
    const normalized = nonEmptyString(item, `${field} entries`);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function normalizeConditions(value, field = "conditions") {
  return value === undefined ? [] : stringList(value, field);
}

export function normalizeScope(input) {
  requireRecord(input);
  return {
    product_id: nonEmptyString(input.product_id, "product_id"),
    participant_id: nonEmptyString(input.participant_id, "participant_id")
  };
}

export function normalizeIdentity(input) {
  const scope = normalizeScope(input);
  return {
    ...scope,
    lesson_id: nonEmptyString(input.lesson_id, "lesson_id")
  };
}

export function identityKey(identity) {
  return JSON.stringify([identity.product_id, identity.participant_id, identity.lesson_id]);
}

export function normalizeCreateInput(input) {
  const identity = normalizeIdentity(input);
  return {
    ...identity,
    instruction: nonEmptyString(input.instruction, "instruction"),
    conditions: normalizeConditions(input.conditions),
    exclusions: normalizeConditions(input.exclusions, "exclusions"),
    source_ref: nonEmptyString(input.source_ref, "source_ref")
  };
}

function expectedRevision(input) {
  if (!Number.isInteger(input.expected_revision) || input.expected_revision < 1) {
    throw new AppError("INVALID_INPUT", "expected_revision must be a positive integer");
  }
  return input.expected_revision;
}

export function normalizeReviseInput(input) {
  const identity = normalizeIdentity(input);
  const result = {
    ...identity,
    expected_revision: expectedRevision(input),
    instruction: nonEmptyString(input.instruction, "instruction"),
    source_ref: nonEmptyString(input.source_ref, "source_ref")
  };
  if (Object.hasOwn(input, "conditions")) result.conditions = stringList(input.conditions, "conditions");
  if (Object.hasOwn(input, "exclusions")) result.exclusions = stringList(input.exclusions, "exclusions");
  return result;
}

export function normalizeDisableInput(input) {
  return { ...normalizeIdentity(input), expected_revision: expectedRevision(input) };
}

export function normalizeExplainInput(input) {
  const scope = normalizeScope(input);
  if (typeof input.text !== "string") throw new AppError("INVALID_INPUT", "text must be a string");
  const invalidated_refs = input.invalidated_refs === undefined ? [] : stringList(input.invalidated_refs, "invalidated_refs");
  const override_ids = input.override_ids === undefined ? [] : stringList(input.override_ids, "override_ids");
  return { ...scope, text: input.text, invalidated_refs, override_ids };
}

export function makeLesson(input) {
  const normalized = normalizeCreateInput(input);
  return { ...normalized, revision: 1, disabled: false };
}

export function makeEvent(event_id, kind, lesson) {
  return {
    event_id,
    kind,
    identity: {
      product_id: lesson.product_id,
      participant_id: lesson.participant_id,
      lesson_id: lesson.lesson_id
    },
    revision: lesson.revision,
    source_ref: lesson.source_ref
  };
}

export function assessLessons(input, lessons) {
  const request = normalizeExplainInput(input);
  const scoped = lessons
    .filter(lesson => lesson.product_id === request.product_id && lesson.participant_id === request.participant_id)
    .sort((a, b) => a.lesson_id < b.lesson_id ? -1 : a.lesson_id > b.lesson_id ? 1 : 0);
  const text = request.text.toLocaleLowerCase();
  const invalidated = new Set(request.invalidated_refs);
  const overrides = new Set(request.override_ids);
  const assessments = [];
  const items = [];

  for (const lesson of scoped) {
    const conditions = Array.isArray(lesson.conditions) ? lesson.conditions : [];
    const exclusions = Array.isArray(lesson.exclusions) ? lesson.exclusions : [];
    let disposition = "applicable";
    if (lesson.disabled) {
      disposition = "disabled";
    } else if (conditions.some(condition => !text.includes(condition.toLocaleLowerCase())) ||
               exclusions.some(exclusion => text.includes(exclusion.toLocaleLowerCase()))) {
      disposition = "inapplicable";
    } else if (invalidated.has(lesson.source_ref)) {
      disposition = "unsupported";
    } else if (overrides.has(lesson.lesson_id)) {
      disposition = "overridden";
    }
    assessments.push({ lesson_id: lesson.lesson_id, revision: lesson.revision, disposition });
    if (disposition === "applicable") {
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

export function validateState(state) {
  if (!record(state) || state.schema_version !== 1 || !Array.isArray(state.lessons) || !Array.isArray(state.events)) {
    throw new AppError("INVALID_STATE", "store schema is invalid", 500);
  }
  const identities = new Set();
  for (const lesson of state.lessons) {
    if (!record(lesson)) throw new AppError("INVALID_STATE", "lesson record is invalid", 500);
    const identity = normalizeIdentity(lesson);
    const key = identityKey(identity);
    if (identities.has(key)) throw new AppError("INVALID_STATE", "duplicate lesson identity", 500);
    identities.add(key);
    nonEmptyString(lesson.instruction, "instruction");
    nonEmptyString(lesson.source_ref, "source_ref");
    stringList(lesson.conditions, "conditions");
    stringList(lesson.exclusions, "exclusions");
    if (!Number.isInteger(lesson.revision) || lesson.revision < 1 || typeof lesson.disabled !== "boolean") {
      throw new AppError("INVALID_STATE", "lesson revision or disabled flag is invalid", 500);
    }
  }
  let previous = 0;
  const eventIds = new Set();
  for (const event of state.events) {
    if (!record(event) || !Number.isInteger(event.event_id) || event.event_id < 1 || event.event_id <= previous || eventIds.has(event.event_id)) {
      throw new AppError("INVALID_STATE", "event sequence is invalid", 500);
    }
    previous = event.event_id;
    eventIds.add(event.event_id);
    if (!["created", "revised", "disabled"].includes(event.kind)) {
      throw new AppError("INVALID_STATE", "event kind is invalid", 500);
    }
    normalizeIdentity(event.identity);
    if (!Number.isInteger(event.revision) || event.revision < 1) throw new AppError("INVALID_STATE", "event revision is invalid", 500);
    nonEmptyString(event.source_ref, "source_ref");
  }
  return state;
}
