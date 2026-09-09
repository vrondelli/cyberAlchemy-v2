import {createCodexAppServerWrapper, evaluateDualLaneContinuation, normalizeContinuationProposals} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {loadRuntime, ratio, resultEnvelope, timing} from "./common.mjs";

function createWrapper(loaded, scenario) {
  return createCodexAppServerWrapper({
    loaded_profile: loaded.value,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    instructions: loaded.instructions,
    supplemental_context_items: loaded.supplemental_context_items,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
    continuation_provider: () => ({
      ...structuredClone(scenario.provider),
      objective_frontier: structuredClone(scenario.objective_frontier),
    }),
  });
}

function completionMessage(scenario) {
  return {
    jsonrpc: "2.0",
    method: "turn/completed",
    params: {
      threadId: `benchmark:${scenario.scenario_id}`,
      turn: {id: `turn:${scenario.scenario_id}`, items: [], status: scenario.completion.status},
    },
  };
}

function currentCompletionInput(scenario) {
  const plan = scenario.provider.plan_bound ?? [];
  const interaction = scenario.provider.interaction_bound ?? [];
  return {
    completion: {
      completion_id: `benchmark:${scenario.scenario_id}`,
      status: scenario.completion.status,
      continuation_required: plan.length > 0 || interaction.length > 0 || scenario.provider.continuation_required === true,
      evidence_refs: scenario.objective_frontier.evidence_refs,
    },
    plan_bound: plan,
    interaction_bound: interaction,
  };
}

function extractDirective(action) {
  return action.to_client?.find((message) => message?.method === "cyberalchemy/decision")?.params ?? null;
}

function scoreCase(scenario, directive, elapsedMs) {
  const expected = scenario.expected;
  const actualKind = directive?.directive_kind ?? "missing";
  const actualSelected = directive?.selected_proposal_id ?? null;
  const reasonCodes = directive?.reason_codes ?? [];
  const actualContinuationNeeded = actualKind !== "complete";
  const kindMatch = actualKind === expected.directive_kind;
  const selectedMatch = actualSelected === expected.selected_proposal_id;
  const reasonMatch = reasonCodes.includes(expected.reason_code);
  return {
    scenario_id: scenario.scenario_id,
    error_class: scenario.error_class,
    frontier_state: scenario.objective_frontier.state,
    expected_continuation_needed: expected.continuation_needed,
    actual_continuation_needed: actualContinuationNeeded,
    expected_kind: expected.directive_kind,
    actual_kind: actualKind,
    expected_selected_proposal_id: expected.selected_proposal_id,
    actual_selected_proposal_id: actualSelected,
    expected_reason_code: expected.reason_code,
    actual_reason_codes: reasonCodes,
    kind_match: kindMatch,
    selected_match: selectedMatch,
    reason_match: reasonMatch,
    premature_stop: expected.continuation_needed && actualKind === "complete",
    over_continuation: !expected.continuation_needed && actualKind !== "complete",
    unsafe_direct_continuation: actualKind === "direct" && expected.directive_kind !== "direct",
    elapsed_ms: elapsedMs,
    passed: kindMatch && selectedMatch && reasonMatch,
  };
}

function observedPercentile(rows, field, fraction) {
  const values = rows.map((row) => row[field]).sort((left, right) => left - right);
  return values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0;
}

export async function runContinuationRoutingBenchmark(benchmark) {
  const {profile, corpora} = benchmark;
  const loaded = loadRuntime(profile);
  const cases = [];
  for (const scenario of corpora.continuation) {
    const wrapper = createWrapper(loaded, scenario);
    const start = performance.now();
    const action = await wrapper.processServerMessage(completionMessage(scenario));
    cases.push(scoreCase(scenario, extractDirective(action), performance.now() - start));
  }

  const decisionInputs = corpora.continuation.map((scenario) => {
    const input = currentCompletionInput(scenario);
    return {...input, normalized_proposals: normalizeContinuationProposals({plan_bound: input.plan_bound, interaction_bound: input.interaction_bound})};
  });
  const repetitions = profile.sampling.continuation_timing_iterations;
  const warm = profile.sampling.continuation_warm_iterations;
  const decisionTiming = timing((index) => {
    evaluateDualLaneContinuation(decisionInputs[index % decisionInputs.length], loaded.decision_profile);
  }, warm, repetitions);

  const required = cases.filter((entry) => entry.expected_continuation_needed);
  const expectedComplete = cases.filter((entry) => !entry.expected_continuation_needed);
  const expectedGate = cases.filter((entry) => entry.expected_kind === "gate");
  const expectedBlock = cases.filter((entry) => entry.expected_kind === "block");
  const actualComplete = cases.filter((entry) => entry.actual_kind === "complete");
  const summary = {
    scenario_count: cases.length,
    passed_scenarios: cases.filter((entry) => entry.passed).length,
    disposition_accuracy: ratio(cases.filter((entry) => entry.passed).length, cases.length),
    continuation_need_recall: ratio(required.filter((entry) => entry.actual_continuation_needed).length, required.length),
    completion_precision: ratio(actualComplete.filter((entry) => !entry.expected_continuation_needed).length, actualComplete.length),
    completion_recall: ratio(expectedComplete.filter((entry) => entry.actual_kind === "complete").length, expectedComplete.length),
    gate_recall: ratio(expectedGate.filter((entry) => entry.actual_kind === "gate").length, expectedGate.length),
    block_recall: ratio(expectedBlock.filter((entry) => entry.actual_kind === "block").length, expectedBlock.length),
    premature_stop_count: cases.filter((entry) => entry.premature_stop).length,
    over_continuation_count: cases.filter((entry) => entry.over_continuation).length,
    unsafe_direct_continuation_count: cases.filter((entry) => entry.unsafe_direct_continuation).length,
  };
  const thresholds = profile.route_continuation;
  const checks = {
    disposition_accuracy: summary.disposition_accuracy >= thresholds.disposition_accuracy,
    continuation_need_recall: summary.continuation_need_recall >= thresholds.continuation_need_recall,
    completion_precision: summary.completion_precision >= thresholds.completion_precision,
    completion_recall: summary.completion_recall >= thresholds.completion_recall,
    gate_recall: summary.gate_recall >= thresholds.gate_recall,
    block_recall: summary.block_recall >= thresholds.block_recall,
    premature_stops: summary.premature_stop_count <= thresholds.max_premature_stops,
    over_continuations: summary.over_continuation_count <= thresholds.max_over_continuations,
    unsafe_direct_continuations: summary.unsafe_direct_continuation_count <= thresholds.max_unsafe_direct_continuations,
    decision_latency: decisionTiming.p95_ms <= thresholds.decision_p95_ms,
  };
  return resultEnvelope(
    profile,
    "continuation-routing",
    Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
    {...summary, checks},
    {continuation: cases},
    {
      decision: decisionTiming,
      observed_wrapper: {
        samples: cases.length,
        p50_ms: observedPercentile(cases, "elapsed_ms", 0.5),
        p95_ms: observedPercentile(cases, "elapsed_ms", 0.95),
        max_ms: Math.max(...cases.map((entry) => entry.elapsed_ms)),
      },
    },
  );
}
