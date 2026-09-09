#!/usr/bin/env node
import {createHash} from "node:crypto";
import {lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

import {signTestPayload, TEST_KEY_ID, TEST_PUBLIC_KEY_SPKI_BASE64, TEST_TRUST_POSTURE} from "./test-signing-key.mjs";
import {ARTIFACT_MANIFEST_PATH, BINARY_PATH, ENVELOPE_DIRECTORY} from "../public-trust.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../../../../..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export {ARTIFACT_MANIFEST_PATH, BINARY_PATH, ENVELOPE_DIRECTORY};

function readRegular(path) {
  const metadata = lstatSync(path);
  if (metadata.isSymbolicLink() || !metadata.isFile()) throw new Error(`envelope.materialization-regular-file-required:${path}`);
  return {bytes: readFileSync(path), metadata};
}

export function materializeTestEnvelope({repository_root = defaultRepositoryRoot, output_directory} = {}) {
  const root = resolve(repository_root);
  const output = resolve(output_directory ?? resolve(root, ENVELOPE_DIRECTORY));
  const artifactManifestFile = readRegular(resolve(root, ARTIFACT_MANIFEST_PATH));
  const binaryFile = readRegular(resolve(root, BINARY_PATH));
  const artifactManifest = JSON.parse(artifactManifestFile.bytes.toString("utf8"));
  if (artifactManifest.binary_path !== BINARY_PATH || artifactManifest.binary_sha256 !== sha256(binaryFile.bytes)
    || artifactManifest.binary_size !== binaryFile.bytes.length) {
    throw new Error("envelope.materialization-artifact-mismatch");
  }

  const bundleManifest = {
    schema_version: "are.module-port-distribution-envelope/v1-candidate",
    envelope_id: "ARE-MODULE-PORT-DISTRIBUTION-ENVELOPE-LINUX-X64-001-CANDIDATE",
    artifact_id: artifactManifest.artifact_id,
    platform: artifactManifest.platform,
    architecture: artifactManifest.architecture,
    target_triple: artifactManifest.target_triple,
    payloads: [
      {role: "artifact-manifest", path: ARTIFACT_MANIFEST_PATH, sha256: sha256(artifactManifestFile.bytes), size: artifactManifestFile.bytes.length},
      {role: "verifier-binary", path: BINARY_PATH, sha256: sha256(binaryFile.bytes), size: binaryFile.bytes.length, mode: `0${(binaryFile.metadata.mode & 0o777).toString(8)}`},
    ],
    signature: {algorithm: "Ed25519", key_id: TEST_KEY_ID, trust_posture: TEST_TRUST_POSTURE},
    release_eligible: false,
    published: false,
    installed_externally: false,
    deployed: false,
    effect_authorized: false,
    authority_effect: "none",
  };
  const bundleBytes = Buffer.from(`${JSON.stringify(bundleManifest, null, 2)}\n`);
  const signature = {
    schema_version: "are.module-port-distribution-signature/v1-candidate",
    envelope_id: bundleManifest.envelope_id,
    payload_path: `${ENVELOPE_DIRECTORY}/bundle-manifest.json`,
    payload_sha256: sha256(bundleBytes),
    algorithm: "Ed25519",
    key_id: TEST_KEY_ID,
    public_key_spki_base64: TEST_PUBLIC_KEY_SPKI_BASE64,
    signature_base64: signTestPayload(bundleBytes),
    trust_posture: TEST_TRUST_POSTURE,
    release_eligible: false,
    effect_authorized: false,
    authority_effect: "none",
  };
  const signatureBytes = Buffer.from(`${JSON.stringify(signature, null, 2)}\n`);
  mkdirSync(output, {recursive: true});
  for (const [name, bytes] of [["bundle-manifest.json", bundleBytes], ["signature.json", signatureBytes]]) {
    const temporary = resolve(output, `${name}.tmp`);
    writeFileSync(temporary, bytes);
    renameSync(temporary, resolve(output, name));
  }
  return {bundle_manifest: bundleManifest, signature, bundle_sha256: sha256(bundleBytes), signature_sha256: sha256(signatureBytes)};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(`${JSON.stringify(materializeTestEnvelope(), null, 2)}\n`);
}
