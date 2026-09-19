import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProtectedImports } from "../runtime/validate-imports.mjs";
import { EXPLANATION_IDS, TARGET_IDS, TEST_CATALOG, evaluateUsefulness, symmetricDifference, validateUsefulnessInput } from "../runtime/evaluate-usefulness.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(packageRoot, path), "utf8"));
const input = readJson("fixtures/usefulness/preregistered-input.json");
const vectors = readJson("fixtures/usefulness/vectors.json");
const stored = readJson("evidence/generation-003/usefulness-differential/result.json");
const first = readJson("evidence/generation-003/usefulness-differential/run-1.json");
const second = readJson("evidence/generation-003/usefulness-differential/run-2.json");
const protectedManifest = readJson("runs/SWU-CDSC3-001/protected-input-manifest.json");

test("schema and direct evaluator freeze the same finite catalog", () => {
  const schema = readJson("contracts/usefulness-differential.schema.yml");
  assert.deepEqual(schema.properties.test_catalog.items.enum, TEST_CATALOG);
  assert.equal(validateUsefulnessInput(input), true);
  assert.deepEqual(input.explanation_coverage.map((row) => row.subject_id), EXPLANATION_IDS);
  assert.deepEqual(input.target_coverage.map((row) => row.subject_id), TARGET_IDS);
});

test("accepted input deterministically produces an empty symmetric difference", () => {
  assert.deepEqual(evaluateUsefulness(input), stored);
  assert.deepEqual(first, second);
  assert.deepEqual(stored.symmetric_difference, []);
  assert.equal(stored.nonzero, false);
  assert.deepEqual(stored.baseline_test_set, [...TEST_CATALOG].sort());
  assert.deepEqual(stored.residual_test_set, [...TEST_CATALOG].sort());
});

test("synthetic valid coverage can produce a nonempty differential", () => {
  const candidate = structuredClone(input);
  for (const row of [...candidate.explanation_coverage, ...candidate.target_coverage]) row.test_ids = row.test_ids.filter((id) => id !== "browser:journey");
  const result = evaluateUsefulness(candidate);
  assert.deepEqual(result.symmetric_difference, ["browser:journey"]);
  assert.equal(result.nonzero, true);
});

test("ordering and duplicate-free set semantics are deterministic", () => {
  const candidate = structuredClone(input);
  candidate.explanation_coverage.reverse();
  candidate.target_coverage.reverse();
  assert.throws(() => evaluateUsefulness(candidate), /coverage subjects mismatch/);
  for (const row of input.explanation_coverage) assert.deepEqual([...new Set(row.test_ids)], row.test_ids);
  assert.deepEqual(symmetricDifference(["b", "a"], ["c", "b"]), ["a", "c"]);
});

test("missing coverage and circular output inputs reject", () => {
  const missing = structuredClone(input);
  missing.target_coverage.pop();
  assert.throws(() => evaluateUsefulness(missing), /coverage subjects mismatch/);
  const circular = structuredClone(input);
  circular.result = { symmetric_difference: [] };
  assert.throws(() => evaluateUsefulness(circular), /unknown or missing field/);
});

test("result binds exact evidence and carries no authority claim", () => {
  assert.equal(stored.target_set_handle, "sha256:6ae51fa18434106afa02bac24930517f1a6f574422fd81c29647ea9c7c96496e");
  assert.equal(stored.observation_handles.permitted, "sha256:0f6aafa8f7a78278a712c44109935dd57d1dae316c9ff2fd02b91ddc76ac7d85");
  assert.equal(stored.observation_handles.breaking, "sha256:879c37a64cf02ab1e28ca819e6a3e6c0de8bc05e061e9b65807d58033e74fdc5");
  assert.ok(stored.prohibited_inferences.includes("identity"));
  assert.ok(stored.prohibited_inferences.includes("promotion"));
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
});

test("fixture catalog names every required behavior class", () => {
  assert.deepEqual(vectors.vectors.map((vector) => vector.id), ["accepted-empty", "synthetic-nonempty", "ordering", "missing-coverage", "circular-input", "replay"]);
});
