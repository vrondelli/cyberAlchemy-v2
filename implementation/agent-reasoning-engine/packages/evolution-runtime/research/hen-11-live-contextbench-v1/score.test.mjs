import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {prepareHen11Scoring, recoverHen11Scoring, scoreHen11, writeHen11ScorePreparation} from "./score.mjs";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
const sha = value => createHash("sha256").update(value).digest("hex");
const deploymentBody = {target_root: "/opt/hen11", runtime_repository_root: "/opt/hen11/repo", execution_host: "187.77.163.194", source_bindings_sha256: "a".repeat(64), config_sha256: "b".repeat(64), cohort_sha256: "c".repeat(64), repositories: []};
const freeze = {schema_version: "are.hen11-contextbench-intent-anchor-freeze/v1", execution_mode: "development", development_execution: {prelaunch_authorization_required: false, cryptographic_signatures_required: false, freeze_consumption_receipt_required: true, independent_postrun_review_required: true}, task_denominator: ["contextbench-1", "contextbench-4"], context_limit: 8000, output_cap: 2048, maximum_workers: 2, maximum_model_calls: 192, maximum_model_tokens: 192000, maximum_automatic_retries: 0, control_runs: 0, execution_host: "187.77.163.194", execution_topology: {kind: "vps-native", host: "187.77.163.194", node_path: "/node", node_version: "v1", node_sha256: "d".repeat(64)}, node_runtime: {path: "/node", version: "v1", sha256: "d".repeat(64), required_node_options: ["--experimental-vm-modules"], launch_wrapper: "/opt/hen11/launch.mjs"}, deployment: {...deploymentBody, deployment_digest: sha(canonicalJson(deploymentBody))},
  native_scoring_runtime: ["bounded_scorer", "configured_wrapper", "source_manifest"].map(role => ({role, path: `/opt/hen11/${role}`, sha256: "e".repeat(64)})), native_scoring_environment: {python: {path: "/usr/bin/python3", sha256: "1".repeat(64)}, sandbox: {path: "/usr/bin/bwrap", sha256: "2".repeat(64)}, modules: {pyarrow: "23.0.1", tree_sitter: "0.26.0", tree_sitter_language_pack: "1.16.2"}}, reviewer_authentication: {schema_version: "are.hen11-reviewer-authentication/v1", domain: "are.hen11.prelaunch.v4", allowed_reviewer_ids: ["vlad", "dave"], quorum: 1, verifier: {path: "/opt/hen11/reviewer-attestation-v1.mjs", sha256: "f".repeat(64)}, trust_registry: {path: "/opt/hen11/reviewer-registry.json", file_sha256: "a".repeat(64), registry_digest: "b".repeat(64)}}, schedule: {assigned_outcomes: 2, maximum_workers: 2, maximum_model_calls: 192, maximum_total_model_tokens: 192000, fresh_control_runs: false, slots: [{task_id: "contextbench-1", arm: "intent-anchor-convergence-r3"}, {task_id: "contextbench-4", arm: "intent-anchor-convergence-r3"}]}, sources: {config_path: "/frozen/config", config_sha256: "b".repeat(64), cohort_path: "/frozen/cohort", cohort_sha256: "c".repeat(64)}, historical_comparison: {}, acceptance: {}, claim_ceiling: "fixture"};
const settlement = {schema_version: "are.hen11-run-settlement/v1", status: "settled", workers_settled: true, unknown_usage: false, within_budget: true, native_scoring_pending: true};
test("prepares but does not execute scoring and writes once", () => { const root = mkdtempSync(join(tmpdir(), "hen11-score-")); try { const predictions = ["contextbench-1", "contextbench-4"].map(id => { const path = join(root, `${id}.json`), bytes = JSON.stringify({id}); writeFileSync(path, bytes); return {task_id: id, path, sha256: sha(bytes)}; }); const value = prepareHen11Scoring({freeze, freeze_sha256: "a".repeat(64), settlement, prediction_bindings: predictions}); assert.equal(value.scoring_execution_admitted, false); assert.equal(value.provider_calls, 0); const output = join(root, "score", "PREPARATION.json"); assert.match(writeHen11ScorePreparation(output, value), /^[a-f0-9]{64}$/); assert.throws(() => writeHen11ScorePreparation(output, value), /output-exists/); } finally { rmSync(root, {recursive: true, force: true}); } });
test("rejects unsettled or drifted evidence", () => { assert.throws(() => prepareHen11Scoring({freeze, freeze_sha256: "a".repeat(64), settlement: {...settlement, unknown_usage: true}, prediction_bindings: []}), /settlement/); });

test("executes both native scorers and enforces the exact acceptance thresholds", async () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-native-score-")); try {
    const runRoot = join(root, "run"), rowRoot = join(runRoot, "rows"), scoreRoot = join(root, "score"), configPath = join(root, "CONFIG.json"), freezePath = join(root, "FREEZE.json"); mkdirSync(rowRoot, {recursive: true});
    const tasks = [{id: "contextbench-1", base_commit: "1".repeat(40)}, {id: "contextbench-4", base_commit: "4".repeat(40)}], slots = tasks.map((task, sequence) => ({sequence, task_id: task.id, instance_id: `${task.id}-instance`, arm: "intent-anchor-convergence-r3"}));
    const configBytes = `${canonicalJson({tasks})}\n`; writeFileSync(configPath, configBytes);
    const fullFreeze = {...freeze, sources: {config_path: configPath, config_sha256: sha(configBytes), cohort_path: join(root, "COHORT.json"), cohort_sha256: "c".repeat(64)}, source_bindings: [], acceptance: {task_1_span_f1_greater_than: 0, two_task_mean_span_f1_greater_than: 0.07327183777122158, task_4_span_f1_at_least: 0.12654367554244316}, schedule: {...freeze.schedule, slots}};
    const rows = slots.map((slot, index) => ({task_id: slot.task_id, result: {native_export: {prediction: {instance_id: slot.instance_id, commit: tasks[index].base_commit}}}})); rows.forEach((row, index) => writeFileSync(join(rowRoot, `${String(index).padStart(2, "0")}.json`), `${canonicalJson(row)}\n`));
    const boundSettlement = {...settlement, row_bindings: rows.map(row => ({task_id: row.task_id, sha256: sha(canonicalJson(row))}))}; writeFileSync(join(runRoot, "SETTLEMENT.json"), `${canonicalJson(boundSettlement)}\n`);
    const freezeBytes = `${canonicalJson(fullFreeze)}\n`; writeFileSync(freezePath, freezeBytes); let calls = 0;
    const report = await scoreHen11({freezePath, freezeSha256: sha(freezeBytes), runRoot, scoreRoot, native_score: async () => { const value = calls++ === 0 ? 0.1 : 0.13; return {native: {final: {span: {coverage: value, precision: value}, file: {coverage: 1, precision: 1}}}}; }});
    assert.equal(calls, 2); assert.equal(report.valid_predictions, 2); assert.equal(report.acceptance_passed, true); assert.equal(report.benchmark_cleared, true); assert.equal(JSON.parse(readFileSync(join(scoreRoot, "RESULTS.json"))).gates.task_4_span_f1, true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("native scorer failure is terminal and recoverable without evaluator replay", async () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-native-fail-")); try {
    const runRoot = join(root, "run"), rowRoot = join(runRoot, "rows"), scoreRoot = join(root, "score"), configPath = join(root, "CONFIG.json"), freezePath = join(root, "FREEZE.json"); mkdirSync(rowRoot, {recursive: true});
    const tasks = [{id: "contextbench-1", base_commit: "1".repeat(40)}, {id: "contextbench-4", base_commit: "4".repeat(40)}], slots = tasks.map((task, sequence) => ({sequence, task_id: task.id, instance_id: `${task.id}-instance`, arm: "intent-anchor-convergence-r3"})), configBytes = `${canonicalJson({tasks})}\n`; writeFileSync(configPath, configBytes);
    const fullFreeze = {...freeze, sources: {config_path: configPath, config_sha256: sha(configBytes), cohort_path: join(root, "COHORT.json"), cohort_sha256: "c".repeat(64)}, source_bindings: [], acceptance: {task_1_span_f1_greater_than: 0, two_task_mean_span_f1_greater_than: 0.07327183777122158, task_4_span_f1_at_least: 0.12654367554244316}, schedule: {...freeze.schedule, slots}};
    const rows = slots.map((slot, index) => ({task_id: slot.task_id, result: {native_export: {prediction: {instance_id: slot.instance_id, commit: tasks[index].base_commit}}}})); rows.forEach((row, index) => writeFileSync(join(rowRoot, `${String(index).padStart(2, "0")}.json`), `${canonicalJson(row)}\n`));
    writeFileSync(join(runRoot, "SETTLEMENT.json"), `${canonicalJson({...settlement, row_bindings: rows.map(row => ({task_id: row.task_id, sha256: sha(canonicalJson(row))}))})}\n`); const freezeBytes = `${canonicalJson(fullFreeze)}\n`; writeFileSync(freezePath, freezeBytes); let calls = 0;
    const report = await scoreHen11({freezePath, freezeSha256: sha(freezeBytes), runRoot, scoreRoot, native_score: async () => { if (calls++ === 1) throw new Error("scorer-crash"); return {native: {final: {span: {coverage: 0.1, precision: 0.1}, file: {coverage: 1, precision: 1}}}}; }});
    assert.equal(report.status, "failed"); assert.equal(report.valid_predictions, 1); assert.equal(report.benchmark_cleared, false); assert.equal(recoverHen11Scoring({freezePath, freezeSha256: sha(freezeBytes), runRoot, scoreRoot}).status, "failed"); assert.equal(calls, 2);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("empty score root crash is terminalized without invoking an evaluator", () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-empty-score-")); try {
    const runRoot = join(root, "run"), scoreRoot = join(root, "score"), freezePath = join(root, "FREEZE.json"); mkdirSync(runRoot); mkdirSync(scoreRoot); writeFileSync(join(runRoot, "SETTLEMENT.json"), `${canonicalJson(settlement)}\n`);
    const freezeBytes = `${canonicalJson(freeze)}\n`; writeFileSync(freezePath, freezeBytes); const report = recoverHen11Scoring({freezePath, freezeSha256: sha(freezeBytes), runRoot, scoreRoot});
    assert.equal(report.status, "failed"); assert.equal(report.valid_predictions, 0); assert.equal(report.benchmark_cleared, false); assert.match(report.failure, /empty-root/); assert.equal(JSON.parse(readFileSync(join(scoreRoot, "SCORE-PROCESS.json"))).status, "failed"); assert.equal(JSON.parse(readFileSync(join(scoreRoot, "RESULTS.json"))).status, "failed");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("settled RESULTS plus running SCORE-PROCESS crash is durably reconciled", () => {
  const root = mkdtempSync(join(tmpdir(), "hen11-results-process-crash-")); try {
    const runRoot = join(root, "run"), scoreRoot = join(root, "score"), freezePath = join(root, "FREEZE.json"); mkdirSync(runRoot); mkdirSync(scoreRoot);
    const settlementBytes = `${canonicalJson(settlement)}\n`, freezeBytes = `${canonicalJson(freeze)}\n`; writeFileSync(join(runRoot, "SETTLEMENT.json"), settlementBytes); writeFileSync(freezePath, freezeBytes);
    const rows = freeze.task_denominator.map(task_id => ({task_id, valid: true, metrics: {span_f1: 0.2}, native: {native: {final: {span: {coverage: 0.2, precision: 0.2}}}}}));
    const results = {schema_version: "are.hen11-native-score/v1", freeze_sha256: sha(freezeBytes), settlement_sha256: sha(settlementBytes), task_denominator: freeze.task_denominator, status: "settled", valid_predictions: 2, rows, gates: {all_assigned_valid: true, task_1_span_f1: true, two_task_mean_span_f1: true, task_4_span_f1: true}, acceptance_passed: true, benchmark_cleared: true, provider_calls: 0, model_calls: 0, claim_ceiling: freeze.claim_ceiling, authority_effect: "none"};
    const resultsBytes = `${canonicalJson(results)}\n`; writeFileSync(join(scoreRoot, "RESULTS.json"), resultsBytes); writeFileSync(join(scoreRoot, "SCORE-PROCESS.json"), `${canonicalJson({schema_version: "are.hen11-score-process/v1", freeze_sha256: sha(freezeBytes), settlement_sha256: sha(settlementBytes), status: "running", outcomes: rows, authority_effect: "none"})}\n`);
    const recovered = recoverHen11Scoring({freezePath, freezeSha256: sha(freezeBytes), runRoot, scoreRoot}), process = JSON.parse(readFileSync(join(scoreRoot, "SCORE-PROCESS.json")));
    assert.equal(recovered.status, "settled"); assert.equal(process.status, "settled"); assert.equal(process.results_sha256, sha(resultsBytes)); assert.deepEqual(process.outcomes, rows);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
