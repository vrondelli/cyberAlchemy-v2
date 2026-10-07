import {deepFreeze} from "../../intent-route-resolver/index.mjs";
import {canonicalJson, digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CONTINUITY_CONTEXT_KEY = "cyberalchemy.are.continuity";
export const CONTINUITY_PROJECTION_SCHEMA = "are.codex-continuity-projection/v1";
export const CONTINUITY_CANDIDATE_REF = "deterministic-continuity-renderer/v4";
export const CONTINUITY_LEARNING_PACKAGE_DIGEST = "c153d59a07bf3945aff1fa2e64b23214ade0c6d307b793af602c6bf37a674b75";
export const CONTINUITY_OWNER_DECISION_DIGEST = "0727a0c4f5a6e25d3cdb107b191f6e38a448c9e7458e00ab152630ac15c8029b";

const TRANSITIONS = new Set(["continue", "refine", "interrupt", "replace", "new"]);
const RELATIONSHIPS = new Set(["engine-coordinates-cycle", "benchmark-artifact-within-cycle", "sibling-cycle-handoff", "same-cycle-continuation", "same-cycle-refinement", "temporary-interruption", "clarification-required"]);
const CONFIG_KEYS = new Set(["enabled", "mode", "candidate_ref", "learning_package_digest", "owner_decision_digest"]);
const BINDING_KEYS = new Set(["high_risk", "active_cycle", "relationship_code", "response_language", "next_action", "clarification_needed", "evidence_status"]);

const relation = {
  en: {
    "engine-coordinates-cycle": (value) => `The evolution runtime coordinates ${value}; the runtime is not itself an evolution cycle.`,
    "benchmark-artifact-within-cycle": (value) => `The benchmark is evidence inside ${value}; a score does not by itself complete the cycle.`,
    "sibling-cycle-handoff": (value) => `${value} remains the active cycle; any handoff goes to a separate sibling cycle.`,
    "same-cycle-continuation": (value) => `This continues the existing ${value} cycle.`,
    "same-cycle-refinement": (value) => `This refines the objective inside the existing ${value} cycle.`,
    "temporary-interruption": (value) => `This temporarily interrupts ${value}; its verified state remains pending for resumption.`,
    "clarification-required": (value) => `${value} remains active until the missing selection is resolved.`,
  },
  pt: {
    "engine-coordinates-cycle": (value) => `O runtime de evolução coordena ${value}; o runtime não é um ciclo de evolução.`,
    "benchmark-artifact-within-cycle": (value) => `O benchmark é evidência dentro de ${value}; uma pontuação não conclui o ciclo por si só.`,
    "sibling-cycle-handoff": (value) => `${value} continua sendo o ciclo ativo; qualquer transferência vai para outro ciclo irmão.`,
    "same-cycle-continuation": (value) => `Isto continua o ciclo ${value} existente.`,
    "same-cycle-refinement": (value) => `Isto refina o objetivo dentro do ciclo ${value} existente.`,
    "temporary-interruption": (value) => `Isto interrompe ${value} temporariamente; o estado verificado permanece pendente para retomada.`,
    "clarification-required": (value) => `${value} permanece ativo até resolver a seleção ausente.`,
  },
};

function closed(value, keys) {
  return isRecord(value) && Object.keys(value).every((key) => keys.has(key));
}

export function validContinuityRendererConfiguration(value) {
  if (!closed(value, CONFIG_KEYS) || typeof value.enabled !== "boolean") return false;
  if (value.enabled === false) return Object.keys(value).length === 1;
  return value.mode === "context-and-notification"
    && value.candidate_ref === CONTINUITY_CANDIDATE_REF
    && value.learning_package_digest === CONTINUITY_LEARNING_PACKAGE_DIGEST
    && value.owner_decision_digest === CONTINUITY_OWNER_DECISION_DIGEST;
}

export function renderDeterministicContinuity(input) {
  const allowed = new Set(["transition", "active_objective", "active_cycle", "relationship_code", "response_language", "next_action", "clarification_needed", "evidence_status"]);
  if (!closed(input, allowed) || !TRANSITIONS.has(input.transition) || !nonEmptyString(input.active_objective) || !nonEmptyString(input.active_cycle)
    || !RELATIONSHIPS.has(input.relationship_code) || !["en", "pt"].includes(input.response_language) || !nonEmptyString(input.next_action)
    || typeof input.clarification_needed !== "boolean" || !["pending", "verified-complete"].includes(input.evidence_status)) throw new Error("continuity-renderer.input-invalid");
  const questions = (input.next_action.match(/\?/gu) ?? []).length;
  if ((input.clarification_needed && questions !== 1) || (!input.clarification_needed && questions !== 0)) throw new Error("continuity-renderer.clarification-invalid");
  const posture = input.evidence_status === "verified-complete"
    ? (input.response_language === "pt" ? "A conclusão está vinculada à evidência verificada." : "Completion is bound to verified evidence.")
    : (input.response_language === "pt" ? "Nenhuma conclusão é afirmada ainda." : "No completion is claimed yet.");
  const next = input.response_language === "pt" ? `Próxima ação: ${input.next_action}` : `Next action: ${input.next_action}`;
  return deepFreeze({...input, response: `${relation[input.response_language][input.relationship_code](input.active_cycle)} ${posture} ${next}`, renderer: CONTINUITY_CANDIDATE_REF, authority_effect: "none"});
}

export function materializeContinuityProjection({configuration, resolution, engine_binding}) {
  if (!validContinuityRendererConfiguration(configuration)) return fail("continuity-renderer", ["continuity.configuration-invalid"]);
  if (configuration.enabled === false) return freezeResult({ok: true, disposition: "disabled", projection: null, authority_effect: "none"});
  if (!isRecord(resolution) || resolution.disposition !== "resolved" || !TRANSITIONS.has(resolution.transition)
    || !nonEmptyString(resolution.resolution_digest) || !nonEmptyString(resolution.next_state?.state_digest)
    || !nonEmptyString(resolution.next_state?.active_objective?.description)) return fail("continuity-renderer", ["continuity.objective-resolution-invalid"]);
  if (!closed(engine_binding, BINDING_KEYS) || typeof engine_binding.high_risk !== "boolean") return fail("continuity-renderer", ["continuity.engine-binding-invalid"]);
  if (engine_binding.high_risk === false) {
    if (Object.keys(engine_binding).length !== 1) return fail("continuity-renderer", ["continuity.low-risk-binding-not-minimal"]);
    return freezeResult({ok: true, disposition: "low-risk-bypass", projection: null, authority_effect: "none"});
  }
  let rendered;
  try {
    rendered = renderDeterministicContinuity({
      transition: resolution.transition,
      active_objective: resolution.next_state.active_objective.description,
      active_cycle: engine_binding.active_cycle,
      relationship_code: engine_binding.relationship_code,
      response_language: engine_binding.response_language,
      next_action: engine_binding.next_action,
      clarification_needed: engine_binding.clarification_needed,
      evidence_status: engine_binding.evidence_status,
    });
  } catch (error) {
    return fail("continuity-renderer", [error.message]);
  }
  const material = {
    schema_version: CONTINUITY_PROJECTION_SCHEMA,
    candidate_ref: configuration.candidate_ref,
    learning_package_digest: configuration.learning_package_digest,
    owner_decision_digest: configuration.owner_decision_digest,
    objective_resolution_digest: resolution.resolution_digest,
    objective_state_digest: resolution.next_state.state_digest,
    ...rendered,
  };
  return freezeResult({ok: true, disposition: "rendered", projection: {...material, projection_digest: digestValue(material)}, authority_effect: "none"});
}

export function addContinuityContext(message, continuity) {
  if (!continuity?.projection) return message;
  const params = isRecord(message.params) ? message.params : {};
  const additionalContext = isRecord(params.additionalContext) ? params.additionalContext : {};
  return freezeResult({...message, params: {...params, additionalContext: {...additionalContext,
    [CONTINUITY_CONTEXT_KEY]: {kind: "application", value: canonicalJson(continuity.projection)},
  }}});
}
