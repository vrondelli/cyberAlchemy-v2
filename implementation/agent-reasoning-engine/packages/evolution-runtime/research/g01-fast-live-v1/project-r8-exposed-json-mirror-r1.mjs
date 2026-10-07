// No-model, source-only exposed diagnostic. It never opens gold or scores.
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {addExactSingleIncludeMirrors} from "./mirror-source-context-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-json-mirror.${reason}`);};
const base = "/opt/are/evolution-runtime";
const inputPath = `${base}/g01-product-replication-r8/cpp-json-20af1351/candidate/runs/00/prediction.json`;
const inputSha = "cc52107752ed1a9a8fca185eaadc688aa7123cbc7256f004b84d0f46b04a59ec";
const repository = "/tmp/are-g01-post-r7-source-caches-r1/nlohmann--json.git";
const commit = "9426074ce85da2121c315cae8574d8eaca520cb7";
const root = `${base}/g01-r8-exposed-json-mirror-r1`;
try {
  const mode = process.argv[2];
  need(["--check", "--produce"].includes(mode) && process.argv.length === 3 && !existsSync(root), "arguments-or-root-used");
  need(sha(readFileSync(inputPath)) === inputSha, "input-drift");
  const input = JSON.parse(readFileSync(inputPath));
  need(input.commit === commit && input.instance_id === "Multi-SWE-Bench__cpp__maintenance__bugfix__20af1351", "identity");
  const readSource = path => {
    try {return execFileSync("git", ["-C", repository, "show", `${commit}:${path}`], {encoding: "utf8", maxBuffer: 5_000_000, stdio: ["ignore", "pipe", "ignore"]});}
    catch {return null;}
  };
  const projected = addExactSingleIncludeMirrors(input, readSource);
  need(projected.additions.length === 1 && projected.additions[0].source === "include/nlohmann/json.hpp" && projected.additions[0].mirror === "single_include/nlohmann/json.hpp", "projection-shape");
  const output = Buffer.from(JSON.stringify(projected.prediction, null, 2) + "\n");
  const receipt = {schema_version: "are.g01-source-only-mirror-projection/v1", status: "exposed-development-only", input_prediction_sha256: inputSha, output_prediction_sha256: sha(output), repository_cache: repository, base_commit: commit, additions: projected.additions, model_calls: 0, gold_loaded: false, claim_ceiling: "One exposed source-only projection; no native score, fresh holdout, or superiority claim"};
  if (mode === "--check") console.log(JSON.stringify({status: "check-passed-not-written", additions: projected.additions.length, output_sha256: sha(output), model_calls: 0}));
  else {
    mkdirSync(root, {mode: 0o700});
    writeFileSync(join(root, "prediction.json"), output, {flag: "wx", mode: 0o600});
    writeFileSync(join(root, "PROJECTION.json"), JSON.stringify(receipt, null, 2) + "\n", {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "projected", root, prediction_sha256: sha(output), projection_sha256: sha(readFileSync(join(root, "PROJECTION.json"))), additions: projected.additions.length}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "projection-failed", error: String(error.message)}));
  process.exitCode = 2;
}
