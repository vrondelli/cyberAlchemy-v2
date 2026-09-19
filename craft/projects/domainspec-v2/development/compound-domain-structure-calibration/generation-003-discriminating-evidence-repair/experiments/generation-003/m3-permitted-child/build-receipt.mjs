import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(experimentRoot, "../../..");
const evidenceRoot = resolve(packageRoot, "evidence/generation-003/m3-permitted-child");
const firstPath = resolve(evidenceRoot, "raw-run-1/run.json");
const secondPath = resolve(evidenceRoot, "raw-run-2/run.json");
const first = readFileSync(firstPath);
const second = readFileSync(secondPath);
if (!first.equals(second)) throw new TypeError("permitted mutation replay mismatch");
const output = JSON.parse(first);
mkdirSync(evidenceRoot, { recursive: true });
writeFileSync(resolve(evidenceRoot, "edit-diff.json"), `${JSON.stringify(output.edit_diff, null, 2)}\n`);
writeFileSync(resolve(evidenceRoot, "receipt.json"), `${JSON.stringify(output.observation_receipt, null, 2)}\n`);
const receipt = {
  schema_version: "cdsc.m3-permitted-build-receipt.v1",
  observation_receipt_handle: digest(readFileSync(resolve(evidenceRoot, "receipt.json"))),
  edit_diff_handle: digest(readFileSync(resolve(evidenceRoot, "edit-diff.json"))),
  raw_run_handle: digest(first),
  replay_state: "identical",
  target_states: Object.fromEntries(output.observation_receipt.target_observations.map((item) => [item.target_id, item.state])),
};
writeFileSync(resolve(evidenceRoot, "build-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt)}\n`);

function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
