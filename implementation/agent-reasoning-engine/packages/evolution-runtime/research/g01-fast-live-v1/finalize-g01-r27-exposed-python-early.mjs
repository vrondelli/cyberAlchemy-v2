// Seal both predictions before opening native labels, then score and audit.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [mode, arm] = process.argv.slice(2);
const need = (value, reason) => { if (!value) throw Error(`g01-r27-finalize.${reason}`); };
need(["--seal", "--score", "--audit"].includes(mode) &&
  (mode === "--audit" ? arm === undefined : ["control", "candidate"].includes(arm)), "arguments");
const base = "/opt/are/evolution-runtime";
const root = `${base}/g01-r27-exposed-python-early-r1`;
const definitionSha = "87b2df6605e446e856fc548159f689fbeedd0412a21463834669858bd6d187f7";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx", mode: 0o600});
need(sha(read(join(root, "DEFINITION.json"))) === definitionSha, "definition-drift");
const definition = json(join(root, "DEFINITION.json"));
need(definition.status === "frozen-before-dispatch" && definition.order.join(",") === "control,candidate" &&
  definition.context_window === 8000 && definition.total_tokens_per_arm === 160000, "definition-shape");
const row = name => {
  const freezePath = join(root, `${name.toUpperCase()}-FREEZE.json`);
  need(sha(read(freezePath)) === definition.arms[name].freeze_sha256, `${name}-freeze-drift`);
  const freeze = json(freezePath), out = join(freeze.output_root, "runs", "00");
  const resultPath = join(out, "result.json"), predictionPath = join(out, "prediction.json");
  const sealPath = join(root, `${name.toUpperCase()}-PREDICTION-SEAL.json`);
  const scorePath = join(out, "native-score.json"), notePath = join(root, `${name.toUpperCase()}-SCORE.json`);
  const result = json(resultPath), models = result.receipts?.filter(item => item.kind === "model" && item.dispatched !== false) ?? [];
  need(freeze.task_sha256 === definition.task_sha256 && result.task_sha256 === definition.task_sha256 &&
    result.status === "final_context_selected" && existsSync(predictionPath) && models.length > 0 &&
    models.every(item => Number.isSafeInteger(item.input_tokens) && Number.isSafeInteger(item.output_tokens) &&
      item.input_tokens >= 0 && item.output_tokens >= 0), `${name}-run-not-scorable`);
  return {name, freeze, out, resultPath, predictionPath, sealPath, scorePath, notePath,
    model_calls: models.length, known_model_tokens: models.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0)};
};
const f1 = value => value.coverage + value.precision > 0 ?
  2 * value.coverage * value.precision / (value.coverage + value.precision) : 0;

if (mode === "--seal") {
  const item = row(arm);
  need(!existsSync(item.sealPath) && !existsSync(item.scorePath), "already-sealed-or-scored");
  const seal = {schema_version: "are.g01-r27-prediction-seal/v1", status: "sealed-before-native-scoring",
    arm, definition_sha256: definitionSha, arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    task_sha256: definition.task_sha256, result_sha256: sha(read(item.resultPath)),
    prediction_sha256: sha(read(item.predictionPath)), model_calls: item.model_calls,
    known_model_tokens: item.known_model_tokens, scoring_status_at_seal: "not-started",
    claim_ceiling: definition.claim_ceiling};
  save(item.sealPath, seal);
  console.log(JSON.stringify({status: seal.status, arm, seal_sha256: sha(read(item.sealPath)),
    model_calls: item.model_calls, known_model_tokens: item.known_model_tokens}));
} else if (mode === "--score") {
  const item = row(arm);
  need(["control", "candidate"].every(name => existsSync(join(root, `${name.toUpperCase()}-PREDICTION-SEAL.json`))) &&
    !existsSync(item.scorePath) && !existsSync(item.notePath), "seals-or-score-state");
  const seal = json(item.sealPath);
  need(seal.status === "sealed-before-native-scoring" && seal.arm === arm &&
    seal.definition_sha256 === definitionSha && seal.arm_freeze_sha256 === definition.arms[arm].freeze_sha256 &&
    seal.result_sha256 === sha(read(item.resultPath)) && seal.prediction_sha256 === sha(read(item.predictionPath)) &&
    seal.model_calls === item.model_calls && seal.known_model_tokens === item.known_model_tokens, "seal-drift");
  const scorer = json(`${base}/g01-product-replication-r10/python-requests-9cca0774/PAIR-PLAN.json`).scorer;
  need(scorer?.image === "are-contextbench-scorer:g01-r1" &&
    [scorer.repo, scorer.upstream, scorer.cache].every(path => typeof path === "string" && path.startsWith("/")),
  "scorer-binding");
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`,
    "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`,
    "-v", `${item.out}:/work`, scorer.image, "python",
    "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py",
    "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet",
    "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const run = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!run.error && run.status === 0 && existsSync(item.scorePath),
    `native-score:${String(run.error?.message ?? run.stderr).slice(-300)}`);
  need(statSync(item.sealPath).mtimeMs <= statSync(item.scorePath).mtimeMs, "score-before-seal");
  const score = json(item.scorePath);
  const note = {schema_version: "are.g01-r27-native-score/v1", status: "native-scored-exposed", arm,
    definition_sha256: definitionSha, arm_freeze_sha256: definition.arms[arm].freeze_sha256,
    prediction_seal_sha256: sha(read(item.sealPath)), result_sha256: seal.result_sha256,
    prediction_sha256: seal.prediction_sha256, native_score_sha256: sha(read(item.scorePath)),
    task_sha256: definition.task_sha256, span_f1: f1(score.native.final.span),
    file_f1: f1(score.native.final.file), known_model_tokens: item.known_model_tokens,
    model_calls: item.model_calls,
    duration_seconds: (statSync(join(item.out, "completed.json")).mtimeMs - statSync(join(item.out, "started.json")).mtimeMs) / 1000,
    claim_ceiling: definition.claim_ceiling};
  save(item.notePath, note);
  console.log(JSON.stringify({status: note.status, arm, note_sha256: sha(read(item.notePath)),
    span_f1: note.span_f1, file_f1: note.file_f1, known_model_tokens: note.known_model_tokens,
    model_calls: note.model_calls, duration_seconds: note.duration_seconds}));
} else {
  const rows = [row("control"), row("candidate")];
  for (const item of rows) {
    need(existsSync(item.sealPath) && existsSync(item.scorePath) && existsSync(item.notePath), "incomplete-score");
    const seal = json(item.sealPath), note = json(item.notePath), score = json(item.scorePath);
    need(seal.definition_sha256 === definitionSha && seal.arm_freeze_sha256 === definition.arms[item.name].freeze_sha256 &&
      seal.result_sha256 === sha(read(item.resultPath)) && seal.prediction_sha256 === sha(read(item.predictionPath)) &&
      seal.known_model_tokens === item.known_model_tokens && seal.model_calls === item.model_calls &&
      note.prediction_seal_sha256 === sha(read(item.sealPath)) && note.native_score_sha256 === sha(read(item.scorePath)) &&
      Math.abs(note.span_f1 - f1(score.native.final.span)) < 1e-12 &&
      Math.abs(note.file_f1 - f1(score.native.final.file)) < 1e-12, `${item.name}-audit-drift`);
  }
  need(Math.max(...rows.map(item => statSync(item.sealPath).mtimeMs)) <=
    Math.min(...rows.map(item => statSync(item.scorePath).mtimeMs)), "score-before-both-seals");
  const [control, candidate] = rows.map(item => json(item.notePath));
  const audit = {schema_version: "are.g01-r27-independent-audit/v1", status: "paired-score-verified",
    definition_sha256: definitionSha, scored_pairs: 1, fresh_holdout: false,
    arms: Object.fromEntries(rows.map(item => [item.name, {freeze_sha256: definition.arms[item.name].freeze_sha256,
      result_sha256: sha(read(item.resultPath)), seal_sha256: sha(read(item.sealPath)),
      score_sha256: sha(read(item.notePath))}])),
    delta: {file_f1: candidate.file_f1 - control.file_f1,
      span_f1: candidate.span_f1 - control.span_f1,
      token_ratio: candidate.known_model_tokens / control.known_model_tokens,
      duration_ratio: candidate.duration_seconds / control.duration_seconds},
    claim_ceiling: definition.claim_ceiling};
  const auditPath = join(root, "INDEPENDENT-AUDIT.json");
  need(!existsSync(auditPath), "audit-exists");
  save(auditPath, audit);
  console.log(JSON.stringify({status: audit.status, audit_sha256: sha(read(auditPath)),
    control: {file_f1: control.file_f1, span_f1: control.span_f1, known_model_tokens: control.known_model_tokens,
      model_calls: control.model_calls}, candidate: {file_f1: candidate.file_f1, span_f1: candidate.span_f1,
      known_model_tokens: candidate.known_model_tokens, model_calls: candidate.model_calls}, delta: audit.delta,
    claim_ceiling: audit.claim_ceiling}));
}
