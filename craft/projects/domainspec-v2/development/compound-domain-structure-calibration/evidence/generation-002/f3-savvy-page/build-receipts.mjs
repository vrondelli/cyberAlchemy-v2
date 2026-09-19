import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope } from "../../../evaluation/canonical-json.mjs";
import { materializeAdjudicatedF3 } from "../../../generation-002-evidence-repair/runtime/materialize-adjudicated-f3.mjs";
import { substitutionTargetDigest, validateAdjudicationOverlay } from "../../../generation-002-evidence-repair/runtime/validate-adjudication-overlay.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const parentReceipt = readJson(resolve(directory, "../../generation-001/f3-savvy-page/receipt.json"));
const permittedReceipt = readJson(resolve(directory, "../../../generation-002-evidence-repair/evidence/generation-002/m1-permitted-screen/receipt.json"));
const breakingReceipt = readJson(resolve(directory, "../../../generation-002-evidence-repair/evidence/generation-002/m2-breaking-guard/receipt.json"));

const JUDGMENTS = Object.freeze({
  "A-01": {
    permitted: ["partial", "indeterminate", "The contextual role locates route-tree coordination but does not account for the full stability-under-replacement consequence."],
    breaking: ["none", "not-explained", "A route-entry or composition-root role does not account for the consequence of bypassing the guard result."],
  },
  "A-02": {
    permitted: ["partial", "indeterminate", "The guard Rule accounts for guard stability but not the full route-coordination and child-replacement consequence."],
    breaking: ["full", "explained", "The guard Rule directly accounts for why bypassing its redirect result makes blocked or premature requests reach a different destination."],
  },
  "A-03": {
    permitted: ["partial", "indeterminate", "Sequencing accounts for stable route coordination but not the full child-replacement consequence."],
    breaking: ["full", "explained", "Sequencing the guard result before the committed state directly accounts for the destination change when requested step is committed instead."],
  },
  "A-04": {
    permitted: ["partial", "indeterminate", "Rendered-child aggregation accounts for replacing the selected child but not the full guard and route-coordination stability consequence."],
    breaking: ["none", "not-explained", "Rendered-child aggregation does not account for bypassing navigation guard commitment."],
  },
  "A-05": {
    permitted: ["none", "not-explained", "Pattern pressure motivates the permitted test but does not account for its preregistered consequence."],
    breaking: ["none", "not-explained", "Pattern pressure motivates the breaking test but does not account for its preregistered consequence."],
  },
  "A-06": {
    permitted: ["partial", "indeterminate", "Named-instance behavior describes local screen and journey details but does not fully account for stability under adapter substitution."],
    breaking: ["partial", "indeterminate", "Named-instance behavior describes the local destination change but does not fully account for the guard-bypass relation."],
  },
});

const PROHIBITIONS = Object.freeze([
  "candidate-promotion",
  "ds-d1-formation",
  "ds-d8-authority",
  "identity",
  "irreducibility",
  "pattern-admission",
  "portability",
]);

export function buildAdjudicationArtifacts({ createdAt = "2026-07-12T13:42:57Z" } = {}) {
  const observations = { permitted: permittedReceipt, breaking: breakingReceipt };
  const substitutions = { permitted: parentReceipt.semantic.S.permitted, breaking: parentReceipt.semantic.S.breaking };
  const mutationIds = { permitted: "M1", breaking: "M2" };
  const overlaySemantic = {
    fixture_id: "F3",
    baseline_receipt_handle: parentReceipt.record_id,
    baseline_generation_id: parentReceipt.generation_id,
    observation_bindings: ["permitted", "breaking"].map((kind) => ({
      substitution_kind: kind,
      substitution_id: substitutions[kind].substitution_id,
      mutation_id: mutationIds[kind],
      observation_receipt_handle: observations[kind].record_id,
    })),
    adjudication_matrix: parentReceipt.semantic.A.flatMap((explanation) =>
      ["permitted", "breaking"].map((kind) => {
        const [coverage, state, rationale] = JUDGMENTS[explanation.explanation_id][kind];
        return {
          explanation_id: explanation.explanation_id,
          substitution_id: substitutions[kind].substitution_id,
          coverage,
          state,
          target_provenance: {
            source: "parent-substitution",
            baseline_receipt_handle: parentReceipt.record_id,
            source_field: `semantic.S.${kind}`,
            target_digest: substitutionTargetDigest(substitutions[kind]),
          },
          evidence_handles: [observations[kind].record_id],
          rationale,
          review_state: "approved",
        };
      }),
    ),
    usefulness_adjudication: {
      state: "retained",
      ...structuredClone(parentReceipt.semantic.D),
      rationale: "The mutation observations resolve the substitution gaps but do not cure incomplete direct route and content attestation, so the parent usefulness decision remains unchanged.",
      evidence_handles: [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id],
    },
    uncertainty_resolutions: [
      {
        parent_uncertainty_id: "F3-U-01",
        state: "resolved",
        evidence_handles: [permittedReceipt.record_id],
        rationale: "M1 provides the bounded permitted screen-replacement observation.",
      },
      {
        parent_uncertainty_id: "F3-U-02",
        state: "resolved",
        evidence_handles: [breakingReceipt.record_id],
        rationale: "M2 provides the bounded breaking guard-bypass observation.",
      },
    ],
    carried_uncertainty: [
      structuredClone(parentReceipt.semantic.U.find((item) => item.uncertainty_id === "F3-U-03")),
      ...permittedReceipt.semantic.uncertainty.map((statement, index) => ({
        uncertainty_id: `F3-U-M1-${index + 1}`,
        state: "non-portable",
        statement,
      })),
      ...breakingReceipt.semantic.uncertainty.map((statement, index) => ({
        uncertainty_id: `F3-U-M2-${index + 1}`,
        state: "non-portable",
        statement,
      })),
    ],
    reviewers: [{ reviewer_id: "task-session-local-reviewer", state: "approved" }],
  };

  const overlay = buildEnvelope({
    schemaVersion: "cdsc.adjudication-overlay.v1",
    contractId: "cdsc.adjudication-overlay",
    status: "frozen",
    semantic: overlaySemantic,
    prohibitedInferences: PROHIBITIONS,
    inputHandles: [parentReceipt.record_id, permittedReceipt.record_id, breakingReceipt.record_id],
    createdAt,
    storagePath: "evidence/generation-002/f3-savvy-page/adjudication-overlay.json",
  });
  validateAdjudicationOverlay(overlay, { parentReceipt, permittedReceipt, breakingReceipt });

  const compatibilityReceipt = materializeAdjudicatedF3(
    { overlay, parentReceipt, permittedReceipt, breakingReceipt },
    {
      createdAt,
      storagePath: "evidence/generation-002/f3-savvy-page/compatibility-receipt.json",
    },
  );
  return { overlay, compatibilityReceipt, parentReceipt, permittedReceipt, breakingReceipt };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { overlay, compatibilityReceipt } = buildAdjudicationArtifacts();
  writeFileSync(resolve(directory, "adjudication-overlay.json"), `${JSON.stringify(overlay, null, 2)}\n`);
  writeFileSync(resolve(directory, "compatibility-receipt.json"), `${JSON.stringify(compatibilityReceipt, null, 2)}\n`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
