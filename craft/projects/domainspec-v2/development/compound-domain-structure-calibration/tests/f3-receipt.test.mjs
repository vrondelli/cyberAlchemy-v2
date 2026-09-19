import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { evaluateFixture } from "../evaluation/evaluate-fixture.mjs";
import { validateEvidenceReceipt } from "../evaluation/validate-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receipt = JSON.parse(readFileSync(resolve(root, "evidence/generation-001/f3-savvy-page/receipt.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "fixtures/generation-001/fixture-manifest.yml"), "utf8"));

test("F3 receipt is frozen, total, and bound to the manifest", () => {
  assert.equal(validateEvidenceReceipt(receipt), true);
  assert.equal(receipt.semantic.fixture_id, "F3");
  assert.deepEqual(receipt.input_handles, [manifest.record_id]);
  assert.equal(receipt.semantic.sigma_matrix.length, receipt.semantic.A.length * receipt.semantic.Q.length);
});

test("F3 distinguishes roles, behavior, composition, pressure, and named instance", () => {
  const kinds = new Set(receipt.semantic.A.map((item) => item.kind));
  for (const kind of ["contextual-role", "atomic-type", "sequencing", "aggregation", "architecture-pattern", "named-instance"]) {
    assert.ok(kinds.has(kind), kind);
  }
  assert.match(receipt.semantic.A.find((item) => item.kind === "contextual-role").statement, /route-entry and composition-root/);
  assert.ok(receipt.prohibited_inferences.includes("pattern-admission"));
});

test("F3 preserves missing mutation evidence and evaluates insufficient", () => {
  assert.equal(receipt.semantic.S.permitted.observation_state, "indeterminate");
  assert.equal(receipt.semantic.S.breaking.observation_state, "indeterminate");
  assert.ok(receipt.semantic.U.some((item) => item.state === "untested"));
  assert.equal(evaluateFixture(receipt).semantic.fixture_outcome, "INSUFFICIENT-EVIDENCE");
});
