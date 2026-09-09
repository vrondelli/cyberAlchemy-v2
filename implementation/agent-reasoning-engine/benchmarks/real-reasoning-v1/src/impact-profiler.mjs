import {routeRequest} from "../../../packages/request-decision-router/index.mjs";
import {assembleContextEnvelope, selectRequestContext} from "../../../packages/context-basis-runtime/index.mjs";
import {createMemoryReasoningStateSink, createReasoningStateLedger, sealReasoningStateEpoch} from "../../../packages/reasoning-state-runtime/index.mjs";
import {createCodexAppServerWrapper, evaluateTurnPreflight, loadRepositoryProfile} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {assessImprovementRetentionCurrentness, verifyImprovementRetention} from "../../../packages/evolution-runtime/index.mjs";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {loadRuntime, packageRoot, percentile, repositoryRoot, requestContext, sha256, turnMessage} from "./common.mjs";
import {createAlchSemanticModulePort} from "../../../packages/module-port/alch-semantic-adapter.mjs";

export const IMPACT_PROFILE_SCHEMA = "are.local-turn-impact-profile/v1";

const REQUIRED_PREFLIGHT_PHASES = [
  "request-context-build",
  "request-admission",
  "request-routing",
  "request-context-selection",
  "definition-closure",
  "ontology-selector-lock",
  "context-basis-construction",
  "context-window-view-binding",
  "context-refresh-assessment",
  "context-envelope-assembly",
  "context-lifecycle-seal",
  "preflight-directive-projection",
  "context-fragment-projection",
  "message-context-projection",
];

function validateIterations(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer.`);
  return value;
}

function observationValue(value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value && typeof value === "object") return 1;
  return value === undefined || value === null ? 0 : 1;
}

function summarize(values, iterations, checksum) {
  return Object.freeze({
    iterations,
    mean_ms: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length),
    p50_ms: percentile(values, 0.5),
    p95_ms: percentile(values, 0.95),
    max_ms: Math.max(0, ...values),
    observation_checksum: checksum,
  });
}

function loadImprovementRetention(config) {
  const configured = Array.isArray(config.retention_records) ? config.retention_records : [];
  const current = [];
  const diagnostics = [];
  for (const recordRef of [...configured].sort()) {
    let retention;
    try {
      retention = JSON.parse(readFileSync(resolve(packageRoot, recordRef), "utf8"));
    } catch {
      diagnostics.push({record_ref: recordRef, disposition: "invalid", reason_codes: ["impact.retention-record-unreadable"]});
      continue;
    }
    const verified = verifyImprovementRetention(retention);
    if (!verified.ok) {
      diagnostics.push({record_ref: recordRef, disposition: "invalid", reason_codes: verified.reason_codes});
      continue;
    }
    const assessed = assessImprovementRetentionCurrentness(retention, {repository_root: repositoryRoot});
    if (!assessed.ok || assessed.disposition !== "current") {
      diagnostics.push({record_ref: recordRef, disposition: assessed.disposition ?? "invalid", retention_ref: retention.record_id, candidate_id: retention.candidate_id, reason_codes: assessed.reason_codes ?? [], changed_bindings: assessed.changed_bindings ?? []});
      continue;
    }
    current.push({candidate_id: retention.candidate_id, retention_ref: retention.record_id, lifecycle_state: retention.lifecycle_state, observed_comparison: retention.observed_comparison});
  }
  return Object.freeze({configured_record_count: configured.length, current, diagnostics, authority_effect: "none"});
}

function measureSync(operation, warmIterations, iterations) {
  let checksum = 0;
  for (let index = 0; index < warmIterations; index += 1) checksum += observationValue(operation(index, "warm"));
  const values = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    const result = operation(index, "measure");
    values.push(performance.now() - start);
    checksum += observationValue(result);
  }
  return summarize(values, iterations, checksum);
}

async function measureAsync(operation, warmIterations, iterations) {
  let checksum = 0;
  for (let index = 0; index < warmIterations; index += 1) checksum += observationValue(await operation(index, "warm"));
  const values = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    const result = await operation(index, "measure");
    values.push(performance.now() - start);
    checksum += observationValue(result);
  }
  return summarize(values, iterations, checksum);
}

async function measureCounterbalancedPair(operationA, operationB, warmIterations, iterations) {
  const valuesA = [];
  const valuesB = [];
  let checksumA = 0;
  let checksumB = 0;
  const total = warmIterations + iterations;
  for (let index = 0; index < total; index += 1) {
    const stage = index < warmIterations ? "warm" : "measure";
    const order = index % 2 === 0 ? [["a", operationA], ["b", operationB]] : [["b", operationB], ["a", operationA]];
    for (const [arm, operation] of order) {
      const start = performance.now();
      const result = await operation(index, stage);
      const elapsed = performance.now() - start;
      const observed = observationValue(result);
      if (observed !== 1) throw new Error(`Counterbalanced impact arm ${arm} did not produce a valid observation at ${stage}:${index}.`);
      if (arm === "a") {
        checksumA += observed;
        if (stage === "measure") valuesA.push(elapsed);
      } else {
        checksumB += observed;
        if (stage === "measure") valuesB.push(elapsed);
      }
    }
  }
  return Object.freeze({
    a: summarize(valuesA, iterations, checksumA),
    b: summarize(valuesB, iterations, checksumB),
    counterbalanced: true,
  });
}

function impactCandidate(candidate, boundaryP95, thresholds) {
  const savings = Math.max(0, candidate.potential_savings_ms);
  const ratio = boundaryP95 > 0 ? savings / boundaryP95 : 0;
  const absolutePassed = savings >= thresholds.minimum_absolute_savings_ms;
  const ratioPassed = ratio >= thresholds.minimum_end_to_end_savings_ratio;
  return Object.freeze({
    ...candidate,
    potential_savings_ms: savings,
    potential_end_to_end_savings_ratio: ratio,
    gates: {absolute_savings: absolutePassed, end_to_end_ratio: ratioPassed},
    eligible: absolutePassed && ratioPassed,
  });
}

export function assessImpactCandidates({boundary_p95_ms, phase_metrics = {}, observed_comparisons = [], retained_candidates = [], thresholds = {}} = {}) {
  if (!Number.isFinite(boundary_p95_ms) || boundary_p95_ms < 0) throw new TypeError("A non-negative boundary_p95_ms is required.");
  const normalized = {
    minimum_absolute_savings_ms: Number.isFinite(thresholds.minimum_absolute_savings_ms) ? thresholds.minimum_absolute_savings_ms : 1,
    minimum_end_to_end_savings_ratio: Number.isFinite(thresholds.minimum_end_to_end_savings_ratio) ? thresholds.minimum_end_to_end_savings_ratio : 0.01,
    component_optimizable_fraction: Number.isFinite(thresholds.component_optimizable_fraction) ? thresholds.component_optimizable_fraction : 0.5,
  };
  const candidates = [];
  for (const [phaseId, metric] of Object.entries(phase_metrics)) {
    if (metric?.candidate_target !== true || !Number.isFinite(metric.p95_ms)) continue;
    candidates.push(impactCandidate({
      candidate_id: `optimize:${phaseId}`,
      target_phase: phaseId,
      evidence_kind: "component-upper-bound",
      potential_savings_ms: metric.p95_ms * normalized.component_optimizable_fraction,
      evidence_basis: {phase_p95_ms: metric.p95_ms, assumed_optimizable_fraction: normalized.component_optimizable_fraction},
    }, boundary_p95_ms, normalized));
  }
  for (const comparison of observed_comparisons) {
    if (!Number.isFinite(comparison?.baseline_p95_ms) || !Number.isFinite(comparison?.candidate_p95_ms)) continue;
    candidates.push(impactCandidate({
      candidate_id: comparison.candidate_id,
      target_phase: comparison.target_phase,
      evidence_kind: "observed-comparison",
      potential_savings_ms: comparison.baseline_p95_ms - comparison.candidate_p95_ms,
      evidence_basis: {baseline_p95_ms: comparison.baseline_p95_ms, candidate_p95_ms: comparison.candidate_p95_ms},
    }, boundary_p95_ms, normalized));
  }
  const retained = new Map((Array.isArray(retained_candidates) ? retained_candidates : []).filter((entry) => typeof entry?.candidate_id === "string").map((entry) => [entry.candidate_id, entry]));
  const classified = candidates.map((candidate) => {
    const retention = retained.get(candidate.candidate_id);
    return retention
      ? Object.freeze({...candidate, lifecycle_state: "implemented-and-verified", retention_ref: retention.retention_ref ?? null, eligible: false, reason_codes: ["impact.candidate-already-retained"]})
      : Object.freeze({...candidate, lifecycle_state: "unresolved", retention_ref: null, reason_codes: []});
  });
  classified.sort((left, right) => Number(right.eligible) - Number(left.eligible) || right.potential_savings_ms - left.potential_savings_ms || left.candidate_id.localeCompare(right.candidate_id));
  const selected = classified.find((candidate) => candidate.eligible) ?? null;
  return Object.freeze({
    status: selected ? "TARGET_SELECTED" : "NO_ELIGIBLE_TARGET",
    boundary_p95_ms,
    thresholds: normalized,
    selected_candidate: selected,
    candidates: classified,
    retained_candidates: classified.filter((candidate) => candidate.lifecycle_state === "implemented-and-verified"),
    reason_codes: selected ? [] : ["impact.no-candidate-clears-minimum-product-impact"],
    authority_effect: "none",
  });
}

export function verifyImpactProfile(result, expectedProfileDigest = null) {
  const reasons = [];
  if (result?.schema_version !== IMPACT_PROFILE_SCHEMA) reasons.push("impact.profile-schema-invalid");
  if (result?.authority_effect !== "none") reasons.push("impact.profile-authority-invalid");
  if (expectedProfileDigest !== null && result?.profile_digest !== expectedProfileDigest) reasons.push("impact.profile-binding-drift");
  if (result && typeof result === "object") {
    const {report_digest: suppliedDigest, ...material} = result;
    if (suppliedDigest !== sha256(material)) reasons.push("impact.profile-digest-invalid");
  } else {
    reasons.push("impact.profile-digest-invalid");
  }
  return Object.freeze({ok: reasons.length === 0, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

function preflightInput(scenario, loaded, current, id) {
  return {
    message: turnMessage(`impact-preflight-${id}`, `impact-preflight-thread-${id}`, scenario.request, scenario.objective_kind),
    turn_binding: {lane: "interaction-bound", consumer_ref: "codex:impact-profile", purpose: "impact-profile", source_epoch: "impact-profile:current", interaction_id: `impact:${id}`},
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

function wrapperFor(loaded, binding, {interaction_projection_reuse = undefined} = {}) {
  const selectedProfile = structuredClone(loaded.value);
  selectedProfile.turn_bindings.default = binding;
  if (interaction_projection_reuse !== undefined) {
    selectedProfile.context_projection = {...selectedProfile.context_projection, reuse_compatible_interaction_projection: interaction_projection_reuse};
  }
  return createCodexAppServerWrapper({
    loaded_profile: selectedProfile,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    instructions: loaded.instructions,
    supplemental_context_items: loaded.supplemental_context_items,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
  });
}

export async function runImpactProfile(benchmark, options = {}) {
  if (!benchmark?.profile || !benchmark?.corpora) throw new TypeError("A loaded benchmark is required.");
  const config = {...benchmark.profile.impact_profiling, ...(options.config ?? {})};
  const improvementRetention = loadImprovementRetention(config);
  const warmIterations = validateIterations(options.warm_iterations ?? config.warm_iterations ?? 20, "warm_iterations");
  const iterations = validateIterations(options.iterations ?? config.iterations ?? 100, "iterations");
  const loaded = loadRuntime(benchmark.profile);
  const modulePort = createAlchSemanticModulePort();
  const current = await loaded.context_source_provider();
  if (!current.ok) throw new Error(`Context source load failed: ${(current.reason_codes ?? []).join(",")}`);
  const routingScenarios = benchmark.corpora.routing;
  const contextScenarios = benchmark.corpora.context;
  if (routingScenarios.length === 0 || contextScenarios.length === 0) throw new Error("Routing and context scenarios are required for impact profiling.");
  const representative = contextScenarios[0];

  const route = measureSync((index) => {
    const scenario = routingScenarios[index % routingScenarios.length];
    return routeRequest(requestContext(scenario.request, scenario.objective_kind, `impact-route:${index}`), loaded.decision_profile, modulePort);
  }, warmIterations, iterations);

  const sourceHashRetention = improvementRetention.current.find((entry) => entry.candidate_id === "hash:live-source-native-sha256") ?? null;
  let portableSourceRefresh = null;
  let sourceRefresh;
  if (sourceHashRetention) {
    sourceRefresh = await measureAsync(async () => {
      const refreshed = await loaded.context_source_provider();
      if (!refreshed.ok) throw new Error(`Native context source refresh failed: ${(refreshed.reason_codes ?? []).join(",")}`);
      return refreshed;
    }, warmIterations, iterations);
  } else {
    const portableRuntime = loadRepositoryProfile(resolve(packageRoot, benchmark.profile.wrapper_profile), repositoryRoot, {source_hash_implementation: "portable-js-sha256"});
    if (!portableRuntime.ok) throw new Error(`Portable context source runtime failed: ${(portableRuntime.reason_codes ?? []).join(",")}`);
    const pairedSourceRefresh = await measureCounterbalancedPair(
      async () => {
        const refreshed = await portableRuntime.context_source_provider();
        if (!refreshed.ok) throw new Error(`Portable context source refresh failed: ${(refreshed.reason_codes ?? []).join(",")}`);
        return refreshed;
      },
      async () => {
        const refreshed = await loaded.context_source_provider();
        if (!refreshed.ok) throw new Error(`Native context source refresh failed: ${(refreshed.reason_codes ?? []).join(",")}`);
        return refreshed;
      },
      warmIterations,
      iterations,
    );
    portableSourceRefresh = pairedSourceRefresh.a;
    sourceRefresh = pairedSourceRefresh.b;
  }

  const contextSelection = measureSync(() => selectRequestContext({
    raw_request: representative.request,
    catalog: current.definition_catalog,
    snapshot: current.ontology_snapshot,
    context_items: current.supplemental_context_items,
    policy: loaded.value.context.request_selection_policy,
  }), warmIterations, iterations);

  const preflightPhaseValues = new Map();
  const preflight = measureSync((index, stage) => evaluateTurnPreflight(
    preflightInput(representative, loaded, current, index),
    stage === "measure" ? {phase_observer: (entry) => {
      const values = preflightPhaseValues.get(entry.phase_id) ?? [];
      values.push(entry.elapsed_ms);
      preflightPhaseValues.set(entry.phase_id, values);
    }} : {},
  ), warmIterations, iterations);
  for (const phaseId of REQUIRED_PREFLIGHT_PHASES) {
    if ((preflightPhaseValues.get(phaseId) ?? []).length !== iterations) throw new Error(`Preflight phase ${phaseId} did not produce ${iterations} observations.`);
  }
  const preflightPhaseMetrics = Object.fromEntries([...preflightPhaseValues.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([phaseId, values]) => [
    `turn-preflight:${phaseId}`,
    {...summarize(values, values.length, values.length), candidate_target: true, relationship: "instrumented-leaf"},
  ]));

  const envelopeComposition = evaluateTurnPreflight(preflightInput(representative, loaded, current, "envelope-comparison")).composition;
  if (!envelopeComposition?.ok) throw new Error("Envelope comparison requires a successful Context Basis composition.");
  const envelopePolicy = {...loaded.value.context_projection, current_sources: current.source_snapshot, freshness_state: "current"};
  const envelopeHashRetention = improvementRetention.current.find((entry) => entry.candidate_id === "hash:context-envelope-native-sha256") ?? null;
  let portableEnvelopeAssembly = null;
  let nativeEnvelopeAssembly;
  if (envelopeHashRetention) {
    nativeEnvelopeAssembly = measureSync(() => assembleContextEnvelope(envelopeComposition, {...envelopePolicy, digest_implementation: "node-crypto-sha256"}), warmIterations, iterations);
  } else {
    const portableEnvelopeProbe = assembleContextEnvelope(envelopeComposition, {...envelopePolicy, digest_implementation: "portable-js-sha256"});
    const nativeEnvelopeProbe = assembleContextEnvelope(envelopeComposition, {...envelopePolicy, digest_implementation: "node-crypto-sha256"});
    if (!portableEnvelopeProbe.ok || !nativeEnvelopeProbe.ok || JSON.stringify(portableEnvelopeProbe) !== JSON.stringify(nativeEnvelopeProbe)) throw new Error("Portable and native Context Envelope hashing produced different bytes.");
    const pairedEnvelopeAssembly = await measureCounterbalancedPair(
      async () => assembleContextEnvelope(envelopeComposition, {...envelopePolicy, digest_implementation: "portable-js-sha256"}),
      async () => assembleContextEnvelope(envelopeComposition, {...envelopePolicy, digest_implementation: "node-crypto-sha256"}),
      warmIterations,
      iterations,
    );
    portableEnvelopeAssembly = pairedEnvelopeAssembly.a;
    nativeEnvelopeAssembly = pairedEnvelopeAssembly.b;
  }

  const reasoningLedger = createReasoningStateLedger({ledger_id: "reasoning:impact-profile", sink: createMemoryReasoningStateSink()});
  let ledgerSequence = 0;
  const reasoningState = measureSync(() => {
    ledgerSequence += 1;
    const appended = reasoningLedger.append({event_kind: "impact-profile-turn-observed", idempotency_key: `impact-profile:${ledgerSequence}`, content: {sequence: ledgerSequence}});
    if (!appended.ok) throw new Error(`Reasoning event append failed: ${(appended.reason_codes ?? []).join(",")}`);
    const sealed = sealReasoningStateEpoch(reasoningLedger, {event_digests: [appended.event.event_digest], consumer_ref: "are:impact-profile", request_ref: `impact:${ledgerSequence}`, selected_dependencies: [], frontier: {kind: "impact-profile", sequence: ledgerSequence}});
    if (!sealed.ok) throw new Error(`Reasoning epoch seal failed: ${(sealed.reason_codes ?? []).join(",")}`);
    return sealed.value;
  }, warmIterations, iterations);

  const coldWrappers = Array.from({length: warmIterations + iterations}, (_, index) => wrapperFor(loaded, {lane: "interaction-bound", consumer_ref: `codex:impact-cold:${index}`, purpose: "impact-profile-cold", source_epoch: "impact-profile:current"}));
  let coldCursor = 0;
  const coldTurn = await measureAsync(async (index, stage) => {
    const sequence = coldCursor++;
    const action = await coldWrappers[sequence].processClientMessage(turnMessage(`impact-cold-${stage}-${index}`, `impact-cold-thread-${sequence}`, representative.request, representative.objective_kind));
    return (action.to_server?.length ?? 0) > 0;
  }, warmIterations, iterations);

  const warmWrapper = wrapperFor(loaded, {lane: "plan-bound", consumer_ref: "codex:impact-warm-plan", purpose: "impact-profile-reuse", source_epoch: "impact-profile:current", window_ref: "impact-profile:window", request_id: "impact-profile:request"});
  const warmTurn = await measureAsync(async (index, stage) => {
    const action = await warmWrapper.processClientMessage(turnMessage(`impact-warm-${stage}-${index}`, "impact-warm-thread", representative.request, representative.objective_kind));
    return (action.to_server?.length ?? 0) > 0;
  }, warmIterations, iterations);

  const interactionPairs = [];
  for (let index = 0; index < warmIterations + iterations; index += 1) {
    const binding = (arm) => ({lane: "interaction-bound", consumer_ref: `codex:impact-interaction:${arm}:${index}`, purpose: "impact-profile-compatible-interaction", source_epoch: "impact-profile:current", request_id: `impact-profile:compatible-interaction:${arm}:${index}`});
    const reassembled = wrapperFor(loaded, binding("reassembled"), {interaction_projection_reuse: false});
    const reused = wrapperFor(loaded, binding("reused"), {interaction_projection_reuse: true});
    const firstReassembled = await reassembled.processClientMessage(turnMessage(`impact-interaction-reassembled-prime-${index}`, `impact-interaction-reassembled-thread-${index}`, representative.request, representative.objective_kind));
    const firstReused = await reused.processClientMessage(turnMessage(`impact-interaction-reused-prime-${index}`, `impact-interaction-reused-thread-${index}`, representative.request, representative.objective_kind));
    if ((firstReassembled.to_server?.length ?? 0) !== 1 || (firstReused.to_server?.length ?? 0) !== 1) throw new Error(`Interaction impact pair ${index} could not be primed.`);
    interactionPairs.push({reassembled, reused});
  }
  const pairedInteractionTurns = await measureCounterbalancedPair(
    async (index, stage) => {
      const action = await interactionPairs[index].reassembled.processClientMessage(turnMessage(`impact-interaction-reassembled-${stage}-${index}`, `impact-interaction-reassembled-thread-${index}`, representative.request, representative.objective_kind));
      return (action.to_server?.length ?? 0) === 1;
    },
    async (index, stage) => {
      const action = await interactionPairs[index].reused.processClientMessage(turnMessage(`impact-interaction-reused-${stage}-${index}`, `impact-interaction-reused-thread-${index}`, representative.request, representative.objective_kind));
      return (action.to_server?.length ?? 0) === 1;
    },
    warmIterations,
    iterations,
  );
  const reassembledInteractionTurn = pairedInteractionTurns.a;
  const reusedInteractionTurn = pairedInteractionTurns.b;

  const phaseMetrics = {
    "request-routing": {...route, candidate_target: true, relationship: "component"},
    "live-source-refresh": {...sourceRefresh, candidate_target: true, relationship: "component"},
    ...(portableSourceRefresh ? {"live-source-refresh-portable-sha256": {...portableSourceRefresh, candidate_target: false, relationship: "controlled-baseline"}} : {}),
    "context-selection": {...contextSelection, candidate_target: true, relationship: "component"},
    "turn-preflight": {...preflight, candidate_target: false, relationship: "instrumented-container"},
    ...preflightPhaseMetrics,
    ...(portableEnvelopeAssembly ? {"context-envelope-assembly-portable-sha256": {...portableEnvelopeAssembly, candidate_target: false, relationship: "controlled-baseline"}} : {}),
    "context-envelope-assembly-native-sha256": {...nativeEnvelopeAssembly, candidate_target: true, relationship: "controlled-treatment"},
    "reasoning-state-append-seal": {...reasoningState, candidate_target: true, relationship: "component"},
    "local-turn-start-cold": {...coldTurn, candidate_target: false, relationship: "boundary"},
    "local-turn-start-plan-reuse": {...warmTurn, candidate_target: false, relationship: "observed-alternative"},
    "local-turn-start-interaction-reassembled": {...reassembledInteractionTurn, candidate_target: false, relationship: "controlled-baseline"},
    "local-turn-start-interaction-projection-reuse": {...reusedInteractionTurn, candidate_target: false, relationship: "controlled-treatment"},
  };
  const impactAssessment = assessImpactCandidates({
    boundary_p95_ms: coldTurn.p95_ms,
    phase_metrics: phaseMetrics,
    observed_comparisons: [
      {candidate_id: "reuse:plan-bound-context", target_phase: "local-turn-start", baseline_p95_ms: coldTurn.p95_ms, candidate_p95_ms: warmTurn.p95_ms},
      {candidate_id: "reuse:interaction-bound-content-projection", target_phase: "local-turn-start-interaction", baseline_p95_ms: reassembledInteractionTurn.p95_ms, candidate_p95_ms: reusedInteractionTurn.p95_ms},
      {candidate_id: "hash:live-source-native-sha256", target_phase: "live-source-refresh", baseline_p95_ms: sourceHashRetention?.observed_comparison?.baseline_p95_ms ?? portableSourceRefresh.p95_ms, candidate_p95_ms: sourceHashRetention?.observed_comparison?.candidate_p95_ms ?? sourceRefresh.p95_ms},
      {candidate_id: "hash:context-envelope-native-sha256", target_phase: "turn-preflight:context-envelope-assembly", baseline_p95_ms: envelopeHashRetention?.observed_comparison?.baseline_p95_ms ?? portableEnvelopeAssembly.p95_ms, candidate_p95_ms: envelopeHashRetention?.observed_comparison?.candidate_p95_ms ?? nativeEnvelopeAssembly.p95_ms},
    ],
    retained_candidates: improvementRetention.current,
    thresholds: config,
  });
  const semanticMaterial = {
    schema_version: IMPACT_PROFILE_SCHEMA,
    benchmark_id: benchmark.profile.benchmark_id,
    representative_scenario_id: representative.scenario_id,
    sampling: {warm_iterations: warmIterations, iterations},
    interaction_comparison_design: {kind: "counterbalanced-isolated-successor-pairs", primed_pair_count: warmIterations + iterations, required_valid_observations_per_arm: warmIterations + iterations, observed_valid_reassembled: reassembledInteractionTurn.observation_checksum, observed_valid_reused: reusedInteractionTurn.observation_checksum},
    source_refresh_comparison_design: sourceHashRetention
      ? {kind: "retained-comparison-not-rerun", retention_ref: sourceHashRetention.retention_ref, retained_valid_observations_per_arm: sourceHashRetention.observed_comparison.valid_observations_per_arm, observed_valid_portable: 0, observed_valid_native: sourceRefresh.observation_checksum, verification: "read-and-hash-every-selected-source"}
      : {kind: "counterbalanced-full-read-and-hash", required_valid_observations_per_arm: warmIterations + iterations, observed_valid_portable: portableSourceRefresh.observation_checksum, observed_valid_native: sourceRefresh.observation_checksum, verification: "read-and-hash-every-selected-source"},
    preflight_phase_observation: {kind: "non-semantic-phase-observer", required_observations_per_phase: iterations, observed_phases: Object.fromEntries([...preflightPhaseValues.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([phaseId, values]) => [phaseId, values.length])), output_bytes_changed: false},
    envelope_hash_comparison_design: envelopeHashRetention
      ? {kind: "retained-comparison-not-rerun", retention_ref: envelopeHashRetention.retention_ref, retained_valid_observations_per_arm: envelopeHashRetention.observed_comparison.valid_observations_per_arm, observed_valid_portable: 0, observed_valid_native: nativeEnvelopeAssembly.observation_checksum, output_bytes_equal: true}
      : {kind: "counterbalanced-byte-identical-envelope-assembly", required_valid_observations_per_arm: warmIterations + iterations, observed_valid_portable: portableEnvelopeAssembly.observation_checksum, observed_valid_native: nativeEnvelopeAssembly.observation_checksum, output_bytes_equal: true},
    improvement_retention: improvementRetention,
    phase_metrics: phaseMetrics,
    phase_relationships: [
      {container: "local-turn-start-cold", includes: ["live-source-refresh", "turn-preflight", "wrapper-context-projection"], additive: false},
      {container: "turn-preflight", includes: Object.keys(preflightPhaseMetrics), additive: false},
      {container: "local-turn-start-interaction-reassembled", includes: ["turn-preflight", "reasoning-state-successor", "context-envelope-assembly"], additive: false},
      {container: "local-turn-start-interaction-projection-reuse", includes: ["turn-preflight", "reasoning-state-successor", "content-addressed-context-projection-reuse"], additive: false},
      {container: "turn-preflight:context-envelope-assembly", includes: ["context-envelope-assembly-native-sha256"], additive: false},
    ],
    impact_assessment: impactAssessment,
    unmeasured_phases: [
      {phase_id: "semantic-completion", reason: "not invoked at turn/start and no production semantic domain is forced by this benchmark"},
      {phase_id: "model-inference-and-provider-cache", reason: "external provider timing requires a separately selected live canary"},
    ],
    status: impactAssessment.status,
    environment: {node: process.version, platform: process.platform, arch: process.arch},
    authority_effect: "none",
    claim_limit: "Local profiling and hypothesis-selection evidence only; no optimization activation, acceptance, conformance, publication, deployment, or effect authority.",
  };
  const boundMaterial = {...semanticMaterial, profile_digest: sha256(benchmark.profile)};
  return Object.freeze({...boundMaterial, report_digest: sha256(boundMaterial)});
}

function display(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "-";
}

export function formatImpactProfileSummary(result) {
  const selected = result?.impact_assessment?.selected_candidate;
  const phases = Object.entries(result?.phase_metrics ?? {}).sort(([, left], [, right]) => right.p95_ms - left.p95_ms);
  return [
    `impact-profile status=${result?.status ?? "UNKNOWN"} scenario=${result?.representative_scenario_id ?? "unknown"}`,
    ...phases.map(([phaseId, metric]) => `${phaseId}: p95=${display(metric.p95_ms)}ms mean=${display(metric.mean_ms)}ms`),
    selected ? `selected=${selected.candidate_id} potential=${display(selected.potential_savings_ms)}ms ratio=${display(selected.potential_end_to_end_savings_ratio)}` : `selected=none reasons=${(result?.impact_assessment?.reason_codes ?? []).join(",")}`,
  ].join("\n");
}
