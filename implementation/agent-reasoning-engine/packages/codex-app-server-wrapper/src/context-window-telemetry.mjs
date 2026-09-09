import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CODEX_CONTEXT_WINDOW_OBSERVATION_SCHEMA = "are.codex-context-window-observation/v1";
export const CODEX_CONTEXT_WINDOW_TELEMETRY_SCHEMA = "are.codex-context-window-telemetry/v1";

const TOKEN_USAGE_METHOD = "thread/tokenUsage/updated";
const DEPRECATED_COMPACTED_METHOD = "thread/compacted";

function finiteNonNegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function tokenBreakdown(value) {
  if (!isRecord(value)) return null;
  const fields = ["inputTokens", "cachedInputTokens", "cacheWriteInputTokens", "outputTokens", "reasoningOutputTokens", "totalTokens"];
  if (fields.some((field) => !finiteNonNegative(value[field]))) return null;
  return Object.fromEntries(fields.map((field) => [field, value[field]]));
}

function sealObservation(material) {
  const canonical = freezeResult(material);
  return freezeResult({...canonical, observation_digest: digestValue(canonical)});
}

export function extractCodexContextWindowObservation(message) {
  if (!isRecord(message)) {
    return fail("codex-context-window-observation", ["context-window.message-invalid"]);
  }
  if (!nonEmptyString(message.method)) return freezeResult({ok: true, disposition: "not-applicable", observation: null, authority_effect: "none"});
  const params = isRecord(message.params) ? message.params : {};
  if (message.method === TOKEN_USAGE_METHOD) {
    const tokenUsage = isRecord(params.tokenUsage) ? params.tokenUsage : null;
    const last = tokenBreakdown(tokenUsage?.last);
    const total = tokenBreakdown(tokenUsage?.total);
    const modelContextWindow = tokenUsage?.modelContextWindow;
    if (!nonEmptyString(params.threadId) || !last || !total || !finiteNonNegative(modelContextWindow) || modelContextWindow === 0) {
      return fail("codex-context-window-observation", ["context-window.token-usage-invalid"]);
    }
    const observation = sealObservation({
      schema_version: CODEX_CONTEXT_WINDOW_OBSERVATION_SCHEMA,
      event_kind: "token-usage-updated",
      method: message.method,
      thread_id: params.threadId,
      turn_id: nonEmptyString(params.turnId) ? params.turnId : null,
      item_id: null,
      token_usage: {last, total, model_context_window: modelContextWindow},
      observed_last_total_to_model_window_ratio: last.totalTokens / modelContextWindow,
      authority_effect: "none",
    });
    return freezeResult({ok: true, disposition: "observed", observation, authority_effect: "none"});
  }

  const item = isRecord(params.item) ? params.item : {};
  if (["item/started", "item/completed"].includes(message.method) && item.type === "contextCompaction") {
    if (!nonEmptyString(params.threadId) || !nonEmptyString(item.id)) {
      return fail("codex-context-window-observation", ["context-window.compaction-item-invalid"]);
    }
    const observation = sealObservation({
      schema_version: CODEX_CONTEXT_WINDOW_OBSERVATION_SCHEMA,
      event_kind: message.method === "item/started" ? "context-compaction-started" : "context-compaction-completed",
      method: message.method,
      thread_id: params.threadId,
      turn_id: nonEmptyString(params.turnId) ? params.turnId : null,
      item_id: item.id,
      token_usage: null,
      observed_last_total_to_model_window_ratio: null,
      authority_effect: "none",
    });
    return freezeResult({ok: true, disposition: "observed", observation, authority_effect: "none"});
  }

  if (message.method === DEPRECATED_COMPACTED_METHOD) {
    if (!nonEmptyString(params.threadId)) return fail("codex-context-window-observation", ["context-window.compacted-thread-invalid"]);
    const observation = sealObservation({
      schema_version: CODEX_CONTEXT_WINDOW_OBSERVATION_SCHEMA,
      event_kind: "context-compaction-completed-deprecated",
      method: message.method,
      thread_id: params.threadId,
      turn_id: nonEmptyString(params.turnId) ? params.turnId : null,
      item_id: null,
      token_usage: null,
      observed_last_total_to_model_window_ratio: null,
      authority_effect: "none",
    });
    return freezeResult({ok: true, disposition: "observed", observation, authority_effect: "none"});
  }
  return freezeResult({ok: true, disposition: "not-applicable", observation: null, authority_effect: "none"});
}

function initialThreadState(threadId) {
  return {
    thread_id: threadId,
    token_usage_update_count: 0,
    compaction_started_count: 0,
    compaction_completed_count: 0,
    deprecated_compaction_count: 0,
    duplicate_observation_count: 0,
    first_compaction_turn_id: null,
    latest_token_usage: null,
    peak_last_input_tokens: 0,
    peak_last_total_to_model_window_ratio: 0,
    observation_digests: [],
  };
}

export function createCodexContextWindowTracker() {
  const threads = new Map();
  const seenObservations = new Set();
  return Object.freeze({
    observe(message) {
      const extracted = extractCodexContextWindowObservation(message);
      if (!extracted.ok || extracted.disposition !== "observed") return extracted;
      const observation = extracted.observation;
      const state = threads.get(observation.thread_id) ?? initialThreadState(observation.thread_id);
      if (seenObservations.has(observation.observation_digest)) {
        state.duplicate_observation_count += 1;
        threads.set(observation.thread_id, state);
        return freezeResult({ok: true, disposition: "duplicate", observation_digest: observation.observation_digest, authority_effect: "none"});
      }
      seenObservations.add(observation.observation_digest);
      state.observation_digests.push(observation.observation_digest);
      if (observation.event_kind === "token-usage-updated") {
        state.token_usage_update_count += 1;
        state.latest_token_usage = observation.token_usage;
        state.peak_last_input_tokens = Math.max(state.peak_last_input_tokens, observation.token_usage.last.inputTokens);
        state.peak_last_total_to_model_window_ratio = Math.max(state.peak_last_total_to_model_window_ratio, observation.observed_last_total_to_model_window_ratio);
      } else {
        if (state.first_compaction_turn_id === null) state.first_compaction_turn_id = observation.turn_id;
        if (observation.event_kind === "context-compaction-started") state.compaction_started_count += 1;
        else if (observation.event_kind === "context-compaction-completed") state.compaction_completed_count += 1;
        else state.deprecated_compaction_count += 1;
      }
      threads.set(observation.thread_id, state);
      return extracted;
    },
    snapshot() {
      const threadValues = [...threads.values()]
        .sort((left, right) => left.thread_id.localeCompare(right.thread_id))
        .map((state) => freezeResult({...state, observation_digests: [...state.observation_digests]}));
      const material = freezeResult({
        schema_version: CODEX_CONTEXT_WINDOW_TELEMETRY_SCHEMA,
        threads: threadValues,
        authority_effect: "none",
        claim_ceiling: "Observed Codex app-server telemetry only; it does not prove retained semantic content, correctness, or authority.",
      });
      return freezeResult({...material, telemetry_digest: digestValue(material)});
    },
  });
}
