import {digestValue, freezeResult, nonEmptyString} from "./canonical.mjs";

export const GATEWAY_DECISION_OBSERVATION_SCHEMA = "are.gateway-decision-observation/v1";
const TYPES = new Set(["turn-preflight", "effect-evaluation", "turn-continuation"]);
const OUTCOMES = new Set(["direct", "gate", "block", "stop", "unknown"]);
const REASON = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const THREAD_REF = /^backend-thread:[0-9a-f]{64}$/;

function threadRef(event) {
  if (nonEmptyString(event.thread_id)) {
    const hashed = `backend-thread:${digestValue(event.thread_id)}`;
    return event.thread_ref === undefined || event.thread_ref === hashed ? hashed : null;
  }
  return THREAD_REF.test(event.thread_ref ?? "") ? event.thread_ref : null;
}

export function projectWrapperDecisionTrace(events = []) {
  if (!Array.isArray(events)) throw new TypeError("Decision trace must be an array.");
  return freezeResult(events.filter((event) => event && TYPES.has(event.decision_type)
    && threadRef(event) && DIGEST.test(event.decision_digest ?? "")
    && DIGEST.test(event.evidence_event_digest ?? "") && Number.isSafeInteger(event.event_sequence)
    && Number.isSafeInteger(event.observed_at_unix_ms))
    .map((event) => ({
      decision_type: event.decision_type,
      outcome: OUTCOMES.has(event.outcome) ? event.outcome : "unknown",
      thread_ref: threadRef(event),
      decision_digest: event.decision_digest,
      evidence_event_digest: event.evidence_event_digest,
      event_sequence: event.event_sequence,
      observed_at_unix_ms: event.observed_at_unix_ms,
      reason_codes: [...new Set((Array.isArray(event.reason_codes) ? event.reason_codes : [])
        .filter((reason) => typeof reason === "string" && REASON.test(reason)))].slice(0, 8),
    })).slice(-128));
}

export function projectGatewayDecisionObservation(input = {}) {
  if (!nonEmptyString(input.runtime_epoch_id) || !Number.isSafeInteger(input.observed_at_unix_ms)
    || !Array.isArray(input.sessions)) throw new TypeError("Gateway decision observation requires runtime facts.");
  const all = [];
  for (const session of input.sessions) {
    if (!nonEmptyString(session?.consumer_id) || !Array.isArray(session.decisions)) throw new TypeError("Invalid decision session facts.");
    const consumerRef = `gateway-consumer:${digestValue(session.consumer_id)}`;
    for (const decision of session.decisions) {
      if (!TYPES.has(decision?.decision_type) || !OUTCOMES.has(decision.outcome)
        || !/^backend-thread:[0-9a-f]{64}$/.test(decision.thread_ref ?? "")
        || !DIGEST.test(decision.decision_digest ?? "") || !DIGEST.test(decision.evidence_event_digest ?? "")
        || !Number.isSafeInteger(decision.event_sequence) || !Number.isSafeInteger(decision.observed_at_unix_ms)
        || !Array.isArray(decision.reason_codes) || decision.reason_codes.length > 8
        || decision.reason_codes.some((reason) => typeof reason !== "string" || !REASON.test(reason))) throw new TypeError("Invalid decision trace fact.");
      all.push({...decision, consumer_ref: consumerRef});
    }
  }
  all.sort((left, right) => right.observed_at_unix_ms - left.observed_at_unix_ms
    || left.consumer_ref.localeCompare(right.consumer_ref) || right.event_sequence - left.event_sequence);
  return freezeResult({
    schema_version: GATEWAY_DECISION_OBSERVATION_SCHEMA,
    source: "gateway-in-process",
    scope: "gateway-backend-decisions-not-durable-host-history",
    runtime_epoch_id: input.runtime_epoch_id,
    observed_at_unix_ms: input.observed_at_unix_ms,
    session_count: input.sessions.length,
    decision_count: all.length,
    truncated: all.length > 32,
    decisions: all.slice(0, 32),
    authority_effect: "none",
  });
}
