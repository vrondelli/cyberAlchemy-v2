import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { verifyAdapterReceipt } from "../scripts/verify-adapter-receipt.mjs";
import {
  buildBodyWarAdapterArtifacts,
  writeBodyWarAdapterRun,
} from "../src/body-war-adapter-writer.mjs";

test("Body War adapter projects the complete candidate-local business graph", async () => {
  const result = await buildBodyWarAdapterArtifacts();
  assert.equal(result.ontology.profile.status, "candidate-local");
  assert.equal(result.ontology.profile.authority_effect, "none");
  assert.equal(result.ontology.profile.release_admission, "not-granted");
  assert.equal(result.graph.project.name, "Body War Business Ontology");
  assert.equal(result.graph.nodes.length, 237);
  assert.equal(result.graph.edges.length, 231);
  assert.equal(Object.keys(result.sidecar.nodes).length, 237);
  assert.equal(Object.keys(result.sidecar.edges).length, 231);
  assert.equal(result.graph.layers.length, 17);
  assert.equal(result.graph.tour.length, 5);

  const nodeIds = new Set(result.graph.nodes.map(({ id }) => id));
  assert.equal(nodeIds.size, 237);
  for (const edge of result.graph.edges) {
    assert.equal(nodeIds.has(edge.source), true);
    assert.equal(nodeIds.has(edge.target), true);
  }
  const layeredIds = result.graph.layers.flatMap(({ nodeIds: ids }) => ids);
  assert.equal(layeredIds.length, 237);
  assert.equal(new Set(layeredIds).size, 237);
  for (const step of result.graph.tour) {
    assert.equal(step.nodeIds.every((id) => nodeIds.has(id)), true);
  }
});

test("Body War projection preserves exact kinds, predicates, and authority boundaries", async () => {
  const { graph, sidecar } = await buildBodyWarAdapterArtifacts();
  const geometry = sidecar.nodes[
    "presentation:body-war.business.entity.geometry-candidate"
  ];
  assert.equal(geometry.source_kind_original, "entity");
  assert.equal(geometry.authority_effect, "none");
  assert.match(
    graph.nodes.find(
      ({ id }) =>
        id === "presentation:body-war.business.entity.geometry-candidate",
    ).summary,
    /candidate/i,
  );

  const nonPromotion = sidecar.edges[
    "presentation-edge:body-war.relation.geometry-does-not-promote"
  ];
  assert.equal(nonPromotion.source_relation, "does_not_promote");
  assert.equal(nonPromotion.policy_disposition, "policy-pass");
  assert.equal(nonPromotion.grounding_inclusion, "excluded");
  assert.deepEqual(nonPromotion.diagnostics, [
    "EXPLICIT_NON_PROMOTION_BOUNDARY",
  ]);
  assert.equal(sidecar.authority_effect, "none");
  assert.match(
    graph.project.description,
    /release admission is not granted/i,
  );
});

test("Body War adapter run is deterministic and independently verifiable", async () => {
  const root = await mkdtemp(join(tmpdir(), "oew-body-war-adapter-"));
  try {
    const output = join(root, "BODY-WAR-ONTOLOGY-001");
    const written = await writeBodyWarAdapterRun(output);
    const verified = await verifyAdapterReceipt(
      "BODY-WAR-ONTOLOGY-001/adapter-receipt.json",
      { repositoryRoot: root },
    );
    assert.equal(verified.verified, true, verified.issues.join(","));
    assert.deepEqual(verified.mapping_counts, {
      source_nodes: 237,
      presentation_nodes: 237,
      sidecar_nodes: 237,
      source_relations: 231,
      presentation_edges: 231,
      sidecar_edges: 231,
    });
    const receipt = JSON.parse(await readFile(written.receiptPath, "utf8"));
    assert.equal(receipt.authority_effect, "none");
    assert.match(receipt.evidence_ceiling, /no system implementation/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
