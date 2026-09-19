import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createBoundedSearchReceipt } from "../evidence/bounded-search-receipt.mjs";
import {
  createCorpusFactReceiptV2,
  LITERAL_TOKEN_EXTRACTOR_DIGEST,
} from "../evidence/corpus-receipt-v2.mjs";
import { rawSha256 } from "../evidence/corpus-receipt.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = resolve(root, "../../../..");
const manifest = JSON.parse(readFileSync(join(root, "fixtures/contracts/corpus-manifest.json"), "utf8"));
const absentSpec = manifest.entries.find((entry) => entry.id === "savvy-display-role-not-observed");
const sourcePath = resolve(workspaceRoot, absentSpec.source.repository, absentSpec.source.path);
const sourceText = readFileSync(sourcePath, "utf8");
const predecessorPath = join(root, "evidence/results/corpus/generation-001/receipts.json");
const builder = join(root, "evidence/build-corpus-v2-generation.mjs");

function boundedReceipt(overrides = {}) {
  return createBoundedSearchReceipt({
    search_id: "fixture-corpus-v2-absence",
    universe_complete: true,
    extractor: {
      id: "literal-token-extractor",
      version: "1.0.0",
      expected_digest: LITERAL_TOKEN_EXTRACTOR_DIGEST,
      observed_digest: LITERAL_TOKEN_EXTRACTOR_DIGEST,
    },
    sources: [{
      source_id: "savvy-data-source",
      repository: absentSpec.source.repository,
      path: absentSpec.source.path,
      expected_revision: absentSpec.source.revision,
      observed_revision: absentSpec.source.revision,
      expected_file_digest: absentSpec.source.file_digest,
      observed_file_digest: rawSha256(sourceText),
      visited: true,
      parse_status: "ok",
      extraction_status: "ok",
    }],
    selectors: [{
      selector_id: "display-role-context-token",
      source_id: "savvy-data-source",
      locator: `literal-token:${absentSpec.selector.anchor}`,
    }],
    outcomes: [{
      selector_id: "display-role-context-token",
      source_id: "savvy-data-source",
      status: "no-match",
      match_count: 0,
    }],
    ...overrides,
  });
}

test("aligned complete bounded search promotes only the pinned missing fact to observed-absent", () => {
  const search = boundedReceipt();
  const receipt = createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: absentSpec.source.revision,
    boundedSearchReceipt: search,
  });
  assert.equal(receipt.semantic.observation_status, "observed-absent");
  assert.equal(receipt.semantic.bounded_search_receipt_id, search.record_id);
  assert.deepEqual(receipt.semantic.omissions, []);
  assert.equal(receipt.semantic.literal_observations[0].value, false);
  assert.equal(receipt.predecessor_generation_id.startsWith("generation:sha256:"), true);
});

test("missing proof and changed source revision preserve not-observed", () => {
  const withoutProof = createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: absentSpec.source.revision,
  });
  assert.equal(withoutProof.semantic.observation_status, "not-observed");
  assert.equal(withoutProof.semantic.bounded_search_receipt_id, null);

  const changedRevision = createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: "changed-revision",
    boundedSearchReceipt: boundedReceipt(),
  });
  assert.equal(changedRevision.semantic.observation_status, "not-observed");
  assert.ok(changedRevision.semantic.omissions.some((entry) => entry.code === "revision-mismatch"));
});

test("invalid, mismatched, and positive bounded-search receipts cannot support absence", () => {
  const tampered = boundedReceipt();
  tampered.semantic.search_id = "tampered";
  assert.throws(() => createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: absentSpec.source.revision,
    boundedSearchReceipt: tampered,
  }), /content digest mismatch/);

  const mismatched = boundedReceipt();
  mismatched.semantic.sources[0].path = "other.ts";
  const rebuiltMismatch = createBoundedSearchReceipt({
    search_id: mismatched.semantic.search_id,
    universe_complete: mismatched.semantic.universe_complete,
    extractor: mismatched.semantic.extractor,
    sources: mismatched.semantic.sources,
    selectors: mismatched.semantic.selectors,
    outcomes: mismatched.semantic.outcomes,
  });
  assert.throws(() => createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: absentSpec.source.revision,
    boundedSearchReceipt: rebuiltMismatch,
  }), /does not align/);

  const positive = boundedReceipt({
    outcomes: [{ selector_id: "display-role-context-token", source_id: "savvy-data-source", status: "match", match_count: 1 }],
  });
  assert.throws(() => createCorpusFactReceiptV2(absentSpec, {
    sourceText,
    actualRevision: absentSpec.source.revision,
    boundedSearchReceipt: positive,
  }), /does not prove complete zero-match absence/);
});

test("generation 002 publishes once, binds predecessor and absence handles, then replays as a no-op", () => {
  const temp = mkdtempSync(join(tmpdir(), "uir-corpus-v2-"));
  const outDir = join(temp, "generation-002");
  try {
    const first = runBuilder(["--out-dir", outDir]);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published corpus generation 002 with 5 facts, 1 bounded absence, and 0 not-observed/);
    const target = join(outDir, "receipts.json");
    const before = readFileSync(target, "utf8");
    const result = JSON.parse(before);
    const predecessor = JSON.parse(readFileSync(predecessorPath, "utf8"));
    assert.equal(result.predecessor_generation_id, predecessor.generation_id);
    assert.equal(result.semantic.predecessor_record_id, predecessor.record_id);
    assert.deepEqual(result.summary, {
      fact_count: 5,
      observed: 4,
      observed_absent: 1,
      not_observed: 0,
      bounded_search_receipt_count: 1,
      reviewer_projection_count: 2,
      corpus_count: 2,
      implementation_style_count: 2,
    });
    const absent = result.facts.find((entry) => entry.entry_id === "savvy-display-role-not-observed").receipt;
    assert.ok(result.semantic.bounded_search_handles.includes(absent.semantic.bounded_search_receipt_id));

    const replay = runBuilder(["--out-dir", outDir]);
    assert.equal(replay.status, 0, replay.stderr);
    assert.match(replay.stdout, /NO-OP: immutable corpus generation 002/);
    assert.equal(readFileSync(target, "utf8"), before);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("missing predecessor, partial manifest, generation-001 target, and overwrite attempt fail closed", () => {
  const temp = mkdtempSync(join(tmpdir(), "uir-corpus-v2-fail-"));
  try {
    const missing = runBuilder(["--predecessor", join(temp, "missing.json"), "--out-dir", join(temp, "generation-002")]);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /missing corpus generation 001 predecessor/);

    const partialPath = join(temp, "partial-manifest.json");
    writeFileSync(partialPath, JSON.stringify({ ...manifest, entries: manifest.entries.slice(0, -1) }), "utf8");
    const partial = runBuilder(["--manifest", partialPath, "--out-dir", join(temp, "generation-002")]);
    assert.notEqual(partial.status, 0);
    assert.match(partial.stderr, /partial or divergent corpus manifest/);

    const generation001 = runBuilder(["--out-dir", join(temp, "generation-001")]);
    assert.notEqual(generation001.status, 0);
    assert.match(generation001.stderr, /refusing to write corpus v2 output to generation-001/);

    const outDir = join(temp, "publish", "generation-002");
    const first = runBuilder(["--out-dir", outDir]);
    assert.equal(first.status, 0, first.stderr);
    const target = join(outDir, "receipts.json");
    const changed = JSON.parse(readFileSync(target, "utf8"));
    changed.summary.observed = 999;
    changed.content_digest = `sha256:${"f".repeat(64)}`;
    writeFileSync(target, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
    const overwrite = runBuilder(["--out-dir", outDir]);
    assert.notEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /refusing to overwrite non-identical corpus generation/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("generation 001 bytes remain unchanged", () => {
  const digest = createHash("sha256").update(readFileSync(predecessorPath)).digest("hex");
  assert.equal(digest, "72f49516b741cf31b3f7fb930a67ca9144b43d04a27f0b2031cd231c51bff03f");
});

function runBuilder(args) {
  return spawnSync(process.execPath, [builder, ...args], { encoding: "utf8" });
}
