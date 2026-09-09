import assert from "node:assert/strict";
import {cpSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {packageRoot} from "../src/common.mjs";
import {runExternalRetrievalBenchmark} from "../src/external-retrieval.mjs";
import {produceExternalRetrievalPredictions} from "../src/external-retrieval-producer.mjs";

const profile = JSON.parse(readFileSync(resolve(packageRoot, "profile.json"), "utf8"));
const dataset = resolve(packageRoot, "fixtures/agent-retrieval-bench/samples.jsonl");
const corpus = resolve(packageRoot, "fixtures/agent-retrieval-bench/corpus");

function options(overrides = {}) {
  return {dataset, corpus_dir: corpus, dataset_id: "arb-fixture", dataset_revision: "fixture-v1", ...overrides};
}

test("produces deterministic exact-bound predictions and scores them end to end", () => {
  const first = produceExternalRetrievalPredictions(profile, options());
  const second = produceExternalRetrievalPredictions(profile, options());
  assert.deepEqual(first, second);
  assert.equal(first.receipt.samples, 4);
  assert.equal(first.receipt.retrieved, 3);
  assert.equal(first.receipt.abstained, 1);
  assert.equal(first.receipt.selected_snapshot_count, 4);
  assert.equal(first.receipt.gold_access, "forbidden-and-unused");
  assert.equal(first.predictions[0].ranked_files[0].path, "test/session.test.mjs");
  assert.equal(first.predictions[1].ranked_files[0].path, "src/session-store.mjs");
  assert.deepEqual(first.predictions[2].ranked_files.slice(0, 2).map((row) => row.path).sort(), ["src/profile.mjs", "test/router.test.mjs"]);
  assert.equal(first.predictions[3].decision, "abstain");
  assert.ok(first.predictions.every((prediction) => prediction.ranked_files.length <= profile.external_retrieval.producer.maximum_ranked_files));
  const scored = runExternalRetrievalBenchmark(profile, {...options(), prediction_bytes: first.prediction_bytes});
  assert.equal(scored.status, "PASS");
  assert.equal(scored.external_binding.predictions_sha256, first.receipt.predictions_sha256);
});

test("gold-label changes cannot influence prediction bytes", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-arb-no-gold-leak-"));
  const changedDataset = resolve(directory, "samples.jsonl");
  const rows = readFileSync(dataset, "utf8").trim().split("\n").map(JSON.parse);
  for (const row of rows) row.gold = {files: ["invented/label.txt"]};
  writeFileSync(changedDataset, `${rows.map(JSON.stringify).join("\n")}\n`);
  const original = produceExternalRetrievalPredictions(profile, options());
  const changed = produceExternalRetrievalPredictions(profile, options({dataset: changedDataset}));
  assert.equal(original.prediction_bytes.toString("utf8"), changed.prediction_bytes.toString("utf8"));
  assert.notEqual(original.receipt.dataset_sha256, changed.receipt.dataset_sha256);
});

test("corpus row permutation preserves ranking while changing source evidence", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-arb-corpus-order-"));
  cpSync(corpus, directory, {recursive: true});
  const chunkPath = resolve(directory, "beta-333.chunks.jsonl");
  const rows = readFileSync(chunkPath, "utf8").trim().split("\n").reverse();
  writeFileSync(chunkPath, `${rows.join("\n")}\n`);
  const original = produceExternalRetrievalPredictions(profile, options());
  const permuted = produceExternalRetrievalPredictions(profile, options({corpus_dir: directory}));
  assert.equal(original.prediction_bytes.toString("utf8"), permuted.prediction_bytes.toString("utf8"));
  assert.notEqual(original.receipt.selected_dependencies_sha256, permuted.receipt.selected_dependencies_sha256);
});

test("missing, escaping, and drifted corpus dependencies block", () => {
  const missingRoot = mkdtempSync(resolve(tmpdir(), "are-arb-missing-corpus-"));
  writeFileSync(resolve(missingRoot, "corpus_manifest.jsonl"), "");
  assert.throws(() => produceExternalRetrievalPredictions(profile, options({corpus_dir: missingRoot})), /missing exact corpus snapshot/);

  const escapingRoot = mkdtempSync(resolve(tmpdir(), "are-arb-escaping-corpus-"));
  writeFileSync(resolve(escapingRoot, "corpus_manifest.jsonl"), `${JSON.stringify({repo: "example/alpha", base_commit: "1111111111111111111111111111111111111111", status: "ok", chunks_path: "../outside.jsonl"})}\n`);
  assert.throws(() => produceExternalRetrievalPredictions(profile, options({corpus_dir: escapingRoot})), /escapes corpus directory/);

  const driftRoot = mkdtempSync(resolve(tmpdir(), "are-arb-drifted-corpus-"));
  cpSync(corpus, driftRoot, {recursive: true});
  const chunkPath = resolve(driftRoot, "alpha-111.chunks.jsonl");
  const chunks = readFileSync(chunkPath, "utf8").trim().split("\n").map(JSON.parse);
  chunks[0].repo = "other/repository";
  writeFileSync(chunkPath, `${chunks.map(JSON.stringify).join("\n")}\n`);
  assert.throws(() => produceExternalRetrievalPredictions(profile, options({corpus_dir: driftRoot})), /corpus binding mismatch/);
});

test("ambiguous weak evidence abstains instead of emitting an arbitrary ranking", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-arb-weak-query-"));
  const weakDataset = resolve(directory, "samples.jsonl");
  const sample = {id: "weak", repo: "example/beta", base_commit: "4444444444444444444444444444444444444444", task_type: "comment2context", query: {text: "unrelated external behavior"}, gold: {no_gold: true, files: []}};
  writeFileSync(weakDataset, `${JSON.stringify(sample)}\n`);
  const result = produceExternalRetrievalPredictions(profile, options({dataset: weakDataset}));
  assert.equal(result.predictions[0].decision, "abstain");
  assert.deepEqual(result.predictions[0].ranked_files, []);
});
