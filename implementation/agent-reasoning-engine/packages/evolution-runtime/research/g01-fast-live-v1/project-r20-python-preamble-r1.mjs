// Project the pinned exposed r20 Python control prediction without native gold.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {addPythonImportPreamble} from "./python-import-preamble-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r20-python-preamble.${reason}`);};
const inputRoot = "/tmp/are-g01-r20-exposed-transfer-160k-240s-r1/python-requests-9cca0774/control";
const predictionPath = join(inputRoot, "runs/00/prediction.json");
const base = join(inputRoot, "source/00/base");
const sourcePath = "requests/sessions.py";
const outputRoot = "/opt/are/evolution-runtime/g01-r20-python-preamble-exposed-r1";
const expectedPredictionSha = "8379adfc82844c9f9f477640b5ac3ca9961a8eacef7f4d3cae5ae3502176169c";
const expectedSourceSha = "968b595aa5367cec2dc5e519511da8ce2c7d1f6d7c28a9712effa64ae372e104";
const mode = process.argv[2];
need(["--check", "--produce"].includes(mode) && process.argv.length === 3, "arguments");
need(!existsSync(outputRoot), "output-root-used");
const originalBytes = readFileSync(predictionPath), sourceBytes = readFileSync(join(base, sourcePath));
need(sha(originalBytes) === expectedPredictionSha && sha(sourceBytes) === expectedSourceSha,
  "input-drift");
const original = JSON.parse(originalBytes);
need(original.instance_id === "SWE-Bench-Verified__python__maintenance__bugfix__9cca0774" &&
  original.traj_data.pred_files.length === 1 && original.traj_data.pred_files[0] === sourcePath,
  "prediction-identity");
const projected = addPythonImportPreamble(original, path =>
  path === sourcePath ? sourceBytes.toString("utf8") : null);
need(projected.additions.length === 1 && projected.additions[0].span.start === 1 &&
  projected.additions[0].span.end === 38, "projection-shape");
const outputBytes = Buffer.from(`${JSON.stringify(projected.prediction, null, 2)}\n`);
const receipt = {schema_version: "are.g01-r20-python-import-preamble-projection/v1",
  posture: "source-only-exposed-development; prediction sealed before native scoring",
  instance_id: original.instance_id, input_prediction_sha256: expectedPredictionSha,
  base_source_sha256: expectedSourceSha, output_prediction_sha256: sha(outputBytes),
  additions: projected.additions, model_calls: 0, gold_loaded: false,
  claim_ceiling: "Exposed no-model span projection only; no transfer, holdout or superiority claim",
  open_questions: ["Does this policy improve exposed native span quality without losing precision?",
    "How often does it trigger, and with what cost, across exposed Python tasks?"]};
if (mode === "--check") {
  console.log(JSON.stringify({status: "check-passed-not-written", output_prediction_sha256: sha(outputBytes),
    additions: projected.additions.length, model_calls: 0}));
} else {
  mkdirSync(outputRoot, {mode: 0o700});
  writeFileSync(join(outputRoot, "prediction.json"), outputBytes, {flag: "wx", mode: 0o600});
  writeFileSync(join(outputRoot, "PROJECTION.json"), `${JSON.stringify(receipt, null, 2)}\n`,
    {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: "projected", output_root: outputRoot,
    prediction_sha256: sha(outputBytes), projection_sha256: sha(readFileSync(join(outputRoot, "PROJECTION.json"))),
    additions: projected.additions.length, model_calls: 0}));
}
