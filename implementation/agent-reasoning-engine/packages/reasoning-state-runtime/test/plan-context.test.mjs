import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {
  appendReasoningPlanContext,
  createReasoningStateLedger,
  materializeReasoningPlanContext,
  recoverReasoningStateLedger,
  verifyReasoningPlanContext,
} from "../index.mjs";

const planDigest = createHash("sha256").update("fixture parent plan").digest("hex");
const parentRef = "plans:whole-ui/v1";
const sourceDigests = {[parentRef]: planDigest};
const plan = (overrides = {}) => ({
  thread_ref: "backend-thread:fixture-1",
  parent_plan_ref: parentRef,
  parent_plan_digest: planDigest,
  feature_obligations: [
    {obligation_id: "overview", summary: "Show product health separately from adapter readiness", status: "open"},
    {obligation_id: "C1", summary: "Preserve the complete plan context", status: "active"},
    {obligation_id: "evolution", summary: "Show verified Evolution evidence", status: "open"},
  ],
  active_slice_id: "C1",
  unresolved_decisions: [{decision_id: "host-binding", question: "Can the host hand over one exact task?"}],
  source_refs: [{source_ref: parentRef, source_digest: planDigest}],
  previous_plan_context_digest: null,
  ...overrides,
});
const options = {expected_thread_ref: "backend-thread:fixture-1", source_digests: sourceDigests};

test("plan context is closed, bounded, source-verified, and backend-thread-bound", () => {
  const valid = materializeReasoningPlanContext(plan(), options);
  assert.equal(valid.ok, true);
  assert.equal(verifyReasoningPlanContext(valid.value).ok, true);
  assert.deepEqual(valid.value.feature_obligations.map(item => item.obligation_id), ["overview", "C1", "evolution"]);
  assert.equal(materializeReasoningPlanContext(plan(), {expected_thread_ref: options.expected_thread_ref}).reason_codes.includes("reasoning.plan-context-source-unverified"), true);
  assert.equal(materializeReasoningPlanContext(plan(), {expected_thread_ref: "backend-thread:other", source_digests: sourceDigests}).reason_codes.includes("reasoning.plan-context-thread-mismatch"), true);
  assert.equal(materializeReasoningPlanContext(plan({source_refs: []}), options).ok, false);
  assert.equal(materializeReasoningPlanContext(plan({extra: "not-allowed"}), options).ok, false);
  assert.equal(materializeReasoningPlanContext(plan({active_slice_id: "forgotten"}), options).ok, false);
  const changed = {...valid.value, active_slice_id: "evolution"};
  assert.equal(verifyReasoningPlanContext(changed).reason_codes.includes("reasoning.plan-context-digest-invalid"), true);
  const large = plan({
    feature_obligations: Array.from({length: 32}, (_, index) => ({obligation_id: index === 0 ? "C1" : `feature-${index}`, summary: "a".repeat(320), status: "open"})),
    unresolved_decisions: Array.from({length: 32}, (_, index) => ({decision_id: `decision-${index}`, question: "b".repeat(320)})),
  });
  assert.equal(materializeReasoningPlanContext(large, options).reason_codes.includes("reasoning.plan-context-oversize"), true);
});

test("plan context seals, checkpoints, recovers, and rejects a stale predecessor", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-plan-context-"));
  const path = join(directory, "reasoning.jsonl");
  const ledgerId = "reasoning:plan-context-fixture";
  try {
    const firstRecovery = recoverReasoningStateLedger({path, ledger_id: ledgerId});
    assert.equal(firstRecovery.ok, true);
    const ledger = firstRecovery.ledger;
    const first = appendReasoningPlanContext(ledger, plan(), options);
    assert.equal(first.ok, true);
    assert.equal(appendReasoningPlanContext(ledger, plan(), options).disposition, "duplicate");
    const epoch = ledger.seal({event_digests: [first.event.event_digest], consumer_ref: options.expected_thread_ref, request_ref: "request:1", frontier: {kind: "plan-context"}});
    assert.equal(epoch.ok, true);
    assert.equal(ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value, subject_digest: first.value.plan_context_digest}).ok, true);
    ledger.close();

    const recovered = recoverReasoningStateLedger({path, ledger_id: ledgerId});
    assert.equal(recovered.ok, true);
    assert.deepEqual(recovered.ledger.snapshot().filter(event => event.event_kind === "plan-context-recorded").map(event => event.content), [first.value]);
    const stale = appendReasoningPlanContext(recovered.ledger, plan({feature_obligations: plan().feature_obligations.map(item => item.obligation_id === "overview" ? {...item, status: "completed"} : item)}), options);
    assert.deepEqual(stale.reason_codes, ["reasoning.plan-context-stale-predecessor"]);
    const nextInput = plan({previous_plan_context_digest: first.value.plan_context_digest, active_slice_id: "evolution"});
    const next = appendReasoningPlanContext(recovered.ledger, nextInput, options);
    assert.equal(next.ok, true);
    const nextEpoch = recovered.ledger.seal({event_digests: [first.event.event_digest, next.event.event_digest], consumer_ref: options.expected_thread_ref, request_ref: "request:2", frontier: {kind: "plan-context"}});
    assert.equal(nextEpoch.ok, true);
    assert.equal(recovered.ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: nextEpoch.value, subject_digest: next.value.plan_context_digest}).ok, true);
    recovered.ledger.close();
    const after = recoverReasoningStateLedger({path, ledger_id: ledgerId});
    assert.equal(after.ok, true);
    assert.equal(after.ledger.snapshot().filter(event => event.event_kind === "plan-context-recorded").length, 2);
    after.ledger.close();
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
