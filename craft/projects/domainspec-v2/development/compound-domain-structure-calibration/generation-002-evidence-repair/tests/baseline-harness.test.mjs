import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateEnvelope } from "../../evaluation/canonical-json.mjs";
import { validateHarnessManifest, verifyProtectedGeneration } from "../runtime/validate-generation-002.mjs";
import { compareObservables, harnessDigest, runBaseline } from "../harness/baseline/run-vectors.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parent = resolve(root, "..");
const repo = resolve(parent, "../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const manifest = readJson("fixtures/generation-002/harness-manifest.json");
const witness = readJson("evidence/generation-002/baseline-equivalence/receipt.json");

test("harness manifest validates and pins live source slices", () => {
  assert.equal(validateHarnessManifest(manifest), true);
  for (const source of manifest.semantic.source_selectors) {
    const lines = readFileSync(resolve(repo, source.path), "utf8").replace(/\r\n?/g, "\n").split("\n");
    const selected = source.ranges.flatMap(([start, end]) => lines.slice(start - 1, end));
    const digest = `sha256:${createHash("sha256").update(`${selected.join("\n")}\n`, "utf8").digest("hex")}`;
    assert.equal(digest, source.digest, source.path);
  }
});

test("harness descriptor matches the frozen harness digest", () => {
  assert.equal(harnessDigest(), manifest.semantic.harness_digest);
});

test("all baseline vectors are total, deterministic, and equivalent", () => {
  const first = runBaseline(manifest.semantic.baseline_vectors);
  const second = runBaseline(structuredClone(manifest.semantic.baseline_vectors));
  assert.deepEqual(first, second);
  assert.equal(first.length, 7);
  assert.ok(first.every((result) => compareObservables(result.expected, result.actual)));
});

test("baseline witness is a valid immutable generic experiment envelope", () => {
  assert.equal(validateEnvelope(witness, { schemaVersion: "cdsc.experiment-envelope.v1", contractId: "cdsc.baseline-witness" }), true);
  assert.equal(witness.status, "complete");
  assert.equal(witness.semantic.manifest_handle, manifest.record_id);
  assert.equal(witness.semantic.harness_handle, manifest.semantic.harness_digest);
  assert.equal(witness.semantic.equivalent, true);
  assert.equal(witness.semantic.vector_results.length, manifest.semantic.baseline_vectors.length);
  assert.ok(witness.semantic.vector_results.every((result) => result.comparison === "match"));
});

test("generation 1 remains protected before mutation execution", () => {
  assert.equal(verifyProtectedGeneration(parent, readJson("fixtures/contracts/generation-001-protected-files.json")), true);
});
