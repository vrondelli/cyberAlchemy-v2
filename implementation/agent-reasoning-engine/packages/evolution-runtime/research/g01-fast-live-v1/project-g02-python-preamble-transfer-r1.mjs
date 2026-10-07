// Source-only exposed transfer screen. Do not read labels or native scores.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {addPythonImportPreamble} from "./python-import-preamble-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-python-g02-transfer.${reason}`);};
const toolsRoot = "/opt/are/evolution-runtime/g01-python-preamble-g02-transfer-tools-r1";
const outputRoot = "/opt/are/evolution-runtime/g01-python-preamble-g02-exposed-transfer-r1";
const planPath = join(toolsRoot, "EXECUTION-PLAN.json");
const rulePath = fileURLToPath(new URL("./python-import-preamble-r1.mjs", import.meta.url));
const planSha = "bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808";
const ruleSha = "f85ce0bfc43fd715531087894e70dd993b50c2523e517aa3b4e7242f90753fa7";
const mode = process.argv[2];
need(["--check", "--produce"].includes(mode) && process.argv.length === 3, "arguments");
need(!existsSync(outputRoot) && sha(readFileSync(planPath)) === planSha &&
  sha(readFileSync(rulePath)) === ruleSha, "binding-or-output-root");
const plan = JSON.parse(readFileSync(planPath));
const pairs = plan.ordered_pairs.filter(pair => pair.instance_id.includes("__python__"));
need(plan.ordered_pairs.length === 24 && pairs.length === 12, "denominator");
const rows = [];
for (const pair of pairs) {
  need(/^pr2-(?:open|qut)-[a-f0-9]{8}$/.test(pair.suffix) &&
    pair.root === `/opt/are-benchmark-runs/g02-cross-layer-${pair.suffix}`,
  "pair-identity");
  const originalPath = join(pair.root, "evidence/run/prediction.json");
  const base = realpathSync(join(pair.root, "sources/session/base"));
  const originalBytes = readFileSync(originalPath), original = JSON.parse(originalBytes);
  need(original.instance_id === pair.instance_id, "prediction-identity");
  const projected = addPythonImportPreamble(original, path => {
    const candidate = resolve(base, path);
    if (!candidate.startsWith(base + sep) || !existsSync(candidate) ||
      realpathSync(candidate) !== candidate) return null;
    return readFileSync(candidate, "utf8");
  });
  const outputBytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
  rows.push({suffix: pair.suffix, instance_id: pair.instance_id,
    original_prediction_sha256: sha(originalBytes),
    projected_prediction_sha256: sha(outputBytes),
    changed: projected.additions.length > 0, additions: projected.additions,
    selected_files: original.traj_data.pred_files.length});
  if (mode === "--produce" && projected.additions.length > 0) {
    // Stage in a fresh private root; source seal is written only after all rows.
    if (!existsSync(outputRoot)) mkdirSync(outputRoot, {mode: 0o700});
    const cell = join(outputRoot, pair.suffix);
    mkdirSync(cell, {mode: 0o700});
    writeFileSync(join(cell, "prediction.json"), outputBytes, {flag: "wx", mode: 0o600});
  }
}
const seal = {schema_version: "are.g01-python-preamble-g02-exposed-source-seal/v1",
  posture: "source-only-projection-before-native-scoring; no model or gold access",
  plan_sha256: planSha, rule_sha256: ruleSha,
  denominator: pairs.length, changed_predictions: rows.filter(row => row.changed).length,
  rows, model_calls: 0, gold_loaded: false,
  claim_ceiling: "G02 exposed transfer screen of a G01 source-only rule; not a G01 pair, fresh holdout, or superiority",
  open_questions: ["Does native scoring show regression across all 12 exposed Python cases?",
    "Can an independent G01 paired cohort reproduce a qualified gain?"]};
if (mode === "--produce") {
  need(existsSync(outputRoot), "no-projections");
  const path = join(outputRoot, "SOURCE-SEAL.json");
  writeFileSync(path, `${JSON.stringify(seal, null, 2)}\n`, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: "source-sealed", denominator: pairs.length,
    changed_predictions: seal.changed_predictions, seal_sha256: sha(readFileSync(path))}));
} else {
  console.log(JSON.stringify({status: "check-passed-not-written", denominator: pairs.length,
    changed_predictions: seal.changed_predictions,
    additions: rows.reduce((sum, row) => sum + row.additions.length, 0)}));
}
