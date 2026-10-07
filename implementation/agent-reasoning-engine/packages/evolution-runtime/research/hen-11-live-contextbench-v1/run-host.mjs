import {createHash} from "node:crypto";
import {constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, readSync, realpathSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import vm from "node:vm";
import {spawnSync} from "node:child_process";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {verifyHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";
import {createVpsLocalCredentialBinding, createVpsLocalPost, verifyHen11VpsTopology} from "./vps-local-glm-v1.mjs";
import {comparisonLiveClientFactory} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-live-client-r1.mjs";
import {INTENT_ANCHOR_ARM} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-arm-r3.mjs";
import {createStageOutputGuard} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-output-guard.mjs";
import {createStagePersistence} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/stage-persistence.mjs";
import {reconcileComparisonRunFiles} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-run-files-r1.mjs";
import {createHen11LiveSlotExecutor, createOnlySettlementWriter, reconcileHen11Settlement, runHen11, validateHen11Freeze} from "./run.mjs";

const sha = value => createHash("sha256").update(value).digest("hex"), readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen11-host.${reason}`); };

function durableJson(path, value, {replace = false} = {}) {
  path = resolve(path); mkdirSync(dirname(path), {recursive: true, mode: 0o700}); const temporary = `${path}.tmp-${process.pid}-${Date.now()}`, descriptor = openSync(temporary, "wx", 0o600);
  try { writeFileSync(descriptor, `${canonicalJson(value)}\n`); fsyncSync(descriptor); } finally { closeSync(descriptor); }
  try { if (!replace) need(!existsSync(path), "artifact-exists"); renameSync(temporary, path); const directory = openSync(dirname(path), "r"); try { fsyncSync(directory); } finally { closeSync(directory); } }
  catch (error) { try { unlinkSync(temporary); } catch {} throw error; }
}

export function validateHostDevelopmentFreeze({freezePath, freezeSha256}) {
  freezePath = resolve(freezePath); const bytes = readFileSync(freezePath);
  need(/^[a-f0-9]{64}$/.test(freezeSha256 ?? "") && sha(bytes) === freezeSha256, "freeze-binding");
  need(typeof vm.SourceTextModule === "function", "node-options-required:--experimental-vm-modules");
  const freeze = JSON.parse(bytes); validateHen11Freeze(freeze);
  need(freeze.execution_host === "187.77.163.194" && freeze.execution_topology?.kind === "vps-native", "execution-topology");
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  need(sha(readFileSync(freeze.sources.config_path)) === freeze.sources.config_sha256, "config-drift"); need(sha(readFileSync(freeze.sources.cohort_path)) === freeze.sources.cohort_sha256, "cohort-drift");
  if (freeze.deployment.target_root.startsWith("/opt/")) {
    const prefix = `${freeze.deployment.target_root}/`; for (const binding of [...freeze.source_bindings, ...freeze.candidate_views, {path: freeze.sources.config_path}, {path: freeze.sources.cohort_path}]) need(binding.path.startsWith(prefix), `non-vps-path:${binding.path}`);
    need(Object.values(freeze.roots).every(path => path.startsWith(prefix)) && freeze.node_runtime.launch_wrapper.startsWith(prefix), "non-vps-root");
    const environment = freeze.native_scoring_environment; need(sha(readFileSync(environment.python.path)) === environment.python.sha256 && sha(readFileSync(environment.sandbox.path)) === environment.sandbox.sha256, "scoring-environment-drift");
    const probe = spawnSync(environment.sandbox.path, ["--unshare-all", "--die-with-parent", "--ro-bind", "/", "/", "--dev-bind", "/dev/null", "/dev/null", "--proc", "/proc", "--clearenv", "--setenv", "PATH", "/usr/bin:/bin", "--setenv", "HOME", "/tmp", "--", environment.python.path, "-B", "-c", "import importlib.metadata as m,json;print(json.dumps({x:m.version(x) for x in ['pyarrow','tree-sitter','tree-sitter-language-pack']},sort_keys=True))"], {encoding: "utf8", timeout: 30000});
    need(probe.status === 0 && canonicalJson(JSON.parse(probe.stdout)) === canonicalJson({pyarrow: environment.modules.pyarrow, "tree-sitter": environment.modules.tree_sitter, "tree-sitter-language-pack": environment.modules.tree_sitter_language_pack}), "scoring-environment-modules");
  }
  need(resolve(freeze.deployment.target_root, "FREEZE.json") === freezePath, "target-freeze-binding");
  return {freeze, freeze_sha256: freezeSha256};
}

function developmentExecutionUse({freeze, freezeSha256, consumedAt}) {
  return {schema_version: "are.hen11-development-execution-use/v1", execution_mode: "development", freeze_sha256: freezeSha256, source_bindings_sha256: freeze.source_bindings_sha256, deployment_digest: freeze.deployment.deployment_digest, consumed_at: consumedAt, prelaunch_authorization_required: false, cryptographic_signatures_required: false, independent_postrun_review_required: true, status: "consumed", authority_effect: "none"};
}

function pinRun(root) {
  need(realpathSync(root) === root, "run-canonical"); const files = {}; let total = 0;
  for (const name of ["source-index.json", "started.json", "result.json", "completed.json", "events.jsonl", "state/glm-transport-ledger.json", "state/driver-binding.json"]) {
    let path = root; for (const part of name.split("/")) { path = join(path, part); need(!lstatSync(path).isSymbolicLink(), "run-symlink"); }
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try { const stat = fstatSync(fd); need(stat.isFile() && stat.size <= 128 * 1024 * 1024 - total, "run-size"); total += stat.size; const digest = createHash("sha256"), buffer = Buffer.alloc(65536); let offset = 0; while (offset < stat.size) { const count = readSync(fd, buffer, 0, Math.min(buffer.length, stat.size - offset), offset); need(count > 0, "run-short-read"); digest.update(buffer.subarray(0, count)); offset += count; } files[name] = digest.digest("hex"); } finally { closeSync(fd); }
  } return files;
}

function finalProcess({freezeSha256, executionUseSha256, settlement, status}) {
  return {schema_version: "are.hen11-host-process/v3", freeze_sha256: freezeSha256, development_execution_use_sha256: executionUseSha256, status, pid: process.pid, settlement_sha256: settlement ? sha(`${canonicalJson(settlement)}\n`) : null, reconciliation: settlement ? {workers_settled: settlement.workers_settled, observed_tasks: settlement.observed_tasks, model_calls: settlement.model_calls, known_model_tokens: settlement.known_model_tokens, unknown_usage: settlement.unknown_usage, automatic_retries: settlement.automatic_retries} : null, authority_effect: "none"};
}

function readPersistedRows(runRoot) {
  const directory = join(runRoot, "rows"); if (!existsSync(directory)) return [];
  return readdirSync(directory).filter(name => /^\d\d\.json$/.test(name)).sort().map(name => readJson(join(directory, name)));
}

function readLedgerReceipts(freeze) {
  const receipts = [];
  for (const sequence of freeze.schedule.slots.map(slot => String(slot.sequence).padStart(2, "0"))) {
    const path = join(freeze.roots.runs_root, sequence, "state/glm-transport-ledger.json"); if (!existsSync(path)) continue;
    try { const ledger = readJson(path), body = {...ledger}; delete body.ledger_digest; need(ledger.ledger_digest === sha(canonicalJson(body)) && Array.isArray(ledger.receipts), `ledger:${sequence}`); receipts.push(...ledger.receipts); const recorded = ledger.receipts.filter(receipt => receipt.kind === "model" && receipt.dispatched === true).length, dispatched = Number.isSafeInteger(ledger.model_calls) && ledger.model_calls >= recorded ? ledger.model_calls : recorded; for (let index = recorded; index < dispatched; index++) receipts.push({kind: "model", dispatched: true, request_sha256: sha(`${path}:unreceipted-model:${index}`), automatic_retries: 0}); }
    catch { receipts.push({kind: "model", dispatched: true, request_sha256: sha(path), automatic_retries: 0}); }
  }
  return receipts;
}

export async function runHen11Host({freezePath, freezeSha256, signal, host = {}, now = () => new Date()}) {
  const {freeze} = validateHostDevelopmentFreeze({freezePath, freezeSha256});
  const runRoot = resolve(join(resolve(freezePath), "..", "run")); need(!existsSync(runRoot), "run-root-exists"); mkdirSync(runRoot, {mode: 0o700});
  const consumedAt = now().toISOString(), executionUse = developmentExecutionUse({freeze, freezeSha256, consumedAt}), executionUseBytes = `${canonicalJson(executionUse)}\n`, executionUseSha256 = sha(executionUseBytes); durableJson(join(runRoot, "BOOTSTRAP.json"), {schema_version: "are.hen11-host-bootstrap/v2", freeze_sha256: freezeSha256, development_execution_use_sha256: executionUseSha256, status: "initializing", authority_effect: "none"});
  durableJson(join(runRoot, "DEVELOPMENT-EXECUTION-USE.json"), executionUse);
  const processPath = join(runRoot, "PROCESS.json"), settlementPath = join(runRoot, "SETTLEMENT.json"); durableJson(processPath, finalProcess({freezeSha256, executionUseSha256, settlement: null, status: "running"}));
  (host.verify_topology ?? verifyHen11VpsTopology)();
  for (const root of Object.values(freeze.roots)) mkdirSync(root, {recursive: true, mode: 0o700});
  const runGuard = createStageOutputGuard({root: freeze.roots.runs_root}), persistence = createStagePersistence({stage_root: freeze.roots.runs_root, stage_guard: runGuard});
  const config = readJson(freeze.sources.config_path), views = new Map();
  for (const binding of freeze.candidate_views) { const bytes = readFileSync(binding.path), view = JSON.parse(bytes); need(sha(bytes) === binding.sha256 && verifyHenCandidateView(view).ok && view.view_digest === binding.view_digest, `view:${binding.task_ref}`); views.set(binding.task_ref, view); }
  const clients = new Map();
  const runtime_for_slot = host.runtime_for_slot ?? (async (slot, workerSignal) => {
    const factory = comparisonLiveClientFactory({credential_path: config.credential_path, signal: workerSignal, persistence, candidate_arm: INTENT_ANCHOR_ARM, before_dispatch: async () => !workerSignal.aborted,
      credential_override: createVpsLocalCredentialBinding(), post: createVpsLocalPost()});
    const sequence = String(slot.sequence).padStart(2, "0");
    return {out: join(freeze.roots.runs_root, sequence), evidence_root: freeze.roots.runs_root, source_out: join(freeze.roots.source_root, sequence), persistence,
      admit_source: async () => !workerSignal.aborted, before_model_dispatch: async () => !workerSignal.aborted,
      create_client: async args => { const client = await factory.create_client(args); clients.set(slot.task_id, client); return client; }, measure_index_tokens: factory.measure_index_tokens};
  });
  const live = createHen11LiveSlotExecutor({config, candidate_views: views, runtime_for_slot});
  const execute_slot = host.execute_slot ?? (async (slot, workerSignal) => {
    let result, client;
    try {
      result = await live(slot, workerSignal); client = clients.get(slot.task_id); need(client && result.status === "final_context_selected", `task-incomplete:${slot.task_id}`);
      const root = join(freeze.roots.runs_root, String(slot.sequence).padStart(2, "0")), files = pinRun(root), task = readJson(slot.task_path);
      const evidence = reconcileComparisonRunFiles({root, cell: slot.cell, task, task_sha256: slot.task_sha256, outcome_result: result, expected_identity: client.identity, expected_files: files});
      const row = {task_id: slot.task_id, result, files, evidence}; durableJson(join(runRoot, "rows", `${String(slot.sequence).padStart(2, "0")}.json`), row); return row;
    } catch (error) {
      client = clients.get(slot.task_id); const base = error.result && typeof error.result === "object" ? error.result : {};
      const partial = {task_id: slot.task_id, result: {...base, status: base.status ?? "worker-failed", receipts: client?.receipts ?? base.receipts ?? [], index_tokenizer_receipts: client?.index_tokenizer_receipts ?? base.index_tokenizer_receipts ?? []}, evidence: null};
      try { durableJson(join(runRoot, "rows", `${String(slot.sequence).padStart(2, "0")}.json`), partial); } catch {} error.partial_row = partial; throw error;
    }
  });
  try {
    const settlement = await runHen11({freezePath, freezeSha256, signal, execute_slot: async (slot, workerSignal) => {
      const preserved = host.preserved_rows?.get(slot.task_id);
      if (preserved) {
        need(preserved.task_id === slot.task_id && preserved.result?.status === "final_context_selected" && preserved.result.native_export && preserved.evidence?.ledger?.evidence_consistent === true && preserved.evidence?.windows?.measured_windows_verified === true, `preserved-row:${slot.task_id}`);
        durableJson(join(runRoot, "rows", `${String(slot.sequence).padStart(2, "0")}.json`), preserved); return preserved;
      }
      if (host.execute_slot) { try { const row = await host.execute_slot(slot, workerSignal); durableJson(join(runRoot, "rows", `${String(slot.sequence).padStart(2, "0")}.json`), row); return row; } catch (error) { if (error.partial_row) try { durableJson(join(runRoot, "rows", `${String(slot.sequence).padStart(2, "0")}.json`), error.partial_row); } catch {} throw error; } }
      return execute_slot(slot, workerSignal);
    }, collect_ledger_receipts: () => readLedgerReceipts(freeze), persist_settlement: createOnlySettlementWriter(settlementPath)});
    durableJson(processPath, finalProcess({freezeSha256, executionUseSha256, settlement, status: "settled"}), {replace: true}); return settlement;
  } catch (error) {
    const settlement = error.settlement ?? (existsSync(settlementPath) ? readJson(settlementPath) : null);
    durableJson(processPath, finalProcess({freezeSha256, executionUseSha256, settlement, status: "failed"}), {replace: true}); throw error;
  }
}

export function finishHen11Host({freezePath, freezeSha256}) {
  const runRoot = resolve(join(resolve(freezePath), "..", "run")); need(existsSync(runRoot), "run-root-missing"); const usePath = join(runRoot, "DEVELOPMENT-EXECUTION-USE.json"), use = existsSync(usePath) ? readJson(usePath) : null;
  const {freeze} = validateHostDevelopmentFreeze({freezePath, freezeSha256});
  if (use) need(canonicalJson(use) === canonicalJson(developmentExecutionUse({freeze, freezeSha256, consumedAt: use.consumed_at})), "development-execution-use");
  const executionUseSha256 = use ? sha(`${canonicalJson(use)}\n`) : null;
  const processPath = join(runRoot, "PROCESS.json"), settlementPath = join(runRoot, "SETTLEMENT.json");
  let settlement;
  if (existsSync(settlementPath)) settlement = readJson(settlementPath);
  else { const rows = readPersistedRows(runRoot), complete = rows.length === 2 && rows.every(row => row.result?.status === "final_context_selected"); settlement = reconcileHen11Settlement({freeze, rows, ledger_receipts: readLedgerReceipts(freeze), worker_failure: complete ? null : Object.assign(new Error(use ? "restart-finisher-incomplete" : "restart-before-freeze-consumption"), {worker_results: rows.map(row => ({task_id: row.task_id, status: row.result?.status}))})}); createOnlySettlementWriter(settlementPath)(settlement); }
  durableJson(processPath, finalProcess({freezeSha256, executionUseSha256, settlement, status: settlement.status === "settled" ? "settled" : "failed"}), {replace: true}); return settlement;
}

if (process.argv[1] === import.meta.filename) {
  const [freezePath, freezeSha256] = process.argv.slice(2); if (typeof vm.SourceTextModule !== "function") { console.error(canonicalJson({status: "disabled", reason: "node-options-required:--experimental-vm-modules", authority_effect: "none"})); process.exitCode = 2; }
  else if (!freezePath || !freezeSha256) { console.error(canonicalJson({status: "disabled", reason: "freeze-and-digest-required"})); process.exitCode = 2; }
  else { const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort()); try { console.log(canonicalJson(await runHen11Host({freezePath, freezeSha256, signal: controller.signal}))); } catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message)})); process.exitCode = 2; } }
}
