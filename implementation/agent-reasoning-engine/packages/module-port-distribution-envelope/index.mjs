import {createHash, createPublicKey, verify} from "node:crypto";
import {lstatSync, readFileSync, realpathSync} from "node:fs";
import {resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";

import {
  ARTIFACT_MANIFEST_PATH,
  BINARY_PATH,
  ENVELOPE_DIRECTORY,
  TEST_KEY_ID,
  TEST_PUBLIC_KEY_SPKI_BASE64,
  TEST_TRUST_POSTURE,
} from "./public-trust.mjs";

export const ENVELOPE_ID = "ARE-MODULE-PORT-DISTRIBUTION-ENVELOPE-LINUX-X64-001-CANDIDATE";
export const ARTIFACT_ID = "ARE-MODULE-PORT-PACKAGED-VERIFIER-LINUX-X64-001-CANDIDATE";
export const envelopeBindings = Object.freeze({
  bundle_manifest: Object.freeze({path: `${ENVELOPE_DIRECTORY}/bundle-manifest.json`}),
  signature: Object.freeze({path: `${ENVELOPE_DIRECTORY}/signature.json`}),
  artifact_manifest: Object.freeze({path: ARTIFACT_MANIFEST_PATH}),
  binary: Object.freeze({path: BINARY_PATH}),
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
const modeString = (metadata) => `0${(metadata.mode & 0o777).toString(8)}`;

function git(root, args) {
  const execution = spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  if (execution.error || execution.status !== 0 || execution.signal || execution.stderr) return null;
  return execution.stdout.trim();
}

function isTrackedGitExecutable(root, relativePath) {
  const topLevel = git(root, ["rev-parse", "--show-toplevel"]);
  if (!topLevel || realpathSync(topLevel) !== realpathSync(root)) return false;
  const stage = git(root, ["ls-files", "--stage", "--", relativePath]);
  const match = /^100755 ([0-9a-f]{40}|[0-9a-f]{64}) 0\t(.+)$/.exec(stage ?? "");
  if (!match || match[2] !== relativePath) return false;
  return git(root, ["hash-object", "--", relativePath]) === match[1];
}

function validateBinaryMode({root, relativePath, signedMode, binaryFile, verificationContext}) {
  const observedMode = modeString(binaryFile.metadata);
  if (observedMode === signedMode) return {ok: true, posture: "signed-artifact-mode-exact", observedMode};
  if (verificationContext !== "git-checkout" || signedMode !== "0555" || observedMode !== "0755") {
    return {ok: false, posture: "mode-mismatch", observedMode};
  }
  if (!isTrackedGitExecutable(root, relativePath)) {
    return {ok: false, posture: "git-checkout-unverified", observedMode};
  }
  return {ok: true, posture: "git-executable-bit-materialization", observedMode};
}

function readRegular(root, relativePath) {
  let current = resolve(root);
  if (lstatSync(current).isSymbolicLink()) throw new Error("envelope.repository-root-symlink-forbidden");
  let metadata;
  for (const part of relativePath.split("/")) {
    if (!part || part === "." || part === ".." || part.includes(sep)) throw new Error("envelope.path-invalid");
    current = resolve(current, part);
    metadata = lstatSync(current);
    if (metadata.isSymbolicLink()) throw new Error(`envelope.symlink-forbidden:${relativePath}`);
  }
  if (!metadata?.isFile()) throw new Error(`envelope.regular-file-required:${relativePath}`);
  return {bytes: readFileSync(current), metadata};
}

function result(ok, reasonCodes = [], observed = {}) {
  const material = {
    schema_version: "are.module-port-distribution-verification/v1-candidate",
    ok,
    disposition: ok ? "verified-local-candidate" : "blocked",
    envelope_id: ok ? ENVELOPE_ID : null,
    artifact_id: ok ? ARTIFACT_ID : null,
    platform: ok ? "linux" : null,
    architecture: ok ? "x64" : null,
    signature_verified: ok,
    trust_posture: TEST_TRUST_POSTURE,
    release_eligible: false,
    published: false,
    installed_externally: false,
    deployed: false,
    effect_authorized: false,
    reason_codes: [...new Set(reasonCodes)].sort(),
    bundle_sha256: observed.bundle_sha256 ?? null,
    signature_sha256: observed.signature_sha256 ?? null,
    verification_context: observed.verification_context ?? null,
    signed_binary_mode: observed.signed_binary_mode ?? null,
    observed_binary_mode: observed.observed_binary_mode ?? null,
    binary_mode_posture: observed.binary_mode_posture ?? null,
    authority_effect: "none",
  };
  return Object.freeze({...material, receipt_digest: sha256(Buffer.from(JSON.stringify(material)))});
}

function validateBundle(bundle, artifactManifest, binaryFile) {
  const payloads = bundle?.payloads;
  return exactKeys(bundle, ["schema_version", "envelope_id", "artifact_id", "platform", "architecture", "target_triple", "payloads", "signature", "release_eligible", "published", "installed_externally", "deployed", "effect_authorized", "authority_effect"])
    && bundle.schema_version === "are.module-port-distribution-envelope/v1-candidate"
    && bundle.envelope_id === ENVELOPE_ID && bundle.artifact_id === ARTIFACT_ID
    && bundle.platform === "linux" && bundle.architecture === "x64" && bundle.target_triple === "x86_64-unknown-linux-gnu"
    && Array.isArray(payloads) && payloads.length === 2
    && exactKeys(payloads[0], ["role", "path", "sha256", "size"])
    && payloads[0].role === "artifact-manifest" && payloads[0].path === ARTIFACT_MANIFEST_PATH
    && payloads[0].sha256 === sha256(artifactManifest.bytes) && payloads[0].size === artifactManifest.bytes.length
    && exactKeys(payloads[1], ["role", "path", "sha256", "size", "mode"])
    && payloads[1].role === "verifier-binary" && payloads[1].path === BINARY_PATH
    && payloads[1].sha256 === sha256(binaryFile.bytes) && payloads[1].size === binaryFile.bytes.length
    && /^0[0-7]{3}$/.test(payloads[1].mode)
    && exactKeys(bundle.signature, ["algorithm", "key_id", "trust_posture"])
    && bundle.signature.algorithm === "Ed25519" && bundle.signature.key_id === TEST_KEY_ID
    && bundle.signature.trust_posture === TEST_TRUST_POSTURE
    && bundle.release_eligible === false && bundle.published === false
    && bundle.installed_externally === false && bundle.deployed === false
    && bundle.effect_authorized === false && bundle.authority_effect === "none";
}

function validateSignature(signature, bundleBytes) {
  if (!exactKeys(signature, ["schema_version", "envelope_id", "payload_path", "payload_sha256", "algorithm", "key_id", "public_key_spki_base64", "signature_base64", "trust_posture", "release_eligible", "effect_authorized", "authority_effect"])) return false;
  if (signature.schema_version !== "are.module-port-distribution-signature/v1-candidate"
    || signature.envelope_id !== ENVELOPE_ID || signature.payload_path !== envelopeBindings.bundle_manifest.path
    || signature.payload_sha256 !== sha256(bundleBytes) || signature.algorithm !== "Ed25519"
    || signature.key_id !== TEST_KEY_ID || signature.public_key_spki_base64 !== TEST_PUBLIC_KEY_SPKI_BASE64
    || signature.trust_posture !== TEST_TRUST_POSTURE || signature.release_eligible !== false
    || signature.effect_authorized !== false || signature.authority_effect !== "none") return false;
  try {
    const publicKey = createPublicKey({key: Buffer.from(TEST_PUBLIC_KEY_SPKI_BASE64, "base64"), format: "der", type: "spki"});
    return verify(null, bundleBytes, publicKey, Buffer.from(signature.signature_base64, "base64"));
  } catch { return false; }
}

export function verifyDistributionEnvelope({repository_root, verification_context = "packaged-artifact"} = {}) {
  const observed = {verification_context};
  try {
    if (typeof repository_root !== "string" || !repository_root) throw new Error("envelope.repository-root-invalid");
    if (!["packaged-artifact", "git-checkout"].includes(verification_context)) throw new Error("envelope.verification-context-invalid");
    const root = resolve(repository_root);
    const bundleFile = readRegular(root, envelopeBindings.bundle_manifest.path);
    const signatureFile = readRegular(root, envelopeBindings.signature.path);
    const artifactManifestFile = readRegular(root, envelopeBindings.artifact_manifest.path);
    const binaryFile = readRegular(root, envelopeBindings.binary.path);
    observed.bundle_sha256 = sha256(bundleFile.bytes);
    observed.signature_sha256 = sha256(signatureFile.bytes);
    let bundle;
    let signature;
    let artifactManifestValue;
    try {
      bundle = JSON.parse(bundleFile.bytes.toString("utf8"));
      signature = JSON.parse(signatureFile.bytes.toString("utf8"));
      artifactManifestValue = JSON.parse(artifactManifestFile.bytes.toString("utf8"));
    } catch { throw new Error("envelope.json-invalid"); }
    if (!validateSignature(signature, bundleFile.bytes)) throw new Error("envelope.signature-invalid");
    if (!validateBundle(bundle, artifactManifestFile, binaryFile)) throw new Error("envelope.bundle-policy-invalid");
    const modeEvidence = validateBinaryMode({
      root,
      relativePath: envelopeBindings.binary.path,
      signedMode: bundle.payloads[1].mode,
      binaryFile,
      verificationContext: verification_context,
    });
    observed.signed_binary_mode = bundle.payloads[1].mode;
    observed.observed_binary_mode = modeEvidence.observedMode;
    observed.binary_mode_posture = modeEvidence.posture;
    if (!modeEvidence.ok) throw new Error("envelope.binary-mode-policy-invalid");
    if (artifactManifestValue.artifact_id !== ARTIFACT_ID || artifactManifestValue.binary_path !== BINARY_PATH
      || artifactManifestValue.binary_sha256 !== sha256(binaryFile.bytes) || artifactManifestValue.binary_size !== binaryFile.bytes.length
      || artifactManifestValue.effect_authorized !== false || artifactManifestValue.authority_effect !== "none") {
      throw new Error("envelope.artifact-manifest-invalid");
    }
    return result(true, [], observed);
  } catch (error) {
    const code = error?.code ? `envelope.unavailable:${error.code}` : (error?.message ?? "envelope.unknown-failure");
    return result(false, [code], observed);
  }
}
