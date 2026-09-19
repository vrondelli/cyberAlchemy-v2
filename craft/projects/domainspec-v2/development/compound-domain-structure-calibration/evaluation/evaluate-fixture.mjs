import { buildEnvelope, sortedUniqueStrings } from "./canonical-json.mjs";
import {
  REQUIRED_PROHIBITIONS,
  logicalReceiptDigest,
  statusForFixtureOutcome,
  validateEvaluationResult,
  validateEvidenceReceipt,
} from "./validate-input.mjs";

export const EVALUATOR_VERSION = "cdsc-evaluator-v1";

export function evaluateFixture(receipt) {
  validateEvidenceReceipt(receipt);
  const semantic = receipt.semantic;
  const incomplete = hasIncompleteEvidence(semantic);
  let residueObservableIds = [];
  let residualConditions = emptyResidualConditions();
  let outcome;

  if (incomplete) {
    outcome = "INSUFFICIENT-EVIDENCE";
  } else {
    residueObservableIds = computeResidue(semantic);
    if (residueObservableIds.length === 0) {
      outcome = "EXPLAINED";
    } else {
      residualConditions = computeResidualConditions(semantic, residueObservableIds);
      outcome = Object.values(residualConditions).every(Boolean) ? "RESIDUAL-SUPPORTED" : "RUBRIC-FAIL";
    }
  }

  const resultSemantic = {
    fixture_id: semantic.fixture_id,
    residue_observable_ids: residueObservableIds,
    evidence_complete: !incomplete,
    residual_conditions: residualConditions,
    fixture_outcome: outcome,
    input_digest: logicalReceiptDigest(receipt),
    evaluator_version: EVALUATOR_VERSION,
  };
  const result = buildEnvelope({
    schemaVersion: "cdsc.evaluation-result.v1",
    contractId: "cdsc.evaluation-result",
    status: statusForFixtureOutcome(outcome),
    semantic: resultSemantic,
    prohibitedInferences: sortedUniqueStrings(
      [...new Set([...receipt.prohibited_inferences, ...REQUIRED_PROHIBITIONS])],
      "prohibited inferences",
    ),
    inputHandles: [receipt.record_id],
  });
  validateEvaluationResult(result);
  return result;
}

export function computeResidue(semantic) {
  const cells = new Map(
    semantic.sigma_matrix.map((cell) => [`${cell.explanation_id}/${cell.observable_id}`, cell]),
  );
  return semantic.Q
    .filter((observable) =>
      semantic.A.every(
        (explanation) => cells.get(`${explanation.explanation_id}/${observable.observable_id}`).state === "not-explained",
      ),
    )
    .map((observable) => observable.observable_id)
    .sort();
}

function hasIncompleteEvidence(semantic) {
  if (semantic.sigma_matrix.some((cell) => cell.state === "indeterminate" || cell.review_state === "disputed")) return true;
  if (semantic.S.permitted.observation_state === "indeterminate") return true;
  if (semantic.S.breaking.observation_state === "indeterminate") return true;
  if (semantic.reviewers.some((reviewer) => reviewer.state === "disputed")) return true;
  return semantic.U.some((uncertainty) => ["missing", "disputed", "untested"].includes(uncertainty.state));
}

function computeResidualConditions(semantic, residueObservableIds) {
  const residue = new Set(residueObservableIds);
  const boundaryInvariantSupported = semantic.Q.some(
    (observable) => residue.has(observable.observable_id) && observable.class === "invariant",
  );
  return {
    boundary_invariant_supported: boundaryInvariantSupported,
    permitted_substitution_preserved: semantic.S.permitted.observation_state === "supported",
    breaking_substitution_consequence: semantic.S.breaking.observation_state === "supported",
    usefulness_deterministic: semantic.D.deterministic,
    usefulness_nonzero: semantic.D.nonzero,
  };
}

function emptyResidualConditions() {
  return {
    boundary_invariant_supported: false,
    permitted_substitution_preserved: false,
    breaking_substitution_consequence: false,
    usefulness_deterministic: false,
    usefulness_nonzero: false,
  };
}
