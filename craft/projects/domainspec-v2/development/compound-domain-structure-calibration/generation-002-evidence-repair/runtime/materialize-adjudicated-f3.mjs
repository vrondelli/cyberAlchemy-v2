import { buildEnvelope } from "../../evaluation/canonical-json.mjs";
import { validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";
import { validateAdjudicationOverlay } from "./validate-adjudication-overlay.mjs";

const EVALUATION_OBSERVABLES = Object.freeze({
  permitted: "Q-06",
  breaking: "Q-07",
});

export function materializeAdjudicatedF3(
  { overlay, parentReceipt, permittedReceipt, breakingReceipt },
  { createdAt, storagePath } = {},
) {
  validateAdjudicationOverlay(overlay, { parentReceipt, permittedReceipt, breakingReceipt });
  const parent = parentReceipt.semantic;
  const bindings = new Map(overlay.semantic.observation_bindings.map((item) => [item.substitution_kind, item]));
  const observations = { permitted: permittedReceipt, breaking: breakingReceipt };
  const substitutions = { permitted: parent.S.permitted, breaking: parent.S.breaking };

  const baseObservables = parent.Q.filter((item) => item.observable_id !== "Q-06").map(structuredClone);
  const derivedObservables = ["permitted", "breaking"].map((kind) => ({
    observable_id: EVALUATION_OBSERVABLES[kind],
    class: "substitution",
    statement: targetStatement(substitutions[kind]),
    selectors: structuredClone(substitutions[kind].selectors),
  }));

  const baseMatrix = parent.sigma_matrix.filter((cell) => cell.observable_id !== "Q-06").map(structuredClone);
  const bindingKindBySubstitution = new Map([...bindings.entries()].map(([kind, binding]) => [binding.substitution_id, kind]));
  const derivedMatrix = [...overlay.semantic.adjudication_matrix]
    .sort((left, right) => `${left.explanation_id}/${left.substitution_id}`.localeCompare(`${right.explanation_id}/${right.substitution_id}`))
    .map((cell) => {
      const kind = bindingKindBySubstitution.get(cell.substitution_id);
      return {
        explanation_id: cell.explanation_id,
        observable_id: EVALUATION_OBSERVABLES[kind],
        state: cell.state,
        selectors: structuredClone(substitutions[kind].selectors),
        rationale: cell.rationale,
        review_state: cell.review_state,
      };
    });

  const semantic = {
    fixture_id: "F3",
    G: structuredClone(parent.G),
    A: structuredClone(parent.A),
    Q: [...baseObservables, ...derivedObservables],
    sigma_matrix: [...baseMatrix, ...derivedMatrix],
    S: {
      permitted: {
        ...structuredClone(parent.S.permitted),
        observation_state: observations.permitted.semantic.observation_state,
      },
      breaking: {
        ...structuredClone(parent.S.breaking),
        observation_state: observations.breaking.semantic.observation_state,
      },
    },
    D: materializeUsefulness(overlay.semantic.usefulness_adjudication),
    U: materializeUncertainty(overlay.semantic, parent),
    reviewers: [...overlay.semantic.reviewers].map(structuredClone).sort((left, right) => left.reviewer_id.localeCompare(right.reviewer_id)),
  };

  const receipt = buildEnvelope({
    schemaVersion: "cdsc.evidence-receipt.v1",
    contractId: "cdsc.evidence-receipt",
    status: "frozen",
    semantic,
    prohibitedInferences: [...new Set([
      ...parentReceipt.prohibited_inferences,
      ...permittedReceipt.prohibited_inferences,
      ...breakingReceipt.prohibited_inferences,
      ...overlay.prohibited_inferences,
    ])],
    predecessorGenerationId: parentReceipt.generation_id,
    inputHandles: [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id, overlay.record_id],
    createdAt,
    storagePath,
  });
  validateEvidenceReceipt(receipt);
  return receipt;
}

export function targetStatement(substitution) {
  return `Planned substitution: ${substitution.description} Predicted consequence: ${substitution.prediction}`;
}

function materializeUsefulness(adjudication) {
  return {
    baseline_decision: adjudication.baseline_decision,
    residual_decision: adjudication.residual_decision,
    deterministic: adjudication.deterministic,
    nonzero: adjudication.nonzero,
    selectors: structuredClone(adjudication.selectors),
  };
}

function materializeUncertainty(semantic, parent) {
  const resolutions = new Map(semantic.uncertainty_resolutions.map((item) => [item.parent_uncertainty_id, item]));
  const carried = new Map(semantic.carried_uncertainty.map((item) => [item.uncertainty_id, item]));
  const parentIds = new Set(parent.U.map((item) => item.uncertainty_id));
  const result = [];
  for (const uncertainty of parent.U) {
    const resolution = resolutions.get(uncertainty.uncertainty_id);
    if (resolution?.state === "resolved") continue;
    if (resolution?.state === "disputed") result.push({ ...structuredClone(uncertainty), state: "disputed" });
    else if (resolution?.state === "retained") result.push(structuredClone(uncertainty));
    else result.push(structuredClone(carried.get(uncertainty.uncertainty_id)));
  }
  for (const item of carried.values()) if (!parentIds.has(item.uncertainty_id)) result.push(structuredClone(item));
  return result.sort((left, right) => left.uncertainty_id.localeCompare(right.uncertainty_id));
}

function structuredClone(value) {
  return globalThis.structuredClone(value);
}
