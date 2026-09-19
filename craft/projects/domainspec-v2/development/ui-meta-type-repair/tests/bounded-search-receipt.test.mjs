import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createBoundedSearchReceipt } from "../evidence/bounded-search-receipt.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function fixture(name) {
  return JSON.parse(readFileSync(join(root, "fixtures/contracts", `bounded-search-${name}.json`), "utf8"));
}

test("bounded-search and corpus-v2 schemas are closed JSON-formatted YAML", () => {
  for (const name of ["bounded-search-receipt.schema.yml", "corpus-receipt-v2.schema.yml"]) {
    const schema = JSON.parse(readFileSync(join(root, "contracts", name), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.length > 0);
  }
  const corpusV2 = JSON.parse(readFileSync(join(root, "contracts/corpus-receipt-v2.schema.yml"), "utf8"));
  assert.deepEqual(corpusV2.properties.observation_status.enum, ["observed", "observed-absent", "not-observed"]);
  assert.equal(corpusV2.allOf[0].if.properties.observation_status.const, "observed-absent");
  assert.equal(corpusV2.allOf[0].then.properties.bounded_search_receipt_id.$ref, "#/$defs/recordId");
});

test("complete zero-match search is the only observed-absent construction", () => {
  const receipt = createBoundedSearchReceipt(fixture("zero-match"));
  assert.equal(receipt.status, "complete");
  assert.equal(receipt.semantic.completeness.complete, true);
  assert.equal(receipt.semantic.completeness.match_count, 0);
  assert.equal(receipt.semantic.observation_status, "observed-absent");
  assert.deepEqual(receipt.semantic.failures, []);
  assert.match(receipt.record_id, /^record:sha256:[a-f0-9]{64}$/);
});

test("complete positive search is observed and retains the aggregate match count", () => {
  const receipt = createBoundedSearchReceipt(fixture("one-match"));
  assert.equal(receipt.semantic.observation_status, "observed");
  assert.equal(receipt.semantic.completeness.match_count, 1);
});

test("partial traversal is not-observed and does not expose a match aggregate", () => {
  const receipt = createBoundedSearchReceipt(fixture("incomplete"));
  assert.equal(receipt.status, "defer");
  assert.equal(receipt.semantic.observation_status, "not-observed");
  assert.equal(receipt.semantic.completeness.complete, false);
  assert.equal(receipt.semantic.completeness.match_count, null);
  assert.ok(receipt.semantic.failures.some((failure) => failure.code === "source-unvisited"));
  assert.ok(receipt.semantic.failures.some((failure) => failure.code === "selector-result-missing"));
});

test("every drift and execution-error path remains not-observed", () => {
  const cases = [
    ["extractor drift", (input) => { input.extractor.observed_digest = `sha256:${"f".repeat(64)}`; }, "extractor-digest-mismatch"],
    ["revision drift", (input) => { input.sources[0].observed_revision = "revision-2"; }, "revision-mismatch"],
    ["source drift", (input) => { input.sources[0].observed_file_digest = `sha256:${"b".repeat(64)}`; }, "source-digest-mismatch"],
    ["parse error", (input) => { input.sources[0].parse_status = "error"; }, "parse-error"],
    ["extraction error", (input) => { input.sources[0].extraction_status = "error"; }, "extraction-error"],
    ["moved selector", (input) => { input.outcomes[0].status = "selector-moved"; }, "selector-moved"],
    ["selector error", (input) => { input.outcomes[0].status = "error"; }, "selector-error"],
    ["missing outcome", (input) => { input.outcomes = []; }, "selector-result-missing"],
    ["unexpected outcome", (input) => { input.outcomes.push({ selector_id: "selector-extra", source_id: "source-a", status: "no-match", match_count: 0 }); }, "unexpected-selector"],
  ];
  for (const [label, mutate, code] of cases) {
    const input = fixture("zero-match");
    mutate(input);
    const receipt = createBoundedSearchReceipt(input);
    assert.equal(receipt.semantic.observation_status, "not-observed", label);
    assert.equal(receipt.semantic.completeness.match_count, null, label);
    assert.ok(receipt.semantic.failures.some((failure) => failure.code === code), label);
  }
});

test("empty universes and duplicate declarations fail validation", () => {
  const empty = fixture("zero-match");
  empty.sources = [];
  assert.throws(() => createBoundedSearchReceipt(empty), /non-empty finite universe/);

  const duplicateSelector = fixture("zero-match");
  duplicateSelector.selectors.push(structuredClone(duplicateSelector.selectors[0]));
  assert.throws(() => createBoundedSearchReceipt(duplicateSelector), /duplicate selector_id/);

  const duplicateOutcome = fixture("zero-match");
  duplicateOutcome.outcomes.push(structuredClone(duplicateOutcome.outcomes[0]));
  assert.throws(() => createBoundedSearchReceipt(duplicateOutcome), /duplicate selector_id/);
});

test("declaration order and volatile observation time do not change identity", () => {
  const input = fixture("zero-match");
  input.sources.push({
    ...structuredClone(input.sources[0]),
    source_id: "source-b",
    path: "src/b.ts",
    expected_file_digest: `sha256:${"b".repeat(64)}`,
    observed_file_digest: `sha256:${"b".repeat(64)}`,
  });
  input.selectors.push({ selector_id: "selector-b", source_id: "source-b", locator: "ast:CallExpression[name=bind]" });
  input.outcomes.push({ selector_id: "selector-b", source_id: "source-b", status: "no-match", match_count: 0 });

  const baseline = createBoundedSearchReceipt(input);
  const reordered = structuredClone(input);
  reordered.sources.reverse();
  reordered.selectors.reverse();
  reordered.outcomes.reverse();
  reordered.observed_at = "2030-01-01T00:00:00Z";
  const replay = createBoundedSearchReceipt(reordered);
  assert.equal(replay.content_digest, baseline.content_digest);
  assert.equal(replay.record_id, baseline.record_id);
  assert.equal(replay.generation_id, baseline.generation_id);
});
