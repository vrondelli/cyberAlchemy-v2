import {digest} from "./engine.mjs";

function identity(message) {
  return {
    thread_id: message?.params?.threadId ?? null,
    turn_id: message?.params?.turnId ?? message?.params?.turn?.id ?? null,
    item_id: message?.params?.itemId ?? message?.params?.item?.id ?? null,
  };
}

export class TurnEvidenceLedger {
  constructor() {
    this.turns = new Map();
  }

  begin({threadId, turnId, requestId, requestContextDigest, preflightDecisionDigest, decisionProfileDigest, declared, event}) {
    this.turns.set(turnId, {
      threadId,
      turnId,
      requestId,
      requestContextDigest,
      preflightDecisionDigest,
      decisionProfileDigest,
      declared: structuredClone(declared ?? {}),
      observedPlan: [],
      observedInteractions: [],
      events: event ? [event] : [],
    });
  }

  observe(message, event) {
    const ids = identity(message);
    const turn = this.turns.get(ids.turn_id);
    if (turn && event) {
      turn.events.push(event);
      const item = message?.params?.item ?? {};
      if (message?.method === "item/completed" && item.type === "plan" && Array.isArray(item.proposals)) turn.observedPlan.push(...structuredClone(item.proposals));
      if (message?.method === "item/completed" && item.type === "agentMessage" && Array.isArray(item.continuationProposals)) turn.observedInteractions.push(...structuredClone(item.continuationProposals));
    }
  }

  append(turnId, event) {
    const turn = this.turns.get(turnId);
    if (turn && event) turn.events.push(event);
  }

  finalize(message, completionEvent) {
    const ids = identity(message);
    const turn = this.turns.get(ids.turn_id);
    if (!turn) return {valid: false, reason_codes: ["evidence.turn-ledger-missing"], declared: {}, evidence_refs: [], manifest: null};
    if (completionEvent) turn.events.push(completionEvent);
    const reasons = [];
    if (!ids.thread_id || ids.thread_id !== turn.threadId) reasons.push("evidence.thread-identity-mismatch");
    if (!ids.turn_id || ids.turn_id !== turn.turnId) reasons.push("evidence.turn-identity-mismatch");
    const sequences = turn.events.map((event) => event.sequence);
    if (sequences.some((value, index) => index > 0 && value <= sequences[index - 1])) reasons.push("evidence.ordering-contradiction");
    const kinds = turn.events.map((event) => event.kind);
    if (kinds.filter((kind) => kind === "turn.started").length !== 1) reasons.push("evidence.turn-start-cardinality");
    if (kinds.filter((kind) => kind === "turn.completed").length !== 1) reasons.push("evidence.turn-complete-cardinality");
    for (const event of turn.events) {
      if (event.thread_id && event.thread_id !== turn.threadId) reasons.push("evidence.cross-thread-event");
      if (event.turn_id && event.turn_id !== turn.turnId) reasons.push("evidence.cross-turn-event");
      if (["item/started", "item/completed"].includes(event.kind) && !event.item_id) reasons.push("evidence.item-identity-missing");
    }
    const effectDecision = turn.events.findIndex((event) => event.kind === "effect.decision");
    const effectBinding = turn.events.findIndex((event) => event.kind === "effect.approval-bound");
    if (effectBinding >= 0 && (effectDecision < 0 || effectDecision > effectBinding)) reasons.push("evidence.effect-ordering-contradiction");
    const manifestMaterial = {
      schema_version: "are.codex-turn-evidence-manifest/v1",
      thread_id: turn.threadId,
      turn_id: turn.turnId,
      request_id: turn.requestId,
      request_context_digest: turn.requestContextDigest,
      decision_profile_digest: turn.decisionProfileDigest,
      preflight_decision_digest: turn.preflightDecisionDigest,
      event_digests: turn.events.map((event) => event.event_digest),
      reason_codes: [...new Set(reasons)].sort(),
      authority_effect: "none",
    };
    const manifest = {...manifestMaterial, manifest_digest: digest(manifestMaterial)};
    const reconciled = {
      ...turn.declared,
      plan_bound: Array.isArray(turn.declared.plan_bound) ? turn.declared.plan_bound : [],
      interaction_bound: [...(Array.isArray(turn.declared.interaction_bound) ? turn.declared.interaction_bound : []), ...turn.observedInteractions],
    };
    if (turn.observedPlan.length > 0) {
      reconciled.plan_bound = turn.observedPlan;
      reconciled.plan_manifest = {
        schema_version: "are.codex-host-plan-manifest/v1",
        source_kind: "mechanism-observed-plan",
        source_ref: `codex:turn/${turn.turnId}/item-completed`,
        turn_request_digest: turn.requestContextDigest,
        plan_digest: digest(turn.observedPlan),
      };
    }
    this.turns.delete(turn.turnId);
    return {
      valid: reasons.length === 0,
      reason_codes: manifest.reason_codes,
      declared: reconciled,
      request_context_digest: turn.requestContextDigest,
      evidence_refs: manifest.event_digests.map((value) => `codex-event:${value}`),
      manifest,
    };
  }
}
