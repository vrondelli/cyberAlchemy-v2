import assert from "node:assert/strict";
import test from "node:test";

import {validateCompositeSelection, validateRecoveryScoreRoot} from "./score-recovery.mjs";
import {buildAttemptAccounting, resolveRecoveryRoots, runRecoveryWorkers, validateRecoveryDefinition} from "./run-recovery.mjs";

function fixture() {
  const slots = Array.from({length: 4}, (_, sequence) => ({sequence, task_id: `contextbench-${sequence + 1}`, slot_id: `slot-${sequence}`}));
  const prior = {schedule: {schedule_sha256: "a".repeat(64), slots}};
  const freeze = {original_schedule_sha256: prior.schedule.schedule_sha256,
    roots: {runs_root: "/recovery/runs", source_root: "/recovery/source"},
    preserved: slots.slice(0, 2).map(slot => ({task_ref: slot.task_id, runs_root: "/prior/runs", source_root: "/prior/source", result_path: `/prior/runs/0${slot.sequence}/result.json`, result_sha256: `${slot.sequence + 1}`.repeat(64)})),
    recovery_slots: slots.slice(2)};
  const rows = slots.map((slot, index) => ({...slot, provenance: index < 2 ? "hen10-live-v2" : "hen10-recovery-v1",
    runs_root: index < 2 ? "/prior/runs" : "/recovery/runs", source_root: index < 2 ? "/prior/source" : "/recovery/source",
    result_path: `${index < 2 ? "/prior/runs" : "/recovery/runs"}/0${index}/result.json`, result_sha256: `${index + 1}`.repeat(64),
    evidence: {files_verified: true, ledger: {evidence_consistent: true, total_tokens: 100 + index}, windows: {measured_windows_verified: true}}}));
  const composite = {schema_version: "are.hen10-composite-evidence-manifest/v1", original_schedule_sha256: prior.schedule.schedule_sha256, rows};
  return {freeze, prior, composite};
}

test("accepts the exact two-preserved plus two-recovered denominator", () => {
  const value = fixture();
  assert.equal(validateCompositeSelection(value), true);
  value.composite.rows.forEach((row, index) => Object.assign(row.evidence.ledger, {model_calls: index + 1, request_tokenizer_calls: index + 2, index_tokenizer_calls: index + 3}));
  assert.deepEqual(buildAttemptAccounting({rows: value.composite.rows,
    priorSummary: {campaign_accounting: {failed_transport_attempts: 2, cancelled_transport_attempts: 0}, tasks: [
      {reconciled: true}, {reconciled: true}, {reconciled: false, model_calls: 12, request_tokenizer_calls: 37, index_tokenizer_calls: 17, known_model_tokens: 45284},
      {reconciled: false, model_calls: 7, request_tokenizer_calls: 22, index_tokenizer_calls: 20, known_model_tokens: 24379}]},
    initialSummary: {failure: {failed_transport_attempts: 1, cancelled_transport_attempts: 1}, diagnostic_provider_calls_after_attempt: [{kind: "tokenizer", status: 200}, {kind: "tokenizer", status: 200}]}}), {
    selected_outcome_accounting: {model_calls: 10, request_tokenizer_calls: 14, index_tokenizer_calls: 18, model_tokens: 406},
    superseded_partial_accounting: {model_calls: 19, request_tokenizer_calls: 59, index_tokenizer_calls: 37, model_tokens: 69663, failed_transport_attempts: 2, cancelled_transport_attempts: 0},
    prelaunch_diagnostics: {successful_tokenizer_calls: 2, failed_transport_attempts: 1, cancelled_transport_attempts: 1},
    all_attempt_expenditure: {model_calls: 29, request_tokenizer_calls: 73, index_tokenizer_calls: 55, diagnostic_tokenizer_calls: 2, known_model_tokens: 70069, failed_transport_attempts: 3, cancelled_transport_attempts: 1}
  });
});

test("recovery definition is the exact original unfinished suffix", () => {
  const slots = Array.from({length: 4}, (_, sequence) => ({sequence, task_id: `contextbench-${sequence + 1}`, slot_id: `slot-${sequence}`}));
  const freeze = {maximum_workers: 2, maximum_model_calls: 192, maximum_model_tokens: 192000, maximum_automatic_retries: 0,
    recovery_slots: structuredClone(slots.slice(2)), preserved: slots.slice(0, 2).map(slot => ({sequence: slot.sequence, task_ref: slot.task_id, slot_id: slot.slot_id}))};
  assert.equal(validateRecoveryDefinition({freeze, prior: {schedule: {slots}}}), true);
  freeze.recovery_slots[0].slot_id = "drift";
  assert.throws(() => validateRecoveryDefinition({freeze, prior: {schedule: {slots}}}));
});

test("two-task worker dispatch admits only tasks 3-4 with at most two active", async () => {
  const slots = [{task_id: "contextbench-3"}, {task_id: "contextbench-4"}], admitted = [], executed = [];
  let active = 0, maximumActive = 0;
  const result = await runRecoveryWorkers({slots, signal: new AbortController().signal,
    admit: async slot => { admitted.push(slot.task_id); return true; },
    execute: async slot => { executed.push(slot.task_id); maximumActive = Math.max(maximumActive, ++active); await new Promise(resolve => setImmediate(resolve)); active--; return slot.task_id; }});
  assert.deepEqual(admitted.sort(), ["contextbench-3", "contextbench-4"]); assert.deepEqual(executed.sort(), admitted); assert.deepEqual(result.sort(), admitted); assert.ok(maximumActive <= 2);
});

test("worker failure aborts its peer and waits for cancellation settlement", async () => {
  const slots = [{task_id: "contextbench-3"}, {task_id: "contextbench-4"}]; let peerSettled = false;
  await assert.rejects(runRecoveryWorkers({slots, signal: new AbortController().signal, admit: async () => true,
    execute: async (slot, signal) => {
      if (slot.task_id === "contextbench-3") { await new Promise(resolve => setImmediate(resolve)); throw new Error("reconciliation-failed"); }
      await new Promise(resolve => signal.aborted ? resolve() : signal.addEventListener("abort", resolve, {once: true})); peerSettled = true; throw new Error("cancelled");
    }}), error => error.workers_settled === true && error.worker_results.length === 2);
  assert.equal(peerSettled, true);
});

test("denied storage admission prevents execution", async () => {
  let executions = 0;
  await assert.rejects(runRecoveryWorkers({slots: [{task_id: "contextbench-3"}, {task_id: "contextbench-4"}], signal: new AbortController().signal,
    admit: async () => false, execute: async () => { executions++; }}), /worker-failure/);
  assert.equal(executions, 0);
});

test("rejects duplicate, missing, failed, and origin-drift selections", () => {
  for (const mutate of [
    value => value.composite.rows.pop(),
    value => { value.composite.rows[3].task_id = value.composite.rows[2].task_id; },
    value => { value.composite.rows[2].evidence.files_verified = false; },
    value => { value.composite.rows[1].result_path = "/wrong/result.json"; },
    value => { value.composite.rows[3].runs_root = "/prior/runs"; }
  ]) {
    const value = fixture(); mutate(value); assert.throws(() => validateCompositeSelection(value));
  }
});

test("scorer accepts only the frozen recovery root and exact settled freeze", () => {
  const freeze = {roots: {runs_root: "/evidence/v6/run/runs_root"}}, freezeSha256 = "a".repeat(64);
  const settlement = {schema_version: "are.hen10-recovery-process/v1", status: "settled", freeze_sha256: freezeSha256, workers_settled: true};
  assert.equal(validateRecoveryScoreRoot({freeze, recoveryRoot: "/evidence/v6", freezeSha256, settlement}), true);
  assert.throws(() => validateRecoveryScoreRoot({freeze, recoveryRoot: "/forged", freezeSha256, settlement}), /recovery-root-binding/);
  assert.throws(() => validateRecoveryScoreRoot({freeze, recoveryRoot: "/evidence/v6", freezeSha256, settlement: {...settlement, freeze_sha256: "b".repeat(64)}}), /recovery-settlement-binding/);
  assert.throws(() => validateRecoveryScoreRoot({freeze, recoveryRoot: "/evidence/v6", freezeSha256, settlement: {...settlement, workers_settled: false}}), /recovery-settlement-binding/);
});

test("recovery roots resolve as three unary path values", () => {
  assert.deepEqual(resolveRecoveryRoots({runs_root: "/evidence/run/runs", source_root: "/evidence/run/source", metadata_root: "/evidence/run/metadata"}),
    ["/evidence/run/runs", "/evidence/run/source", "/evidence/run/metadata"]);
  assert.throws(() => resolveRecoveryRoots({runs_root: [], source_root: "/source", metadata_root: "/metadata"}), /roots-values/);
});
