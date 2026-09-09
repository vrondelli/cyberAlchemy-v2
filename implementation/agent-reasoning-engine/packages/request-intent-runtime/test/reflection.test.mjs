import test from "node:test";
import assert from "node:assert/strict";
import {appendIntentLifecycleEvents, applyIntentControl, applyReflectionDisposition, compileRequestIntent, createCorrectedIntentContract, detectCorrection, materializeIntentReflection, materializeUserControlProfile, projectIntentInspection, toImprovementSignalCandidate} from "../index.mjs";
import {createMemoryReasoningStateSink, createReasoningStateLedger, replayReasoningStateEpoch, sealReasoningStateEpoch} from "../../reasoning-state-runtime/index.mjs";

async function original() {
  return (await compileRequestIntent({request_ref: "kep:original", request: "Create visible sections labelled Definition, Example, and Deeper Look."})).value.contract;
}

test("explicit correction creates an immutable scoped reflection", async () => {
  const previous = await original();
  const detected = await detectCorrection({request_ref: "kep:correction", request: "You are being too literal. I do not want Definition and Example written as labels.", previous_contract: previous});
  assert.equal(detected.disposition, "detected");
  assert.equal(detected.value.correction_kind, "misinterpretation");
  const corrected = createCorrectedIntentContract(previous, {construction_directives: [{instruction: "definition, example, deeper look", posture: "structural", render_verbatim: false}], surface_requirements: ["continuous natural narrative"], surface_prohibitions: ["Definition", "Example", "Deeper look"], risk_projections: ["meta-instruction-leakage"]});
  const reflection = materializeIntentReflection({correction_candidate: detected.value, previous_contract: previous, corrected_contract: corrected, causal_analysis: ["construction instructions were treated as visible content"], proposed_scope: "current-product"});
  assert.equal(reflection.improvement_eligible, true);
  assert.equal(reflection.corrected_intent_contract_digest, corrected.intent_contract_digest);
  assert.equal(Object.isFrozen(reflection), true);
});

test("changed mind and environment drift do not become automatic improvement opportunities", async () => {
  const previous = await original();
  for (const [request, kind] of [["Actually I changed my mind; use cards instead.", "changed-mind"], ["The server restarted and the page is stale.", "environment-drift"]]) {
    const detected = await detectCorrection({request_ref: `correction:${kind}`, request, previous_contract: previous});
    const corrected = createCorrectedIntentContract(previous, {objective: request});
    const reflection = materializeIntentReflection({correction_candidate: detected.value, previous_contract: previous, corrected_contract: corrected});
    assert.equal(reflection.improvement_eligible, false);
  }
});

test("benchmark projection requires explicit engine scope and user selection", async () => {
  const previous = await original();
  const detected = await detectCorrection({request_ref: "correction:1", request: "You misunderstood and were too literal.", previous_contract: previous});
  const corrected = createCorrectedIntentContract(previous, {objective: "Use an invisible rhetorical sequence"});
  const reflection = materializeIntentReflection({correction_candidate: detected.value, previous_contract: previous, corrected_contract: corrected});
  assert.equal(applyReflectionDisposition(reflection, {retention_scope: "current-product", benchmark_generation: true}).ok, false);
  const selected = applyReflectionDisposition(reflection, {retention_scope: "engine-candidate", benchmark_generation: true, user_selected: true});
  assert.equal(toImprovementSignalCandidate(reflection, selected.value).value.metric, "intent_alignment");
  const declined = applyReflectionDisposition(reflection, {retention_scope: "none", user_selected: true});
  assert.equal(toImprovementSignalCandidate(reflection, declined.value).disposition, "not-selected");
});

test("intent lifecycle appends and replays exact generic reasoning events", async () => {
  const previous = await original();
  const ledger = createReasoningStateLedger({ledger_id: "intent:test", sink: createMemoryReasoningStateSink()});
  const appended = appendIntentLifecycleEvents(ledger, [{event_kind: "intent-contract-created", content: previous}]);
  assert.equal(appended.ok, true);
  const epoch = sealReasoningStateEpoch(ledger, {event_digests: appended.value.map((event) => event.event_digest), consumer_ref: "test", request_ref: previous.request_ref, selected_dependencies: [], frontier: {kind: "intent"}});
  assert.equal(epoch.ok, true);
  const replay = replayReasoningStateEpoch(ledger, epoch.value);
  assert.equal(replay.ok, true);
  assert.equal(replay.value.events[0].content.intent_contract_digest, previous.intent_contract_digest);
});

test("inspection depth is optional and control creates successors", async () => {
  const contract = await original();
  const profile = materializeUserControlProfile({visibility: "quiet"});
  const quiet = projectIntentInspection({contract, control_profile: profile});
  const inspect = projectIntentInspection({contract, control_profile: profile, mode: "inspect"});
  assert.equal("referent_bindings" in quiet.value, false);
  assert.equal("referent_bindings" in inspect.value, true);
  const controlled = applyIntentControl(contract, {kind: "rebind-reference", reference: "the text", value: "homepage narrative", user_selected: true});
  assert.equal(controlled.ok, true);
  assert.equal(controlled.value.successor.predecessor_contract_digest, contract.intent_contract_digest);
  assert.equal(controlled.value.successor.referent_bindings["the text"], "homepage narrative");
});
