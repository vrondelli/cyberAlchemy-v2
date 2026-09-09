import {admitRequestContext, routeRequest} from "../../request-decision-router/index.mjs";
import {canonicalizeJson, deepFreeze, digestValue, fail, isRecord} from "./canonical.mjs";
import {resolveDefinitionClosure} from "./definition-closure.mjs";
import {lockOntologySelectors} from "./ontology-selector-lock.mjs";
import {constructNecessaryContextBasis} from "./context-basis.mjs";
import {bindContextWindowView} from "./context-window-view.mjs";
import {selectRequestContext} from "./request-context-selector.mjs";
import {createModulePort, digestModuleValue} from "../../module-port/index.mjs";
import {
  contextSourceOutputValidators,
  createContextSourcesFacade,
} from "../../module-port/context-sources.mjs";

const SCHEMA_VERSION = "are.context-basis-composition/v1";
const DEPENDENCY_POSTURES = new Set(["required-for-operation", "optional-enrichment", "not-applicable"]);
const EMPTY_CONTEXT_MODULE_PORT = createModulePort({output_validators: contextSourceOutputValidators});

function nonEmptyText(value) {
  return typeof value === "string" && value.length > 0;
}

function validInlineDefinitionCatalog(value) {
  return isRecord(value) && nonEmptyText(value.catalog_id) && nonEmptyText(value.source_identity)
    && nonEmptyText(value.source_digest) && Array.isArray(value.normative_relation_classes)
    && Array.isArray(value.definitions) && value.definitions.length > 0;
}

function validInlineOntologySnapshot(value) {
  return isRecord(value) && nonEmptyText(value.ontology_id) && nonEmptyText(value.source_identity)
    && nonEmptyText(value.snapshot_digest) && Array.isArray(value.nodes) && Array.isArray(value.edges);
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

function stoppedRoute(routeDecision) {
  return deepFreeze(canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    ok: false,
    stage: "route",
    route_decision: routeDecision,
    stage_trace: ["request-admission", "route"],
    downstream_calls: {definition_closure: 0, ontology_selector_lock: 0, context_basis: 0, context_window_view: 0},
    strategy_calls: 0,
    tool_calls: 0,
    filesystem_calls: 0,
    network_calls: 0,
    model_calls: 0,
    ontology_runtime_calls: 0,
    effect_calls: 0,
    authority_effect: "none",
  }));
}

function dependencyPosture(input, dependencyId) {
  const configured = input.context_dependencies?.[dependencyId];
  if (configured === undefined) return "required-for-operation";
  return DEPENDENCY_POSTURES.has(configured) ? configured : null;
}

function invalidPostureSlot(dependencyId) {
  return {
    dependency_id: dependencyId, posture: "invalid", disposition: "blocked", source_identity: null,
    source_digest: null, currentness: "unverified", receipt: null,
    reason_codes: [`context.${dependencyId.replace("_", "-")}-dependency-posture-invalid`], authority_effect: "none",
  };
}

function inlineDependency(dependencyId, posture, value, validator, sourceDigestField) {
  if (posture === "not-applicable") return {
    dependency_id: dependencyId, posture, disposition: "not-applicable", source_identity: null,
    source_digest: null, currentness: "not-applicable", receipt: null, reason_codes: [], authority_effect: "none",
  };
  if (value !== undefined) {
    if (!validator(value)) return {
      dependency_id: dependencyId, posture, disposition: "blocked", source_identity: null,
      source_digest: null, currentness: "unverified", receipt: null,
      reason_codes: [`context.${dependencyId.replace("_", "-")}-invalid`], authority_effect: "none",
    };
    return {
      dependency_id: dependencyId, posture, disposition: "available", source_identity: value.source_identity,
      source_digest: value[sourceDigestField], currentness: "caller-current-snapshot", receipt: null,
      reason_codes: [], authority_effect: "none", value,
    };
  }
  return null;
}

function moduleDependency(dependencyId, posture, result) {
  const available = result.ok === true && result.disposition === "available";
  return {
    dependency_id: dependencyId,
    posture,
    disposition: available ? "available" : result.disposition,
    source_identity: available ? result.value.source_identity : null,
    source_digest: available
      ? result.value[dependencyId === "definition_catalog" ? "source_digest" : "snapshot_digest"]
      : null,
    currentness: available ? "module-snapshot-current" : "unavailable",
    receipt: result.receipt,
    reason_codes: result.reason_codes,
    authority_effect: "none",
    ...(available ? {value: result.value} : {}),
  };
}

function resolveDependencies(input, options, requestId) {
  const definitionPosture = dependencyPosture(input, "definition_catalog");
  const ontologyPosture = dependencyPosture(input, "ontology_snapshot");
  let definition = definitionPosture === null
    ? invalidPostureSlot("definition_catalog")
    : inlineDependency("definition_catalog", definitionPosture, input.definition?.catalog, validInlineDefinitionCatalog, "source_digest");
  let ontology = ontologyPosture === null
    ? invalidPostureSlot("ontology_snapshot")
    : inlineDependency("ontology_snapshot", ontologyPosture, input.ontology?.snapshot, validInlineOntologySnapshot, "snapshot_digest");
  const facade = createContextSourcesFacade(options.context_module_port ?? EMPTY_CONTEXT_MODULE_PORT, {consumer_id: "context-basis-runtime"});
  if (definition === null) definition = moduleDependency("definition_catalog", definitionPosture, facade.definitionCatalog({
    invocation_id: `context-source:${digestModuleValue({requestId, dependency: "definition-catalog"})}`,
    dependency_posture: definitionPosture,
  }));
  if (ontology === null) ontology = moduleDependency("ontology_snapshot", ontologyPosture, facade.ontologySnapshot({
    invocation_id: `context-source:${digestModuleValue({requestId, dependency: "ontology-snapshot"})}`,
    dependency_posture: ontologyPosture,
  }));
  return deepFreeze(canonicalizeJson({definition_catalog: definition, ontology_snapshot: ontology}));
}

function stoppedDependencies(routeDecision, slots) {
  const residue = Object.values(slots).filter((slot) => (
    slot.disposition === "blocked" || (slot.posture === "required-for-operation" && slot.disposition !== "available")
  )).map((slot) => ({
    kind: "context-dependency",
    dependency_id: slot.dependency_id,
    dependency_posture: slot.posture,
    disposition: slot.disposition,
    reason_codes: slot.reason_codes,
    receipt_digest: slot.receipt?.receipt_digest ?? null,
  }));
  return deepFreeze(canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    ok: false,
    stage: "context-dependencies",
    route_decision: routeDecision,
    context_dependency_slots: slots,
    reason_codes: [...new Set(residue.flatMap((item) => item.reason_codes))].sort(),
    residue,
    stage_trace: ["request-admission", "route", "context-dependencies"],
    downstream_calls: {definition_closure: 0, ontology_selector_lock: 0, context_basis: 0, context_window_view: 0},
    strategy_calls: 0, tool_calls: 0, filesystem_calls: 0, network_calls: 0,
    model_calls: 0, ontology_runtime_calls: 0, effect_calls: 0, authority_effect: "none",
  }));
}

function absentOperation(operation, slot) {
  const value = canonicalizeJson({
    schema_version: "are.context-dependency-absence/v1",
    operation,
    dependency_id: slot.dependency_id,
    dependency_posture: slot.posture,
    disposition: slot.disposition,
    reason_codes: slot.reason_codes,
    receipt_digest: slot.receipt?.receipt_digest ?? null,
    authority_effect: "none",
  });
  return deepFreeze({schema_version: value.schema_version, ok: true, disposition: slot.disposition,
    value, binding_lock: value, digest: digestValue(value), reason_codes: slot.reason_codes, authority_effect: "none"});
}

export function composeContextBasis(input, options = {}) {
  if (!isRecord(input)) return fail("composition", ["composition.input-required"]);
  const admitted = observedPhase(options, "request-admission", () => admitRequestContext(input.request_context));
  if (!admitted.ok) return fail("request-admission", admitted.reason_codes);
  const routeDecision = observedPhase(options, "request-routing", () => routeRequest(admitted.value, input.decision_profile, options.module_port));
  if (routeDecision.kind !== "direct") return stoppedRoute(routeDecision);

  const definitionInput = isRecord(input.definition) ? input.definition : {};
  const ontologyInput = isRecord(input.ontology) ? input.ontology : {};
  const dependencySlots = resolveDependencies(input, options, admitted.value.request_id);
  if (Object.values(dependencySlots).some((slot) => slot.disposition === "blocked"
    || (slot.posture === "required-for-operation" && slot.disposition !== "available"))) {
    return stoppedDependencies(routeDecision, dependencySlots);
  }
  const catalog = dependencySlots.definition_catalog.value;
  const snapshot = dependencySlots.ontology_snapshot.value;
  const requestSelection = observedPhase(options, "request-context-selection", () => selectRequestContext({
    raw_request: admitted.value.raw_request,
    catalog,
    snapshot,
    dependency_slots: dependencySlots,
    context_items: input.supplemental_context_items,
    policy: input.request_selection_policy,
  }));
  if (!requestSelection.ok) return deepFreeze({...requestSelection, stage_trace: ["request-admission", "route", "request-context-selection"]});
  const routeAdditions = isRecord(definitionInput.route_relation_classes_by_route)
    ? definitionInput.route_relation_classes_by_route[routeDecision.selected.route_id]
    : [];
  const closure = dependencySlots.definition_catalog.disposition === "available"
    ? observedPhase(options, "definition-closure", () => resolveDefinitionClosure({
    catalog,
    seed_definition_ids: [...(definitionInput.seed_definition_ids ?? []), ...requestSelection.value.definition_matches.map((match) => match.definition_id)],
    universal_relation_classes: definitionInput.universal_relation_classes,
    route_relation_classes: routeAdditions,
  })) : absentOperation("definition-closure", dependencySlots.definition_catalog);
  if (!closure.ok) return deepFreeze({...closure, stage_trace: ["request-admission", "route", "definition-closure"]});

  const lock = dependencySlots.ontology_snapshot.disposition === "available"
    ? observedPhase(options, "ontology-selector-lock", () => lockOntologySelectors({
    snapshot,
    initial_node_ids: [...(ontologyInput.initial_node_ids ?? []), ...requestSelection.value.ontology_node_matches.map((match) => match.node_id)],
    required_edge_ids: [...(ontologyInput.required_edge_ids ?? []), ...requestSelection.value.ontology_edge_matches.map((match) => match.edge_id)],
    omission_candidate_ids: ontologyInput.omission_candidate_ids,
  })) : absentOperation("ontology-selector-lock", dependencySlots.ontology_snapshot);
  if (!lock.ok) return deepFreeze({...lock, stage_trace: ["request-admission", "route", "definition-closure", "ontology-selector-lock"]});

  const basis = observedPhase(options, "context-basis-construction", () => constructNecessaryContextBasis({
    request_context: admitted.value,
    request_context_digest: admitted.digest,
    capability_selection: routeDecision,
    definition_closure: closure.value,
    definition_closure_digest: closure.digest,
    ontology_selector_lock: lock.binding_lock,
    ontology_selector_lock_digest: lock.digest,
    authority_posture: input.authority_posture ?? "candidate-context-only",
    effect_posture: input.effect_posture ?? "non-effectful",
    constraints: [...admitted.value.constraints, ...(Array.isArray(input.constraints) ? input.constraints : [])],
    exclusions: input.exclusions,
    contradictions: input.contradictions,
    gaps: input.gaps,
    residue: [
      ...(Array.isArray(input.residue) ? input.residue : []),
      ...Object.values(dependencySlots).filter((slot) => slot.disposition === "unavailable").map((slot) => ({
        kind: "context-dependency", dependency_id: slot.dependency_id, dependency_posture: slot.posture,
        disposition: slot.disposition, reason_codes: slot.reason_codes, receipt_digest: slot.receipt?.receipt_digest ?? null,
      })),
    ],
    instructions: input.instructions,
    supplemental_context_items: (input.supplemental_context_items ?? []).filter((item) => requestSelection.value.context_item_matches.some((match) => match.context_item_id === item.context_item_id)),
  }));
  if (!basis.ok) return deepFreeze({...basis, stage_trace: ["request-admission", "route", "definition-closure", "ontology-selector-lock", "context-basis"]});

  const viewInput = isRecord(input.view) ? input.view : {};
  const view = observedPhase(options, "context-window-view-binding", () => bindContextWindowView({...viewInput, basis: basis.value, basis_digest: basis.digest}));
  if (!view.ok) return deepFreeze({...view, stage_trace: ["request-admission", "route", "definition-closure", "ontology-selector-lock", "context-basis", "context-window-view"]});

  const value = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    route_decision: routeDecision,
    request_context_selection: requestSelection,
    definition_closure: closure,
    ontology_selector_lock: lock,
    necessary_context_basis: basis,
    context_window_view: view,
    ...(Object.values(dependencySlots).every((slot) => slot.disposition === "available" && slot.receipt === null)
      ? {} : {context_dependency_slots: dependencySlots}),
    stage_trace: ["request-admission", "route", "definition-closure", "ontology-selector-lock", "context-basis", "context-window-view"],
    strategy_calls: 0,
    tool_calls: 0,
    filesystem_calls: 0,
    network_calls: 0,
    model_calls: 0,
    ontology_runtime_calls: 0,
    effect_calls: 0,
    authority_effect: "none",
  });
  return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest: digestValue(value), authority_effect: "none"});
}
