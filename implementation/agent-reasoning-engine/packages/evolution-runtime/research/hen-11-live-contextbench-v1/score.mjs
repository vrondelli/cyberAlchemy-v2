import {createHash} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {validateHen11Freeze} from "./run.mjs";
import {scoreNativeBounded} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/scorer-bridge-bounded-v4.mjs";
import {createStageOutputGuard} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/stage-output-guard.mjs";
import {createStagePersistence} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/stage-persistence.mjs";
import {recoveryMetrics} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/score-recovery-campaign.mjs";
const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`hen11-score.${reason}`); };

function durableJson(path, value, {replace = false} = {}) {
  mkdirSync(dirname(path), {recursive: true, mode: 0o700}); const temporary = `${path}.tmp-${process.pid}-${Date.now()}`, fd = openSync(temporary, "wx", 0o600);
  try { writeFileSync(fd, `${canonicalJson(value)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
  try { if (!replace) need(!existsSync(path), "artifact-exists"); renameSync(temporary, path); const directory = openSync(dirname(path), "r"); try { fsyncSync(directory); } finally { closeSync(directory); } } catch (error) { try { unlinkSync(temporary); } catch {} throw error; }
}

const failedReport = ({freezeSha256, settlementBytes, freeze, outcomes, reason}) => ({schema_version: "are.hen11-native-score/v1", freeze_sha256: freezeSha256, settlement_sha256: sha(settlementBytes), task_denominator: freeze.task_denominator, status: "failed", valid_predictions: outcomes.length, rows: outcomes, gates: {all_assigned_valid: false, task_1_span_f1: false, two_task_mean_span_f1: false, task_4_span_f1: false}, acceptance_passed: false, benchmark_cleared: false, failure: reason, provider_calls: 0, model_calls: 0, claim_ceiling: freeze.claim_ceiling, authority_effect: "none"});

export function prepareHen11Scoring({freeze, freeze_sha256, settlement, prediction_bindings}) {
  validateHen11Freeze(freeze); need(/^[a-f0-9]{64}$/.test(freeze_sha256 ?? ""), "freeze-digest");
  need(settlement?.schema_version === "are.hen11-run-settlement/v1" && settlement.status === "settled" && settlement.workers_settled === true && settlement.unknown_usage === false && settlement.within_budget === true && settlement.native_scoring_pending === true, "settlement");
  need(Array.isArray(prediction_bindings) && prediction_bindings.length === 2 && prediction_bindings.map(binding => binding.task_id).join(",") === "contextbench-1,contextbench-4", "predictions");
  const predictions = prediction_bindings.map(binding => { const path = resolve(binding.path), bytes = readFileSync(path); need(sha(bytes) === binding.sha256, `prediction-drift:${binding.task_id}`); return {task_id: binding.task_id, path, sha256: binding.sha256}; });
  return {schema_version: "are.hen11-score-preparation/v1", freeze_sha256, task_denominator: freeze.task_denominator, predictions, scorer: freeze.sources.config_path, historical_comparison: freeze.historical_comparison, acceptance: freeze.acceptance,
    scoring_execution_admitted: false, provider_calls: 0, model_calls: 0, benchmark_cleared: false, authority_effect: "none", claim_ceiling: freeze.claim_ceiling};
}

export function writeHen11ScorePreparation(path, value) {
  path = resolve(path); need(!existsSync(path), "output-exists"); mkdirSync(dirname(path), {recursive: true, mode: 0o700}); writeFileSync(path, `${canonicalJson(value)}\n`, {flag: "wx", mode: 0o600}); return sha(readFileSync(path));
}

export async function scoreHen11({freezePath, freezeSha256, runRoot, scoreRoot, native_score = scoreNativeBounded}) {
  freezePath = resolve(freezePath); runRoot = resolve(runRoot); scoreRoot = resolve(scoreRoot); const freezeBytes = readFileSync(freezePath), freeze = JSON.parse(freezeBytes);
  need(sha(freezeBytes) === freezeSha256, "freeze-drift"); validateHen11Freeze(freeze);
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  const settlementPath = join(runRoot, "SETTLEMENT.json"), settlementBytes = readFileSync(settlementPath), settlement = JSON.parse(settlementBytes);
  need(settlement.schema_version === "are.hen11-run-settlement/v1" && settlement.status === "settled" && settlement.native_scoring_pending === true && settlement.unknown_usage === false && settlement.within_budget === true, "settlement");
  need(!existsSync(scoreRoot), "score-root-exists"); mkdirSync(scoreRoot, {recursive: true, mode: 0o700});
  const processPath = join(scoreRoot, "SCORE-PROCESS.json"); durableJson(processPath, {schema_version: "are.hen11-score-process/v1", freeze_sha256: freezeSha256, settlement_sha256: sha(settlementBytes), status: "running", outcomes: [], authority_effect: "none"});
  const rowDirectory = join(runRoot, "rows"), names = readdirSync(rowDirectory).filter(name => /^\d\d\.json$/.test(name)).sort(); need(names.length === 2, "row-denominator");
  const rows = names.map(name => JSON.parse(readFileSync(join(rowDirectory, name), "utf8")));
  need(rows.map(row => row.task_id).join(",") === freeze.task_denominator.join(","), "row-identity");
  need(canonicalJson(settlement.row_bindings) === canonicalJson(rows.map(row => ({task_id: row.task_id, sha256: sha(canonicalJson(row))}))), "row-binding");
  const config = JSON.parse(readFileSync(freeze.sources.config_path, "utf8")), guard = createStageOutputGuard({root: scoreRoot}), persistence = createStagePersistence({stage_root: scoreRoot, stage_guard: guard}), outcomes = [];
  try { for (const [index, row] of rows.entries()) {
    const prediction = row.result?.native_export?.prediction, slot = freeze.schedule.slots[index], task = config.tasks.find(item => item.id === row.task_id);
    need(prediction && task && prediction.instance_id === slot.instance_id && prediction.commit === task.base_commit, `prediction:${row.task_id}`);
    const native = await native_score({config, prediction, directory: join(scoreRoot, String(index).padStart(2, "0")), stage_root: scoreRoot, stage_guard: guard, persistence});
    need(!native?.native?.error, `native:${row.task_id}`); const metrics = recoveryMetrics(native); outcomes.push({task_id: row.task_id, valid: true, metrics, native});
    durableJson(processPath, {schema_version: "are.hen11-score-process/v1", freeze_sha256: freezeSha256, settlement_sha256: sha(settlementBytes), status: "running", outcomes, authority_effect: "none"}, {replace: true});
  }} catch (error) { const report = failedReport({freezeSha256, settlementBytes, freeze, outcomes, reason: String(error.message)}), resultsPath = join(scoreRoot, "RESULTS.json"); durableJson(resultsPath, report); durableJson(processPath, {...readFileProcess(processPath), status: "failed", failure: String(error.message), results_sha256: sha(readFileSync(resultsPath))}, {replace: true}); return {...report, results_sha256: sha(readFileSync(resultsPath))}; }
  const byTask = new Map(outcomes.map(row => [row.task_id, row])), task1 = byTask.get("contextbench-1")?.metrics?.span_f1, task4 = byTask.get("contextbench-4")?.metrics?.span_f1, mean = (task1 + task4) / 2;
  const gates = {all_assigned_valid: outcomes.length === 2 && outcomes.every(row => row.valid), task_1_span_f1: task1 > freeze.acceptance.task_1_span_f1_greater_than, two_task_mean_span_f1: mean > freeze.acceptance.two_task_mean_span_f1_greater_than, task_4_span_f1: task4 >= freeze.acceptance.task_4_span_f1_at_least};
  const report = {schema_version: "are.hen11-native-score/v1", freeze_sha256: freezeSha256, settlement_sha256: sha(settlementBytes), task_denominator: freeze.task_denominator, status: "settled", valid_predictions: outcomes.length, rows: outcomes, task_1_span_f1: task1, task_4_span_f1: task4, mean_span_f1: mean, gates, acceptance_passed: Object.values(gates).every(Boolean), benchmark_cleared: Object.values(gates).every(Boolean), provider_calls: 0, model_calls: 0, claim_ceiling: freeze.claim_ceiling, authority_effect: "none"};
  const resultsPath = join(scoreRoot, "RESULTS.json"); persistence.writeJson(resultsPath, report, {final: true}); durableJson(processPath, {...readFileProcess(processPath), status: "settled", results_sha256: sha(readFileSync(resultsPath))}, {replace: true}); return {...report, results_sha256: sha(readFileSync(resultsPath))};
}

function readFileProcess(path) { return JSON.parse(readFileSync(path, "utf8")); }

export function recoverHen11Scoring({freezePath, freezeSha256, runRoot, scoreRoot}) {
  freezePath = resolve(freezePath); runRoot = resolve(runRoot); scoreRoot = resolve(scoreRoot); const freezeBytes = readFileSync(freezePath), freeze = JSON.parse(freezeBytes); need(sha(freezeBytes) === freezeSha256, "freeze-drift"); validateHen11Freeze(freeze);
  const settlementBytes = readFileSync(join(runRoot, "SETTLEMENT.json")), settlement = JSON.parse(settlementBytes), settlementSha256 = sha(settlementBytes), processPath = join(scoreRoot, "SCORE-PROCESS.json"), resultsPath = join(scoreRoot, "RESULTS.json");
  need(settlement.schema_version === "are.hen11-run-settlement/v1" && settlement.status === "settled" && settlement.native_scoring_pending === true && settlement.unknown_usage === false && settlement.within_budget === true, "settlement"); need(existsSync(scoreRoot), "score-root-missing");
  if (existsSync(resultsPath)) {
    need(existsSync(processPath), "results-without-process"); const resultsBytes = readFileSync(resultsPath), results = JSON.parse(resultsBytes), process = readFileProcess(processPath);
    need(results.schema_version === "are.hen11-native-score/v1" && results.freeze_sha256 === freezeSha256 && results.settlement_sha256 === settlementSha256 && canonicalJson(results.task_denominator) === canonicalJson(freeze.task_denominator), "results-binding");
    need(["settled", "failed"].includes(results.status) && Array.isArray(results.rows) && results.valid_predictions === results.rows.length && results.provider_calls === 0 && results.model_calls === 0 && results.authority_effect === "none", "results-shape");
    need(results.rows.every((row, index) => row.task_id === freeze.task_denominator[index]), "results-rows");
    if (results.status === "settled") need(results.rows.length === freeze.task_denominator.length && results.rows.every(row => row.valid === true) && typeof results.acceptance_passed === "boolean" && results.benchmark_cleared === results.acceptance_passed, "settled-results");
    else need(results.acceptance_passed === false && results.benchmark_cleared === false && typeof results.failure === "string", "failed-results");
    need(process.schema_version === "are.hen11-score-process/v1" && process.freeze_sha256 === freezeSha256 && process.settlement_sha256 === settlementSha256 && Array.isArray(process.outcomes) && canonicalJson(process.outcomes) === canonicalJson(results.rows), "process-binding");
    need(process.status === "running" || process.status === results.status, "process-status"); const resultsSha256 = sha(resultsBytes);
    if (process.status === "running" || process.results_sha256 !== resultsSha256) durableJson(processPath, {...process, status: results.status, ...(results.status === "failed" ? {failure: results.failure} : {}), results_sha256: resultsSha256}, {replace: true});
    return results;
  }
  if (!existsSync(processPath)) { need(readdirSync(scoreRoot).length === 0, "score-process-missing-with-artifacts"); durableJson(processPath, {schema_version: "are.hen11-score-process/v1", freeze_sha256: freezeSha256, settlement_sha256: sha(settlementBytes), status: "failed", outcomes: [], failure: "score-empty-root-recovery-without-evaluator-replay", authority_effect: "none"}); }
  const process = readFileProcess(processPath), outcomes = Array.isArray(process.outcomes) ? process.outcomes : [], reason = process.failure ?? "score-process-recovery-without-evaluator-replay", report = failedReport({freezeSha256, settlementBytes, freeze, outcomes, reason}); durableJson(resultsPath, report); durableJson(processPath, {...process, status: "failed", failure: reason, results_sha256: sha(readFileSync(resultsPath))}, {replace: true}); return report;
}
