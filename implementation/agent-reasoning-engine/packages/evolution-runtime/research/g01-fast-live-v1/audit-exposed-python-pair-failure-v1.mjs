// Terminal unscored-pair audit; never opens labels or creates a native score.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const [root, definitionSha] = process.argv.slice(2);
if (!/^\/opt\/are\/evolution-runtime\/g01-r[0-9]+-[a-z0-9-]+-r[0-9]+$/.test(root ?? "") ||
  !/^[a-f0-9]{64}$/.test(definitionSha ?? "") || process.argv.length !== 4)
  throw Error("g01-exposed-failure.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-exposed-failure.${reason}`);};
const definitionPath = join(root, "DEFINITION.json");
need(sha(read(definitionPath)) === definitionSha, "definition-drift");
const definition = json(definitionPath);
need(definition.schema_version === "are.g01-exposed-python-pair-definition/v1" &&
  definition.order.join(",") === "control,candidate", "definition-shape");
const rows = {};
for (const arm of ["control", "candidate"]) {
  const freezePath = join(root, `${arm.toUpperCase()}-FREEZE.json`);
  need(sha(read(freezePath)) === definition.arms[arm].freeze_sha256, `${arm}-freeze-drift`);
  const freeze = json(freezePath), out = join(freeze.output_root, "runs/00");
  const resultPath = join(out, "result.json"), result = json(resultPath);
  need(result.task_sha256 === definition.task_sha256 &&
    existsSync(join(out, "started.json")) && existsSync(join(out, "completed.json")) &&
    !existsSync(join(out, "native-score.json")) &&
    !existsSync(join(root, `${arm.toUpperCase()}-SCORE.json`)), `${arm}-run-state`);
  const models = result.receipts.filter(receipt => receipt.kind === "model" && receipt.dispatched !== false);
  const known = models.filter(receipt => Number.isSafeInteger(receipt.input_tokens) &&
    Number.isSafeInteger(receipt.output_tokens));
  rows[arm] = {status: result.status, error: result.error ?? null,
    result_sha256: sha(read(resultPath)), model_calls: models.length,
    known_model_calls: known.length,
    known_model_tokens: known.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0),
    prediction_exists: existsSync(join(out, "prediction.json")),
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs -
      statSync(join(out, "started.json")).mtimeMs) / 1000};
}
const controlSealPath = join(root, "CONTROL-PREDICTION-SEAL.json"), controlSeal = json(controlSealPath);
const controlFreeze = json(join(root, "CONTROL-FREEZE.json"));
need(rows.control.status === "final_context_selected" && rows.control.prediction_exists &&
  rows.candidate.status === "run_error" &&
  rows.candidate.error === "intent-anchor-episode.non-tool-corrections-exhausted" &&
  !rows.candidate.prediction_exists && rows.control.model_calls > 0 &&
  rows.candidate.model_calls > 0 &&
  controlSeal.prediction_sha256 === sha(read(join(controlFreeze.output_root, "runs/00/prediction.json"))) &&
  controlSeal.result_sha256 === rows.control.result_sha256 &&
  !existsSync(join(root, "CANDIDATE-PREDICTION-SEAL.json")) &&
  !existsSync(join(root, "SOURCE-PROJECTION-SEAL.json")), "pair-failure-shape");
const audit = {schema_version: "are.g01-exposed-python-failed-pair-audit/v1",
  status: "terminal-unscored-pair-verified", definition_sha256: definitionSha,
  task_slug: definition.task_slug, control_prediction_seal_sha256: sha(read(controlSealPath)),
  arms: rows, scored_pairs: 0, automatic_retries: definition.automatic_retries,
  fresh_holdout: false, claim_ceiling: definition.claim_ceiling};
const path = join(root, "FAILED-PAIR-AUDIT.json");
need(!existsSync(path), "audit-exists");
writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: audit.status, audit_sha256: sha(read(path)),
  arms: rows, scored_pairs: 0, claim_ceiling: audit.claim_ceiling}));
