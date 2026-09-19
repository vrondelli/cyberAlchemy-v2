import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  normalizeCorpusA,
  publishCorpusAGeneration,
} from "../experiments/form/corpora/corpus-a/normalize-corpus-a.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = resolve(root, "../../../..");
const base = "experiments/form/corpora/corpus-a";
const manifest = read(`${base}/manifest.json`);
const sourceGeneration = readRepo("projects/domainspec-v2/development/ui-meta-type-repair/evidence/results/corpus/generation-002/receipts.json");
const policyInput = readRepo("projects/domainspec-v2/development/ui-meta-type-repair/fixtures/contracts/dossier-policy-current.json");
const literal = read(`${base}/literal-facts.json`);
const authorship = read(`${base}/authorship-style.json`);
const projection = read(`${base}/candidate-projection.json`);
const generation = read(`${base}/generation-001/attestation.json`);

test("manifest and Body War source bytes match every pinned digest", () => {
  for (const pin of manifest.source_pins) assert.equal(digest(resolve(repo, pin.path)), pin.digest, pin.id);
  for (const entry of manifest.receipt_entries) assert.equal(digest(resolve(repo, entry.path)), entry.file_digest, entry.entry_id);
});

test("literal plane preserves exactly two Form receipts without reviewer or Action projection", () => {
  assert.equal(literal.sources.length, 2);
  assert.deepEqual(literal.sources.map((entry) => entry.record_id).sort(), manifest.receipt_entries.map((entry) => entry.record_id).sort());
  assert.ok(literal.sources.every((entry) => entry.observation_status === "observed" && entry.omissions.length === 0));
  assert.deepEqual(literal.reviewer_projection_handles, []);
  assert.deepEqual(literal.action_candidate_handles, []);
  assert.ok(!JSON.stringify(literal).includes("record:sha256:d1cbe05da6bd385d57260efdd966e5ab573334193b6ffd5269d96ba6e9cff7ce"));
});

test("authorship and style count as one corpus, one author, and one style only", () => {
  assert.equal(authorship.corpus_id, "body-war");
  assert.equal(authorship.author_id, "author:body-war");
  assert.equal(authorship.implementation_style, "static-dom-javascript");
  assert.deepEqual(
    { corpora: authorship.corpus_count, authors: authorship.independent_author_count, styles: authorship.implementation_style_count },
    { corpora: 1, authors: 1, styles: 1 },
  );
  assert.equal(authorship.attestation_class, "accepted-policy-identity");
  assert.equal(authorship.independence_scope, "corpus-a-only");
});

test("candidate projection is partial, separate, and never an identity witness", () => {
  assert.equal(projection.candidate_id, "DS-D1.20");
  assert.equal(projection.correspondence, "partial");
  assert.equal(projection.mappings.length, 6);
  assert.ok(projection.mappings.every((entry) => entry.identity_witness === false));
  assert.deepEqual(projection.missing_candidate_obligations, ["complete-typed-fields", "error_contract", "error_mapping", "semantic-target-interface"]);
  assert.equal(projection.evidence_role, "candidate-projection-not-literal-fact");
});

test("generation replays exactly and remains insufficient for portability", () => {
  const normalized = normalizeCorpusA({ manifest, sourceGeneration, policyInput });
  assert.deepEqual(normalized.literal, literal);
  assert.deepEqual(normalized.authorship, authorship);
  assert.deepEqual(normalized.projection, projection);
  assert.deepEqual(normalized.generation, generation);
  assert.equal(generation.semantic.portability_state, "insufficient");
  assert.deepEqual(generation.semantic.observed_counts, { real_corpora: 1, independent_authors: 1, implementation_styles: 1 });
  assert.deepEqual(generation.semantic.required_counts, { real_corpora: 2, independent_authors: 2, implementation_styles: 2 });
  assert.equal(generation.status, "defer");
});

test("source drift, receipt aliasing, and reviewer substitution fail closed", () => {
  const drift = structuredClone(sourceGeneration);
  drift.facts.find((entry) => entry.entry_id === "body-war-form-source").receipt.semantic.source.file_digest = `sha256:${"f".repeat(64)}`;
  assert.throws(() => normalizeCorpusA({ manifest, sourceGeneration: drift, policyInput }), /source path or digest drift/);

  const alias = structuredClone(policyInput);
  const form = alias.candidates.find((entry) => entry.candidate_id === "DS-D1.20");
  form.evidence.push({ ...structuredClone(form.evidence[0]), corpus_id: "body-war-alias" });
  assert.throws(() => normalizeCorpusA({ manifest, sourceGeneration, policyInput: alias }), /missing or ambiguous/);

  const reviewer = structuredClone(manifest);
  reviewer.receipt_entries[0].entry_id = "reviewer-projection";
  reviewer.receipt_entries[0].record_id = "record:sha256:d1cbe05da6bd385d57260efdd966e5ab573334193b6ffd5269d96ba6e9cff7ce";
  assert.throws(() => normalizeCorpusA({ manifest: reviewer, sourceGeneration, policyInput }), /missing pinned corpus receipt/);
});

test("corpus A publishing is immutable", () => {
  const temp = mkdtempSync(join(tmpdir(), "ucfe-form-corpus-a-"));
  try {
    const target = join(temp, "attestation.json");
    assert.equal(publishCorpusAGeneration(generation, target).status, "published");
    assert.equal(publishCorpusAGeneration(normalizeCorpusA({ manifest, sourceGeneration, policyInput }).generation, target).status, "no-op");
    const changed = structuredClone(generation);
    changed.semantic.portability_state = "pass";
    assert.throws(() => publishCorpusAGeneration(changed, target), /refusing to overwrite non-identical corpus A generation/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

function read(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function readRepo(path) {
  return JSON.parse(readFileSync(resolve(repo, path), "utf8"));
}

function digest(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}
