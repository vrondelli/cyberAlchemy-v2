// Seal the exposed r21 TypeScript control prediction before native scoring.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r21-score.${why}`);};
need(["--seal", "--score"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r21-exposed-typescript-control-r1`;
const out = "/tmp/are-g01-r21-exposed-typescript-control-r1/runs/00";
const freezePath = join(root, "CONTROL-FREEZE.json");
const freezeSha = "2b8a925f237a6bf0fdf04b879eb41f19e5ffc23b538e1bdbd0c2bd6dd892e0d5";
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r21-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "b566988148bc8fa93fadc3eaf8d8643e32aab70f121a6fd439c285ae0d9ed21d";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const save = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, {flag: "wx", mode: 0o600});
need(sha(bytes(freezePath)) === freezeSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha,
  "source-or-freeze-drift");
const freeze = read(freezePath);
need(freeze.output_root === "/tmp/are-g01-r21-exposed-typescript-control-r1" &&
  freeze.task_sha256 === "a6c9637c15fce4dc724975fecdaa0d827c630465b01a02ee0e5a1569e899ea2f" &&
  freeze.arm === "intent-anchor-convergence-r3", "freeze-shape");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const scorePath = join(out, "native-score.json"), sealPath = join(root, "PREDICTION-SEAL.json");
const result = read(resultPath), models = result.receipts?.filter(r => r.kind === "model") ?? [];
need(result.status === "final_context_selected" && result.task_sha256 === freeze.task_sha256 &&
  models.length > 0 && models.every(r => Number.isSafeInteger(r.input_tokens) &&
    Number.isSafeInteger(r.output_tokens) && r.input_tokens >= 0 && r.output_tokens >= 0) &&
  existsSync(predictionPath), "run-not-scorable");
const knownTokens = models.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
if (mode === "--seal") {
  need(!existsSync(sealPath) && !existsSync(scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r21-exposed-typescript-control-prediction-seal/v1",
    status: "sealed-before-native-scoring", freeze_sha256: freezeSha,
    source_receipt_sha256: sourceReceiptSha, task_sha256: freeze.task_sha256,
    result_sha256: sha(bytes(resultPath)), prediction_sha256: sha(bytes(predictionPath)),
    known_model_tokens: knownTokens, model_calls: models.length, scoring_status_at_seal: "not-started",
    claim_ceiling: "Exposed control reliability qualification; no matched prospective pair or superiority"};
  save(sealPath, seal);
  console.log(JSON.stringify({status: seal.status, seal_sha256: sha(bytes(sealPath)),
    model_calls: models.length, known_model_tokens: knownTokens}));
} else {
  const sealBytes = bytes(sealPath), seal = JSON.parse(sealBytes);
  need(seal.status === "sealed-before-native-scoring" && seal.freeze_sha256 === freezeSha &&
    seal.source_receipt_sha256 === sourceReceiptSha && seal.result_sha256 === sha(bytes(resultPath)) &&
    seal.prediction_sha256 === sha(bytes(predictionPath)) && seal.model_calls === models.length &&
    seal.known_model_tokens === knownTokens && seal.scoring_status_at_seal === "not-started" &&
    !existsSync(scorePath), "seal-drift-or-already-scored");
  const scorer = read(`${base}/g01-product-replication-r10/typescript-core-8d2ac221/PAIR-PLAN.json`).scorer;
  need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
    ["repo", "upstream", "cache"].every(k => typeof scorer[k] === "string" && scorer[k].startsWith("/")),
  "scorer-binding");
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${out}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const ran = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!ran.error && ran.status === 0 && existsSync(scorePath),
    `native-score:${String(ran.error?.message ?? ran.stderr).slice(-300)}`);
  need(seal.result_sha256 === sha(bytes(resultPath)) &&
    seal.prediction_sha256 === sha(bytes(predictionPath)) &&
    statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "post-score-seal-drift");
  const score = read(scorePath), f1 = m => m.coverage + m.precision > 0 ?
    2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
  const note = {schema_version: "are.g01-r21-exposed-typescript-control-native-result/v1",
    status: "native-scored-exposed", freeze_sha256: freezeSha,
    source_receipt_sha256: sourceReceiptSha, prediction_seal_sha256: sha(sealBytes),
    result_sha256: seal.result_sha256, prediction_sha256: seal.prediction_sha256,
    native_score_sha256: sha(bytes(scorePath)), task_sha256: freeze.task_sha256,
    span_f1: f1(score.native.final.span), file_f1: f1(score.native.final.file),
    known_model_tokens: knownTokens, model_calls: models.length,
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs -
      statSync(join(out, "started.json")).mtimeMs) / 1000,
    claim_ceiling: "One exposed control task; no matched prospective pair, interval, holdout or superiority"};
  const notePath = join(root, "EXPOSED-SCORE.json");
  save(notePath, note);
  console.log(JSON.stringify({status: note.status, note_sha256: sha(bytes(notePath)),
    span_f1: note.span_f1, file_f1: note.file_f1,
    known_model_tokens: knownTokens, model_calls: models.length}));
}
