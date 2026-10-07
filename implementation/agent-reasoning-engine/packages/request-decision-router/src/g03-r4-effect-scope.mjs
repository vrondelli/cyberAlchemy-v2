// Owner-approved, exact GLM r4 campaign boundary. Scope matching does not
// itself authorize dispatch; the protected-effect owner gate remains active.
const SCOPE = Object.freeze({
  campaign_id: "g03-product-replication-r4",
  provider: "glm",
  selection_path: "/opt/are/evolution-runtime/g03-product-replication-r4/SELECTION.json",
  selection_sha256: "16632e2084af68612281e6d6a38d521ae25ff096133f1f4d385ec41a3ef71792",
  source_manifest_path: "/opt/are/evolution-runtime/g03-product-replication-r4/source/manifest.json",
  source_manifest_sha256: "f5ca500e10d593203d912c40ed7a97a2242482c212b40ba49fd3f0cab19cb6f2",
  runner_sha256: "a9a1dd322345ecca4b0645f54f2cb1595ae8aaf39502593fabf2cf3707084014",
  gateway_sha256: "87fc46f5222f9002167d305cd08f90804ca1f6ad442332c8301e3359a1b3faa5",
  output_dir: "/opt/are-benchmark-runs/longmemeval-product80-20260928-r4",
  task_limit: 80,
  workers: 2,
  max_model_calls_per_task: 96,
  retries: 0,
  provider_refusal_code: "1301",
  provider_refusal_scoring: "both-arms-incorrect",
  fail_fast_other_errors: true,
});

export function isG03R4EffectScope(routeId, effectClasses, proposal) {
  if (routeId !== "CA2-ROUTE-IMPLEMENT") return false;
  if (!Array.isArray(effectClasses) || effectClasses.length !== 4
    || ["implementation", "persistent-mutation", "external-effect", "spend"].some(effect => !effectClasses.includes(effect))) return false;
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) return false;
  const keys = Object.keys(SCOPE).sort();
  if (JSON.stringify(Object.keys(proposal).sort()) !== JSON.stringify(keys)) return false;
  return keys.every(key => proposal[key] === SCOPE[key]);
}

export const G03_R4_EFFECT_SCOPE = SCOPE;
