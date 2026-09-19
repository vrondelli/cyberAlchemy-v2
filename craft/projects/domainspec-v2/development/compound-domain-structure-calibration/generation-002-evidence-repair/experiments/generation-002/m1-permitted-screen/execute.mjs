import { runVector } from "../../../harness/baseline/run-vectors.mjs";
import { SCREEN_REGISTRY } from "../../../harness/baseline/screen-registry.mjs";

import { createM1Registry, M1_CHANGED_PATHS } from "./mutant.mjs";

export function executeM1(manifest, baselineWitness) {
  const mutation = manifest.semantic.mutations.find((item) => item.mutation_id === "M1");
  if (!mutation) throw new TypeError("M1 missing from manifest");
  if (baselineWitness.semantic.manifest_handle !== manifest.record_id || baselineWitness.semantic.equivalent !== true) {
    throw new TypeError("baseline witness mismatch");
  }
  if (M1_CHANGED_PATHS.some((path) => !mutation.allowed_edit_surface.includes(path))) throw new TypeError("M1 edit-surface breach");
  const registry = createM1Registry();
  const baselineAdapter = SCREEN_REGISTRY["9"];
  const mutantAdapter = registry["9"];
  if (baselineAdapter.implementation === mutantAdapter.implementation) throw new TypeError("M1 adapter must be behaviorally distinct");
  if (baselineAdapter.screen_key !== mutantAdapter.screen_key) throw new TypeError("M1 screen key drift");
  if (JSON.stringify(baselineAdapter.ports) !== JSON.stringify(mutantAdapter.ports)) throw new TypeError("M1 port drift");

  const vectors = mutation.vector_ids.map((id) => {
    const vector = manifest.semantic.baseline_vectors.find((candidate) => candidate.vector_id === id);
    if (!vector) throw new TypeError(`M1 vector missing: ${id}`);
    return vector;
  });
  const vectorResults = vectors.map((vector) => {
    const baseline = runVector(vector);
    const mutant = runVector(vector, { registry });
    const comparison = mutation.observables.every((field) => Object.is(baseline[field], mutant[field])) ? "match" : "different";
    return { vector_id: vector.vector_id, baseline, mutant, comparison };
  });
  const observationState = vectorResults.every((result) => result.comparison === "match") ? "supported" : "refuted";
  return {
    schema_version: "cdsc.mutation-run.v1",
    mutation_id: "M1",
    manifest_handle: manifest.record_id,
    baseline_witness_handle: baselineWitness.record_id,
    harness_handle: manifest.semantic.harness_digest,
    changed_paths: [...M1_CHANGED_PATHS],
    adapter_diff: {
      before: baselineAdapter,
      after: mutantAdapter,
    },
    vector_results: vectorResults,
    observation_state: observationState,
  };
}
