import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  COVERAGE_DIMENSIONS,
  createCandidateRun,
  DISPOSITIONS,
  publishCandidateRun,
} from "../evidence/candidate-run.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vectors = JSON.parse(readFileSync(join(root, "fixtures/contracts/candidate-run-vectors.json"), "utf8"));

test("candidate-run schemas are closed JSON-compatible YAML contracts", () => {
  for (const name of ["candidate-run.schema.yml", "coverage-evaluation.schema.yml", "candidate-disposition.schema.yml"]) {
    const schema = JSON.parse(readFileSync(join(root, "contracts", name), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.length > 0);
  }
});

test("a complete base contract is evidence-pending and matches golden identity", () => {
  const run = createCandidateRun(base());
  assert.equal(run.status, "valid");
  assert.equal(run.semantic.run_state, "evidence-pending");
  assert.equal(run.semantic.disposition, null);
  assert.deepEqual(
    pick(run, ["content_digest", "record_id", "generation_id"]),
    vectors.golden_identity,
  );
  assert.match(run.content_digest, /^sha256:[a-f0-9]{64}$/);
  assert.match(run.record_id, /^record:sha256:[a-f0-9]{64}$/);
  assert.match(run.generation_id, /^generation:sha256:[a-f0-9]{64}$/);
});

test("the three disposition branches remain distinct and owner-handoff only", () => {
  assert.deepEqual(DISPOSITIONS, ["covered-existing", "distinct-supported", "defer-missing"]);

  const coveredInput = base();
  coveredInput.evidence.coverage_evaluations = [structuredClone(vectors.coverage_pass)];
  coveredInput.requested_disposition = "covered-existing";
  const covered = createCandidateRun(coveredInput);
  assert.equal(covered.semantic.disposition.disposition, "covered-existing");
  assert.equal(covered.semantic.disposition.coverage_alternative_id, "component-fields-submits");

  const distinctInput = base();
  distinctInput.evidence.coverage_evaluations = structuredClone(vectors.coverage_failures);
  distinctInput.evidence.distinct_evaluation = structuredClone(vectors.distinct_pass);
  distinctInput.requested_disposition = "distinct-supported";
  const distinct = createCandidateRun(distinctInput);
  assert.equal(distinct.semantic.disposition.disposition, "distinct-supported");
  assert.equal(distinct.semantic.disposition.coverage_alternative_id, null);

  const deferInput = base();
  deferInput.requested_disposition = "defer-missing";
  deferInput.missing_conjuncts = ["corpus-b", "independent-reviewers"];
  const deferred = createCandidateRun(deferInput);
  assert.equal(deferred.semantic.disposition.disposition, "defer-missing");
  assert.deepEqual(deferred.semantic.disposition.missing_conjuncts, ["corpus-b", "independent-reviewers"]);

  for (const run of [covered, distinct, deferred]) {
    assert.equal(run.semantic.run_state, "disposed");
    assert.equal(run.semantic.disposition.owner_handoff_required, true);
    assert.equal(run.semantic.disposition.authority_mutation, false);
  }
});

test("missing evidence cannot become covered or distinct support", () => {
  for (const disposition of ["covered-existing", "distinct-supported"]) {
    const input = base();
    input.requested_disposition = disposition;
    const run = createCandidateRun(input);
    assert.equal(run.status, "invalid");
    assert.equal(run.semantic.run_state, "invalid");
    assert.equal(run.semantic.disposition, null);
  }
});

test("positive coverage takes precedence over distinct or defer requests", () => {
  for (const disposition of ["distinct-supported", "defer-missing"]) {
    const input = base();
    input.evidence.coverage_evaluations = [structuredClone(vectors.coverage_pass)];
    input.evidence.distinct_evaluation = structuredClone(vectors.distinct_pass);
    input.requested_disposition = disposition;
    input.missing_conjuncts = ["review"];
    const run = createCandidateRun(input);
    assert.equal(run.semantic.run_state, "invalid");
    assert.equal(run.semantic.disposition, null);
    assert.ok(run.semantic.errors.some((entry) => entry.code === "coverage-precedence"));
  }
});

test("coverage requires all six positive dimensions for one named alternative", () => {
  const input = base();
  const evaluation = structuredClone(vectors.coverage_pass);
  delete evaluation.dimensions.no_loss_audit;
  input.evidence.coverage_evaluations = [evaluation];
  input.requested_disposition = "covered-existing";
  const run = createCandidateRun(input);
  assert.equal(run.semantic.disposition, null);
  assert.ok(run.semantic.errors.some((entry) => entry.code === "invalid-coverage-dimension"));
  assert.deepEqual(Object.keys(run.semantic.coverage_evaluations[0].dimensions), COVERAGE_DIMENSIONS);
});

test("malformed matrix fails closed with typed errors and no disposition", () => {
  for (const vector of vectors.malformed_vectors) {
    const input = malformed(base(), vector.id);
    const run = createCandidateRun(input);
    assert.equal(run.semantic.run_state, "invalid", vector.id);
    assert.equal(run.semantic.disposition, null, vector.id);
    assert.ok(run.semantic.errors.some((entry) => entry.code === vector.error_code), `${vector.id}: ${JSON.stringify(run.semantic.errors)}`);
  }
});

test("candidate identity mismatch and cross-candidate coverage cannot be pooled", () => {
  const input = base();
  input.evidence.coverage_evaluations = [structuredClone(vectors.coverage_pass)];
  input.evidence.coverage_evaluations[0].candidate_id = "DS-D1.21";
  input.requested_disposition = "covered-existing";
  const run = createCandidateRun(input);
  assert.equal(run.semantic.disposition, null);
  assert.ok(run.semantic.errors.some((entry) => entry.code === "cross-candidate-evidence"));
});

test("timestamp-only replay is stable while lineage changes generation only", () => {
  const first = createCandidateRun(base());
  const replayInput = base();
  replayInput.created_at = "2030-01-01T00:00:00Z";
  replayInput.storage_path = "/tmp/other";
  const replay = createCandidateRun(replayInput);
  assert.equal(replay.content_digest, first.content_digest);
  assert.equal(replay.record_id, first.record_id);
  assert.equal(replay.generation_id, first.generation_id);

  const successorInput = base();
  successorInput.predecessor_generation_id = first.generation_id;
  const successor = createCandidateRun(successorInput, { currentGenerationId: first.generation_id });
  assert.equal(successor.content_digest, first.content_digest);
  assert.equal(successor.record_id, first.record_id);
  assert.notEqual(successor.generation_id, first.generation_id);

  const stale = createCandidateRun(successorInput, { currentGenerationId: `generation:sha256:${"f".repeat(64)}` });
  assert.equal(stale.semantic.run_state, "invalid");
  assert.ok(stale.semantic.errors.some((entry) => entry.code === "stale-predecessor"));
});

test("publisher replays identical generations and refuses non-identical overwrite", () => {
  const temp = mkdtempSync(join(tmpdir(), "ucfe-candidate-run-"));
  try {
    const target = join(temp, "generation.json");
    const run = createCandidateRun(base());
    assert.equal(publishCandidateRun(run, target).status, "published");
    const timestampReplay = structuredClone(run);
    timestampReplay.created_at = "2035-01-01T00:00:00Z";
    assert.equal(publishCandidateRun(timestampReplay, target).status, "no-op");

    const changed = JSON.parse(readFileSync(target, "utf8"));
    changed.semantic.candidate.label = "Changed";
    writeFileSync(target, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
    assert.throws(() => publishCandidateRun(run, target), /refusing to overwrite non-identical candidate-run generation/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

function base() {
  return structuredClone(vectors.base_input);
}

function pick(value, keys) {
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}

function malformed(input, id) {
  switch (id) {
    case "empty-alternatives":
      input.alternatives = [];
      break;
    case "duplicate-alias":
      input.alternatives[1].aliases = [input.alternatives[0].id];
      break;
    case "contradictory-falsifier":
      input.hypotheses.distinct.falsifiers = [...input.hypotheses.covered.falsifiers];
      break;
    case "candidate-mismatch":
      input.evidence.candidate_id = "DS-D1.21";
      break;
    case "unknown-policy":
      input.policy.id = "DEC-UIR-custom";
      break;
    case "unsupported-disposition":
      input.requested_disposition = "collapsed";
      break;
    case "score":
      input.evidence.score = 100;
      break;
    case "threshold-override":
      input.policy.threshold_overrides = { real_corpora: 1 };
      break;
    case "authority-payload":
      input.authority_payload = { activate: "DS-D1.20" };
      break;
    default:
      throw new TypeError(`unknown malformed vector: ${id}`);
  }
  return input;
}
