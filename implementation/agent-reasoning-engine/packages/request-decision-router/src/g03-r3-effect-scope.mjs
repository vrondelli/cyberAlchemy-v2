// Temporary, exact campaign admission. This does not grant an effect: the
// ordinary protected-effect owner gate still applies after scope matching.
const SCOPE = Object.freeze({
  campaign_id: "g03-product-replication-r3",
  provider: "glm",
  selection_path: "/opt/are/evolution-runtime/g03-product-replication-r3/SELECTION.json",
  selection_sha256: "9bb2a9905ad9323366088a0e72cb9a77fbb8870440b6d0a914c7c0763441aad2",
  source_manifest_path: "/opt/are/evolution-runtime/g03-product-replication-r3/source/manifest.json",
  source_manifest_sha256: "9653ac2fc652a3c08eb822542fd619a53d21afbf22c16db5754d9d2e1f64bd4f",
  runner_sha256: "45589ea878bbf8bd523b15262e8ac32d12e3c7fcb204562aced7fd13d98c965c",
  gateway_sha256: "87fc46f5222f9002167d305cd08f90804ca1f6ad442332c8301e3359a1b3faa5",
  output_dir: "/opt/are-benchmark-runs/longmemeval-product80-20260927-r3",
  task_limit: 80,
  workers: 2,
  max_model_calls_per_task: 96,
  retries: 0,
  stop_on_failure: true,
});

export function isG03R3EffectScope(routeId, effectClasses, proposal) {
  if (routeId !== "CA2-ROUTE-IMPLEMENT") return false;
  if (!Array.isArray(effectClasses) || effectClasses.length !== 4
    || ["implementation", "persistent-mutation", "external-effect", "spend"].some((effect) => !effectClasses.includes(effect))) return false;
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) return false;
  const keys = Object.keys(SCOPE).sort();
  if (JSON.stringify(Object.keys(proposal).sort()) !== JSON.stringify(keys)) return false;
  return keys.every((key) => proposal[key] === SCOPE[key]);
}

export const G03_R3_EFFECT_SCOPE = SCOPE;
