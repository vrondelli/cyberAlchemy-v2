import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalize } from "../../evaluation/canonical-json.mjs";

export const TEST_CATALOG = Object.freeze(["unit:screen-contract", "unit:guard-rule", "unit:navigation-sequencing", "integration:route-tree", "browser:journey"]);
export const EXPLANATION_IDS = Object.freeze(["A-01", "A-02", "A-03", "A-04", "A-05", "A-06"]);
export const TARGET_IDS = Object.freeze(["T-P-01", "T-P-02", "T-P-03", "T-P-04", "T-B-01", "T-B-02"]);

export function evaluateUsefulness(input) {
  validateUsefulnessInput(input);
  const baseline = sortedUnique([...testsFrom(input.explanation_coverage), ...testsFrom(input.target_coverage)]);
  const residual = sortedUnique([...baseline, ...input.residual_claim.test_ids]);
  const difference = symmetricDifference(baseline, residual);
  return {
    schema_version: "cdsc.usefulness-differential-result.v1",
    input_handle: digest(canonicalize(input)),
    target_set_handle: input.target_set_handle,
    observation_handles: input.observation_handles,
    baseline_test_set: baseline,
    residual_test_set: residual,
    symmetric_difference: difference,
    deterministic: true,
    nonzero: difference.length > 0,
    uncertainty: ["The finite catalog may omit downstream tests outside the preregistered boundary."],
    prohibited_inferences: input.prohibited_inferences,
  };
}

export function validateUsefulnessInput(input) {
  requireObject(input, "usefulness input");
  assertExactKeys(input, ["schema_version", "target_set_handle", "observation_handles", "test_catalog", "explanation_coverage", "target_coverage", "residual_claim", "prohibited_inferences"], "usefulness input");
  if (input.schema_version !== "cdsc.usefulness-differential.v1") throw new TypeError("usefulness schema version mismatch");
  requireDigest(input.target_set_handle, "target set handle");
  assertExactKeys(input.observation_handles, ["permitted", "breaking"], "observation handles");
  requireDigest(input.observation_handles.permitted, "permitted observation handle");
  requireDigest(input.observation_handles.breaking, "breaking observation handle");
  if (JSON.stringify(input.test_catalog) !== JSON.stringify(TEST_CATALOG)) throw new TypeError("test catalog mismatch");
  validateCoverage(input.explanation_coverage, EXPLANATION_IDS, input.test_catalog);
  validateCoverage(input.target_coverage, TARGET_IDS, input.test_catalog);
  requireObject(input.residual_claim, "residual claim");
  assertExactKeys(input.residual_claim, ["claim_id", "authority", "test_ids"], "residual claim");
  if (input.residual_claim.claim_id !== "hypothetical:compound-boundary" || input.residual_claim.authority !== "non-authority-input") throw new TypeError("residual claim authority mismatch");
  validateTestIds(input.residual_claim.test_ids, input.test_catalog);
  if (!Array.isArray(input.prohibited_inferences) || !input.prohibited_inferences.includes("identity") || !input.prohibited_inferences.includes("promotion")) throw new TypeError("required prohibited inferences missing");
  return true;
}

export function symmetricDifference(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return sortedUnique([...leftSet].filter((item) => !rightSet.has(item)).concat([...rightSet].filter((item) => !leftSet.has(item))));
}

function validateCoverage(rows, expectedIds, catalog) {
  if (!Array.isArray(rows) || JSON.stringify(rows.map((row) => row.subject_id)) !== JSON.stringify(expectedIds)) throw new TypeError("coverage subjects mismatch");
  for (const row of rows) {
    requireObject(row, "coverage row");
    assertExactKeys(row, ["subject_id", "test_ids"], "coverage row");
    validateTestIds(row.test_ids, catalog);
  }
}

function validateTestIds(values, catalog) {
  if (!Array.isArray(values) || new Set(values).size !== values.length || values.some((item) => !catalog.includes(item))) throw new TypeError("coverage contains unknown or duplicate test id");
}

function testsFrom(rows) { return rows.flatMap((row) => row.test_ids); }
function sortedUnique(values) { return [...new Set(values)].sort(); }
function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function requireDigest(value, label) { if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} invalid`); }
function requireObject(value, label) { if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); }
function assertExactKeys(value, expected, label) { if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) throw new TypeError(`${label} has unknown or missing field`); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputPath = resolve(process.argv[2]);
  const outputPath = resolve(process.argv[3]);
  const result = evaluateUsefulness(JSON.parse(readFileSync(inputPath, "utf8")));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
