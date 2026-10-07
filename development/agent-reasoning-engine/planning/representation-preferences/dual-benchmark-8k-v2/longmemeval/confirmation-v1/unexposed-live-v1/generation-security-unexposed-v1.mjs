// Durable development launch receipts and dead-owner recovery controls for G03.
import assert from "node:assert/strict";
import {createHash, randomBytes} from "node:crypto";
import {existsSync, mkdirSync, readFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {stable} from "../../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs";

const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const digest = (value) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : stable(value)).digest("hex");
const RECEIPT_KEYS = ["schema_version", "execution_mode", "run_name", "freeze_path", "freeze_sha256", "freeze_code_sha256", "live_code_sha256", "generation_plan_sha256", "output_root", "maximum_generation_calls", "maximum_live_tokenizer_calls", "generation_token_reservation", "deadline_ms", "automatic_retries", "evaluator_reference_access", "human_prelaunch_authorization_required", "created_at", "authority_effect", "receipt_sha256"];

export function developmentLaunchReceipt({freezePath, freeze, freezeSha256, runName, createdAt = new Date()}) {
  const receipt = {schema_version: "are.longmemeval-unexposed-development-launch-receipt/v1", execution_mode: "development", run_name: runName,
    freeze_path: resolve(freezePath), freeze_sha256: freezeSha256, freeze_code_sha256: freeze.code_bindings.freeze.sha256, live_code_sha256: freeze.code_bindings.live.sha256,
    generation_plan_sha256: freeze.generation_plan_sha256, output_root: freeze.target_storage.binding.output_root, maximum_generation_calls: 152, maximum_live_tokenizer_calls: 152,
    generation_token_reservation: 1216000, deadline_ms: freeze.deadline_ms, automatic_retries: 0, evaluator_reference_access: false,
    human_prelaunch_authorization_required: false, created_at: createdAt.toISOString(), authority_effect: "generation-only"};
  return {...receipt, receipt_sha256: digest(receipt)};
}

export function verifyDevelopmentLaunchReceipt(receipt, context) {
  assert.ok(exact(receipt, RECEIPT_KEYS), "development-launch-receipt.exact-fields");
  const expected = developmentLaunchReceipt({...context, createdAt: new Date(receipt.created_at)});
  assert.deepEqual(receipt, expected, "development-launch-receipt.bindings"); return true;
}

function processStartTicks(text) { const end = text.lastIndexOf(")"); assert.ok(end > 0, "lease.proc-stat"); const fields = text.slice(end + 2).split(" "); assert.match(fields[19] ?? "", /^[0-9]+$/, "lease.proc-start"); return fields[19]; }
export function ownerLease({pid = process.pid, read = (path) => readFileSync(path, "utf8"), token = randomBytes(32).toString("hex"), createdAt = new Date() } = {}) {
  const boot = String(read("/proc/sys/kernel/random/boot_id")).trim(), start = processStartTicks(String(read(`/proc/${pid}/stat`)));
  assert.ok(boot); assert.match(token, /^[a-f0-9]{64}$/); return {schema_version: "are.longmemeval-unexposed-run-lease/v1", pid, process_start_ticks: start, boot_id_sha256: digest(boot), owner_token_sha256: digest(token), created_at: createdAt.toISOString(), status: "exclusive-owner", authority_effect: "generation-only"};
}

export function inspectLeaseOwner(lease, {read = (path) => readFileSync(path, "utf8"), exists = existsSync} = {}) {
  assert.ok(exact(lease, ["schema_version", "pid", "process_start_ticks", "boot_id_sha256", "owner_token_sha256", "created_at", "status", "authority_effect"]) && lease.schema_version === "are.longmemeval-unexposed-run-lease/v1");
  const boot = String(read("/proc/sys/kernel/random/boot_id")).trim(); assert.equal(digest(boot), lease.boot_id_sha256, "lease.host-drift"); const path = `/proc/${lease.pid}/stat`;
  if (!exists(path)) return {state: "dead", proof: "pid-absent", pid: lease.pid, process_start_ticks: lease.process_start_ticks, boot_id_sha256: lease.boot_id_sha256};
  let current; try { current = processStartTicks(String(read(path))); } catch { return {state: "indeterminate", proof: "proc-unreadable", pid: lease.pid}; }
  return current === lease.process_start_ticks ? {state: "alive", proof: "same-boot-pid-start", pid: lease.pid} : {state: "dead", proof: "pid-reused", pid: lease.pid, process_start_ticks: lease.process_start_ticks, observed_process_start_ticks: current, boot_id_sha256: lease.boot_id_sha256};
}

export function acquireRecoveryLock(output, lease, dependencies = {}) {
  const owner = inspectLeaseOwner(lease, dependencies); assert.equal(owner.state, "dead", owner.state === "alive" ? "recovery.live-owner" : "recovery.owner-indeterminate");
  const lock = join(output, ".recovery-lock"); mkdirSync(lock, {mode: 0o700}); return {schema_version: "are.longmemeval-unexposed-recovery-lock/v1", owner_proof: owner, acquired_at: new Date().toISOString(), authority_effect: "none"};
}

export {digest as securityDigest};
