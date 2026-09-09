import assert from "node:assert/strict";
import test from "node:test";

import { composeContinuationDecision } from "../runtime/composed-continuation-decision.mjs";

const digest = "a".repeat(64);
const stage = "capability-local-business-ontology";
const turnEvidence = {
  thread_id: "thread-1",
  turn_id: "turn-1",
  construction_id: "construction-1",
  attempt_id: "attempt-1",
  request_context_sha256: digest,
  evidence_manifest_sha256: "b".repeat(64),
};

function are(kind = "direct", nextStage = stage) {
  return { thread_id: "thread-1", turn_id: "turn-1", kind, next_stage: nextStage, decision_sha256: "c".repeat(64) };
}

function c19(decision = "CONTINUE", nextStage = stage) {
  return {
    program_id: "CA2-GCC-PROGRAM-001",
    attempt_id: "attempt-1",
    evaluation_id: "d".repeat(64),
    decision,
    next_action: decision === "CONTINUE" ? { kind: "advance-authorized-stage", stage: nextStage } : null,
    effect_authorized: false,
    authority_effect: "none",
  };
}

test("direct requires exact dual permission", () => {
  const result = composeContinuationDecision({ turnEvidence, areDecision: are(), c19Evaluation: c19(), exactFirstPendingStage: stage });
  assert.equal(result.kind, "direct");
  assert.equal(result.proposed_stage, stage);
  assert.equal(result.successor_execution_authorized, false);
  assert.match(result.decision_sha256, /^[0-9a-f]{64}$/);
});

for (const [areKind, expected] of [["complete", "complete"], ["gate", "gate"], ["block", "block"]]) {
  test(`ARE ${areKind} is preserved when C19 permits continuation`, () => {
    const result = composeContinuationDecision({ turnEvidence, areDecision: are(areKind, null), c19Evaluation: c19(), exactFirstPendingStage: stage });
    assert.equal(result.kind, expected);
    assert.equal(result.proposed_stage, null);
  });
}

for (const [decision, expected] of [
  ["STOP", "block"],
  ["READY_FOR_HUMAN_TEST", "human-test-ready"],
  ["REQUEST_TERMINAL_CONFIRMATION", "terminal-gate"],
]) {
  test(`C19 ${decision} starts no successor`, () => {
    const result = composeContinuationDecision({ turnEvidence, areDecision: are(), c19Evaluation: c19(decision), exactFirstPendingStage: stage });
    assert.equal(result.kind, expected);
    assert.equal(result.proposed_stage, null);
    assert.equal(result.effect_authorized, false);
  });
}

for (const mutation of [
  { name: "ARE names wrong stage", areDecision: are("direct", "wrong") },
  { name: "C19 names wrong stage", c19Evaluation: c19("CONTINUE", "wrong") },
  { name: "exact stage is absent", exactFirstPendingStage: null },
  { name: "turn digest is malformed", turnEvidence: { ...turnEvidence, evidence_manifest_sha256: "bad" } },
  { name: "C19 claims effect authority", c19Evaluation: { ...c19(), effect_authorized: true } },
  { name: "ARE belongs to another turn", areDecision: { ...are(), turn_id: "turn-other" } },
  { name: "C19 belongs to another attempt", c19Evaluation: { ...c19(), attempt_id: "attempt-other" } },
]) {
  test(`${mutation.name} fails closed`, () => {
    const result = composeContinuationDecision({
      turnEvidence: mutation.turnEvidence ?? turnEvidence,
      areDecision: mutation.areDecision ?? are(),
      c19Evaluation: mutation.c19Evaluation ?? c19(),
      exactFirstPendingStage: Object.hasOwn(mutation, "exactFirstPendingStage") ? mutation.exactFirstPendingStage : stage,
    });
    assert.equal(result.kind, "block");
    assert.equal(result.proposed_stage, null);
  });
}

test("composition is byte-deterministic", () => {
  const input = { turnEvidence, areDecision: are(), c19Evaluation: c19(), exactFirstPendingStage: stage };
  assert.deepEqual(composeContinuationDecision(input), composeContinuationDecision(input));
});
