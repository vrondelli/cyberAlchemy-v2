import assert from "node:assert/strict";
import {generateKeyPairSync} from "node:crypto";
import {chmodSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {signArtifact, verifyArtifactSignature} from "./sign-source-distribution.mjs";

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "are-signing-test-"));
  const artifact = resolve(root, "are-candidate.tar.gz");
  const privateKeyPath = resolve(root, "release-private.pem");
  const publicKeyPath = resolve(root, "release-public.pem");
  const statement = resolve(root, "statement.json");
  const signature = resolve(root, "signature.json");
  const {privateKey, publicKey} = generateKeyPairSync("ed25519");
  writeFileSync(artifact, "candidate archive fixture\n");
  writeFileSync(privateKeyPath, privateKey.export({type: "pkcs8", format: "pem"}), {mode: 0o600});
  chmodSync(privateKeyPath, 0o600);
  writeFileSync(publicKeyPath, publicKey.export({type: "spki", format: "pem"}), {mode: 0o644});
  return {root, artifact, privateKeyPath, publicKeyPath, statement, signature};
}

test("Ed25519 statement binds Candidate 018, artifact bytes and key identity", () => {
  const f = fixture();
  const signed = signArtifact({artifact_path: f.artifact, private_key_path: f.privateKeyPath, statement_path: f.statement, signature_path: f.signature});
  const verified = verifyArtifactSignature({artifact_path: f.artifact, public_key_path: f.publicKeyPath, statement_path: f.statement, signature_path: f.signature, expected_fingerprint: signed.public_key_fingerprint_sha256});
  assert.equal(verified.status, "PASS");
  assert.equal(verified.statement_sha256, signed.statement_sha256);
});

test("verification rejects artifact tampering and the wrong public key", () => {
  const f = fixture();
  signArtifact({artifact_path: f.artifact, private_key_path: f.privateKeyPath, statement_path: f.statement, signature_path: f.signature});
  writeFileSync(f.artifact, "tampered archive\n");
  assert.throws(() => verifyArtifactSignature({artifact_path: f.artifact, public_key_path: f.publicKeyPath, statement_path: f.statement, signature_path: f.signature}), /signature\.artifact-binding-mismatch/u);

  writeFileSync(f.artifact, "candidate archive fixture\n");
  const other = generateKeyPairSync("ed25519").publicKey;
  const otherPath = resolve(f.root, "other-public.pem");
  writeFileSync(otherPath, other.export({type: "spki", format: "pem"}));
  assert.throws(() => verifyArtifactSignature({artifact_path: f.artifact, public_key_path: otherPath, statement_path: f.statement, signature_path: f.signature}), /signature\.key-fingerprint-mismatch/u);
});

test("signing rejects a private key readable by group or others", () => {
  const f = fixture();
  chmodSync(f.privateKeyPath, 0o644);
  assert.throws(() => signArtifact({artifact_path: f.artifact, private_key_path: f.privateKeyPath, statement_path: f.statement, signature_path: f.signature}), /signature\.private-key-permissions-too-open/u);
});
