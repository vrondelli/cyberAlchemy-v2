import {existsSync, statSync} from "node:fs";
import {isAbsolute} from "node:path";

import {acquireReasoningStateWriterLock, recoverReasoningStateLedger} from "../../reasoning-state-runtime/index.mjs";
import {createImprovementSignal, IMPROVEMENT_SIGNAL_SCHEMA, verifyEvolutionRecord} from "../index.mjs";

const LEDGER_ID = "are-evolution-gateway-signal-inbox/v1";
const EVENT_KIND = "evolution.improvement-signal-candidate";
const DEFAULT_MAXIMUM_LOG_BYTES = 16 * 1024 * 1024;
const MAXIMUM_SIGNAL_BYTES = 2048;
const CHECKPOINT_WRITE_RESERVE_BYTES = 16 * 1024;
const HASH = /^[a-f0-9]{64}$/;

function fail(reason_code) {
  return Object.freeze({ok: false, reason_codes: [reason_code], authority_effect: "none"});
}

export function gatewayCompletionSignalCandidates(input) {
  if (input?.completion_message?.params?.turn?.status !== "completed"
    || input?.semantic_completion?.ok !== false
    || input.semantic_completion.disposition !== "block"
    || !HASH.test(input.semantic_completion.summary_digest ?? "")) return [];
  return [{
    kind: "semantic-evaluation-blocked",
    scope: "are.codex-wrapper.semantic-completion",
    observed_value: 1,
    expected_value: 0,
    metric: "blocked_completion_count",
    provenance_refs: [`semantic-summary:${input.semantic_completion.summary_digest}`],
  }];
}

export function createGatewayEvolutionSignalIntake({log_path, maximum_log_bytes = DEFAULT_MAXIMUM_LOG_BYTES} = {}) {
  if (typeof log_path !== "string" || !isAbsolute(log_path) || log_path.length === 0) {
    throw new TypeError("Evolution signal inbox requires an absolute log path.");
  }
  if (!Number.isSafeInteger(maximum_log_bytes) || maximum_log_bytes < CHECKPOINT_WRITE_RESERVE_BYTES) {
    throw new TypeError("Evolution signal inbox requires a positive bounded byte limit.");
  }
  const lockResult = acquireReasoningStateWriterLock({path: log_path, owner_id: `${LEDGER_ID}:${process.pid}`});
  if (!lockResult.ok) throw new TypeError(`Evolution signal inbox writer lock failed: ${lockResult.reason_codes.join(",")}`);
  const writerLock = lockResult.lock;
  const recovered = recoverReasoningStateLedger({path: log_path, ledger_id: LEDGER_ID});
  if (!recovered.ok) {
    writerLock.release();
    throw new TypeError(`Evolution signal inbox recovery failed: ${recovered.reason_codes.join(",")}`);
  }
  const ledger = recovered.ledger;
  const records = new Map();
  let closed = false;
  let unhealthy = false;
  try {
    for (const event of ledger.snapshot()) {
      const checked = verifyEvolutionRecord(event.content, IMPROVEMENT_SIGNAL_SCHEMA);
      if (event.event_kind !== EVENT_KIND || !checked.ok || event.idempotency_key !== checked.value.record_id
        || Buffer.byteLength(JSON.stringify(event.content)) > MAXIMUM_SIGNAL_BYTES) {
        throw new TypeError("Evolution signal inbox contains an invalid candidate record.");
      }
      records.set(checked.value.record_id, checked.value);
    }
  } catch (error) {
    ledger.close();
    writerLock.release();
    throw error;
  }

  function logBytes() {
    return existsSync(log_path) ? statSync(log_path).size : 0;
  }

  function appendSignal(signal) {
    if (closed || unhealthy) return fail("evolution.signal-inbox-unavailable");
    const checked = verifyEvolutionRecord(signal, IMPROVEMENT_SIGNAL_SCHEMA);
    if (!checked.ok) return fail("evolution.signal-record-invalid");
    if (Buffer.byteLength(JSON.stringify(signal)) > MAXIMUM_SIGNAL_BYTES) return fail("evolution.signal-record-too-large");
    if (records.has(signal.record_id)) return Object.freeze({ok: true, disposition: "duplicate", record_id: signal.record_id, authority_effect: "none"});
    if (logBytes() + CHECKPOINT_WRITE_RESERVE_BYTES > maximum_log_bytes) return fail("evolution.signal-inbox-limit-reached");
    const appended = ledger.append({event_kind: EVENT_KIND, idempotency_key: signal.record_id,
      content: signal, provenance_refs: signal.provenance_refs});
    if (!appended.ok) { unhealthy = true; return fail("evolution.signal-inbox-append-failed"); }
    const epoch = ledger.seal({event_digests: [appended.event.event_digest], consumer_ref: "are-gateway-evolution-signals",
      request_ref: signal.record_id, frontier: {kind: "candidate-signal-only"}});
    if (!epoch.ok) { unhealthy = true; return fail("evolution.signal-inbox-seal-failed"); }
    const checkpoint = ledger.checkpoint({checkpoint_kind: "manual", epoch: epoch.value, subject_digest: signal.record_digest});
    if (!checkpoint.ok) { unhealthy = true; return fail("evolution.signal-inbox-checkpoint-failed"); }
    records.set(signal.record_id, signal);
    return Object.freeze({ok: true, disposition: "checkpointed-candidate", record_id: signal.record_id,
      checkpoint_digest: checkpoint.value.checkpoint_digest, authority_effect: "none"});
  }

  return Object.freeze({
    signal_provider: gatewayCompletionSignalCandidates,
    signal_factory: createImprovementSignal,
    signal_sink: appendSignal,
    inspect: () => Object.freeze({schema_version: "are.gateway-evolution-signal-inbox/v1", status: closed ? "closed" : unhealthy ? "unhealthy" : "ready",
      record_count: records.size, log_bytes: logBytes(), maximum_log_bytes, authority_effect: "none"}),
    close: () => {
      if (closed) return Object.freeze({ok: true, disposition: "already-closed", authority_effect: "none"});
      const ledgerResult = ledger.close();
      const lockRelease = writerLock.release();
      closed = true;
      return Object.freeze({ok: ledgerResult?.ok !== false && lockRelease?.ok !== false, disposition: "closed", authority_effect: "none"});
    },
  });
}
