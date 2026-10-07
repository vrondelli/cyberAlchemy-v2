import assert from "node:assert/strict";
import {resolve} from "node:path";
import test from "node:test";

import {
  CONTEXT_KEY,
  createCodexAppServerWrapper,
  evaluateDualLaneContinuation,
  loadRepositoryProfile,
  materializeObjectiveFrontier,
  normalizeContinuationProposals,
  projectObjectiveFrontierForTurnStart,
} from "../index.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));

function completion(continuationRequired = true, status = "completed") {
  return {completion_id: "frontier-test", status, continuation_required: continuationRequired, evidence_refs: ["fixture:completion"]};
}

function frontier(state) {
  return {state, evidence_refs: [`fixture:frontier:${state}`]};
}

function safePlan(proposalId = "P1") {
  return {
    proposal_id: proposalId,
    declared_plan_digest: "plan:frontier-test",
    action_ref: "validate",
    route_id: "CA2-ROUTE-VALIDATE",
    objective_kind: "validate",
    effect_classes: ["non-effectful-validate"],
    reversible: true,
    evidence_refs: ["fixture:plan"],
    next_turn: {params: {threadId: "frontier-thread", input: [{type: "text", text: "Validate the result."}]}},
  };
}

function objectivePlan(proposalId, relation, overrides = {}) {
  const {
    blocker_refs = [],
    dependency_state = "ready",
    objective_ref = relation === "advances-active-objective"
      ? "objective:compare-six-pareto-matches"
      : "objective:documentation-product-direction",
    rank = 0,
    ...proposalOverrides
  } = overrides;
  const proposal = {...safePlan(proposalId), ...proposalOverrides};
  const marker = relation === "advances-active-objective"
    ? {
        causal_marker: {
          schema_version: "are.causal-marker/v1",
          marker_id: `causal:${proposalId}`,
          objective_ref,
          unresolved_obligation_ref: "obligation:human-preference-evidence-missing",
          required_action_ref: proposal.action_ref,
          dependency_state,
          predecessor_refs: ["state:six-pareto-matches-ready"],
          blocker_refs,
          evidence_refs: [`fixture:causal-marker:${proposalId}`],
        },
      }
    : {
        opportunity_marker: {
          schema_version: "are.opportunity-marker/v1",
          marker_id: `opportunity:${proposalId}`,
          opportunity_ref: `opportunity:${proposalId}`,
          target_objective_ref: objective_ref,
          proposed_action_ref: proposal.action_ref,
          evidence_refs: [`fixture:opportunity-marker:${proposalId}`],
        },
      };
  return {
    ...proposal,
    objective_binding: {
      objective_ref,
      relation,
      rank,
      ...marker,
      evidence_refs: [`fixture:objective-binding:${proposalId}`],
    },
  };
}

function decide(state, overrides = {}) {
  return evaluateDualLaneContinuation({
    completion: completion(),
    plan_bound: [],
    interaction_bound: [],
    objective_frontier: frontier(state),
    ...overrides,
  }, loaded.decision_profile).value;
}

test("objective frontier distinguishes completion from candidate presence", () => {
  const done = decide("complete", {plan_bound: [safePlan("STALE")]});
  assert.equal(done.directive_kind, "complete");
  assert.equal(done.selected_proposal_id, null);
  assert.deepEqual(done.reason_codes, ["continuation.none-required"]);
  assert.equal(done.objective_frontier.frontier_digest.length, 64);

  const runnable = decide("runnable");
  assert.equal(runnable.directive_kind, "block");
  assert.deepEqual(runnable.reason_codes, ["continuation.candidate-discovery-required"]);
});

test("objective frontier routes human input, choices, and blockers without premature completion", () => {
  assert.deepEqual(decide("choice-required").reason_codes, ["continuation.owner-choice-required"]);
  assert.equal(decide("choice-required").directive_kind, "gate");
  assert.deepEqual(decide("input-required").reason_codes, ["continuation.required-input-missing"]);
  assert.equal(decide("input-required").directive_kind, "gate");
  assert.deepEqual(decide("blocked").reason_codes, ["continuation.frontier-blocked"]);
  assert.equal(decide("blocked").directive_kind, "block");
});

test("an unsuccessful completion blocks before a complete frontier can stop cleanly", () => {
  const directive = evaluateDualLaneContinuation({completion: completion(false, "failed"), plan_bound: [], interaction_bound: [], objective_frontier: frontier("complete")}, loaded.decision_profile).value;
  assert.equal(directive.directive_kind, "block");
  assert.deepEqual(directive.reason_codes, ["continuation.completion-not-successful"]);
});

test("Codex completion passes the provider objective frontier into the production directive", async () => {
  const wrapper = createCodexAppServerWrapper({
    loaded_profile: loaded.value,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
    continuation_provider: () => ({plan_bound: [], interaction_bound: [], objective_frontier: frontier("runnable")}),
  });
  const action = await wrapper.processServerMessage({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "frontier-thread", turn: {id: "frontier-turn", items: [], status: "completed"}}});
  const directive = action.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.directive_kind, "block");
  assert.deepEqual(directive.reason_codes, ["continuation.candidate-discovery-required"]);
  assert.equal(directive.objective_frontier.state, "runnable");
});

test("objective materialization selects active work and retains a product-direction alternative as residue", () => {
  const pairwise = objectivePlan("P-PAIRWISE", "advances-active-objective", {
    action_ref: "build-human-pairwise-comparison-interface",
    route_id: "CA2-ROUTE-IMPLEMENT",
    objective_kind: "implement",
    effect_classes: ["persistent-mutation"],
  });
  const progressive = objectivePlan("P-PROGRESSIVE-REFERENCE", "changes-active-objective", {
    action_ref: "integrate-progressive-reference-as-main-documentation-candidate",
    route_id: "CA2-ROUTE-IMPLEMENT",
    objective_kind: "implement",
    effect_classes: ["change-product-meaning"],
  });
  const normalized = normalizeContinuationProposals({plan_bound: [progressive, pairwise], interaction_bound: []});
  const materialized = materializeObjectiveFrontier({
    completion: completion(),
    normalized_proposals: normalized,
    objective_frontier: frontier("choice-required"),
  });
  assert.equal(materialized.ok, true);
  assert.equal(materialized.value.frontier.state, "runnable");
  assert.deepEqual(materialized.value.decision_candidate_ids, ["P-PAIRWISE"]);
  assert.deepEqual(materialized.value.deferred_candidate_ids, ["P-PROGRESSIVE-REFERENCE"]);
  assert.deepEqual(materialized.value.ready_causal_candidate_ids, ["P-PAIRWISE"]);
  assert.deepEqual(materialized.value.opportunity_candidate_ids, ["P-PROGRESSIVE-REFERENCE"]);

  const continuation = evaluateDualLaneContinuation({
    completion: completion(),
    normalized_proposals: normalized,
    objective_frontier: frontier("choice-required"),
  }, loaded.decision_profile);
  assert.equal(continuation.value.directive_kind, "gate");
  assert.equal(continuation.value.selected_proposal_id, "P-PAIRWISE");
  assert.deepEqual(continuation.value.reason_codes, ["continuation.consequential"]);
  assert.deepEqual(continuation.value.objective_frontier_materialization.deferred_candidate_ids, ["P-PROGRESSIVE-REFERENCE"]);
});

test("a continuation-shaped turn inherits the selected objective and routes without lexical ambiguity", async () => {
  const pairwise = objectivePlan("P-PAIRWISE", "advances-active-objective", {
    action_ref: "build-human-pairwise-comparison-interface",
    route_id: "CA2-ROUTE-IMPLEMENT",
    objective_kind: "implement",
    effect_classes: ["persistent-mutation"],
  });
  const progressive = objectivePlan("P-PROGRESSIVE-REFERENCE", "changes-active-objective", {
    action_ref: "integrate-progressive-reference-as-main-documentation-candidate",
    route_id: "CA2-ROUTE-IMPLEMENT",
    objective_kind: "implement",
    effect_classes: ["change-product-meaning"],
  });
  const provider = () => ({plan_bound: [progressive, pairwise], interaction_bound: [], objective_frontier: frontier("choice-required")});
  const wrapper = createCodexAppServerWrapper({
    loaded_profile: loaded.value,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
    continuation_provider: provider,
  });
  const completed = await wrapper.processServerMessage({jsonrpc: "2.0", method: "turn/completed", params: {threadId: "frontier-thread", turn: {id: "frontier-turn", items: [], status: "completed"}}});
  const directive = completed.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.selected_proposal_id, "P-PAIRWISE");

  const next = {jsonrpc: "2.0", id: 991, method: "turn/start", params: {threadId: "frontier-thread", input: [{type: "text", text: "What is next?"}]}};
  const projected = projectObjectiveFrontierForTurnStart(next, {ok: true, value: directive});
  assert.ok(projected.params.additionalContext["cyberalchemy.are.objective-frontier"]);
  assert.equal(JSON.parse(projected.params.additionalContext["cyberalchemy.request-context"].value).objective_kind, "implement");

  const started = await wrapper.processClientMessage(next);
  assert.equal(started.to_server.length, 1, JSON.stringify(started));
  const context = JSON.parse(started.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  assert.equal(context.route_id, "CA2-ROUTE-IMPLEMENT");
  const projectedFrontier = JSON.parse(started.to_server[0].params.additionalContext["cyberalchemy.are.objective-frontier"].value);
  assert.equal(projectedFrontier.selected_candidate.proposal_id, "P-PAIRWISE");
  assert.deepEqual(projectedFrontier.deferred_candidate_ids, ["P-PROGRESSIVE-REFERENCE"]);
});

test("rank cannot manufacture causality between two ready obligations", () => {
  const lowRank = objectivePlan("P-LOW-RANK", "advances-active-objective", {rank: 0});
  const highRank = objectivePlan("P-HIGH-RANK", "advances-active-objective", {rank: 99});
  const continuation = evaluateDualLaneContinuation({
    completion: completion(),
    plan_bound: [highRank, lowRank],
    interaction_bound: [],
    objective_frontier: frontier("runnable"),
  }, loaded.decision_profile);
  assert.equal(continuation.value.objective_frontier.state, "choice-required");
  assert.equal(continuation.value.directive_kind, "gate");
  assert.equal(continuation.value.selected_proposal_id, null);
  assert.deepEqual(continuation.value.objective_frontier_materialization.ready_causal_candidate_ids, ["P-HIGH-RANK", "P-LOW-RANK"]);
});

test("a blocked causal obligation cannot be bypassed by an opportunity", () => {
  const blocked = objectivePlan("P-BLOCKED-PAIRWISE", "advances-active-objective", {
    dependency_state: "blocked",
    blocker_refs: ["blocker:comparison-data-missing"],
  });
  const opportunity = objectivePlan("P-PROGRESSIVE-REFERENCE", "changes-active-objective");
  const continuation = evaluateDualLaneContinuation({
    completion: completion(),
    plan_bound: [opportunity, blocked],
    interaction_bound: [],
    objective_frontier: frontier("runnable"),
  }, loaded.decision_profile);
  assert.equal(continuation.value.objective_frontier.state, "blocked");
  assert.equal(continuation.value.directive_kind, "block");
  assert.equal(continuation.value.selected_proposal_id, null);
  assert.deepEqual(continuation.value.reason_codes, ["continuation.frontier-blocked"]);
  assert.deepEqual(continuation.value.objective_frontier_materialization.blocked_causal_candidate_ids, ["P-BLOCKED-PAIRWISE"]);
  assert.deepEqual(continuation.value.objective_frontier_materialization.opportunity_candidate_ids, ["P-PROGRESSIVE-REFERENCE"]);
});

test("a causal marker must bind the exact proposed action", () => {
  const mismatched = objectivePlan("P-MISMATCH", "advances-active-objective");
  mismatched.objective_binding.causal_marker.required_action_ref = "different-action";
  const normalized = normalizeContinuationProposals({plan_bound: [mismatched], interaction_bound: []});
  assert.equal(normalized.plan_bound[0].posture, "rejected");
  assert.ok(normalized.plan_bound[0].rejection_reasons.includes("causal-marker.required-action-mismatch"));
  const continuation = evaluateDualLaneContinuation({
    completion: completion(),
    normalized_proposals: normalized,
    objective_frontier: frontier("runnable"),
  }, loaded.decision_profile);
  assert.equal(continuation.value.directive_kind, "block");
  assert.deepEqual(continuation.value.reason_codes, ["continuation.zero-admissible"]);
});
