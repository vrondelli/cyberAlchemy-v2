import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validatePinnedBundle } from "../assets/binding-guard.mjs";
import {
  DemoSnapshotError,
  createDemoSnapshotV1,
  digestDemoSnapshotV1,
  serializeDemoSnapshotV1,
  validateDemoSnapshotV1,
} from "../assets/demo-snapshot-v1.mjs";

const TEST_ROOT = dirname(fileURLToPath(import.meta.url));
const DEMO_ROOT = resolve(TEST_ROOT, "..");
const REPO_ROOT = resolve(TEST_ROOT, "../../../..");
const GENERATED_PATH = resolve(DEMO_ROOT, "generated/read-models/demo-snapshot.v1.json");
const SYNTHETIC_PATH = resolve(TEST_ROOT, "fixtures/demo-snapshot-v1-cross-feature.synthetic.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadBoundary() {
  const binding = await readJson(resolve(DEMO_ROOT, "contracts/source-binding.v1.json"));
  const artifacts = {};
  for (const [role, entry] of Object.entries(binding.inputs)) {
    const bytes = new Uint8Array(await readFile(resolve(REPO_ROOT, entry.path)));
    artifacts[role] = { bytes, json: JSON.parse(new TextDecoder().decode(bytes)) };
  }
  return validatePinnedBundle(binding, artifacts);
}

function clone(value) {
  return structuredClone(value);
}

function hasCode(code) {
  return (error) => error instanceof DemoSnapshotError && error.code === code;
}

function assertDeepFrozen(value) {
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") assertDeepFrozen(child);
  }
}

test("Draft 2020-12 schema and generated instance are default-deny", async () => {
  const schema = await readJson(resolve(DEMO_ROOT, "contracts/demo-snapshot.v1.schema.json"));
  const generated = await readJson(GENERATED_PATH);
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.sourceBinding.additionalProperties, false);
  assert.equal(schema.$defs.node.additionalProperties, false);
  assert.equal(schema.$defs.relation.additionalProperties, false);
  assert.equal(schema.$defs.slice.additionalProperties, false);
  assert.equal(validateDemoSnapshotV1(generated), generated);
});

test("guarded A1 bundle produces the checked-in exact 4/3 snapshot", async () => {
  const boundary = await loadBoundary();
  const snapshot = createDemoSnapshotV1(boundary);
  const generatedBytes = await readFile(GENERATED_PATH, "utf8");
  assert.equal(serializeDemoSnapshotV1(snapshot), generatedBytes);
  assert.deepEqual(snapshot.counts, { nodes: 4, relations: 3 });
  assert.deepEqual(snapshot.nodes.map(({ id }) => id), [
    "key-and-door.DoorUnlocked",
    "key-and-door.HasKeyRule",
    "key-and-door.Player",
    "key-and-door.UnlockDoor",
  ]);
  assert.deepEqual(snapshot.relations.map(({ id }) => id), [
    "key-and-door.edge.has-key-rule-enforces-unlock-door",
    "key-and-door.edge.player-performs-unlock-door",
    "key-and-door.edge.unlock-door-produces-door-unlocked",
  ]);
});

test("snapshot serialization and digest are deterministic", async () => {
  const first = createDemoSnapshotV1(await loadBoundary());
  const second = createDemoSnapshotV1(await loadBoundary());
  assert.equal(serializeDemoSnapshotV1(first), serializeDemoSnapshotV1(second));
  assert.equal(await digestDemoSnapshotV1(first), await digestDemoSnapshotV1(second));
  assert.equal(await digestDemoSnapshotV1(first), "7133834b0bd445a279695b657b15234dccbdbd7e0b3f15095d6f92919b5f57ec");
});

test("snapshot, records, endpoints, slices and provenance are deeply immutable", async () => {
  const snapshot = createDemoSnapshotV1(await loadBoundary());
  assertDeepFrozen(snapshot);
  assert.throws(() => {
    snapshot.nodes[0].label = "Changed";
  }, TypeError);
  assert.throws(() => {
    snapshot.relations[0].source.node_id = "Changed";
  }, TypeError);
});

test("every stable ID has one explicit feature namespace and provenance join", async () => {
  const snapshot = createDemoSnapshotV1(await loadBoundary());
  const ids = [...snapshot.nodes.map(({ id }) => id), ...snapshot.relations.map(({ id }) => id)];
  assert.equal(new Set(ids).size, 7);
  assert.ok(snapshot.nodes.every((node) => node.feature_id === "key-and-door"));
  assert.ok(snapshot.relations.every((relation) => (
    relation.source.feature_id === "key-and-door" && relation.target.feature_id === "key-and-door"
  )));
  assert.ok([...snapshot.nodes, ...snapshot.relations].every((record) => (
    record.source_reference && /^[0-9a-f]{64}$/.test(record.source_digest)
  )));
});

test("test-only synthetic snapshot admits an independently namespaced cross-feature endpoint", async () => {
  const synthetic = validateDemoSnapshotV1(await readJson(SYNTHETIC_PATH));
  assert.equal(synthetic.source_binding.input_class, "synthetic-conformance");
  assert.equal(synthetic.source_binding.test_only, true);
  assert.deepEqual(synthetic.features.map(({ feature_id: id }) => id), ["alpha", "beta"]);
  assert.deepEqual(synthetic.relations[0].source, { feature_id: "alpha", node_id: "alpha.Source" });
  assert.deepEqual(synthetic.relations[0].target, { feature_id: "beta", node_id: "beta.Target" });
  assert.ok(synthetic.ineligible_for.includes("CROSS_FEATURE_UNSUPPORTED"));
});

test("A2 rejects a missing or non-passing A1 boundary", () => {
  assert.throws(() => createDemoSnapshotV1({ status: "pass", handle: "other/v1" }), hasCode("SNAPSHOT_BOUNDARY_HANDLE_MISMATCH"));
  assert.throws(() => createDemoSnapshotV1({ status: "block", handle: "iolm-fixture-boundary/v1" }), hasCode("SNAPSHOT_BOUNDARY_HANDLE_MISMATCH"));
});

test("typed snapshot negatives fail closed without fallback", async (context) => {
  const original = await readJson(GENERATED_PATH);
  const cases = [
    ["posture", "SNAPSHOT_POSTURE_FORBIDDEN", (value) => { value.posture = "authoritative"; }],
    ["authority effect", "SNAPSHOT_AUTHORITY_EFFECT_FORBIDDEN", (value) => { value.authority_effect = "promote"; }],
    ["feature namespace", "SNAPSHOT_FEATURE_NAMESPACE_MISSING", (value) => { value.nodes[0].feature_id = "missing"; }],
    ["endpoint", "EDGE_ENDPOINT_UNRESOLVED", (value) => { value.relations[0].target.node_id = "key-and-door.Missing"; }],
    ["provenance", "SNAPSHOT_PROVENANCE_MISMATCH", (value) => { value.nodes[0].source_digest = "0".repeat(64); }],
    ["count", "SNAPSHOT_COUNT_MISMATCH", (value) => { value.counts.nodes = 5; }],
    ["default slice", "SNAPSHOT_DEFAULT_SLICE_MISMATCH", (value) => { [value.slices.default.node_ids[0], value.slices.default.node_ids[1]] = [value.slices.default.node_ids[1], value.slices.default.node_ids[0]]; }],
    ["eligibility fence", "SNAPSHOT_ELIGIBILITY_FENCE_MISMATCH", (value) => { value.ineligible_for.pop(); }],
  ];
  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const changed = clone(original);
      mutate(changed);
      assert.throws(() => validateDemoSnapshotV1(changed), hasCode(code));
    });
  }
});
