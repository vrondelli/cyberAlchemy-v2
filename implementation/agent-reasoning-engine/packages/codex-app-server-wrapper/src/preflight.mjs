import {composeContextLifecycle} from "../../context-basis-runtime/index.mjs";
import {deepFreeze, digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {addContextFragment, contextFragment} from "./protocol.mjs";
import {buildRequestContext} from "./request-context.mjs";

function directiveFromComposition(composition, requestContext, envelope = null) {
  if (composition.ok) {
    const route = composition.value.route_decision;
    const basis = composition.value.necessary_context_basis;
    const view = composition.value.context_window_view;
    return freezeResult({
      schema_version: "are.codex-preflight-directive/v2",
      directive_kind: "direct",
      request_id: requestContext.value.request_id,
      request_context_digest: route.request_context_digest,
      decision_profile_digest: route.decision_profile_digest,
      decision_digest: route.decision_digest,
      selected_route_or_candidates: [route.selected.route_id],
      owner_boundary: route.selected.owner_gate_ref,
      reason_codes: route.reason_codes,
      basis_digest: basis.digest,
      view_id: view.value.view_id,
      view_lane: view.value.lane,
      context_epoch_id: envelope?.value?.context_epoch_id ?? null,
      context_envelope_digest: envelope?.digest ?? null,
      context_inline_bytes: envelope?.inline_bytes ?? null,
      raw_input_digest: requestContext.raw_input_digest,
      authority_effect: "none",
    });
  }
  if (composition.stage === "route" && isRecord(composition.route_decision)) {
    const route = composition.route_decision;
    return freezeResult({
      schema_version: "are.codex-preflight-directive/v2",
      directive_kind: route.kind,
      request_id: requestContext.value.request_id,
      request_context_digest: route.request_context_digest,
      decision_profile_digest: route.decision_profile_digest,
      decision_digest: route.decision_digest,
      selected_route_or_candidates: route.selected ? [route.selected.route_id] : route.candidates,
      owner_boundary: route.selected?.owner_gate_ref ?? null,
      reason_codes: route.reason_codes,
      basis_digest: null,
      view_id: null,
      view_lane: null,
      context_epoch_id: null,
      context_envelope_digest: null,
      context_inline_bytes: null,
      raw_input_digest: requestContext.raw_input_digest,
      authority_effect: "none",
    });
  }
  return freezeResult({
    schema_version: "are.codex-preflight-directive/v2",
    directive_kind: "block",
    request_id: requestContext.value.request_id,
    request_context_digest: null,
    decision_profile_digest: null,
    decision_digest: digestValue(composition),
    selected_route_or_candidates: [],
    owner_boundary: null,
    reason_codes: composition.reason_codes ?? ["preflight.context-construction-failed"],
    basis_digest: null,
    view_id: null,
    view_lane: null,
    context_epoch_id: null,
    context_envelope_digest: null,
    context_inline_bytes: null,
    raw_input_digest: requestContext.raw_input_digest,
    residue: composition.residue ?? [],
    authority_effect: "none",
  });
}

function observedPhase(options, phaseId, operation) {
  const observer = options?.phase_observer;
  if (typeof observer !== "function") return operation();
  const started = performance.now();
  try {
    const result = operation();
    try {
      observer(Object.freeze({phase_id: phaseId, elapsed_ms: performance.now() - started, outcome: result?.ok === false ? "not-ok" : "ok", authority_effect: "none"}));
    } catch {}
    return result;
  } catch (error) {
    try {
      observer(Object.freeze({phase_id: phaseId, elapsed_ms: performance.now() - started, outcome: "error", authority_effect: "none"}));
    } catch {}
    throw error;
  }
}

export function evaluateTurnPreflight(input, options = {}) {
  if (!isRecord(input) || !isRecord(input.message) || !isRecord(input.turn_binding)) {
    return fail("preflight", ["preflight.input-required"]);
  }
  const requestContext = observedPhase(options, "request-context-build", () => buildRequestContext(input.message, input.turn_binding, input.objective_resolution));
  if (!requestContext.ok) return requestContext;
  const binding = input.turn_binding;
  if (binding.lane !== "plan-bound" && binding.lane !== "interaction-bound") {
    return fail("preflight", ["preflight.exact-view-lane-required"]);
  }
  if (!nonEmptyString(binding.consumer_ref) || !nonEmptyString(binding.purpose) || !nonEmptyString(binding.source_epoch)) {
    return fail("preflight", ["preflight.view-binding-incomplete"]);
  }
  const rpcIdentity = String(input.message.id ?? requestContext.value.request_id);
  const view = {
    lane: binding.lane,
    consumer_ref: binding.consumer_ref,
    purpose: binding.purpose,
    source_epoch: binding.source_epoch,
    turn_id: binding.turn_id ?? `preflight:${rpcIdentity}`,
    predecessor_view: binding.predecessor_view ?? null,
    reuse_predicate: binding.reuse_predicate ?? null,
  };
  if (binding.lane === "plan-bound") view.window_ref = binding.window_ref;
  else view.interaction_id = binding.interaction_id ?? `interaction:${rpcIdentity}`;

  const lifecycle = composeContextLifecycle({
    request_context: requestContext.value,
    decision_profile: input.decision_profile,
    context_dependencies: input.context_dependencies ?? input.context.dependencies ?? {
      definition_catalog: "required-for-operation",
      ontology_snapshot: "required-for-operation",
    },
    definition: {
      catalog: input.definition_catalog,
      seed_definition_ids: input.context.seed_definition_ids,
      universal_relation_classes: input.context.universal_relation_classes,
      route_relation_classes_by_route: input.context.route_relation_classes_by_route,
    },
    ontology: {
      snapshot: input.ontology_snapshot,
      initial_node_ids: input.context.initial_node_ids,
      required_edge_ids: input.context.required_edge_ids,
      omission_candidate_ids: input.context.omission_candidate_ids,
    },
    instructions: input.instructions ?? [],
    supplemental_context_items: input.supplemental_context_items ?? [],
    request_selection_policy: input.context.request_selection_policy ?? {},
    authority_posture: input.context.authority_posture ?? "candidate-context-only",
    effect_posture: input.context.effect_posture ?? "non-effectful",
    constraints: binding.context_constraints ?? binding.constraints,
    exclusions: binding.exclusions ?? [],
    contradictions: binding.contradictions ?? [],
    gaps: binding.gaps ?? [],
    residue: binding.residue ?? [],
    previous_envelope: input.previous_envelope ?? null,
    current_sources: input.current_sources ?? [],
    projection_policy: input.projection_policy ?? {},
    view,
  }, options);
  const composition = lifecycle.ok ? lifecycle.value.composition : lifecycle.composition;
  const envelope = lifecycle.ok ? lifecycle.value.context_envelope : null;
  const directive = observedPhase(options, "preflight-directive-projection", () => directiveFromComposition(composition ?? lifecycle.context_envelope ?? lifecycle, requestContext, envelope));
  if (directive.directive_kind !== "direct") {
    return deepFreeze({ok: true, action: directive.directive_kind, directive, forwarded_message: null, composition, lifecycle, authority_effect: "none"});
  }
  if (!lifecycle.ok || !envelope?.ok) {
    const failed = lifecycle.context_envelope ?? lifecycle.refresh_assessment ?? lifecycle;
    const blocked = freezeResult({...directive, directive_kind: "block", reason_codes: failed.reason_codes ?? ["preflight.context-lifecycle-failed"], residue: failed.residue ?? []});
    return deepFreeze({ok: true, action: "block", directive: blocked, forwarded_message: null, composition, lifecycle, authority_effect: "none"});
  }
  const fragment = observedPhase(options, "context-fragment-projection", () => contextFragment(lifecycle.value));
  const forwardedMessage = observedPhase(options, "message-context-projection", () => addContextFragment(input.message, fragment));
  return deepFreeze({ok: true, action: "forward", directive, fragment, forwarded_message: forwardedMessage, request_context: requestContext.value, composition, lifecycle, context_envelope: envelope, refresh_assessment: lifecycle.value.refresh_assessment, authority_effect: "none"});
}
