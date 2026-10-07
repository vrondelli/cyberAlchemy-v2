import {statSync} from "node:fs";
import {isAbsolute} from "node:path";

import {selectRecoverableCheckpoint, verifyReasoningStateLog} from "../../reasoning-state-runtime/index.mjs";
import {IMPROVEMENT_SIGNAL_SCHEMA, verifyEvolutionRecord} from "../index.mjs";

const LEDGER_ID = "are-evolution-gateway-signal-inbox/v1";
const EVENT_KIND = "evolution.improvement-signal-candidate";
const MAX_LOG_BYTES = 16 * 1024 * 1024;
const MAX_CANDIDATES = 16;

function failed(reason_code) {
  return {schema_version: "are.gateway-evolution-signal-observation/v1", evidence_status: "unavailable",
    observed_at_unix_ms: Date.now(), candidate_count: null, candidates: [], candidates_truncated: false,
    log_digest: null, reason_codes: [reason_code], authority_effect: "none"};
}

export function observeGatewayEvolutionSignals({log_path} = {}) {
  if (typeof log_path !== "string" || !isAbsolute(log_path)) return failed("evolution.signal-log-path-invalid");
  try {
    if (statSync(log_path).size > MAX_LOG_BYTES) return failed("evolution.signal-log-too-large");
  } catch {
    return failed("evolution.signal-log-unavailable");
  }
  const verified = verifyReasoningStateLog(log_path, {expected_ledger_id: LEDGER_ID});
  if (!verified.ok) return failed("evolution.signal-log-invalid");
  const checkpoint = selectRecoverableCheckpoint(verified);
  if (!checkpoint.ok) return failed("evolution.signal-log-uncheckpointed");
  const events = verified.value.records.filter((record) => record.record_kind === "reasoning-state-event")
    .map((record) => record.value);
  if (events.some((event) => event.event_kind !== EVENT_KIND
    || event.idempotency_key !== event.content?.record_id
    || event.content?.kind !== "semantic-evaluation-blocked"
    || !verifyEvolutionRecord(event.content, IMPROVEMENT_SIGNAL_SCHEMA).ok)) {
    return failed("evolution.signal-log-record-invalid");
  }
  const candidates = events.slice(-MAX_CANDIDATES).reverse().map((event) => ({
    record_digest: event.content.record_digest,
    kind: event.content.kind,
  }));
  return {schema_version: "are.gateway-evolution-signal-observation/v1", evidence_status: "verified",
    observed_at_unix_ms: Date.now(), candidate_count: events.length, candidates,
    candidates_truncated: events.length > MAX_CANDIDATES, log_digest: verified.value.log_digest,
    reason_codes: [], authority_effect: "none"};
}
