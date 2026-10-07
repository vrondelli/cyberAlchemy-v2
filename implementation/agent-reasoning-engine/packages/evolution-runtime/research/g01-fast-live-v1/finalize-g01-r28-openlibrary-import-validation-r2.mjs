// R2 harness-only scorer transport repair. The failed R1 source remains on VPS.
// Seal native predictions and source-only rule outcome before native scoring.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, realpathSync, statSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {addPythonRelativeImportTargets} from "./python-relative-import-target-r1.mjs";

const [mode, arm] = process.argv.slice(2);
const need = (value, reason) => {if (!value) throw Error(`g01-r28-finalize.${reason}`);};
need(["--seal", "--project", "--score", "--audit"].includes(mode) &&
  (["--seal", "--score"].includes(mode) ? ["control", "candidate"].includes(arm) : arm === undefined),
"arguments");
const root = "/opt/are/evolution-runtime/g01-r28-openlibrary-import-validation-r1";
const definitionSha = "fd4dbb15dafe539e8d7dda6cbcdc84bafff0542c9b22510481fc57a91632f9bf";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
need(sha(read(join(root, "DEFINITION.json"))) === definitionSha, "definition-drift");
const definition = json(join(root, "DEFINITION.json"));
need(definition.status === "frozen-before-dispatch" &&
  definition.order.join(",") === "control,candidate" && definition.context_window === 8000, "definition-shape");
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
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;
const projectionPath = join(root, "SOURCE-PROJECTION-SEAL.json");
if (mode === "--seal") {
  const x = item(arm);
  need(!existsSync(x.sealPath) && !existsSync(x.scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r28-prediction-seal/v1", status: "sealed-before-native-scoring",
    arm, definition_sha256: definitionSha, arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    result_sha256: sha(read(x.resultPath)), prediction_sha256: sha(read(x.predictionPath)),
    task_sha256: definition.task_sha256, model_calls: x.model_calls,
    known_model_tokens: x.known_model_tokens, scoring_status_at_seal: "not-started"};
  save(x.sealPath, seal);
  console.log(JSON.stringify({status: seal.status, arm, seal_sha256: sha(read(x.sealPath)),
    model_calls: x.model_calls, known_model_tokens: x.known_model_tokens}));
} else if (mode === "--project") {
  const x = item("candidate");
  need(["control", "candidate"].every(name => existsSync(item(name).sealPath)) &&
    !existsSync(projectionPath) && !existsSync(x.scorePath), "prediction-seals-or-score-state");
  const base = realpathSync(join(x.freeze.output_root, "source", "00", "base"));
  const original = json(x.predictionPath);
  const projected = addPythonRelativeImportTargets(original, path => {
    const candidate = resolve(base, path);
    if (!candidate.startsWith(base + sep) || !existsSync(candidate) ||
      realpathSync(candidate) !== candidate) return null;
    return read(candidate).toString("utf8");
  });
  const projection = {schema_version: "are.g01-r28-source-projection-seal/v1",
    status: "source-only-projection-sealed-before-native-scoring", definition_sha256: definitionSha,
    rule_sha256: definition.import_rule_sha256,
    input_prediction_sha256: sha(read(x.predictionPath)),
    additions: projected.additions, changed: projected.additions.length > 0,
    model_calls_added: 0, gold_loaded: false};
  if (projection.changed) {
    const output = join(root, "PROJECTED-CANDIDATE-PREDICTION.json");
    save(output, projected.prediction);
    projection.projected_prediction_sha256 = sha(read(output));
  } else projection.projected_prediction_sha256 = projection.input_prediction_sha256;
  save(projectionPath, projection);
  console.log(JSON.stringify({status: projection.status, changed: projection.changed,
    additions: projection.additions.length, projection_sha256: sha(read(projectionPath)),
    model_calls_added: 0}));
} else if (mode === "--score") {
  const x = item(arm);
  need(existsSync(projectionPath) && !existsSync(x.scorePath) && !existsSync(x.notePath),
    "projection-or-score-state");
  const projection = json(projectionPath), seal = json(x.sealPath);
  need(projection.status === "source-only-projection-sealed-before-native-scoring" &&
    projection.definition_sha256 === definitionSha && projection.rule_sha256 === definition.import_rule_sha256 &&
    seal.prediction_sha256 === sha(read(x.predictionPath)) &&
    seal.result_sha256 === sha(read(x.resultPath)) &&
    seal.model_calls === x.model_calls && seal.known_model_tokens === x.known_model_tokens, "seal-drift");
  const scorer = json("/opt/are/evolution-runtime/g01-product-replication-r10/python-openlibrary-fd2aaa2a/PAIR-PLAN.json").scorer;
  need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
    [scorer.repo, scorer.upstream, scorer.cache].every(path => typeof path === "string" && path.startsWith("/")),
  "scorer-binding");
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${x.out}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!run.error && run.status === 0 && existsSync(x.scorePath),
    `native-score:${String(run.error?.message ?? run.stderr).slice(-300)}`);
  need(Math.max(statSync(x.sealPath).mtimeMs, statSync(projectionPath).mtimeMs) <=
    statSync(x.scorePath).mtimeMs, "score-before-seal");
  const score = json(x.scorePath);
  const note = {schema_version: "are.g01-r28-native-arm-score/v1", status: "native-scored-exposed",
    arm, definition_sha256: definitionSha, arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    prediction_seal_sha256: sha(read(x.sealPath)), source_projection_seal_sha256: sha(read(projectionPath)),
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
} else {
  const rows = [item("control"), item("candidate")];
  const projection = json(projectionPath);
  need(projection.definition_sha256 === definitionSha &&
    projection.rule_sha256 === definition.import_rule_sha256 && projection.model_calls_added === 0 &&
    projection.gold_loaded === false, "projection-drift");
  for (const x of rows) {
    need(existsSync(x.sealPath) && existsSync(x.scorePath) && existsSync(x.notePath), "incomplete-pair");
    const seal = json(x.sealPath), note = json(x.notePath), score = json(x.scorePath);
    need(seal.result_sha256 === sha(read(x.resultPath)) && seal.prediction_sha256 === sha(read(x.predictionPath)) &&
      seal.model_calls === x.model_calls && seal.known_model_tokens === x.known_model_tokens &&
      note.prediction_seal_sha256 === sha(read(x.sealPath)) &&
      note.source_projection_seal_sha256 === sha(read(projectionPath)) &&
      note.native_score_sha256 === sha(read(x.scorePath)) &&
      Math.abs(note.file_f1 - f1(score.native.final.file)) < 1e-12 &&
      Math.abs(note.span_f1 - f1(score.native.final.span)) < 1e-12, `${x.name}-audit-drift`);
  }
  need(Math.max(...rows.map(x => statSync(x.sealPath).mtimeMs), statSync(projectionPath).mtimeMs) <=
    Math.min(...rows.map(x => statSync(x.scorePath).mtimeMs)), "score-before-both-seals");
  const [control, candidate] = rows.map(x => json(x.notePath));
  const audit = {schema_version: "are.g01-r28-paired-audit/v1", status: "paired-native-score-verified",
    definition_sha256: definitionSha, task_slug: definition.task_slug,
    source_projection_seal_sha256: sha(read(projectionPath)), rule_triggered: projection.changed,
    scored_pairs: 1, fresh_holdout: false,
    arms: Object.fromEntries(rows.map(x => [x.name, {result_sha256: sha(read(x.resultPath)),
      prediction_seal_sha256: sha(read(x.sealPath)), native_score_sha256: sha(read(x.notePath))}])),
    delta: {file_f1: candidate.file_f1 - control.file_f1,
      span_f1: candidate.span_f1 - control.span_f1,
      token_ratio: candidate.known_model_tokens / control.known_model_tokens,
      duration_ratio: candidate.duration_seconds / control.duration_seconds},
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
    delta: audit.delta, claim_ceiling: audit.claim_ceiling}));
}
