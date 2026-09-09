import assert from "node:assert/strict";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {createReasoningStateLedger} from "../../reasoning-state-runtime/index.mjs";
import {
  assessReasoningEvolution,
  composeReasoningEvolution,
  loadReasoningPolicy,
  materializeContextReductionPlan,
} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadReasoningPolicy("cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-policy-runtime/profiles/default-v1.json", repositoryRoot);
const profile = loaded.value;

function fixture(eventCount = 2, context = "context:1") {
  const ledger = createReasoningStateLedger({ledger_id: `policy:${eventCount}:${context}`});
  const events = [];
  for (let index = 0; index < eventCount; index += 1) {
    const appended = ledger.append({event_kind: index === eventCount - 1 ? "context-projected" : "diagnostic", content: {index}});
    events.push(appended.event);
  }
  const epoch = ledger.seal({event_digests: events.map((event) => event.event_digest), consumer_ref: "consumer", request_ref: "request", selected_dependencies: [{source_identity: "source:1", source_digest: "a"}], context_envelope_digest: context}).value;
  return {ledger, events, epoch};
}

test("loads the exact non-authorizing default policy", () => {
  assert.equal(loaded.ok, true);
  assert.equal(profile.authority_effect, "none");
});

test("stable plan-bound context reuses its reasoning epoch", () => {
  const {ledger, events, epoch} = fixture();
  const result = composeReasoningEvolution({ledger, profile, current_epoch: epoch, candidate_epoch: epoch, events, lane: "plan-bound", refresh_assessment: {changed_selected_dependencies: []}});
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "reuse-current");
  assert.equal(result.epoch.epoch_digest, epoch.epoch_digest);
});

test("interaction-bound context always creates a successor posture", () => {
  const {epoch} = fixture();
  const result = assessReasoningEvolution({profile, current_epoch: epoch, candidate_epoch: epoch, lane: "interaction-bound", refresh_assessment: {changed_selected_dependencies: []}});
  assert.equal(result.value.action, "create-successor");
});

test("selected dependency drift creates a successor", () => {
  const {epoch} = fixture();
  const result = assessReasoningEvolution({profile, current_epoch: epoch, candidate_epoch: epoch, lane: "plan-bound", refresh_assessment: {changed_selected_dependencies: [{source_identity: "source:1"}]}});
  assert.equal(result.value.action, "create-successor");
  assert.equal(result.value.selected_dependency_drift, true);
});

test("explicit exploration creates an append-only branch", () => {
  const base = fixture();
  const added = base.ledger.append({event_kind: "request-interpreted", content: {request: 2}}).event;
  const candidate = base.ledger.seal({event_digests: [...base.epoch.event_digests, added.event_digest], consumer_ref: "consumer", request_ref: "request:2", selected_dependencies: base.epoch.selected_dependencies, context_envelope_digest: base.epoch.context_envelope_digest}).value;
  const result = composeReasoningEvolution({ledger: base.ledger, profile, current_epoch: base.epoch, candidate_epoch: candidate, events: base.ledger.snapshot(), lane: "plan-bound", exploration: true});
  assert.equal(result.disposition, "create-branch");
  assert.equal(result.epoch.event_digests.includes(added.event_digest), true);
});

test("overflow reduction retains mandatory context without destructive summary", () => {
  const compactProfile = Object.freeze({...profile, maximum_event_count: 3});
  const state = fixture(6);
  const plan = materializeContextReductionPlan({profile: compactProfile, source_epoch: state.epoch, events: state.events});
  assert.equal(plan.ok, true);
  assert.equal(plan.value.retained_event_digests.length, 3);
  assert.equal(plan.value.mandatory_event_digests.length, 1);
  assert.equal(plan.value.destructive, false);
  assert.equal(plan.value.generative_summary, false);
});

test("mandatory overflow blocks instead of truncating", () => {
  const compactProfile = Object.freeze({...profile, maximum_event_count: 2});
  const ledger = createReasoningStateLedger({ledger_id: "mandatory-overflow"});
  const events = [0, 1, 2].map((index) => ledger.append({event_kind: "context-projected", content: {index}}).event);
  const epoch = ledger.seal({event_digests: events.map((event) => event.event_digest)}).value;
  const plan = materializeContextReductionPlan({profile: compactProfile, source_epoch: epoch, events});
  assert.equal(plan.ok, false);
  assert.ok(plan.reason_codes.includes("reasoning-policy.mandatory-event-budget-exceeded"));
});
