import assert from "node:assert/strict";
import {chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {
  BINDING_ID,
  ARTIFACT_ID,
  CONFIGURATION_ID,
  CONFIGURATION_SHA256,
  MODULE_SET_DIGEST,
  cutoverBindings,
  realizeActivatedModulePort,
} from "../index.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");

function passingRustReceipt() {
  return {
    schema_version: "are.module-port-rust-binding-receipt/v1-candidate",
    binding_id: BINDING_ID,
    disposition: "PASS",
    subject_configuration_id: CONFIGURATION_ID,
    subject_configuration_sha256: CONFIGURATION_SHA256,
    module_set_digest: MODULE_SET_DIGEST,
    runtime_admission_verified: true,
    binding_admitted: false,
    enforcement_active: false,
    effect_authorized: false,
    authority_effect: "none",
  };
}

const passingRunner = () => ({status: 0, signal: null, stdout: JSON.stringify(passingRustReceipt()), stderr: ""});

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "are-module-port-cutover-"));
  for (const binding of Object.values(cutoverBindings)) {
    const target = resolve(root, binding.path);
    mkdirSync(dirname(target), {recursive: true});
    cpSync(resolve(repositoryRoot, binding.path), target);
  }
  return root;
}

test("real repository cutover invokes Rust before exposing the exact module set", () => {
  const result = realizeActivatedModulePort({repository_root: repositoryRoot});
  assert.equal(result.ok, true, result.reason_codes.join(","));
  assert.equal(result.disposition, "active");
  assert.equal(result.module_set_digest, MODULE_SET_DIGEST);
  assert.equal(result.activation_selected, true);
  assert.equal(result.cutover_completed, true);
  assert.equal(result.enforcement_active, true);
  assert.equal(result.effect_authorized, false);
  assert.equal(result.verifier_delivery, "packaged-artifact");
  assert.equal(result.verifier_artifact_id, ARTIFACT_ID);
  assert.equal(result.verifier_artifact_sha256, cutoverBindings.packaged_verifier_binary.sha256);
  assert.equal(result.port.inspect().module_set_digest, MODULE_SET_DIGEST);
});

test("startup invokes the packaged binary directly without Cargo fallback", () => {
  const root = fixture();
  let invocation;
  try {
    const result = realizeActivatedModulePort({repository_root: root, runner: (command, args) => {
      invocation = {command, args};
      return passingRunner();
    }});
    assert.equal(result.ok, true);
    assert.equal(invocation.command, resolve(root, cutoverBindings.packaged_verifier_binary.path));
    assert.deepEqual(invocation.args, ["--repository-root", root]);
    assert.equal(JSON.stringify(invocation).includes("cargo"), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("cutover receipt is deterministic for one exact startup subject", () => {
  const root = fixture();
  try {
    const left = realizeActivatedModulePort({repository_root: root, runner: passingRunner});
    const right = realizeActivatedModulePort({repository_root: root, runner: passingRunner});
    assert.equal(left.cutover_receipt_digest, right.cutover_receipt_digest);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("activation drift blocks before Rust execution", () => {
  const root = fixture();
  let calls = 0;
  try {
    const path = resolve(root, cutoverBindings.activation.path);
    writeFileSync(path, readFileSync(path, "utf8").replace("selected-active", "substituted"));
    const result = realizeActivatedModulePort({repository_root: root, runner: () => { calls += 1; return passingRunner(); }});
    assert.equal(result.ok, false);
    assert.equal(result.reason_codes[0].startsWith("cutover.digest-mismatch:"), true);
    assert.equal(calls, 0);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("Rust verifier failure exposes no partial port", () => {
  const root = fixture();
  try {
    const result = realizeActivatedModulePort({repository_root: root, runner: () => ({status: 1, signal: null, stdout: "{}", stderr: "blocked"})});
    assert.equal(result.ok, false);
    assert.equal(result.port, null);
    assert.deepEqual(result.reason_codes, ["cutover.rust-verifier-blocked"]);
    assert.equal(result.enforcement_active, false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("non-executable packaged verifier blocks before invocation", {skip: process.platform === "win32"}, () => {
  const root = fixture();
  let calls = 0;
  try {
    chmodSync(resolve(root, cutoverBindings.packaged_verifier_binary.path), 0o444);
    const result = realizeActivatedModulePort({repository_root: root, runner: () => { calls += 1; return passingRunner(); }});
    assert.deepEqual(result.reason_codes, ["cutover.artifact-not-executable"]);
    assert.equal(result.port, null);
    assert.equal(calls, 0);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("packaged verifier byte drift blocks before invocation", () => {
  const root = fixture();
  let calls = 0;
  try {
    const path = resolve(root, cutoverBindings.packaged_verifier_binary.path);
    chmodSync(path, 0o755);
    writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from([0])]));
    const result = realizeActivatedModulePort({repository_root: root, runner: () => { calls += 1; return passingRunner(); }});
    assert.equal(result.reason_codes[0].startsWith("cutover.digest-mismatch:"), true);
    assert.equal(result.port, null);
    assert.equal(calls, 0);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("a malformed or effect-smuggling Rust receipt blocks", () => {
  const root = fixture();
  try {
    const malformed = realizeActivatedModulePort({repository_root: root, runner: () => ({status: 0, signal: null, stdout: "not-json", stderr: ""})});
    assert.deepEqual(malformed.reason_codes, ["cutover.rust-receipt-invalid"]);
    const receipt = {...passingRustReceipt(), effect_authorized: true};
    const smuggled = realizeActivatedModulePort({repository_root: root, runner: () => ({status: 0, signal: null, stdout: JSON.stringify(receipt), stderr: ""})});
    assert.deepEqual(smuggled.reason_codes, ["cutover.rust-receipt-invalid"]);
    assert.equal(smuggled.port, null);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("symlink substitution blocks before Rust execution", {skip: process.platform === "win32"}, () => {
  const root = fixture();
  let calls = 0;
  try {
    const path = resolve(root, cutoverBindings.activation.path);
    rmSync(path);
    symlinkSync(resolve(repositoryRoot, cutoverBindings.activation.path), path);
    const result = realizeActivatedModulePort({repository_root: root, runner: () => { calls += 1; return passingRunner(); }});
    assert.deepEqual(result.reason_codes, [`cutover.symlink-forbidden:${cutoverBindings.activation.path}`]);
    assert.equal(calls, 0);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
