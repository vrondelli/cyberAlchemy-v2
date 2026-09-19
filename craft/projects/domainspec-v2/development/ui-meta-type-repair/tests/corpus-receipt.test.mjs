import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCorpusFactReceipt, createReviewerProjection, rawSha256 } from "../evidence/corpus-receipt.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function specFor(sourceText, overrides = {}) {
  const excerpt = sourceText.split("\n").slice(1, 3).join("\n") + "\n";
  return {
    corpus_id: "fixture-corpus",
    implementation_style: "fixture-style",
    source: {
      repository: ".",
      revision: "revision-1",
      path: "fixture.txt",
      file_digest: rawSha256(sourceText),
    },
    selector: {
      kind: "line-range",
      start_line: 2,
      end_line: 3,
      anchor: "ANCHOR",
      excerpt_digest: rawSha256(excerpt),
    },
    literal_facts: [{ fact_id: "token-a", token: "TOKEN" }],
    ...overrides,
  };
}

test("observed corpus facts retain literal provenance without projections", () => {
  const sourceText = "header\nANCHOR\nTOKEN\ntail\n";
  const receipt = createCorpusFactReceipt(specFor(sourceText), { sourceText, actualRevision: "revision-1" });
  assert.equal(receipt.semantic.observation_status, "observed");
  assert.deepEqual(receipt.semantic.literal_observations.map((fact) => fact.value), [true]);
  assert.equal(Object.hasOwn(receipt.semantic, "candidate_ref"), false);
  assert.equal(receipt.semantic.omissions.length, 0);
});

test("a changed source digest yields not-observed rather than an absence claim", () => {
  const pinned = "header\nANCHOR\nTOKEN\ntail\n";
  const changed = `${pinned}changed\n`;
  const receipt = createCorpusFactReceipt(specFor(pinned), { sourceText: changed, actualRevision: "revision-1" });
  assert.equal(receipt.semantic.observation_status, "not-observed");
  assert.deepEqual(receipt.semantic.omissions.map((entry) => entry.code), ["source-digest-mismatch"]);
  assert.deepEqual(receipt.semantic.literal_observations, []);
});

test("a moved selector is detected under a matching new source digest", () => {
  const original = "header\nANCHOR\nTOKEN\ntail\n";
  const moved = "new-1\nnew-2\nheader\nANCHOR\nTOKEN\ntail\n";
  const spec = specFor(original);
  spec.source.file_digest = rawSha256(moved);
  const receipt = createCorpusFactReceipt(spec, { sourceText: moved, actualRevision: "revision-1" });
  assert.equal(receipt.semantic.observation_status, "not-observed");
  assert.equal(receipt.semantic.omissions[0].code, "selector-moved");
});

test("a missing excerpt is not reworded as absent", () => {
  const original = "header\nANCHOR\nTOKEN\ntail\n";
  const missing = "header\nOTHER\nTOKEN\ntail\n";
  const spec = specFor(original);
  spec.source.file_digest = rawSha256(missing);
  const receipt = createCorpusFactReceipt(spec, { sourceText: missing, actualRevision: "revision-1" });
  assert.equal(receipt.semantic.observation_status, "not-observed");
  assert.equal(receipt.semantic.omissions[0].code, "excerpt-missing");
  assert.ok(receipt.semantic.prohibited_inferences.includes("not-observed-does-not-mean-absent"));
});

test("reviewer projections are separate records and fact specs reject candidate metadata", () => {
  const sourceText = "header\nANCHOR\nTOKEN\ntail\n";
  assert.throws(
    () => createCorpusFactReceipt({ ...specFor(sourceText), candidate_id: "DS-D1.20" }, { sourceText, actualRevision: "revision-1" }),
    /candidate_id is prohibited/,
  );
  const fact = createCorpusFactReceipt(specFor(sourceText), { sourceText, actualRevision: "revision-1" });
  const projection = createReviewerProjection({
    corpus_receipt_id: fact.record_id,
    reviewer: "reviewer:test",
    candidate_ref: "DS-D1.20",
    projection_status: "disputed",
    statement: "Candidate correspondence remains disputed.",
  });
  assert.equal(projection.semantic.corpus_receipt_id, fact.record_id);
  assert.notEqual(projection.contract_id, fact.contract_id);
});

test("pinned generation covers two styles, preserves not-observed, and replays immutably", () => {
  const outDir = mkdtempSync(resolve(tmpdir(), "uir-corpus-"));
  try {
    const command = [resolve(root, "evidence/build-corpus-generation.mjs"), "--out-dir", outDir];
    const first = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published 5 corpus facts and 2 separate reviewer projections/);
    const target = resolve(outDir, "receipts.json");
    const before = readFileSync(target, "utf8");
    const result = JSON.parse(before);
    assert.equal(result.summary.implementation_style_count, 2);
    assert.equal(result.summary.observed, 4);
    assert.equal(result.summary.not_observed, 1);
    assert.equal(result.facts.find((entry) => entry.entry_id === "savvy-display-role-not-observed").receipt.semantic.omissions[0].code, "excerpt-missing");
    assert.ok(result.facts.every((entry) => !Object.hasOwn(entry.receipt.semantic, "candidate_ref")));

    const second = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /NO-OP: immutable corpus generation/);
    assert.equal(readFileSync(target, "utf8"), before);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
