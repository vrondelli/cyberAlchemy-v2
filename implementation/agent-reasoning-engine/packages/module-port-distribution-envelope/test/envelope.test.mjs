import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {envelopeBindings, verifyDistributionEnvelope} from "../index.mjs";
import {materializeTestEnvelope} from "../scripts/materialize-test-envelope.mjs";
import {signTestPayload} from "../scripts/test-signing-key.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "are-distribution-envelope-"));
  for (const binding of Object.values(envelopeBindings)) {
    const target = resolve(root, binding.path);
    mkdirSync(dirname(target), {recursive: true});
    cpSync(resolve(repositoryRoot, binding.path), target);
  }
  return root;
}

function rewriteBundle(root, mutate, {resign = false} = {}) {
  const bundlePath = resolve(root, envelopeBindings.bundle_manifest.path);
  const value = JSON.parse(readFileSync(bundlePath, "utf8"));
  mutate(value);
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  writeFileSync(bundlePath, bytes);
  if (resign) {
    const signaturePath = resolve(root, envelopeBindings.signature.path);
    const signature = JSON.parse(readFileSync(signaturePath, "utf8"));
    signature.payload_sha256 = sha256(bytes);
    signature.signature_base64 = signTestPayload(bytes);
    writeFileSync(signaturePath, `${JSON.stringify(signature, null, 2)}\n`);
  }
}

test("the exact local candidate envelope verifies offline", () => {
  const result = verifyDistributionEnvelope({repository_root: repositoryRoot});
  assert.equal(result.ok, true, result.reason_codes.join(","));
  assert.equal(result.signature_verified, true);
  assert.equal(result.trust_posture, "test-only-deterministic-fixture");
  assert.equal(result.release_eligible, false);
  assert.equal(result.effect_authorized, false);
});

test("deterministic materialization produces identical envelope bytes", () => {
  const left = mkdtempSync(resolve(tmpdir(), "are-envelope-left-"));
  const right = mkdtempSync(resolve(tmpdir(), "are-envelope-right-"));
  try {
    const a = materializeTestEnvelope({repository_root: repositoryRoot, output_directory: left});
    const b = materializeTestEnvelope({repository_root: repositoryRoot, output_directory: right});
    assert.deepEqual(a, b);
    assert.deepEqual(readFileSync(resolve(left, "bundle-manifest.json")), readFileSync(resolve(right, "bundle-manifest.json")));
    assert.deepEqual(readFileSync(resolve(left, "signature.json")), readFileSync(resolve(right, "signature.json")));
  } finally { rmSync(left, {recursive: true, force: true}); rmSync(right, {recursive: true, force: true}); }
});

test("bundle byte tampering fails signature verification", () => {
  const root = fixture();
  try {
    rewriteBundle(root, (bundle) => { bundle.platform = "substituted"; });
    assert.deepEqual(verifyDistributionEnvelope({repository_root: root}).reason_codes, ["envelope.signature-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("binary byte drift is rejected", () => {
  const root = fixture();
  try {
    const path = resolve(root, envelopeBindings.binary.path);
    chmodSync(path, 0o755);
    writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from([0])]));
    assert.deepEqual(verifyDistributionEnvelope({repository_root: root}).reason_codes, ["envelope.bundle-policy-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("signature or public-key substitution fails closed", () => {
  const root = fixture();
  try {
    const path = resolve(root, envelopeBindings.signature.path);
    const signature = JSON.parse(readFileSync(path, "utf8"));
    signature.public_key_spki_base64 = Buffer.from("substituted").toString("base64");
    writeFileSync(path, `${JSON.stringify(signature, null, 2)}\n`);
    assert.deepEqual(verifyDistributionEnvelope({repository_root: root}).reason_codes, ["envelope.signature-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("symlink substitution fails before verification", {skip: process.platform === "win32"}, () => {
  const root = fixture();
  try {
    const path = resolve(root, envelopeBindings.binary.path);
    rmSync(path);
    symlinkSync(resolve(repositoryRoot, envelopeBindings.binary.path), path);
    assert.deepEqual(verifyDistributionEnvelope({repository_root: root}).reason_codes, [`envelope.symlink-forbidden:${envelopeBindings.binary.path}`]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("even a valid test signature cannot claim release eligibility", () => {
  const root = fixture();
  try {
    rewriteBundle(root, (bundle) => { bundle.release_eligible = true; }, {resign: true});
    assert.deepEqual(verifyDistributionEnvelope({repository_root: root}).reason_codes, ["envelope.bundle-policy-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("a missing envelope blocks without fallback", () => {
  const root = fixture();
  try {
    rmSync(resolve(root, envelopeBindings.signature.path));
    assert.equal(verifyDistributionEnvelope({repository_root: root}).ok, false);
    assert.equal(verifyDistributionEnvelope({repository_root: root}).reason_codes[0].startsWith("envelope.unavailable:"), true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("verification receipt is deterministic and carries no effects", () => {
  const root = fixture();
  try {
    const left = verifyDistributionEnvelope({repository_root: root});
    const right = verifyDistributionEnvelope({repository_root: root});
    assert.deepEqual(left, right);
    assert.equal(left.effect_authorized, false);
    assert.equal(left.authority_effect, "none");
  } finally { rmSync(root, {recursive: true, force: true}); }
});
