// Seal both predictions for each fixed exposed task before opening native gold.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
const [mode, slug, arm] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r19-score.${why}`);};
need(["--seal", "--score"].includes(mode) && /^[a-z0-9-]+$/.test(slug ?? "") &&
  ["control", "candidate"].includes(arm) && process.argv.length === 5, "arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-r19-exposed-transfer-160k-r1`;
const freezeSha = "a8b3a2850e527146f6c66bc0cace802ceb48d8980665b2cbba38613c23a85c00";
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const save = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, {flag: "wx", mode: 0o600});
const transferPath = join(root, "TRANSFER-FREEZE.json"), sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
need(sha(bytes(transferPath)) === freezeSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha,
  "pinned-input-drift");
const transfer = read(transferPath), task = transfer.tasks.find(t => t.slug === slug);
need(transfer.status === "frozen-before-dispatch" && task && task.order.join(",") === "control,candidate" &&
  transfer.budget.context_tokens_per_request === 8000 && transfer.budget.total_tokens_per_arm === 160000,
  "transfer-shape");
const taskRoot = join(root, slug), armRow = task.arms.find(r => r.name === arm);
need(armRow && armRow.freeze_path === join(taskRoot, `${arm.toUpperCase()}-FREEZE.json`) &&
  sha(bytes(armRow.freeze_path)) === armRow.freeze_sha256, "arm-freeze-drift");
const freeze = read(armRow.freeze_path);
need(freeze.output_root === armRow.output_root && freeze.task_sha256 === task.task_sha256 &&
  freeze.config_path === task.config_path && freeze.config_sha256 === task.config_sha256,
  "arm-shape");
const out = join(freeze.output_root, "runs", "00"), resultPath = join(out, "result.json");
const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
const sealPath = join(taskRoot, `${arm.toUpperCase()}-PREDICTION-SEAL.json`);
const result = read(resultPath), models = result.receipts?.filter(r => r.kind === "model") ?? [];
need(result.status === "final_context_selected" && result.task_sha256 === task.task_sha256 &&
  models.length > 0 && models.every(r => Number.isSafeInteger(r.input_tokens) &&
    Number.isSafeInteger(r.output_tokens) && r.input_tokens >= 0 && r.output_tokens >= 0) &&
  existsSync(predictionPath), "run-not-scorable");
const knownTokens = models.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
if (mode === "--seal") {
  need(!existsSync(sealPath) && !existsSync(scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r19-exposed-transfer-prediction-seal/v1",
    status: "sealed-before-native-scoring", slug, arm, transfer_freeze_sha256: freezeSha,
    arm_freeze_sha256: armRow.freeze_sha256, source_receipt_sha256: sourceReceiptSha,
    task_sha256: task.task_sha256, result_sha256: sha(bytes(resultPath)),
    prediction_sha256: sha(bytes(predictionPath)), known_model_tokens: knownTokens,
    model_calls: models.length, scoring_status_at_seal: "not-started",
    claim_ceiling: "Exposed five-task transfer only; no fresh holdout or superiority"};
  save(sealPath, seal);
  console.log(JSON.stringify({status: seal.status, slug, arm, seal_sha256: sha(bytes(sealPath)),
    known_model_tokens: knownTokens, model_calls: models.length}));
} else {
  need(["control", "candidate"].every(name => existsSync(join(taskRoot, `${name.toUpperCase()}-PREDICTION-SEAL.json`))),
    "both-predictions-must-be-sealed");
  const sealBytes = bytes(sealPath), seal = JSON.parse(sealBytes);
  need(seal.status === "sealed-before-native-scoring" && seal.slug === slug && seal.arm === arm &&
    seal.transfer_freeze_sha256 === freezeSha && seal.arm_freeze_sha256 === armRow.freeze_sha256 &&
    seal.result_sha256 === sha(bytes(resultPath)) && seal.prediction_sha256 === sha(bytes(predictionPath)) &&
    seal.model_calls === models.length && seal.known_model_tokens === knownTokens &&
    seal.scoring_status_at_seal === "not-started" && !existsSync(scorePath), "seal-drift-or-already-scored");
  const scorer = read(`${base}/g01-product-replication-r10/${slug}/PAIR-PLAN.json`).scorer;
  need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
    ["repo", "upstream", "cache"].every(k => typeof scorer[k] === "string" && scorer[k].startsWith("/")), "scorer-binding");
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${out}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const ran = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!ran.error && ran.status === 0 && existsSync(scorePath),
    `native-score:${String(ran.error?.message ?? ran.stderr).slice(-300)}`);
  need(seal.result_sha256 === sha(bytes(resultPath)) && seal.prediction_sha256 === sha(bytes(predictionPath)) &&
    statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "post-score-seal-drift");
  const score = read(scorePath), f1 = m => m.coverage + m.precision > 0 ?
    2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
  const note = {schema_version: "are.g01-r19-exposed-transfer-native-arm-result/v1",
    status: "native-scored-exposed", slug, arm, transfer_freeze_sha256: freezeSha,
    arm_freeze_sha256: armRow.freeze_sha256, source_receipt_sha256: sourceReceiptSha,
    prediction_seal_sha256: sha(sealBytes), result_sha256: seal.result_sha256,
    prediction_sha256: seal.prediction_sha256, native_score_sha256: sha(bytes(scorePath)),
    task_sha256: task.task_sha256, span_f1: f1(score.native.final.span),
    file_f1: f1(score.native.final.file), known_model_tokens: knownTokens,
    model_calls: models.length,
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000,
    claim_ceiling: "Exposed five-task transfer only; no fresh holdout or superiority"};
  const notePath = join(taskRoot, `${arm.toUpperCase()}-SCORE.json`);
  save(notePath, note);
  console.log(JSON.stringify({status: note.status, slug, arm, note_sha256: sha(bytes(notePath)),
    span_f1: note.span_f1, file_f1: note.file_f1, known_model_tokens: knownTokens,
    model_calls: models.length}));
}
