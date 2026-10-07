import {deepFreeze} from "../../intent-route-resolver/index.mjs";

const TRANSITIONS = new Set(["continue", "refine", "interrupt", "replace", "new"]);
const RELATIONSHIPS = new Set(["engine-coordinates-cycle", "benchmark-artifact-within-cycle", "sibling-cycle-handoff", "same-cycle-continuation", "same-cycle-refinement", "temporary-interruption", "clarification-required"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;

const relation = {
  en: {
    "engine-coordinates-cycle": (x) => `The evolution runtime coordinates ${x}; the runtime is not itself an evolution cycle.`,
    "benchmark-artifact-within-cycle": (x) => `The benchmark is evidence inside ${x}; a score does not by itself complete the cycle.`,
    "sibling-cycle-handoff": (x) => `${x} remains the active cycle; any handoff goes to a separate sibling cycle.`,
    "same-cycle-continuation": (x) => `This continues the existing ${x} cycle.`,
    "same-cycle-refinement": (x) => `This refines the objective inside the existing ${x} cycle.`,
    "temporary-interruption": (x) => `This temporarily interrupts ${x}; its verified state remains pending for resumption.`,
    "clarification-required": (x) => `${x} remains active until the missing selection is resolved.`,
  },
  pt: {
    "engine-coordinates-cycle": (x) => `O runtime de evolução coordena ${x}; o runtime não é um ciclo de evolução.`,
    "benchmark-artifact-within-cycle": (x) => `O benchmark é evidência dentro de ${x}; uma pontuação não conclui o ciclo por si só.`,
    "sibling-cycle-handoff": (x) => `${x} continua sendo o ciclo ativo; qualquer transferência vai para outro ciclo irmão.`,
    "same-cycle-continuation": (x) => `Isto continua o ciclo ${x} existente.`,
    "same-cycle-refinement": (x) => `Isto refina o objetivo dentro do ciclo ${x} existente.`,
    "temporary-interruption": (x) => `Isto interrompe ${x} temporariamente; o estado verificado permanece pendente para retomada.`,
    "clarification-required": (x) => `${x} permanece ativo até resolver a seleção ausente.`,
  },
};

export function renderDeterministicContinuity(input) {
  const allowed = ["transition", "active_objective", "active_cycle", "relationship_code", "response_language", "next_action", "clarification_needed", "evidence_status"];
  if (!object(input) || !Object.keys(input).every((key) => allowed.includes(key)) || !TRANSITIONS.has(input.transition) || !text(input.active_objective) || !text(input.active_cycle) || !RELATIONSHIPS.has(input.relationship_code) || !["en", "pt"].includes(input.response_language) || !text(input.next_action) || typeof input.clarification_needed !== "boolean" || !["pending", "verified-complete"].includes(input.evidence_status)) throw new Error("continuity-renderer.input-invalid");
  const questions = (input.next_action.match(/\?/g) ?? []).length;
  if ((input.clarification_needed && questions !== 1) || (!input.clarification_needed && questions !== 0)) throw new Error("continuity-renderer.clarification-invalid");
  const posture = input.evidence_status === "verified-complete"
    ? (input.response_language === "pt" ? "A conclusão está vinculada à evidência verificada." : "Completion is bound to verified evidence.")
    : (input.response_language === "pt" ? "Nenhuma conclusão é afirmada ainda." : "No completion is claimed yet.");
  const next = input.response_language === "pt" ? `Próxima ação: ${input.next_action}` : `Next action: ${input.next_action}`;
  return deepFreeze({...input, response:`${relation[input.response_language][input.relationship_code](input.active_cycle)} ${posture} ${next}`, renderer:"deterministic-continuity-renderer/v4", authority_effect:"none"});
}
