import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {packageRoot} from "../src/common.mjs";
import {runExternalRetrievalBenchmark} from "../src/external-retrieval.mjs";

const profile = JSON.parse(readFileSync(resolve(packageRoot, "profile.json"), "utf8"));
const dataset = resolve(packageRoot, "fixtures/agent-retrieval-bench/samples.jsonl");
const predictions = resolve(packageRoot, "fixtures/agent-retrieval-bench/predictions.jsonl");

function options(overrides = {}) {
  return {dataset, predictions, dataset_id: "arb-fixture", dataset_revision: "fixture-v1", ...overrides};
}

test("scores ranking, token-budget coverage, and abstention deterministically", () => {
  const first = runExternalRetrievalBenchmark(profile, options());
  const second = runExternalRetrievalBenchmark(profile, options());
  assert.equal(first.status, "PASS");
  assert.deepEqual(first, second);
  assert.equal(first.summary.metrics.mrr, 1);
  assert.equal(first.summary.metrics.recall_at_k, 1);
  assert.equal(first.summary.metrics.bcy_at_budget, 1);
  assert.equal(first.summary.metrics.correct_abstention_rate, 1);
  assert.equal(first.external_binding.token_counts, "prediction-observed-not-inferred");
  assert.match(first.external_binding.dataset_sha256, /^[0-9a-f]{64}$/);
});

test("does not count a gold file when the hard budget includes only its header", () => {
  const result = runExternalRetrievalBenchmark(profile, options({token_budget: 3}));
  const first = result.cases.external_retrieval[0];
  assert.equal(first.used_tokens, 3);
  assert.equal(first.partial_files, 1);
  assert.equal(first.bcy, 0);
  assert.deepEqual(first.covered_gold_files, []);
});

test("scores false abstention and unnecessary retrieval as selective failures", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "are-arb-selective-"));
  const changed = resolve(dir, "predictions.jsonl");
  const rows = readFileSync(predictions, "utf8").trim().split("\n").map(JSON.parse);
  rows[0] = {...rows[0], decision: "abstain", ranked_files: []};
  rows[3] = {...rows[3], decision: "retrieve", ranked_files: [{path: "README.md", header_tokens: 2, content_tokens: 10}]};
  writeFileSync(changed, `${rows.map(JSON.stringify).join("\n")}\n`);
  const result = runExternalRetrievalBenchmark(profile, options({predictions: changed}));
  assert.equal(result.status, "FAIL");
  assert.equal(result.summary.metrics.false_abstention_rate, 1 / 3);
  assert.equal(result.summary.metrics.correct_abstention_rate, 0);
  assert.equal(result.cases.external_retrieval[0].selective_success, false);
  assert.equal(result.cases.external_retrieval[3].unnecessary_retrieval, true);
});

test("rejects predictions outside the exact dataset", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "are-arb-extra-"));
  const changed = resolve(dir, "predictions.jsonl");
  const content = readFileSync(predictions, "utf8").trim();
  const extra = {schema_version: "are.external-retrieval-prediction/v1", sample_id: "unknown", repo: "fixture/repo", base_commit: "fixture-commit", decision: "abstain", ranked_files: []};
  writeFileSync(changed, `${content}\n${JSON.stringify(extra)}\n`);
  assert.throws(() => runExternalRetrievalBenchmark(profile, options({predictions: changed})), /Unexpected predictions/);
});

test("requires an explicit dataset identity and revision", () => {
  assert.throws(() => runExternalRetrievalBenchmark(profile, options({dataset_id: ""})), /identity and revision are required/);
  assert.throws(() => runExternalRetrievalBenchmark(profile, options({dataset_revision: ""})), /identity and revision are required/);
});

test("fails quality when a prediction is missing without silently dropping the sample", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "are-arb-missing-"));
  const incomplete = resolve(dir, "predictions.jsonl");
  const lines = readFileSync(predictions, "utf8").trim().split("\n");
  writeFileSync(incomplete, `${lines.slice(0, -1).join("\n")}\n`);
  const result = runExternalRetrievalBenchmark(profile, options({predictions: incomplete}));
  assert.equal(result.status, "FAIL");
  assert.equal(result.summary.metrics.missing_predictions, 1);
  assert.equal(result.cases.external_retrieval.length, 4);
});

test("rejects repository drift and inferred token counts", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "are-arb-invalid-"));
  const drifted = resolve(dir, "drifted.jsonl");
  const first = JSON.parse(readFileSync(predictions, "utf8").split("\n")[0]);
  writeFileSync(drifted, `${JSON.stringify({...first, base_commit: "different"})}\n`);
  assert.throws(() => runExternalRetrievalBenchmark(profile, options({predictions: drifted})), /repository binding mismatch/);

  const noTokens = resolve(dir, "no-tokens.jsonl");
  writeFileSync(noTokens, `${JSON.stringify({...first, ranked_files: [{path: "test/session.test.mjs"}]})}\n`);
  assert.throws(() => runExternalRetrievalBenchmark(profile, options({predictions: noTokens})), /requires observed token counts/);
});
