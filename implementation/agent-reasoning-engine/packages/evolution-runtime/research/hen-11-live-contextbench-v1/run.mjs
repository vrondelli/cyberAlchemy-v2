import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {INTENT_ANCHOR_ARM, runIntentAnchorArm} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen11-run.${reason}`); };

export function validateHen11Freeze(freeze) {
  need(freeze?.schema_version === "are.hen11-contextbench-intent-anchor-freeze/v1", "freeze-schema");
  assert.deepEqual(freeze.task_denominator, ["contextbench-1", "contextbench-4"], "hen11-run.denominator");
  need(freeze.context_limit === 8000 && freeze.output_cap === 2048 && freeze.maximum_workers === 2 && freeze.maximum_model_calls === 192 && freeze.maximum_model_tokens === 192000 && freeze.maximum_automatic_retries === 0 && freeze.control_runs === 0, "limits");
  need(freeze.schedule?.assigned_outcomes === 2 && freeze.schedule.maximum_workers === 2 && freeze.schedule.maximum_model_calls === 192 && freeze.schedule.maximum_total_model_tokens === 192000 && freeze.schedule.fresh_control_runs === false, "schedule-limits");
  need(freeze.schedule.slots.map(slot => slot.task_id).join(",") === "contextbench-1,contextbench-4" && freeze.schedule.slots.every(slot => slot.arm === "intent-anchor-convergence-r3"), "schedule-denominator");
  need(/^[a-f0-9]{64}$/.test(freeze.sources?.config_sha256 ?? "") && /^[a-f0-9]{64}$/.test(freeze.sources?.cohort_sha256 ?? ""), "generated-bindings");
  need(freeze.node_runtime?.path === freeze.execution_topology?.node_path && freeze.node_runtime?.version === freeze.execution_topology?.node_version && freeze.node_runtime?.sha256 === freeze.execution_topology?.node_sha256, "node-runtime-binding");
  assert.deepEqual(freeze.node_runtime.required_node_options, ["--experimental-vm-modules"], "hen11-run.node-runtime-options");
  need(freeze.execution_topology?.kind === "vps-native" && freeze.execution_host === freeze.execution_topology.host && freeze.deployment?.execution_host === freeze.execution_host, "vps-topology");
  need(Array.isArray(freeze.native_scoring_runtime) && freeze.native_scoring_runtime.length === 3 && freeze.native_scoring_runtime.map(binding => binding.role).join(",") === "bounded_scorer,configured_wrapper,source_manifest" && freeze.native_scoring_runtime.every(binding => /^[a-f0-9]{64}$/.test(binding.sha256 ?? "")), "native-scoring-runtime");
  need(freeze.native_scoring_environment?.python?.path === "/usr/bin/python3" && /^[a-f0-9]{64}$/.test(freeze.native_scoring_environment.python.sha256 ?? "") && freeze.native_scoring_environment?.sandbox?.path === "/usr/bin/bwrap" && /^[a-f0-9]{64}$/.test(freeze.native_scoring_environment.sandbox.sha256 ?? "") && canonicalJson(freeze.native_scoring_environment.modules) === canonicalJson({pyarrow: "23.0.1", tree_sitter: "0.26.0", tree_sitter_language_pack: "1.16.2"}), "native-scoring-environment");
  need(freeze.execution_mode === "development", "execution-mode");
  need(freeze.development_execution?.prelaunch_authorization_required === false && freeze.development_execution?.cryptographic_signatures_required === false && freeze.development_execution?.freeze_consumption_receipt_required === true && freeze.development_execution?.independent_postrun_review_required === true, "development-execution-policy");
  const deployment = {...freeze.deployment}; delete deployment.deployment_digest; need(freeze.deployment.deployment_digest === digest(deployment), "deployment-digest");
  if (freeze.maximum_campaign_elapsed_seconds !== undefined) need(Number.isSafeInteger(freeze.maximum_campaign_elapsed_seconds) && freeze.maximum_campaign_elapsed_seconds > 0, "campaign-deadline");
  return true;
}

const digest = value => sha(canonicalJson(value));

export async function runHen11Workers({slots, signal, admit, execute, maximum_elapsed_ms = 14_400_000}) {
  need(Array.isArray(slots) && slots.length === 2 && slots.map(slot => slot.task_id).join(",") === "contextbench-1,contextbench-4", "worker-slots");
  need(signal instanceof AbortSignal && typeof admit === "function" && typeof execute === "function", "worker-dependencies");
  need(Number.isSafeInteger(maximum_elapsed_ms) && maximum_elapsed_ms > 0, "worker-deadline");
  const controller = new AbortController(), parentAbort = () => controller.abort(signal.reason), deadline = setTimeout(() => controller.abort(new Error("hen11-run.campaign-deadline")), maximum_elapsed_ms); signal.addEventListener("abort", parentAbort, {once: true}); if (signal.aborted) parentAbort();
  try {
    const workers = await Promise.allSettled(slots.map(async slot => {
      if (controller.signal.aborted) throw new Error("hen11-run.worker-cancelled-before-admission");
      try { need(await admit(slot) === true, `worker-admission:${slot.task_id}`); return await execute(slot, controller.signal); }
      catch (error) { controller.abort(); throw error; }
    }));
    if (!workers.every(worker => worker.status === "fulfilled")) {
      const error = new Error(`hen11-run.worker-failure:${workers.filter(worker => worker.status === "rejected").map(worker => worker.reason?.message ?? "unknown").join(";")}`);
      error.workers_settled = true; error.worker_results = workers.map((worker, index) => worker.status === "fulfilled" ? {task_id: slots[index].task_id, status: "fulfilled"} : {task_id: slots[index].task_id, status: "rejected", error: String(worker.reason?.message ?? "unknown")});
      error.partial_rows = workers.flatMap(worker => worker.status === "fulfilled" ? [worker.value] : worker.reason?.partial_row ? [worker.reason.partial_row] : []); throw error;
    }
    return workers.map(worker => worker.value);
  } finally { clearTimeout(deadline); signal.removeEventListener("abort", parentAbort); }
}

export function reconcileHen11Settlement({freeze, rows, worker_failure = null, ledger_receipts = []}) {
  validateHen11Freeze(freeze); need(Array.isArray(rows), "rows");
  rows = [...rows].sort((left, right) => freeze.task_denominator.indexOf(left.task_id) - freeze.task_denominator.indexOf(right.task_id));
  const exactDenominator = rows.length === 2 && rows.map(row => row.task_id).join(",") === "contextbench-1,contextbench-4";
  let model_calls = 0, known_model_tokens = 0, unknown_usage = false, automatic_retries = 0;
  const seen = new Set();
  for (const row of rows) {
    const receipts = [...(row.result?.receipts ?? []), ...(row.result?.index_tokenizer_receipts ?? [])];
    for (const receipt of receipts) {
      const key = `${receipt.kind}:${receipt.request_sha256}`; seen.add(key);
      automatic_retries += Number.isSafeInteger(receipt.automatic_retries) ? receipt.automatic_retries : 0;
      if (receipt.kind !== "model" || receipt.dispatched !== true) continue; model_calls++;
      if (Number.isSafeInteger(receipt.input_tokens) && receipt.input_tokens >= 0 && Number.isSafeInteger(receipt.output_tokens) && receipt.output_tokens >= 0) known_model_tokens += receipt.input_tokens + receipt.output_tokens; else unknown_usage = true;
    }
  }
  for (const receipt of ledger_receipts) {
    const key = `${receipt.kind}:${receipt.request_sha256}`; if (seen.has(key)) continue; seen.add(key);
    automatic_retries += Number.isSafeInteger(receipt.automatic_retries) ? receipt.automatic_retries : 0;
    if (receipt.kind !== "model" || receipt.dispatched !== true) continue; model_calls++;
    if (Number.isSafeInteger(receipt.input_tokens) && receipt.input_tokens >= 0 && Number.isSafeInteger(receipt.output_tokens) && receipt.output_tokens >= 0) known_model_tokens += receipt.input_tokens + receipt.output_tokens; else unknown_usage = true;
  }
  const complete = exactDenominator && !worker_failure && rows.every(row => row.result?.status === "final_context_selected" && row.result.native_export && row.evidence?.ledger?.evidence_consistent === true && row.evidence?.windows?.measured_windows_verified === true);
  const within_budget = model_calls <= 192 && known_model_tokens <= 192000 && automatic_retries === 0;
  return {schema_version: "are.hen11-run-settlement/v1", status: complete && within_budget && !unknown_usage ? "settled" : "failed", workers_settled: true, task_denominator: freeze.task_denominator, completed_tasks: rows.filter(row => row.result?.status === "final_context_selected").length, observed_tasks: rows.map(row => row.task_id), row_bindings: rows.map(row => ({task_id: row.task_id, sha256: digest(row)})), model_calls, known_model_tokens, unknown_usage, automatic_retries, within_budget,
    transport_ledger_receipts: ledger_receipts.length, failure: worker_failure ? {message: String(worker_failure.message), worker_results: worker_failure.worker_results ?? null} : null, native_scoring_pending: complete && within_budget && !unknown_usage, benchmark_cleared: false, authority_effect: "none", claim_ceiling: freeze.claim_ceiling};
}

export function createHen11LiveSlotExecutor({config, candidate_views, runtime_for_slot}) {
  need(config?.tasks && candidate_views instanceof Map && typeof runtime_for_slot === "function", "live-executor-dependencies");
  return async (slot, signal) => {
    need(slot.arm === INTENT_ANCHOR_ARM && candidate_views.has(slot.task_id), `live-slot:${slot.task_id}`);
    const runtime = await runtime_for_slot(slot, signal); need(runtime && typeof runtime === "object", `live-runtime:${slot.task_id}`);
    return runIntentAnchorArm({...runtime, config, task_id: slot.task_id, arm: INTENT_ANCHOR_ARM, candidate_view: candidate_views.get(slot.task_id), signal});
  };
}

export async function runHen11({freezePath, freezeSha256, signal, execute_slot, persist_settlement, collect_ledger_receipts = () => []}) {
  freezePath = resolve(freezePath); const freezeBytes = readFileSync(freezePath); need(sha(freezeBytes) === freezeSha256, "freeze-drift");
  const freeze = JSON.parse(freezeBytes); validateHen11Freeze(freeze);
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  need(sha(readFileSync(freeze.sources.config_path)) === freeze.sources.config_sha256, "config-drift");
  need(sha(readFileSync(freeze.sources.cohort_path)) === freeze.sources.cohort_sha256, "cohort-drift");
  need(typeof execute_slot === "function" && typeof persist_settlement === "function", "execution-dependencies");
  let rows = [], failure = null;
  try { rows = await runHen11Workers({slots: freeze.schedule.slots, signal, admit: async () => true, execute: execute_slot, maximum_elapsed_ms: freeze.maximum_campaign_elapsed_seconds * 1000}); }
  catch (error) { failure = error; rows = Array.isArray(error.partial_rows) ? error.partial_rows : []; }
  const ledger_receipts = collect_ledger_receipts(); need(Array.isArray(ledger_receipts), "ledger-receipts");
  const settlement = reconcileHen11Settlement({freeze, rows, worker_failure: failure, ledger_receipts}); persist_settlement(settlement);
  if (failure) throw Object.assign(failure, {settlement}); return settlement;
}

export function createOnlySettlementWriter(path) {
  path = resolve(path); need(!existsSync(path), "settlement-exists"); mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  return value => {
    const temporary = `${path}.tmp-${process.pid}-${Date.now()}`, descriptor = openSync(temporary, "wx", 0o600);
    try { writeFileSync(descriptor, `${canonicalJson(value)}\n`); fsyncSync(descriptor); } finally { closeSync(descriptor); }
    try { need(!existsSync(path), "settlement-exists"); renameSync(temporary, path); const directory = openSync(dirname(path), "r"); try { fsyncSync(directory); } finally { closeSync(directory); } }
    catch (error) { try { unlinkSync(temporary); } catch {} throw error; }
  };
}

if (process.argv[1] === import.meta.filename) {
  console.error(canonicalJson({status: "disabled", reason: "hen11-run.requires-reviewed-host-executor", authority_effect: "none"})); process.exitCode = 2;
}
