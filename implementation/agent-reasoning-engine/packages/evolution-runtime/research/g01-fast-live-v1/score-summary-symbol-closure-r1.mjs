// Native-score the already sealed exposed projection; no provider request.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
if (!["--check", "--score", "--audit"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-summary-symbol-score.arguments");
const root = "/opt/are/evolution-runtime/g01-summary-symbol-closure-r1";
const sealPath = join(root, "SOURCE-SEAL.json"), read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (ok, reason) => {if (!ok) throw Error(`g01-summary-symbol-score.${reason}`);};
const seal = json(sealPath);
need(sha(read(sealPath)) === "3579539ac06a159a20f68d2c0958b92963bae19ed4141d299be3d612398eab5b" &&
  seal.status === "source-only-sealed-before-native-scoring" && seal.denominator === 8 &&
  seal.changed_predictions === 1 && seal.model_calls_added === 0 && seal.gold_loaded === false,
"seal-drift");
const changed = seal.rows.filter(row => row.additions.length > 0);
need(changed.length === 1 && changed[0].study === "g01-r38-pytest-next-order-r1" &&
  changed[0].additions.length === 1 && changed[0].additions[0].path === "src/_pytest/_io/saferepr.py" &&
  seal.rows.map(row => row.study).join(",") === [
    "g01-r28-openlibrary-import-validation-r1", "g01-r29-ansible-import-validation-r1",
    "g01-r30-keras-import-validation-r1", "g01-r33-django-heading-pair-r1",
    "g01-r34-keras-heading-transfer-r1", "g01-r35-langchain-next-order-r1",
    "g01-r36-openlibrary-next-order-r1", "g01-r38-pytest-next-order-r1"
  ].join(","), "denominator-drift");
const row = changed[0], work = join(root, row.study);
const predictionPath = join(work, "prediction.json"), scorePath = join(work, "native-score.json");
need(sha(read(predictionPath)) === row.projected_prediction_sha256, "prediction-drift");
const plan = json("/opt/are/evolution-runtime/g01-product-replication-r10/python-pytest-c2f0f2be/PAIR-PLAN.json");
const scorer = plan.scorer;
need(scorer.image === "are-contextbench-scorer:g01-r1" &&
  scorer.repo.startsWith("/opt/are/evolution-runtime/") &&
  scorer.upstream.startsWith("/opt/are/evolution-runtime/") &&
  scorer.cache.startsWith("/opt/are/evolution-runtime/"), "scorer-binding");
if (mode === "--check") {
  need(!existsSync(scorePath), "score-already-exists");
  console.log(JSON.stringify({status: "ready-to-score", denominator: 8, changed: 1,
    seal_sha256: sha(read(sealPath)), prediction_sha256: row.projected_prediction_sha256}));
  process.exit(0);
}
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
const score = json(scorePath), study = `/opt/are/evolution-runtime/${row.study}`;
const original = json(join(study, "CANDIDATE-SCORE.json"));
const control = json(join(study, "CONTROL-SCORE.json"));
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
need(statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs &&
  original.prediction_sha256 === row.original_prediction_sha256 &&
  score.native?.final?.file && score.native?.final?.span, "score-lineage");
const projected = {file_f1: f1(score.native.final.file), span_f1: f1(score.native.final.span)};
const note = {schema_version: "are.g01-summary-symbol-closure-exposed-result/v1",
  status: "native-scored-exposed", source_seal_sha256: sha(read(sealPath)),
  projected_prediction_sha256: row.projected_prediction_sha256,
  projected_score_sha256: sha(read(scorePath)), denominator: seal.denominator,
  changed_predictions: seal.changed_predictions, model_calls_added: 0,
  original_candidate: {file_f1: original.file_f1, span_f1: original.span_f1},
  control: {file_f1: control.file_f1, span_f1: control.span_f1}, projected,
  delta_vs_candidate: {file_f1: projected.file_f1 - original.file_f1,
    span_f1: projected.span_f1 - original.span_f1},
  delta_vs_control: {file_f1: projected.file_f1 - control.file_f1,
    span_f1: projected.span_f1 - control.span_f1}, claim_ceiling: seal.claim_ceiling};
if (mode === "--audit") {
  const path = join(root, "EXPOSED-RESULT.json");
  need(!existsSync(path), "audit-exists");
  writeFileSync(path, `${JSON.stringify(note, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({...note, result_sha256: sha(read(path))}));
} else console.log(JSON.stringify({status: note.status, projected,
  score_sha256: note.projected_score_sha256}));
