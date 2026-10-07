import assert from "node:assert/strict";
import test from "node:test";

import {materializeInteractionHypothesis, materializeInteractionLearningPackage, materializeInteractionLiveValidation, materializeInteractionOfflineScreen, materializeInteractionOwnerDecision, verifyInteractionHypothesis} from "../src/interaction-learning-cycle-v1.mjs";
import {createHash} from "node:crypto";
import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
function baseline() {
  const material = {schema_version:"are.interaction-learning-baseline/v1", status:"BASELINE_MEASURED", overall:{episode_success_rate:0.5}, diagnostic_counts:{scope_transition:24}, partition_policy:{discovery:0.6,validation:0.2,holdout:0.2}};
  return {...material, baseline_digest:digest(material)};
}
function run(hypothesis) {
  const material = {hypothesis_digest:hypothesis.hypothesis_digest, scenarios:Array.from({length:20},(_, index)=>({scenario_id:`scenario-${String(index + 1).padStart(2,"0")}`, response_digest:"a".repeat(64)}))};
  return {...material, run_digest:digest(material)};
}
function verdicts(successes=18) {
  return Array.from({length:20},(_, index)=>({scenario_id:`scenario-${String(index + 1).padStart(2,"0")}`, outcome:index<successes?"success":"failure", primary_category:index<successes?"none":"scope_transition", evaluator_id:"independent:test", evidence_note:"Bounded structural and semantic review.", critical_regression:false}));
}
function screen(b, hypothesis) {
  b.partitions = {validation:{episode_refs:["episode-1"]}};
  b.baseline_digest = digest(Object.fromEntries(Object.entries(b).filter(([key])=>key!=="baseline_digest")));
  hypothesis = materializeInteractionHypothesis({cycle_id:"interaction-learning-objective-cycle-v1", baseline:b});
  return {hypothesis, value:materializeInteractionOfflineScreen({baseline:b, hypothesis, labels:[{episode_id:"episode-1",outcome:"failure",primary_category:"scope_transition",contributing_categories:[]}]})};
}

test("interaction hypothesis freezes the empirical target and remains recommend-only", () => {
  const hypothesis = materializeInteractionHypothesis({cycle_id:"interaction-learning-objective-cycle-v1", baseline:baseline()});
  assert.equal(verifyInteractionHypothesis(hypothesis), true);
  assert.equal(hypothesis.experiment.minimum_live_sample, 20);
  assert.equal(hypothesis.experiment.numeric_completion_target, 0.75);
  assert.equal(hypothesis.candidate.activation, "recommend-only");
});

test("prospective validation requires coverage, target, uncertainty, and no critical regression", () => {
  const b = baseline();
  const prepared = screen(b);
  const hypothesis = prepared.hypothesis;
  const validation = materializeInteractionLiveValidation({hypothesis, run_manifest:run(hypothesis), verdicts:verdicts(18)});
  assert.equal(validation.disposition, "candidate-supported");
  assert.ok(validation.wilson_95.lower > 0.5);
  const learning = materializeInteractionLearningPackage({baseline:b, hypothesis, offline_screen:prepared.value, validation});
  assert.equal(learning.decision, "eligible-for-owner-review");
  assert.equal(learning.activation, "none");
});

test("a merely nominal lift is preserved as a negative result", () => {
  const b = baseline();
  const hypothesis = materializeInteractionHypothesis({cycle_id:"interaction-learning-objective-cycle-v1", baseline:b});
  const validation = materializeInteractionLiveValidation({hypothesis, run_manifest:run(hypothesis), verdicts:verdicts(14)});
  assert.equal(validation.disposition, "candidate-rejected");
  assert.ok(validation.reason_codes.includes("completion-target-not-met"));
  assert.ok(validation.reason_codes.includes("uncertainty-does-not-clear-baseline"));
});

test("owner retention closes a supported objective without activating it", () => {
  const b = baseline();
  const prepared = screen(b);
  const validation = materializeInteractionLiveValidation({hypothesis:prepared.hypothesis, run_manifest:run(prepared.hypothesis), verdicts:verdicts(20)});
  const learning = materializeInteractionLearningPackage({baseline:b, hypothesis:prepared.hypothesis, offline_screen:prepared.value, validation});
  const decision = materializeInteractionOwnerDecision({learning_package:learning, decision_ref:"codex-session:DG-IL-15:A"});
  assert.equal(decision.cycle_status, "OBJECTIVE_CLOSED");
  assert.equal(decision.decision, "retain-supported-candidate");
  assert.equal(decision.retained_package_digest, learning.package_digest);
  assert.equal(decision.activation, "none");
});

test("owner retention rejects an unsupported learning package", () => {
  const b = baseline();
  const prepared = screen(b);
  const validation = materializeInteractionLiveValidation({hypothesis:prepared.hypothesis, run_manifest:run(prepared.hypothesis), verdicts:verdicts(10)});
  const learning = materializeInteractionLearningPackage({baseline:b, hypothesis:prepared.hypothesis, offline_screen:prepared.value, validation});
  assert.throws(() => materializeInteractionOwnerDecision({learning_package:learning, decision_ref:"codex-session:DG-IL-15:A"}), /package-not-retainable/);
});
