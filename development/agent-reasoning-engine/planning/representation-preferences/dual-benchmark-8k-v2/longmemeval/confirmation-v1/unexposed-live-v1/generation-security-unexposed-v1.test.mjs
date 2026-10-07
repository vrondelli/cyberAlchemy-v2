import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {acquireRecoveryLock, developmentLaunchReceipt, inspectLeaseOwner, securityDigest, verifyDevelopmentLaunchReceipt} from "./generation-security-unexposed-v1.mjs";

function fixture() {
  const freezePath = "/opt/are/g03/FREEZE.json", freezeSha256 = "f".repeat(64), runName = "longmemeval-unexposed-generation-r1";
  const freeze = {deadline_ms: 7200000, code_bindings: {freeze: {sha256: "1".repeat(64)}, live: {sha256: "2".repeat(64)}}, generation_plan_sha256: "3".repeat(64), target_storage: {binding: {output_root: "/opt/are/g03"}}};
  return {freezePath, freezeSha256, runName, freeze};
}

test("development launch receipt needs no human signature and binds all execution limits", () => {
  const context = fixture(), receipt = developmentLaunchReceipt({...context, createdAt: new Date("2026-09-26T12:00:00.000Z")});
  assert.equal(verifyDevelopmentLaunchReceipt(receipt, context), true); assert.equal(receipt.execution_mode, "development"); assert.equal(receipt.human_prelaunch_authorization_required, false);
  assert.equal(receipt.maximum_generation_calls, 152); assert.equal(receipt.maximum_live_tokenizer_calls, 152); assert.equal(receipt.generation_token_reservation, 1216000);
  assert.equal("signatures" in receipt, false); assert.equal("reviewers" in receipt, false); assert.equal("trust_registry_path" in receipt, false);
});

test("development launch receipt rejects freeze, plan, output, cap, and run rebinding", () => {
  const context = fixture(), valid = developmentLaunchReceipt({...context, createdAt: new Date("2026-09-26T12:00:00.000Z")});
  for (const key of ["freeze_sha256", "generation_plan_sha256", "output_root", "maximum_generation_calls", "run_name"]) {
    const changed = structuredClone(valid); changed[key] = key === "maximum_generation_calls" ? 153 : `${changed[key]}-changed`;
    assert.throws(() => verifyDevelopmentLaunchReceipt(changed, context), /bindings/);
  }
});

test("recovery lock requires exact dead-owner proof and is exclusive", () => {
  const output = mkdtempSync(join(tmpdir(), "g03-recovery-lock-")), boot = "boot-a", lease = {schema_version: "are.longmemeval-unexposed-run-lease/v1", pid: 123, process_start_ticks: "10", boot_id_sha256: securityDigest(boot), owner_token_sha256: "5".repeat(64), created_at: "2026-09-26T10:00:00.000Z", status: "exclusive-owner", authority_effect: "generation-only"};
  try {
    const base = {read: (path) => path.includes("boot_id") ? boot : "123 (node) S 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 10 0", exists: () => true};
    assert.equal(inspectLeaseOwner(lease, base).state, "alive"); assert.throws(() => acquireRecoveryLock(output, lease, base), /live-owner/);
    const dead = {...base, exists: () => false}; assert.equal(acquireRecoveryLock(output, lease, dead).owner_proof.proof, "pid-absent"); assert.throws(() => acquireRecoveryLock(output, lease, dead));
  } finally { rmSync(output, {recursive: true, force: true}); }
});

test("development G03 security code has no reviewer crypto, private key, or network access", () => {
  const source = readFileSync(new URL("./generation-security-unexposed-v1.mjs", import.meta.url), "utf8"); assert.doesNotMatch(source, /reviewer|trust.registry|createPrivateKey|generateKey|\bsign\s*\(/i); assert.doesNotMatch(source, /node:http|node:https|node:net|node:child_process/);
});
