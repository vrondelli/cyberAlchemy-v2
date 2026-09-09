import {createHash} from "node:crypto";

import {
  appendReasoningCounterevidence,
  createReasoningStateBranch,
  deriveReasoningReplayFixture,
  exportPortableReasoningEpoch,
  selectReusableCounterevidence,
  verifyReasoningReplayFixture,
} from "../reasoning-state-runtime/index.mjs";
import {materializeContextReductionPlan} from "../reasoning-policy-runtime/index.mjs";
import {appendReasoningStateReduction} from "../reasoning-state-runtime/index.mjs";
import {createInMemoryRuntimeJournal} from "../runtime-journal/index.mjs";

function sha256(value) { return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function fail(stage, reason_codes) { return freeze({schema_version: "are.coding-agent-advanced-reasoning/v1", ok: false, stage, reason_codes: [...new Set(reason_codes)].sort(), authority_effect: "none"}); }

function policy(maximumEventCount, mandatoryKinds) {
  return freeze({
    schema_version: "are.reasoning-policy-profile/v1",
    profile_id: "are:coding-agent:advanced-reasoning",
    maximum_event_count: maximumEventCount,
    mandatory_event_kinds: mandatoryKinds,
    interaction_bound_action: "create-successor",
    selected_dependency_drift_action: "create-successor",
    exploration_action: "create-branch",
    overflow_action: "reduce-successor",
    stable_plan_action: "reuse-current",
    reduction: {method: "deterministic-event-selection-no-summary", mandatory_overflow: "block", retain_latest_nonmandatory: true},
    claim_ceiling: "Reasoning-state organization only; no correctness or effect authority.",
    authority_effect: "none",
  });
}

export function createAdvancedReasoningController({session, maximum_event_count = 32, mandatory_event_kinds = ["IntegratedContextPrepared", "IntentCorrected", "PatchCandidate"], journal_profile = {}} = {}) {
  if (!session?.ledger || typeof session.latestEpoch !== "function") throw new TypeError("A persistent coding session is required.");
  if (!Number.isSafeInteger(maximum_event_count) || maximum_event_count < 4) throw new TypeError("maximum_event_count is invalid.");
  const ledger = session.ledger;
  const reasoningPolicy = policy(maximum_event_count, mandatory_event_kinds);
  const journal = createInMemoryRuntimeJournal({journal_id: `coding-agent-journal:${session.ledger_id}`, ...journal_profile});

  return Object.freeze({
    policy: reasoningPolicy,
    journal,
    createAlternative({branch_ref, content, base_epoch = session.latestEpoch()} = {}) {
      if (!base_epoch) return fail("branch", ["reasoning.base-epoch-required"]);
      const appended = ledger.append({event_kind: "alternative-solution-proposed", idempotency_key: `alternative:${sha256({branch_ref, content})}`, content: {branch_ref, content, authority_effect: "none"}, provenance_refs: [base_epoch.epoch_digest]});
      if (!appended.ok) return appended;
      const branched = createReasoningStateBranch(ledger, {base_epoch, branch_ref, additional_event_digests: [appended.event.event_digest], branch_basis: {kind: "alternative-solution"}, consumer_ref: "are:coding-agent", request_ref: base_epoch.request_ref});
      if (!branched.ok) return branched;
      const checkpoint = session.checkpointEpoch(branched.epoch, "manual", branched.branch.branch_digest);
      return checkpoint.ok ? freeze({ok: true, branch: branched.branch, epoch: branched.epoch, checkpoint: checkpoint.value, authority_effect: "none"}) : checkpoint;
    },
    replayFixture(epoch = session.latestEpoch(), fixture_ref = null) {
      if (!epoch) return fail("replay", ["reasoning.epoch-required"]);
      const fixture = deriveReasoningReplayFixture(ledger, epoch, {fixture_ref: fixture_ref ?? `coding-agent:${epoch.epoch_digest}`});
      if (!fixture.ok) return fixture;
      const verified = verifyReasoningReplayFixture(fixture.value);
      return verified.ok ? freeze({ok: true, fixture: fixture.value, verification: verified, authority_effect: "none"}) : verified;
    },
    reduceIfNeeded(epoch = session.latestEpoch()) {
      if (!epoch) return fail("reduction", ["reasoning.epoch-required"]);
      if (epoch.event_digests.length <= maximum_event_count) return freeze({ok: true, disposition: "within-budget", epoch, authority_effect: "none"});
      const plan = materializeContextReductionPlan({profile: reasoningPolicy, source_epoch: epoch, events: ledger.snapshot()});
      if (!plan.ok) return plan;
      const reduced = appendReasoningStateReduction(ledger, {source_epoch: epoch, retained_event_digests: plan.value.retained_event_digests, reduction_basis: {plan_digest: plan.value.plan_digest}, consumer_ref: "are:coding-agent", request_ref: epoch.request_ref});
      if (!reduced.ok) return reduced;
      const checkpoint = session.checkpointEpoch(reduced.epoch, "manual", reduced.reduction.reduction_digest);
      return checkpoint.ok ? freeze({ok: true, disposition: "reduced", plan: plan.value, reduction: reduced.reduction, epoch: reduced.epoch, checkpoint: checkpoint.value, authority_effect: "none"}) : checkpoint;
    },
    recordCounterevidence({claim_ref, evidence_ref, source_identity, source_digest, content = {}, temporal_scope = {}} = {}) {
      const recorded = appendReasoningCounterevidence(ledger, {claim_ref, evidence_ref, source_identity, source_digest, content, temporal_scope});
      if (!recorded.ok) return recorded;
      const epoch = ledger.seal({event_digests: ledger.snapshot().map((event) => event.event_digest), consumer_ref: "are:coding-agent", request_ref: session.latestEpoch()?.request_ref ?? null, frontier: {kind: "counterevidence", counterevidence_digest: recorded.counterevidence.counterevidence_digest}});
      if (!epoch.ok) return epoch;
      const checkpoint = session.checkpointEpoch(epoch.value, "manual", recorded.counterevidence.counterevidence_digest);
      return checkpoint.ok ? freeze({ok: true, counterevidence: recorded.counterevidence, epoch: epoch.value, checkpoint: checkpoint.value, authority_effect: "none"}) : checkpoint;
    },
    selectCounterevidence({claim_ref, current_sources = []} = {}) { return selectReusableCounterevidence(ledger, {claim_ref, current_sources}); },
    exportPortable(epoch = session.latestEpoch(), compatibility_profile = {protocol: "are.coding-agent-reasoning/v1"}) {
      if (!epoch) return fail("portable-export", ["reasoning.epoch-required"]);
      return exportPortableReasoningEpoch(ledger, epoch, {compatibility_profile});
    },
    appendJournal(event) { return journal.append(event); },
    cutJournal(selector = {}) { return journal.cut(selector); },
    replayJournal(cut) { return journal.replay(cut); },
    evictJournal(policy_ = {}) { return journal.evict(policy_); },
  });
}
