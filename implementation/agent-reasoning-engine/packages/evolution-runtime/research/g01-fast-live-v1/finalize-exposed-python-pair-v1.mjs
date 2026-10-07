// Reusable paired finalizer for manifest-frozen exposed G01 Python studies.
// Predictions and source-only projection are sealed before any native score.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {addPythonRelativeImportTargets} from "./python-relative-import-target-r1.mjs";

const [mode, root, definitionSha, arm] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-exposed-python-finalize.${reason}`);};
need(["--seal", "--project", "--score", "--score-projected", "--audit"].includes(mode) &&
  /^\/opt\/are\/evolution-runtime\/g01-r[0-9]+-[a-z0-9-]+-r[0-9]+$/.test(root ?? "") &&
  /^[a-f0-9]{64}$/.test(definitionSha ?? "") &&
  (["--seal", "--score"].includes(mode) ? ["control", "candidate"].includes(arm) : arm === undefined) &&
  process.argv.length === (["--seal", "--score"].includes(mode) ? 6 : 5), "arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
need(sha(read(join(root, "DEFINITION.json"))) === definitionSha, "definition-drift");
const definition = json(join(root, "DEFINITION.json"));
need(definition.schema_version === "are.g01-exposed-python-pair-definition/v1" &&
  definition.status === "frozen-before-dispatch" && definition.order.join(",") === "control,candidate" &&
  definition.context_window === 8000 && definition.total_tokens_per_arm === 160000, "definition-shape");
const projectSealPath = join(root, "SOURCE-PROJECTION-SEAL.json");
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const item = name => {
  const freezePath = join(root, `${name.toUpperCase()}-FREEZE.json`);
  need(sha(read(freezePath)) === definition.arms[name].freeze_sha256, `${name}-freeze-drift`);
  const freeze = json(freezePath), out = join(freeze.output_root, "runs", "00");
  const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
  const result = json(resultPath), models = result.receipts?.filter(x => x.kind === "model" && x.dispatched !== false) ?? [];
  need(result.status === "final_context_selected" && result.task_sha256 === definition.task_sha256 &&
    existsSync(predictionPath) && models.length > 0 && models.every(x =>
      Number.isSafeInteger(x.input_tokens) && Number.isSafeInteger(x.output_tokens) &&
      x.input_tokens >= 0 && x.output_tokens >= 0), `${name}-unscorable`);
  return {name, freeze, out, resultPath, predictionPath,
    sealPath: join(root, `${name.toUpperCase()}-PREDICTION-SEAL.json`),
    scorePath: join(out, "native-score.json"), notePath: join(root, `${name.toUpperCase()}-SCORE.json`),
    model_calls: models.length,
    known_model_tokens: models.reduce((sum, x) => sum + x.input_tokens + x.output_tokens, 0)};
};
function scorerBinding() {
  const scorer = json(join("/opt/are/evolution-runtime/g01-product-replication-r10",
    definition.task_slug, "PAIR-PLAN.json")).scorer;
  need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
    [scorer.repo, scorer.upstream, scorer.cache].every(path => typeof path === "string" && path.startsWith("/")),
  "scorer-binding");
  return scorer;
}
function scoreAt(work, predictionPath, scorePath) {
  need(!existsSync(scorePath) && existsSync(predictionPath), "already-scored-or-missing-prediction");
  const scorer = scorerBinding();
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${work}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!run.error && run.status === 0 && existsSync(scorePath) &&
    json(scorePath).native?.final, `native-score:${String(run.error?.message ?? run.stderr).slice(-300)}`);
}

if (mode === "--seal") {
  const x = item(arm);
  need(!existsSync(x.sealPath) && !existsSync(x.scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-exposed-python-prediction-seal/v1",
    status: "sealed-before-native-scoring", arm, definition_sha256: definitionSha,
    arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    task_sha256: definition.task_sha256,
    result_sha256: sha(read(x.resultPath)), prediction_sha256: sha(read(x.predictionPath)),
    model_calls: x.model_calls, known_model_tokens: x.known_model_tokens,
    scoring_status_at_seal: "not-started"};
  save(x.sealPath, seal);
  console.log(JSON.stringify({status: seal.status, arm, seal_sha256: sha(read(x.sealPath)),
    model_calls: x.model_calls, known_model_tokens: x.known_model_tokens}));
} else if (mode === "--project") {
  const x = item("candidate");
  need(["control", "candidate"].every(name => existsSync(item(name).sealPath)) &&
    !existsSync(projectSealPath) && !existsSync(x.scorePath), "prediction-seals-or-score-state");
  const base = realpathSync(join(x.freeze.output_root, "source", "00", "base"));
  const original = json(x.predictionPath);
  const projected = addPythonRelativeImportTargets(original, path => {
    const candidate = resolve(base, path);
    if (!candidate.startsWith(base + sep) || !existsSync(candidate) ||
      realpathSync(candidate) !== candidate) return null;
    return read(candidate).toString("utf8");
  });
  const projection = {schema_version: "are.g01-exposed-python-projection-seal/v1",
    status: "source-only-projection-sealed-before-native-scoring", definition_sha256: definitionSha,
    rule_sha256: definition.import_rule_sha256,
    input_prediction_sha256: sha(read(x.predictionPath)),
    additions: projected.additions, changed: projected.additions.length > 0,
    model_calls_added: 0, gold_loaded: false};
  if (projection.changed) {
    const work = join(root, "projected-candidate");
    mkdirSync(work, {mode: 0o700});
    save(join(work, "prediction.json"), projected.prediction);
    projection.projected_prediction_sha256 = sha(read(join(work, "prediction.json")));
  } else projection.projected_prediction_sha256 = projection.input_prediction_sha256;
  save(projectSealPath, projection);
  console.log(JSON.stringify({status: projection.status, changed: projection.changed,
    additions: projection.additions.length, projection_sha256: sha(read(projectSealPath)),
    model_calls_added: 0}));
} else if (mode === "--score") {
  const x = item(arm);
  need(existsSync(projectSealPath) && !existsSync(x.scorePath) && !existsSync(x.notePath),
    "projection-or-score-state");
  const projection = json(projectSealPath), seal = json(x.sealPath);
  need(projection.definition_sha256 === definitionSha &&
    projection.rule_sha256 === definition.import_rule_sha256 &&
    seal.prediction_sha256 === sha(read(x.predictionPath)) &&
    seal.result_sha256 === sha(read(x.resultPath)) && seal.model_calls === x.model_calls &&
    seal.known_model_tokens === x.known_model_tokens, "seal-drift");
  scoreAt(x.out, x.predictionPath, x.scorePath);
  need(Math.max(statSync(x.sealPath).mtimeMs, statSync(projectSealPath).mtimeMs) <=
    statSync(x.scorePath).mtimeMs, "score-before-seal");
  const score = json(x.scorePath);
  const note = {schema_version: "are.g01-exposed-python-native-arm-score/v1",
    status: "native-scored-exposed", arm, definition_sha256: definitionSha,
    arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    prediction_seal_sha256: sha(read(x.sealPath)), source_projection_seal_sha256: sha(read(projectSealPath)),
    result_sha256: sha(read(x.resultPath)), prediction_sha256: sha(read(x.predictionPath)),
    native_score_sha256: sha(read(x.scorePath)), file_f1: f1(score.native.final.file),
    span_f1: f1(score.native.final.span), model_calls: x.model_calls,
    known_model_tokens: x.known_model_tokens,
    duration_seconds: (statSync(join(x.out, "completed.json")).mtimeMs -
      statSync(join(x.out, "started.json")).mtimeMs) / 1000};
  save(x.notePath, note);
  console.log(JSON.stringify({status: note.status, arm, note_sha256: sha(read(x.notePath)),
    file_f1: note.file_f1, span_f1: note.span_f1, model_calls: note.model_calls,
    known_model_tokens: note.known_model_tokens, duration_seconds: note.duration_seconds}));
} else if (mode === "--score-projected") {
  const projection = json(projectSealPath), x = item("candidate");
  need(projection.changed && projection.additions.length > 0 &&
    projection.input_prediction_sha256 === sha(read(x.predictionPath)) &&
    existsSync(x.sealPath) && !existsSync(join(root, "PROJECTED-CANDIDATE-SCORE.json")),
  "projection-not-scorable");
  const work = join(root, "projected-candidate"), predictionPath = join(work, "prediction.json");
  const scorePath = join(work, "native-score.json");
  need(sha(read(predictionPath)) === projection.projected_prediction_sha256,
    "projected-prediction-drift");
  scoreAt(work, predictionPath, scorePath);
  need(statSync(projectSealPath).mtimeMs <= statSync(scorePath).mtimeMs, "projected-score-before-seal");
  const score = json(scorePath);
  const note = {schema_version: "are.g01-exposed-python-projected-score/v1",
    status: "native-scored-exposed", definition_sha256: definitionSha,
    source_projection_seal_sha256: sha(read(projectSealPath)),
    projected_prediction_sha256: projection.projected_prediction_sha256,
    native_score_sha256: sha(read(scorePath)), file_f1: f1(score.native.final.file),
    span_f1: f1(score.native.final.span), model_calls_added: 0};
  save(join(root, "PROJECTED-CANDIDATE-SCORE.json"), note);
  console.log(JSON.stringify({status: note.status, note_sha256: sha(read(join(root, "PROJECTED-CANDIDATE-SCORE.json"))),
    file_f1: note.file_f1, span_f1: note.span_f1, model_calls_added: 0}));
} else {
  const rows = [item("control"), item("candidate")], projection = json(projectSealPath);
  need(projection.definition_sha256 === definitionSha &&
    projection.rule_sha256 === definition.import_rule_sha256 &&
    projection.model_calls_added === 0 && projection.gold_loaded === false, "projection-drift");
  for (const x of rows) {
    need(existsSync(x.sealPath) && existsSync(x.scorePath) && existsSync(x.notePath), "incomplete-pair");
    const seal = json(x.sealPath), note = json(x.notePath), score = json(x.scorePath);
    need(seal.result_sha256 === sha(read(x.resultPath)) &&
      seal.prediction_sha256 === sha(read(x.predictionPath)) &&
      seal.model_calls === x.model_calls && seal.known_model_tokens === x.known_model_tokens &&
      note.prediction_seal_sha256 === sha(read(x.sealPath)) &&
      note.source_projection_seal_sha256 === sha(read(projectSealPath)) &&
      note.native_score_sha256 === sha(read(x.scorePath)) &&
      Math.abs(note.file_f1 - f1(score.native.final.file)) < 1e-12 &&
      Math.abs(note.span_f1 - f1(score.native.final.span)) < 1e-12,
    `${x.name}-audit-drift`);
  }
  need(Math.max(...rows.map(x => statSync(x.sealPath).mtimeMs), statSync(projectSealPath).mtimeMs) <=
    Math.min(...rows.map(x => statSync(x.scorePath).mtimeMs)), "score-before-both-seals");
  const [control, candidate] = rows.map(x => json(x.notePath));
  let projected = null;
  if (projection.changed) {
    const notePath = join(root, "PROJECTED-CANDIDATE-SCORE.json");
    need(existsSync(notePath), "projected-score-missing");
    projected = json(notePath);
    const scorePath = join(root, "projected-candidate", "native-score.json"), score = json(scorePath);
    need(projected.source_projection_seal_sha256 === sha(read(projectSealPath)) &&
      projected.projected_prediction_sha256 === projection.projected_prediction_sha256 &&
      projected.native_score_sha256 === sha(read(scorePath)) &&
      Math.abs(projected.file_f1 - f1(score.native.final.file)) < 1e-12 &&
      Math.abs(projected.span_f1 - f1(score.native.final.span)) < 1e-12, "projected-audit-drift");
  }
  const audit = {schema_version: "are.g01-exposed-python-paired-audit/v1",
    status: "paired-native-score-verified", definition_sha256: definitionSha,
    task_slug: definition.task_slug, source_projection_seal_sha256: sha(read(projectSealPath)),
    rule_triggered: projection.changed, scored_pairs: 1, fresh_holdout: false,
    arms: Object.fromEntries(rows.map(x => [x.name, {result_sha256: sha(read(x.resultPath)),
      prediction_seal_sha256: sha(read(x.sealPath)), native_score_note_sha256: sha(read(x.notePath))}])),
    native_delta: {file_f1: candidate.file_f1 - control.file_f1,
      span_f1: candidate.span_f1 - control.span_f1,
      token_ratio: candidate.known_model_tokens / control.known_model_tokens,
      duration_ratio: candidate.duration_seconds / control.duration_seconds},
    projected_delta: projected ? {file_f1: projected.file_f1 - control.file_f1,
      span_f1: projected.span_f1 - control.span_f1,
      token_ratio: candidate.known_model_tokens / control.known_model_tokens,
      duration_ratio: candidate.duration_seconds / control.duration_seconds} : null,
    claim_ceiling: definition.claim_ceiling};
  const path = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(path), "audit-exists");
  save(path, audit);
  console.log(JSON.stringify({status: audit.status, audit_sha256: sha(read(path)),
    rule_triggered: audit.rule_triggered,
    control: {file_f1: control.file_f1, span_f1: control.span_f1,
      model_calls: control.model_calls, known_model_tokens: control.known_model_tokens},
    candidate: {file_f1: candidate.file_f1, span_f1: candidate.span_f1,
      model_calls: candidate.model_calls, known_model_tokens: candidate.known_model_tokens},
    native_delta: audit.native_delta, projected_delta: audit.projected_delta,
    claim_ceiling: audit.claim_ceiling}));
}
