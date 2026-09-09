import assert from "node:assert/strict";
import test from "node:test";

import {evaluatePermissionPolicy} from "../client/permission-policy.mjs";
import {createDecisionEngine, digest} from "../runtime/engine.mjs";
import {TurnEvidenceLedger} from "../runtime/turn-evidence-ledger.mjs";

const engine = createDecisionEngine();

function turnMessage(text, overrides = {}) {
  return {
    id: overrides.id ?? "REQ-1",
    method: "turn/start",
    params: {
      threadId: overrides.threadId,
      input: [{type: "text", text}],
      ...(overrides.params ?? {}),
    },
  };
}

test("preflight blocks missing thread identity and labels every context posture", () => {
  const blocked = engine.preflight(turnMessage("Validate this.", {threadId: null}));
  assert.equal(blocked.decision.kind, "block");
  assert.ok(blocked.decision.reason_codes.includes("context.thread-id-required"));
  const direct = engine.preflight(turnMessage("Validate this.", {threadId: "T"}));
  assert.equal(direct.decision.kind, "direct");
  assert.deepEqual(Object.keys(direct.context.field_postures).sort(), ["constraints", "evidence_refs", "objective_kind", "raw_request", "request_id", "requested_effects", "target_refs"]);
  assert.equal(direct.context.field_postures.raw_request, "inferred");
});

test("ambiguous preflight returns owner-bound candidate details", () => {
  const gate = engine.preflight(turnMessage("Research and validate this.", {threadId: "T"}));
  assert.equal(gate.decision.kind, "gate");
  assert.equal(gate.decision.candidate_details.length, gate.decision.candidates.length);
  assert.ok(gate.decision.candidate_details.every((candidate) => Object.hasOwn(candidate, "owner_gate_ref")));
});

test("unverified plan assertion cannot become a direct continuation", () => {
  const proposal = {option_id: "P", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["non-effectful-validate"], reversible: true, next_turn: {input: [{type: "text", text: "Next"}]}};
  const result = engine.continuation(
    {params: {turn: {id: "TURN", status: "completed"}}},
    {plan_bound: [proposal]},
    {valid: true, request_context_digest: "a".repeat(64), evidence_refs: []},
  );
  assert.notEqual(result.decision.kind, "direct");
  assert.equal(result.plan_evidence_status, "demoted-to-interaction");
});

test("exact host plan manifest permits only its bound safe proposal", () => {
  const proposal = {option_id: "P", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["non-effectful-validate"], reversible: true, next_turn: {input: [{type: "text", text: "Next"}]}};
  const requestDigest = "a".repeat(64);
  const result = engine.continuation(
    {params: {turn: {id: "TURN", status: "completed"}}},
    {plan_bound: [proposal], plan_manifest: {source_kind: "host-declared-plan", source_ref: "test:plan", turn_request_digest: requestDigest, plan_digest: digest([proposal])}},
    {valid: true, request_context_digest: requestDigest, evidence_refs: []},
  );
  assert.equal(result.decision.kind, "direct");
  assert.equal(result.selected_plan.option_id, "P");
});

test("permission policy is exact-effect bound and default deny", () => {
  const request = {method: "item/commandExecution/requestApproval", params: {threadId: "T", turnId: "U", itemId: "I"}};
  const effect = engine.effect(request);
  assert.equal(evaluatePermissionPolicy(request, effect, {approvalPolicy: "untrusted", sandboxPolicy: {type: "readOnly"}}).kind, "permit");
  assert.equal(evaluatePermissionPolicy(request, effect, {approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}}).kind, "deny");
});

test("turn evidence ledger rejects ordering contradictions", () => {
  const ledger = new TurnEvidenceLedger();
  ledger.begin({threadId: "T", turnId: "U", requestId: "R", requestContextDigest: "a".repeat(64), preflightDecisionDigest: "b".repeat(64), decisionProfileDigest: "c".repeat(64), declared: {}, event: {kind: "turn.started", sequence: 2, event_digest: "d".repeat(64), thread_id: "T", turn_id: "U"}});
  ledger.append("U", {kind: "item/started", sequence: 1, event_digest: "e".repeat(64), thread_id: "T", turn_id: "U"});
  const result = ledger.finalize({params: {threadId: "T", turn: {id: "U"}}}, {kind: "turn.completed", sequence: 3, event_digest: "f".repeat(64), thread_id: "T", turn_id: "U"});
  assert.equal(result.valid, false);
  assert.ok(result.reason_codes.includes("evidence.ordering-contradiction"));
});

test("turn evidence ledger projects a mechanism-observed plan with exact provenance", () => {
  const ledger = new TurnEvidenceLedger();
  const proposal = {option_id: "P", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["non-effectful-validate"], reversible: true, next_turn: {input: [{type: "text", text: "Next"}]}};
  ledger.begin({threadId: "T", turnId: "U", requestId: "R", requestContextDigest: "a".repeat(64), preflightDecisionDigest: "b".repeat(64), decisionProfileDigest: "c".repeat(64), declared: {}, event: {kind: "turn.started", sequence: 1, event_digest: "d".repeat(64), thread_id: "T", turn_id: "U"}});
  ledger.observe({method: "item/completed", params: {threadId: "T", turnId: "U", item: {id: "I", type: "plan", proposals: [proposal]}}}, {kind: "item/completed", sequence: 2, event_digest: "e".repeat(64), thread_id: "T", turn_id: "U", item_id: "I"});
  const evidence = ledger.finalize({params: {threadId: "T", turn: {id: "U"}}}, {kind: "turn.completed", sequence: 3, event_digest: "f".repeat(64), thread_id: "T", turn_id: "U"});
  assert.equal(evidence.valid, true);
  assert.equal(evidence.declared.plan_manifest.source_kind, "mechanism-observed-plan");
  assert.equal(engine.continuation({params: {turn: {id: "U", status: "completed"}}}, evidence.declared, evidence).decision.kind, "direct");
});
