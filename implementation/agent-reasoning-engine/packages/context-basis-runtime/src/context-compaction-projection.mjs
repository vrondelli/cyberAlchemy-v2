import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
  digestValue,
  fail,
  isRecord,
  nonEmptyString,
  succeed,
} from "./canonical.mjs";

export const CONTEXT_COMPACTION_PROJECTION_SCHEMA = "are.context-compaction-projection/v1";
export const DEFAULT_CONTEXT_COMPACTION_POLICY = deepFreeze({
  max_inline_bytes: 32 * 1024,
  recent_active_units: 8,
  preview_head_characters: 192,
  preview_tail_characters: 192,
  pinned_event_kinds: [
    "authority-posture-recorded",
    "constraint-recorded",
    "context-gap-recorded",
    "counterevidence-recorded",
    "request-corrected",
    "request-interpreted",
  ],
});

const projectionCache = new WeakMap();
const immutableInputs = new WeakSet();

function isDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  if (!Object.isFrozen(value)) return false;
  seen.add(value);
  return Object.values(value).every((child) => isDeepFrozen(child, seen));
}

function cacheEligible(input) {
  if (immutableInputs.has(input)) return true;
  if (!isDeepFrozen(input)) return false;
  immutableInputs.add(input);
  return true;
}

function projectionBytes(value) {
  return Buffer.byteLength(canonicalJson(value), "utf8");
}

function eventIdentity(event, index) {
  return event.event_id ?? event.event_digest ?? `event:${String(index + 1).padStart(8, "0")}`;
}

function normalizeEvent(event, index) {
  if (!isRecord(event) || !nonEmptyString(event.event_kind)) return null;
  const eventId = eventIdentity(event, index);
  if (!nonEmptyString(eventId)) return null;
  const sequence = Number.isSafeInteger(event.sequence) && event.sequence >= 0 ? event.sequence : index + 1;
  const material = canonicalizeJson({
    event_id: eventId,
    sequence,
    event_kind: event.event_kind,
    tool_call_id: nonEmptyString(event.tool_call_id) ? event.tool_call_id : null,
    retention_class: ["pinned", "active", "foldable"].includes(event.retention_class) ? event.retention_class : null,
    content: Object.hasOwn(event, "content") ? event.content : null,
    provenance_refs: Array.isArray(event.provenance_refs) ? [...new Set(event.provenance_refs.filter(nonEmptyString))].sort() : [],
    source_locator: nonEmptyString(event.source_locator) ? event.source_locator : null,
  });
  return deepFreeze({
    ...material,
    source_event_digest: nonEmptyString(event.event_digest) ? event.event_digest : null,
    event_digest: digestValue(material),
  });
}

function compareEvents(left, right) {
  return left.sequence - right.sequence || left.event_id.localeCompare(right.event_id);
}

function makeUnits(events) {
  const units = new Map();
  for (const event of events) {
    const unitId = event.tool_call_id ? `tool:${event.tool_call_id}` : `event:${event.event_id}`;
    if (!units.has(unitId)) units.set(unitId, {unit_id: unitId, events: []});
    units.get(unitId).events.push(event);
  }
  return [...units.values()].map((unit) => ({
    unit_id: unit.unit_id,
    events: unit.events.sort(compareEvents),
    last_sequence: Math.max(...unit.events.map((event) => event.sequence)),
  })).sort((left, right) => left.last_sequence - right.last_sequence || left.unit_id.localeCompare(right.unit_id));
}

function exactEvent(event) {
  return canonicalizeJson({...event, projection_posture: "exact"});
}

function previewText(content) {
  if (typeof content === "string") return content;
  return canonicalJson(content);
}

function foldedEvent(event, sourceEpochId, policy, includePreview = true) {
  const text = previewText(event.content);
  const head = text.slice(0, policy.preview_head_characters);
  const tail = text.slice(Math.max(head.length, text.length - policy.preview_tail_characters));
  return canonicalizeJson({
    event_id: event.event_id,
    sequence: event.sequence,
    event_kind: event.event_kind,
    tool_call_id: event.tool_call_id,
    event_digest: event.event_digest,
    source_event_digest: event.source_event_digest,
    original_bytes: projectionBytes(event.content),
    source_locator: event.source_locator ?? `reasoning-epoch:${sourceEpochId}#${event.event_id}`,
    omission_marker: `[reasoning event ${event.event_id} folded; recover from source locator]`,
    ...(includePreview ? {preview: {head, tail, omitted_characters: Math.max(0, text.length - head.length - tail.length)}} : {}),
    projection_posture: "folded",
  });
}

function projectedContext(sourceEpochId, pinnedUnits, activeUnits, foldedUnits, policy, options = {}) {
  const exact = [...pinnedUnits, ...activeUnits]
    .flatMap((unit) => unit.events.map(exactEvent))
    .sort(compareEvents);
  const folded = foldedUnits
    .flatMap((unit) => unit.events.map((event) => foldedEvent(event, sourceEpochId, policy, options.include_previews !== false)))
    .sort(compareEvents);
  return canonicalizeJson({
    schema_version: CONTEXT_COMPACTION_PROJECTION_SCHEMA,
    source_epoch_id: sourceEpochId,
    pinned_events: exact.filter((event) => event.retention_class === "pinned" || policy.pinned_event_kinds.includes(event.event_kind)),
    active_events: exact.filter((event) => event.retention_class !== "pinned" && !policy.pinned_event_kinds.includes(event.event_kind)),
    folded_events: folded,
    folded_partition: options.folded_partition ?? null,
    authority_effect: "none",
    claim_ceiling: "Context projection only; cache reuse or survival does not prove freshness, correctness, provenance, or authority.",
  });
}

function normalizePolicy(policy) {
  const merged = {...DEFAULT_CONTEXT_COMPACTION_POLICY, ...(isRecord(policy) ? policy : {})};
  return {
    max_inline_bytes: Number.isSafeInteger(merged.max_inline_bytes) && merged.max_inline_bytes > 0 ? merged.max_inline_bytes : DEFAULT_CONTEXT_COMPACTION_POLICY.max_inline_bytes,
    recent_active_units: Number.isSafeInteger(merged.recent_active_units) && merged.recent_active_units >= 0 ? merged.recent_active_units : DEFAULT_CONTEXT_COMPACTION_POLICY.recent_active_units,
    preview_head_characters: Number.isSafeInteger(merged.preview_head_characters) && merged.preview_head_characters >= 0 ? merged.preview_head_characters : DEFAULT_CONTEXT_COMPACTION_POLICY.preview_head_characters,
    preview_tail_characters: Number.isSafeInteger(merged.preview_tail_characters) && merged.preview_tail_characters >= 0 ? merged.preview_tail_characters : DEFAULT_CONTEXT_COMPACTION_POLICY.preview_tail_characters,
    pinned_event_kinds: [...new Set((Array.isArray(merged.pinned_event_kinds) ? merged.pinned_event_kinds : []).filter(nonEmptyString))].sort(),
  };
}

function partitionRef(sourceEpochId, units) {
  const events = units.flatMap((unit) => unit.events).sort(compareEvents);
  if (events.length === 0) return null;
  return canonicalizeJson({
    source_locator: `reasoning-epoch:${sourceEpochId}`,
    event_count: events.length,
    first_sequence: events[0].sequence,
    last_sequence: events.at(-1).sequence,
    event_manifest_digest: digestValue(events.map((event) => ({event_id: event.event_id, event_digest: event.event_digest}))),
    omission_marker: `[${events.length} reasoning events folded into an epoch partition; recover from source locator]`,
  });
}

export function projectCompactionAwareContext(input, projectionPolicy = {}) {
  if (!isRecord(input) || !nonEmptyString(input.source_epoch_id) || !Array.isArray(input.events)) {
    return fail("context-compaction-projection", ["compaction.source-epoch-and-events-required"]);
  }
  const policy = normalizePolicy(projectionPolicy);
  const policyKey = canonicalJson(policy);
  const eligibleForCache = cacheEligible(input);
  const cached = eligibleForCache ? projectionCache.get(input)?.get(policyKey) : null;
  if (cached) return cached;
  let events;
  try {
    events = input.events.map(normalizeEvent);
  } catch {
    return fail("context-compaction-projection", ["compaction.event-content-invalid"]);
  }
  if (events.some((event) => event === null)) return fail("context-compaction-projection", ["compaction.event-invalid"]);
  const ids = events.map((event) => event.event_id);
  if (new Set(ids).size !== ids.length) return fail("context-compaction-projection", ["compaction.event-id-duplicate"]);

  const units = makeUnits(events);
  const pinned = units.filter((unit) => unit.events.some((event) => event.retention_class === "pinned" || policy.pinned_event_kinds.includes(event.event_kind)));
  const unpinned = units.filter((unit) => !pinned.includes(unit));
  const active = unpinned.slice(Math.max(0, unpinned.length - policy.recent_active_units));
  const folded = unpinned.slice(0, Math.max(0, unpinned.length - policy.recent_active_units));
  const transformations = [];

  const pinnedOnly = projectedContext(input.source_epoch_id, pinned, [], [], policy);
  if (projectionBytes(pinnedOnly) > policy.max_inline_bytes) {
    return fail("context-compaction-projection", ["context.mandatory-budget-exceeded"], [{pinned_bytes: projectionBytes(pinnedOnly), max_inline_bytes: policy.max_inline_bytes}]);
  }

  let selectedActive = [...active];
  let selectedFolded = [...folded];
  let projection = projectedContext(input.source_epoch_id, pinned, selectedActive, selectedFolded, policy);
  if (projectionBytes(projection) > policy.max_inline_bytes && selectedFolded.length > 0) {
    projection = projectedContext(input.source_epoch_id, pinned, selectedActive, selectedFolded, policy, {include_previews: false});
    transformations.push({kind: "folded-previews-excluded", unit_count: selectedFolded.length});
  }
  while (projectionBytes(projection) > policy.max_inline_bytes && selectedActive.length > 0) {
    const moved = selectedActive.shift();
    selectedFolded.push(moved);
    selectedFolded.sort((left, right) => left.last_sequence - right.last_sequence || left.unit_id.localeCompare(right.unit_id));
    transformations.push({kind: "active-unit-folded", unit_id: moved.unit_id});
    projection = projectedContext(input.source_epoch_id, pinned, selectedActive, selectedFolded, policy, {include_previews: false});
  }
  if (projectionBytes(projection) > policy.max_inline_bytes && selectedFolded.length > 0) {
    const foldedPartition = partitionRef(input.source_epoch_id, selectedFolded);
    transformations.push({kind: "folded-events-partitioned", event_count: selectedFolded.flatMap((unit) => unit.events).length});
    projection = projectedContext(input.source_epoch_id, pinned, selectedActive, [], policy, {include_previews: false, folded_partition: foldedPartition});
  }
  if (projectionBytes(projection) > policy.max_inline_bytes) {
    return fail("context-compaction-projection", ["context.mandatory-budget-exceeded"], [{projected_bytes: projectionBytes(projection), max_inline_bytes: policy.max_inline_bytes}]);
  }

  const sourceManifest = events.sort(compareEvents).map((event) => ({event_id: event.event_id, event_digest: event.event_digest}));
  const exactIds = [...projection.pinned_events, ...projection.active_events].map((event) => event.event_id);
  const foldedIds = projection.folded_events.map((event) => event.event_id);
  const value = canonicalizeJson({
    projected_context: projection,
    source_event_count: events.length,
    source_manifest_digest: digestValue(sourceManifest),
    exact_event_ids: exactIds.sort(),
    folded_event_ids: foldedIds.sort(),
    folded_partition_event_count: projection.folded_partition?.event_count ?? 0,
    projected_bytes: projectionBytes(projection),
    source_bytes: projectionBytes(events),
    max_inline_bytes: policy.max_inline_bytes,
    projection_policy: policy,
    transformations,
    source_retained: true,
  });
  const result = succeed("are.context-compaction-projection-result/v1", value, {disposition: "projected"});
  if (eligibleForCache) {
    const entries = projectionCache.get(input) ?? new Map();
    entries.set(policyKey, result);
    projectionCache.set(input, entries);
  }
  return result;
}

export function verifyCompactionProjection(result, input) {
  if (!isRecord(result) || result.ok !== true || !isRecord(result.value) || !isRecord(input) || !Array.isArray(input.events)) {
    return fail("context-compaction-verification", ["compaction.projection-and-source-required"]);
  }
  let events;
  try {
    events = input.events.map(normalizeEvent);
  } catch {
    return fail("context-compaction-verification", ["compaction.event-content-invalid"]);
  }
  if (events.some((event) => event === null)) return fail("context-compaction-verification", ["compaction.event-invalid"]);
  const sourceManifestDigest = digestValue(events.sort(compareEvents).map((event) => ({event_id: event.event_id, event_digest: event.event_digest})));
  const projection = result.value.projected_context;
  const represented = new Set([
    ...projection.pinned_events.map((event) => event.event_id),
    ...projection.active_events.map((event) => event.event_id),
    ...projection.folded_events.map((event) => event.event_id),
  ]);
  const partitioned = projection.folded_partition?.event_count ?? 0;
  const sourceCount = events.length;
  const reasons = [];
  const policy = normalizePolicy(result.value.projection_policy);
  const projectedEvents = [...projection.pinned_events, ...projection.active_events, ...projection.folded_events];
  const projectedIds = projectedEvents.map((event) => event.event_id);
  const sourceIds = new Set(events.map((event) => event.event_id));
  const exactIds = new Set([...projection.pinned_events, ...projection.active_events].map((event) => event.event_id));
  if (digestValue(result.value) !== result.digest) reasons.push("compaction.projection-digest-invalid");
  if (sourceManifestDigest !== result.value.source_manifest_digest) reasons.push("compaction.source-manifest-drift");
  if (represented.size + partitioned !== sourceCount) reasons.push("compaction.source-events-unrepresented");
  if (new Set(projectedIds).size !== projectedIds.length || projectedIds.some((eventId) => !sourceIds.has(eventId))) reasons.push("compaction.projected-event-identity-invalid");
  if (projectionBytes(projection) !== result.value.projected_bytes || result.value.projected_bytes > result.value.max_inline_bytes) reasons.push("compaction.projected-budget-invalid");
  const requiredPinned = events.filter((event) => event.retention_class === "pinned" || policy.pinned_event_kinds.includes(event.event_kind));
  if (requiredPinned.some((event) => !exactIds.has(event.event_id))) reasons.push("compaction.pinned-event-not-exact");
  for (const exact of [...projection.pinned_events, ...projection.active_events]) {
    const source = events.find((event) => event.event_id === exact.event_id);
    if (!source || exact.event_digest !== source.event_digest || canonicalJson(exact.content) !== canonicalJson(source.content)) reasons.push("compaction.exact-event-drift");
  }
  for (const folded of projection.folded_events) {
    const source = events.find((event) => event.event_id === folded.event_id);
    if (!source || folded.event_digest !== source.event_digest || !nonEmptyString(folded.source_locator)) reasons.push("compaction.folded-event-invalid");
  }
  if (projection.folded_partition !== null) {
    const partitionEvents = events.filter((event) => !exactIds.has(event.event_id));
    const partitionManifestDigest = digestValue(partitionEvents.sort(compareEvents).map((event) => ({event_id: event.event_id, event_digest: event.event_digest})));
    if (projection.folded_events.length > 0
      || projection.folded_partition.event_count !== partitionEvents.length
      || projection.folded_partition.event_manifest_digest !== partitionManifestDigest
      || !nonEmptyString(projection.folded_partition.source_locator)) reasons.push("compaction.folded-partition-invalid");
  }
  for (const toolCallId of new Set(events.map((event) => event.tool_call_id).filter(Boolean))) {
    const toolEventIds = events.filter((event) => event.tool_call_id === toolCallId).map((event) => event.event_id);
    const exactCount = toolEventIds.filter((eventId) => exactIds.has(eventId)).length;
    const foldedCount = toolEventIds.filter((eventId) => projection.folded_events.some((event) => event.event_id === eventId)).length;
    const partitionCount = projection.folded_partition === null ? 0 : toolEventIds.length - exactCount;
    if (![exactCount, foldedCount, partitionCount].includes(toolEventIds.length)) reasons.push("compaction.tool-unit-split");
  }
  if (reasons.length > 0) return fail("context-compaction-verification", reasons);
  return succeed("are.context-compaction-verification/v1", {
    projection_digest: result.digest,
    source_manifest_digest: sourceManifestDigest,
    represented_event_count: represented.size + partitioned,
    exact_event_count: projection.pinned_events.length + projection.active_events.length,
    folded_event_count: projection.folded_events.length + partitioned,
    source_retained: result.value.source_retained === true,
  });
}
