import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {verifyReasoningPlanContext} from "../../reasoning-state-runtime/index.mjs";

export const GATEWAY_THREAD_OBSERVATION_SCHEMA = "are.gateway-thread-observation/v1";
export const THREAD_OBSERVATION_PAGE_SIZE = 32;
const COMPLETION_STATUSES = new Set(["completed", "failed", "interrupted", "cancelled", "unknown"]);
const ONGOING_PHASES = new Set(["recovery-unverified", "turn-active", "dispatch-pending"]);
const PHASE_PRIORITY = {"recovery-unverified": 0, "turn-active": 1, "dispatch-pending": 2,
  "recovery-terminal": 3, "turn-completed": 4};
const DSH_WEB_OBSERVATION_KINDS = new Set(["dsh-turn-terminal-observed", "dsh-queue-edit-observed",
  "dsh-queue-remove-observed", "dsh-queue-steer-observed", "dsh-session-release-observed"]);

function threadReference(threadId) {
  return `backend-thread:${digestValue(threadId)}`;
}

export function validLearningFeedbackObservation(value) {
  if (value === null || value === undefined) return true; // Older/unsupported owner, not disabled.
  const counts = ['pending_feedback_count', 'retained_lesson_count', 'disabled_lesson_count',
    'dispatched_application_count', 'evaluated_application_count'];
  const keys = ['schema_version', 'source', 'binding_ref', 'status', 'mode', 'durability', 'state_digest',
    'checkpoint_digest', ...counts, 'authority_effect', 'observation_digest'];
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (!isRecord(value) || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))
    || value.schema_version !== 'are.learning-feedback-observation/v1' || value.source !== 'learning-owner'
    || value.authority_effect !== 'none' || !hash(value.binding_ref) || !hash(value.observation_digest)) return false;
  const {observation_digest, ...material} = value;
  if (digestValue(material) !== observation_digest) return false;
  if (['disabled', 'unavailable'].includes(value.status)) return value.mode === null && value.durability === null
    && value.state_digest === null && value.checkpoint_digest === null && counts.every(key => value[key] === null);
  if (!['off', 'observe', 'apply-scoped'].includes(value.mode)
    || !counts.every(key => Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 1_000_000)
    || value.disabled_lesson_count > value.retained_lesson_count
    || value.evaluated_application_count > value.dispatched_application_count) return false;
  if (value.status === 'no-records') return value.durability === null && value.state_digest === null
    && value.checkpoint_digest === null && counts.every(key => value[key] === 0);
  return value.status === 'observed' && ['process-memory', 'append-only-file-fsync'].includes(value.durability)
    && hash(value.state_digest) && hash(value.checkpoint_digest);
}

export function projectWrapperReasoningThreads(input = {}) {
  const threads = new Map();
  const identities = new Map();
  const plans = new Map();
  for (const event of input.plan_contexts ?? []) {
    if (event?.event_kind !== "plan-context-recorded" || !Number.isSafeInteger(event.sequence)
      || !verifyReasoningPlanContext(event.content).ok) continue;
    const threadRef = threadReference(event.content.thread_ref);
    const prior = plans.get(threadRef);
    if (!prior || prior.sequence < event.sequence) plans.set(threadRef, event);
  }
  for (const entry of input.frontiers ?? []) {
    const frontier = entry?.frontier;
    const state = frontier?.state;
    if (state?.schema_version !== "are.codex-completion-frontier-state/v1" || !nonEmptyString(state.thread_id)
      || !nonEmptyString(frontier.frontier_digest) || !nonEmptyString(entry?.checkpoint?.checkpoint_digest)) continue;
    const threadRef = threadReference(state.thread_id);
    identities.set(threadRef, state.thread_id);
    const prior = threads.get(threadRef);
    if (prior && prior.latest_frontier_event_sequence >= entry.event?.sequence) continue;
    threads.set(threadRef, {
      thread_ref: threadRef,
      phase: "turn-completed",
      reasoning_epoch_digest: entry.epoch?.epoch_digest ?? null,
      checkpoint_digest: entry.checkpoint.checkpoint_digest,
      latest_frontier_digest: frontier.frontier_digest,
      latest_frontier_event_sequence: entry.event?.sequence ?? null,
      last_completion_status: COMPLETION_STATUSES.has(state.completion?.status) ? state.completion.status : "unknown",
        recovery_turn_ref: null,
    });
  }
  for (const state of input.recovered_terminal ?? []) {
    if (!isRecord(state) || !nonEmptyString(state.thread_id) || !nonEmptyString(state.turn_id)
      || !nonEmptyString(state.reasoning_epoch_digest) || !nonEmptyString(state.reasoning_checkpoint_digest)
      || !["completed", "interrupted", "failed"].includes(state.recovery_terminal_status)) continue;
    const threadRef = threadReference(state.thread_id);
    identities.set(threadRef, state.thread_id);
    const prior = threads.get(threadRef);
    if (prior?.latest_frontier_event_sequence > state.recovery_terminal_event_sequence) continue;
    threads.set(threadRef, {
      thread_ref: threadRef, phase: "recovery-terminal",
      reasoning_epoch_digest: state.reasoning_epoch_digest,
      checkpoint_digest: state.reasoning_checkpoint_digest,
      latest_frontier_digest: prior?.latest_frontier_digest ?? null,
      latest_frontier_event_sequence: prior?.latest_frontier_event_sequence ?? null,
      last_completion_status: prior?.last_completion_status ?? null,
      recovery_turn_ref: digestValue(state.turn_id),
    });
  }
  for (const [states, phase] of [[input.pending ?? [], "dispatch-pending"], [input.active ?? [], "turn-active"]]) {
    for (const state of states) {
      if (!isRecord(state) || !nonEmptyString(state.thread_id) || !nonEmptyString(state.reasoning_epoch_digest)
        || !nonEmptyString(state.reasoning_checkpoint_digest)) continue;
      const threadRef = threadReference(state.thread_id);
      identities.set(threadRef, state.thread_id);
      const prior = threads.get(threadRef);
      threads.set(threadRef, {
        thread_ref: threadRef,
        phase: phase === "turn-active" && state.recovery_unverified === true ? "recovery-unverified" : phase,
        reasoning_epoch_digest: state.reasoning_epoch_digest,
        checkpoint_digest: state.reasoning_checkpoint_digest,
        latest_frontier_digest: prior?.latest_frontier_digest ?? null,
        latest_frontier_event_sequence: prior?.latest_frontier_event_sequence ?? null,
        last_completion_status: prior?.last_completion_status ?? null,
        recovery_turn_ref: phase === "turn-active" && state.recovery_unverified === true
          && nonEmptyString(state.turn_id) ? digestValue(state.turn_id) : null,
      });
    }
  }
  return freezeResult([...threads.values()].map((thread) => {
    const feedback = typeof input.learning_observer === 'function'
      ? input.learning_observer(identities.get(thread.thread_ref)) : null;
    if (!validLearningFeedbackObservation(feedback)) throw new TypeError('learning.feedback-observation-invalid');
    const plan = plans.get(thread.thread_ref);
    const activeSliceIndex = plan?.content.feature_obligations.findIndex((item) => item.obligation_id === plan.content.active_slice_id) ?? -1;
    return {
      ...thread,
      learning_feedback: feedback,
      plan_context_digest: plan?.content.plan_context_digest ?? null,
      plan_context_event_sequence: plan?.sequence ?? null,
      plan_obligation_count: plan?.content.feature_obligations.length ?? null,
      plan_completed_count: plan?.content.feature_obligations.filter((item) => item.status === "completed").length ?? null,
      plan_open_decision_count: plan?.content.unresolved_decisions.length ?? null,
      plan_active_slice_ordinal: activeSliceIndex < 0 ? null : activeSliceIndex + 1,
      plan_active_slice_status: activeSliceIndex < 0 ? null : plan.content.feature_obligations[activeSliceIndex].status,
    };
  }).sort((left, right) => left.thread_ref.localeCompare(right.thread_ref)));
}

export function projectGatewayThreadObservation(input = {}) {
  if (!nonEmptyString(input.runtime_epoch_id) || !Number.isSafeInteger(input.observed_at_unix_ms)) {
    throw new TypeError("Gateway thread observation needs a runtime epoch and observation time.");
  }
  if (!Array.isArray(input.sessions)) throw new TypeError("Gateway thread observation needs session facts.");
  const unknownDispatchCount = input.unknown_dispatch_count ?? null;
  const unknownHostedEffectDispatchCount = input.unknown_hosted_effect_dispatch_count ?? null;
  const unknownThreadCreationCount = input.unknown_thread_creation_count ?? null;
  const acceptedUnresolvedTurnCount = input.accepted_unresolved_turn_count ?? null;
  const recoveredDispatchCount = input.recovered_dispatch_count ?? null;
  if (unknownDispatchCount !== null && (!Number.isSafeInteger(unknownDispatchCount)
    || unknownDispatchCount < 0 || unknownDispatchCount > 1_000_000)
    || unknownHostedEffectDispatchCount !== null && (!Number.isSafeInteger(unknownHostedEffectDispatchCount)
      || unknownHostedEffectDispatchCount < 0 || unknownHostedEffectDispatchCount > 1_000_000
      || unknownDispatchCount === null || unknownHostedEffectDispatchCount > unknownDispatchCount)
    || unknownThreadCreationCount !== null && (!Number.isSafeInteger(unknownThreadCreationCount)
      || unknownThreadCreationCount < 0 || unknownThreadCreationCount > 1_000_000
      || unknownDispatchCount !== null && unknownThreadCreationCount > unknownDispatchCount)
    || recoveredDispatchCount !== null && (!Number.isSafeInteger(recoveredDispatchCount)
      || recoveredDispatchCount < 0 || recoveredDispatchCount > 1_000_000)
    || acceptedUnresolvedTurnCount !== null && (!Number.isSafeInteger(acceptedUnresolvedTurnCount)
      || acceptedUnresolvedTurnCount < 0 || acceptedUnresolvedTurnCount > 1_000_000
      || unknownDispatchCount === null || acceptedUnresolvedTurnCount > unknownDispatchCount)) {
    throw new TypeError("Gateway thread observation received invalid dispatch recovery facts.");
  }
  const all = [];
  let degradedSteerThreadCount = 0;
  let degradedSteerCoverageComplete = true;
  for (const session of input.sessions) {
    if (!nonEmptyString(session?.consumer_id) || !Array.isArray(session.threads)) throw new TypeError("Gateway thread observation received invalid session facts.");
    const degradedCount = session.degraded_steer_thread_count;
    if (degradedCount === undefined || degradedCount === null) degradedSteerCoverageComplete = false;
    else if (!Number.isSafeInteger(degradedCount) || degradedCount < 0 || degradedCount > 256) {
      throw new TypeError("Gateway thread observation received invalid continuity facts.");
    } else degradedSteerThreadCount += degradedCount;
    const hostObservations = session.host_observations ?? [];
    if (!Array.isArray(hostObservations) || hostObservations.length > 256 || hostObservations.some((observation) =>
      !["turn-start-accepted", "turn-history-verified", "turn-marker-observed", "turn-completion-observed",
        "steer-accepted", "compaction-turn-accepted", "compaction-item-completed", "compaction-history-verified"].includes(observation?.kind)
      && !DSH_WEB_OBSERVATION_KINDS.has(observation?.kind)
      || !/^backend-thread:[0-9a-f]{64}$/.test(observation?.thread_ref ?? "")
      || !/^[0-9a-f]{64}$/.test(observation?.observation_digest ?? ""))) {
      throw new TypeError("Gateway thread observation received invalid host facts.");
    }
    const relayChecks = session.mcp_hook_relay_checks ?? [];
    if (!Array.isArray(relayChecks) || relayChecks.length > 256 || relayChecks.some((check) =>
      !/^backend-thread:[0-9a-f]{64}$/.test(check?.thread_ref ?? "")
      || !["listed", "not-ready"].includes(check?.status)
      || !Number.isSafeInteger(check.checked_at_unix_ms) || check.checked_at_unix_ms < 0
      || check.checked_at_unix_ms > input.observed_at_unix_ms + 1000)
      || new Set(relayChecks.map((check) => check.thread_ref)).size !== relayChecks.length) {
      throw new TypeError("Gateway thread observation received invalid MCP relay check facts.");
    }
    const relayByThread = new Map(relayChecks.map((check) => [check.thread_ref, check]));
    const consumerRef = `gateway-consumer:${digestValue(session.consumer_id)}`;
    for (const thread of session.threads) {
      if (!validLearningFeedbackObservation(thread?.learning_feedback)) throw new TypeError('learning.feedback-observation-invalid');
      const planDigest = thread?.plan_context_digest ?? null;
      const planSequence = thread?.plan_context_event_sequence ?? null;
      const obligationCount = thread?.plan_obligation_count ?? null;
      const completedCount = thread?.plan_completed_count ?? null;
      const openDecisionCount = thread?.plan_open_decision_count ?? null;
      const activeSliceOrdinal = thread?.plan_active_slice_ordinal ?? null;
      const activeSliceStatus = thread?.plan_active_slice_status ?? null;
      const recoveredThreadCount = thread?.recovered_dispatch_count ?? null;
      const unknownThreadHostedEffectCount = thread?.unknown_hosted_effect_dispatch_count ?? null;
      if (!/^backend-thread:[0-9a-f]{64}$/.test(thread?.thread_ref ?? "")
        || !["dispatch-pending", "turn-active", "turn-completed", "recovery-unverified", "recovery-terminal"].includes(thread.phase)
        || !nonEmptyString(thread.reasoning_epoch_digest) || !nonEmptyString(thread.checkpoint_digest)
        || (thread.recovery_turn_ref !== null && thread.recovery_turn_ref !== undefined
          && !/^[0-9a-f]{64}$/.test(thread.recovery_turn_ref))
        || (thread.last_completion_status !== null && !COMPLETION_STATUSES.has(thread.last_completion_status))
        || (planDigest !== null && !/^[0-9a-f]{64}$/.test(planDigest))
        || (planDigest === null && [planSequence, obligationCount, completedCount, openDecisionCount, activeSliceOrdinal, activeSliceStatus].some((value) => value !== null))
        || (planDigest !== null && (!Number.isSafeInteger(planSequence) || planSequence < 1
          || !Number.isSafeInteger(obligationCount) || obligationCount < 1 || obligationCount > 32
          || !Number.isSafeInteger(completedCount) || completedCount < 0 || completedCount > obligationCount
          || !Number.isSafeInteger(openDecisionCount) || openDecisionCount < 0 || openDecisionCount > 32))
        || ((activeSliceOrdinal === null) !== (activeSliceStatus === null))
        || (activeSliceOrdinal !== null && (!Number.isSafeInteger(activeSliceOrdinal)
          || activeSliceOrdinal < 1 || activeSliceOrdinal > obligationCount
          || !["open", "active", "deferred"].includes(activeSliceStatus)))
        || recoveredThreadCount !== null && (!Number.isSafeInteger(recoveredThreadCount)
          || recoveredThreadCount < 0 || recoveredThreadCount > 1_000_000)
        || unknownThreadHostedEffectCount !== null && (!Number.isSafeInteger(unknownThreadHostedEffectCount)
          || unknownThreadHostedEffectCount < 0 || unknownThreadHostedEffectCount > 1_000_000)) {
        throw new TypeError("Gateway thread observation received invalid reasoning facts.");
      }
      // DSH Web observations are valid durable facts, but this projection's
      // turn counters describe Codex App Server receipts only.
      const matchedHostObservations = hostObservations.filter((observation) =>
        observation.thread_ref === thread.thread_ref && !DSH_WEB_OBSERVATION_KINDS.has(observation.kind));
      const recoveredTurnHistory = ["recovery-unverified", "recovery-terminal"].includes(thread.phase) && thread.recovery_turn_ref
        ? matchedHostObservations.filter((observation) => ["turn-history-verified", "turn-marker-observed"].includes(observation.kind)
          && observation.turn_ref === thread.recovery_turn_ref
          && ["inProgress", "completed", "failed", "interrupted"].includes(observation.turn_status)).at(-1)
        : null;
      const relayCheck = relayByThread.get(thread.thread_ref) ?? null;
      all.push({thread_ref: thread.thread_ref, phase: thread.phase,
        learning_feedback: thread.learning_feedback ?? null,
        reasoning_epoch_digest: thread.reasoning_epoch_digest, checkpoint_digest: thread.checkpoint_digest,
        latest_frontier_digest: thread.latest_frontier_digest ?? null,
        latest_frontier_event_sequence: thread.latest_frontier_event_sequence ?? null,
        last_completion_status: thread.last_completion_status,
        plan_context_digest: planDigest, plan_context_event_sequence: planSequence,
        plan_obligation_count: obligationCount, plan_completed_count: completedCount,
        plan_open_decision_count: openDecisionCount,
        plan_active_slice_ordinal: activeSliceOrdinal, plan_active_slice_status: activeSliceStatus,
        accepted_turn_start_count: matchedHostObservations.filter((observation) => observation.kind === "turn-start-accepted").length,
        verified_host_turn_count: matchedHostObservations.filter((observation) => observation.kind === "turn-history-verified").length,
        marked_host_turn_count: matchedHostObservations.filter((observation) => observation.kind === "turn-marker-observed").length,
        recovered_dispatch_count: recoveredThreadCount,
        unknown_hosted_effect_dispatch_count: unknownThreadHostedEffectCount,
        accepted_steer_count: matchedHostObservations.filter((observation) => observation.kind === "steer-accepted").length,
        accepted_compaction_turn_count: matchedHostObservations.filter((observation) => observation.kind === "compaction-turn-accepted").length,
        completed_compaction_item_count: matchedHostObservations.filter((observation) => observation.kind === "compaction-item-completed").length,
        recovered_compaction_count: matchedHostObservations.filter((observation) => observation.kind === "compaction-history-verified").length,
        latest_host_observation_digest: matchedHostObservations.at(-1)?.observation_digest ?? null,
        recovery_host_status: recoveredTurnHistory?.turn_status ?? null,
        recovery_host_observation_digest: recoveredTurnHistory?.observation_digest ?? null,
        mcp_hook_relay_check: relayCheck ? {status: relayCheck.status,
          checked_at_unix_ms: relayCheck.checked_at_unix_ms} : null,
        consumer_ref: consumerRef});
    }
  }
  all.sort((left, right) => PHASE_PRIORITY[left.phase] - PHASE_PRIORITY[right.phase]
    || left.consumer_ref.localeCompare(right.consumer_ref) || left.thread_ref.localeCompare(right.thread_ref));
  const pageOffset = input.page_offset ?? 0;
  if (!Number.isSafeInteger(pageOffset) || pageOffset < 0 || pageOffset % THREAD_OBSERVATION_PAGE_SIZE !== 0
    || (all.length === 0 ? pageOffset !== 0 : pageOffset >= all.length)) {
    throw new TypeError("thread.observation-invalid-page");
  }
  const snapshotDigest = digestValue({runtime_epoch_id: input.runtime_epoch_id, session_count: input.sessions.length,
    unknown_dispatch_count: unknownDispatchCount,
    unknown_hosted_effect_dispatch_count: unknownHostedEffectDispatchCount,
    unknown_thread_creation_count: unknownThreadCreationCount,
    accepted_unresolved_turn_count: acceptedUnresolvedTurnCount, recovered_dispatch_count: recoveredDispatchCount,
    degraded_steer_thread_count: degradedSteerCoverageComplete ? degradedSteerThreadCount : null, threads: all});
  if (input.expected_snapshot_digest !== undefined && input.expected_snapshot_digest !== snapshotDigest) {
    throw new TypeError("thread.observation-source-changed");
  }
  const visible = all.slice(pageOffset, pageOffset + THREAD_OBSERVATION_PAGE_SIZE);
  const ongoingThreadCount = all.filter((thread) => ONGOING_PHASES.has(thread.phase)).length;
  const visibleOngoingCount = visible.filter((thread) => ONGOING_PHASES.has(thread.phase)).length;
  if (recoveredDispatchCount !== null && all.reduce((count, thread) =>
    count + (thread.recovered_dispatch_count ?? 0), 0) > recoveredDispatchCount) {
    throw new TypeError("Gateway thread observation received inconsistent dispatch recovery facts.");
  }
  if (unknownHostedEffectDispatchCount === null
    ? all.some(thread => thread.unknown_hosted_effect_dispatch_count !== null)
    : all.reduce((count, thread) => count
      + (thread.unknown_hosted_effect_dispatch_count ?? 0), 0) > unknownHostedEffectDispatchCount) {
    throw new TypeError("Gateway thread observation received inconsistent hosted-effect dispatch facts.");
  }
  return freezeResult({
    schema_version: GATEWAY_THREAD_OBSERVATION_SCHEMA,
    source: "gateway-in-process",
    scope: "gateway-backend-threads-not-host-activation",
    runtime_epoch_id: input.runtime_epoch_id,
    observed_at_unix_ms: input.observed_at_unix_ms,
    session_count: input.sessions.length,
    thread_count: all.length,
    page_offset: pageOffset,
    next_offset: pageOffset + visible.length < all.length ? pageOffset + THREAD_OBSERVATION_PAGE_SIZE : null,
    snapshot_digest: snapshotDigest,
    ongoing_thread_count: ongoingThreadCount,
    omitted_ongoing_thread_count: ongoingThreadCount - visibleOngoingCount,
    degraded_steer_thread_count: degradedSteerCoverageComplete ? degradedSteerThreadCount : null,
    unknown_dispatch_count: unknownDispatchCount,
    unknown_hosted_effect_dispatch_count: unknownHostedEffectDispatchCount,
    unknown_thread_creation_count: unknownThreadCreationCount,
    accepted_unresolved_turn_count: acceptedUnresolvedTurnCount,
    recovered_dispatch_count: recoveredDispatchCount,
    truncated: all.length > THREAD_OBSERVATION_PAGE_SIZE,
    threads: visible,
    authority_effect: "none",
  });
}
