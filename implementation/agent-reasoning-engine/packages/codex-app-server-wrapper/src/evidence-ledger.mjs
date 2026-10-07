import {
  createInMemoryRuntimeJournal,
  replayRuntimeJournal,
} from "../../runtime-journal/index.mjs";
import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

function projectEvent(event) {
  return freezeResult({
    ...event.content,
    sequence: event.sequence,
    event_digest: event.event_digest,
    journal_content_digest: event.content_digest,
    predecessor_digest: event.predecessor_digest,
  });
}

export function createEvidenceLedger(options = {}) {
  const journal = options.journal ?? createInMemoryRuntimeJournal(options.profile ?? {journal_id: "are-codex-runtime:local"});

  function record(event) {
    if (!isRecord(event) || !nonEmptyString(event.event_kind)) return fail("evidence-ledger", ["evidence.event-kind-required"]);
    const material = {
      schema_version: "are.codex-integration-event/v4",
      event_kind: event.event_kind,
      direction: event.direction ?? null,
      method: event.method ?? null,
      rpc_id: event.rpc_id ?? null,
      thread_id: event.thread_id ?? null,
      turn_id: event.turn_id ?? null,
      item_id: event.item_id ?? null,
      message_digest: event.message_digest ?? null,
      decision_digest: event.decision_digest ?? null,
      effect_digest: event.effect_digest ?? null,
      binding_digest: event.binding_digest ?? null,
      refresh_digest: event.refresh_digest ?? null,
      context_epoch_id: event.context_epoch_id ?? null,
      context_envelope_digest: event.context_envelope_digest ?? null,
      inline_bytes: event.inline_bytes ?? null,
      freshness_state: event.freshness_state ?? null,
      content_projection_digest: event.content_projection_digest ?? null,
      projection_reuse_disposition: event.projection_reuse_disposition ?? null,
      projection_reuse_receipt_digest: event.projection_reuse_receipt_digest ?? null,
      selected_change_count: event.selected_change_count ?? null,
      unrelated_drift_count: event.unrelated_drift_count ?? null,
      semantic_disposition: event.semantic_disposition ?? null,
      semantic_materialization_id: event.semantic_materialization_id ?? null,
      semantic_outcome: event.semantic_outcome ?? null,
      reasoning_receipt_digest: event.reasoning_receipt_digest ?? null,
      evaluator_calls: event.evaluator_calls ?? null,
      signal_disposition: event.signal_disposition ?? null,
      signal_count: event.signal_count ?? null,
      signal_refs: event.signal_refs ?? [],
      provider_calls: event.provider_calls ?? null,
      sink_calls: event.sink_calls ?? null,
      constraint_digest: event.constraint_digest ?? null,
      constraint_disposition: event.constraint_disposition ?? null,
      constrained_proposal_count: event.constrained_proposal_count ?? null,
      journal_cut_digest: event.journal_cut_digest ?? null,
      replay_digest: event.replay_digest ?? null,
      successor_proposal_id: event.successor_proposal_id ?? null,
      reasoning_epoch_id: event.reasoning_epoch_id ?? null,
      reasoning_epoch_digest: event.reasoning_epoch_digest ?? null,
      plan_context_digest: event.plan_context_digest ?? null,
      checkpoint_kind: event.checkpoint_kind ?? null,
      checkpoint_digest: event.checkpoint_digest ?? null,
      dispatch_digest: event.dispatch_digest ?? null,
      dispatch_verification_digest: event.dispatch_verification_digest ?? null,
      request_header_digest: event.request_header_digest ?? null,
      cache_affinity_projection_digest: event.cache_affinity_projection_digest ?? null,
      cache_affinity_assessment_digest: event.cache_affinity_assessment_digest ?? null,
      context_bound_reuse_receipt_digest: event.context_bound_reuse_receipt_digest ?? null,
      cache_telemetry_observation_digest: event.cache_telemetry_observation_digest ?? null,
      cache_affinity_posture: event.cache_affinity_posture ?? null,
      exact_prefix_reuse: event.exact_prefix_reuse ?? null,
      reusable_prefix_bytes: event.reusable_prefix_bytes ?? null,
      reused_prefix_bytes: event.reused_prefix_bytes ?? null,
      cache_hit_posture: event.cache_hit_posture ?? null,
      estimated_reused_tokens: event.estimated_reused_tokens ?? null,
      observed_time_savings_ms: event.observed_time_savings_ms ?? null,
      observed_token_savings: event.observed_token_savings ?? null,
      observed_input_tokens: event.observed_input_tokens ?? null,
      observed_cached_input_tokens: event.observed_cached_input_tokens ?? null,
      cache_invalidation_reasons: event.cache_invalidation_reasons ?? [],
      ...(event.event_kind === "objective-transition-resolved" ? {
        objective_resolution_digest: event.objective_resolution_digest ?? null,
        objective_state_digest: event.objective_state_digest ?? null,
        objective_transition: event.objective_transition ?? null,
      } : {}),
      ...(event.event_kind === "cache-affinity-recovery-miss" ? {reason_code: event.reason_code ?? null} : {}),
      authority_effect: "none",
    };
    const appended = journal.append({...material, idempotency_key: event.idempotency_key, observed_at: event.observed_at ?? null});
    if (!appended.ok) return appended;
    return projectEvent(appended.event);
  }

  function snapshot() {
    return freezeResult(journal.snapshot().map(projectEvent));
  }

  function receipt(identity) {
    const relevant = snapshot().filter((event) => (!identity.thread_id || event.thread_id === identity.thread_id) && (!identity.turn_id || event.turn_id === identity.turn_id));
    const first = (kind) => relevant.find((event) => event.event_kind === kind)?.sequence ?? null;
    const firstSemantic = relevant.find((event) => event.event_kind.startsWith("semantic-evaluation-"))?.sequence ?? null;
    const firstConstraints = first("reasoning-receipt-constraints-derived");
    const allEffectsOrdered = relevant.filter((event) => event.event_kind === "approval-response-forwarded").every((response) => {
      const decision = relevant.find((event) => event.event_kind === "effect-decision" && event.rpc_id === response.rpc_id);
      return decision && decision.sequence < response.sequence;
    });
    const material = {
      schema_version: "are.codex-integration-receipt/v2",
      thread_id: identity.thread_id ?? null,
      turn_id: identity.turn_id ?? null,
      request_or_completion_digest: identity.request_or_completion_digest ?? null,
      decision_profile_digest: identity.decision_profile_digest ?? null,
      decision_digest: identity.decision_digest ?? null,
      event_digests: relevant.map((event) => event.event_digest),
      ordering: {
        decision_completed_before_turn_start: first("preflight-decision") !== null && first("turn-start-forwarded") !== null && first("preflight-decision") < first("turn-start-forwarded"),
        effect_decision_before_approval_response: allEffectsOrdered,
        continuation_decision_after_turn_completed: first("continuation-decision") === null || (first("turn-completed-observed") !== null && first("turn-completed-observed") < first("continuation-decision")),
        semantic_evaluation_after_turn_completed: firstSemantic === null || (first("turn-completed-observed") !== null && first("turn-completed-observed") < firstSemantic),
        semantic_evaluation_before_continuation: firstSemantic === null || first("continuation-decision") === null || firstSemantic < first("continuation-decision"),
        reasoning_receipt_constraints_after_semantic_evaluation: firstConstraints === null || firstSemantic === null || firstSemantic < firstConstraints,
        reasoning_receipt_constraints_before_continuation: firstConstraints === null || first("continuation-decision") === null || firstConstraints < first("continuation-decision"),
        turn_closed_after_continuation: first("turn-closed") === null || first("continuation-decision") === null || first("continuation-decision") < first("turn-closed"),
        model_checkpoint_before_turn_start: first("turn-start-forwarded") === null || (first("reasoning-dispatch-verified") !== null && first("reasoning-dispatch-verified") < first("turn-start-forwarded")),
        continuation_checkpoint_before_successor: first("successor-started") === null || (relevant.some((event) => event.event_kind === "reasoning-state-checkpoint" && event.checkpoint_kind === "before-continuation" && event.sequence < first("successor-started"))),
      },
      authority_effect: "none",
    };
    return freezeResult({...material, receipt_digest: digestValue(material)});
  }

  return Object.freeze({
    record,
    snapshot,
    cut: (selector = {}) => journal.cut(selector),
    replay: (cutValue) => replayRuntimeJournal(cutValue),
    receipt,
    evict: (policy) => journal.evict(policy),
    inspect: () => journal.inspect(),
    journal,
  });
}
