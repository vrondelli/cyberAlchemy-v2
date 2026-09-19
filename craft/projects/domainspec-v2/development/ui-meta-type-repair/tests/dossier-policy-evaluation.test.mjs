import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createDossierPolicyEvaluation } from "../evidence/dossier-policy-evaluation.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(join(root, "fixtures/contracts/dossier-policy-current.json"), "utf8"));
const builder = join(root, "evidence/build-dossier-policy-generation.mjs");

test("current policy evaluates all nine candidates below threshold and records Form/Action missing", () => {
  const result = createDossierPolicyEvaluation(fixture);
  assert.equal(result.semantic.candidate_evaluations.length, 9);
  assert.ok(result.semantic.candidate_evaluations.every((entry) => entry.portability_state === "missing"));
  assert.equal(result.semantic.overall_state, "missing");
  for (const id of ["DS-D1.20", "DS-D1.21"]) {
    assert.equal(result.semantic.candidate_evaluations.find((entry) => entry.candidate_id === id).independent_positive.state, "missing");
  }
  const page = result.semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15");
  assert.deepEqual(page.observed_counts, { real_corpora: 1, independent_authors: 1, implementation_styles: 1, independent_agreeing_reviewers: 1 });
});

test("the exact 2/2/2 boundary passes only with independent authors, styles, and reviewers", () => {
  const input = structuredClone(fixture);
  const candidate = input.candidates.find((entry) => entry.candidate_id === "DS-D1.15");
  candidate.evidence.push({ corpus_id: "second", author_id: "author:second", implementation_style: "static-dom-javascript", correspondence_state: "positive", receipt_handles: [`record:sha256:${"b".repeat(64)}`] });
  candidate.reviewers.push({ reviewer_id: "reviewer:second", role_id: "candidate-correspondence", agreement: true, independence_attested: true, evidence_handle: "review:second" });
  assert.equal(createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15").portability_state, "pass");

  candidate.evidence[1].author_id = "author:savvy";
  assert.equal(createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15").portability_state, "missing");
  candidate.evidence[1].author_id = "author:second";
  candidate.evidence[1].implementation_style = "next-react";
  assert.equal(createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15").portability_state, "missing");
});

test("reviewer role duplication, disagreement, and non-independence cannot inflate counts", () => {
  const input = structuredClone(fixture);
  const page = input.candidates.find((entry) => entry.candidate_id === "DS-D1.15");
  page.reviewers.push({ ...page.reviewers[0], role_id: "applicability" });
  let row = createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15");
  assert.equal(row.observed_counts.independent_agreeing_reviewers, 1);
  page.reviewers.push({ reviewer_id: "reviewer:disagrees", role_id: "candidate-correspondence", agreement: false, independence_attested: true, evidence_handle: "review:disagrees" });
  row = createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15");
  assert.equal(row.observed_counts.independent_agreeing_reviewers, 1);
  page.reviewers.push({ reviewer_id: "reviewer:not-independent", role_id: "candidate-correspondence", agreement: true, independence_attested: false, evidence_handle: "review:not-independent" });
  row = createDossierPolicyEvaluation(input).semantic.candidate_evaluations.find((entry) => entry.candidate_id === "DS-D1.15");
  assert.equal(row.independence_valid, false);
});

test("duplicate corpus aliases, threshold tailoring, and kill-like classifications fail closed", () => {
  const alias = structuredClone(fixture);
  const form = alias.candidates.find((entry) => entry.candidate_id === "DS-D1.20");
  form.evidence.push({ ...structuredClone(form.evidence[0]), corpus_id: "body-war-alias" });
  assert.throws(() => createDossierPolicyEvaluation(alias), /duplicate corpus alias/);

  const tailored = structuredClone(fixture);
  tailored.required_counts.real_corpora = 1;
  assert.throws(() => createDossierPolicyEvaluation(tailored), /threshold tailoring is prohibited/);

  for (const state of ["fail", "absent", "collapsed", "demoted", "kill"]) {
    const forbidden = structuredClone(fixture);
    forbidden.candidates.find((entry) => entry.candidate_id === "DS-D1.20").independent_positive.state = state;
    assert.throws(() => createDossierPolicyEvaluation(forbidden), /prohibited independent-positive classification/);
  }
});

test("builder publishes immutably and rejects non-identical overwrite", () => {
  const temp = mkdtempSync(join(tmpdir(), "uir-dossier-policy-"));
  try {
    const first = spawnSync(process.execPath, [builder, "--out-dir", temp], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published dossier-policy generation with 9\/9 portability states missing/);
    const target = join(temp, "evaluation.json");
    const before = readFileSync(target, "utf8");
    const replay = spawnSync(process.execPath, [builder, "--out-dir", temp], { encoding: "utf8" });
    assert.equal(replay.status, 0, replay.stderr);
    assert.match(replay.stdout, /NO-OP: immutable dossier-policy generation/);
    assert.equal(readFileSync(target, "utf8"), before);
    const changed = JSON.parse(before);
    changed.content_digest = `sha256:${"f".repeat(64)}`;
    writeFileSync(target, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
    const overwrite = spawnSync(process.execPath, [builder, "--out-dir", temp], { encoding: "utf8" });
    assert.notEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /refusing to overwrite non-identical dossier-policy generation/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
