// Serial frozen five-language development coordinator; no scoring or gold access.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statfsSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-r20-exposed-transfer-160k-240s-r1";
const freezePath = join(root, "TRANSFER-FREEZE.json");
const freezeSha = "d367899f14444bdd9c3edb3c5b1a0e31eb8c51624c99744af22fd5783de77d73";
const sourceRoot = "/opt/are/evolution-runtime/g01-source-r10-prospective-r17";
const node = "/opt/cyberalchemy-are-tools/node-24.10.0/node";
const runner = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run.mjs`;
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const need = (v, why) => {if (!v) throw Error(`g01-r20-run.${why}`);};
need(process.argv.length === 2, "arguments");
need(sha(bytes(freezePath)) === freezeSha && existsSync(runner), "freeze-or-runner-drift");
const freeze = read(freezePath);
need(freeze.status === "frozen-before-dispatch" && freeze.tasks.length === 5 &&
  freeze.tasks.map(t => t.language).join(",") === "cpp,java,javascript,typescript,python" &&
  freeze.budget.total_tokens_per_arm === 160000 && freeze.budget.context_tokens_per_request === 8000 &&
  freeze.budget.model_timeout_ms === 240000,
  "freeze-shape");
const attempts = freeze.tasks.flatMap((task, taskIndex) => task.arms.map((arm, armIndex) =>
  ({task, taskIndex, arm, armIndex, index: taskIndex * 2 + armIndex + 1})));
need(attempts.length === 10 && attempts.every(({arm}) => sha(bytes(arm.freeze_path)) === arm.freeze_sha256 &&
  !existsSync(arm.output_root)), "arm-drift-or-output-exists");
const save = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, {flag: "wx", mode: 0o600});
const results = [];
for (const {task, arm, index} of attempts) {
  const receiptPath = join(root, `ATTEMPT-${String(index).padStart(2, "0")}.json`);
  need(!existsSync(receiptPath), "attempt-receipt-exists");
  const tmp = statfsSync("/tmp");
  need(tmp.bavail * tmp.bsize >= 3_000_000_000, "tmpfs-headroom");
  const started = new Date().toISOString();
  const run = spawnSync(node, [runner, arm.freeze_path, arm.freeze_sha256],
    {encoding: "utf8", timeout: 1_900_000, maxBuffer: 2 * 1024 * 1024});
  const resultPath = join(arm.output_root, "runs", "00", "result.json");
  const result = existsSync(resultPath) ? read(resultPath) : null;
  const modelRows = result?.receipts?.filter(r => r.kind === "model" && r.dispatched !== false) ?? [];
  const tokenizerRows = result?.index_tokenizer_receipts ?? [];
  const unknownUsage = modelRows.some(r => !Number.isSafeInteger(r.input_tokens) ||
    !Number.isSafeInteger(r.output_tokens) || r.input_tokens < 0 || r.output_tokens < 0);
  const knownTokens = unknownUsage ? null : modelRows.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
  const providerSafety = [...modelRows, ...tokenizerRows].some(r =>
    (Number.isSafeInteger(r.status) && r.status !== 200) ||
    ["1302", "1305"].includes(String(r.provider_code)) || r.failure_code === "rate-limited");
  const unaccounted = Boolean(run.error) || result === null || unknownUsage;
  const terminalStatus = result?.status ?? null;
  const receipt = {schema_version: "are.g01-r20-exposed-transfer-attempt/v1",
    attempt: index, language: task.language, slug: task.slug, arm: arm.name,
    freeze_sha256: arm.freeze_sha256, started_at: started, completed_at: new Date().toISOString(),
    process_exit_code: run.status, process_signal: run.signal, process_error_code: run.error?.code ?? null,
    stdout_sha256: sha(run.stdout ?? ""), stderr_sha256: sha(run.stderr ?? ""),
    result_sha256: result === null ? null : sha(bytes(resultPath)), terminal_status: terminalStatus,
    model_calls: modelRows.length, known_model_tokens: knownTokens,
    unknown_usage: unknownUsage, provider_safety_stop: providerSafety,
    unaccounted_terminal: unaccounted,
    claim_ceiling: "Exposed fixed-order task/arm accounting only; no quality or superiority"};
  save(receiptPath, receipt);
  results.push({attempt: index, slug: task.slug, arm: arm.name, terminal_status: terminalStatus,
    model_calls: modelRows.length, known_model_tokens: knownTokens, provider_safety_stop: providerSafety,
    unaccounted_terminal: unaccounted});
  console.log(JSON.stringify(results.at(-1)));
  if (providerSafety || unaccounted) break;
}
const stopped = results.length < attempts.length;
const summary = {schema_version: "are.g01-r20-exposed-transfer-coordinator/v1",
  status: stopped ? "safety-stopped" : "all-attempts-terminal", freeze_sha256: freezeSha,
  planned_attempts: attempts.length, terminal_attempts: results.length,
  unattempted: attempts.length - results.length, results,
  claim_ceiling: "Exposed five-task transfer accounting only; scoring and fresh holdout are separate"};
save(join(root, "COORDINATOR-RESULT.json"), summary);
console.log(JSON.stringify({status: summary.status, terminal_attempts: summary.terminal_attempts,
  unattempted: summary.unattempted, coordinator_sha256: sha(bytes(join(root, "COORDINATOR-RESULT.json")))}));
