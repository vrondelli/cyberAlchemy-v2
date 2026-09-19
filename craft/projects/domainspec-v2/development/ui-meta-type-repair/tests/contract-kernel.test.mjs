import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildEnvelope,
  canonicalize,
  contentDigest,
  deriveGenerationId,
  deriveRecordId,
  semanticProjection,
  validateEnvelope,
} from "../contracts/canonical-json-v1.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(join(root, "fixtures/contracts/canonical-json-v1-vectors.json"), "utf8"));
const vectors = new Map(fixture.vectors.map((vector) => [vector.id, vector]));

test("contract schemas are JSON-formatted YAML with closed required fields", () => {
  for (const name of ["contract-manifest.schema.yml", "record-envelope.schema.yml", "normalized-result.schema.yml"]) {
    const schema = JSON.parse(readFileSync(join(root, "contracts", name), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.length > 0);
  }
});

test("baseline canonical bytes and identities match golden vectors", () => {
  const baseline = vectors.get("baseline");
  const semantic = semanticProjection(baseline.record, fixture.semantic_fields);
  assert.equal(canonicalize(semantic), baseline.expected_canonical);
  const digest = contentDigest(baseline.record, fixture.semantic_fields);
  assert.equal(digest, baseline.expected_content_digest);
  const recordId = deriveRecordId({ contractId: fixture.contract_id, contractVersion: fixture.contract_version, contentDigest: digest });
  assert.equal(recordId, baseline.expected_record_id);
  const generationId = deriveGenerationId({ recordId, inputHandles: fixture.input_handles });
  assert.equal(generationId, baseline.expected_generation_id);
});

test("field order and volatile fields do not change identity", () => {
  const baseline = build(vectors.get("baseline"));
  const reordered = build(vectors.get("reordered-and-volatile"));
  assert.equal(reordered.content_digest, baseline.content_digest);
  assert.equal(reordered.record_id, baseline.record_id);
  assert.equal(reordered.generation_id, baseline.generation_id);
});

test("semantic and array-order changes alter content identity", () => {
  const baseline = build(vectors.get("baseline"));
  for (const id of ["semantic-change", "array-order-change", "unicode-byte-change"]) {
    const changed = build(vectors.get(id));
    assert.notEqual(changed.content_digest, baseline.content_digest, id);
    assert.notEqual(changed.record_id, baseline.record_id, id);
    assert.notEqual(changed.generation_id, baseline.generation_id, id);
  }
});

test("lineage changes generation only and same predecessor is a no-op", () => {
  const baseline = build(vectors.get("baseline"));
  const successorA = buildEnvelope({
    contractId: fixture.contract_id,
    contractVersion: fixture.contract_version,
    semanticFields: fixture.semantic_fields,
    record: vectors.get("baseline").record,
    predecessorGenerationId: baseline.generation_id,
    inputHandles: fixture.input_handles,
  });
  const successorB = buildEnvelope({
    contractId: fixture.contract_id,
    contractVersion: fixture.contract_version,
    semanticFields: fixture.semantic_fields,
    record: vectors.get("baseline").record,
    predecessorGenerationId: baseline.generation_id,
    inputHandles: fixture.input_handles,
    createdAt: "2030-01-01T00:00:00Z",
  });
  assert.equal(successorA.content_digest, baseline.content_digest);
  assert.equal(successorA.record_id, baseline.record_id);
  assert.notEqual(successorA.generation_id, baseline.generation_id);
  assert.equal(successorA.generation_id, successorB.generation_id);
});

test("malformed canonical values fail closed", () => {
  for (const vector of fixture.invalid_vectors) {
    assert.throws(() => canonicalize(vector.value), new RegExp(vector.error), vector.id);
  }
  assert.throws(() => canonicalize(undefined), /plain object required/);
  assert.throws(() => canonicalize([, "value"]), /sparse arrays are invalid/);
  assert.throws(() => canonicalize(new Date()), /plain object required/);
});

test("envelope validation rejects tampering and ambiguous handles", () => {
  const envelope = JSON.parse(readFileSync(join(root, "fixtures/contracts/record-envelope-valid.json"), "utf8"));
  assert.equal(validateEnvelope(envelope, fixture.semantic_fields), true);

  const tampered = structuredClone(envelope);
  tampered.semantic.flags.count = 99;
  assert.throws(() => validateEnvelope(tampered, fixture.semantic_fields), /content digest mismatch/);

  const invalid = JSON.parse(readFileSync(join(root, "fixtures/contracts/record-envelope-invalid.json"), "utf8"));
  assert.throws(() => validateEnvelope(invalid, ["candidate"]), /sorted and unique/);
  assert.throws(() => deriveGenerationId({ recordId: envelope.record_id, inputHandles: ["source:alpha", "source:alpha"] }), /sorted and unique/);
});

function build(vector) {
  return buildEnvelope({
    contractId: fixture.contract_id,
    contractVersion: fixture.contract_version,
    semanticFields: fixture.semantic_fields,
    record: vector.record,
    inputHandles: fixture.input_handles,
    createdAt: vector.record.created_at,
    storagePath: vector.record.storage_path,
  });
}
