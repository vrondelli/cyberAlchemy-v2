import {routeRequest} from "../../../packages/request-decision-router/index.mjs";
import {selectRequestContext} from "../../../packages/context-basis-runtime/index.mjs";
import {evaluateTurnPreflight} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {loadRuntime, requestContext, resultEnvelope, ratio, timing, turnMessage} from "./common.mjs";
import {scoreContextScenario} from "./scorer.mjs";
import {createNativeSemanticModulePort} from "../../../packages/module-port/native-semantic-adapter.mjs";

function normalizedKind(decision) {
  if (decision.kind === "gate" || decision.kind === "ambiguous") return "gate";
  if (decision.kind === "no-match" || decision.kind === "block") return "no-match";
  return decision.kind;
}

function preflightInput(scenario, loaded, current, id) {
  return {
    message: turnMessage(`core-${id}`, `core-thread-${id}`, scenario.request, scenario.objective_kind),
    turn_binding: {lane: "interaction-bound", consumer_ref: "codex:benchmark", purpose: "benchmark-context", source_epoch: "benchmark:current", interaction_id: `core:${id}`},
    decision_profile: current.decision_profile,
    definition_catalog: current.definition_catalog,
    ontology_snapshot: current.ontology_snapshot,
    instructions: current.instructions,
    supplemental_context_items: current.supplemental_context_items,
    current_sources: current.source_snapshot,
    context: loaded.value.context,
    projection_policy: loaded.value.context_projection,
  };
}

export async function runCoreBenchmark(benchmark, options = {}) {
  const {profile, corpora} = benchmark;
  const loaded = loadRuntime(profile);
  const current = await loaded.context_source_provider();
  const modulePort = createNativeSemanticModulePort();
  if (!current.ok) throw new Error(`Context source load failed: ${current.reason_codes?.join(",")}`);
  const routingCases = corpora.routing.map((scenario) => {
    const decision = routeRequest(requestContext(scenario.request, scenario.objective_kind, scenario.scenario_id), loaded.decision_profile, modulePort);
    const actualKind = normalizedKind(decision);
    const actualRoute = decision.selected?.route_id ?? null;
    return {scenario_id: scenario.scenario_id, passed: actualKind === scenario.expected_kind && actualRoute === scenario.expected_route, expected_kind: scenario.expected_kind, actual_kind: actualKind, expected_route: scenario.expected_route, actual_route: actualRoute, reason_codes: decision.reason_codes};
  });
  const preflights = corpora.context.map((scenario, index) => evaluateTurnPreflight(preflightInput(scenario, loaded, current, index), {module_port: modulePort}));
  const contextCases = corpora.context.map((scenario, index) => scoreContextScenario(scenario, preflights[index]));
  const replay = corpora.context.map((scenario, index) => evaluateTurnPreflight(preflightInput(scenario, loaded, current, index), {module_port: modulePort}));
  const determinismMismatches = preflights.filter((result, index) => result.context_envelope?.digest !== replay[index].context_envelope?.digest).length;
  const sample = profile.sampling;
  const warm = options.warm_iterations ?? sample.warm_iterations;
  const iterations = options.timing_iterations ?? sample.timing_iterations;
  const routeTiming = timing((index) => {
    const scenario = corpora.routing[index % corpora.routing.length];
    routeRequest(requestContext(scenario.request, scenario.objective_kind, `timing:${index % corpora.routing.length}`), loaded.decision_profile, modulePort);
  }, warm, iterations);
  const selectorTiming = timing((index) => {
    const scenario = corpora.context[index % corpora.context.length];
    selectRequestContext({raw_request: scenario.request, catalog: current.definition_catalog, snapshot: current.ontology_snapshot, context_items: current.supplemental_context_items, policy: loaded.value.context.request_selection_policy});
  }, warm, iterations);
  const preflightIterations = options.preflight_iterations ?? sample.preflight_iterations;
  const preflightTiming = timing((index) => evaluateTurnPreflight(preflightInput(corpora.context[index % corpora.context.length], loaded, current, index % corpora.context.length), {module_port: modulePort}), options.preflight_warm_iterations ?? sample.preflight_warm_iterations, preflightIterations);
  const routeAccuracy = ratio(routingCases.filter((entry) => entry.passed).length, routingCases.length);
  const definitionRecall = contextCases.reduce((sum, entry) => sum + entry.recall, 0) / Math.max(1, contextCases.length);
  const precisionCases = contextCases.filter((entry) => entry.definition_precision !== null);
  const contextPrecision = precisionCases.reduce((sum, entry) => sum + entry.definition_precision, 0) / Math.max(1, precisionCases.length);
  const falseDirectAmbiguities = routingCases.filter((entry) => ["gate", "no-match"].includes(entry.expected_kind) && entry.actual_kind === "direct").length;
  const checks = {
    route_accuracy: routeAccuracy >= profile.thresholds.route_accuracy,
    definition_recall: definitionRecall >= profile.thresholds.definition_recall,
    context_precision: contextPrecision >= profile.thresholds.context_precision,
    route_latency: options.enforce_performance === false || routeTiming.p95_ms <= profile.thresholds.route_p95_ms,
    request_selection_latency: options.enforce_performance === false || selectorTiming.p95_ms <= profile.thresholds.request_selection_p95_ms,
    preflight_latency: options.enforce_performance === false || preflightTiming.p95_ms <= profile.thresholds.preflight_p95_ms,
    determinism: determinismMismatches <= profile.thresholds.determinism_mismatches,
    ambiguity_safety: falseDirectAmbiguities <= profile.thresholds.false_direct_ambiguities,
  };
  return resultEnvelope(profile, "core", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {checks, route_accuracy: routeAccuracy, definition_recall: definitionRecall, context_precision: contextPrecision, determinism_mismatches: determinismMismatches, false_direct_ambiguities: falseDirectAmbiguities}, {routing: routingCases, context: contextCases}, {route: routeTiming, request_selection: selectorTiming, preflight: preflightTiming});
}
