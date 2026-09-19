import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCandidateRun, publishCandidateRun } from "../evidence/candidate-run.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = resolve(root, "../../../..");
const preregistration = parse("experiments/form/preregistration.yml");
const alternatives = parse("experiments/form/alternatives.yml");
const manifest = parse("experiments/form/run-manifest.json");

test("all preregistration source pins match current bytes", () => {
  for (const pin of preregistration.source_pins) {
    assert.equal(digest(resolve(repo, pin.path)), pin.digest, pin.role);
  }
});

test("Form law, policy, corpus A, and missing external gates are pinned", () => {
  assert.equal(preregistration.candidate.id, "DS-D1.20");
  assert.match(preregistration.candidate.law_version, /^sha256:[a-f0-9]{64}$/);
  assert.equal(preregistration.policy.id, "DEC-UIR-008/009-v1");
  assert.equal(preregistration.experiment_matrix.corpus_a.id, "body-war");
  assert.equal(preregistration.experiment_matrix.corpus_a.availability, "pinned-input");
  assert.equal(preregistration.experiment_matrix.corpus_b.availability, "missing");
  assert.equal(preregistration.experiment_matrix.reviewers.availability, "missing");
  assert.equal(preregistration.requested_disposition, null);
});

test("three coverage alternatives and one distinct hypothesis are complete", () => {
  assert.equal(alternatives.coverage_alternatives.length, 3);
  assert.equal(alternatives.distinct_hypothesis.id, "distinct-form-law");
  for (const entry of [...alternatives.coverage_alternatives, alternatives.distinct_hypothesis]) {
    for (const field of ["expected_positives", "expected_negatives", "expected_consequences", "falsifiers"]) {
      assert.ok(Array.isArray(entry[field]) && entry[field].length > 0, `${entry.id}.${field}`);
    }
  }
  assert.deepEqual(
    preregistration.alternatives.map((entry) => entry.id),
    alternatives.coverage_alternatives.map((entry) => entry.id),
  );
});

test("signature pins match exact current DS-D8 rows without wildcarding", () => {
  const authority = JSON.parse(readFileSync(resolve(repo, "projects/domainspec-v2/definitions/relationships/relationships.yml"), "utf8"));
  for (const pin of alternatives.signature_pins) {
    assert.notEqual(pin.id, "*");
    const row = authority.signatures.find((entry) => entry.id === pin.id);
    assert.ok(row, pin.id);
    assert.equal(row.status, pin.status, pin.id);
    assert.equal(row.source_type, pin.source, pin.id);
    if (pin.target) assert.equal(row.target_type, pin.target, pin.id);
    if (pin.targets) assert.deepEqual(row.target_types, pin.targets, pin.id);
  }
  assert.equal(alternatives.signature_pins.find((entry) => entry.id === "submits").endpoint_formation_authority, "not-implied");
});

test("backend and UI candidate handles remain explicitly different", () => {
  const registry = readFileSync(resolve(repo, "projects/domainspec-v2/definitions/meta-types/meta-types.yml"), "utf8");
  for (const [id, term] of [["DS-D1.4", "Operation"], ["DS-D1.7", "Rule"], ["DS-D1.11", "Interface"], ["DS-D1.13", "Mapping"]]) {
    assert.match(registry, new RegExp(`id: ${id}\\n    term: ${term}`));
  }
  assert.match(registry, /status: formation-deferred/);
  assert.match(registry, /endpoint use is evidence pressure and does not create DS-D1 formation authority/);
  assert.ok(alternatives.coverage_alternatives.flatMap((entry) => entry.member_handles).includes("DS-D1.17:Component:candidate"));
  assert.ok(alternatives.coverage_alternatives.flatMap((entry) => entry.member_handles).includes("DS-D1.21:Action:candidate"));
});

test("preregistration contains no result, score, authority mutation, or label witness", () => {
  const forbidden = new Set(["outcome", "result", "results", "observed_counts", "disposition", "score", "scores", "weight", "weights", "threshold_override", "threshold_overrides", "authority_payload", "authority_mutation"]);
  for (const [path, key] of objectKeys({ preregistration, alternatives })) {
    assert.ok(!forbidden.has(key), `${path}.${key}`);
  }
  assert.equal(alternatives.witness_policy, "labels-and-authored-criteria-prohibited");
  assert.deepEqual(preregistration.evidence.coverage_evaluations, []);
  assert.equal(preregistration.evidence.distinct_evaluation, null);
});

test("generation 001 exactly replays the preregistered candidate run", () => {
  assert.equal(manifest.schema_version, "ucfe.form-run-manifest.v1");
  assert.equal(manifest.generation, "001");
  assert.equal(manifest.status, "preregistered");
  assert.equal(manifest.preregistration.digest, digest(join(root, "experiments/form/preregistration.yml")));
  assert.equal(manifest.alternatives.digest, digest(join(root, "experiments/form/alternatives.yml")));
  const rebuilt = createCandidateRun(preregistration);
  assert.deepEqual(rebuilt, manifest.candidate_run);
  assert.equal(rebuilt.semantic.run_state, "evidence-pending");
  assert.equal(rebuilt.semantic.disposition, null);
});

test("source drift or post-result mutation cannot overwrite generation 001", () => {
  const temp = mkdtempSync(join(tmpdir(), "ucfe-form-prereg-"));
  try {
    const target = join(temp, "run.json");
    assert.equal(publishCandidateRun(manifest.candidate_run, target).status, "published");
    assert.equal(publishCandidateRun(createCandidateRun(preregistration), target).status, "no-op");

    const changedSource = structuredClone(preregistration);
    changedSource.candidate.law_version = `sha256:${"f".repeat(64)}`;
    assert.throws(() => publishCandidateRun(createCandidateRun(changedSource), target), /refusing to overwrite non-identical/);

    const postResult = structuredClone(preregistration);
    postResult.evidence.coverage_evaluations = [{ result: "pass" }];
    assert.throws(() => validateNoResultPayload(postResult), /result payload is prohibited/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

function validateNoResultPayload(value) {
  for (const [path, key] of objectKeys(value)) {
    if (["outcome", "result", "results", "observed_counts", "disposition"].includes(key)) {
      throw new TypeError(`result payload is prohibited at ${path}.${key}`);
    }
  }
  return true;
}

function objectKeys(value, path = "$") {
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((entry, index) => objectKeys(entry, `${path}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) => [[path, key], ...objectKeys(child, `${path}.${key}`)]);
}

function parse(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function digest(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}
