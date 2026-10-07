// Fixed 12-case cross-benchmark trigger screen; source-only, no score or model.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {addPythonExplicitIdentifierAnchors} from "./python-explicit-identifier-anchor-r1.mjs";

const mode = process.argv[2];
if (!["--check", "--produce"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-explicit-identifier-g02.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-explicit-identifier-g02.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-explicit-identifier-g02-exposed-transfer-r1";
const planPath = "/opt/are/evolution-runtime/g01-python-preamble-g02-transfer-tools-r1/EXECUTION-PLAN.json";
const planSha = "bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808";
const priorPath = "/opt/are/evolution-runtime/g01-relative-import-exposed-transfer-r1/SOURCE-SEAL.json";
const priorSha = "060c04b86f545313b3f6f8da77c09590fb7fb785930ac8a0e4c4619e5db58515";
need(!existsSync(root) && sha(read(planPath)) === planSha && sha(read(priorPath)) === priorSha,
  "pinned-input-or-output-drift");
const plan = json(planPath), prior = json(priorPath);
const pairs = plan.ordered_pairs.filter(pair => pair.instance_id.includes("__python__"));
need(plan.ordered_pairs.length === 24 && pairs.length === 12 && prior.denominator === 13,
  "denominator-drift");
const rows = [];
for (const pair of pairs) {
  need(/^pr2-(?:open|qut)-[a-f0-9]{8}$/.test(pair.suffix) &&
    pair.root === `/opt/are-benchmark-runs/g02-cross-layer-${pair.suffix}`, "pair-drift");
  const binding = json(join(pair.root, "tasks/binding.json"));
  need(binding.task_file === `${pair.instance_id}.json`, `${pair.suffix}-task-path`);
  const taskBytes = read(join(pair.root, "tasks", binding.task_file)), task = JSON.parse(taskBytes);
  const predictionPath = join(pair.root, "evidence/run/prediction.json");
  const inputBytes = read(predictionPath), prediction = JSON.parse(inputBytes);
  const priorRow = prior.rows.find(row => row.cohort === "g02-r2" && row.suffix === pair.suffix);
  need(binding.instance_id === pair.instance_id && sha(taskBytes) === binding.task_sha256 &&
    task.instance_id === pair.instance_id && prediction.instance_id === pair.instance_id &&
    priorRow?.input_prediction_sha256 === sha(inputBytes), `${pair.suffix}-input-drift`);
  const base = realpathSync(join(pair.root, "sources/session/base"));
  const projected = addPythonExplicitIdentifierAnchors(prediction, task.problem_statement, path => {
    const target = resolve(base, path);
    if (!target.startsWith(base + sep) || !existsSync(target) || realpathSync(target) !== target) return null;
    return read(target).toString("utf8");
  });
  const outputBytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
  const row = {suffix: pair.suffix, instance_id: pair.instance_id,
    input_prediction_sha256: sha(inputBytes), projected_prediction_sha256: sha(outputBytes),
    changed: projected.additions.length > 0, additions: projected.additions};
  rows.push(row);
  if (mode === "--produce" && row.changed) {
    if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
    const cell = join(root, pair.suffix); mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), outputBytes, {flag: "wx", mode: 0o600});
  }
}
const rulePath = fileURLToPath(new URL("./python-explicit-identifier-anchor-r1.mjs", import.meta.url));
const seal = {schema_version: "are.g01-explicit-identifier-g02-exposed-seal/v1",
  status: "source-only-transfer-screen-sealed", plan_sha256: planSha,
  prior_input_seal_sha256: priorSha, rule_sha256: sha(read(rulePath)),
  denominator: rows.length, changed_predictions: rows.filter(row => row.changed).length,
  rows, model_calls_added: 0, gold_loaded: false,
  claim_ceiling: "Already exposed G02 Python population; not a G01 cohort, no G02 revision or product claim"};
if (mode === "--produce") {
  if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "SOURCE-SEAL.json"), `${JSON.stringify(seal, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? seal.status : "read-only-ready",
  denominator: seal.denominator, changed_predictions: seal.changed_predictions,
  changes: rows.filter(row => row.changed).map(row => [row.suffix, row.additions.map(a => [a.identifier, a.path, a.span])]),
  source_seal_sha256: mode === "--produce" ? sha(read(join(root, "SOURCE-SEAL.json"))) : null,
  model_calls_added: 0}));
