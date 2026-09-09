import {
  canonicalBytes,
  sealRecord,
  sha256Bytes,
  verifyRecordDigest,
} from "./canonical-json.mjs";
import { TEST_ACTION, TEST_TARGET } from "./effect-test-double.mjs";
import {
  EVALUATOR_ID,
  evaluateSemanticJudgment,
  SCHEMA_VERSION,
} from "./reducer.mjs";
import { assembleReasoningReceipt } from "./receipt.mjs";

function closed(status, telemetry, store, extra = {}) {
  return {
    run_status: status,
    telemetry,
    persisted_order: store.records.map((entry) => entry.name),
    ...extra,
  };
}

function validateEntry(request) {
  if (!verifyRecordDigest(request?.entry_gate)) {
    throw new TypeError("invalid entry-gate record");
  }
  if (
    request.entry_gate.gate_kind !== "orchestration-entry" ||
    !["pass", "flag", "block", "defer"].includes(
      request.entry_gate.verdict,
    )
  ) {
    throw new TypeError("invalid entry-gate semantics");
  }
}

function makeEffectEnvelope(request, reasoningReceiptDigest) {
  const template = request.effect?.envelope_template;
  if (!verifyRecordDigest(template)) {
    throw new TypeError("invalid effect-envelope template");
  }
  return sealRecord({
    record_type: "FixedEffectEnvelope",
    schema_version: SCHEMA_VERSION,
    run_id: request.run_id,
    created_at: request.created_at,
    producer: "semantic-judgment-evaluator-witness@1",
    action: template.action,
    target: template.target,
    scope: template.scope,
    authority_basis: template.authority_basis,
    risk: template.risk,
    rollback_or_compensation: template.rollback_or_compensation,
    reasoning_receipt_digest: reasoningReceiptDigest,
    idempotency_key: template.idempotency_key,
    template_digest: template.digest,
  });
}

function makeEffectGateDecision(request, envelope, reasoningReceiptDigest) {
  const template = request.effect?.gate_template;
  if (!verifyRecordDigest(template)) {
    throw new TypeError("invalid effect-gate template");
  }
  if (
    template.gate_kind !== "exact-effect" ||
    !["pass", "flag", "block", "defer"].includes(template.verdict)
  ) {
    throw new TypeError("invalid exact-effect gate semantics");
  }
  return sealRecord({
    record_type: "GateDecision",
    schema_version: SCHEMA_VERSION,
    run_id: request.run_id,
    created_at: request.created_at,
    producer: "exact-effect-gate-test-adapter@1",
    gate_decision_id: template.gate_decision_id,
    gate_kind: "exact-effect",
    verdict: template.verdict,
    owner_ref: template.owner_ref,
    authority_snapshot_digest: request.authority_snapshot.digest,
    subject_digest: envelope.digest,
    reasoning_receipt_digest: reasoningReceiptDigest,
    evidence_refs: [...template.evidence_refs],
    residue: [...template.residue],
    effect_of_decision: template.effect_of_decision,
    decided_at: template.decided_at,
    gate_template_digest: template.digest,
  });
}

export async function executeWitness(
  request,
  { store, effectDispatcher, telemetry = {} },
) {
  telemetry.provider_calls = telemetry.provider_calls ?? 0;
  telemetry.evaluator_calls = telemetry.evaluator_calls ?? 0;
  telemetry.effect_gate_calls = telemetry.effect_gate_calls ?? 0;
  telemetry.effect_attempts = telemetry.effect_attempts ?? 0;

  try {
    validateEntry(request);
    await store.persist("entry-gate-decision", request.entry_gate);
  } catch (error) {
    return closed("incomplete", telemetry, store, {
      closure_reason: error.message,
    });
  }

  if (request.entry_gate.verdict !== "pass") {
    return closed(
      request.entry_gate.verdict === "flag"
        ? "paused-owner-review"
        : "closed-no-evaluation",
      telemetry,
      store,
      {
        entry_gate: request.entry_gate,
        closure_reason: `entry-${request.entry_gate.verdict}`,
      },
    );
  }

  const semantic = evaluateSemanticJudgment(request, telemetry);
  const assembled = assembleReasoningReceipt(request, semantic);
  let persistedReceipt;
  try {
    persistedReceipt = await store.persist(
      "reasoning-receipt",
      assembled.receipt,
    );
  } catch (error) {
    return closed("incomplete", telemetry, store, {
      semantic,
      closure_reason: error.message,
    });
  }

  if (semantic.outcome !== "RecommendedUnderSnapshot") {
    return closed("closed-no-effect", telemetry, store, {
      semantic,
      reasoning_receipt: assembled.receipt,
      reasoning_receipt_bytes: assembled.bytes,
      reasoning_receipt_exact_bytes_digest:
        persistedReceipt.exact_bytes_digest,
    });
  }

  let effectEnvelope;
  let effectDecision;
  try {
    telemetry.effect_gate_calls += 1;
    effectEnvelope = makeEffectEnvelope(
      request,
      persistedReceipt.exact_bytes_digest,
    );
    effectDecision = makeEffectGateDecision(
      request,
      effectEnvelope,
      persistedReceipt.exact_bytes_digest,
    );
    await store.persist("effect-envelope", effectEnvelope);
    await store.persist("effect-gate-decision", effectDecision);
  } catch (error) {
    return closed("incomplete", telemetry, store, {
      semantic,
      reasoning_receipt: assembled.receipt,
      closure_reason: error.message,
    });
  }

  if (effectDecision.verdict !== "pass") {
    return closed("closed-no-effect", telemetry, store, {
      semantic,
      reasoning_receipt: assembled.receipt,
      reasoning_receipt_bytes: assembled.bytes,
      reasoning_receipt_exact_bytes_digest:
        persistedReceipt.exact_bytes_digest,
      effect_envelope: effectEnvelope,
      effect_gate_decision: effectDecision,
    });
  }

  const gateBytesDigest = sha256Bytes(canonicalBytes(effectDecision));
  const delivery = {
    action: effectEnvelope.action,
    target: effectEnvelope.target,
    outcome: semantic.outcome,
    reasoning_receipt_digest: persistedReceipt.exact_bytes_digest,
    effect_gate_decision_digest: gateBytesDigest,
    fixed_effect_envelope_digest: sha256Bytes(canonicalBytes(effectEnvelope)),
    idempotency_key: effectEnvelope.idempotency_key,
  };
  if (
    delivery.action !== TEST_ACTION ||
    delivery.target !== TEST_TARGET ||
    effectDecision.subject_digest !== effectEnvelope.digest ||
    effectDecision.reasoning_receipt_digest !==
      persistedReceipt.exact_bytes_digest
  ) {
    return closed("incomplete", telemetry, store, {
      semantic,
      reasoning_receipt: assembled.receipt,
      effect_gate_decision: effectDecision,
      closure_reason: "exact-effect binding mismatch",
    });
  }

  const effectAttempt = await effectDispatcher.attempt(delivery);
  if (effectAttempt.new_attempt) telemetry.effect_attempts += 1;
  return closed("closed", telemetry, store, {
    semantic,
    reasoning_receipt: assembled.receipt,
    reasoning_receipt_bytes: assembled.bytes,
    reasoning_receipt_exact_bytes_digest:
      persistedReceipt.exact_bytes_digest,
    effect_envelope: effectEnvelope,
    effect_gate_decision: effectDecision,
    effect_attempt: effectAttempt,
  });
}

export const WITNESS_ID = `${EVALUATOR_ID}:l0`;
