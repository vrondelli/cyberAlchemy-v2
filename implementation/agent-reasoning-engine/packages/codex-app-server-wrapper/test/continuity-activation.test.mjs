import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {
  loadContinuityActivationManifest,
  materializeContinuityActivationManifest,
  materializeContinuityBindingSnapshot,
  resolveContinuityActivation,
  resolveEntrypointContinuity,
  validateContinuityActivationManifest,
} from "../index.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => ({...canonicalizeJson(material), [key]: digest(material)});

function fixture() {
  const root = mkdtempSync("/tmp/continuity-activation-test-");
  const snapshot = materializeContinuityBindingSnapshot({snapshot_id: "activation-test", revision: 1, bindings: [{selector: {consumer_ref: "codex:human-chat"}, active_cycle: "controlled-upgrade", relationship_by_transition: {continue: "same-cycle-continuation"}, response_language: "en", next_action: "Continue the admitted objective.", clarification_needed: false, evidence_status: "verified-complete", high_risk_transitions: ["continue"]}]});
  const providerPackage = seal({schema_version: "are.continuity-provider-package/v1", snapshot_digest: snapshot.snapshot_digest, authority_effect: "none"}, "package_digest");
  const version = `continuity:test:${providerPackage.package_digest}`;
  const pointerMaterial = {schema_version: "are.serving-version-pointer/v1", version_ref: version, predecessor_ref: "continuity:disabled", decision_ref: "decision:test"};
  const pointer = {...pointerMaterial, pointer_digest: createHash("sha256").update(JSON.stringify(pointerMaterial)).digest("hex")};
  const activationPackage = seal({schema_version: "are.headless-continuity-activation-package/v1", decision: "retain-local-headless-activation", active_version_ref: version, serving_pointer_digest: pointer.pointer_digest, provider_package_digest: providerPackage.package_digest, activation: "controlled-local", authority_effect: "none"}, "package_digest");
  const documents = {"pointer.json": pointer, "activation.json": activationPackage, "provider.json": providerPackage, "snapshot.json": snapshot};
  for (const [name, value] of Object.entries(documents)) writeFileSync(resolve(root, name), `${canonicalJson(value)}\n`);
  const manifest = materializeContinuityActivationManifest({activation_id: "activation-test", active_version_ref: version, repository_root: root, artifacts: {serving_pointer: "pointer.json", activation_package: "activation.json", provider_package: "provider.json", continuity_snapshot: "snapshot.json"}});
  const manifestPath = resolve(root, "manifest.json");
  writeFileSync(manifestPath, `${canonicalJson(manifest)}\n`);
  return {root, manifest, manifestPath, pointer, snapshot};
}

test("activation manifest binds the retained pointer and produces an enabled entrypoint profile", async () => {
  const value = fixture();
  try {
    const loaded = loadContinuityActivationManifest(value.manifestPath, value.root);
    assert.equal(loaded.ok, true);
    const resolved = resolveEntrypointContinuity({loaded_profile: {continuity_renderer: {enabled: false}}, repository_root: value.root, activation_manifest_path: value.manifestPath});
    assert.equal(resolved.ok, true);
    assert.equal(resolved.disposition, "activated");
    assert.equal(resolved.loaded_profile.continuity_renderer.enabled, true);
    assert.equal(resolved.receipt.serving_pointer_digest, value.pointer.pointer_digest);
    assert.deepEqual(await resolved.provider({message: {params: {threadId: "thread"}}, turn_binding: {consumer_ref: "codex:human-chat"}, objective_resolution: {transition: "new", resolution_digest: "a".repeat(64)}}), {high_risk: false});
  } finally { rmSync(value.root, {recursive: true, force: true}); }
});

test("activation resolution fails closed on artifact drift, ambiguous state, and enabled base profiles", () => {
  const value = fixture();
  try {
    writeFileSync(resolve(value.root, "pointer.json"), "{}\n");
    assert.ok(resolveContinuityActivation({loaded_profile: {continuity_renderer: {enabled: false}}, repository_root: value.root, manifest_path: value.manifestPath}).reason_codes.includes("continuity-activation.artifact-byte-drift"));
    assert.deepEqual(resolveContinuityActivation({loaded_profile: {continuity_renderer: {enabled: false}}, repository_root: value.root, manifest_path: value.manifestPath, state_path: "state.json"}).reason_codes, ["continuity-activation.ambiguous-state-source"]);
  } finally { rmSync(value.root, {recursive: true, force: true}); }
  const enabled = fixture();
  try {
    assert.deepEqual(resolveContinuityActivation({loaded_profile: {continuity_renderer: {enabled: true}}, repository_root: enabled.root, manifest_path: enabled.manifestPath}).reason_codes, ["continuity-activation.base-profile-already-enabled"]);
  } finally { rmSync(enabled.root, {recursive: true, force: true}); }
});

test("activation manifest is closed, digest-bound, and repository-confined", () => {
  const value = fixture();
  try {
    assert.equal(validateContinuityActivationManifest({...value.manifest, unexpected: true}, value.root).ok, false);
    assert.equal(validateContinuityActivationManifest({...value.manifest, active_version_ref: "tampered"}, value.root).ok, false);
    const escaped = structuredClone(value.manifest);
    escaped.artifacts.serving_pointer.path = "../pointer.json";
    const material = Object.fromEntries(Object.entries(escaped).filter(([key]) => key !== "manifest_digest"));
    escaped.manifest_digest = digest(material);
    assert.ok(validateContinuityActivationManifest(escaped, value.root).reason_codes.includes("continuity-activation.artifact-path-invalid"));
  } finally { rmSync(value.root, {recursive: true, force: true}); }
});
