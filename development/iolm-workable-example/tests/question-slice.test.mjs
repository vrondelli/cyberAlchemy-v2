import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { DemoSnapshotError } from "../assets/demo-snapshot-v1.mjs";
import {
  selectDemoSlice,
  selectPlayerQuestionSlice,
} from "../assets/question-slice.mjs";

const TEST_ROOT = dirname(fileURLToPath(import.meta.url));
const GENERATED_PATH = resolve(TEST_ROOT, "../generated/read-models/demo-snapshot.v1.json");

async function loadSnapshot() {
  return JSON.parse(await readFile(GENERATED_PATH, "utf8"));
}

function hasCode(code) {
  return (error) => error instanceof DemoSnapshotError && error.code === code;
}

test("default selector preserves the exact full 4/3 stable-ID set", async () => {
  const selected = selectDemoSlice(await loadSnapshot());
  assert.equal(selected.schema_version, "iolm-demo-slice/v1");
  assert.equal(selected.artifact_role, "projection");
  assert.equal(selected.slice_id, "default");
  assert.deepEqual(selected.counts, { nodes: 4, relations: 3 });
  assert.deepEqual(selected.node_ids, selected.nodes.map(({ id }) => id));
  assert.deepEqual(selected.relation_ids, selected.relations.map(({ id }) => id));
});

test("Player question returns the exact induced 2/1 slice", async () => {
  const selected = selectPlayerQuestionSlice(await loadSnapshot());
  assert.equal(selected.question, "What does the Player do, and what supports that connection?");
  assert.deepEqual(selected.counts, { nodes: 2, relations: 1 });
  assert.deepEqual(selected.node_ids, [
    "key-and-door.Player",
    "key-and-door.UnlockDoor",
  ]);
  assert.deepEqual(selected.relation_ids, [
    "key-and-door.edge.player-performs-unlock-door",
  ]);
  assert.deepEqual(selected.relations[0].source, {
    feature_id: "key-and-door",
    node_id: "key-and-door.Player",
  });
  assert.deepEqual(selected.relations[0].target, {
    feature_id: "key-and-door",
    node_id: "key-and-door.UnlockDoor",
  });
});

test("question projection retains provenance, candidate posture and exclusions", async () => {
  const selected = selectPlayerQuestionSlice(await loadSnapshot());
  assert.equal(selected.posture, "candidate");
  assert.equal(selected.authority_effect, "none");
  assert.ok(selected.ineligible_for.includes("CROSS_FEATURE_UNSUPPORTED"));
  assert.ok([...selected.nodes, ...selected.relations].every((record) => (
    record.validation_state === "pass" &&
    record.contract_binding.binding_id === "key-and-door-pinned-fixture" &&
    /^[0-9a-f]{64}$/.test(record.source_digest)
  )));
});

test("selected projections are deeply immutable", async () => {
  const selected = selectPlayerQuestionSlice(await loadSnapshot());
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(selected.nodes), true);
  assert.equal(Object.isFrozen(selected.nodes[0]), true);
  assert.equal(Object.isFrozen(selected.relations[0].source), true);
  assert.throws(() => {
    selected.node_ids.push("key-and-door.HasKeyRule");
  }, TypeError);
});

test("unknown slice IDs fail with a typed blocked selection state", async () => {
  const snapshot = await loadSnapshot();
  assert.throws(() => selectDemoSlice(snapshot, "missing"), hasCode("QUESTION_SLICE_NOT_FOUND"));
});

test("question slice parity drift blocks before projection", async () => {
  const changed = await loadSnapshot();
  changed.slices.questions[0].node_ids.push("key-and-door.HasKeyRule");
  changed.slices.questions[0].counts.nodes = 3;
  assert.throws(() => selectPlayerQuestionSlice(changed), hasCode("QUESTION_SLICE_PARITY_MISMATCH"));
});

test("identical snapshot bytes produce identical question projection bytes", async () => {
  const first = JSON.stringify(selectPlayerQuestionSlice(await loadSnapshot()));
  const second = JSON.stringify(selectPlayerQuestionSlice(await loadSnapshot()));
  assert.equal(first, second);
});
