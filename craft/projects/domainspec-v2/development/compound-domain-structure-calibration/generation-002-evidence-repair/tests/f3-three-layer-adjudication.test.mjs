import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalize } from "../../evaluation/canonical-json.mjs";
import { validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";
import { buildAdjudicationArtifacts } from "../../evidence/generation-002/f3-savvy-page/build-receipts.mjs";
import { targetStatement } from "../runtime/materialize-adjudicated-f3.mjs";
import { validateAdjudicationOverlay } from "../runtime/validate-adjudication-overlay.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parentRoot = resolve(root, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readParent = (path) => JSON.parse(readFileSync(resolve(parentRoot, path), "utf8"));
const overlay = readParent("evidence/generation-002/f3-savvy-page/adjudication-overlay.json");
const compatibilityReceipt = readParent("evidence/generation-002/f3-savvy-page/compatibility-receipt.json");
const parentReceipt = readParent("evidence/generation-001/f3-savvy-page/receipt.json");
const permittedReceipt = readJson("evidence/generation-002/m1-permitted-screen/receipt.json");
const breakingReceipt = readJson("evidence/generation-002/m2-breaking-guard/receipt.json");
const layers = { parentReceipt, permittedReceipt, breakingReceipt };

test("stored overlay and compatibility receipt equal fresh deterministic generation", () => {
  const first = buildAdjudicationArtifacts();
  const second = buildAdjudicationArtifacts();
  assert.equal(canonicalize(first.overlay), canonicalize(overlay));
  assert.equal(canonicalize(first.compatibilityReceipt), canonicalize(compatibilityReceipt));
  assert.equal(canonicalize(first.overlay), canonicalize(second.overlay));
  assert.equal(canonicalize(first.compatibilityReceipt), canonicalize(second.compatibilityReceipt));
  const volatile = buildAdjudicationArtifacts({ createdAt: "2099-01-01T00:00:00Z" });
  assert.equal(volatile.overlay.record_id, overlay.record_id);
  assert.equal(volatile.compatibilityReceipt.record_id, compatibilityReceipt.record_id);
});

test("overlay validates as six explanations by two separate substitutions", () => {
  assert.equal(validateAdjudicationOverlay(overlay, layers), true);
  assert.equal(overlay.semantic.adjudication_matrix.length, 12);
  const counts = overlay.semantic.adjudication_matrix.reduce((result, cell) => {
    result[cell.state] = (result[cell.state] ?? 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { indeterminate: 6, "not-explained": 4, explained: 2 });
  const explained = overlay.semantic.adjudication_matrix
    .filter((cell) => cell.state === "explained")
    .map((cell) => `${cell.explanation_id}/${cell.substitution_id}`)
    .sort();
  assert.deepEqual(explained, ["A-02/F3-S-BREAKING", "A-03/F3-S-BREAKING"]);
  for (const cell of overlay.semantic.adjudication_matrix) {
    if (cell.coverage === "partial") assert.equal(cell.state, "indeterminate");
  }
});

test("compatibility projection preserves parent interpretation and derives only substitution targets", () => {
  assert.equal(validateEvidenceReceipt(compatibilityReceipt), true);
  assert.deepEqual(compatibilityReceipt.semantic.G, parentReceipt.semantic.G);
  assert.deepEqual(compatibilityReceipt.semantic.A, parentReceipt.semantic.A);
  assert.deepEqual(compatibilityReceipt.semantic.Q.slice(0, 5), parentReceipt.semantic.Q.slice(0, 5));
  assert.equal(compatibilityReceipt.semantic.Q[5].statement, targetStatement(parentReceipt.semantic.S.permitted));
  assert.equal(compatibilityReceipt.semantic.Q[6].statement, targetStatement(parentReceipt.semantic.S.breaking));
  assert.ok(!compatibilityReceipt.semantic.Q[5].statement.includes(permittedReceipt.semantic.observed_consequence));
  assert.ok(!compatibilityReceipt.semantic.Q[6].statement.includes(breakingReceipt.semantic.observed_consequence));
  assert.deepEqual(compatibilityReceipt.semantic.D, parentReceipt.semantic.D);
  assert.equal(compatibilityReceipt.semantic.S.permitted.observation_state, "supported");
  assert.equal(compatibilityReceipt.semantic.S.breaking.observation_state, "supported");
});

test("resolved mutation gaps disappear while every bounded limitation remains", () => {
  const uncertainty = compatibilityReceipt.semantic.U;
  assert.ok(!uncertainty.some((item) => item.uncertainty_id === "F3-U-01" || item.uncertainty_id === "F3-U-02"));
  assert.deepEqual(uncertainty.map((item) => item.uncertainty_id), ["F3-U-03", "F3-U-M1-1", "F3-U-M1-2", "F3-U-M2-1", "F3-U-M2-2"]);
  assert.ok(uncertainty.every((item) => item.state === "non-portable"));
  for (const statement of [...permittedReceipt.semantic.uncertainty, ...breakingReceipt.semantic.uncertainty]) {
    assert.ok(uncertainty.some((item) => item.statement === statement));
  }
});

test("builder has no evaluator dependency and no result authority", () => {
  const source = readFileSync(resolve(parentRoot, "evidence/generation-002/f3-savvy-page/build-receipts.mjs"), "utf8");
  assert.doesNotMatch(source, /evaluateFixture|evaluateSuite|appendGeneration/);
  assert.ok(compatibilityReceipt.prohibited_inferences.includes("identity"));
  assert.ok(compatibilityReceipt.prohibited_inferences.includes("pattern-admission"));
  assert.ok(compatibilityReceipt.prohibited_inferences.includes("candidate-promotion"));
});

test("review binds every layer and records no evaluation or append", () => {
  const review = readFileSync(resolve(parentRoot, "evidence/generation-002/f3-savvy-page/REVIEW.md"), "utf8");
  for (const receipt of [parentReceipt, permittedReceipt, breakingReceipt, overlay, compatibilityReceipt]) {
    assert.match(review, new RegExp(receipt.record_id.replaceAll(":", "\\:")));
    assert.match(review, new RegExp(receipt.generation_id.replaceAll(":", "\\:")));
  }
  assert.match(review, /evaluation_state: not-run/);
  assert.match(review, /append_state: not-run/);
  assert.match(review, /two `explained`, four `not-explained`, and six/);
  assert.equal(existsSync(resolve(parentRoot, "evidence/generation-002/f3-savvy-page/result.json")), false);
});
