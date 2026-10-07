// Audit an exposed pair whose control failed and whose candidate completed.
// No native score or gold labels are opened.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [root, definitionSha] = process.argv.slice(2);
const need = (ok, reason) => { if (!ok) throw Error(`g01-control-failure.${reason}`); };
need(/^\/opt\/are\/evolution-runtime\/g01-r[0-9]+-[a-z0-9-]+-r[0-9]+$/.test(root ?? "") &&
  /^[a-f0-9]{64}$/.test(definitionSha ?? "") && process.argv.length === 4, "arguments");
const read = path => readFileSync(path);
const json = path => JSON.parse(read(path));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
need(sha(read(join(root, "DEFINITION.json"))) === definitionSha, "definition-drift");
const definition = json(join(root, "DEFINITION.json"));
need(definition.schema_version === "are.g01-exposed-python-pair-definition/v1" &&
  definition.status === "frozen-before-dispatch" &&
  definition.order.join(",") === "control,candidate" &&
  definition.automatic_retries === 0, "definition-shape");
const arms = {};
for (const name of definition.order) {
  const freezePath = join(root, `${name.toUpperCase()}-FREEZE.json`);
  need(sha(read(freezePath)) === definition.arms[name].freeze_sha256, `${name}-freeze-drift`);
  const freeze = json(freezePath), out = join(freeze.output_root, "runs/00");
  const resultPath = join(out, "result.json"), result = json(resultPath);
  const started = join(out, "started.json"), completed = join(out, "completed.json");
  need(result.task_sha256 === definition.task_sha256 &&
    existsSync(started) && existsSync(completed) &&
    json(completed).status === result.status &&
    !existsSync(join(out, "native-score.json")) &&
    !existsSync(join(root, `${name.toUpperCase()}-SCORE.json`)), `${name}-terminal-state`);
  const models = result.receipts.filter(x => x.kind === "model" && x.dispatched !== false);
  const known = models.filter(x => Number.isSafeInteger(x.input_tokens) &&
    Number.isSafeInteger(x.output_tokens) && x.input_tokens >= 0 && x.output_tokens >= 0);
  arms[name] = {status: result.status, error: result.error ?? null,
    result_sha256: sha(read(resultPath)), model_calls: models.length,
    known_model_calls: known.length,
    known_model_tokens: known.reduce((n, x) => n + x.input_tokens + x.output_tokens, 0),
    prediction_exists: existsSync(join(out, "prediction.json")),
    duration_seconds: (statSync(completed).mtimeMs - statSync(started).mtimeMs) / 1000};
}
const candidate = json(join(root, "CANDIDATE-FREEZE.json"));
const sealPath = join(root, "CANDIDATE-PREDICTION-SEAL.json"), seal = json(sealPath);
need(arms.control.status === "run_error" && arms.control.error === "instrument.no-final-context" &&
  !arms.control.prediction_exists && arms.control.model_calls > 0 &&
  arms.candidate.status === "final_context_selected" && arms.candidate.prediction_exists &&
  arms.candidate.model_calls > 0 && arms.candidate.known_model_calls === arms.candidate.model_calls &&
  seal.status === "sealed-before-native-scoring" && seal.definition_sha256 === definitionSha &&
  seal.arm_freeze_sha256 === definition.arms.candidate.freeze_sha256 &&
  seal.result_sha256 === arms.candidate.result_sha256 &&
  seal.prediction_sha256 === sha(read(join(candidate.output_root, "runs/00/prediction.json"))) &&
  seal.model_calls === arms.candidate.model_calls &&
  seal.known_model_tokens === arms.candidate.known_model_tokens &&
  !existsSync(join(root, "CONTROL-PREDICTION-SEAL.json")) &&
  !existsSync(join(root, "SOURCE-PROJECTION-SEAL.json")), "asymmetric-failure-shape");
const audit = {schema_version: "are.g01-exposed-python-control-failure-audit/v1",
  status: "terminal-unscored-pair-verified", definition_sha256: definitionSha,
  task_slug: definition.task_slug, candidate_prediction_seal_sha256: sha(read(sealPath)),
  arms, scored_pairs: 0, automatic_retries: 0, fresh_holdout: false,
  claim_ceiling: definition.claim_ceiling};
const path = join(root, "FAILED-PAIR-AUDIT.json");
need(!existsSync(path), "audit-exists");
writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: audit.status, audit_sha256: sha(read(path)),
  arms, scored_pairs: 0, claim_ceiling: audit.claim_ceiling}));
