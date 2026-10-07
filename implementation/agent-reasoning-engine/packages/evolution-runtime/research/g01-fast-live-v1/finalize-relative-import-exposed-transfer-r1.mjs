// Native scoring only after the 13-case source-only transfer seal exists.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-relative-transfer-score.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-relative-import-exposed-transfer-r1";
const sealPath = join(root, "SOURCE-SEAL.json");
const sealSha = "060c04b86f545313b3f6f8da77c09590fb7fb785930ac8a0e4c4619e5db58515";
const originalScorePath = "/tmp/are-g01-r27-exposed-python-early-r1/candidate/runs/00/native-score.json";
const originalScoreSha = "3940d1c42f1112ee7331db0b3c460a7bd26a0251117f55f6da93cb3d501ae825";
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
need(process.argv.length === 2 && sha(read(sealPath)) === sealSha &&
  sha(read(originalScorePath)) === originalScoreSha &&
  !existsSync(join(root, "SCORE-RESULT.json")), "pinned-input-or-output-drift");
const seal = json(sealPath), changed = seal.rows.filter(row => row.changed);
need(seal.status === "source-sealed-before-native-scoring" && seal.denominator === 13 &&
  seal.gold_loaded === false && seal.model_calls_added === 0 && changed.length === 1 &&
  changed[0].cohort === "g01-r27" && changed[0].suffix === "r27-python-requests-candidate" &&
  seal.rows.filter(row => row.cohort === "g02-r2").length === 12, "seal-shape");
const cell = join(root, changed[0].suffix), predictionPath = join(cell, "prediction.json");
const scorePath = join(cell, "native-score.json");
need(sha(read(predictionPath)) === changed[0].projected_prediction_sha256 &&
  !existsSync(scorePath), "projection-drift-or-already-scored");
const scorer = json("/opt/are/evolution-runtime/g01-product-replication-r10/python-requests-9cca0774/PAIR-PLAN.json").scorer;
need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
  [scorer.repo, scorer.upstream, scorer.cache].every(path => typeof path === "string" && path.startsWith("/")),
"scorer-binding");
const args = ["run", "--rm", "--network", "none", "-v", `${scorer.repo}:/repo:ro`,
  "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
  "-v", `${cell}:/work`, scorer.image, "python",
  "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
  "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
  "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
need(!run.error && run.status === 0 && existsSync(scorePath),
  `native-score:${String(run.error?.message ?? run.stderr).slice(-300)}`);
need(statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs, "score-before-seal");
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const original = json(originalScorePath).native.final, projected = json(scorePath).native.final;
const result = {schema_version: "are.g01-relative-import-exposed-transfer-result/v1",
  status: "one-changed-case-native-scored", source_seal_sha256: sealSha,
  denominator: 13, changed_predictions: 1, unchanged_g02_predictions: 12,
  original_score_sha256: originalScoreSha, projected_score_sha256: sha(read(scorePath)),
  projected_prediction_sha256: changed[0].projected_prediction_sha256,
  original: {file_f1: f1(original.file), span_f1: f1(original.span)},
  projected: {file_f1: f1(projected.file), span_f1: f1(projected.span)},
  model_calls_added: 0,
  claim_ceiling: "Post-hoc one-case exposed G01 diagnostic; zero G02 triggers; no transfer, fresh holdout, or superiority"};
result.delta = {file_f1: result.projected.file_f1 - result.original.file_f1,
  span_f1: result.projected.span_f1 - result.original.span_f1};
const resultPath = join(root, "SCORE-RESULT.json");
writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: result.status, result_sha256: sha(read(resultPath)),
  denominator: result.denominator, changed_predictions: result.changed_predictions,
  original: result.original, projected: result.projected, delta: result.delta,
  claim_ceiling: result.claim_ceiling}));
