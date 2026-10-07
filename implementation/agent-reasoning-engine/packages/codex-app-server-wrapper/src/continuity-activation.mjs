import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {isAbsolute, relative, resolve} from "node:path";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";
import {createContinuityBindingProvider, resolveContinuityBindingProvider, validateContinuityBindingSnapshot} from "./continuity-binding-provider.mjs";
import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_OWNER_DECISION_DIGEST,
  validContinuityRendererConfiguration,
} from "./continuity-renderer.mjs";

export const CONTINUITY_ACTIVATION_MANIFEST_SCHEMA = "are.continuity-activation-manifest/v1";
export const CONTINUITY_ACTIVATION_RECEIPT_SCHEMA = "are.continuity-activation-receipt/v1";

const DIGEST = /^[a-f0-9]{64}$/u;
const MANIFEST_KEYS = new Set(["schema_version", "activation_id", "active_version_ref", "artifacts", "objective_resolution", "renderer_configuration", "authority_effect", "manifest_digest"]);
const ARTIFACTS_KEYS = new Set(["serving_pointer", "activation_package", "provider_package", "continuity_snapshot"]);
const BINDING_KEYS = new Set(["path", "sha256", "document_digest"]);
const RENDERER_CONFIGURATION = Object.freeze({
  enabled: true,
  mode: "context-and-notification",
  candidate_ref: CONTINUITY_CANDIDATE_REF,
  learning_package_digest: CONTINUITY_LEARNING_PACKAGE_DIGEST,
  owner_decision_digest: CONTINUITY_OWNER_DECISION_DIGEST,
});

const closed = (value, keys) => isRecord(value) && Object.keys(value).every((key) => keys.has(key));
const rawDigest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function safeRepositoryPath(repositoryRoot, path) {
  if (!nonEmptyString(path) || isAbsolute(path)) return null;
  const root = resolve(repositoryRoot);
  const target = resolve(root, path);
  const relation = relative(root, target);
  return relation && relation !== ".." && !relation.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(relation) ? target : null;
}

function sealedDocument(bytes, digestKey) {
  let document;
  try { document = JSON.parse(bytes.toString("utf8")); } catch { return null; }
  if (!isRecord(document) || !DIGEST.test(document[digestKey] ?? "")) return null;
  const material = Object.fromEntries(Object.entries(document).filter(([key]) => key !== digestKey));
  return digestValue(material) === document[digestKey] ? document : null;
}

function pointerDocument(bytes) {
  let document;
  try { document = JSON.parse(bytes.toString("utf8")); } catch { return null; }
  if (!isRecord(document) || document.schema_version !== "are.serving-version-pointer/v1" || !nonEmptyString(document.version_ref)
    || !DIGEST.test(document.pointer_digest ?? "")) return null;
  const material = {schema_version: document.schema_version, version_ref: document.version_ref, predecessor_ref: document.predecessor_ref ?? null, decision_ref: document.decision_ref ?? null};
  return createHash("sha256").update(JSON.stringify(material)).digest("hex") === document.pointer_digest ? document : null;
}

function readArtifacts(manifest, repositoryRoot) {
  const documents = {};
  const reasons = [];
  for (const [name, binding] of Object.entries(manifest.artifacts ?? {})) {
    const path = safeRepositoryPath(repositoryRoot, binding?.path);
    if (!path) { reasons.push("continuity-activation.artifact-path-invalid"); continue; }
    let bytes;
    try { bytes = readFileSync(path); } catch { reasons.push("continuity-activation.artifact-unreadable"); continue; }
    if (rawDigest(bytes) !== binding.sha256) { reasons.push("continuity-activation.artifact-byte-drift"); continue; }
    const document = name === "serving_pointer" ? pointerDocument(bytes)
      : name === "continuity_snapshot" ? (() => { try { const value = JSON.parse(bytes.toString("utf8")); return validateContinuityBindingSnapshot(value).ok ? value : null; } catch { return null; } })()
      : sealedDocument(bytes, name === "activation_package" ? "package_digest" : "package_digest");
    if (!document || document[name === "serving_pointer" ? "pointer_digest" : name === "continuity_snapshot" ? "snapshot_digest" : "package_digest"] !== binding.document_digest) {
      reasons.push("continuity-activation.artifact-document-invalid");
      continue;
    }
    documents[name] = {document, path};
  }
  return reasons.length ? {ok: false, reasons} : {ok: true, documents};
}

export function validateContinuityActivationManifest(manifest, repositoryRoot) {
  const reasons = [];
  if (!closed(manifest, MANIFEST_KEYS) || manifest.schema_version !== CONTINUITY_ACTIVATION_MANIFEST_SCHEMA
    || !nonEmptyString(manifest.activation_id) || !nonEmptyString(manifest.active_version_ref)
    || !closed(manifest.artifacts, ARTIFACTS_KEYS) || Object.keys(manifest.artifacts ?? {}).length !== ARTIFACTS_KEYS.size
    || !closed(manifest.objective_resolution, new Set(["enabled"])) || manifest.objective_resolution.enabled !== true
    || !validContinuityRendererConfiguration(manifest.renderer_configuration)
    || canonicalJson(canonicalizeJson(manifest.renderer_configuration)) !== canonicalJson(canonicalizeJson(RENDERER_CONFIGURATION))
    || manifest.authority_effect !== "none" || !DIGEST.test(manifest.manifest_digest ?? "")) reasons.push("continuity-activation.manifest-invalid");
  for (const binding of Object.values(manifest?.artifacts ?? {})) {
    if (!closed(binding, BINDING_KEYS) || !nonEmptyString(binding.path) || !DIGEST.test(binding.sha256 ?? "") || !DIGEST.test(binding.document_digest ?? "")) reasons.push("continuity-activation.binding-invalid");
  }
  if (isRecord(manifest)) {
    const material = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== "manifest_digest"));
    if (digestValue(material) !== manifest.manifest_digest) reasons.push("continuity-activation.manifest-digest-mismatch");
  }
  if (reasons.length) return fail("continuity-activation", [...new Set(reasons)]);
  const loaded = readArtifacts(manifest, repositoryRoot);
  if (!loaded.ok) return fail("continuity-activation", [...new Set(loaded.reasons)]);
  const pointer = loaded.documents.serving_pointer.document;
  const activationPackage = loaded.documents.activation_package.document;
  const providerPackage = loaded.documents.provider_package.document;
  const snapshot = loaded.documents.continuity_snapshot.document;
  if (pointer.version_ref !== manifest.active_version_ref || activationPackage.active_version_ref !== manifest.active_version_ref
    || activationPackage.serving_pointer_digest !== pointer.pointer_digest
    || activationPackage.provider_package_digest !== providerPackage.package_digest
    || activationPackage.activation !== "controlled-local" || activationPackage.decision !== "retain-local-headless-activation") {
    return fail("continuity-activation", ["continuity-activation.lineage-mismatch"]);
  }
  return freezeResult({ok: true, value: manifest, documents: loaded.documents, authority_effect: "none"});
}

export function materializeContinuityActivationManifest({activation_id, active_version_ref, artifacts, repository_root}) {
  const bindings = {};
  const digestKeys = {serving_pointer: "pointer_digest", activation_package: "package_digest", provider_package: "package_digest", continuity_snapshot: "snapshot_digest"};
  for (const name of ARTIFACTS_KEYS) {
    const path = safeRepositoryPath(repository_root, artifacts?.[name]);
    if (!path) throw new TypeError(`Invalid continuity activation artifact path: ${name}`);
    const bytes = readFileSync(path);
    const document = JSON.parse(bytes.toString("utf8"));
    bindings[name] = {path: artifacts[name], sha256: rawDigest(bytes), document_digest: document[digestKeys[name]]};
  }
  const material = canonicalizeJson({schema_version: CONTINUITY_ACTIVATION_MANIFEST_SCHEMA, activation_id, active_version_ref, artifacts: bindings, objective_resolution: {enabled: true}, renderer_configuration: RENDERER_CONFIGURATION, authority_effect: "none"});
  const manifest = {...material, manifest_digest: digestValue(material)};
  const checked = validateContinuityActivationManifest(manifest, repository_root);
  if (!checked.ok) throw new TypeError(`Invalid continuity activation manifest: ${checked.reason_codes.join(",")}`);
  return checked.value;
}

export function loadContinuityActivationManifest(path, repositoryRoot) {
  try { return validateContinuityActivationManifest(JSON.parse(readFileSync(resolve(path), "utf8")), repositoryRoot); }
  catch { return fail("continuity-activation", ["continuity-activation.manifest-unreadable"]); }
}

export function resolveContinuityActivation({loaded_profile, repository_root, manifest_path, state_path}) {
  if (!nonEmptyString(manifest_path)) return fail("continuity-activation", ["continuity-activation.manifest-path-required"]);
  if (nonEmptyString(state_path)) return fail("continuity-activation", ["continuity-activation.ambiguous-state-source"]);
  const loaded = loadContinuityActivationManifest(manifest_path, repository_root);
  if (!loaded.ok) return loaded;
  if (loaded_profile?.continuity_renderer?.enabled === true) return fail("continuity-activation", ["continuity-activation.base-profile-already-enabled"]);
  const effectiveProfile = structuredClone(loaded_profile);
  effectiveProfile.objective_resolution = {enabled: true};
  effectiveProfile.continuity_renderer = structuredClone(loaded.value.renderer_configuration);
  const provider = createContinuityBindingProvider(loaded.documents.continuity_snapshot.document);
  const material = {schema_version: CONTINUITY_ACTIVATION_RECEIPT_SCHEMA, activation_id: loaded.value.activation_id, active_version_ref: loaded.value.active_version_ref, manifest_digest: loaded.value.manifest_digest, serving_pointer_digest: loaded.documents.serving_pointer.document.pointer_digest, provider_package_digest: loaded.documents.provider_package.document.package_digest, snapshot_digest: loaded.documents.continuity_snapshot.document.snapshot_digest, disposition: "activated", authority_effect: "none"};
  return Object.freeze({ok: true, disposition: "activated", loaded_profile: freezeResult(effectiveProfile), provider, snapshot_digest: material.snapshot_digest, receipt: freezeResult({...material, receipt_digest: digestValue(material)}), authority_effect: "none"});
}

export function resolveEntrypointContinuity({loaded_profile, repository_root, activation_manifest_path, state_path}) {
  if (nonEmptyString(activation_manifest_path)) return resolveContinuityActivation({loaded_profile, repository_root, manifest_path: activation_manifest_path, state_path});
  const resolved = resolveContinuityBindingProvider({loaded_profile, state_path});
  if (!resolved.ok) return resolved;
  return Object.freeze({...resolved, loaded_profile, receipt: null});
}
