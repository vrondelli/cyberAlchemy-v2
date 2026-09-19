import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateBrowserBaselineWitness } from "../../runtime/validate-browser-contracts.mjs";

const harnessRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(harnessRoot, "../..");
const evidenceRoot = resolve(packageRoot, "evidence/generation-003/browser-baseline");
const first = readJson(resolve(evidenceRoot, "raw-run-1/run.json"));
const second = readJson(resolve(evidenceRoot, "raw-run-2/run.json"));
if (JSON.stringify(first) !== JSON.stringify(second)) throw new TypeError("fresh browser baseline replay mismatch");
if (first.vectors.some((vector) => vector.comparison !== "match")) throw new TypeError("browser baseline vector mismatch");

const witness = {
  schema_version: "cdsc.browser-baseline-witness.v1",
  runtime_handle: first.runtime_handle,
  source_manifest_handle: first.source_manifest_handle,
  vectors: first.vectors,
  supporting_screenshots: first.supporting_screenshots,
  replay_state: "identical",
};
validateBrowserBaselineWitness(witness, { runtimeHandle: first.runtime_handle, sourceManifestHandle: first.source_manifest_handle });
mkdirSync(evidenceRoot, { recursive: true });
writeFileSync(resolve(evidenceRoot, "witness.json"), `${JSON.stringify(witness, null, 2)}\n`);
const receipt = {
  schema_version: "cdsc.browser-baseline-build-receipt.v1",
  baseline_witness_handle: digest(readFileSync(resolve(evidenceRoot, "witness.json"))),
  raw_run_handle: digest(readFileSync(resolve(evidenceRoot, "raw-run-1/run.json"))),
  replay_state: "identical",
  vector_count: witness.vectors.length,
  matching_vectors: witness.vectors.filter((vector) => vector.comparison === "match").length,
};
writeFileSync(resolve(evidenceRoot, "build-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt)}\n`);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
