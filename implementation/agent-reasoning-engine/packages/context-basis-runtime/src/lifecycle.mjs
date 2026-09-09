import {canonicalizeJson, deepFreeze, digestValue, fail, isRecord} from "./canonical.mjs";
import {composeContextBasis} from "./compose.mjs";
import {bindContextWindowView} from "./context-window-view.mjs";
import {assembleContextEnvelope, reuseContextEnvelopeProjection} from "./context-envelope.mjs";
import {assessContextRefresh} from "./context-refresh.mjs";

const SCHEMA_VERSION = "are.context-lifecycle-composition/v1";

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

function withView(composition, view) {
  const value = canonicalizeJson({...composition.value, context_window_view: view});
  return deepFreeze({schema_version: composition.schema_version, ok: true, value, digest: digestValue(value), authority_effect: "none"});
}

export function composeContextLifecycle(input, options = {}) {
  if (!isRecord(input)) return fail("context-lifecycle", ["lifecycle.input-required"]);
  const viewInput = isRecord(input.view) ? input.view : {};
  let composition = composeContextBasis({...input, view: {...viewInput, reuse_predicate: null}}, options);
  if (!composition.ok) return deepFreeze({schema_version: SCHEMA_VERSION, ok: false, stage: "context-basis", composition, authority_effect: "none"});
  const refresh = observedPhase(options, "context-refresh-assessment", () => assessContextRefresh(input.previous_envelope ?? null, composition, input.current_sources ?? []));
  if (!refresh.ok) return deepFreeze({schema_version: SCHEMA_VERSION, ok: false, stage: "context-refresh", composition, refresh_assessment: refresh, authority_effect: "none"});

  if (viewInput.lane === "plan-bound" && refresh.value.reuse_allowed === true && isRecord(viewInput.predecessor_view)) {
    const basis = composition.value.necessary_context_basis;
    const rebound = observedPhase(options, "context-window-view-rebind", () => bindContextWindowView({...viewInput, basis: basis.value, basis_digest: basis.digest, reuse_predicate: {equal: true, current: true, digest: refresh.digest}}));
    if (!rebound.ok) return deepFreeze({schema_version: SCHEMA_VERSION, ok: false, stage: "context-window-view", composition, refresh_assessment: refresh, authority_effect: "none"});
    composition = withView(composition, rebound);
  }

  const projectionPolicy = input.projection_policy ?? {};
  const interactionProjectionReuse = viewInput.lane === "interaction-bound"
    && projectionPolicy.reuse_compatible_interaction_projection !== false
    && refresh.value.reuse_allowed === true
    && isRecord(input.previous_envelope);
  const freshnessState = interactionProjectionReuse
    ? "successor-current-reused-projection"
    : refresh.value.disposition === "reuse-current" ? "current-reused" : "successor-current";
  let envelope = interactionProjectionReuse
    ? observedPhase(options, "context-projection-reuse", () => reuseContextEnvelopeProjection(input.previous_envelope, composition, {...projectionPolicy, current_sources: input.current_sources ?? [], freshness_state: freshnessState}))
    : null;
  if (!envelope?.ok) {
    envelope = observedPhase(options, "context-envelope-assembly", () => assembleContextEnvelope(composition, {...projectionPolicy, current_sources: input.current_sources ?? [], freshness_state: interactionProjectionReuse ? "successor-current" : freshnessState}));
  }
  if (!envelope.ok) return deepFreeze({schema_version: SCHEMA_VERSION, ok: false, stage: "context-envelope", composition, refresh_assessment: refresh, context_envelope: envelope, authority_effect: "none"});
  const value = {schema_version: SCHEMA_VERSION, composition, refresh_assessment: refresh, context_envelope: envelope, authority_effect: "none"};
  const digest = observedPhase(options, "context-lifecycle-seal", () => digestValue({composition_digest: composition.digest, refresh_digest: refresh.digest, context_envelope_digest: envelope.digest}));
  return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest, authority_effect: "none"});
}
