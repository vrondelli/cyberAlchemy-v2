// Seal both exposed predictions before either native score is opened.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";
const [mode, arm] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r18-score.${why}`);};
need(["--seal", "--score"].includes(mode) && ["control", "candidate"].includes(arm) && process.argv.length === 4,
  "arguments");
const base = "/opt/are/evolution-runtime", root = `${base}/g01-r18-exposed-pair-160k-r1`;
const pairSha = "f3afcab5eadc3c5098be3b2ff7184488d26fda677d39c8bc4a694089cd7a2d5a";
const sourceReceiptSha = "fd627343ace676003e9ae0de711a22dceba6dd623e697efac5f7c8cbf95b5035";
const freezes = {control: "fd5cdee147c2cf9376061428f2c8640b6a08ebb0c57382b97f282ab1103c23a4",
  candidate: "932340c4b64d0b09e8137d59890557ee6fbf6b236b71a44d57c9b7d95996d871"};
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const save = (p, v) => writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`, {flag: "wx", mode: 0o600});
const pairPath = join(root, "PAIR-FREEZE.json"), freezePath = join(root, `${arm.toUpperCase()}-FREEZE.json`);
const sourceReceiptPath = `${base}/g01-source-r10-prospective-r17-evidence/SOURCE-SNAPSHOT.json`;
need(sha(bytes(pairPath)) === pairSha && sha(bytes(freezePath)) === freezes[arm] &&
  sha(bytes(sourceReceiptPath)) === sourceReceiptSha, "pinned-freeze-drift");
const pair = read(pairPath), freeze = read(freezePath);
need(pair.status === "frozen-before-dispatch" && pair.budget.total_tokens_per_arm === 160000 &&
  pair.budget.context_tokens_per_request === 8000 && freeze.output_root === join(pair.output_root, arm) &&
  pair.arms.find(r => r.name === arm)?.sha256 === freezes[arm], "pair-shape");
const out = join(freeze.output_root, "runs", "00"), resultPath = join(out, "result.json");
const predictionPath = join(out, "prediction.json"), scorePath = join(out, "native-score.json");
const sealPath = join(root, `${arm.toUpperCase()}-PREDICTION-SEAL.json`);
const result = read(resultPath), models = result.receipts?.filter(r => r.kind === "model") ?? [];
need(result.status === "final_context_selected" && result.task_sha256 === pair.task_sha256 &&
  models.length > 0 && models.every(r => Number.isSafeInteger(r.input_tokens) &&
    Number.isSafeInteger(r.output_tokens) && r.input_tokens >= 0 && r.output_tokens >= 0) &&
  existsSync(predictionPath), "run-not-scorable");
const knownTokens = models.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
if (mode === "--seal") {
  need(!existsSync(sealPath) && !existsSync(scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r18-exposed-pair-prediction-seal/v1",
    status: "sealed-before-native-scoring", arm, pair_sha256: pairSha,
    freeze_sha256: freezes[arm], source_receipt_sha256: sourceReceiptSha,
    task_sha256: pair.task_sha256, result_sha256: sha(bytes(resultPath)),
    prediction_sha256: sha(bytes(predictionPath)), known_model_tokens: knownTokens,
    model_calls: models.length, scoring_status_at_seal: "not-started",
    claim_ceiling: "One exposed matched-budget pair; no fresh holdout or superiority"};
  save(sealPath, seal);
  console.log(JSON.stringify({status: seal.status, arm, seal_sha256: sha(bytes(sealPath)),
    known_model_tokens: knownTokens, model_calls: models.length}));
} else {
  need(["control", "candidate"].every(name => existsSync(join(root, `${name.toUpperCase()}-PREDICTION-SEAL.json`))),
    "both-arms-must-be-sealed");
  const sealBytes = bytes(sealPath), seal = JSON.parse(sealBytes);
  need(seal.status === "sealed-before-native-scoring" && seal.arm === arm && seal.pair_sha256 === pairSha &&
    seal.freeze_sha256 === freezes[arm] && seal.result_sha256 === sha(bytes(resultPath)) &&
    seal.prediction_sha256 === sha(bytes(predictionPath)) && seal.model_calls === models.length &&
    seal.known_model_tokens === knownTokens && seal.scoring_status_at_seal === "not-started" &&
    !existsSync(scorePath), "seal-drift-or-already-scored");
  const scorer = read(`${base}/g01-product-replication-r10/cpp-json-b8ef1754/PAIR-PLAN.json`).scorer;
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
  const note = {schema_version: "are.g01-r18-exposed-pair-native-arm-result/v1",
    status: "native-scored-exposed", arm, pair_sha256: pairSha, freeze_sha256: freezes[arm],
    source_receipt_sha256: sourceReceiptSha, prediction_seal_sha256: sha(sealBytes),
    result_sha256: seal.result_sha256, prediction_sha256: seal.prediction_sha256,
    native_score_sha256: sha(bytes(scorePath)), task_sha256: pair.task_sha256,
    span_f1: f1(score.native.final.span), file_f1: f1(score.native.final.file),
    known_model_tokens: knownTokens, model_calls: models.length,
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000,
    claim_ceiling: "Exposed matched-budget development pair only; no fresh holdout or superiority"};
  const notePath = join(root, `${arm.toUpperCase()}-SCORE.json`);
  save(notePath, note);
  console.log(JSON.stringify({status: note.status, arm, note_sha256: sha(bytes(notePath)),
    span_f1: note.span_f1, file_f1: note.file_f1,
    known_model_tokens: knownTokens, model_calls: models.length}));
}
