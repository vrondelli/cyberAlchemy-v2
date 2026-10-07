import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {compressHenHints, HEN_HINT_POLICY, verifyCompressedHenHints} from "../index.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const replayPath = resolve(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R7.json");

function record(overrides = {}) {
  return {
    repository_relative_path: "src/example.mjs",
    start_line_inclusive: 10,
    end_line_inclusive: 20,
    content_sha256: "a".repeat(64),
    score_units: 100,
    facet: "task",
    ...overrides,
  };
}

function replayRecords(row) {
  return row.query_results.flatMap((query) => query.hints.map((hint) => ({
    repository_relative_path: hint.path,
    start_line_inclusive: hint.start_line,
    end_line_inclusive: hint.end_line,
    content_sha256: hint.content_sha256,
    score_units: hint.score_units,
    facet: query.facet,
  })));
}

function selectedPaths(result) {
  const pathIndex = result.value.field_order.indexOf("repository_relative_path");
  return new Set(result.value.records.map((entry) => entry[pathIndex]));
}

test("compression is deterministic, compact, and independently verifiable", () => {
  const input = [record(), record({facet: "verification", score_units: 200}), record({repository_relative_path: "src/other.mjs", content_sha256: "b".repeat(64), facet: "verification"})];
  const first = compressHenHints(input);
  const second = compressHenHints(structuredClone(input));
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.value.accounting.omitted_duplicates, 1);
  assert.ok(first.payload_bytes <= HEN_HINT_POLICY.maximum_payload_bytes);
  assert.equal(verifyCompressedHenHints(first.value).ok, true);
});

test("the highest-scoring duplicate wins with a lexical facet tie break", () => {
  const result = compressHenHints([
    record({score_units: 10, facet: "zeta"}),
    record({score_units: 20, facet: "zeta"}),
    record({score_units: 20, facet: "alpha"}),
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.value.records.length, 1);
  assert.equal(result.value.records[0][4], 20);
  assert.equal(result.value.records[0][5], "alpha");
});

test("balanced selection enforces aggregate, per-path, and byte ceilings", () => {
  const input = [];
  for (let index = 0; index < 80; index += 1) input.push(record({
    repository_relative_path: index < 20 ? "src/concentrated.mjs" : `src/${"long-".repeat(30)}${index}.mjs`,
    start_line_inclusive: index + 1,
    end_line_inclusive: index + 1,
    content_sha256: index.toString(16).padStart(64, "0"),
    score_units: 1000 - index,
    facet: `facet-${index % 8}`,
  }));
  const result = compressHenHints(input);
  assert.equal(result.ok, true);
  assert.ok(result.value.records.length <= 16);
  assert.ok(result.payload_bytes <= 4096);
  const pathIndex = result.value.field_order.indexOf("repository_relative_path");
  assert.ok(result.value.records.filter((entry) => entry[pathIndex] === "src/concentrated.mjs").length <= 4);
  assert.ok(result.value.accounting.omitted_per_path > 0);
  assert.ok(result.value.accounting.omitted_byte_limit > 0);
});

test("closed records reject unsafe paths, unknown fields, invalid spans, and invalid hashes", () => {
  for (const candidate of [
    record({repository_relative_path: "../escape"}),
    {...record(), excerpt: "forbidden"},
    record({start_line_inclusive: 5, end_line_inclusive: 4}),
    record({content_sha256: "not-a-hash"}),
  ]) assert.equal(compressHenHints([candidate]).ok, false);
});

test("R7 offline replay retains a balanced seven of nine previously missing labeled paths without labels in selection", () => {
  const replay = JSON.parse(readFileSync(replayPath, "utf8"));
  let retained = 0;
  let missing = 0;
  for (const row of replay.rows) {
    const result = compressHenHints(replayRecords(row));
    assert.equal(result.ok, true);
    assert.equal(result.value.records.length, 16);
    assert.equal(new Set(result.value.records.map((entry) => entry[5])).size >= 7, true);
    assert.ok(result.payload_bytes <= 4096);
    const paths = selectedPaths(result);
    retained += row.labeled_unvisited_paths.filter((path) => paths.has(path)).length;
    missing += row.labeled_unvisited_paths.length;
  }
  assert.deepEqual({retained, missing}, {retained: 7, missing: 9});
});
