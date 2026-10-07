// Pinned full-S source-only projection and deterministic unexposed cohort gate.
// The mixed upstream object is accepted only at the projection boundary; all
// selection and qualification APIs consume the projected source-only pool.
import {createHash} from "node:crypto";

export const PINNED_FULL_S = Object.freeze({variant: "longmemeval_s_cleaned.json", revision: "98d7416c24c778c2fee6e6f3006e7a073259d48f", sha256: "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442", bytes: 277383467, records: 500});
export const REQUIRED_EXPOSED_IDS = Object.freeze(["01493427", "2e6d26dc", "32260d93", "eeda8a6d_abs", "09ba9854_abs", "06db6396", "cc06de0d", "54026fce"]);
export const EXPOSURE_REGISTRY = Object.freeze({
  schema_version: "are.longmemeval-exposure-registry/v1",
  exposed_ids: REQUIRED_EXPOSED_IDS,
  evidence: Object.freeze([
    Object.freeze({role: "note-v5-freeze", sha256: "3870e7a343381a229c6b1716e976bc91d39f076547ff097d19b6f0b99c2f3c1a"}),
    Object.freeze({role: "note-v5-qualification-results", sha256: "46ea370399643d6087261ec600868614c066ccc8840a1a5cad7587568b0fac8f"}),
    Object.freeze({role: "note-v5-generation-seal", sha256: "b28ef774ad8d64168822364a8ac4f0d259d710618f6b5370c76c826e06be1332"}),
    Object.freeze({role: "note-v5-score", sha256: "e2e0e29a3ed8089a54b8526eb4ae6fb36026b2187b7a8a08b3553fa1de3160e9"}),
    Object.freeze({role: "note-v5-result", sha256: "e590eba4cb9aa5b8f96803b39a1d0010961c2734350705816b24cb76d4d7140a"}),
  ]),
  authority_effect: "none",
});
const FIELDS = Object.freeze(["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"]);
const HASH = /^[a-f0-9]{64}$/;
const ID = /^(?:gpt4_)?[a-z0-9]{8}(?:_abs)?$/;
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const sha256 = (value) => createHash("sha256").update(Buffer.isBuffer(value) ? value : typeof value === "string" ? value : stable(value)).digest("hex");
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };
const text = (value) => typeof value === "string" && value.length > 0;
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const exposureDigest = sha256(EXPOSURE_REGISTRY);
const frozenSeed = sha256({source_sha256: PINNED_FULL_S.sha256, exposure_registry_sha256: exposureDigest, protocol: "unexposed-full-s-source-only-v2"});
const canonicalId = (value) => value.replace(/^gpt4_/, "");

function validateRow(row) {
  if (!exact(row, FIELDS) || !ID.test(row.question_id) || !text(row.question_type) || !text(row.question) || !text(row.question_date) || !Array.isArray(row.haystack_dates) || !Array.isArray(row.haystack_sessions) || row.haystack_dates.length < 1 || row.haystack_dates.length !== row.haystack_sessions.length) fail("unexposed-cohort.source-row-invalid");
  if (row.haystack_sessions.some((session) => !Array.isArray(session) || session.length < 1 || session.some((message) => !exact(message, ["role", "content"]) || !["user", "assistant"].includes(message.role) || typeof message.content !== "string"))) fail("unexposed-cohort.source-row-invalid");
}

export function projectPinnedFullSSourceOnly(sourceBytes) {
  if (!Buffer.isBuffer(sourceBytes) || sourceBytes.length !== PINNED_FULL_S.bytes || sha256(sourceBytes) !== PINNED_FULL_S.sha256) fail("unexposed-cohort.pinned-source-bytes-invalid");
  let raw;
  try { raw = JSON.parse(sourceBytes); } catch { fail("unexposed-cohort.source-json-invalid"); }
  if (!Array.isArray(raw) || raw.length !== PINNED_FULL_S.records) fail("unexposed-cohort.source-record-count-invalid");
  const ids = new Set();
  const rows = raw.map((item) => {
    const row = {
      question_id: structuredClone(item?.question_id),
      question_type: structuredClone(item?.question_type),
      question: structuredClone(item?.question),
      question_date: structuredClone(item?.question_date),
      haystack_dates: structuredClone(item?.haystack_dates),
      haystack_sessions: Array.isArray(item?.haystack_sessions) ? item.haystack_sessions.map((session) => Array.isArray(session) ? session.map((message) => ({role: message?.role, content: message?.content})) : session) : item?.haystack_sessions,
    };
    validateRow(row);
    if (ids.has(row.question_id)) fail("unexposed-cohort.duplicate-id");
    ids.add(row.question_id);
    return row;
  });
  const material = {schema_version: "are.longmemeval-full-s-source-only-pool/v1", source: PINNED_FULL_S, fields: FIELDS, rows, evaluator_fields_emitted: false, authority_effect: "none"};
  return Object.freeze({...material, pool_sha256: sha256(material)});
}

function verifyPool(pool) {
  if (pool?.schema_version !== "are.longmemeval-full-s-source-only-pool/v1" || stable(pool.source) !== stable(PINNED_FULL_S) || stable(pool.fields) !== stable(FIELDS) || pool.evaluator_fields_emitted !== false || pool.authority_effect !== "none" || !Array.isArray(pool.rows) || pool.rows.length !== PINNED_FULL_S.records) fail("unexposed-cohort.pool-invalid");
  const ids = new Set();
  for (const row of pool.rows) { validateRow(row); if (ids.has(row.question_id)) fail("unexposed-cohort.duplicate-id"); ids.add(row.question_id); }
  if (!REQUIRED_EXPOSED_IDS.every((id) => ids.has(id))) fail("unexposed-cohort.exposure-registry-source-mismatch");
  const material = Object.fromEntries(Object.entries(pool).filter(([key]) => key !== "pool_sha256"));
  if (pool.pool_sha256 !== sha256(material)) fail("unexposed-cohort.pool-digest-invalid");
}

export function buildUnexposedCandidateQueue(pool, {qualification_window_size = 32} = {}) {
  verifyPool(pool);
  if (!Number.isSafeInteger(qualification_window_size) || qualification_window_size < 4 || qualification_window_size > 64) fail("unexposed-cohort.window-invalid");
  const exposed = new Set(REQUIRED_EXPOSED_IDS);
  const candidates = pool.rows.filter((row) => !exposed.has(canonicalId(row.question_id))).map((row) => ({question_id: row.question_id, question_type: row.question_type, source_row_sha256: sha256(row), selection_key: sha256(`${frozenSeed}:${row.question_id}`), history_sessions: row.haystack_sessions.length, history_messages: row.haystack_sessions.reduce((total, session) => total + session.length, 0)})).sort((a, b) => a.selection_key.localeCompare(b.selection_key) || a.question_id.localeCompare(b.question_id));
  if (candidates.length !== PINNED_FULL_S.records - REQUIRED_EXPOSED_IDS.length) fail("unexposed-cohort.exposure-cardinality-invalid");
  const material = {schema_version: "are.longmemeval-unexposed-candidate-queue/v2", pool_sha256: pool.pool_sha256, exposure_registry_sha256: exposureDigest, frozen_seed_sha256: frozenSeed, exposed_ids: [...REQUIRED_EXPOSED_IDS].sort(), eligible_count: candidates.length, qualification_window: candidates.slice(0, qualification_window_size), selection_uses_evaluator_data: false, authority_effect: "none"};
  return Object.freeze({...material, queue_sha256: sha256(material)});
}

export function materializeQualificationSourceBundle(pool, queue) {
  verifyPool(pool);
  verifyQueue(queue);
  if (queue.pool_sha256 !== pool.pool_sha256) fail("unexposed-cohort.pool-queue-mismatch");
  const byId = new Map(pool.rows.map((row) => [row.question_id, row]));
  const rows = queue.qualification_window.map((candidate) => {
    const row = byId.get(candidate.question_id);
    if (!row || sha256(row) !== candidate.source_row_sha256) fail("unexposed-cohort.source-row-binding-invalid");
    return row;
  });
  const material = {schema_version: "are.longmemeval-qualification-source-bundle/v1", queue_sha256: queue.queue_sha256, fields: FIELDS, rows, evaluator_fields_emitted: false, authority_effect: "none"};
  return Object.freeze({...material, bundle_sha256: sha256(material)});
}

function verifyQueue(queue) {
  if (queue?.schema_version !== "are.longmemeval-unexposed-candidate-queue/v2" || queue.exposure_registry_sha256 !== exposureDigest || queue.frozen_seed_sha256 !== frozenSeed || stable(queue.exposed_ids) !== stable([...REQUIRED_EXPOSED_IDS].sort()) || !Array.isArray(queue.qualification_window) || queue.selection_uses_evaluator_data !== false || queue.authority_effect !== "none") fail("unexposed-cohort.queue-invalid");
  if (queue.eligible_count !== PINNED_FULL_S.records - REQUIRED_EXPOSED_IDS.length || queue.qualification_window.length < 4 || queue.qualification_window.length > 64) fail("unexposed-cohort.queue-cardinality-invalid");
  const ids = new Set();
  for (const candidate of queue.qualification_window) {
    if (!exact(candidate, ["question_id", "question_type", "source_row_sha256", "selection_key", "history_sessions", "history_messages"]) || !ID.test(candidate.question_id) || REQUIRED_EXPOSED_IDS.includes(canonicalId(candidate.question_id)) || ids.has(candidate.question_id) || !text(candidate.question_type) || !HASH.test(candidate.source_row_sha256 ?? "") || !HASH.test(candidate.selection_key ?? "") || !Number.isSafeInteger(candidate.history_sessions) || candidate.history_sessions < 1 || !Number.isSafeInteger(candidate.history_messages) || candidate.history_messages < 1) fail("unexposed-cohort.queue-entry-invalid");
    ids.add(candidate.question_id);
  }
  const material = Object.fromEntries(Object.entries(queue).filter(([key]) => key !== "queue_sha256"));
  if (queue.queue_sha256 !== sha256(material)) fail("unexposed-cohort.queue-digest-invalid");
}

export function createTokenizerQualification({candidate, model, tokenizer_id, tokenizer_version, endpoint_profile_sha256, wire_sha256, original_history_tokens, output_reserve = 1024, context_limit = 8000}) {
  if (!candidate || !ID.test(candidate.question_id) || !HASH.test(candidate.source_row_sha256 ?? "") || model !== "glm-5.3-flash" || !text(tokenizer_id) || !text(tokenizer_version) || !HASH.test(endpoint_profile_sha256 ?? "") || !HASH.test(wire_sha256 ?? "") || !Number.isSafeInteger(original_history_tokens) || original_history_tokens < 0 || output_reserve !== 1024 || context_limit !== 8000) fail("unexposed-cohort.qualification-input-invalid");
  const material = {schema_version: "are.longmemeval-tokenizer-qualification/v1", question_id: candidate.question_id, source_row_sha256: candidate.source_row_sha256, model, tokenizer_id, tokenizer_version, endpoint_profile_sha256, wire_sha256, original_history_tokens, output_reserve, context_limit, long_history: original_history_tokens > context_limit, measurement_kind: "actual-wire-tokenizer", authority_effect: "none"};
  return Object.freeze({...material, qualification_sha256: sha256(material)});
}

export function selectTokenizerQualifiedCohort(queue, qualifications, {size = 4} = {}) {
  verifyQueue(queue);
  if (!Array.isArray(qualifications) || qualifications.length !== queue.qualification_window.length || !Number.isSafeInteger(size) || size !== 4) fail("unexposed-cohort.qualification-coverage-invalid");
  const expected = new Map(queue.qualification_window.map((candidate) => [candidate.question_id, candidate]));
  const seen = new Set(), profiles = new Set();
  for (const item of qualifications) {
    const candidate = expected.get(item?.question_id);
    if (!candidate || seen.has(item.question_id) || item.source_row_sha256 !== candidate.source_row_sha256 || item.schema_version !== "are.longmemeval-tokenizer-qualification/v1" || item.model !== "glm-5.3-flash" || item.context_limit !== 8000 || item.output_reserve !== 1024 || item.measurement_kind !== "actual-wire-tokenizer" || item.authority_effect !== "none") fail("unexposed-cohort.qualification-binding-invalid");
    const material = Object.fromEntries(Object.entries(item).filter(([key]) => key !== "qualification_sha256"));
    if (item.qualification_sha256 !== sha256(material)) fail("unexposed-cohort.qualification-digest-invalid");
    seen.add(item.question_id);
    profiles.add(`${item.tokenizer_id}|${item.tokenizer_version}|${item.endpoint_profile_sha256}`);
  }
  if (seen.size !== expected.size || profiles.size !== 1) fail("unexposed-cohort.qualification-coverage-invalid");
  const byId = new Map(qualifications.map((item) => [item.question_id, item]));
  const selected = [], types = new Set();
  for (const candidate of queue.qualification_window) {
    const qualification = byId.get(candidate.question_id);
    if (qualification.long_history !== true || qualification.original_history_tokens <= qualification.context_limit || types.has(candidate.question_type)) continue;
    selected.push({...candidate, original_history_tokens: qualification.original_history_tokens, qualification_sha256: qualification.qualification_sha256});
    types.add(candidate.question_type);
    if (selected.length === size) break;
  }
  if (selected.length < size) fail("unexposed-cohort.insufficient-tokenizer-qualified-diversity");
  const material = {schema_version: "are.longmemeval-qualified-cohort/v2", queue_sha256: queue.queue_sha256, cohort_size: size, tasks: selected, exposure_registry_sha256: exposureDigest, exposed_ids_excluded: selected.every((item) => !REQUIRED_EXPOSED_IDS.includes(canonicalId(item.question_id))), tokenizer_profile: [...profiles][0], tokenizer_qualified: true, authority_effect: "none"};
  return Object.freeze({...material, cohort_sha256: sha256(material)});
}
