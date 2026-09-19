import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { evaluateFixture } from "../evaluation/evaluate-fixture.mjs";
import { validateEvidenceReceipt } from "../evaluation/validate-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receipt = JSON.parse(readFileSync(resolve(root, "evidence/generation-001/f2-use-has-mounted/receipt.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "fixtures/generation-001/fixture-manifest.yml"), "utf8"));

test("F2 receipt is frozen, total, and bound to the manifest", () => {
  assert.equal(validateEvidenceReceipt(receipt), true);
  assert.equal(receipt.semantic.fixture_id, "F2");
  assert.deepEqual(receipt.input_handles, [manifest.record_id]);
  assert.equal(receipt.semantic.sigma_matrix.length, receipt.semantic.A.length * receipt.semantic.Q.length);
});

test("F2 records ordinary helper and framework explanations without invented lifecycle", () => {
  assert.ok(receipt.semantic.A.some((item) => /reactive helper/.test(item.statement)));
  assert.ok(receipt.semantic.A.some((item) => /framework role/.test(item.statement)));
  assert.ok(receipt.semantic.Q.every((item) => item.class !== "lifecycle"));
  assert.equal(receipt.semantic.D.nonzero, false);
});

test("F2 substitutions are represented and the collapse control evaluates EXPLAINED", () => {
  assert.equal(receipt.semantic.S.permitted.observation_state, "supported");
  assert.equal(receipt.semantic.S.breaking.observation_state, "supported");
  assert.equal(evaluateFixture(receipt).semantic.fixture_outcome, "EXPLAINED");
});
