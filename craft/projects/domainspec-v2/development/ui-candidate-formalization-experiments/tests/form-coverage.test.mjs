import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  COVERAGE_DIMENSIONS,
  evaluateCoverage,
  publishCoverageResult,
} from "../experiments/form/coverage/evaluate-coverage.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const repo = resolve(root, "../../../..");
const manifest = read("experiments/form/coverage/manifest.json");
const requirements = read(manifest.requirements.path);
const alternatives = manifest.alternative_fixtures.map((entry) => read(entry.path));
const published = read("experiments/form/coverage/results/generation-001/result.json");

test("coverage source, fixture, and evaluator pins match current bytes", () => {
  for (const pin of manifest.source_pins) assert.equal(digest(resolve(repo, pin.path)), pin.digest, pin.id);
  assert.equal(digest(join(root, manifest.requirements.path)), manifest.requirements.digest);
  for (const fixture of manifest.alternative_fixtures) assert.equal(digest(join(root, fixture.path)), fixture.digest, fixture.id);
  assert.equal(digest(join(root, manifest.evaluator.path)), manifest.evaluator.digest);
});

test("generation 001 deterministically replays and opens only the distinct evidence route", () => {
  const evaluated = evaluateCoverage({ manifest, requirements, alternatives });
  assert.deepEqual(evaluated, published);
  assert.equal(evaluated.semantic.branch_result, "distinct-route-open");
  assert.equal(evaluated.semantic.distinct_support, false);
  assert.equal(evaluated.semantic.covered_alternative_id, null);
  assert.equal(evaluated.status, "complete");
});

test("every alternative has six complete typed dimensions and no coverage pass", () => {
  assert.equal(published.semantic.evaluations.length, 3);
  for (const evaluation of published.semantic.evaluations) {
    assert.deepEqual(Object.keys(evaluation.dimensions), COVERAGE_DIMENSIONS);
    assert.equal(evaluation.outcome, "fail", evaluation.alternative_id);
    for (const [dimension, entry] of Object.entries(evaluation.dimensions)) {
      assert.equal(entry.state, "fail", `${evaluation.alternative_id}.${dimension}`);
      assert.ok(entry.evidence_handles.length > 0);
      assert.ok(entry.missing_items.length > 0);
    }
    assert.ok(evaluation.dimensions.consequence_parity.missing_items.length > 0);
  }
});

test("partial dimensions cannot be pooled across alternatives", () => {
  const split = structuredClone(alternatives);
  for (const dimension of COVERAGE_DIMENSIONS) {
    const required = requirements.dimensions[dimension].required_items;
    split[0].dimensions[dimension].provided_items = required.filter((_, index) => index % 2 === 0);
    split[1].dimensions[dimension].provided_items = required.filter((_, index) => index % 2 === 1);
    split[2].dimensions[dimension].provided_items = [];
    assert.deepEqual(
      [...new Set([...split[0].dimensions[dimension].provided_items, ...split[1].dimensions[dimension].provided_items])].sort(),
      [...required].sort(),
    );
  }
  const result = evaluateCoverage({ manifest, requirements, alternatives: split });
  assert.equal(result.semantic.branch_result, "distinct-route-open");
  assert.ok(result.semantic.evaluations.every((entry) => entry.outcome === "fail"));
});

test("one six-of-six alternative yields covered-existing", () => {
  const covered = structuredClone(alternatives);
  for (const dimension of COVERAGE_DIMENSIONS) {
    covered[0].dimensions[dimension].provided_items = [...requirements.dimensions[dimension].required_items];
  }
  const result = evaluateCoverage({ manifest, requirements, alternatives: covered });
  assert.equal(result.semantic.branch_result, "covered-existing");
  assert.equal(result.semantic.covered_alternative_id, covered[0].alternative_id);
  assert.equal(result.semantic.distinct_support, false);
});

test("incomplete or ambiguous coverage defers rather than collapsing", () => {
  const incomplete = structuredClone(alternatives);
  incomplete[0].dimensions.no_loss_audit.audit_complete = false;
  let result = evaluateCoverage({ manifest, requirements, alternatives: incomplete });
  assert.equal(result.semantic.branch_result, "defer-missing");
  assert.deepEqual(result.semantic.branch_issues, ["incomplete-coverage-dimension"]);

  const multiple = structuredClone(alternatives);
  for (const alternative of multiple.slice(0, 2)) {
    for (const dimension of COVERAGE_DIMENSIONS) alternative.dimensions[dimension].provided_items = [...requirements.dimensions[dimension].required_items];
  }
  result = evaluateCoverage({ manifest, requirements, alternatives: multiple });
  assert.equal(result.semantic.branch_result, "defer-missing");
  assert.deepEqual(result.semantic.branch_issues, ["multiple-complete-coverage-alternatives-require-owner-resolution"]);
});

test("wildcard edges, label witnesses, and cross-candidate fixtures reject", () => {
  const wildcard = structuredClone(alternatives);
  wildcard[0].dimensions.composition_parity.provided_items.push("*");
  assert.throws(() => evaluateCoverage({ manifest, requirements, alternatives: wildcard }), /wildcard edge is prohibited/);

  const label = structuredClone(alternatives);
  label[0].dimensions.valid_instance_preservation.evidence_handles.push("label:Form");
  assert.throws(() => evaluateCoverage({ manifest, requirements, alternatives: label }), /label-derived witness is prohibited/);

  const crossCandidate = structuredClone(alternatives);
  crossCandidate[0].candidate_id = "DS-D1.21";
  assert.throws(() => evaluateCoverage({ manifest, requirements, alternatives: crossCandidate }), /cross-candidate coverage is prohibited/);
});

test("coverage result publishing is immutable", () => {
  const temp = mkdtempSync(join(tmpdir(), "ucfe-form-coverage-"));
  try {
    const target = join(temp, "result.json");
    assert.equal(publishCoverageResult(published, target).status, "published");
    assert.equal(publishCoverageResult(evaluateCoverage({ manifest, requirements, alternatives }), target).status, "no-op");
    const changed = structuredClone(published);
    changed.semantic.branch_result = "covered-existing";
    assert.throws(() => publishCoverageResult(changed, target), /refusing to overwrite non-identical coverage generation/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

function read(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function digest(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}
