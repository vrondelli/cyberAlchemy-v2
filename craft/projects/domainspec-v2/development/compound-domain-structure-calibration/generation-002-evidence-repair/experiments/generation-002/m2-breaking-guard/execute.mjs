import { runVector } from "../../../harness/baseline/run-vectors.mjs";

import { M2_CHANGED_PATHS, M2_COMMIT_DIFF } from "./mutant.mjs";

export function executeM2(manifest, baselineWitness) {
  const mutation = manifest.semantic.mutations.find((item) => item.mutation_id === "M2");
  if (!mutation) throw new TypeError("M2 missing from manifest");
  if (baselineWitness.semantic.manifest_handle !== manifest.record_id || baselineWitness.semantic.equivalent !== true) {
    throw new TypeError("baseline witness mismatch");
  }
  if (M2_CHANGED_PATHS.some((path) => !mutation.allowed_edit_surface.includes(path))) throw new TypeError("M2 edit-surface breach");
  const vectors = mutation.vector_ids.map((id) => {
    const vector = manifest.semantic.baseline_vectors.find((candidate) => candidate.vector_id === id);
    if (!vector) throw new TypeError(`M2 vector missing: ${id}`);
    return vector;
  });
  const vectorResults = vectors.map((vector) => {
    const baseline = runVector(vector);
    const mutant = runVector(vector, { bypassGuard: true });
    const comparison = mutation.observables.every((field) => Object.is(baseline[field], mutant[field])) ? "match" : "different";
    return { vector_id: vector.vector_id, baseline, mutant, comparison };
  });
  const bypassObserved = vectorResults.some(
    (result) => result.baseline.allowed === false
      && result.baseline.committed_step !== result.baseline.requested_step
      && result.mutant.committed_step === result.mutant.requested_step,
  );
  return {
    schema_version: "cdsc.mutation-run.v1",
    mutation_id: "M2",
    manifest_handle: manifest.record_id,
    baseline_witness_handle: baselineWitness.record_id,
    harness_handle: manifest.semantic.harness_digest,
    changed_paths: [...M2_CHANGED_PATHS],
    commit_diff: M2_COMMIT_DIFF,
    vector_results: vectorResults,
    observation_state: bypassObserved ? "supported" : "refuted",
  };
}
