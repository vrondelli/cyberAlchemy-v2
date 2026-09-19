import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(experimentRoot, "../../..");
const evidenceRoot = resolve(packageRoot, "evidence/generation-003/m3-breaking-commit");
const firstPath = resolve(evidenceRoot, "raw-run-1/run.json");
const secondPath = resolve(evidenceRoot, "raw-run-2/run.json");
const first = readFileSync(firstPath);
const second = readFileSync(secondPath);
if (!first.equals(second)) throw new TypeError("breaking mutation replay mismatch");
const output = JSON.parse(first);
mkdirSync(evidenceRoot, { recursive: true });
write("edit-diff.json", output.edit_diff);
write("target-comparison.json", output.guard_commit_comparison);
write("receipt.json", output.observation_receipt);
const receipt = {
  schema_version: "cdsc.m3-breaking-build-receipt.v1",
  observation_receipt_handle: digest(readFileSync(resolve(evidenceRoot, "receipt.json"))),
  edit_diff_handle: digest(readFileSync(resolve(evidenceRoot, "edit-diff.json"))),
  target_comparison_handle: digest(readFileSync(resolve(evidenceRoot, "target-comparison.json"))),
  raw_run_handle: digest(first),
  replay_state: "identical",
  target_states: Object.fromEntries(output.observation_receipt.target_observations.map((item) => [item.target_id, item.state])),
};
write("build-receipt.json", receipt);
process.stdout.write(`${JSON.stringify(receipt)}\n`);

function write(name, value) { writeFileSync(resolve(evidenceRoot, name), `${JSON.stringify(value, null, 2)}\n`); }
function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
