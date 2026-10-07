import {createHash} from "node:crypto";
import {constants, closeSync, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, readSync, realpathSync, writeFileSync} from "node:fs";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import assert from "node:assert/strict";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {verifyHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";
import {createRemoteMountedCredentialBinding, createRemoteMountedPost} from "./remote-mounted-glm-v1.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen10-recovery.${reason}`); };
const within = (root, path) => { const part = relative(root, path); return part === "" || (part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part)); };

export function validateRecoveryDefinition({freeze, prior}) {
  need(freeze.maximum_workers === 2 && freeze.maximum_model_calls === 192 && freeze.maximum_model_tokens === 192000 && freeze.maximum_automatic_retries === 0, "recovery-limits");
  assert.deepEqual(freeze.recovery_slots, prior.schedule.slots.slice(2), "hen10-recovery.exact-unfinished-slots");
  need(freeze.preserved.length === 2 && freeze.preserved.every((row, index) => row.sequence === index && row.task_ref === prior.schedule.slots[index].task_id && row.slot_id === prior.schedule.slots[index].slot_id), "preserved-slots");
  return true;
}

export async function runRecoveryWorkers({slots, signal, admit, execute}) {
  need(Array.isArray(slots) && slots.length === 2 && slots.map(slot => slot.task_id).join(",") === "contextbench-3,contextbench-4", "worker-slots");
  need(signal instanceof AbortSignal && typeof admit === "function" && typeof execute === "function", "worker-dependencies");
  const controller = new AbortController(), parentAbort = () => controller.abort();
  signal.addEventListener("abort", parentAbort, {once: true}); if (signal.aborted) parentAbort();
  try {
    const workers = await Promise.allSettled(slots.map(async slot => {
      if (controller.signal.aborted) throw new Error("hen10-recovery.worker-cancelled-before-admission");
      try { need(await admit(slot) === true, `worker-admission:${slot.task_id}`); return await execute(slot, controller.signal); }
      catch (error) { controller.abort(); throw error; }
    }));
    if (!workers.every(worker => worker.status === "fulfilled")) {
      const error = new Error(`hen10-recovery.worker-failure:${workers.filter(worker => worker.status === "rejected").map(worker => worker.reason?.message ?? "unknown").join(";")}`);
      error.worker_results = workers.map((worker, index) => worker.status === "fulfilled" ? {task_id: slots[index].task_id, status: "fulfilled"} : {task_id: slots[index].task_id, status: "rejected", error: String(worker.reason?.message ?? "unknown")});
      error.workers_settled = true; throw error;
    }
    return workers.map(worker => worker.value);
  } finally { signal.removeEventListener("abort", parentAbort); }
}

export function buildAttemptAccounting({rows, priorSummary, initialSummary}) {
  need(rows.length === 4 && priorSummary?.campaign_accounting && initialSummary?.failure, "attempt-accounting-input");
  const selected = rows.reduce((value, row) => ({model_calls: value.model_calls + row.evidence.ledger.model_calls,
    request_tokenizer_calls: value.request_tokenizer_calls + row.evidence.ledger.request_tokenizer_calls,
    index_tokenizer_calls: value.index_tokenizer_calls + row.evidence.ledger.index_tokenizer_calls,
    model_tokens: value.model_tokens + row.evidence.ledger.total_tokens}), {model_calls: 0, request_tokenizer_calls: 0, index_tokenizer_calls: 0, model_tokens: 0});
  const supersededTasks = priorSummary.tasks.filter(task => task.reconciled === false);
  const superseded = {model_calls: supersededTasks.reduce((n, task) => n + task.model_calls, 0), request_tokenizer_calls: supersededTasks.reduce((n, task) => n + task.request_tokenizer_calls, 0),
    index_tokenizer_calls: supersededTasks.reduce((n, task) => n + task.index_tokenizer_calls, 0), model_tokens: supersededTasks.reduce((n, task) => n + task.known_model_tokens, 0),
    failed_transport_attempts: priorSummary.campaign_accounting.failed_transport_attempts, cancelled_transport_attempts: priorSummary.campaign_accounting.cancelled_transport_attempts};
  const diagnostics = {successful_tokenizer_calls: initialSummary.diagnostic_provider_calls_after_attempt.filter(call => call.kind === "tokenizer" && call.status === 200).length,
    failed_transport_attempts: initialSummary.failure.failed_transport_attempts, cancelled_transport_attempts: initialSummary.failure.cancelled_transport_attempts};
  return {selected_outcome_accounting: selected, superseded_partial_accounting: superseded, prelaunch_diagnostics: diagnostics,
    all_attempt_expenditure: {model_calls: selected.model_calls + superseded.model_calls, request_tokenizer_calls: selected.request_tokenizer_calls + superseded.request_tokenizer_calls,
      index_tokenizer_calls: selected.index_tokenizer_calls + superseded.index_tokenizer_calls, diagnostic_tokenizer_calls: diagnostics.successful_tokenizer_calls,
      known_model_tokens: selected.model_tokens + superseded.model_tokens, failed_transport_attempts: superseded.failed_transport_attempts + diagnostics.failed_transport_attempts,
      cancelled_transport_attempts: superseded.cancelled_transport_attempts + diagnostics.cancelled_transport_attempts}};
}

export function resolveRecoveryRoots(roots) {
  need(roots && typeof roots === "object" && !Array.isArray(roots), "roots-shape");
  const values = [roots.runs_root, roots.source_root, roots.metadata_root];
  need(values.every(path => typeof path === "string" && path.length > 0), "roots-values");
  return values.map(path => resolve(path));
}

export function pinHen10Run(root) {
  need(realpathSync(root) === root, "run-canonical");
  const names = ["source-index.json", "started.json", "result.json", "completed.json", "events.jsonl", "state/glm-transport-ledger.json", "state/driver-binding.json"];
  const files = {}; let total = 0;
  for (const name of names) {
    let path = root;
    for (const part of name.split("/")) { path = join(path, part); need(!lstatSync(path).isSymbolicLink(), "run-symlink"); }
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const stat = fstatSync(fd); need(stat.isFile() && stat.size <= 128 * 1024 * 1024 - total, "run-size"); total += stat.size;
      const digest = createHash("sha256"), buffer = Buffer.alloc(65536); let offset = 0;
      while (offset < stat.size) { const count = readSync(fd, buffer, 0, Math.min(buffer.length, stat.size - offset), offset); need(count > 0, "run-short-read"); digest.update(buffer.subarray(0, count)); offset += count; }
      need(fstatSync(fd).size === stat.size, "run-size-changed"); files[name] = digest.digest("hex");
    } finally { closeSync(fd); }
  }
  return files;
}

export async function runHen10Recovery({freezePath, freezeSha256, reviewPath, signal}) {
  freezePath = resolve(freezePath); reviewPath = resolve(reviewPath);
  const freezeBytes = readFileSync(freezePath); need(sha(freezeBytes) === freezeSha256, "freeze-drift");
  const freeze = JSON.parse(freezeBytes); need(freeze.schema_version === "are.hen10-contextbench-recovery-freeze/v1", "freeze-schema");
  const review = readJson(reviewPath);
  need(review.schema_version === "are.hen10-independent-recovery-review/v1" && review.decision === "PASS" && review.dispatch_admitted === true && review.freeze_sha256 === freezeSha256 && review.findings.length === 0, "independent-review");
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  const priorBytes = readFileSync(freeze.recovery_of.freeze_path); need(sha(priorBytes) === freeze.recovery_of.freeze_sha256, "prior-freeze-drift");
  const prior = JSON.parse(priorBytes); need(prior.schema_version === "are.hen10-contextbench-live-freeze/v1", "prior-freeze-schema");
  for (const binding of prior.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `prior-source-drift:${binding.path}`);
  validateRecoveryDefinition({freeze, prior}); need(freeze.control_runs === 0, "recovery-policy");
  const {verifyCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
  const {verifyRankedSourceHintsSchedule} = await import(join(contextRoot, "ranked-source-hints-schedule-r2.mjs"));
  const {reconcileComparisonCampaignEvidence} = await import(join(contextRoot, "ranked-source-evidence-manifest-r1.mjs"));
  const {reconcileComparisonRunFiles} = await import(join(contextRoot, "ranked-source-run-files-r1.mjs"));
  const {runComparisonArm} = await import(join(contextRoot, "ranked-source-arm-r1.mjs"));
  const {comparisonLiveClientFactory} = await import(join(contextRoot, "ranked-source-live-client-r1.mjs"));
  const {providerAttemptHealth} = await import(join(contextRoot, "provider-attempt-health.mjs"));
  const {createStageOutputGuard, MAXIMUM_STAGE_BYTES} = await import(join(contextRoot, "comparison-output-guard.mjs"));
  const {createStageOutputGuard: createMetadataGuard} = await import(join(contextRoot, "packet-diversity-v1/stage-output-guard.mjs"));
  const {createStagePersistence} = await import(join(contextRoot, "packet-diversity-v1/stage-persistence.mjs"));
  const {guardStorage} = await import(join(contextRoot, "../storage-host-small-run.mjs"));
  verifyCandidateSources(freeze.source_bindings, freeze.executable_entries);
  verifyRankedSourceHintsSchedule({schedule: prior.schedule, ...prior.sources});
  const views = new Map();
  for (const binding of freeze.candidate_views) {
    need(sha(readFileSync(binding.path)) === binding.sha256, `view-drift:${binding.task_ref}`);
    const view = readJson(binding.path); need(verifyHenCandidateView(view).ok && view.view_digest === binding.view_digest && view.task_ref === binding.task_ref, `view:${binding.task_ref}`); views.set(binding.task_ref, view);
  }
  need(views.size === 2, "candidate-views");
  const config = readJson(freeze.sources.config_path);
  const priorManifest = readJson(freeze.recovery_of.manifest_path), priorResults = readJson(freeze.recovery_of.results_path);
  need(sha(readFileSync(freeze.recovery_of.manifest_path)) === freeze.recovery_of.manifest_sha256 && sha(readFileSync(freeze.recovery_of.results_path)) === freeze.recovery_of.results_sha256, "prior-evidence-drift");
  const priorEvidence = reconcileComparisonCampaignEvidence({outcome_root: prior.roots.outcome_root, runs_root: prior.roots.runs_root,
    schedule: prior.schedule, sources: prior.sources, manifest: priorManifest, expected_manifest_sha256: priorResults.manifest_sha256});
  need(priorEvidence.rows.slice(0, 2).every(row => row.reconciled === true) && priorEvidence.rows.slice(2).every(row => row.reconciled === false), "prior-reconciliation-boundary");

  const runRoot = dirname(freeze.roots.runs_root); need(!existsSync(runRoot), "run-root-exists"); mkdirSync(runRoot, {recursive: true, mode: 0o700});
  for (const root of Object.values(freeze.roots)) mkdirSync(root, {mode: 0o700});
  const roots = resolveRecoveryRoots(freeze.roots); need(roots.every((left, i) => roots.every((right, j) => i === j || (!within(left, right) && !within(right, left)))), "root-overlap");
  const runGuard = createStageOutputGuard({root: freeze.roots.runs_root});
  const metadataGuard = createMetadataGuard({root: freeze.roots.metadata_root});
  const runPersistence = createStagePersistence({stage_root: freeze.roots.runs_root, stage_guard: runGuard});
  const metadataPersistence = createStagePersistence({stage_root: freeze.roots.metadata_root, stage_guard: metadataGuard});
  const SOURCE_BYTES = 1024 ** 3;
  function sourceUsage() {
    if (!existsSync(freeze.roots.source_root)) return {bytes: 0, entries: 0};
    need(realpathSync(freeze.roots.source_root) === freeze.roots.source_root, "source-root"); let bytes = 0, entries = 0;
    const walk = path => { const stat = lstatSync(path); need(++entries <= 100000 && !stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), "source-entry"); bytes += Math.max(stat.size, stat.blocks * 512); need(Number.isSafeInteger(bytes) && bytes <= SOURCE_BYTES, "source-budget"); if (stat.isDirectory()) for (const name of readdirSync(path)) walk(join(path, name)); };
    walk(freeze.roots.source_root); return {bytes, entries};
  }
  const checkStorage = () => {
    const usage = sourceUsage(), runState = runGuard.snapshot(), metadataState = metadataGuard.snapshot();
    need(!runState.poisoned && !metadataState.poisoned, "persistence-poisoned");
    const growth = SOURCE_BYTES - usage.bytes + Math.max(0, MAXIMUM_STAGE_BYTES - runState.bytes) + Math.max(0, metadataState.maximum_bytes - metadataState.bytes);
    return guardStorage({binding: freeze.storage_binding, output: runRoot, growth_reservation_bytes: growth});
  };
  const allowed = new Map(freeze.recovery_slots.map(slot => [slot.task_id, slot]));
  const admitSource = ({task, cache, source_root: assigned, phase}) => {
    need(["before-prepare", "before-base", "before-work"].includes(phase), "source-phase");
    const slot = allowed.get([...allowed.values()].find(value => value.instance_id === task.instance_id)?.task_id);
    need(slot && resolve(cache) === resolve(config.tasks.find(row => row.id === slot.task_id).repository_cache) && resolve(assigned) === join(freeze.roots.source_root, String(slot.sequence).padStart(2, "0")), "source-assignment");
    checkStorage(); return true;
  };
  const started = {schema_version: "are.hen10-recovery-process/v1", freeze_sha256: freezeSha256, review_sha256: sha(readFileSync(reviewPath)), started_at: new Date().toISOString(), pid: process.pid, status: "running", authority_effect: "none"};
  writeFileSync(join(runRoot, "PROCESS.json"), `${canonicalJson(started)}\n`, {flag: "wx", mode: 0o600});
  const controller = new AbortController(); const parentAbort = () => controller.abort(); signal?.addEventListener("abort", parentAbort, {once: true}); if (signal?.aborted) parentAbort();
  let result, failure;
  try {
    checkStorage();
    const rows = await runRecoveryWorkers({slots: freeze.recovery_slots, signal: controller.signal, admit: async () => { checkStorage(); return true; }, execute: async (slot, workerSignal) => {
      let client;
        const factory = comparisonLiveClientFactory({credential_path: config.credential_path, signal: workerSignal, persistence: runPersistence,
          before_dispatch: async () => { checkStorage(); return !workerSignal.aborted; }, credential_override: createRemoteMountedCredentialBinding(), post: createRemoteMountedPost()});
        const taskConfig = config.tasks.find(task => task.id === slot.task_id); need(taskConfig, `task:${slot.task_id}`);
        const run = join(freeze.roots.runs_root, String(slot.sequence).padStart(2, "0"));
        const armResult = await runComparisonArm({config, task_id: slot.task_id, arm: slot.arm, candidate_view: views.get(slot.task_id), signal: workerSignal,
          out: run, evidence_root: freeze.roots.runs_root, source_out: join(freeze.roots.source_root, String(slot.sequence).padStart(2, "0")), persistence: runPersistence,
          admit_source: admitSource, before_model_dispatch: async () => { checkStorage(); return !workerSignal.aborted; },
          create_client: async args => { client = await factory.create_client(args); return client; }, measure_index_tokens: factory.measure_index_tokens});
        need(armResult.status === "final_context_selected" && client && providerAttemptHealth([...(armResult.receipts ?? []), ...(armResult.index_tokenizer_receipts ?? [])]).healthy, `task-incomplete:${slot.task_id}`);
        const files = pinHen10Run(run), task = readJson(slot.task_path);
        const evidence = reconcileComparisonRunFiles({root: run, cell: slot.cell, task, task_sha256: slot.task_sha256, outcome_result: armResult, expected_identity: client.identity, expected_files: files});
        need(evidence.ledger.evidence_consistent === true && evidence.windows.measured_windows_verified === true, `task-reconciliation:${slot.task_id}`);
        return {sequence: slot.sequence, slot_id: slot.slot_id, task_id: slot.task_id, provenance: "hen10-recovery-v1", runs_root: freeze.roots.runs_root,
          source_root: freeze.roots.source_root, result_path: join(run, "result.json"), result_sha256: files["result.json"], transport_identity: client.identity, files, evidence};
    }});
    const preservedRows = freeze.preserved.map((binding, index) => ({sequence: index, slot_id: binding.slot_id, task_id: binding.task_ref, provenance: "hen10-live-v2",
      runs_root: binding.runs_root, source_root: binding.source_root, result_path: binding.result_path, result_sha256: binding.result_sha256,
      transport_identity: priorManifest.entries[index].transport_identity, files: priorManifest.entries[index].files, evidence: priorEvidence.rows[index].evidence}));
    const composite = {schema_version: "are.hen10-composite-evidence-manifest/v1", objective_ref: freeze.objective_ref, hypothesis_ref: freeze.hypothesis_ref,
      original_schedule_sha256: freeze.original_schedule_sha256, rows: [...preservedRows, ...rows].sort((left, right) => left.sequence - right.sequence),
      selected_attempts: {preserved: 2, recovered: 2}, superseded_partial_attempts: 2, authority_effect: "none", claim_ceiling: freeze.claim_ceiling};
    need(composite.rows.map(row => row.task_id).join(",") === "contextbench-1,contextbench-2,contextbench-3,contextbench-4", "composite-denominator");
    metadataPersistence.writeJson(join(freeze.roots.metadata_root, "COMPOSITE-MANIFEST.json"), composite);
    const compositeSha = sha(readFileSync(join(freeze.roots.metadata_root, "COMPOSITE-MANIFEST.json")));
    const priorSummary = readJson(freeze.recovery_of.attempt_summary_path), initialSummary = readJson(freeze.initial_attempt.summary_path);
    need(sha(readFileSync(freeze.initial_attempt.summary_path)) === freeze.initial_attempt.summary_sha256, "initial-attempt-drift");
    const accounting = buildAttemptAccounting({rows: composite.rows, priorSummary, initialSummary});
    result = {schema_version: "are.hen10-recovery-results/v1", status: "settled", workers_settled: true, recovered_tasks: 2, preserved_tasks: 2,
      all_selected_evidence_reconciled: composite.rows.every(row => row.evidence.files_verified === true && row.evidence.ledger.evidence_consistent === true && row.evidence.windows.measured_windows_verified === true),
      ...accounting,
      all_attempt_upper_bound: freeze.all_attempt_upper_bound,
      composite_manifest_sha256: compositeSha, native_scoring_pending: true, benchmark_cleared: false, authority_effect: "none", claim_ceiling: freeze.claim_ceiling};
    need(result.all_selected_evidence_reconciled, "composite-reconciliation");
    metadataPersistence.writeJson(join(freeze.roots.metadata_root, "RESULTS.json"), result, {final: true});
    return {...result, results_sha256: sha(readFileSync(join(freeze.roots.metadata_root, "RESULTS.json")))};
  } catch (error) { failure = error; throw error; }
  finally {
    signal?.removeEventListener("abort", parentAbort);
    const settlement = {...started, completed_at: new Date().toISOString(), status: failure ? "failed" : "settled", error: failure ? String(failure.message) : null,
      workers_settled: failure?.workers_settled ?? (result?.workers_settled === true), worker_results: failure?.worker_results ?? null, result: result ?? null};
    writeFileSync(join(runRoot, "SETTLEMENT.json"), `${canonicalJson(settlement)}\n`, {flag: "wx", mode: 0o600});
  }
}

if (process.argv[1] === import.meta.filename) {
  const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort());
  try { console.log(canonicalJson(await runHen10Recovery({freezePath: process.argv[2], freezeSha256: process.argv[3], reviewPath: process.argv[4], signal: controller.signal}))); }
  catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message)})); process.exitCode = 2; }
}
