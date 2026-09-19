import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "../../../..");
const CONTRACTS = join(PACKAGE_ROOT, "contracts");
const FIXTURES = join(PACKAGE_ROOT, "fixtures");

const MANIFEST_PATH = join(FIXTURES, "generation-001/fixture-manifest.yml");
const RECEIPT_PATH = join(FIXTURES, "contracts/evidence-receipt-valid.json");
const INVALID_PATH = join(FIXTURES, "contracts/invalid-vectors.json");
const CANONICAL_PATH = join(FIXTURES, "contracts/canonicalization-vectors.json");

const REQUIRED_PROHIBITIONS = [
  "identity",
  "irreducibility",
  "portability",
  "pattern-admission",
  "ds-d1-formation",
  "ds-d8-authority",
  "candidate-promotion",
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new TypeError("numbers must be safe integers");
  }
  return value;
}

function canonicalize(value) {
  return JSON.stringify(normalize(value));
}

function sha256Text(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function sha256Canonical(value) {
  return sha256Text(canonicalize(value));
}

function projection(record, fields) {
  return Object.fromEntries(fields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]]));
}

function deriveEnvelope(record, contentFields) {
  const contentDigest = sha256Canonical(projection(record, contentFields));
  const recordId = `record:${sha256Canonical({
    contract_id: record.contract_id,
    contract_version: record.contract_version,
    content_digest: contentDigest,
  })}`;
  const generationId = `generation:${sha256Canonical({
    input_handles: record.input_handles,
    predecessor_generation_id: record.predecessor_generation_id,
    record_id: recordId,
  })}`;
  return { contentDigest, recordId, generationId };
}

function sourceSlice(path, ranges) {
  const lines = readFileSync(resolve(REPO_ROOT, path), "utf8").replace(/\r\n?/g, "\n").split("\n");
  const selected = [];
  for (const [start, end] of ranges) {
    assert.ok(Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start, "invalid source range");
    assert.ok(end <= lines.length, `source range exceeds ${path}`);
    selected.push(...lines.slice(start - 1, end));
  }
  return `${selected.join("\n")}\n`;
}

function assertSortedUnique(values, label) {
  assert.deepEqual(values, [...new Set(values)].sort(), `${label} must be sorted and unique`);
}

function requirePath(record, path) {
  let value = record;
  for (const segment of path) {
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, segment)) {
      throw new TypeError(`missing ${path.join(".")}`);
    }
    value = value[segment];
  }
  return value;
}

function validateManifest(record) {
  if (record.schema_version !== "cdsc.fixture-manifest.v1") {
    throw new TypeError("unsupported fixture manifest schema");
  }
  requirePath(record, ["semantic", "fixtures"]);
  assert.deepEqual(record.semantic.fixture_ids, ["F1", "F2", "F3"]);
  assert.deepEqual(record.semantic.fixtures.map((fixture) => fixture.fixture_id), record.semantic.fixture_ids);
  assert.equal(record.predecessor_generation_id, null);
  assert.deepEqual(record.input_handles, []);
  assert.equal(record.status, "frozen");
  for (const prohibition of REQUIRED_PROHIBITIONS) assert.ok(record.prohibited_inferences.includes(prohibition));

  for (const fixture of record.semantic.fixtures) {
    const seenPaths = new Set();
    for (const source of fixture.sources) {
      assert.ok(!seenPaths.has(`${source.path}:${JSON.stringify(source.ranges)}`), "duplicate source selector");
      seenPaths.add(`${source.path}:${JSON.stringify(source.ranges)}`);
      const actual = sha256Text(sourceSlice(source.path, source.ranges));
      if (source.digest !== actual) throw new TypeError("source digest mismatch");
    }
    const actualBundle = sha256Canonical(fixture.sources);
    if (fixture.semantic_source_digest !== actualBundle) throw new TypeError("source bundle digest mismatch");
  }

  const expected = deriveEnvelope(record, ["semantic", "prohibited_inferences"]);
  assert.equal(record.content_digest, expected.contentDigest, "manifest content digest mismatch");
  assert.equal(record.record_id, expected.recordId, "manifest record id mismatch");
  assert.equal(record.generation_id, expected.generationId, "manifest generation id mismatch");
  return true;
}

function validateReceipt(record) {
  if (record.schema_version !== "cdsc.evidence-receipt.v1") {
    throw new TypeError("unsupported evidence receipt schema");
  }
  const { A, Q, sigma_matrix: matrix } = record.semantic;
  assert.ok(A.length > 0, "A must be nonempty");
  assert.ok(Q.length > 0, "Q must be nonempty");
  assert.equal(new Set(A.map((item) => item.explanation_id)).size, A.length, "duplicate explanation id");
  assert.equal(new Set(Q.map((item) => item.observable_id)).size, Q.length, "duplicate observable id");

  const explanationIds = new Set(A.map((item) => item.explanation_id));
  const observableIds = new Set(Q.map((item) => item.observable_id));
  const coordinates = new Map();
  for (const cell of matrix) {
    assert.ok(explanationIds.has(cell.explanation_id), "unknown explanation coordinate");
    assert.ok(observableIds.has(cell.observable_id), "unknown observable coordinate");
    assert.ok(["explained", "not-explained", "indeterminate"].includes(cell.state), "unknown predicate state");
    const key = `${cell.explanation_id}/${cell.observable_id}`;
    if (coordinates.has(key)) {
      if (coordinates.get(key).state !== cell.state) throw new TypeError("conflicting predicate coordinate");
      throw new TypeError("duplicate predicate coordinate");
    }
    coordinates.set(key, cell);
  }
  assert.equal(coordinates.size, A.length * Q.length, "predicate matrix must be total");
  for (const explanation of A) {
    for (const observable of Q) {
      assert.ok(coordinates.has(`${explanation.explanation_id}/${observable.observable_id}`), "missing predicate coordinate");
    }
  }
  for (const prohibition of REQUIRED_PROHIBITIONS) assert.ok(record.prohibited_inferences.includes(prohibition));
  assertSortedUnique(record.input_handles, "input handles");

  const expected = deriveEnvelope(record, ["semantic", "prohibited_inferences"]);
  assert.equal(record.content_digest, expected.contentDigest, "receipt content digest mismatch");
  assert.equal(record.record_id, expected.recordId, "receipt record id mismatch");
  assert.equal(record.generation_id, expected.generationId, "receipt generation id mismatch");
  return true;
}

function mutate(record, vector) {
  const output = structuredClone(record);
  const { mutation } = vector;
  const parentPath = mutation.path.slice(0, -1);
  const leaf = mutation.path.at(-1);
  let parent = output;
  for (const segment of parentPath) parent = parent[segment];

  if (mutation.op === "delete") delete parent[leaf];
  if (mutation.op === "set") parent[leaf] = mutation.value;
  if (mutation.op === "append-copy" || mutation.op === "append-copy-set") {
    const target = parent[leaf];
    const copy = structuredClone(target[mutation.source_index]);
    if (mutation.op === "append-copy-set") {
      let cursor = copy;
      for (const segment of mutation.set.path.slice(0, -1)) cursor = cursor[segment];
      cursor[mutation.set.path.at(-1)] = mutation.set.value;
    }
    target.push(copy);
  }
  return output;
}

test("all contract schemas are JSON documents with disjoint semantic and volatile fields", () => {
  const paths = readdirSync(CONTRACTS).filter((name) => name.endsWith(".schema.yml")).sort();
  assert.deepEqual(paths, [
    "evaluation-result.schema.yml",
    "evidence-receipt.schema.yml",
    "experiment-envelope.schema.yml",
    "fixture-manifest.schema.yml",
    "suite-result.schema.yml",
  ]);
  for (const name of paths) {
    const schema = loadJson(join(CONTRACTS, name));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    const semantic = schema["x-cdsc-semantic-fields"];
    const volatile = schema["x-cdsc-volatile-fields"];
    assert.ok(semantic.length > 0);
    assert.ok(volatile.length > 0);
    assert.equal(semantic.filter((field) => volatile.includes(field)).length, 0, `${name}: field classes overlap`);
    for (const field of [...semantic, ...volatile]) assert.ok(Object.hasOwn(schema.properties, field), `${name}: undeclared classified field ${field}`);
  }
});

test("generation-1 manifest freezes exactly F1, F2, and F3 with live source digests", () => {
  const manifest = loadJson(MANIFEST_PATH);
  assert.equal(validateManifest(manifest), true);
  assert.equal(manifest.semantic.fixtures.flatMap((fixture) => fixture.sources).length, 7);
});

test("valid synthetic evidence receipt has a finite total A x Q matrix", () => {
  assert.equal(validateReceipt(loadJson(RECEIPT_PATH)), true);
});

test("invalid vectors reject missing, duplicate, conflict, unknown-version, and digest drift", () => {
  const manifest = loadJson(MANIFEST_PATH);
  const receipt = loadJson(RECEIPT_PATH);
  for (const vector of loadJson(INVALID_PATH)) {
    const base = vector.target === "fixture-manifest" ? manifest : receipt;
    const validate = vector.target === "fixture-manifest" ? validateManifest : validateReceipt;
    assert.throws(() => validate(mutate(base, vector)), new RegExp(vector.expected_error), vector.case_id);
  }
});

test("canonicalization ignores field order", () => {
  const vector = loadJson(CANONICAL_PATH).field_order;
  assert.equal(sha256Canonical(vector.left), sha256Canonical(vector.right));
});

test("semantic mutation changes content digest while volatile mutation does not", () => {
  const vector = loadJson(CANONICAL_PATH).mutations;
  const base = sha256Canonical(projection(vector.base, vector.semantic_fields));
  const semantic = sha256Canonical(projection(vector.semantic_mutation, vector.semantic_fields));
  const volatile = sha256Canonical(projection(vector.volatile_mutation, vector.semantic_fields));
  assert.notEqual(base, semantic);
  assert.equal(base, volatile);
  assert.notDeepEqual(projection(vector.base, vector.volatile_fields), projection(vector.volatile_mutation, vector.volatile_fields));
});
