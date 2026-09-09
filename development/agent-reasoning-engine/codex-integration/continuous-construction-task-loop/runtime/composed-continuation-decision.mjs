import { createHash } from "node:crypto";

const SHA256 = /^[0-9a-f]{64}$/;
const ARE_KINDS = new Set(["complete", "direct", "gate", "block"]);
const C19_DECISIONS = new Set([
  "CONTINUE",
  "STOP",
  "READY_FOR_HUMAN_TEST",
  "REQUEST_TERMINAL_CONFIRMATION",
]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

export function canonicalBytes(value) {
  return Buffer.from(JSON.stringify(canonical(value)));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function requireString(value, name, reasons) {
  if (typeof value !== "string" || value.length === 0) reasons.push(`${name}:required`);
}

function requireDigest(value, name, reasons) {
  if (!SHA256.test(value ?? "")) reasons.push(`${name}:invalid-sha256`);
}

function c19NextStage(evaluation) {
  if (evaluation?.next_action?.kind !== "advance-authorized-stage") return null;
  return typeof evaluation.next_action.stage === "string" ? evaluation.next_action.stage : null;
}

export function composeContinuationDecision({
  turnEvidence,
  areDecision,
  c19Evaluation,
  exactFirstPendingStage,
}) {
  const reasons = [];
  requireString(turnEvidence?.thread_id, "turn_evidence.thread_id", reasons);
  requireString(turnEvidence?.turn_id, "turn_evidence.turn_id", reasons);
  requireString(turnEvidence?.construction_id, "turn_evidence.construction_id", reasons);
  requireString(turnEvidence?.attempt_id, "turn_evidence.attempt_id", reasons);
  requireDigest(turnEvidence?.request_context_sha256, "turn_evidence.request_context_sha256", reasons);
  requireDigest(turnEvidence?.evidence_manifest_sha256, "turn_evidence.evidence_manifest_sha256", reasons);
  requireDigest(areDecision?.decision_sha256, "are_decision.decision_sha256", reasons);
  if (!ARE_KINDS.has(areDecision?.kind)) reasons.push("are_decision.kind:invalid");
  if (areDecision?.thread_id !== turnEvidence?.thread_id) reasons.push("are_decision.thread_id:mismatch");
  if (areDecision?.turn_id !== turnEvidence?.turn_id) reasons.push("are_decision.turn_id:mismatch");
  if (!C19_DECISIONS.has(c19Evaluation?.decision)) reasons.push("c19_evaluation.decision:invalid");
  if (c19Evaluation?.authority_effect !== "none") reasons.push("c19_evaluation.authority_effect:not-none");
  if (c19Evaluation?.effect_authorized !== false) reasons.push("c19_evaluation.effect_authorized:not-false");
  if (c19Evaluation?.attempt_id !== turnEvidence?.attempt_id) reasons.push("c19_evaluation.attempt_id:mismatch");

  const c19Stage = c19NextStage(c19Evaluation);
  let kind = "block";
  let proposedStage = null;

  if (reasons.length === 0) {
    if (c19Evaluation.decision === "STOP") {
      kind = "block";
      reasons.push("c19:stop");
    } else if (c19Evaluation.decision === "READY_FOR_HUMAN_TEST") {
      kind = "human-test-ready";
      reasons.push("c19:ready-for-human-test");
    } else if (c19Evaluation.decision === "REQUEST_TERMINAL_CONFIRMATION") {
      kind = "terminal-gate";
      reasons.push("c19:terminal-confirmation-request");
    } else if (areDecision.kind !== "direct") {
      kind = areDecision.kind;
      reasons.push(`are:${areDecision.kind}`);
    } else if (
      typeof exactFirstPendingStage !== "string" ||
      exactFirstPendingStage.length === 0 ||
      typeof areDecision.next_stage !== "string" ||
      c19Stage === null ||
      areDecision.next_stage !== exactFirstPendingStage ||
      c19Stage !== exactFirstPendingStage
    ) {
      kind = "block";
      reasons.push("stage:exact-identity-mismatch");
    } else {
      kind = "direct";
      proposedStage = exactFirstPendingStage;
      reasons.push("dual-permission:exact-next-stage");
    }
  }

  const basis = {
    schema_version: "cav2-are-continuous-construction-composed-decision/v1",
    capability_id: "CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP",
    thread_id: turnEvidence?.thread_id ?? null,
    turn_id: turnEvidence?.turn_id ?? null,
    construction_id: turnEvidence?.construction_id ?? null,
    attempt_id: turnEvidence?.attempt_id ?? null,
    request_context_sha256: turnEvidence?.request_context_sha256 ?? null,
    evidence_manifest_sha256: turnEvidence?.evidence_manifest_sha256 ?? null,
    are_decision_sha256: areDecision?.decision_sha256 ?? null,
    c19_program_id: c19Evaluation?.program_id ?? null,
    c19_attempt_id: c19Evaluation?.attempt_id ?? null,
    c19_evaluation_id: c19Evaluation?.evaluation_id ?? null,
    kind,
    proposed_stage: proposedStage,
    reasons,
    successor_execution_authorized: false,
    effect_authorized: false,
    authority_effect: "none",
    enforcement_effect: "none",
  };
  return { ...basis, decision_sha256: sha256(canonicalBytes(basis)) };
}
