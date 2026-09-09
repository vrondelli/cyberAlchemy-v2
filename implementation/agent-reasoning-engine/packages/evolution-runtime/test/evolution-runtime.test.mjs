import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import test from "node:test";

import {
  assessImprovementRetentionCurrentness,
  createEngineVariant,
  createEvolutionRuntime,
  createImprovementRetention,
  createImprovementSignal,
  createImprovementTarget,
  createReproductionTrial,
  createTechniqueCandidate,
  createUpgradeDecision,
  createVariantComparison,
  runResearchScout,
  selectImprovementTarget,
  verifyEvolutionRecord,
  verifyImprovementRetention,
} from "../index.mjs";
import {sha256HexText} from "../../intent-route-resolver/index.mjs";

const profile = JSON.parse(readFileSync(new URL("../profiles/default-v1.json", import.meta.url), "utf8"));

function signal(overrides = {}) {
  return createImprovementSignal({kind: "context-precision-failure", source_result_ref: "benchmark:run-1", scope: "context-precision", observed_value: 0.72, expected_value: 0.8, metric: "context_precision", provenance_refs: ["fixture:one"], ...overrides});
}

function target(signalRef = signal().record_id) {
  return createImprovementTarget({target_key: "context-precision", signal_refs: [signalRef], metric: "context_precision", direction: "higher", threshold: 0.8, baseline_ref: "benchmark:baseline", baseline_value: 0.72, priority: 1, protected_metrics: {route_accuracy: 0.01}, test_sets: ["development", "holdout"]});
}

test("records are deterministic, immutable, and self-verifying", () => {
  const left = signal({provenance_refs: ["fixture:two", "fixture:one"]});
  const right = signal({provenance_refs: ["fixture:one", "fixture:two"]});
  assert.deepEqual(left, right);
  assert.equal(Object.isFrozen(left), true);
  assert.equal(verifyEvolutionRecord(left).ok, true);
  assert.equal(verifyEvolutionRecord({...left, observed_value: 1}).ok, false);
});

test("runtime deduplicates identical signals through the reasoning-state ledger", () => {
  const runtime = createEvolutionRuntime({profile});
  assert.equal(runtime.appendSignal({kind: "context-precision-failure", source_result_ref: "benchmark:run-1", scope: "context-precision", observed_value: 0.72}).disposition, "appended");
  assert.equal(runtime.appendSignal({kind: "context-precision-failure", source_result_ref: "benchmark:run-1", scope: "context-precision", observed_value: 0.72}).disposition, "duplicate");
  assert.equal(runtime.snapshot().length, 1);
});

test("retained improvements bind current implementation and evidence bytes", () => {
  const root = mkdtempSync("/tmp/are-improvement-retention-");
  try {
    writeFileSync(`${root}/implementation.mjs`, "export const selected = true;\n", "utf8");
    writeFileSync(`${root}/evidence.json`, "{\"status\":\"PASS\"}\n", "utf8");
    writeFileSync(`${root}/profile.json`, "{\"context_source_refresh\":{\"hash\":\"native\"},\"unrelated\":1}\n", "utf8");
    const input = {
      candidate_id: "hash:live-source-native-sha256",
      lifecycle_state: "implemented-and-verified",
      implementation_bindings: [
        {path: "implementation.mjs", sha256: sha256HexText("export const selected = true;\n")},
        {path: "profile.json", selector: "/context_source_refresh", sha256: sha256HexText("{\"hash\":\"native\"}")},
      ],
      evidence_bindings: [{path: "evidence.json", sha256: sha256HexText("{\"status\":\"PASS\"}\n")}],
      observed_comparison: {baseline_p95_ms: 224.19, candidate_p95_ms: 15.997, potential_savings_ms: 208.193, valid_observations_per_arm: 120, verification: "read-and-hash-every-selected-source"},
      verification_refs: ["benchmark:full-pass"],
    };
    const retention = createImprovementRetention(input);
    assert.equal(verifyImprovementRetention(retention).ok, true);
    assert.equal(assessImprovementRetentionCurrentness(retention, {repository_root: root}).disposition, "current");
    const runtime = createEvolutionRuntime({profile});
    assert.equal(runtime.appendRetention(input).disposition, "appended");
    writeFileSync(`${root}/profile.json`, "{\"context_source_refresh\":{\"hash\":\"native\"},\"unrelated\":2}\n", "utf8");
    assert.equal(assessImprovementRetentionCurrentness(retention, {repository_root: root}).disposition, "current");
    writeFileSync(`${root}/implementation.mjs`, "export const selected = false;\n", "utf8");
    const stale = assessImprovementRetentionCurrentness(retention, {repository_root: root});
    assert.equal(stale.disposition, "stale");
    assert.equal(stale.suppress_reselection, false);
    assert.equal(stale.changed_bindings[0].reason, "binding-digest-drift");
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test("target selection is deterministic and priority ordered", () => {
  const signals = [signal(), signal({kind: "route-latency", scope: "route-latency", source_result_ref: "benchmark:run-2", observed_value: 2.4})];
  const result = selectImprovementTarget(signals, [
    {target_key: "route-latency", signal_kinds: ["route-latency"], metric: "route_p95_ms", direction: "lower", threshold: 2, priority: 2},
    {target_key: "context-precision", signal_kinds: ["context-precision-failure"], metric: "context_precision", direction: "higher", threshold: 0.8, priority: 1},
  ]);
  assert.equal(result.disposition, "selected");
  assert.equal(result.target.target_key, "context-precision");
});

test("research scout is a zero-call no-op until explicitly enabled", async () => {
  let calls = 0;
  const provider = {id: "fixture", search: async () => { calls += 1; return []; }};
  const result = await runResearchScout(target(), [provider], {enabled: false});
  assert.equal(result.disposition, "disabled");
  assert.equal(result.provider_calls, 0);
  assert.equal(calls, 0);
});

test("research scout exact-binds provider results in stable provider order", async () => {
  const providers = ["zeta", "alpha"].map((id) => ({id, search: async () => [{source_ref: `source:${id}`, source_version: "v1", mechanism: "rank exact definition matches", evidence: ["fixture evidence"], limitations: ["fixture only"]}]}));
  const result = await runResearchScout(target(), providers, {enabled: true});
  assert.equal(result.provider_calls, 2);
  assert.equal(result.results.length, 2);
  assert.deepEqual(result.results.map((row) => row.provider_id), ["alpha", "zeta"]);
});

test("reproduced technique forms an immutable engine variant", () => {
  const technique = createTechniqueCandidate({target_ref: target().record_id, research_result_ref: "research-result:fixture", mechanism: "exact primary definition ranking", integration_point: "context selector", expected_observations: ["precision improves"]});
  const trial = createReproductionTrial({technique_ref: technique.record_id, environment_ref: "node:26.8.1", protocol_ref: "fixture:protocol", outcome: "reproduced", actual_observations: ["precision improves"]});
  const variant = createEngineVariant({baseline_ref: "git:baseline", source_tree_digest: "a".repeat(64), build_environment_ref: "node:26.8.1", technique_refs: [technique.record_id], reproduction_refs: [trial.record_id], changed_paths: ["selector.mjs"]});
  assert.equal(verifyEvolutionRecord(variant).ok, true);
  assert.equal(variant.reproduction_refs[0], trial.record_id);
});

test("fitness keeps improvement only when quality, performance, safety, determinism, and holdout hold", () => {
  const comparison = createVariantComparison({
    variant_ref: "variant:one", baseline_ref: "baseline:one", target_ref: target().record_id, manifest_ref: "manifest:one", environment_ref: "node:26.8.1",
    baseline_metrics: {context_precision: 0.72, route_accuracy: 0.99, preflight_p95_ms: 100},
    candidate_metrics: {context_precision: 0.84, route_accuracy: 0.99, preflight_p95_ms: 110},
    fitness: {target_metric: "context_precision", direction: "higher", minimum_delta: 0.01, protected_quality: {route_accuracy: 0.01}, maximum_regression_ratio: {preflight_p95_ms: 0.2}},
    safety_passed: true, determinism_passed: true, holdout_passed: true, run_refs: ["run:one", "run:two"],
  });
  assert.equal(comparison.outcome, "KEEP");
  assert.deepEqual(comparison.reason_codes, []);
});

test("fitness rejects a safety regression even when the target improves", () => {
  const comparison = createVariantComparison({
    variant_ref: "variant:unsafe", baseline_ref: "baseline:one", target_ref: target().record_id, manifest_ref: "manifest:one", environment_ref: "node:26.8.1",
    baseline_metrics: {context_precision: 0.72}, candidate_metrics: {context_precision: 0.9},
    fitness: {target_metric: "context_precision", direction: "higher", minimum_delta: 0.01}, safety_passed: false, determinism_passed: true, holdout_passed: true,
  });
  assert.equal(comparison.outcome, "REJECT");
  assert.deepEqual(comparison.reason_codes, ["fitness.safety-failed"]);
});

test("upgrade decisions are recommend-only by default", () => {
  const decision = createUpgradeDecision({current_version_ref: "serving:v1", candidate_version_ref: "variant:v2", comparison_ref: "comparison:one", comparison_outcome: "KEEP", required_keep_streak_met: true, reproduction_passed: true, holdout_passed: true, mode: "recommend-only"});
  assert.equal(decision.disposition, "recommend-candidate");
  assert.equal(decision.authority_effect, "none");
});

test("sealed cycles replay with zero external calls", () => {
  const runtime = createEvolutionRuntime({profile});
  runtime.appendSignal({kind: "context-precision-failure", source_result_ref: "benchmark:run-1", scope: "context-precision", observed_value: 0.72});
  const sealed = runtime.sealCycle({stage: "signal-collected"});
  assert.equal(sealed.ok, true);
  const replay = runtime.replay(sealed.cycle);
  assert.equal(replay.ok, true);
  assert.equal(replay.value.external_calls, 0);
});
