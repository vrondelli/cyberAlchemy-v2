// Seal the exposed r17 control prediction before opening native references.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
const need = (v, why) => {if (!v) throw Error(`g01-r17-control-score.${why}`);};
need(["--seal", "--score"].includes(mode) && process.argv.length === 3, "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r17-exposed-control-160k-r1`;
const out = "/tmp/are-g01-r17-exposed-control-160k-r1/runs/00";
const freezePath = join(root, "CONTROL-FREEZE.json");
const freezeSha = "a62ab37085190e2d0bf913dd5cdb7ca13644b6f71e4d0711fdfd84961a213451";
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const sha = b => createHash("sha256").update(b).digest("hex");
const bytes = p => readFileSync(p);
const read = p => JSON.parse(bytes(p));
const save = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, {flag: "wx", mode: 0o600});
need(sha(bytes(freezePath)) === freezeSha && sha(bytes(sourceReceiptPath)) === sourceReceiptSha,
  "source-or-freeze-drift");
const freeze = read(freezePath);
need(freeze.output_root === "/tmp/are-g01-r17-exposed-control-160k-r1" &&
  freeze.task_sha256 === "f37f6f40dddf61a612f4490c7d2207282eec68b7595356186943530948ead411", "freeze-shape");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const scorePath = join(out, "native-score.json"), sealPath = join(root, "PREDICTION-SEAL.json");
const result = read(resultPath);
const models = result.receipts?.filter(r => r.kind === "model") ?? [];
need(result.status === "final_context_selected" && result.task_sha256 === freeze.task_sha256 &&
  models.length > 0 && models.every(r => Number.isSafeInteger(r.input_tokens) &&
    Number.isSafeInteger(r.output_tokens) && r.input_tokens >= 0 && r.output_tokens >= 0) &&
  existsSync(predictionPath), "run-not-scorable");
const knownTokens = models.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
if (mode === "--seal") {
  need(!existsSync(sealPath) && !existsSync(scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r17-exposed-control-prediction-seal/v1",
    status: "sealed-before-native-scoring", freeze_sha256: freezeSha,
    source_receipt_sha256: sourceReceiptSha, task_sha256: freeze.task_sha256,
    result_sha256: sha(bytes(resultPath)), prediction_sha256: sha(bytes(predictionPath)),
    known_model_tokens: knownTokens, model_calls: models.length, scoring_status_at_seal: "not-started",
    claim_ceiling: "Exposed control completion only; no matched prospective pair or superiority"};
  save(sealPath, seal);
  console.log(JSON.stringify({status: seal.status, seal_sha256: sha(bytes(sealPath)), model_calls: models.length,
    known_model_tokens: knownTokens}));
} else {
  const sealBytes = bytes(sealPath), seal = JSON.parse(sealBytes);
  need(seal.status === "sealed-before-native-scoring" && seal.freeze_sha256 === freezeSha &&
    seal.source_receipt_sha256 === sourceReceiptSha && seal.result_sha256 === sha(bytes(resultPath)) &&
    seal.prediction_sha256 === sha(bytes(predictionPath)) && seal.model_calls === models.length &&
    seal.known_model_tokens === knownTokens && seal.scoring_status_at_seal === "not-started" &&
    !existsSync(scorePath), "seal-drift-or-already-scored");
  const plan = read(`${base}/g01-product-replication-r10/cpp-json-b8ef1754/PAIR-PLAN.json`);
  const scorer = plan.scorer;
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
  const score = read(scorePath);
  const f1 = m => m.coverage + m.precision > 0 ? 2 * m.coverage * m.precision / (m.coverage + m.precision) : 0;
  const note = {schema_version: "are.g01-r17-exposed-control-native-result/v1", status: "native-scored-exposed",
    freeze_sha256: freezeSha, source_receipt_sha256: sourceReceiptSha,
    prediction_seal_sha256: sha(sealBytes), result_sha256: seal.result_sha256,
    prediction_sha256: seal.prediction_sha256, native_score_sha256: sha(bytes(scorePath)),
    task_sha256: freeze.task_sha256, span_f1: f1(score.native.final.span), file_f1: f1(score.native.final.file),
    known_model_tokens: knownTokens, model_calls: models.length,
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000,
    claim_ceiling: "One exposed control task; no matched prospective pair, interval, holdout or superiority"};
  const notePath = join(root, "EXPOSED-SCORE.json");
  save(notePath, note);
  console.log(JSON.stringify({status: note.status, note_sha256: sha(bytes(notePath)),
    span_f1: note.span_f1, file_f1: note.file_f1, known_model_tokens: knownTokens, model_calls: models.length}));
}
