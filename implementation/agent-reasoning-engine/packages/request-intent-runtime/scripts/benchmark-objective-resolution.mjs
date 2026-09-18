import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";
import {compileRequestIntent, resolveObjectiveTransition, digestIntentMaterial} from "../index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";

const fixture = JSON.parse(readFileSync(new URL("../benchmarks/objective-resolution-v1/cases.json", import.meta.url)));
const semanticText = createSemanticTextFacade(createModulePort({adapters: [createNativeSemanticAdapter()], output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
const resolveObjective = (input, provider = null) => resolveObjectiveTransition(input, provider, semanticText);
const rows = [], inputs = [];
const normalize = value => value?.trim().replace(/[.!?]+$/, "").replace(/\s+/g, " ").toLowerCase();
for (const [episode, steps] of fixture.episodes.entries()) {
  let state = null;
  for (const [step, [request, expected, objective]] of steps.entries()) {
    const input = {request, request_ref: `benchmark:${episode}:${step}`, consumer_ref: "benchmark-user", scope_ref: `episode:${episode}`,
      ...(state ? {state, expected_state_digest: state.state_digest} : {})};
    inputs.push(input);
    const baseline = await compileRequestIntent(input);
    assert.equal(baseline.ok, true);
    const treatment = await resolveObjective(input);
    const classified = treatment.disposition === "resolved" ? treatment.transition : treatment.disposition;
    const baselineCorrect = expected === "ask" ? baseline.value.contract.disposition === "ask"
      : normalize(baseline.value.contract.objective) === normalize(objective);
    const treatmentCorrect = classified === expected && (expected === "ask"
      ? treatment.next_state?.state_digest === state?.state_digest || (state === null && treatment.next_state?.active_objective === null)
      : normalize(treatment.next_state.active_objective.description) === normalize(objective));
    rows.push({episode, step, request, expected, classified, baseline_correct: baselineCorrect, treatment_correct: treatmentCorrect,
      provider_calls: treatment.provider_calls, resolution_digest: treatment.resolution_digest});
    if (treatment.disposition === "resolved") state = treatment.next_state;
  }
}
async function timing(operation) {
  for (let i = 0; i < 200; i++) await operation(inputs[i % inputs.length]);
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    await operation(inputs[i % inputs.length]);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {iterations: samples.length, p50_ms: samples[500], p95_ms: samples[950], p99_ms: samples[990]};
}
const functional = {cases: rows.length, baseline_correct: rows.filter(r => r.baseline_correct).length,
  treatment_correct: rows.filter(r => r.treatment_correct).length,
  baseline_transition_classification: "not implemented; comparison scores objective text or abstention only",
  provider_calls: rows.reduce((sum, r) => sum + r.provider_calls, 0), rows};
const sources = ["src/objective-resolution.mjs", "src/compiler.mjs", "src/contracts.mjs", "src/canonical.mjs", "index.mjs",
  "scripts/benchmark-objective-resolution.mjs", "benchmarks/objective-resolution-v1/cases.json"];
const source_digests = Object.fromEntries(sources.map(path => [path, digestIntentMaterial(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"))]));
const evidence = {schema_version: "are.objective-resolution-benchmark/v1", scope: fixture.scope, node_version: process.version,
  functional, functional_digest: digestIntentMaterial(functional), source_digests,
  timing_scope: "Local warm library calls including sealing; excludes model, routing, wrapper, disk and state persistence",
  baseline_timing: await timing(compileRequestIntent), treatment_timing: await timing(resolveObjective), authority_effect: "none"};
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (functional.treatment_correct !== functional.cases || functional.provider_calls !== 0) process.exitCode = 1;
