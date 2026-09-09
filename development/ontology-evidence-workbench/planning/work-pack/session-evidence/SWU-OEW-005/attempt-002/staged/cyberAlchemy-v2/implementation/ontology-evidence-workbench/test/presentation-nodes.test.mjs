import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  NodeProjectionError,
  projectPresentationNodes,
  supportedSourceNodeKinds,
} from "../src/presentation-nodes.mjs";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(testDirectory, "../fixtures/poker-source-subset.json");

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

function clone(value) {
  return structuredClone(value);
}

test("projects the Poker evidence subset to pinned UA GraphNode fields", async () => {
  const result = projectPresentationNodes(await loadFixture());

  assert.equal(result.schema_version, "oew-node-projection/v1");
  assert.equal(result.authority_effect, "none");
  assert.deepEqual(
    result.presentation_nodes.map(({ id, type }) => [id, type]),
    [
      ["presentation:D1", "claim"],
      ["presentation:D2", "claim"],
      ["presentation:F1", "claim"],
      ["presentation:R1", "source"],
    ],
  );
  for (const node of result.presentation_nodes) {
    assert.equal(typeof node.name, "string");
    assert.equal(typeof node.filePath, "string");
    assert.equal(typeof node.summary, "string");
    assert.ok(Array.isArray(node.tags));
    assert.equal(node.complexity, "simple");
    assert.equal(typeof node.knowledgeMeta.category, "string");
    assert.equal(typeof node.knowledgeMeta.content, "string");
  }
});

test("emits one lossless sidecar row per presentation node", async () => {
  const source = await loadFixture();
  const result = projectPresentationNodes(source);

  assert.deepEqual(result.counts, {
    source_nodes: 4,
    presentation_nodes: 4,
    sidecar_nodes: 4,
    by_type: {
      claim: 3,
      source: 1,
    },
  });
  for (const node of source.nodes) {
    const row = result.sidecar_nodes[`presentation:${node.source_id}`];
    assert.equal(row.source_ref, node.source_id);
    assert.equal(row.source_kind, node.source_kind);
    assert.equal(row.source_kind_original, node.source_kind_original);
    assert.equal(row.source_path, node.source_path);
    assert.equal(row.source_digest, node.source_digest);
    assert.equal(row.authority_effect, "none");
  }
});

test("is byte-stable across source node order", async () => {
  const source = await loadFixture();
  const reversed = clone(source);
  reversed.nodes.reverse();

  assert.equal(
    JSON.stringify(projectPresentationNodes(source)),
    JSON.stringify(projectPresentationNodes(reversed)),
  );
});

test("rejects unknown kinds and duplicate source IDs with stable diagnostics", async () => {
  const source = await loadFixture();
  const invalid = clone(source);
  invalid.nodes[0].source_kind = "Session";
  invalid.nodes.push(clone(invalid.nodes[1]));

  assert.throws(
    () => projectPresentationNodes(invalid),
    (error) => {
      assert.ok(error instanceof NodeProjectionError);
      assert.equal(error.code, "OEW_NODE_PROJECTION_REJECTED");
      assert.deepEqual(error.issues, [
        "DUPLICATE_SOURCE_ID:D2",
        "UNKNOWN_SOURCE_KIND:Session",
      ]);
      return true;
    },
  );
});

test("rejects malformed digests and every authority-effecting input", async () => {
  const source = await loadFixture();
  const invalid = clone(source);
  invalid.source_run.authority_effect = "admit";
  invalid.nodes[0].source_digest = "not-a-digest";
  invalid.nodes[1].authority_effect = "promote";

  assert.throws(
    () => projectPresentationNodes(invalid),
    (error) => {
      assert.deepEqual(error.issues, [
        "AUTHORITY_EFFECT_FORBIDDEN:D2",
        "AUTHORITY_EFFECT_FORBIDDEN:source_run",
        "SOURCE_DIGEST_INVALID:D1",
      ]);
      return true;
    },
  );
});

test("publishes the exact closed source-kind vocabulary", () => {
  assert.deepEqual(supportedSourceNodeKinds, [
    "Definition",
    "Finding",
    "Observation",
    "Research artifact",
  ]);
  assert.equal(Object.isFrozen(supportedSourceNodeKinds), true);
});
