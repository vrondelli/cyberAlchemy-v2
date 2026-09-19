import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateEvidenceReceipt } from "../evaluation/validate-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receipt = JSON.parse(readFileSync(resolve(root, "evidence/generation-001/f1-fabrication-gate/receipt.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "fixtures/generation-001/fixture-manifest.yml"), "utf8"));

test("F1 receipt is frozen, total, and bound to the manifest", () => {
  assert.equal(validateEvidenceReceipt(receipt), true);
  assert.equal(receipt.semantic.fixture_id, "F1");
  assert.deepEqual(receipt.input_handles, [manifest.record_id]);
  assert.equal(receipt.semantic.sigma_matrix.length, receipt.semantic.A.length * receipt.semantic.Q.length);
});

test("F1 receipt distinguishes every required existing explanation", () => {
  const kinds = new Set(receipt.semantic.A.map((item) => item.kind));
  for (const kind of ["atomic-type", "contextual-role", "architecture-pattern", "sequencing", "aggregation", "named-instance"]) {
    assert.ok(kinds.has(kind), kind);
  }
  assert.match(receipt.semantic.A.find((item) => item.explanation_id === "A-01").statement, /Rule, Operation, and Workflow/);
});

test("F1 substitutions have consequences and uncertainty remains explicit", () => {
  assert.equal(receipt.semantic.S.permitted.observation_state, "supported");
  assert.equal(receipt.semantic.S.breaking.observation_state, "supported");
  assert.ok(receipt.semantic.U.some((item) => item.state === "non-portable"));
  assert.equal(receipt.semantic.D.nonzero, false);
});
