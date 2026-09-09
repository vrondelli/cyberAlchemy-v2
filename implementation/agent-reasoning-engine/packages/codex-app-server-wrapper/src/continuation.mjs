import {evaluateContinuation} from "../../request-decision-router/index.mjs";
import {canonicalizeJson, digestValue, fail, freezeResult, isRecord, nonEmptyString, uniqueStrings} from "./canonical.mjs";
import {isVerifiedReasoningReceiptConstraints} from "./reasoning-receipt-constraints.mjs";

const OBJECTIVE_FRONTIER_STATES = new Set(["complete", "runnable", "choice-required", "decision-required", "input-required", "blocked"]);
const OBJECTIVE_RELATIONS = new Set(["advances-active-objective", "changes-active-objective", "deferred-residue"]);
const CAUSAL_DEPENDENCY_STATES = new Set(["ready", "blocked"]);
const OBJECTIVE_FRONTIER_CONTEXT_KEY = "cyberalchemy.are.objective-frontier";
const REQUEST_CONTEXT_KEY = "cyberalchemy.request-context";
const NORMALIZED_PROPOSAL_RESULTS = new WeakSet();

function normalizeObjectiveFrontier(frontier) {
  if (frontier === undefined || frontier === null) return {present: false, valid: true, value: null, reason_codes: []};
  const reasons = [];
  if (!isRecord(frontier)) return {present: true, valid: false, value: null, reason_codes: ["continuation.objective-frontier-invalid"]};
  if (!OBJECTIVE_FRONTIER_STATES.has(frontier.state)) reasons.push("continuation.objective-frontier-state-invalid");
  if (!Array.isArray(frontier.evidence_refs) || frontier.evidence_refs.length === 0 || frontier.evidence_refs.some((ref) => !nonEmptyString(ref))) reasons.push("continuation.objective-frontier-evidence-required");
  if (frontier.owner_gate_ref !== undefined && frontier.owner_gate_ref !== null && !nonEmptyString(frontier.owner_gate_ref)) reasons.push("continuation.objective-frontier-owner-gate-invalid");
  const material = canonicalizeJson({
    schema_version: "are.objective-frontier/v1",
    state: OBJECTIVE_FRONTIER_STATES.has(frontier.state) ? frontier.state : null,
    evidence_refs: uniqueStrings(frontier.evidence_refs),
    owner_gate_ref: nonEmptyString(frontier.owner_gate_ref) ? frontier.owner_gate_ref.trim() : null,
    assessed_at_boundary: "turn/completed",
    authority_effect: "none",
  });
  return {present: true, valid: reasons.length === 0, value: {...material, frontier_digest: digestValue(material)}, reason_codes: reasons};
}

function normalizeCausalMarker(marker, actionRef, objectiveRef) {
  if (marker === undefined || marker === null) return {present: false, value: null, reason_codes: []};
  const reasons = [];
  if (!isRecord(marker)) return {present: true, value: null, reason_codes: ["causal-marker.invalid"]};
  if (marker.schema_version !== "are.causal-marker/v1") reasons.push("causal-marker.schema-version-invalid");
  if (!nonEmptyString(marker.marker_id)) reasons.push("causal-marker.id-required");
  if (!nonEmptyString(marker.objective_ref)) reasons.push("causal-marker.objective-ref-required");
  else if (nonEmptyString(objectiveRef) && marker.objective_ref.trim() !== objectiveRef.trim()) reasons.push("causal-marker.objective-ref-mismatch");
  if (!nonEmptyString(marker.unresolved_obligation_ref)) reasons.push("causal-marker.unresolved-obligation-required");
  if (!nonEmptyString(marker.required_action_ref)) reasons.push("causal-marker.required-action-required");
  else if (nonEmptyString(actionRef) && marker.required_action_ref.trim() !== actionRef.trim()) reasons.push("causal-marker.required-action-mismatch");
  if (!CAUSAL_DEPENDENCY_STATES.has(marker.dependency_state)) reasons.push("causal-marker.dependency-state-invalid");
  if (!Array.isArray(marker.evidence_refs) || marker.evidence_refs.length === 0 || marker.evidence_refs.some((ref) => !nonEmptyString(ref))) reasons.push("causal-marker.evidence-required");
  if (marker.predecessor_refs !== undefined && (!Array.isArray(marker.predecessor_refs) || marker.predecessor_refs.some((ref) => !nonEmptyString(ref)))) reasons.push("causal-marker.predecessor-refs-invalid");
  if (marker.blocker_refs !== undefined && (!Array.isArray(marker.blocker_refs) || marker.blocker_refs.some((ref) => !nonEmptyString(ref)))) reasons.push("causal-marker.blocker-refs-invalid");
  const blockerRefs = uniqueStrings(marker.blocker_refs);
  if (marker.dependency_state === "blocked" && blockerRefs.length === 0) reasons.push("causal-marker.blocker-required");
  if (marker.dependency_state === "ready" && blockerRefs.length > 0) reasons.push("causal-marker.ready-blocker-conflict");
  const material = canonicalizeJson({
    schema_version: "are.causal-marker/v1",
    marker_id: nonEmptyString(marker.marker_id) ? marker.marker_id.trim() : null,
    objective_ref: nonEmptyString(marker.objective_ref) ? marker.objective_ref.trim() : null,
    unresolved_obligation_ref: nonEmptyString(marker.unresolved_obligation_ref) ? marker.unresolved_obligation_ref.trim() : null,
    required_action_ref: nonEmptyString(marker.required_action_ref) ? marker.required_action_ref.trim() : null,
    dependency_state: CAUSAL_DEPENDENCY_STATES.has(marker.dependency_state) ? marker.dependency_state : null,
    predecessor_refs: uniqueStrings(marker.predecessor_refs),
    blocker_refs: blockerRefs,
    evidence_refs: uniqueStrings(marker.evidence_refs),
    authority_effect: "none",
  });
  return {present: true, value: {...material, marker_digest: digestValue(material)}, reason_codes: reasons};
}

function normalizeOpportunityMarker(marker, actionRef, objectiveRef) {
  if (marker === undefined || marker === null) return {present: false, value: null, reason_codes: []};
  const reasons = [];
  if (!isRecord(marker)) return {present: true, value: null, reason_codes: ["opportunity-marker.invalid"]};
  if (marker.schema_version !== "are.opportunity-marker/v1") reasons.push("opportunity-marker.schema-version-invalid");
  if (!nonEmptyString(marker.marker_id)) reasons.push("opportunity-marker.id-required");
  if (!nonEmptyString(marker.opportunity_ref)) reasons.push("opportunity-marker.opportunity-ref-required");
  if (!nonEmptyString(marker.target_objective_ref)) reasons.push("opportunity-marker.target-objective-ref-required");
  else if (nonEmptyString(objectiveRef) && marker.target_objective_ref.trim() !== objectiveRef.trim()) reasons.push("opportunity-marker.target-objective-ref-mismatch");
  if (!nonEmptyString(marker.proposed_action_ref)) reasons.push("opportunity-marker.proposed-action-required");
  else if (nonEmptyString(actionRef) && marker.proposed_action_ref.trim() !== actionRef.trim()) reasons.push("opportunity-marker.proposed-action-mismatch");
  if (!Array.isArray(marker.evidence_refs) || marker.evidence_refs.length === 0 || marker.evidence_refs.some((ref) => !nonEmptyString(ref))) reasons.push("opportunity-marker.evidence-required");
  const material = canonicalizeJson({
    schema_version: "are.opportunity-marker/v1",
    marker_id: nonEmptyString(marker.marker_id) ? marker.marker_id.trim() : null,
    opportunity_ref: nonEmptyString(marker.opportunity_ref) ? marker.opportunity_ref.trim() : null,
    target_objective_ref: nonEmptyString(marker.target_objective_ref) ? marker.target_objective_ref.trim() : null,
    proposed_action_ref: nonEmptyString(marker.proposed_action_ref) ? marker.proposed_action_ref.trim() : null,
    evidence_refs: uniqueStrings(marker.evidence_refs),
    authority_effect: "none",
  });
  return {present: true, value: {...material, marker_digest: digestValue(material)}, reason_codes: reasons};
}

function normalizeObjectiveBinding(binding, actionRef) {
  if (binding === undefined || binding === null) return {present: false, valid: true, value: null, reason_codes: []};
  const reasons = [];
  if (!isRecord(binding)) return {present: true, valid: false, value: null, reason_codes: ["proposal.objective-binding-invalid"]};
  if (!nonEmptyString(binding.objective_ref)) reasons.push("proposal.objective-ref-required");
  if (!OBJECTIVE_RELATIONS.has(binding.relation)) reasons.push("proposal.objective-relation-invalid");
  if (binding.rank !== undefined && (!Number.isSafeInteger(binding.rank) || binding.rank < 0)) reasons.push("proposal.objective-rank-invalid");
  const causalMarker = normalizeCausalMarker(binding.causal_marker, actionRef, binding.objective_ref);
  const opportunityMarker = normalizeOpportunityMarker(binding.opportunity_marker, actionRef, binding.objective_ref);
  reasons.push(...causalMarker.reason_codes, ...opportunityMarker.reason_codes);
  if (binding.relation === "advances-active-objective") {
    if (!causalMarker.present) reasons.push("proposal.causal-marker-required");
    if (opportunityMarker.present) reasons.push("proposal.opportunity-marker-conflicts-with-causal-relation");
  }
  if (["changes-active-objective", "deferred-residue"].includes(binding.relation)) {
    if (!opportunityMarker.present) reasons.push("proposal.opportunity-marker-required");
    if (causalMarker.present) reasons.push("proposal.causal-marker-conflicts-with-opportunity-relation");
  }
  return {
    present: true,
    valid: reasons.length === 0,
    value: canonicalizeJson({
      objective_ref: nonEmptyString(binding.objective_ref) ? binding.objective_ref.trim() : null,
      relation: OBJECTIVE_RELATIONS.has(binding.relation) ? binding.relation : null,
      rank: Number.isSafeInteger(binding.rank) && binding.rank >= 0 ? binding.rank : null,
      rank_role: binding.rank === undefined ? "absent" : "diagnostic-only",
      causal_marker: causalMarker.value,
      opportunity_marker: opportunityMarker.value,
      evidence_refs: uniqueStrings(binding.evidence_refs),
      authority_effect: "none",
    }),
    reason_codes: reasons,
  };
}

function normalizePlanProposal(proposal) {
  const reasons = [];
  if (!isRecord(proposal)) return {posture: "rejected", rejection_reasons: ["proposal.expected-object"]};
  if (!nonEmptyString(proposal.proposal_id)) reasons.push("proposal.id-required");
  if (!nonEmptyString(proposal.declared_plan_digest)) reasons.push("proposal.plan-digest-required");
  if (!nonEmptyString(proposal.action_ref)) reasons.push("proposal.action-ref-required");
  if (!nonEmptyString(proposal.route_id)) reasons.push("proposal.route-required");
  if (!Array.isArray(proposal.effect_classes) || proposal.effect_classes.length === 0) reasons.push("proposal.effect-classes-required");
  if (typeof proposal.reversible !== "boolean") reasons.push("proposal.reversibility-required");
  if (!isRecord(proposal.next_turn) || !isRecord(proposal.next_turn.params)) reasons.push("proposal.next-turn-required");
  const hasSemanticDependency = Object.hasOwn(proposal, "semantic_dependency") && proposal.semantic_dependency !== null;
  if (hasSemanticDependency && !isRecord(proposal.semantic_dependency)) reasons.push("proposal.semantic-dependency-invalid");
  if (isRecord(proposal.semantic_dependency) && proposal.semantic_dependency.required !== true) reasons.push("proposal.semantic-dependency-required-invalid");
  if (isRecord(proposal.semantic_dependency) && proposal.semantic_dependency.binding_id !== undefined && !nonEmptyString(proposal.semantic_dependency.binding_id)) reasons.push("proposal.semantic-binding-id-invalid");
  if (isRecord(proposal.semantic_dependency) && proposal.semantic_dependency.conclusion_domain !== undefined && !nonEmptyString(proposal.semantic_dependency.conclusion_domain)) reasons.push("proposal.semantic-conclusion-domain-invalid");
  const objectiveBinding = normalizeObjectiveBinding(proposal.objective_binding, proposal.action_ref);
  reasons.push(...objectiveBinding.reason_codes);
  const material = canonicalizeJson({
    proposal_id: proposal.proposal_id ?? null,
    source_lane: "plan_bound",
    declared_plan_digest: proposal.declared_plan_digest ?? null,
    action_ref: proposal.action_ref ?? null,
    route_id: proposal.route_id ?? null,
    objective_kind: nonEmptyString(proposal.objective_kind) ? proposal.objective_kind.trim() : null,
    effect_classes: uniqueStrings(proposal.effect_classes),
    reversible: proposal.reversible === true,
    owner_gate_ref: nonEmptyString(proposal.owner_gate_ref) ? proposal.owner_gate_ref.trim() : null,
    evidence_refs: uniqueStrings(proposal.evidence_refs),
    objective_binding: objectiveBinding.value,
    semantic_dependency: isRecord(proposal.semantic_dependency) ? {
      required: proposal.semantic_dependency.required === true,
      binding_id: nonEmptyString(proposal.semantic_dependency.binding_id) ? proposal.semantic_dependency.binding_id.trim() : null,
      conclusion_domain: nonEmptyString(proposal.semantic_dependency.conclusion_domain) ? proposal.semantic_dependency.conclusion_domain.trim() : null,
    } : null,
    next_turn: proposal.next_turn ?? null,
    posture: reasons.length === 0 ? "candidate" : "rejected",
    rejection_reasons: reasons,
    authority_effect: "none",
  });
  return {...material, proposal_digest: digestValue(material)};
}

function normalizeInteractionProposal(proposal) {
  const reasons = [];
  if (!isRecord(proposal)) return {posture: "rejected", rejection_reasons: ["proposal.expected-object"]};
  if (!nonEmptyString(proposal.proposal_id)) reasons.push("proposal.id-required");
  if (!nonEmptyString(proposal.attributed_to)) reasons.push("proposal.attribution-required");
  if (!nonEmptyString(proposal.proposal_text)) reasons.push("proposal.text-required");
  if (!Array.isArray(proposal.evidence_refs) || proposal.evidence_refs.length === 0) reasons.push("proposal.evidence-required");
  const material = canonicalizeJson({
    proposal_id: proposal.proposal_id ?? null,
    source_lane: "interaction_bound",
    attributed_to: proposal.attributed_to ?? null,
    proposal_text: proposal.proposal_text ?? null,
    effect_classes: uniqueStrings(proposal.effect_classes?.length ? proposal.effect_classes : ["unknown-interaction-effect"]),
    reversible: typeof proposal.reversible === "boolean" ? proposal.reversible : false,
    owner_gate_ref: nonEmptyString(proposal.owner_gate_ref) ? proposal.owner_gate_ref.trim() : "Human owner of the exact interaction proposal",
    evidence_refs: uniqueStrings(proposal.evidence_refs),
    human_decision_digest: nonEmptyString(proposal.human_decision_digest) ? proposal.human_decision_digest.trim() : null,
    posture: reasons.length === 0 ? "candidate" : "rejected",
    rejection_reasons: reasons,
    authority_effect: "none",
  });
  return {...material, proposal_digest: digestValue(material)};
}

export function normalizeContinuationProposals(input) {
  if (!isRecord(input)) return fail("continuation-normalization", ["continuation.input-required"]);
  const plan = (Array.isArray(input.plan_bound) ? input.plan_bound : []).map(normalizePlanProposal).sort((a, b) => String(a.proposal_id).localeCompare(String(b.proposal_id)));
  const interaction = (Array.isArray(input.interaction_bound) ? input.interaction_bound : []).map(normalizeInteractionProposal).sort((a, b) => String(a.proposal_id).localeCompare(String(b.proposal_id)));
  const result = freezeResult({ok: true, plan_bound: plan, interaction_bound: interaction, digest: digestValue({plan, interaction}), authority_effect: "none"});
  NORMALIZED_PROPOSAL_RESULTS.add(result);
  return result;
}

export function materializeObjectiveFrontier(input) {
  if (!isRecord(input) || !isRecord(input.completion)) return fail("objective-frontier-materialization", ["continuation.completion-required"]);
  const normalized = NORMALIZED_PROPOSAL_RESULTS.has(input.normalized_proposals)
    ? input.normalized_proposals
    : normalizeContinuationProposals({plan_bound: input.plan_bound, interaction_bound: input.interaction_bound});
  if (!normalized.ok) return normalized;
  const declared = normalizeObjectiveFrontier(input.objective_frontier);
  if (!declared.valid) return fail("objective-frontier-materialization", declared.reason_codes);

  const candidates = normalized.plan_bound.filter((proposal) => proposal.posture !== "rejected");
  const classified = candidates.filter((proposal) => proposal.objective_binding !== null);
  const unclassified = candidates.filter((proposal) => proposal.objective_binding === null);
  const advancing = classified.filter((proposal) => proposal.objective_binding.relation === "advances-active-objective");
  const changes = classified.filter((proposal) => proposal.objective_binding.relation === "changes-active-objective");
  const residues = classified.filter((proposal) => proposal.objective_binding.relation === "deferred-residue");
  const readyCausal = advancing.filter((proposal) => proposal.objective_binding.causal_marker?.dependency_state === "ready");
  const blockedCausal = advancing.filter((proposal) => proposal.objective_binding.causal_marker?.dependency_state === "blocked");
  const classificationApplied = classified.length > 0;

  let state = declared.value?.state ?? null;
  let sourceKind = declared.present ? "declared" : "proposal-derived";
  let decisionCandidates = [];
  let deferredCandidates = [];
  if (state === "complete") {
    decisionCandidates = [];
    deferredCandidates = candidates;
  } else if (["blocked", "input-required"].includes(state)) {
    decisionCandidates = [];
    deferredCandidates = candidates;
  } else if (classificationApplied) {
    sourceKind = declared.present ? "declared-reconciled-with-objective-bindings" : "objective-bindings";
    if (readyCausal.length === 1) state = "runnable";
    else if (readyCausal.length > 1) state = "choice-required";
    else if (blockedCausal.length > 0) state = "blocked";
    else if (changes.length > 0) state = "decision-required";
    else if (normalized.interaction_bound.length > 0) state = "input-required";
    else state = input.completion.continuation_required === true ? "runnable" : "complete";
    decisionCandidates = readyCausal.length > 0 ? readyCausal : blockedCausal.length > 0 ? [] : changes;
    deferredCandidates = [...changes.filter((proposal) => !decisionCandidates.includes(proposal)), ...residues, ...unclassified];
  } else {
    if (state === null) {
      if (normalized.interaction_bound.length > 0) state = "input-required";
      else if (candidates.length === 1) state = "runnable";
      else if (candidates.length > 1) state = "choice-required";
      else state = input.completion.continuation_required === true ? "runnable" : "complete";
    }
    decisionCandidates = ["runnable", "choice-required", "decision-required"].includes(state) ? candidates : [];
  }

  const evidenceRefs = uniqueStrings([
    ...(declared.value?.evidence_refs ?? []),
    ...candidates.flatMap((proposal) => proposal.evidence_refs ?? []),
    ...classified.flatMap((proposal) => proposal.objective_binding.evidence_refs ?? []),
    ...advancing.flatMap((proposal) => proposal.objective_binding.causal_marker?.evidence_refs ?? []),
    ...[...changes, ...residues].flatMap((proposal) => proposal.objective_binding.opportunity_marker?.evidence_refs ?? []),
  ]);
  const frontierMaterial = canonicalizeJson({
    schema_version: "are.objective-frontier/v1",
    state,
    evidence_refs: evidenceRefs.length > 0 ? evidenceRefs : uniqueStrings(input.completion.evidence_refs),
    owner_gate_ref: declared.value?.owner_gate_ref ?? null,
    assessed_at_boundary: "turn/completed",
    authority_effect: "none",
  });
  const frontier = {...frontierMaterial, frontier_digest: digestValue(frontierMaterial)};
  const material = canonicalizeJson({
    schema_version: "are.objective-frontier-materialization/v1",
    source_kind: sourceKind,
    classification_applied: classificationApplied,
    frontier,
    decision_candidate_ids: decisionCandidates.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    deferred_candidate_ids: deferredCandidates.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    advancing_candidate_ids: advancing.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    ready_causal_candidate_ids: readyCausal.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    blocked_causal_candidate_ids: blockedCausal.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    change_candidate_ids: changes.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    opportunity_candidate_ids: [...changes, ...residues].map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    residue_candidate_ids: residues.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    unclassified_candidate_ids: unclassified.map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    authority_effect: "none",
  });
  return freezeResult({ok: true, value: {...material, materialization_digest: digestValue(material)}, authority_effect: "none"});
}

function turnText(message) {
  return (Array.isArray(message?.params?.input) ? message.params.input : [])
    .filter((item) => isRecord(item) && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export function isContinuationReference(message) {
  const text = turnText(message).replace(/[.!?]+$/u, "").trim();
  if (!text || text.length > 160) return false;
  return /^(?:(?:please\s+)?(?:do|run|implement|continue|proceed|start|take|execute|apply|build|use)\s+(?:(?:the\s+)?next(?:\s+step)?|it|that|this|them)|(?:what(?:'s|\s+is)\s+next)|next(?:\s+step)?|go\s+ahead|carry\s+on)$/iu.test(text);
}

export function projectObjectiveFrontierForTurnStart(message, continuationResult) {
  if (!isRecord(message) || message.method !== "turn/start" || !isContinuationReference(message)) return message;
  const directive = continuationResult?.ok === true ? continuationResult.value : continuationResult;
  if (!isRecord(directive) || !nonEmptyString(directive.selected_proposal_id)) return message;
  const proposal = (Array.isArray(directive.plan_bound) ? directive.plan_bound : [])
    .find((candidate) => candidate.proposal_id === directive.selected_proposal_id);
  if (!proposal || proposal.posture === "rejected") return message;
  const params = isRecord(message.params) ? message.params : {};
  const additionalContext = isRecord(params.additionalContext) ? params.additionalContext : {};
  const rawRequest = turnText(message);
  const frontierProjection = canonicalizeJson({
    schema_version: "are.codex-objective-frontier-fragment/v1",
    frontier: directive.objective_frontier ?? null,
    materialization_digest: directive.objective_frontier_materialization?.materialization_digest ?? null,
    selected_candidate: {
      proposal_id: proposal.proposal_id,
      action_ref: proposal.action_ref,
      route_id: proposal.route_id,
      objective_kind: proposal.objective_kind,
      objective_binding: proposal.objective_binding,
    },
    deferred_candidate_ids: directive.objective_frontier_materialization?.deferred_candidate_ids ?? [],
    instruction: "Continue the selected ready causal candidate. Opportunities and deferred candidates are not co-equal next steps. Ask only if current evidence invalidates the causal marker or a real owner decision remains.",
    authority_effect: "none",
  });
  const requestHint = canonicalizeJson({
    schema_version: "are.request-context-hint/v1",
    raw_request: rawRequest,
    objective_kind: proposal.objective_kind,
    requested_effects: proposal.effect_classes,
    target_refs: [proposal.action_ref],
    constraints: [`objective-frontier:${frontierProjection.materialization_digest ?? "unmaterialized"}`],
    evidence_refs: uniqueStrings([...(proposal.evidence_refs ?? []), `proposal:${proposal.proposal_digest}`]),
  });
  return freezeResult({
    ...message,
    params: {
      ...params,
      additionalContext: {
        ...additionalContext,
        [OBJECTIVE_FRONTIER_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(frontierProjection)},
        ...(additionalContext[REQUEST_CONTEXT_KEY] ? {} : {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(requestHint)}}),
      },
    },
  });
}

export function evaluateDualLaneContinuation(input, decisionProfile) {
  if (!isRecord(input) || !isRecord(input.completion)) return fail("continuation", ["continuation.completion-required"]);
  const normalized = NORMALIZED_PROPOSAL_RESULTS.has(input.normalized_proposals)
    ? input.normalized_proposals
    : normalizeContinuationProposals({plan_bound: input.plan_bound, interaction_bound: input.interaction_bound});
  if (!normalized.ok) return normalized;
  const objectiveFrontierMaterialization = materializeObjectiveFrontier({
    completion: input.completion,
    normalized_proposals: normalized,
    objective_frontier: input.objective_frontier,
  });
  if (!objectiveFrontierMaterialization.ok) return objectiveFrontierMaterialization;
  const objectiveFrontier = {present: true, valid: true, value: objectiveFrontierMaterialization.value.frontier, reason_codes: []};
  if (input.semantic_constraints !== undefined && !isVerifiedReasoningReceiptConstraints(input.semantic_constraints)) {
    return fail("continuation", ["continuation.semantic-constraints-unverified"]);
  }
  const semanticConstraints = input.semantic_constraints ?? null;
  const constraintsByProposal = new Map((semanticConstraints?.proposal_constraints ?? []).map((constraint) => [constraint.proposal_id, constraint]));
  const rejectedInteraction = normalized.interaction_bound.filter((proposal) => proposal.posture === "rejected");
  const validInteraction = normalized.interaction_bound.filter((proposal) => proposal.posture !== "rejected");
  const decisionCandidateIds = new Set(objectiveFrontierMaterialization.value.decision_candidate_ids);
  const decisionPlan = normalized.plan_bound.filter((proposal) => decisionCandidateIds.has(proposal.proposal_id));
  const planOptions = decisionPlan.map((proposal) => {
    const constraint = constraintsByProposal.get(proposal.proposal_id) ?? null;
    const constraintDigestMismatch = constraint && constraint.proposal_digest !== proposal.proposal_digest;
    const missingConstraint = semanticConstraints && proposal.semantic_dependency && !constraint;
    const semanticIneligible = constraint?.constraint_kind === "ineligible" || constraintDigestMismatch || missingConstraint;
    return {
      option_id: proposal.proposal_id,
      route_id: proposal.route_id,
      effect_classes: proposal.effect_classes,
      reversible: proposal.reversible,
      owner_gate_ref: proposal.owner_gate_ref,
      structurally_admissible: proposal.posture !== "rejected" && !semanticIneligible,
      rejection_reasons: [
        ...proposal.rejection_reasons,
        ...(constraint?.constraint_kind === "ineligible" ? constraint.reason_codes : []),
        ...(constraintDigestMismatch ? ["continuation.semantic-proposal-digest-mismatch"] : []),
        ...(missingConstraint ? ["continuation.semantic-constraint-missing"] : []),
      ],
    };
  });
  const engineDecision = evaluateContinuation({completion: input.completion, options: planOptions}, decisionProfile);
  let kind = engineDecision.kind;
  let reasons = [...engineDecision.reason_codes];
  let selectedProposal = normalized.plan_bound.find((proposal) => proposal.proposal_id === engineDecision.selected_option_id) ?? null;
  let ownerGateRefs = [...engineDecision.owner_gate_refs];
  const admissibleOptionIds = new Set(engineDecision.options.filter((option) => option.posture === "admissible").map((option) => option.option_id));
  const semanticGates = decisionPlan
    .filter((proposal) => admissibleOptionIds.has(proposal.proposal_id) && constraintsByProposal.get(proposal.proposal_id)?.constraint_kind === "gate")
    .map((proposal) => constraintsByProposal.get(proposal.proposal_id));
  if (rejectedInteraction.length > 0) {
    kind = "block";
    reasons = ["continuation.interaction-proposal-invalid"];
    selectedProposal = null;
  } else if (validInteraction.length > 0) {
    kind = "gate";
    reasons = ["continuation.interaction-bound-human-decision-required"];
    selectedProposal = null;
    ownerGateRefs = [...new Set([...ownerGateRefs, ...validInteraction.map((proposal) => proposal.owner_gate_ref)])].sort();
  } else if (semanticGates.length > 0) {
    kind = "gate";
    reasons = ["continuation.semantic-owner-gate-required"];
    selectedProposal = null;
    ownerGateRefs = [...new Set([...ownerGateRefs, ...semanticGates.map((constraint) => constraint.owner_gate_ref).filter(Boolean)])].sort();
  }
  if (input.completion.status === "completed" && objectiveFrontier.present) {
    const frontier = objectiveFrontier.value;
    const candidateCount = normalized.plan_bound.length + normalized.interaction_bound.length;
    const hasRejectedCandidates = normalized.plan_bound.some((proposal) => proposal.posture === "rejected") || rejectedInteraction.length > 0;
    if (!objectiveFrontier.valid) {
      kind = "block";
      reasons = objectiveFrontier.reason_codes;
      selectedProposal = null;
      ownerGateRefs = [];
    } else if (frontier.state === "complete") {
      kind = "complete";
      reasons = ["continuation.none-required"];
      selectedProposal = null;
      ownerGateRefs = [];
    } else if (frontier.state === "blocked") {
      kind = "block";
      reasons = ["continuation.frontier-blocked"];
      selectedProposal = null;
      ownerGateRefs = [];
    } else if (frontier.state === "runnable" && candidateCount === 0) {
      kind = "block";
      reasons = ["continuation.candidate-discovery-required"];
      selectedProposal = null;
      ownerGateRefs = [];
    } else if (!hasRejectedCandidates
      && objectiveFrontierMaterialization.value.source_kind !== "proposal-derived"
      && ["choice-required", "decision-required"].includes(frontier.state)
      && kind !== "gate") {
      kind = "gate";
      reasons = ["continuation.owner-choice-required"];
      selectedProposal = null;
      ownerGateRefs = frontier.owner_gate_ref ? [frontier.owner_gate_ref] : [];
    } else if (!hasRejectedCandidates && frontier.state === "input-required" && validInteraction.length === 0) {
      kind = "gate";
      reasons = ["continuation.required-input-missing"];
      selectedProposal = null;
      ownerGateRefs = frontier.owner_gate_ref ? [frontier.owner_gate_ref] : [];
    }
  }
  const material = canonicalizeJson({
    schema_version: "are.codex-dual-lane-continuation-directive/v1",
    directive_kind: kind,
    completion_digest: engineDecision.completion_digest,
    decision_profile_digest: engineDecision.decision_profile_digest,
    selected_proposal_id: selectedProposal?.proposal_id ?? null,
    candidate_proposal_ids: [...normalized.plan_bound, ...normalized.interaction_bound].map((proposal) => proposal.proposal_id).filter(Boolean).sort(),
    owner_gate_refs: ownerGateRefs,
    reason_codes: reasons,
    plan_bound: normalized.plan_bound,
    interaction_bound: normalized.interaction_bound,
    objective_frontier: objectiveFrontier.value,
    objective_frontier_materialization: objectiveFrontierMaterialization.value,
    reasoning_receipt_constraints: semanticConstraints,
    engine_decision_digest: engineDecision.decision_digest,
    authority_effect: "none",
  });
  return freezeResult({ok: true, value: {...material, decision_digest: digestValue(material)}, selected_proposal: selectedProposal, engine_decision: engineDecision, authority_effect: "none"});
}
