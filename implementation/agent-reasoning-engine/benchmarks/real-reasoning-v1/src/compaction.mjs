import {canonicalJson} from "../../../packages/intent-route-resolver/index.mjs";
import {projectCompactionAwareContext, verifyCompactionProjection} from "../../../packages/context-basis-runtime/index.mjs";
import {createCodexContextWindowTracker} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {resultEnvelope, ratio, sha256, timing} from "./common.mjs";

function materializeEvent(event) {
  const {content_seed: contentSeed, content_repeat: contentRepeat, ...material} = event;
  const content = contentSeed === undefined
    ? event.content
    : {text: String(contentSeed).repeat(contentRepeat ?? 1)};
  return {...material, content};
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function materializeScenario(scenario) {
  return deepFreeze({
    source_epoch_id: scenario.source_epoch_id,
    events: scenario.events.map(materializeEvent),
  });
}

function bytes(value) {
  return Buffer.byteLength(canonicalJson(value), "utf8");
}

function toolPairIntegrity(sourceEvents, exactEvents, foldedEvents, partitioned = false) {
  const calls = [...new Set(sourceEvents.map((event) => event.tool_call_id).filter(Boolean))];
  if (partitioned) return true;
  return calls.every((callId) => {
    const sourceIds = sourceEvents.filter((event) => event.tool_call_id === callId).map((event) => event.event_id).sort();
    const exactIds = exactEvents.filter((event) => event.tool_call_id === callId).map((event) => event.event_id).sort();
    const foldedIds = foldedEvents.filter((event) => event.tool_call_id === callId).map((event) => event.event_id).sort();
    return canonicalJson(sourceIds) === canonicalJson(exactIds) || canonicalJson(sourceIds) === canonicalJson(foldedIds);
  });
}

function scoreArm({armId, sourceEvents, exactEvents, foldedEvents = [], foldedPartition = null, requiredPinnedIds, byteCount, sourceRetained, digest}) {
  const exactIds = new Set(exactEvents.map((event) => event.event_id));
  const represented = new Set([...exactEvents, ...foldedEvents].map((event) => event.event_id)).size + (foldedPartition?.event_count ?? 0);
  return {
    arm_id: armId,
    pinned_survival_rate: ratio(requiredPinnedIds.filter((id) => exactIds.has(id)).length, requiredPinnedIds.length),
    recoverability_rate: sourceRetained ? ratio(represented, sourceEvents.length) : ratio(exactIds.size, sourceEvents.length),
    tool_pair_integrity: toolPairIntegrity(sourceEvents, exactEvents, foldedEvents, foldedPartition !== null),
    exact_event_count: exactEvents.length,
    folded_event_count: foldedEvents.length + (foldedPartition?.event_count ?? 0),
    projected_bytes: byteCount,
    projection_digest: digest,
  };
}

function fullHistoryArm(input, requiredPinnedIds) {
  const exactEvents = input.events.map((event) => ({...event, projection_posture: "exact"}));
  const payload = {schema_version: "are.compaction-benchmark-full-history/v1", events: exactEvents};
  return scoreArm({armId: "A-full-history", sourceEvents: input.events, exactEvents, requiredPinnedIds, byteCount: bytes(payload), sourceRetained: true, digest: sha256(canonicalJson(payload))});
}

function recentOnlyArm(input, requiredPinnedIds, recentCount) {
  const selected = [input.events[0], ...input.events.slice(-recentCount)]
    .filter((event, index, values) => values.findIndex((candidate) => candidate.event_id === event.event_id) === index)
    .map((event) => ({...event, projection_posture: "exact"}));
  const payload = {schema_version: "are.compaction-benchmark-recent-only/v1", events: selected};
  return scoreArm({armId: "B-recent-only-control", sourceEvents: input.events, exactEvents: selected, requiredPinnedIds, byteCount: bytes(payload), sourceRetained: false, digest: sha256(canonicalJson(payload))});
}

function treatmentArm(armId, input, requiredPinnedIds, result) {
  const projection = result.value.projected_context;
  return scoreArm({
    armId,
    sourceEvents: input.events,
    exactEvents: [...projection.pinned_events, ...projection.active_events],
    foldedEvents: projection.folded_events,
    foldedPartition: projection.folded_partition,
    requiredPinnedIds,
    byteCount: result.value.projected_bytes,
    sourceRetained: result.value.source_retained,
    digest: result.digest,
  });
}

export async function runCompactionBenchmark(benchmark) {
  const {profile, corpora} = benchmark;
  const policy = profile.compaction;
  const tracker = createCodexContextWindowTracker();
  const cases = [];
  const projectionScenarios = corpora.compaction.filter((scenario) => scenario.scenario_kind === "reasoning-projection");
  const materializedScenarios = projectionScenarios.map(materializeScenario);

  for (const [scenarioIndex, scenario] of projectionScenarios.entries()) {
    const input = materializedScenarios[scenarioIndex];
    const projectionPolicy = {
      max_inline_bytes: policy.max_inline_bytes,
      recent_active_units: policy.recent_active_units,
      preview_head_characters: policy.preview_head_characters,
      preview_tail_characters: policy.preview_tail_characters,
    };
    const treatment = projectCompactionAwareContext(input, projectionPolicy);
    const replay = projectCompactionAwareContext(structuredClone(input), projectionPolicy);
    const cachedProjection = projectCompactionAwareContext(input, projectionPolicy);
    const verification = treatment.ok ? verifyCompactionProjection(treatment, input) : treatment;
    for (const message of scenario.codex_notifications ?? []) tracker.observe(message);
    const postCompaction = projectCompactionAwareContext(structuredClone(input), projectionPolicy);
    const arms = treatment.ok ? [
      fullHistoryArm(input, scenario.required_pinned_event_ids),
      recentOnlyArm(input, scenario.required_pinned_event_ids, policy.recent_only_events),
      treatmentArm("C-pinned-masked", input, scenario.required_pinned_event_ids, treatment),
      treatmentArm("D-pinned-masked-post-compaction", input, scenario.required_pinned_event_ids, postCompaction),
    ] : [];
    const treatmentArmResult = arms.find((arm) => arm.arm_id === "C-pinned-masked");
    const fullArm = arms.find((arm) => arm.arm_id === "A-full-history");
    cases.push({
      scenario_id: scenario.scenario_id,
      passed: treatment.ok === true
        && verification.ok === true
        && replay.digest === treatment.digest
        && postCompaction.digest === treatment.digest
        && treatmentArmResult.pinned_survival_rate === 1
        && treatmentArmResult.recoverability_rate === 1
        && treatmentArmResult.tool_pair_integrity === true
        && treatmentArmResult.projected_bytes <= policy.max_inline_bytes
        && 1 - treatmentArmResult.projected_bytes / fullArm.projected_bytes >= policy.minimum_byte_reduction_ratio,
      source_event_count: input.events.length,
      deterministic_replay: treatment.ok === true && replay.digest === treatment.digest,
      exact_projection_reuse: treatment.ok === true && cachedProjection === treatment,
      post_compaction_projection_stable: treatment.ok === true && postCompaction.digest === treatment.digest,
      verification: {ok: verification.ok, reason_codes: verification.reason_codes ?? []},
      byte_reduction_ratio: treatment.ok ? 1 - treatment.value.projected_bytes / arms[0].projected_bytes : null,
      arms,
      reason_codes: treatment.reason_codes ?? [],
    });
  }

  const latency = timing((index) => {
    const input = materializedScenarios[index % materializedScenarios.length];
    projectCompactionAwareContext(input, {
      max_inline_bytes: policy.max_inline_bytes,
      recent_active_units: policy.recent_active_units,
      preview_head_characters: policy.preview_head_characters,
      preview_tail_characters: policy.preview_tail_characters,
    });
  }, policy.timing_warm_iterations, policy.timing_iterations);
  const coldLatency = timing((index) => {
    const input = structuredClone(materializedScenarios[index % materializedScenarios.length]);
    projectCompactionAwareContext(input, {
      max_inline_bytes: policy.max_inline_bytes,
      recent_active_units: policy.recent_active_units,
      preview_head_characters: policy.preview_head_characters,
      preview_tail_characters: policy.preview_tail_characters,
    });
  }, 5, Math.min(100, policy.timing_iterations));
  const telemetry = tracker.snapshot();
  const compactionCompleted = telemetry.threads.reduce((sum, thread) => sum + thread.compaction_completed_count + thread.deprecated_compaction_count, 0);
  const tokenUpdates = telemetry.threads.reduce((sum, thread) => sum + thread.token_usage_update_count, 0);
  const recentControls = cases.map((entry) => entry.arms.find((arm) => arm.arm_id === "B-recent-only-control"));
  const checks = {
    treatment_cases: cases.every((entry) => entry.passed),
    exact_projection_reuse: cases.every((entry) => entry.exact_projection_reuse),
    corpus_sensitivity: recentControls.some((arm) => arm.pinned_survival_rate < 1 || arm.recoverability_rate < 1 || arm.tool_pair_integrity === false),
    native_observer: compactionCompleted >= projectionScenarios.length && tokenUpdates >= projectionScenarios.length,
    warm_projection_latency: latency.p95_ms <= policy.projection_p95_ms,
  };
  return resultEnvelope(profile, "compaction-simulated", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {
    checks,
    interpretation: "Deterministic structural benchmark. Native compaction notifications are replayed fixtures; no model or Codex summarizer quality is simulated.",
    treatment: "Pinned/masked projection over an immutable append-only reasoning epoch.",
    scenario_count: cases.length,
    warm_exact_projection_latency: latency,
    cold_projection_latency: coldLatency,
    context_window_telemetry: telemetry,
  }, cases, {
    mean_treatment_byte_reduction_ratio: cases.reduce((sum, entry) => sum + entry.byte_reduction_ratio, 0) / Math.max(1, cases.length),
    minimum_treatment_pinned_survival_rate: Math.min(...cases.map((entry) => entry.arms.find((arm) => arm.arm_id === "C-pinned-masked").pinned_survival_rate)),
    minimum_treatment_recoverability_rate: Math.min(...cases.map((entry) => entry.arms.find((arm) => arm.arm_id === "C-pinned-masked").recoverability_rate)),
    compaction_completed_observations: compactionCompleted,
    token_usage_observations: tokenUpdates,
    warm_exact_projection_p95_ms: latency.p95_ms,
    cold_projection_p95_ms: coldLatency.p95_ms,
    reused_projected_bytes: cases.reduce((sum, entry) => sum + entry.arms.find((arm) => arm.arm_id === "C-pinned-masked").projected_bytes, 0),
  });
}
