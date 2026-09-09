import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = resolve(root, "../..");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const experiment = readJson(resolve(root, "EXPERIMENT.json"));
const generation = readJson(resolve(root, "evidence/GENERATION-RECEIPT.json"));
const errors = [];

for (const dependency of experiment.source_dependencies) {
  const path = resolve(root, dependency.ref);
  if (sha256(path) !== dependency.sha256) errors.push(`SOURCE_DIGEST_DRIFT:${dependency.ref}`);
}
if (generation.status !== "PASS") errors.push("GENERATION_NOT_PASS");
if (generation.counts.canvas_nodes !== experiment.expected.canvas_node_count) errors.push("CANVAS_NODE_COUNT_INVALID");
if (generation.counts.relations !== experiment.expected.relation_count) errors.push("RELATION_COUNT_INVALID");
if (experiment.authority_effect !== "none" || generation.authority_effect !== "none") errors.push("AUTHORITY_EFFECT_INVALID");

if (process.argv.includes("--require-proof")) {
  try {
    const proof = readJson(resolve(root, "evidence/RUN-RECEIPT.json"));
    if (proof.status !== "PASS") errors.push("BROWSER_PROOF_NOT_PASS");
    if (proof.source_epoch !== generation.source_epoch) errors.push("PROOF_SOURCE_EPOCH_DRIFT");
    if (proof.authority_effect !== "none") errors.push("PROOF_AUTHORITY_EFFECT_INVALID");
  } catch {
    errors.push("BROWSER_PROOF_MISSING");
  }
}

const result = {
  schema_version: "cav2-workspace-ontology-canvas-validation/v1",
  status: errors.length ? "BLOCK" : "PASS",
  errors,
  experiment_id: experiment.experiment_id,
  source_epoch: generation.source_epoch,
  authority_effect: "none",
  claim_ceiling: experiment.claim_ceiling,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = errors.length ? 1 : 0;
