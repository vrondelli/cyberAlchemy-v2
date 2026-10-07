import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {canonicalJson, canonicalizeJson, deepFreeze, sha256HexText} from "../../intent-route-resolver/index.mjs";
import {admitDecisionProfile} from "./profile.mjs";
import {loadVerifiedDecisionProfile} from "./profile-loader.mjs";
import {markVerifiedDecisionProfile} from "./verified-profile.mjs";

export const REPOSITORY_POLICY_BUNDLE_SCHEMA = "are.repository-policy-bundle/v2";
const LEGACY_REPOSITORY_POLICY_BUNDLE_SCHEMA = "are.repository-policy-bundle/v1";

function material(bundle) {
  const value = {...bundle};
  delete value.bundle_digest;
  return canonicalizeJson(value);
}

export function computeRepositoryPolicyBundleDigest(bundle) {
  return sha256HexText(canonicalJson(material(bundle)));
}

export function compileRepositoryPolicyBundle(profilePath, repositoryRoot, options = {}) {
  const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
  if (!loaded.ok) return loaded;
  const registrySource = loaded.value.provenance.find((source) => source.id === "route-registry");
  if (!registrySource) return deepFreeze({ok: false, reason_codes: ["policy-bundle.route-registry-provenance-required"]});
  let registry;
  try { registry = JSON.parse(readFileSync(resolve(repositoryRoot, registrySource.path), "utf8")); }
  catch (error) { return deepFreeze({ok: false, reason_codes: [`policy-bundle.route-registry-unavailable:${error.code ?? error.name}`]}); }
  const bundle = canonicalizeJson({
    schema_version: REPOSITORY_POLICY_BUNDLE_SCHEMA,
    bundle_id: options.bundle_id ?? "cyberalchemy.repository-policy/v1",
    profile_id: loaded.value.profile_id,
    profile_digest: loaded.value.profile_digest,
    decision_profile: loaded.value,
    route_contracts: registry.routes.map((route) => {
      const policy = loaded.value.routes.find((candidate) => candidate.route_id === route.route_id);
      return canonicalizeJson({...route, enforcement: {
        permitted_effect_classes: policy?.effect_classes ?? [],
        prerequisites: route.read_first ?? [],
        blockers: (route.blockers ?? []).map((blocker) => ({kind: "registry-blocker", detail: blocker})),
        owner_evidence_required: route.requires_user_authorization === true || policy?.owner_gate_ref !== null,
        owner_gate_ref: policy?.owner_gate_ref ?? null,
        write_ceiling: route.write_ceiling,
      }});
    }),
    provenance: loaded.value.provenance,
    authority_effect: "none",
  });
  return deepFreeze({ok: true, value: {...bundle, bundle_digest: computeRepositoryPolicyBundleDigest(bundle)}});
}

export function loadVerifiedRepositoryPolicyBundle(bundlePath) {
  let bundle;
  try { bundle = JSON.parse(readFileSync(bundlePath, "utf8")); }
  catch (error) { return deepFreeze({ok: false, reason_codes: [`policy-bundle.load-failed:${error.code ?? error.name}`]}); }
  const reasons = [];
  if (![REPOSITORY_POLICY_BUNDLE_SCHEMA, LEGACY_REPOSITORY_POLICY_BUNDLE_SCHEMA].includes(bundle?.schema_version)) reasons.push("policy-bundle.schema-version-invalid");
  if (bundle?.authority_effect !== "none") reasons.push("policy-bundle.authority-effect-forbidden");
  if (typeof bundle?.bundle_digest !== "string" || computeRepositoryPolicyBundleDigest(bundle) !== bundle.bundle_digest) reasons.push("policy-bundle.digest-mismatch");
  if (!Array.isArray(bundle?.route_contracts) || bundle.route_contracts.length === 0) reasons.push("policy-bundle.route-contracts-required");
  if (bundle?.schema_version === REPOSITORY_POLICY_BUNDLE_SCHEMA) {
    for (const route of bundle?.route_contracts ?? []) {
      if (!route?.enforcement || !Array.isArray(route.enforcement.permitted_effect_classes) || !Array.isArray(route.enforcement.prerequisites) || !Array.isArray(route.enforcement.blockers)
        || typeof route.enforcement.owner_evidence_required !== "boolean" || typeof route.enforcement.write_ceiling !== "string") reasons.push(`policy-bundle.route-enforcement-invalid:${route?.route_id ?? "unknown"}`);
    }
  }
  const admitted = admitDecisionProfile(bundle?.decision_profile);
  if (!admitted.ok) reasons.push(...admitted.reason_codes);
  if (admitted.ok && admitted.value.profile_digest !== bundle.profile_digest) reasons.push("policy-bundle.profile-digest-mismatch");
  const routeIds = new Set((bundle?.route_contracts ?? []).map((route) => route?.route_id));
  for (const route of admitted.ok ? admitted.value.routes ?? [] : []) {
    if (!routeIds.has(route.route_id)) reasons.push(`policy-bundle.route-contract-missing:${route.route_id}`);
  }
  if (reasons.length > 0) return deepFreeze({ok: false, reason_codes: [...new Set(reasons)].sort()});
  const profile = deepFreeze(admitted.value);
  markVerifiedDecisionProfile(profile);
  return deepFreeze({ok: true, value: profile, route_contracts: canonicalizeJson(bundle.route_contracts), bundle_digest: bundle.bundle_digest, bundle_id: bundle.bundle_id});
}
