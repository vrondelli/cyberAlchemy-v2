import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {lstatSync, readFileSync} from "node:fs";
import {isAbsolute, resolve, sep} from "node:path";

import {createNativeSemanticAdapter} from "../module-port/native-semantic-adapter.mjs";
import {semanticTextOutputValidators} from "../module-port/semantic-text.mjs";
import {composeStaticModulePort} from "../module-port/static-composition.mjs";
import {digestModuleValue} from "../module-port/index.mjs";

export const CUTOVER_SCHEMA = "are.module-port-governance-cutover/v1-candidate";
export const CONFIGURATION_ID = "are-production-semantic-core-v1-candidate";
export const CONFIGURATION_SHA256 = "8cf1463a048eaf3df6ae5e210fa1d9b974829dc9bd55cc50cd97c6260d9eef3d";
export const MODULE_SET_DIGEST = "f87d8f92824c2b1fab2635742f71d630ce3121c155b509fa13ce4fe0c6e1a926";
export const BINDING_ID = "ARE-MODULE-PORT-RUST-BINDING-001-CANDIDATE";
export const ARTIFACT_ID = "ARE-MODULE-PORT-PACKAGED-VERIFIER-LINUX-X64-001-CANDIDATE";

export const cutoverBindings = Object.freeze({
  alch_source: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-cutover-v1/cutover.alch",
    sha256: "a0a2c737b3047aa92efd4d035d69af0bcdde42120a600923031b1277848e531e",
  }),
  alch_build_manifest: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-cutover-v1/generated/manifest.json",
    sha256: "543a6a118157e87467edc24d198e1461863578d02b938d124a814c5c35c7e52c",
  }),
  packaged_verifier_alch_source: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-packaged-verifier-v1/packaged-verifier.alch",
    sha256: "95863346a96372f01f934555f96ce4b54e4b145f1d6740211de5e74a20131834",
  }),
  packaged_verifier_alch_build_manifest: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-packaged-verifier-v1/generated/manifest.json",
    sha256: "f2b06cd7e5a1aeadec370f681568c56293daa145576e31d2009b2b41cf0faa73",
  }),
  packaged_verifier_manifest: Object.freeze({
    path: "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64/manifest.json",
    sha256: "ff4b5da08fff4387861662e0e5bac258b247b36c073fd4f37b834d02548273b6",
  }),
  packaged_verifier_binary: Object.freeze({
    path: "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64/are-module-port-governance-binding",
    sha256: "5e1ffd77dd429d5506708ee5cf5f40457b7e7dda26fa7439bf090e7d920a88e3",
  }),
  activation: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/activation-request.json",
    sha256: "577a70c0da69de860668cb5664dac289e45d9ad0757f97e23e5e22d64d3c00c3",
  }),
  operational_authorization: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/operational-authorization.json",
    sha256: "1b4d3b2cff54292642b403257bb311867072ee77c3af3bfddbfec70eb55b56ae",
  }),
  binding_admission: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/rust-binding-admission-request.json",
    sha256: "fab14ef7c111356d3aaf91189a670270491b00622cd7f086ca7535bd8088276d",
  }),
  configuration: Object.freeze({
    path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v1/generated/runtime/configuration.json",
    sha256: CONFIGURATION_SHA256,
  }),
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function readBoundFile(repositoryRoot, binding, {parseJson = true} = {}) {
  const root = resolve(repositoryRoot);
  if (!isAbsolute(root) || lstatSync(root).isSymbolicLink()) throw new Error("cutover.repository-root-invalid");
  let current = root;
  let metadata;
  for (const part of binding.path.split("/")) {
    if (!part || part === "." || part === ".." || part.includes(sep)) throw new Error("cutover.path-invalid");
    current = resolve(current, part);
    metadata = lstatSync(current);
    if (metadata.isSymbolicLink()) throw new Error(`cutover.symlink-forbidden:${binding.path}`);
  }
  if (!metadata?.isFile()) throw new Error(`cutover.regular-file-required:${binding.path}`);
  const bytes = readFileSync(current);
  if (sha256(bytes) !== binding.sha256) throw new Error(`cutover.digest-mismatch:${binding.path}`);
  if (!parseJson) return {bytes, value: null, path: current, metadata};
  try { return {bytes, value: JSON.parse(bytes.toString("utf8")), path: current, metadata}; }
  catch { throw new Error(`cutover.json-invalid:${binding.path}`); }
}

function cutoverResult({ok, reasonCodes = [], rustReceipt = null, composition = null, artifactManifest = null, port = null}) {
  const material = {
    schema_version: CUTOVER_SCHEMA,
    ok,
    disposition: ok ? "active" : "blocked",
    subject_configuration_id: CONFIGURATION_ID,
    subject_configuration_sha256: CONFIGURATION_SHA256,
    module_set_digest: ok ? composition.module_set_digest : null,
    activation_selected: ok,
    cutover_completed: ok,
    enforcement_active: ok,
    effect_authorized: false,
    reason_codes: [...new Set(reasonCodes)].sort(),
    rust_receipt_digest: rustReceipt ? digestModuleValue(rustReceipt) : null,
    composition_digest: composition?.composition_digest ?? null,
    verifier_delivery: ok ? "packaged-artifact" : null,
    verifier_artifact_id: artifactManifest?.artifact_id ?? null,
    verifier_artifact_sha256: ok ? cutoverBindings.packaged_verifier_binary.sha256 : null,
    authority_effect: "none",
  };
  return deepFreeze({...material, cutover_receipt_digest: digestModuleValue(material), port});
}

function rustReceiptValid(receipt) {
  return receipt?.schema_version === "are.module-port-rust-binding-receipt/v1-candidate"
    && receipt.binding_id === BINDING_ID
    && receipt.disposition === "PASS"
    && receipt.subject_configuration_id === CONFIGURATION_ID
    && receipt.subject_configuration_sha256 === CONFIGURATION_SHA256
    && receipt.module_set_digest === MODULE_SET_DIGEST
    && receipt.runtime_admission_verified === true
    && receipt.binding_admitted === false
    && receipt.enforcement_active === false
    && receipt.effect_authorized === false
    && receipt.authority_effect === "none";
}

export function realizeActivatedModulePort({repository_root, runner = spawnSync} = {}) {
  let activation;
  let authorization;
  let admission;
  let configuration;
  let buildManifest;
  let artifactBuildManifest;
  let artifactManifest;
  let artifactBinary;
  try {
    if (typeof repository_root !== "string" || !repository_root) throw new Error("cutover.repository-root-invalid");
    readBoundFile(repository_root, cutoverBindings.alch_source, {parseJson: false});
    buildManifest = readBoundFile(repository_root, cutoverBindings.alch_build_manifest).value;
    readBoundFile(repository_root, cutoverBindings.packaged_verifier_alch_source, {parseJson: false});
    artifactBuildManifest = readBoundFile(repository_root, cutoverBindings.packaged_verifier_alch_build_manifest).value;
    artifactManifest = readBoundFile(repository_root, cutoverBindings.packaged_verifier_manifest).value;
    artifactBinary = readBoundFile(repository_root, cutoverBindings.packaged_verifier_binary, {parseJson: false});
    activation = readBoundFile(repository_root, cutoverBindings.activation).value;
    authorization = readBoundFile(repository_root, cutoverBindings.operational_authorization).value;
    admission = readBoundFile(repository_root, cutoverBindings.binding_admission).value;
    configuration = readBoundFile(repository_root, cutoverBindings.configuration).value;
  } catch (error) {
    return cutoverResult({ok: false, reasonCodes: [error.code ? `cutover.unavailable:${error.code}` : error.message]});
  }

  const decisionValid = activation.decision_id === "ARE-MODULE-PORT-ACTIVATION-001"
    && activation.decision_state === "selected-active"
    && activation.selected_option_id === "ARE-MP-ACTIVATE"
    && activation.subject_configuration_digest === CONFIGURATION_SHA256
    && activation.subject_operational_authorization_decision_id === authorization.decision_id
    && activation.activation_selected === true
    && activation.cutover_completed === true
    && activation.enforcement_active === true
    && activation.effect_authorized === false
    && activation.authority_effect === "none"
    && authorization.decision_state === "selected"
    && authorization.selected_option_id === "ARE-MP-OPERATION-AUTHORIZE"
    && authorization.subject_binding_admission_decision_id === admission.decision_id
    && authorization.subject_configuration_sha256 === CONFIGURATION_SHA256
    && authorization.operational_authorized === true
    && authorization.effect_authorized === false
    && authorization.authority_effect === "none"
    && admission.decision_state === "selected"
    && admission.selected_option_id === "ARE-MP-RUST-BINDING-ADMIT"
    && admission.subject_binding_id === BINDING_ID
    && admission.subject_configuration_sha256 === CONFIGURATION_SHA256
    && admission.binding_admitted === true
    && admission.enforcement_active === false
    && admission.effect_authorized === false
    && admission.authority_effect === "none";
  if (!decisionValid) return cutoverResult({ok: false, reasonCodes: ["cutover.decision-claims-invalid"]});

  const alchValid = buildManifest.schema_version === "alchlang.semantic-contract-build/v1"
    && buildManifest.profile === "semantic-contract-v1"
    && buildManifest.source_sha256 === cutoverBindings.alch_source.sha256
    && JSON.stringify(buildManifest.pipeline) === JSON.stringify([
      "alch-source", "semantic-contract-ontology", "craft-project", "domainspec-compile", "runtime-projection", "fixture-validation",
    ])
    && buildManifest.ontology_admitted === false
    && buildManifest.constitution_adopted === false
    && buildManifest.authority_effect === "none";
  if (!alchValid) return cutoverResult({ok: false, reasonCodes: ["cutover.alch-build-invalid"]});

  const artifactAlchValid = artifactBuildManifest.schema_version === "alchlang.semantic-contract-build/v1"
    && artifactBuildManifest.profile === "semantic-contract-v1"
    && artifactBuildManifest.source_sha256 === cutoverBindings.packaged_verifier_alch_source.sha256
    && JSON.stringify(artifactBuildManifest.pipeline) === JSON.stringify([
      "alch-source", "semantic-contract-ontology", "craft-project", "domainspec-compile", "runtime-projection", "fixture-validation",
    ])
    && artifactBuildManifest.ontology_admitted === false
    && artifactBuildManifest.constitution_adopted === false
    && artifactBuildManifest.authority_effect === "none";
  if (!artifactAlchValid) return cutoverResult({ok: false, reasonCodes: ["cutover.artifact-alch-build-invalid"]});

  const artifactValid = artifactManifest.schema_version === "are.module-port-packaged-verifier-artifact/v1-candidate"
    && artifactManifest.artifact_id === ARTIFACT_ID
    && artifactManifest.binding_id === BINDING_ID
    && artifactManifest.platform === "linux"
    && artifactManifest.architecture === "x64"
    && artifactManifest.target_triple === "x86_64-unknown-linux-gnu"
    && artifactManifest.binary_format === "elf"
    && artifactManifest.build_profile === "release"
    && artifactManifest.binary_path === cutoverBindings.packaged_verifier_binary.path
    && artifactManifest.binary_sha256 === cutoverBindings.packaged_verifier_binary.sha256
    && artifactManifest.binary_size === artifactBinary.bytes.length
    && artifactManifest.runtime_compiler_required === false
    && artifactManifest.runtime_package_manager_required === false
    && artifactManifest.fallback_allowed === false
    && artifactManifest.effect_authorized === false
    && artifactManifest.authority_effect === "none";
  if (!artifactValid) return cutoverResult({ok: false, reasonCodes: ["cutover.artifact-manifest-invalid"], artifactManifest});
  if (process.platform !== artifactManifest.platform || process.arch !== artifactManifest.architecture) {
    return cutoverResult({ok: false, reasonCodes: ["cutover.artifact-platform-mismatch"], artifactManifest});
  }
  if ((artifactBinary.metadata.mode & 0o111) === 0 || !artifactBinary.bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) {
    return cutoverResult({ok: false, reasonCodes: ["cutover.artifact-not-executable"], artifactManifest});
  }

  const root = resolve(repository_root);
  let execution;
  try {
    execution = runner(artifactBinary.path, ["--repository-root", root],
      {encoding: "utf8", timeout: 60_000, maxBuffer: 1024 * 1024});
  } catch {
    return cutoverResult({ok: false, reasonCodes: ["cutover.rust-verifier-unavailable"]});
  }
  if (execution?.error || execution?.status !== 0 || execution?.signal) {
    return cutoverResult({ok: false, reasonCodes: ["cutover.rust-verifier-blocked"], artifactManifest});
  }
  let rustReceipt;
  try { rustReceipt = JSON.parse(execution.stdout); }
  catch { return cutoverResult({ok: false, reasonCodes: ["cutover.rust-receipt-invalid"], artifactManifest}); }
  if (!rustReceiptValid(rustReceipt)) {
    return cutoverResult({ok: false, reasonCodes: ["cutover.rust-receipt-invalid"], rustReceipt, artifactManifest});
  }

  const composition = composeStaticModulePort({
    configuration,
    adapter_factories: {createNativeSemanticAdapter},
    output_validators: semanticTextOutputValidators,
  });
  if (!composition.ok || composition.disposition !== "available" || composition.module_set_digest !== MODULE_SET_DIGEST) {
    return cutoverResult({ok: false, reasonCodes: ["cutover.module-composition-blocked", ...(composition.reason_codes ?? [])], rustReceipt, composition, artifactManifest});
  }
  return cutoverResult({ok: true, rustReceipt, composition, artifactManifest, port: composition.port});
}
