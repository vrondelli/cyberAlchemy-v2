import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {
  canonicalReviewerJson,
  REVIEWER_ATTESTATION_DOMAIN_PREFIX,
  reviewerAttestationSigningBytes,
  reviewerTrustRegistryDigest,
  verifyReviewerAttestation,
} from "../src/security/reviewer-attestation-v1.mjs";

const VLAD_PUBLIC_KEY = "MCowBQYDK2VwAyEAA6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg=";
const DAVE_PUBLIC_KEY = "MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=";
const VLAD_SIGNATURE = "E1RdKvQJrt4iYFKBH49QmFiZ/ivITRxwUKKbCkfTmoJ/PSnpgNhENaK/MGxJDSU3w+S4PdRE2hrnq5IUCRU5Dw==";
const DAVE_SIGNATURE = "dcmoHGG4wrNFnhplD2PXGkK/LXFZrCN65wc8A4yy3ASEB4PDl3zg8FXBGAF0QVqg2dHtT14qklrs5VauBg5WBg==";
const NOW = "2026-09-26T12:30:00.000Z";

function registry() {
  const key = (reviewer_id, key_id, public_key_spki_base64) => ({
    reviewer_id,
    key_id,
    algorithm: "Ed25519",
    public_key_spki_base64,
    valid_from: "2026-09-01T00:00:00.000Z",
    valid_until: "2027-01-01T00:00:00.000Z",
    status: "active",
    revoked_at: null,
  });
  return {
    schema_version: "are.reviewer-trust-registry/v1",
    registry_id: "benchmark-reviewers-2026-v1",
    issued_at: "2026-09-01T00:00:00.000Z",
    expires_at: "2026-12-01T00:00:00.000Z",
    reviewers: {
      vlad: key("vlad", "vlad-ed25519-2026-v1", VLAD_PUBLIC_KEY),
      dave: key("dave", "dave-ed25519-2026-v1", DAVE_PUBLIC_KEY),
    },
    authority_effect: "none",
  };
}

function payload(reviewer_id = "vlad") {
  return {
    schema_version: "are.reviewer-attestation-payload/v1",
    domain: "g02-vps-qualification-review",
    reviewer_id,
    decision: "PASS",
    artifact_bindings: {
      freeze_sha256: "a".repeat(64),
      gateway_attestation_sha256: "b".repeat(64),
    },
    run_id: "g02-live-r1",
    issued_at: "2026-09-26T12:00:00.000Z",
    expires_at: "2026-09-26T13:00:00.000Z",
    nonce: "g02-live-r1-review-0001",
    authority_effect: "none",
  };
}

function expected(value = payload()) {
  return {
    domain: value.domain,
    reviewer_id: value.reviewer_id,
    decision: value.decision,
    artifact_bindings: structuredClone(value.artifact_bindings),
    run_id: value.run_id,
    expires_at: value.expires_at,
    nonce: value.nonce,
  };
}

function signature(reviewer_id = "vlad") {
  return {
    schema_version: "are.reviewer-attestation-signature/v1",
    algorithm: "Ed25519",
    key_id: `${reviewer_id}-ed25519-2026-v1`,
    signature_base64: reviewer_id === "vlad" ? VLAD_SIGNATURE : DAVE_SIGNATURE,
  };
}

function verifyFixture({trust = registry(), signedPayload = payload(), detached = signature(), wanted = expected(signedPayload), now = NOW, pinnedDigest} = {}) {
  return verifyReviewerAttestation({
    trust_registry: trust,
    trust_registry_sha256: pinnedDigest ?? reviewerTrustRegistryDigest(trust),
    payload: signedPayload,
    signature: detached,
    expected: wanted,
    now,
  });
}

test("verifies fixed detached Ed25519 signatures for the exact Vlad and Dave registry identities", () => {
  const vlad = verifyFixture();
  assert.equal(vlad.ok, true);
  assert.equal(vlad.reviewer_id, "vlad");
  assert.match(vlad.payload_sha256, /^[a-f0-9]{64}$/);

  const davePayload = payload("dave");
  const dave = verifyFixture({signedPayload: davePayload, detached: signature("dave"), wanted: expected(davePayload)});
  assert.equal(dave.ok, true);
  assert.equal(dave.key_id, "dave-ed25519-2026-v1");
});

test("canonical bytes are stable by object meaning and explicitly domain separated", () => {
  assert.equal(canonicalReviewerJson({z: 1, a: {y: 2, x: 3}}).toString(), canonicalReviewerJson({a: {x: 3, y: 2}, z: 1}).toString());
  const bytes = reviewerAttestationSigningBytes(payload());
  assert.ok(bytes.subarray(0, REVIEWER_ATTESTATION_DOMAIN_PREFIX.length).equals(Buffer.from(REVIEWER_ATTESTATION_DOMAIN_PREFIX)));
  const wrongDomain = payload();
  wrongDomain.domain = "g03-longmemeval-generation-review";
  const result = verifyFixture({signedPayload: wrongDomain, wanted: expected(wrongDomain)});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("signature-invalid"));
});

test("caller-supplied artifact, run, expiry and nonce bindings are exact", () => {
  const source = payload();
  const mutations = [
    (value) => { value.artifact_bindings.freeze_sha256 = "c".repeat(64); },
    (value) => { value.run_id = "g02-live-r2"; },
    (value) => { value.expires_at = "2026-09-26T13:00:01.000Z"; },
    (value) => { value.nonce = "g02-live-r1-review-0002"; },
  ];
  for (const mutate of mutations) {
    const wanted = expected(source);
    mutate(wanted);
    const result = verifyFixture({wanted});
    assert.equal(result.ok, false);
    assert.ok(result.reason_codes.some((reason) => reason.startsWith("binding-")));
  }
});

test("trust registry is caller pinned and cannot add, remove, rename or substitute reviewers and keys", () => {
  const original = registry();
  assert.equal(verifyFixture({pinnedDigest: "0".repeat(64)}).ok, false);

  const extra = structuredClone(original);
  extra.reviewers.mallory = structuredClone(extra.reviewers.vlad);
  assert.ok(verifyFixture({trust: extra}).reason_codes.includes("trust-registry-reviewers"));

  const substituted = structuredClone(original);
  substituted.reviewers.vlad.public_key_spki_base64 = DAVE_PUBLIC_KEY;
  const result = verifyFixture({trust: substituted});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("trust-registry-reviewer-key-uniqueness"));

  const aliasedIdentity = structuredClone(original);
  aliasedIdentity.reviewers.dave.key_id = aliasedIdentity.reviewers.vlad.key_id;
  aliasedIdentity.reviewers.dave.public_key_spki_base64 = aliasedIdentity.reviewers.vlad.public_key_spki_base64;
  assert.ok(verifyFixture({trust: aliasedIdentity}).reason_codes.includes("trust-registry-reviewer-key-uniqueness"));

  const wrongKeyId = signature();
  wrongKeyId.key_id = "dave-ed25519-2026-v1";
  assert.ok(verifyFixture({detached: wrongKeyId}).reason_codes.includes("signature-key-binding"));
});

test("expired, not-yet-valid and revoked keys and registries fail closed", () => {
  assert.ok(verifyFixture({now: "2026-09-26T13:00:00.000Z"}).reason_codes.includes("attestation-currentness"));

  const impossibleDate = payload();
  impossibleDate.issued_at = "2026-09-31T12:00:00.000Z";
  assert.ok(verifyFixture({signedPayload: impossibleDate, wanted: expected(impossibleDate)}).reason_codes.includes("attestation-currentness"));

  const futureKey = registry();
  futureKey.reviewers.vlad.valid_from = "2026-09-27T00:00:00.000Z";
  assert.ok(verifyFixture({trust: futureKey}).reason_codes.includes("key-not-current"));

  const revoked = registry();
  revoked.reviewers.vlad.status = "revoked";
  revoked.reviewers.vlad.revoked_at = "2026-09-26T12:15:00.000Z";
  assert.ok(verifyFixture({trust: revoked}).reason_codes.includes("key-revoked"));

  const staleRegistry = registry();
  staleRegistry.expires_at = NOW;
  assert.ok(verifyFixture({trust: staleRegistry}).reason_codes.includes("trust-registry-currentness"));
});

test("malformed inputs, payload additions, signature mutation and non-Ed25519 SPKI fail closed without throwing", () => {
  assert.equal(verifyReviewerAttestation().ok, false);
  const added = payload();
  added.unbound = true;
  assert.ok(verifyFixture({signedPayload: added, wanted: expected(added)}).reason_codes.includes("payload-shape"));

  const badSignature = signature();
  badSignature.signature_base64 = `${badSignature.signature_base64.slice(0, -4)}AAAA`;
  assert.equal(verifyFixture({detached: badSignature}).ok, false);

  const badKey = registry();
  badKey.reviewers.vlad.public_key_spki_base64 = Buffer.alloc(44).toString("base64");
  assert.equal(verifyFixture({trust: badKey}).ok, false);
});

test("production verifier exposes no key generation, private-key import or signing helper", () => {
  const source = readFileSync(new URL("../src/security/reviewer-attestation-v1.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /generateKey|createPrivateKey|private[_-]?key|\bsign\s*\(/i);
  assert.doesNotMatch(source, /node:child_process|node:net|node:http|node:https/);
});
