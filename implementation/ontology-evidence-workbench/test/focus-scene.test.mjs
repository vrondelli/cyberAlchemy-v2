import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {pathToFileURL} from "node:url";
import test from "node:test";

const implementationRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(implementationRoot, "../../..");
const graphPath = join(
  implementationRoot,
  "generated/runs/BODY-WAR-ONTOLOGY-001/presentation-graph.json",
);
const sidecarPath = join(
  implementationRoot,
  "generated/runs/BODY-WAR-ONTOLOGY-001/evidence-sidecar.json",
);
const sourcePath = join(
  implementationRoot,
  "upstream/overlay/packages/dashboard/src/knowledgeFocusScene.ts",
);

async function loadModel() {
  const model = await import(`${pathToFileURL(sourcePath)}?test=${Date.now()}`);
  return {
    model,
    cleanup: async () => {},
  };
}

test("derives the exact Body War first tour scene and its evidence portals", async () => {
  const graph = JSON.parse(await readFile(graphPath, "utf8"));
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  const {model, cleanup} = await loadModel();
  try {
    assert.equal(graph.nodes.length, 237);
    assert.equal(graph.edges.length, 231);
    const first = [...graph.tour].sort((a, b) => a.order - b.order)[0];
    const scene = model.deriveKnowledgeFocusScene({
      graph,
      sidecar,
      tourNodeIds: first.nodeIds,
    });
    assert.deepEqual(scene.nodeIds, [
      "presentation:body-war.business.context.identity-consent",
      "presentation:body-war.business.context.route-expansion",
      "presentation:body-war.business.context.geometry-evidence",
      "presentation:body-war.business.context.score-preview",
    ]);
    assert.equal(scene.internalEdges.length, 0);
    assert.equal(scene.portals.length, 6);
    assert.equal(
      scene.nodeIds.includes("presentation:body-war.business.entity.suggested-track"),
      false,
    );
    const literal = scene.portals.find((portal) =>
      portal.source === "presentation:body-war.business.context.identity-consent" &&
      portal.target === "presentation:body-war.business.capability.auth-consent"
    );
    assert.ok(literal);
    assert.equal(literal.presentationRelation, "related");
    assert.equal(literal.sourceRelation, "owns");
    assert.equal(literal.direction, "forward");
    assert.equal(literal.authorityEffect, "none");
    assert.deepEqual(literal.evidenceRefs, [
      "projects/body-war/docs/features/troqar-product-architecture/OPERATIONS-CAPABILITIES.md",
    ]);
  } finally {
    await cleanup();
  }
});

test("portal activation is input-independent and Back restores the source focus", async () => {
  const {model, cleanup} = await loadModel();
  try {
    const state = {
      focusNodeId: "presentation:body-war.business.context.identity-consent",
      history: [],
    };
    const event = {
      type: "activate-portal",
      source: "presentation:body-war.business.context.identity-consent",
      target: "presentation:body-war.business.capability.auth-consent",
    };
    const pointer = model.reduceKnowledgeFocusState(state, {...event, input: "pointer"});
    const enter = model.reduceKnowledgeFocusState(state, {...event, input: "Enter"});
    const space = model.reduceKnowledgeFocusState(state, {...event, input: " "});
    assert.deepEqual(pointer, enter);
    assert.deepEqual(pointer, space);
    assert.deepEqual(model.reduceKnowledgeFocusState(pointer, {type: "back"}), state);
  } finally {
    await cleanup();
  }
});

test("non-tour focus is deterministic and same-origin sidecar URLs retain the token", async () => {
  const graph = JSON.parse(await readFile(graphPath, "utf8"));
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  const {model, cleanup} = await loadModel();
  try {
    const input = {
      graph,
      sidecar,
      focusNodeId: "presentation:body-war.business.capability.auth-consent",
    };
    assert.deepEqual(
      model.deriveKnowledgeFocusScene(input),
      model.deriveKnowledgeFocusScene(input),
    );
    const url = new URL(
      model.sameOriginEvidenceSidecarUrl("http://127.0.0.1:37037/?token=secret"),
    );
    assert.equal(url.origin, "http://127.0.0.1:37037");
    assert.equal(url.pathname, "/oew-data/evidence-sidecar.json");
    assert.equal(url.searchParams.get("token"), "secret");
    assert.equal(url.origin === "https://example.com", false);
    const retained = new URL(
      model.sameOriginEvidenceSidecarUrl(
        "http://127.0.0.1:37037/",
        "retained-secret",
      ),
    );
    assert.equal(retained.searchParams.get("token"), "retained-secret");
  } finally {
    await cleanup();
  }
});

test("work pack keeps ontology and package roots outside the source target inventory", async () => {
  const manifest = JSON.parse(await readFile(
    join(
      repositoryRoot,
      "cyberAlchemy-v2/development/ontology-evidence-workbench-focus-scene/planning/work-pack/swu-manifest.json",
    ),
    "utf8",
  ));
  const targets = manifest.swus[0].target_inventory;
  assert.equal(targets.some((path) => path.endsWith("/package.json")), false);
  assert.equal(targets.some((path) => path.includes("/ontology/")), false);
  assert.equal(targets.some((path) => path.includes("/src/oew/")), false);
});
