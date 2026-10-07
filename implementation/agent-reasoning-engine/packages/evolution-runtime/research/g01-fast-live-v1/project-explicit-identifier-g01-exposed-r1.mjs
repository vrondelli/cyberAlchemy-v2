// Fixed exposed G01 denominator. Source-only projection precedes any new score.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {addPythonExplicitIdentifierAnchors} from "./python-explicit-identifier-anchor-r1.mjs";

const mode = process.argv[2];
if (!["--check", "--produce"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-explicit-identifier-project.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-explicit-identifier-project.${reason}`);};
const root = "/opt/are/evolution-runtime/g01-explicit-identifier-g01-exposed-r1";
const cases = [
  ["g01-r28-openlibrary-import-validation-r1", "745253ce6526742e06cea8d1be5de5e42ba36170c12e872cffe3c0859ea4faec"],
  ["g01-r29-ansible-import-validation-r1", "efc59b47b8fe67664ac0fd3a0761f5a5fed5797724731355cb5b495fa870d155"],
  ["g01-r30-keras-import-validation-r1", "199631ca328d058799b197f2d8a925f4b36b6c8029990340d9367cd3e1578408"]
];
need(!existsSync(root), "output-exists");
const rows = [];
for (const [study, predictionSha] of cases) {
  const studyRoot = `/opt/are/evolution-runtime/${study}`;
  const freeze = json(join(studyRoot, "CANDIDATE-FREEZE.json"));
  const seal = json(join(studyRoot, "CANDIDATE-PREDICTION-SEAL.json"));
  const predictionPath = join(freeze.output_root, "runs/00/prediction.json");
  const inputBytes = read(predictionPath), prediction = JSON.parse(inputBytes);
  need(sha(inputBytes) === predictionSha && seal.prediction_sha256 === predictionSha &&
    seal.status === "sealed-before-native-scoring", `${study}-prediction-drift`);
  const config = json(freeze.config_path), taskPath = config.tasks[0].task_path;
  const taskBytes = read(taskPath), task = JSON.parse(taskBytes);
  need(sha(taskBytes) === freeze.task_sha256 && prediction.instance_id === task.instance_id,
    `${study}-task-drift`);
  const base = realpathSync(join(freeze.output_root, "source/00/base"));
  const result = addPythonExplicitIdentifierAnchors(prediction, task.problem_statement, path => {
    const target = resolve(base, path);
    if (!target.startsWith(base + sep) || !existsSync(target) || realpathSync(target) !== target) return null;
    return read(target).toString("utf8");
  });
  const outputBytes = Buffer.from(`${JSON.stringify(result.prediction, null, 2)}\n`);
  const row = {study, instance_id: task.instance_id, input_prediction_sha256: predictionSha,
    projected_prediction_sha256: sha(outputBytes), changed: result.additions.length > 0,
    additions: result.additions};
  rows.push(row);
  if (mode === "--produce" && row.changed) {
    if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
    const cell = join(root, study); mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), outputBytes, {flag: "wx", mode: 0o600});
  }
}
const rulePath = fileURLToPath(new URL("./python-explicit-identifier-anchor-r1.mjs", import.meta.url));
const sourceSeal = {schema_version: "are.g01-explicit-identifier-exposed-source-seal/v1",
  status: "source-only-sealed-before-native-scoring", rule_sha256: sha(read(rulePath)),
  denominator: rows.length, changed_predictions: rows.filter(row => row.changed).length,
  rows, model_calls_added: 0, gold_loaded: false,
  claim_ceiling: "Three already exposed G01 Python tasks; post-hoc development only, no transfer or superiority claim"};
if (mode === "--produce") {
  if (!existsSync(root)) mkdirSync(root, {mode: 0o700});
  writeFileSync(join(root, "SOURCE-SEAL.json"), `${JSON.stringify(sourceSeal, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--produce" ? sourceSeal.status : "read-only-ready",
  denominator: sourceSeal.denominator, changed_predictions: sourceSeal.changed_predictions,
  changes: rows.map(row => [row.study, row.additions.map(a => [a.identifier, a.path, a.span])]),
  source_seal_sha256: mode === "--produce" ? sha(read(join(root, "SOURCE-SEAL.json"))) : null,
  model_calls_added: 0}));
