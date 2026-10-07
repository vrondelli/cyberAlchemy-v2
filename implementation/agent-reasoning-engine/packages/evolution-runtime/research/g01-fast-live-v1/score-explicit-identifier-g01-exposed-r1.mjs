// Score a presealed, source-only exposed G01 projection; no model calls.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
if (!["--score", "--audit"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-explicit-identifier-score.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-explicit-identifier-score.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-explicit-identifier-g01-exposed-r1";
const sealPath = join(root, "SOURCE-SEAL.json"), seal = json(sealPath);
need(sha(read(sealPath)) === "80c2f520bf46bc33ea6b551ffa4fcc4e39a4e0ad631a925d4af776327781a9c5" &&
  seal.status === "source-only-sealed-before-native-scoring" && seal.denominator === 3 &&
  seal.changed_predictions === 1 && seal.model_calls_added === 0 && seal.gold_loaded === false &&
  seal.rows.map(row => row.study).join(",") === [
    "g01-r28-openlibrary-import-validation-r1",
    "g01-r29-ansible-import-validation-r1",
    "g01-r30-keras-import-validation-r1"].join(",") &&
  seal.rows.map(row => row.changed).join(",") === "false,false,true", "seal-drift");
const row = seal.rows[2], studyRoot = `/opt/are/evolution-runtime/${row.study}`;
const work = join(root, row.study), predictionPath = join(work, "prediction.json");
const scorePath = join(work, "native-score.json");
need(sha(read(predictionPath)) === row.projected_prediction_sha256, "prediction-drift");
const scorer = json(`/opt/are/evolution-runtime/g01-product-replication-r10/python-keras-4a4abcd4/PAIR-PLAN.json`).scorer;
need(scorer.image === "are-contextbench-scorer:g01-r1", "scorer-drift");
if (mode === "--score") {
  need(!existsSync(scorePath), "score-already-exists");
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${work}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const result = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!result.error && result.status === 0 && existsSync(scorePath),
    `native-score:${String(result.error?.message ?? result.stderr).slice(-300)}`);
}
const score = json(scorePath), original = json(join(studyRoot, "CANDIDATE-SCORE.json"));
const control = json(join(studyRoot, "CONTROL-SCORE.json"));
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
need(statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs &&
  original.prediction_sha256 === row.input_prediction_sha256 &&
  score.native?.final?.file && score.native?.final?.span, "score-lineage");
const projected = {file_f1: f1(score.native.final.file), span_f1: f1(score.native.final.span)};
const note = {schema_version: "are.g01-explicit-identifier-exposed-result/v1",
  status: "native-scored-exposed", source_seal_sha256: sha(read(sealPath)),
  projected_prediction_sha256: row.projected_prediction_sha256,
  projected_score_sha256: sha(read(scorePath)), denominator: seal.denominator,
  changed_predictions: seal.changed_predictions, model_calls_added: 0,
  original_candidate: {file_f1: original.file_f1, span_f1: original.span_f1},
  control: {file_f1: control.file_f1, span_f1: control.span_f1}, projected,
  delta_vs_candidate: {file_f1: projected.file_f1 - original.file_f1,
    span_f1: projected.span_f1 - original.span_f1},
  delta_vs_control: {file_f1: projected.file_f1 - control.file_f1,
    span_f1: projected.span_f1 - control.span_f1},
  claim_ceiling: seal.claim_ceiling};
if (mode === "--audit") {
  const path = join(root, "EXPOSED-RESULT.json");
  need(!existsSync(path), "audit-exists");
  writeFileSync(path, `${JSON.stringify(note, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({...note, result_sha256: sha(read(path))}));
} else console.log(JSON.stringify({status: "native-scored-exposed", projected,
  score_sha256: sha(read(scorePath))}));
