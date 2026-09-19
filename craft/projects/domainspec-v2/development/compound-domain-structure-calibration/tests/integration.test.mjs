import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalize } from "../evaluation/canonical-json.mjs";
import { evaluateFixture } from "../evaluation/evaluate-fixture.mjs";
import { evaluateSuite } from "../evaluation/evaluate-suite.mjs";
import {
  appendGeneration,
  createGenerationIndex,
  generationEntryFromSuite,
  validateGenerationIndex,
} from "../evaluation/generation-index.mjs";
import { validateEvaluationResult, validateEvidenceReceipt, validateSuiteResult } from "../evaluation/validate-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const receiptPaths = [
  "evidence/generation-001/f1-fabrication-gate/receipt.json",
  "evidence/generation-001/f2-use-has-mounted/receipt.json",
  "evidence/generation-001/f3-savvy-page/receipt.json",
];
const resultPaths = [
  "results/generation-001/f1-result.json",
  "results/generation-001/f2-result.json",
  "results/generation-001/f3-result.json",
];

test("accepted receipts use only frozen schema vocabulary", () => {
  const schema = readJson("contracts/evidence-receipt.schema.yml");
  const kinds = new Set(schema.$defs.explanation.properties.kind.enum);
  const classes = new Set(schema.$defs.observable.properties.class.enum);
  for (const receipt of receiptPaths.map(readJson)) {
    assert.equal(validateEvidenceReceipt(receipt), true);
    assert.ok(receipt.semantic.A.every((item) => kinds.has(item.kind)));
    assert.ok(receipt.semantic.Q.every((item) => classes.has(item.class)));
  }
});

test("stored fixture results equal a fresh deterministic evaluation", () => {
  const receipts = receiptPaths.map(readJson);
  const stored = resultPaths.map(readJson);
  const fresh = receipts.map(evaluateFixture);
  assert.equal(canonicalize(fresh), canonicalize(stored));
  assert.deepEqual(fresh.map((item) => item.semantic.fixture_outcome), [
    "EXPLAINED",
    "EXPLAINED",
    "INSUFFICIENT-EVIDENCE",
  ]);
  assert.ok(stored.every((item) => validateEvaluationResult(item)));
});

test("suite result defers on F3 and is stable under same-process replay", () => {
  const fixtureResults = resultPaths.map(readJson);
  const stored = readJson("results/generation-001/suite-result.json");
  const first = evaluateSuite(fixtureResults, { replayState: "identical" });
  const second = evaluateSuite(fixtureResults.map((item) => structuredClone(item)), { replayState: "identical" });
  assert.equal(canonicalize(first), canonicalize(second));
  assert.equal(canonicalize(first), canonicalize(stored));
  assert.equal(stored.semantic.suite_verdict, "CALIBRATION-DEFER");
  assert.equal(stored.semantic.next_route, "evidence-repair");
  assert.equal(validateSuiteResult(stored), true);
});

test("generation index preserves the append-only generation-1 prefix", () => {
  const fixtureResults = resultPaths.map(readJson);
  const suite = readJson("results/generation-001/suite-result.json");
  const stored = readJson("generations/index.json");
  const expected = appendGeneration(createGenerationIndex(), generationEntryFromSuite(suite, fixtureResults));
  assert.deepEqual(stored.entries[0], expected.entries[0]);
  assert.equal(validateGenerationIndex(stored), true);
  assert.throws(() => appendGeneration(stored, stored.entries[0]), /duplicate generation id/);
});

test("machine result statuses contain no authority or promotion claim", () => {
  const outputs = [...resultPaths.map(readJson), readJson("results/generation-001/suite-result.json")];
  assert.ok(outputs.every((item) => !/(authority|promotion|identity|pattern-admission)/i.test(item.status)));
});
