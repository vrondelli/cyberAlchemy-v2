import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, realpathSync, readdirSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {buildAttemptAccounting, pinHen10Run} from "./run-recovery.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen10-composite-score.${reason}`); };

export function validateCompositeSelection({freeze, prior, composite}) {
  need(composite?.schema_version === "are.hen10-composite-evidence-manifest/v1" && Array.isArray(composite.rows) && composite.rows.length === 4, "manifest-shape");
  need(composite.original_schedule_sha256 === prior.schedule.schedule_sha256 && composite.original_schedule_sha256 === freeze.original_schedule_sha256, "schedule-identity");
  const identities = composite.rows.map(row => `${row.sequence}:${row.task_id}:${row.slot_id}`);
  assert.deepEqual(identities, prior.schedule.slots.map(slot => `${slot.sequence}:${slot.task_id}:${slot.slot_id}`), "hen10-composite-score.exact-denominator");
  need(new Set(composite.rows.map(row => row.task_id)).size === 4 && new Set(composite.rows.map(row => row.result_path)).size === 4, "duplicate-selection");
  for (const [index, row] of composite.rows.entries()) {
    const expected = index < 2 ? freeze.preserved[index] : freeze.recovery_slots[index - 2];
    need(row.provenance === (index < 2 ? "hen10-live-v2" : "hen10-recovery-v1"), `provenance:${index}`);
    need(row.task_id === (expected.task_ref ?? expected.task_id) && row.sequence === prior.schedule.slots[index].sequence, `row:${index}`);
    if (index < 2) need(row.runs_root === expected.runs_root && row.source_root === expected.source_root && row.result_path === expected.result_path && row.result_sha256 === expected.result_sha256, `preserved-origin:${index}`);
    else need(row.runs_root === freeze.roots.runs_root && row.source_root === freeze.roots.source_root && row.result_path === join(freeze.roots.runs_root, String(row.sequence).padStart(2, "0"), "result.json"), `recovery-origin:${index}`);
    need(row.evidence?.files_verified === true && row.evidence?.ledger?.evidence_consistent === true && row.evidence?.windows?.measured_windows_verified === true, `evidence:${index}`);
  }
  return true;
}

export function validateRecoveryScoreRoot({freeze, recoveryRoot, freezeSha256, settlement}) {
  const expected = dirname(dirname(resolve(freeze.roots.runs_root)));
  need(resolve(recoveryRoot) === expected, "recovery-root-binding");
  need(settlement?.schema_version === "are.hen10-recovery-process/v1" && settlement.status === "settled" && settlement.freeze_sha256 === freezeSha256 && settlement.workers_settled === true, "recovery-settlement-binding");
  return true;
}

export async function scoreHen10Recovery({freezePath, freezeSha256, recoveryRoot, scoreRoot}) {
  freezePath = resolve(freezePath); recoveryRoot = resolve(recoveryRoot); scoreRoot = resolve(scoreRoot);
  need(sha(readFileSync(freezePath)) === freezeSha256, "freeze-drift");
  const freeze = readJson(freezePath), prior = readJson(freeze.recovery_of.freeze_path);
  need(freeze.schema_version === "are.hen10-contextbench-recovery-freeze/v1", "freeze-schema");
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  for (const binding of prior.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `prior-source-drift:${binding.path}`);
  const {verifyCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
  verifyCandidateSources(freeze.source_bindings, freeze.executable_entries);
  const recoverySettlement = readJson(join(recoveryRoot, "run/SETTLEMENT.json"));
  validateRecoveryScoreRoot({freeze, recoveryRoot, freezeSha256, settlement: recoverySettlement});
  need(recoverySettlement.result?.all_selected_evidence_reconciled === true, "recovery-not-settled");
  const recoveryResultsPath = join(recoveryRoot, "run/metadata_root/RESULTS.json"), compositePath = join(recoveryRoot, "run/metadata_root/COMPOSITE-MANIFEST.json");
  const recoveryResultsSha = sha(readFileSync(recoveryResultsPath)), recoveryResults = readJson(recoveryResultsPath), composite = readJson(compositePath);
  assert.deepEqual(recoverySettlement.result, recoveryResults, "hen10-composite-score.settlement-results-binding");
  need(recoveryResults.composite_manifest_sha256 === sha(readFileSync(compositePath)), "composite-drift");
  validateCompositeSelection({freeze, prior, composite});
  need(!existsSync(scoreRoot), "score-root-exists"); mkdirSync(scoreRoot, {recursive: true, mode: 0o700});
  need(realpathSync(scoreRoot) === scoreRoot && readdirSync(scoreRoot).length === 0, "fresh-score-root");
  const {reconcileComparisonRunFiles} = await import(join(contextRoot, "ranked-source-run-files-r1.mjs"));
  const {prepareComparisonPrediction} = await import(join(contextRoot, "score-ranked-source-r1.mjs"));
  const {summarizeComparisonScores} = await import(join(contextRoot, "ranked-source-score-summary-r1.mjs"));
  const {scoreNativeBounded} = await import(join(contextRoot, "packet-diversity-v1/scorer-bridge-bounded-v4.mjs"));
  const {createStageOutputGuard, MAXIMUM_STAGE_BYTES} = await import(join(contextRoot, "packet-diversity-v1/stage-output-guard.mjs"));
  const {createStagePersistence} = await import(join(contextRoot, "packet-diversity-v1/stage-persistence.mjs"));
  const {guardStorage} = await import(join(contextRoot, "../storage-host-small-run.mjs"));
  const config = readJson(freeze.sources.config_path), guard = createStageOutputGuard({root: scoreRoot}), persistence = createStagePersistence({stage_root: scoreRoot, stage_guard: guard});
  const checkStorage = () => guardStorage({binding: freeze.storage_binding, output: scoreRoot, growth_reservation_bytes: Math.max(0, MAXIMUM_STAGE_BYTES - guard.snapshot().bytes)});
  const prepared = [], reconciliationRows = [];
  const reconcileAll = () => composite.rows.map((row, index) => {
    const slot = prior.schedule.slots[index], run = join(row.runs_root, String(row.sequence).padStart(2, "0")), files = pinHen10Run(run);
    assert.deepEqual(files, row.files, `hen10-composite-score.file-drift:${row.task_id}`);
    need(sha(readFileSync(row.result_path)) === row.result_sha256, `result-drift:${row.task_id}`);
    const armResult = readJson(row.result_path), task = readJson(slot.task_path);
    need(armResult.status === "final_context_selected", `selected-failed-attempt:${row.task_id}`);
    const evidence = reconcileComparisonRunFiles({root: run, cell: slot.cell, task, task_sha256: slot.task_sha256, outcome_result: armResult, expected_identity: row.transport_identity, expected_files: files});
    const ledger = evidence.ledger;
    return {slot_id: slot.slot_id, task_id: slot.task_id, arm: slot.arm, outcome_status: "returned", attempted: true, reconciled: true, status: "reconciled",
      raw_accounting: {known_token_lower_bound: ledger.total_tokens, conservative_total_tokens: ledger.total_tokens, observed_input_tokens: ledger.input_tokens,
        observed_output_tokens: ledger.output_tokens, model_receipts: ledger.model_calls, unknown_model_receipts: 0, raw_accounting_complete: true, provider_healthy: true, issues: []}, evidence, armResult};
  });
  for (const [index, row] of reconcileAll().entries()) {
    const {armResult: ignored, ...reconciliationRow} = row;
    reconciliationRows.push(reconciliationRow);
    const origin = composite.rows[index], preparedPrediction = prepareComparisonPrediction({slot: prior.schedule.slots[index], outcome: {result: row.armResult},
      entry: {files: origin.files}, runs_root: origin.runs_root, source_root: origin.source_root});
    prepared.push(preparedPrediction);
  }
  const nativeOutcomes = prior.schedule.slots.map(slot => ({slot_id: slot.slot_id, task_id: slot.task_id, arm: slot.arm, status: "not-scored", valid: false, native: null}));
  for (const [index, item] of prepared.entries()) {
    checkStorage();
    const native = await scoreNativeBounded({config, prediction: item.prediction, directory: join(scoreRoot, String(index).padStart(2, "0")), stage_root: scoreRoot, stage_guard: guard, persistence});
    need(!native?.native?.error, `native:${index}`); nativeOutcomes[index] = {...nativeOutcomes[index], status: "scored", valid: true, native};
  }
  const postRows = reconcileAll();
  for (const item of prepared) need(item.verify() === true, "post-prediction-integrity");
  assert.deepEqual(postRows.map(({armResult: _, ...row}) => row), reconciliationRows, "hen10-composite-score.post-evidence-integrity");
  const reconciliation = {schema: "are.hen10-composite-reconciliation/v1", schedule_sha256: prior.schedule.schedule_sha256,
    assigned_outcomes: 4, rows: reconciliationRows, reconciled_outcomes: 4, all_run_evidence_reconciled: true};
  const summary = summarizeComparisonScores({schedule: prior.schedule, sources: prior.sources, outcomes: nativeOutcomes, reconciliation,
    outer_process_settled: true, post_score_integrity_verified: true});
  const accounting = buildAttemptAccounting({rows: composite.rows, priorSummary: readJson(freeze.recovery_of.attempt_summary_path), initialSummary: readJson(freeze.initial_attempt.summary_path)});
  assert.deepEqual(accounting, {selected_outcome_accounting: recoveryResults.selected_outcome_accounting, superseded_partial_accounting: recoveryResults.superseded_partial_accounting,
    prelaunch_diagnostics: recoveryResults.prelaunch_diagnostics, all_attempt_expenditure: recoveryResults.all_attempt_expenditure}, "hen10-composite-score.accounting-disagreement");
  const report = {...summary, schema: "are.hen10-composite-recovery-score/v1", evidence_character: "composite recovery evidence set",
    selected_outcome_accounting: accounting.selected_outcome_accounting,
    superseded_partial_accounting: accounting.superseded_partial_accounting,
    prelaunch_diagnostics: accounting.prelaunch_diagnostics,
    all_attempt_expenditure: {...accounting.all_attempt_expenditure, upper_bound: freeze.all_attempt_upper_bound}, composite_manifest_sha256: recoveryResults.composite_manifest_sha256, new_provider_calls: 0,
    claim_ceiling: freeze.claim_ceiling, benchmark_cleared: false, campaign_goal_achieved: false};
  persistence.writeJson(join(scoreRoot, "RESULTS.json"), report, {final: true});
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `post-score-source-drift:${binding.path}`);
  need(sha(readFileSync(recoveryResultsPath)) === recoveryResultsSha, "post-score-results-drift");
  return {...report, results_sha256: sha(readFileSync(join(scoreRoot, "RESULTS.json")))};
}

if (process.argv[1] === import.meta.filename) console.log(canonicalJson(await scoreHen10Recovery({freezePath: process.argv[2], freezeSha256: process.argv[3], recoveryRoot: process.argv[4], scoreRoot: process.argv[5]})));
