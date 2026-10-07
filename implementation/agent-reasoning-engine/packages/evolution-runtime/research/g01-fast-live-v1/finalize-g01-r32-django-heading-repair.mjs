// Seal, native-score, and audit the exposed candidate-only r32 completion.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const mode = process.argv[2];
if (!["--seal", "--score", "--audit"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-r32-finalize.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-r32-finalize.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-r32-django-heading-repair-r1";
const definitionPath = join(root, "DEFINITION.json"), definition = json(definitionPath);
const definitionSha = "489a938d3c2edcf4f3c33102fb18a115af270989eb232c9483391418a78f0d5d";
const freezePath = join(root, "CANDIDATE-FREEZE.json"), freeze = json(freezePath);
need(sha(read(definitionPath)) === definitionSha &&
  sha(read(freezePath)) === definition.candidate_freeze_sha256 &&
  definition.schema_version === "are.g01-r32-django-heading-repair-definition/v1" &&
  definition.status === "frozen-before-dispatch", "definition-drift");
const out = join(freeze.output_root, "runs/00");
const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
const scorePath = join(out, "native-score.json");
const sealPath = join(root, "PREDICTION-SEAL.json");
const result = json(resultPath), models = result.receipts.filter(item => item.kind === "model" && item.dispatched !== false);
need(result.status === "final_context_selected" && result.task_sha256 === definition.task_sha256 &&
  existsSync(predictionPath) && models.length > 0 && models.every(item =>
    Number.isSafeInteger(item.input_tokens) && Number.isSafeInteger(item.output_tokens)),
  "candidate-not-scorable");
const knownTokens = models.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0);
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`,
  {flag: "wx", mode: 0o600});
if (mode === "--seal") {
  need(!existsSync(sealPath) && !existsSync(scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r32-django-prediction-seal/v1",
    status: "sealed-before-native-scoring", definition_sha256: definitionSha,
    candidate_freeze_sha256: definition.candidate_freeze_sha256,
    result_sha256: sha(read(resultPath)), prediction_sha256: sha(read(predictionPath)),
    model_calls: models.length, known_model_tokens: knownTokens,
    scoring_status_at_seal: "not-started"};
  save(sealPath, seal);
  console.log(JSON.stringify({status: seal.status, seal_sha256: sha(read(sealPath)),
    model_calls: models.length, known_model_tokens: knownTokens}));
} else {
  const seal = json(sealPath);
  need(seal.status === "sealed-before-native-scoring" &&
    seal.definition_sha256 === definitionSha &&
    seal.result_sha256 === sha(read(resultPath)) &&
    seal.prediction_sha256 === sha(read(predictionPath)) &&
    seal.model_calls === models.length && seal.known_model_tokens === knownTokens,
    "seal-drift");
  if (mode === "--score") {
    need(!existsSync(scorePath), "already-scored");
    const scorer = json("/opt/are/evolution-runtime/g01-product-replication-r10/python-django-d2a786e2/PAIR-PLAN.json").scorer;
    need(scorer.image === "are-contextbench-scorer:g01-r1", "scorer-drift");
    const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
      "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
      "-v", `${out}:/work`, scorer.image, "python",
      "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
      "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
      "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
    const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
    need(!run.error && run.status === 0 && existsSync(scorePath),
      `native-score:${String(run.error?.message ?? run.stderr).slice(-300)}`);
  }
  const score = json(scorePath);
  need(statSync(sealPath).mtimeMs <= statSync(scorePath).mtimeMs &&
    score.native?.final?.file && score.native?.final?.span, "score-after-seal");
  const note = {schema_version: "are.g01-r32-django-candidate-only-result/v1",
    status: "candidate-only-native-scored-exposed", definition_sha256: definitionSha,
    prediction_seal_sha256: sha(read(sealPath)), result_sha256: sha(read(resultPath)),
    prediction_sha256: sha(read(predictionPath)), native_score_sha256: sha(read(scorePath)),
    file_f1: f1(score.native.final.file), span_f1: f1(score.native.final.span),
    model_calls: models.length, known_model_tokens: knownTokens,
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs -
      statSync(join(out, "started.json")).mtimeMs) / 1000,
    fresh_holdout: false, matched_pair: false, claim_ceiling: definition.claim_ceiling};
  if (mode === "--audit") {
    const path = join(root, "CANDIDATE-ONLY-AUDIT.json");
    need(!existsSync(path), "audit-exists");
    save(path, note);
    console.log(JSON.stringify({...note, audit_sha256: sha(read(path))}));
  } else console.log(JSON.stringify({status: note.status, file_f1: note.file_f1,
    span_f1: note.span_f1, score_sha256: note.native_score_sha256}));
}
