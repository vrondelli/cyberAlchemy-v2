import {performance} from "node:perf_hooks";
import {compileRequestIntent, detectCorrection, materializeIntentReflection} from "../../../packages/request-intent-runtime/index.mjs";
import {ratio, resultEnvelope} from "./common.mjs";

function percentile(values, p) { return [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))]; }

async function evaluate(scenario) {
  let previous = null;
  if (scenario.previous_request) previous = (await compileRequestIntent({request_ref: `${scenario.scenario_id}:previous`, request: scenario.previous_request})).value.contract;
  const compiled = await compileRequestIntent({request_ref: scenario.scenario_id, request: scenario.request, predecessor_contract_digest: previous?.intent_contract_digest});
  if (!compiled.ok) return {scenario_id: scenario.scenario_id, passed: false, reason_codes: compiled.reason_codes};
  const contract = compiled.value.contract;
  let reflection = null;
  if (previous) {
    const correction = await detectCorrection({request_ref: scenario.scenario_id, request: scenario.request, previous_contract: previous});
    if (correction.value) {
      reflection = materializeIntentReflection({correction_candidate: correction.value, previous_contract: previous, corrected_contract: contract});
    }
  }
  const directive = contract.construction_directives[0] ?? null;
  const checks = [
    scenario.expected_directive_posture === undefined || directive?.posture === scenario.expected_directive_posture,
    scenario.expected_render_verbatim === undefined || directive?.render_verbatim === scenario.expected_render_verbatim,
    scenario.expected_directive_count === undefined || contract.construction_directives.length === scenario.expected_directive_count,
    scenario.expected_disposition === undefined || contract.disposition === scenario.expected_disposition,
    scenario.required_prohibitions === undefined || scenario.required_prohibitions.every((value) => contract.surface_prohibitions.includes(value)),
    scenario.expected_correction_kind === undefined || reflection?.correction_kind === scenario.expected_correction_kind,
    scenario.expected_improvement_eligible === undefined || reflection?.improvement_eligible === scenario.expected_improvement_eligible,
    scenario.expected_referents === undefined || Object.entries(scenario.expected_referents).every(([key, value]) => contract.referent_bindings[key] === value),
  ];
  return {scenario_id: scenario.scenario_id, passed: checks.every(Boolean), intent_contract_digest: contract.intent_contract_digest, directive_posture: directive?.posture ?? null, correction_kind: reflection?.correction_kind ?? null, improvement_eligible: reflection?.improvement_eligible ?? null};
}

export async function runIntentBenchmark(benchmark, options = {}) {
  const cases = [];
  for (const scenario of benchmark.corpora.intent) cases.push(await evaluate(scenario));
  const iterations = options.timing_iterations ?? benchmark.profile.sampling.intent_timing_iterations ?? 10000;
  const durations = [];
  const sample = benchmark.corpora.intent[0];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    await compileRequestIntent({request_ref: `intent-timing:${index}`, request: sample.request});
    durations.push(performance.now() - start);
  }
  const accuracy = ratio(cases.filter((entry) => entry.passed).length, cases.length);
  const p95 = percentile(durations, 0.95);
  const checks = {intent_alignment: accuracy === 1, intent_latency: options.enforce_performance === false || p95 <= benchmark.profile.thresholds.intent_compilation_p95_ms};
  return resultEnvelope(benchmark.profile, "intent", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {checks, intent_alignment: accuracy}, {intent: cases}, {intent_compilation: {iterations, p95_ms: p95}});
}
