// Test-only reviewer keys. Production code neither generates nor holds signing keys.
import {createHash, generateKeyPairSync, sign} from "node:crypto";
import {writeFileSync} from "node:fs";
import {join} from "node:path";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {REVIEWER_ATTESTATION_SCHEMA, REVIEWER_SIGNATURE_SCHEMA, reviewerAttestationSigningBytes, reviewerTrustRegistryDigest} from "../../src/security/reviewer-attestation-v1.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const keys = Object.fromEntries(["vlad", "dave"].map(id => [id, generateKeyPairSync("ed25519")]));

export function writeTestReviewerRegistry(root) {
  const reviewers = Object.fromEntries(["vlad", "dave"].map(reviewer_id => {
    const public_key_spki_base64 = keys[reviewer_id].publicKey.export({format: "der", type: "spki"}).toString("base64");
    return [reviewer_id, {reviewer_id, key_id: `test-${reviewer_id}-2026`, algorithm: "Ed25519", public_key_spki_base64, valid_from: "2026-09-25T00:00:00.000Z", valid_until: "2026-09-28T00:00:00.000Z", status: "active", revoked_at: null}];
  }));
  const registry = {schema_version: "are.reviewer-trust-registry/v1", registry_id: "test.hen11.reviewers", issued_at: "2026-09-25T00:00:00.000Z", expires_at: "2026-09-28T00:00:00.000Z", reviewers, authority_effect: "none"}, path = join(root, "REVIEWER-TRUST-REGISTRY.test.json"), bytes = `${canonicalJson(registry)}\n`; writeFileSync(path, bytes);
  return {path, registry, file_sha256: sha(bytes), registry_digest: reviewerTrustRegistryDigest(registry)};
}

export function signTestHen11Admission(unsigned, freeze, reviewerId = "dave") {
  const admission_digest = sha(canonicalJson(unsigned)), payload = {schema_version: REVIEWER_ATTESTATION_SCHEMA, domain: freeze.reviewer_authentication.domain, reviewer_id: reviewerId, decision: "PASS", artifact_bindings: {admission_digest, freeze_sha256: unsigned.freeze_sha256, source_bindings_sha256: freeze.source_bindings_sha256, deployment_digest: freeze.deployment.deployment_digest, trust_registry_sha256: freeze.reviewer_authentication.trust_registry.registry_digest}, run_id: unsigned.review_id, issued_at: unsigned.issued_at, expires_at: unsigned.expires_at, nonce: unsigned.single_use_nonce, authority_effect: "none"};
  const signature = {schema_version: REVIEWER_SIGNATURE_SCHEMA, algorithm: "Ed25519", key_id: `test-${reviewerId}-2026`, signature_base64: sign(null, reviewerAttestationSigningBytes(payload), keys[reviewerId].privateKey).toString("base64")};
  return {...unsigned, admission_digest, reviewer_attestation: {payload, signature}};
}
