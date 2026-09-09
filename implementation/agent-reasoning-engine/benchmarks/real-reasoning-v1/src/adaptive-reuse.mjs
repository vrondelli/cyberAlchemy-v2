import {performance} from "node:perf_hooks";

import {canonicalJson} from "../../../packages/intent-route-resolver/index.mjs";
import {
  assessContextRefresh,
  projectCompactionAwareContext,
  verifyCompactionProjection,
} from "../../../packages/context-basis-runtime/index.mjs";
import {
  compileRequestIntent,
  detectCorrection,
  materializeIntentReflection,
} from "../../../packages/request-intent-runtime/index.mjs";
import {
  createRequestSeriesHeader,
  materializeContextBoundCacheAffinityProjection,
  materializeCacheAffinityProjection,
} from "../../../packages/reasoning-state-runtime/index.mjs";
import {ratio, resultEnvelope, sha256} from "./common.mjs";
import {loadExactBoundJsonl} from "./corpus.mjs";
import {packageRoot} from "./common.mjs";

const ARM_IDS = Object.freeze([
  "A-recent-window-control",
  "B-typed-projection",
  "C-projection-plus-reflection",
  "D-adaptive-refresh-and-reuse",
]);

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}

function sourceDigest(identity, revision = "v1") {
  return sha256(`${identity}:${revision}`);
}

function baseComposition(scenario) {
  const material = {
    route_decision: {
      request_context_digest: sourceDigest(`${scenario.scenario_id}:request`),
      decision_profile_digest: sourceDigest("route-profile"),
      decision_digest: sourceDigest("route-decision"),
      selected: {route_id: "CA2-ROUTE-RESEARCH"},
    },
    definition_closure: {
      digest: sourceDigest("definition-closure"),
      value: {definitions: [{definition_id: "ARE-D-PRIMARY", digest: sourceDigest("definition"), source_ref: "benchmark:definition"}]},
    },
    ontology_selector_lock: {
      digest: sourceDigest("ontology-selector-lock"),
      binding_lock: {
        nodes: [{node_id: "ARE-N-PRIMARY", source_digest: sourceDigest("ontology-node"), source_ref: "benchmark:ontology-node"}],
        edges: [{edge_id: "ARE-E-PRIMARY", source_digest: sourceDigest("ontology-edge"), source_ref: "benchmark:ontology-edge"}],
      },
    },
    request_context_selection: {digest: sourceDigest("request-context-selection")},
    necessary_context_basis: {
      value: {
        authority_posture: "candidate-context-only",
        effect_posture: "non-effectful",
        instructions: [],
        supplemental_context_items: [],
      },
    },
  };
  return {ok: true, value: material, digest: sha256(canonicalJson(material)), authority_effect: "none"};
}

function baseSources() {
  return [
    {source_identity: "benchmark:authority", source_digest: sourceDigest("authority")},
    {source_identity: "benchmark:definition", source_digest: sourceDigest("definition")},
    {source_identity: "benchmark:diagnostic", source_digest: sourceDigest("diagnostic")},
    {source_identity: "benchmark:ontology", source_digest: sourceDigest("ontology")},
    {source_identity: "benchmark:route-profile", source_digest: sourceDigest("route-profile")},
  ];
}

function replaceSourceDigest(sources, identity) {
  return sources.map((source) => source.source_identity === identity
    ? {...source, source_digest: sourceDigest(identity, "v2")}
    : source);
}

function driftedState(scenario, composition, sources) {
  const current = structuredClone(composition);
  let nextSources = structuredClone(sources);
  switch (scenario.change_kind) {
    case "none": break;
    case "selected-definition":
      current.value.definition_closure.digest = sourceDigest("definition-closure", "v2");
      current.value.definition_closure.value.definitions[0].digest = sourceDigest("definition", "v2");
      nextSources = replaceSourceDigest(nextSources, "benchmark:definition");
      break;
    case "selected-ontology-node":
      current.value.ontology_selector_lock.digest = sourceDigest("ontology-selector-lock", "node-v2");
      current.value.ontology_selector_lock.binding_lock.nodes[0].source_digest = sourceDigest("ontology-node", "v2");
      nextSources = replaceSourceDigest(nextSources, "benchmark:ontology");
      break;
    case "selected-ontology-edge":
      current.value.ontology_selector_lock.digest = sourceDigest("ontology-selector-lock", "edge-v2");
      current.value.ontology_selector_lock.binding_lock.edges[0].source_digest = sourceDigest("ontology-edge", "v2");
      nextSources = replaceSourceDigest(nextSources, "benchmark:ontology");
      break;
    case "route-profile":
      current.value.route_decision.decision_profile_digest = sourceDigest("route-profile", "v2");
      nextSources = replaceSourceDigest(nextSources, "benchmark:route-profile");
      break;
    case "authority-posture":
      current.value.necessary_context_basis.value.authority_posture = "successor-candidate-context-only";
      nextSources = replaceSourceDigest(nextSources, "benchmark:authority");
      break;
    case "unrelated-source":
      nextSources = replaceSourceDigest(nextSources, "benchmark:diagnostic");
      break;
    default: throw new Error(`Unknown adaptive-reuse change kind: ${scenario.change_kind}`);
  }
  current.digest = sha256(canonicalJson(current.value));
  return {composition: current, sources: nextSources};
}

function scenarioEvents(scenario) {
  const facts = scenario.facts.map((fact, index) => ({
    event_id: fact.event_id,
    sequence: index + 1,
    event_kind: fact.event_kind,
    content: {text: fact.text},
  }));
  const distractors = Array.from({length: scenario.distractor_count}, (_, index) => ({
    event_id: `${scenario.scenario_id.toLocaleLowerCase()}-distractor-${String(index + 1).padStart(2, "0")}`,
    sequence: facts.length + index + 1,
    event_kind: "analysis-recorded",
    content: {text: `${scenario.scenario_id}:diagnostic-${index + 1}:`.repeat(scenario.distractor_repeat)},
  }));
  return deepFreeze({
    source_epoch_id: `reasoning-epoch:${scenario.scenario_id.toLocaleLowerCase()}`,
    events: [...facts, ...distractors, {
      event_id: `${scenario.scenario_id.toLocaleLowerCase()}-current`,
      sequence: facts.length + distractors.length + 1,
      event_kind: "analysis-recorded",
      retention_class: "active",
      content: {text: scenario.request},
    }],
  });
}

async function intentState(scenario) {
  const previous = await compileRequestIntent({request_ref: `${scenario.scenario_id}:previous`, request: scenario.previous_request});
  if (!previous.ok) throw new Error(`Previous intent compilation failed for ${scenario.scenario_id}`);
  const current = await compileRequestIntent({
    request_ref: `${scenario.scenario_id}:current`,
    request: scenario.request,
    predecessor_contract_digest: previous.value.contract.intent_contract_digest,
  });
  if (!current.ok) throw new Error(`Current intent compilation failed for ${scenario.scenario_id}`);
  const correction = await detectCorrection({
    request_ref: `${scenario.scenario_id}:current`,
    request: scenario.request,
    previous_contract: previous.value.contract,
  });
  if (!correction.ok) throw new Error(`Correction detection failed for ${scenario.scenario_id}`);
  const reflection = correction.value === null ? null : materializeIntentReflection({
    correction_candidate: correction.value,
    previous_contract: previous.value.contract,
    corrected_contract: current.value.contract,
    causal_analysis: ["The prior surface interpretation did not preserve the user's construction intent."],
    immediate_repair: true,
    proposed_scope: "current-interaction",
    provenance_refs: [`benchmark-scenario:${scenario.scenario_id}`],
  });
  return {previous: previous.value.contract, current: current.value.contract, reflection};
}

function reflectionEnhancedInput(input, scenario, reflection) {
  if (reflection === null || scenario.correction_event_id === null) return input;
  return deepFreeze({
    source_epoch_id: `${input.source_epoch_id}:reflected`,
    events: input.events.map((event) => event.event_id === scenario.correction_event_id ? {
      ...event,
      event_kind: "request-corrected",
      retention_class: "pinned",
      content: {...event.content, correction_kind: reflection.correction_kind, reflection_digest: reflection.reflection_digest},
      provenance_refs: [`intent-reflection:${reflection.reflection_digest}`],
    } : event),
  });
}

function exactIds(result) {
  if (!result?.ok) return new Set();
  const projection = result.value.projected_context;
  return new Set([...projection.pinned_events, ...projection.active_events].map((event) => event.event_id));
}

function preservationRate(requiredIds, ids) {
  return ratio(requiredIds.filter((eventId) => ids.has(eventId)).length, requiredIds.length);
}

function byteReduction(projectedBytes, sourceBytes) {
  return sourceBytes === 0 ? 0 : 1 - projectedBytes / sourceBytes;
}

function projectionArm(armId, result, verification, requiredIds, intentFidelity, sourceBytes, cache = null, staleReuse = false) {
  return {
    arm_id: armId,
    critical_fact_preservation_rate: preservationRate(requiredIds, exactIds(result)),
    intent_fidelity: intentFidelity,
    projected_bytes: result.value.projected_bytes,
    byte_reduction_ratio: byteReduction(result.value.projected_bytes, sourceBytes),
    projection_digest: result.digest,
    projection_verified: verification.ok === true,
    exact_prefix_reuse: cache?.assessment.exact_prefix_reuse ?? null,
    reusable_prefix_bytes: cache?.assessment.reusable_prefix_bytes ?? null,
    reused_prefix_bytes: cache?.assessment.reused_prefix_bytes ?? null,
    cache_hit_posture: cache?.assessment.cache_hit_posture ?? null,
    cache_invalidation_reasons: cache?.assessment.invalidation_reasons ?? [],
    context_reuse_disposition: cache?.receipt?.disposition ?? null,
    context_reuse_receipt_digest: cache?.receipt?.receipt_digest ?? null,
    stale_reuse_incident: staleReuse,
  };
}

function cacheProjection(reusableReasoningState, volatileSuffix, previousProjection = null) {
  const requestHeader = createRequestSeriesHeader({jsonrpc: "2.0", method: "turn/start", params: {}}, {
    provider_ref: "codex-app-server",
    model_ref: "deterministic-structural-benchmark",
    system: "ARE adaptive reasoning-state reuse benchmark",
    tools: [{name: "repository-context"}],
    configuration: {lane: "benchmark", protocol: "app-server"},
  });
  const result = materializeCacheAffinityProjection({
    request_header: requestHeader,
    reusable_reasoning_state: reusableReasoningState,
    volatile_current_turn_suffix: volatileSuffix,
    previous_projection: previousProjection,
  });
  if (!result.ok) throw new Error(`Cache-affinity projection failed: ${result.reason_codes.join(",")}`);
  return result;
}

function contextBoundCacheProjection(reusableReasoningState, volatileSuffix, previousProjection, refreshAssessment) {
  const requestHeader = createRequestSeriesHeader({jsonrpc: "2.0", method: "turn/start", params: {}}, {
    provider_ref: "codex-app-server",
    model_ref: "deterministic-structural-benchmark",
    system: "ARE adaptive reasoning-state reuse benchmark",
    tools: [{name: "repository-context"}],
    configuration: {lane: "benchmark", protocol: "app-server"},
  });
  const result = materializeContextBoundCacheAffinityProjection({
    request_header: requestHeader,
    current_reusable_reasoning_state: reusableReasoningState,
    volatile_current_turn_suffix: volatileSuffix,
    previous_projection: previousProjection,
    refresh_assessment: refreshAssessment,
  });
  if (!result.ok) throw new Error(`Context-bound cache projection failed: ${result.reason_codes.join(",")}`);
  return result;
}

function rawControlArm(input, requiredIds, intentFidelity) {
  const selected = [input.events[0], ...input.events.slice(-2)]
    .filter((event, index, values) => values.findIndex((candidate) => candidate.event_id === event.event_id) === index);
  const sourceBytes = Buffer.byteLength(canonicalJson(input.events), "utf8");
  const projectedBytes = Buffer.byteLength(canonicalJson(selected), "utf8");
  return {
    arm_id: ARM_IDS[0],
    critical_fact_preservation_rate: preservationRate(requiredIds, new Set(selected.map((event) => event.event_id))),
    intent_fidelity: intentFidelity,
    projected_bytes: projectedBytes,
    byte_reduction_ratio: byteReduction(projectedBytes, sourceBytes),
    projection_digest: sha256(canonicalJson(selected)),
    projection_verified: true,
    exact_prefix_reuse: null,
    reusable_prefix_bytes: null,
    reused_prefix_bytes: null,
    cache_hit_posture: null,
    cache_invalidation_reasons: [],
    context_reuse_disposition: null,
    context_reuse_receipt_digest: null,
    stale_reuse_incident: false,
  };
}

async function evaluateScenario(scenario, policy, candidateMode = "context-bound-refresh-gate") {
  const input = scenarioEvents(scenario);
  const intent = await intentState(scenario);
  const expectedCorrection = scenario.expected_correction_kind;
  const noReflectionFidelity = expectedCorrection === null;
  const reflectionFidelity = expectedCorrection === null
    ? intent.reflection === null
    : intent.reflection?.correction_kind === expectedCorrection;
  const reflectedInput = reflectionEnhancedInput(input, scenario, intent.reflection);
  const projectionPolicy = {
    max_inline_bytes: policy.max_inline_bytes,
    recent_active_units: policy.recent_active_units,
    preview_head_characters: policy.preview_head_characters,
    preview_tail_characters: policy.preview_tail_characters,
  };
  const typed = projectCompactionAwareContext(input, projectionPolicy);
  const reflected = projectCompactionAwareContext(reflectedInput, projectionPolicy);
  if (!typed.ok || !reflected.ok) throw new Error(`Projection failed for ${scenario.scenario_id}`);
  const typedVerification = verifyCompactionProjection(typed, input);
  const reflectedVerification = verifyCompactionProjection(reflected, reflectedInput);
  const requiredIds = scenario.facts.map((fact) => fact.event_id);
  const sourceBytes = typed.value.source_bytes;

  const composition = baseComposition(scenario);
  const sources = baseSources();
  const initial = assessContextRefresh(null, composition, sources);
  if (!initial.ok) throw new Error(`Initial refresh assessment failed for ${scenario.scenario_id}`);
  const previousEnvelope = {
    context_epoch_id: `context-epoch:${scenario.scenario_id}:previous`,
    selected_dependencies: initial.value.current_selected_dependencies,
    source_snapshot: sources,
  };
  const current = driftedState(scenario, composition, sources);
  const refresh = assessContextRefresh(previousEnvelope, current.composition, current.sources);
  if (!refresh.ok) throw new Error(`Current refresh assessment failed for ${scenario.scenario_id}`);
  const previousDependencyDigest = sha256(canonicalJson(initial.value.current_selected_dependencies));
  const currentDependencyDigest = sha256(canonicalJson(refresh.value.current_selected_dependencies));

  const previousReusableState = {
    compaction_projection_digest: typed.digest,
    selected_dependencies_digest: previousDependencyDigest,
    reflection_digest: null,
  };
  const cCurrentState = {
    compaction_projection_digest: reflected.digest,
    selected_dependencies_digest: previousDependencyDigest,
    reflection_digest: intent.reflection?.reflection_digest ?? null,
  };
  const dCurrentState = {
    compaction_projection_digest: reflected.digest,
    selected_dependencies_digest: currentDependencyDigest,
    reflection_digest: intent.reflection?.reflection_digest ?? null,
  };
  const priorCache = cacheProjection(previousReusableState, {request_ref: `${scenario.scenario_id}:previous`});
  const cCache = cacheProjection(cCurrentState, {request_ref: `${scenario.scenario_id}:current`}, priorCache.projection);
  const dCache = candidateMode === "legacy-ungated-reuse"
    ? cCache
    : contextBoundCacheProjection(dCurrentState, {request_ref: `${scenario.scenario_id}:current`}, priorCache.projection, refresh);
  const selectedDrift = refresh.value.disposition === "successor-required";
  const cStaleReuse = selectedDrift && cCache.assessment.exact_prefix_reuse;
  const dStaleReuse = selectedDrift && dCache.assessment.exact_prefix_reuse;
  const changedDependencyIds = refresh.value.changed_selected_dependencies.map((entry) => entry.identity).sort();

  const arms = [
    rawControlArm(input, requiredIds, noReflectionFidelity),
    projectionArm(ARM_IDS[1], typed, typedVerification, requiredIds, noReflectionFidelity, sourceBytes),
    projectionArm(ARM_IDS[2], reflected, reflectedVerification, requiredIds, reflectionFidelity, sourceBytes, cCache, cStaleReuse),
    projectionArm(ARM_IDS[3], reflected, reflectedVerification, requiredIds, reflectionFidelity, sourceBytes, dCache, dStaleReuse),
  ];
  const adaptive = arms[3];
  const passed = refresh.value.disposition === scenario.expected_refresh_disposition
    && canonicalJson(changedDependencyIds) === canonicalJson([...scenario.expected_changed_dependency_ids].sort())
    && refresh.value.unrelated_source_drift.length === scenario.expected_unrelated_source_drift
    && adaptive.exact_prefix_reuse === scenario.expected_exact_prefix_reuse
    && adaptive.stale_reuse_incident === false
    && adaptive.critical_fact_preservation_rate === 1
    && adaptive.intent_fidelity === true
    && adaptive.projection_verified === true
    && adaptive.byte_reduction_ratio >= policy.minimum_byte_reduction_ratio;
  return {
    scenario_id: scenario.scenario_id,
    passed,
    change_kind: scenario.change_kind,
    refresh_disposition: refresh.value.disposition,
    refresh_digest: refresh.digest,
    changed_selected_dependency_ids: changedDependencyIds,
    unrelated_source_drift_count: refresh.value.unrelated_source_drift.length,
    expected_exact_prefix_reuse: scenario.expected_exact_prefix_reuse,
    correction_kind: intent.reflection?.correction_kind ?? null,
    arms,
  };
}

function aggregateArm(cases, armId) {
  const arms = cases.map((entry) => entry.arms.find((arm) => arm.arm_id === armId));
  const comparable = arms.filter((arm) => arm.exact_prefix_reuse !== null);
  return {
    critical_fact_preservation_rate: arms.reduce((sum, arm) => sum + arm.critical_fact_preservation_rate, 0) / arms.length,
    intent_fidelity_rate: ratio(arms.filter((arm) => arm.intent_fidelity).length, arms.length),
    mean_byte_reduction_ratio: arms.reduce((sum, arm) => sum + arm.byte_reduction_ratio, 0) / arms.length,
    stale_reuse_incidents: arms.filter((arm) => arm.stale_reuse_incident).length,
    exact_prefix_reuse_count: comparable.filter((arm) => arm.exact_prefix_reuse).length,
    reused_prefix_bytes: comparable.reduce((sum, arm) => sum + (arm.reused_prefix_bytes ?? 0), 0),
    cache_hit_posture: comparable.length === 0 ? "not-applicable" : "unobserved",
  };
}

async function timing(scenarios, policy, warmIterations, iterations, candidateMode) {
  for (let index = 0; index < warmIterations; index += 1) await evaluateScenario(scenarios[index % scenarios.length], policy, candidateMode);
  const durations = [];
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    await evaluateScenario(scenarios[index % scenarios.length], policy, candidateMode);
    durations.push(performance.now() - started);
  }
  return {
    iterations,
    p50_ms: percentile(durations, 0.50),
    p95_ms: percentile(durations, 0.95),
    max_ms: Math.max(0, ...durations),
  };
}

export async function runAdaptiveReuseBenchmark(benchmark, options = {}) {
  const policy = benchmark.profile.adaptive_reuse;
  const holdout = options.holdout === true;
  const candidateMode = options.candidate_mode ?? "context-bound-refresh-gate";
  if (!["context-bound-refresh-gate", "legacy-ungated-reuse"].includes(candidateMode)) throw new TypeError(`Unsupported adaptive candidate mode: ${candidateMode}`);
  const scenarios = holdout ? loadExactBoundJsonl(packageRoot, policy.holdout) : benchmark.corpora.adaptive_reuse;
  const cases = [];
  for (const scenario of scenarios) cases.push(await evaluateScenario(scenario, policy, candidateMode));
  const byArm = Object.fromEntries(ARM_IDS.map((armId) => [armId, aggregateArm(cases, armId)]));
  const eligibleCases = cases.filter((entry) => entry.expected_exact_prefix_reuse);
  const adaptiveArms = cases.map((entry) => entry.arms[3]);
  const latency = await timing(
    scenarios,
    policy,
    options.warm_iterations ?? policy.timing_warm_iterations,
    options.timing_iterations ?? policy.timing_iterations,
    candidateMode,
  );
  const checks = {
    scenario_contracts: cases.every((entry) => entry.passed),
    typed_projection_beats_recent_control: byArm[ARM_IDS[1]].critical_fact_preservation_rate > byArm[ARM_IDS[0]].critical_fact_preservation_rate,
    reflection_improves_intent_fidelity: byArm[ARM_IDS[2]].intent_fidelity_rate > byArm[ARM_IDS[1]].intent_fidelity_rate,
    adaptive_eliminates_stale_reuse: byArm[ARM_IDS[2]].stale_reuse_incidents > 0 && byArm[ARM_IDS[3]].stale_reuse_incidents === 0,
    eligible_exact_prefix_reuse: eligibleCases.every((entry) => entry.arms[3].exact_prefix_reuse === true),
    mandatory_reasoning_preserved: byArm[ARM_IDS[3]].critical_fact_preservation_rate === 1,
    byte_reduction: adaptiveArms.every((arm) => arm.byte_reduction_ratio >= policy.minimum_byte_reduction_ratio),
    latency: options.enforce_performance === false || latency.p95_ms <= policy.lifecycle_p95_ms,
  };
  const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
  return resultEnvelope(benchmark.profile, holdout ? "adaptive-reuse-holdout" : "adaptive-reuse", status, {
    checks,
    interpretation: "Deterministic structural benchmark over real ARE compaction, intent-reflection, refresh, and cache-affinity functions. It does not simulate model answer quality or claim an observed provider cache hit.",
    scenario_count: cases.length,
    variant_count: ARM_IDS.length,
    candidate_mode: candidateMode,
  }, cases, {
    by_arm: byArm,
    adaptive_lifecycle_timing: latency,
    exact_reuse_eligible_cases: eligibleCases.length,
    exact_reuse_observed_cases: eligibleCases.filter((entry) => entry.arms[3].exact_prefix_reuse).length,
    selected_drift_cases: cases.filter((entry) => entry.refresh_disposition === "successor-required").length,
    stale_reuse_incidents: byArm[ARM_IDS[3]].stale_reuse_incidents,
  });
}

export {ARM_IDS};
