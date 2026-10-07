import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {admitDecisionProfile, loadVerifiedRepositoryPolicyBundle} from "../../request-decision-router/index.mjs";
import {deepFreeze, digestValue, fail, freezeResult, isRecord} from "./canonical.mjs";
import {loadRepositoryProfile} from "./config.mjs";

export const REPOSITORY_RUNTIME_BUNDLE_SCHEMA = "are.repository-runtime-bundle/v1";

function bundleMaterial(bundle) {
  const value = structuredClone(bundle);
  delete value.bundle_digest;
  return value;
}

export function computeRepositoryRuntimeBundleDigest(bundle) {
  return digestValue(bundleMaterial(bundle));
}

function portableProfile(value) {
  const profile = structuredClone(value);
  if (profile.reasoning_state?.log_path) profile.reasoning_state.log_path = ".runtime/reasoning-state.jsonl";
  if (profile.gateway?.reasoning_state?.directory) profile.gateway.reasoning_state.directory = ".runtime/reasoning-state";
  if (profile.gateway?.session_store?.path) profile.gateway.session_store.path = ".runtime/gateway-sessions.jsonl";
  return profile;
}

function runtimeProfile(value, runtimeRoot) {
  const profile = structuredClone(value);
  if (profile.reasoning_state?.log_path) profile.reasoning_state.log_path = resolve(runtimeRoot, profile.reasoning_state.log_path);
  if (profile.gateway?.reasoning_state?.directory) profile.gateway.reasoning_state.directory = resolve(runtimeRoot, profile.gateway.reasoning_state.directory);
  if (profile.gateway?.session_store?.path) profile.gateway.session_store.path = resolve(runtimeRoot, profile.gateway.session_store.path);
  return profile;
}

export function compileRepositoryRuntimeBundle({profile_path, policy_bundle_path, repository_root, bundle_id = "cyberalchemy.repository-runtime/v1"}) {
  const loaded = loadRepositoryProfile(profile_path, repository_root);
  if (!loaded.ok) return loaded;
  const policy = loadVerifiedRepositoryPolicyBundle(policy_bundle_path);
  if (!policy.ok) return policy;
  if (policy.value.profile_digest !== loaded.decision_profile.profile_digest) return fail("runtime-bundle", ["runtime-bundle.policy-context-profile-mismatch"]);
  const sourceEpochDigest = digestValue({decision_profile_digest: loaded.decision_profile.profile_digest, source_snapshot: loaded.source_snapshot});
  const material = {
    schema_version: REPOSITORY_RUNTIME_BUNDLE_SCHEMA,
    bundle_id,
    policy_bundle_digest: policy.bundle_digest,
    decision_profile_digest: loaded.decision_profile.profile_digest,
    source_epoch_digest: sourceEpochDigest,
    runtime_profile: portableProfile(loaded.value),
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    instructions: loaded.instructions,
    supplemental_context_items: loaded.supplemental_context_items,
    source_snapshot: loaded.source_snapshot,
    semantic_profile: loaded.semantic_profile,
    authority_effect: "none",
  };
  return freezeResult({ok: true, value: {...material, bundle_digest: computeRepositoryRuntimeBundleDigest(material)}});
}

export function loadVerifiedRepositoryRuntimeBundle(bundlePath, options = {}) {
  let bundle;
  try { bundle = JSON.parse(readFileSync(bundlePath, "utf8")); }
  catch { return fail("runtime-bundle", ["runtime-bundle.unreadable"]); }
  const reasons = [];
  if (!isRecord(bundle) || bundle.schema_version !== REPOSITORY_RUNTIME_BUNDLE_SCHEMA) reasons.push("runtime-bundle.schema-version-invalid");
  if (bundle?.authority_effect !== "none") reasons.push("runtime-bundle.authority-effect-forbidden");
  if (bundle?.bundle_digest !== computeRepositoryRuntimeBundleDigest(bundle)) reasons.push("runtime-bundle.digest-mismatch");
  const admitted = admitDecisionProfile(bundle?.decision_profile);
  if (!admitted.ok) reasons.push(...admitted.reason_codes);
  if (admitted.ok && admitted.value.profile_digest !== bundle?.decision_profile_digest) reasons.push("runtime-bundle.profile-digest-mismatch");
  const policy = loadVerifiedRepositoryPolicyBundle(options.policy_bundle_path
    ?? new URL("../../request-decision-router/profiles/cyberalchemy-route-pack-v1.json", import.meta.url));
  if (!policy.ok) reasons.push("runtime-bundle.policy-bundle-unverified");
  else {
    if (policy.bundle_digest !== bundle?.policy_bundle_digest) reasons.push("runtime-bundle.policy-bundle-digest-mismatch");
    if (admitted.ok && digestValue(policy.value) !== digestValue(admitted.value)) {
      reasons.push("runtime-bundle.policy-profile-mismatch");
    }
  }
  const expectedEpoch = digestValue({decision_profile_digest: bundle?.decision_profile_digest, source_snapshot: bundle?.source_snapshot});
  if (bundle?.source_epoch_digest !== expectedEpoch) reasons.push("runtime-bundle.source-epoch-mismatch");
  for (const field of ["runtime_profile", "definition_catalog", "ontology_snapshot"]) if (!isRecord(bundle?.[field])) reasons.push(`runtime-bundle.${field.replaceAll("_", "-")}-required`);
  for (const field of ["instructions", "supplemental_context_items", "source_snapshot"]) if (!Array.isArray(bundle?.[field])) reasons.push(`runtime-bundle.${field.replaceAll("_", "-")}-required`);
  if (reasons.length) return fail("runtime-bundle", reasons);
  const runtimeRoot = resolve(options.runtime_root ?? dirname(bundlePath), options.runtime_subdirectory ?? "..");
  // Verification is an in-process identity mark. Canonicalizing this envelope
  // would clone the policy-verified profile and make every bundled turn fail closed.
  const fixedContext = deepFreeze({ok: true, decision_profile: policy.value, definition_catalog: bundle.definition_catalog, ontology_snapshot: bundle.ontology_snapshot,
    instructions: bundle.instructions, supplemental_context_items: bundle.supplemental_context_items, source_snapshot: bundle.source_snapshot, authority_effect: "none"});
  return Object.freeze({
    ok: true,
    value: freezeResult(runtimeProfile(bundle.runtime_profile, runtimeRoot)),
    decision_profile: policy.value,
    definition_catalog: bundle.definition_catalog,
    ontology_snapshot: bundle.ontology_snapshot,
    instructions: bundle.instructions,
    supplemental_context_items: bundle.supplemental_context_items,
    source_snapshot: bundle.source_snapshot,
    context_source_provider: () => fixedContext,
    semantic_profile: bundle.semantic_profile === null ? null : freezeResult(bundle.semantic_profile),
    bundle_digest: bundle.bundle_digest,
    policy_bundle_digest: bundle.policy_bundle_digest,
    source_epoch_digest: bundle.source_epoch_digest,
    source_mode: "product-bundle",
    authority_effect: "none",
  });
}
