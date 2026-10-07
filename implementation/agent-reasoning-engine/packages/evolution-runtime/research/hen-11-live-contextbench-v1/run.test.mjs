import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {createOnlySettlementWriter, reconcileHen11Settlement, runHen11, runHen11Workers, validateHen11Freeze} from "./run.mjs";
const sha = value => createHash("sha256").update(value).digest("hex");

function fixture() {
  const slots = ["contextbench-1", "contextbench-4"].map((task_id, sequence) => ({sequence, task_id, arm: "intent-anchor-convergence-r3"}));
  const hostPath = new URL("./run-host.mjs", import.meta.url).pathname, hostBinding = {path: hostPath, sha256: sha(readFileSync(hostPath))}, bindings = [hostBinding];
  const generatedSha = sha(readFileSync(hostPath)), deploymentBody = {target_root: "/fixture", runtime_repository_root: "/fixture/repo", execution_host: "187.77.163.194", source_bindings_sha256: sha(canonicalJson(bindings)), config_sha256: generatedSha, cohort_sha256: generatedSha, repositories: [], assets: []};
  const freeze = {schema_version: "are.hen11-contextbench-intent-anchor-freeze/v1", task_denominator: slots.map(slot => slot.task_id), context_limit: 8000, output_cap: 2048, maximum_workers: 2, maximum_model_calls: 192, maximum_model_tokens: 192000, maximum_automatic_retries: 0, control_runs: 0,
    maximum_campaign_elapsed_seconds: 14400, execution_host: "187.77.163.194", execution_topology: {kind: "vps-native", host: "187.77.163.194", node_path: "/node", node_version: "v1", node_sha256: "d".repeat(64)}, node_runtime: {path: "/node", version: "v1", sha256: "d".repeat(64), required_node_options: ["--experimental-vm-modules"], launch_wrapper: "/fixture/launch.mjs"}, deployment: {...deploymentBody, deployment_digest: sha(canonicalJson(deploymentBody))}, native_scoring_runtime: ["bounded_scorer", "configured_wrapper", "source_manifest"].map(role => ({role, path: `/fixture/${role}`, sha256: "e".repeat(64)})), native_scoring_environment: {python: {path: "/usr/bin/python3", sha256: "1".repeat(64)}, sandbox: {path: "/usr/bin/bwrap", sha256: "2".repeat(64)}, modules: {pyarrow: "23.0.1", tree_sitter: "0.26.0", tree_sitter_language_pack: "1.16.2"}}, remote_provider_bridge: {path: "/vps-local-glm-v1.mjs", sha256: "b".repeat(64)}, sources: {config_path: hostPath, config_sha256: generatedSha, cohort_path: hostPath, cohort_sha256: generatedSha},
    execution_mode: "development", development_execution: {prelaunch_authorization_required: false, cryptographic_signatures_required: false, freeze_consumption_receipt_required: true, independent_postrun_review_required: true},
    roots: {runs_root: "/fixture/run/runs_root"}, schedule: {assigned_outcomes: 2, maximum_workers: 2, maximum_model_calls: 192, maximum_total_model_tokens: 192000, fresh_control_runs: false, slots}, source_bindings: bindings, source_bindings_sha256: sha(canonicalJson(bindings)), claim_ceiling: "fixture"};
  const row = task_id => ({task_id, result: {status: "final_context_selected", native_export: {prediction: {}}, receipts: [{kind: "model", dispatched: true, input_tokens: 100, output_tokens: 20, automatic_retries: 0}], index_tokenizer_receipts: []}, evidence: {ledger: {evidence_consistent: true}, windows: {measured_windows_verified: true}}});
  return {freeze, slots, rows: slots.map(slot => row(slot.task_id))};
}

test("development freeze rejects authorization policy drift", () => {
  const f = fixture(); assert.equal(validateHen11Freeze(f.freeze), true);
  const drift = structuredClone(f.freeze); drift.development_execution.prelaunch_authorization_required = true; assert.throws(() => validateHen11Freeze(drift), /development-execution-policy/);
});

test("exact two-worker queue never exceeds two and settles both", async () => {
  const f = fixture(); let active = 0, maximum = 0;
  const rows = await runHen11Workers({slots: f.slots, signal: new AbortController().signal, admit: async () => true, execute: async slot => { maximum = Math.max(maximum, ++active); await new Promise(resolve => setImmediate(resolve)); active--; return f.rows.find(row => row.task_id === slot.task_id); }});
  assert.equal(maximum, 2); assert.deepEqual(rows.map(row => row.task_id), f.freeze.task_denominator);
});

test("settlement is conservative for unknown usage, retries, failure and denominator drift", () => {
  const f = fixture(); validateHen11Freeze(f.freeze);
  const settled = reconcileHen11Settlement({freeze: f.freeze, rows: f.rows}); assert.equal(settled.status, "settled"); assert.equal(settled.model_calls, 2); assert.equal(settled.known_model_tokens, 240);
  const unknown = structuredClone(f.rows); delete unknown[0].result.receipts[0].output_tokens; assert.equal(reconcileHen11Settlement({freeze: f.freeze, rows: unknown}).unknown_usage, true);
  const retried = structuredClone(f.rows); retried[0].result.receipts[0].automatic_retries = 1; assert.equal(reconcileHen11Settlement({freeze: f.freeze, rows: retried}).status, "failed");
  assert.equal(reconcileHen11Settlement({freeze: f.freeze, rows: f.rows.slice(0)}).native_scoring_pending, true);
  assert.equal(reconcileHen11Settlement({freeze: f.freeze, rows: f.rows.slice(0, 1), worker_failure: Error("crash")}).status, "failed");
});

test("asymmetric failure preserves fulfilled and failed paid-call rows", async () => {
  const f = fixture(), partial = structuredClone(f.rows[1]); partial.result.status = "worker-failed";
  await assert.rejects(runHen11Workers({slots: f.slots, signal: new AbortController().signal, admit: async () => true, execute: async slot => {
    if (slot.task_id === "contextbench-1") return f.rows[0]; const error = new Error("boom"); error.partial_row = partial; throw error;
  }}), error => {
    assert.deepEqual(error.partial_rows.map(row => row.task_id), ["contextbench-1", "contextbench-4"]);
    const settlement = reconcileHen11Settlement({freeze: f.freeze, rows: error.partial_rows, worker_failure: error});
    assert.equal(settlement.model_calls, 2); assert.equal(settlement.known_model_tokens, 240); assert.equal(settlement.status, "failed"); return true;
  });
});

test("global campaign deadline aborts both workers", async () => {
  const f = fixture(); let aborted = 0;
  await assert.rejects(runHen11Workers({slots: f.slots, signal: new AbortController().signal, maximum_elapsed_ms: 10, admit: async () => true, execute: async (_slot, signal) => new Promise((resolve, reject) => signal.addEventListener("abort", () => { aborted++; reject(signal.reason); }, {once: true}))}), /worker-failure/);
  assert.equal(aborted, 2);
});

test("runner consumes the exact development freeze without a review artifact", async () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-run-")), f = fixture();
  try {
    const freezePath = join(root, "FREEZE.json"), freezeBytes = `${canonicalJson(f.freeze)}\n`; writeFileSync(freezePath, freezeBytes); let calls = 0;
    const settlement = await runHen11({freezePath, freezeSha256: sha(freezeBytes), signal: new AbortController().signal, execute_slot: async slot => { calls++; return f.rows.find(row => row.task_id === slot.task_id); }, persist_settlement: () => {}});
    assert.equal(settlement.status, "settled"); assert.equal(calls, 2);
    await assert.rejects(runHen11({freezePath, freezeSha256: "0".repeat(64), signal: new AbortController().signal, execute_slot: async () => { calls++; }, persist_settlement: () => {}}), /freeze-drift/); assert.equal(calls, 2);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("settlement artifact is create-only", () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-settlement-")); try { const path = join(root, "run", "SETTLEMENT.json"), write = createOnlySettlementWriter(path); write({status: "failed"}); assert.equal(JSON.parse(readFileSync(path)).status, "failed"); assert.throws(() => createOnlySettlementWriter(path), /settlement-exists/); } finally { rmSync(root, {recursive: true, force: true}); }
});
