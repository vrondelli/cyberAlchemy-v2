import { describe, expect, it } from "vitest";
import { EXPERIMENT_GRAPH_SOURCE } from "./graph.generated";
import { buildCanvasGraph, derivePortalScene, relationPresentationStyle, semanticIconKey, validateCanvasGraph } from "./graph";

describe("ontology canvas projection", () => {
  it("preserves the complete bounded graph and explicit external endpoints", () => {
    expect(EXPERIMENT_GRAPH_SOURCE.nodes).toHaveLength(15);
    expect(EXPERIMENT_GRAPH_SOURCE.relations).toHaveLength(14);
    expect(EXPERIMENT_GRAPH_SOURCE.nodes.filter((node) => node.kind === "External Reference")).toHaveLength(3);
    expect(validateCanvasGraph(EXPERIMENT_GRAPH_SOURCE)).toEqual([]);
  });

  it("creates positioned, inspectable, non-mutating canvas elements", () => {
    const graph = buildCanvasGraph(EXPERIMENT_GRAPH_SOURCE);
    expect(graph.nodes).toHaveLength(15);
    expect(graph.edges).toHaveLength(14);
    expect(graph.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y))).toBe(true);
    expect(graph.nodes.every((node) => node.connectable === false && node.deletable === false)).toBe(true);
    expect(graph.edges.every((edge) => edge.reconnectable === false && edge.deletable === false)).toBe(true);
  });

  it("retains every available detail field and relation claim", () => {
    for (const node of EXPERIMENT_GRAPH_SOURCE.nodes) {
      expect(node.id).toBeTruthy();
      expect(node.kind).toBeTruthy();
      expect(node.label).toBeTruthy();
      expect(node.status).toBeTruthy();
      expect(node.meaning).toBeTruthy();
      expect(node.owner_route).toBeTruthy();
      expect(Array.isArray(node.source_refs)).toBe(true);
      expect(node.boundary).toBeTruthy();
      expect(node.claim_ceiling).toBeTruthy();
    }
    expect(EXPERIMENT_GRAPH_SOURCE.relations.every((relation) => relation.type && relation.claim)).toBe(true);
  });

  it("uses one stable color per exact predicate with redundant family patterns", () => {
    const types = [...new Set(EXPERIMENT_GRAPH_SOURCE.relations.map((relation) => relation.type))];
    const presentations = types.map((type) => relationPresentationStyle(type));
    expect(types).toHaveLength(10);
    expect(presentations.every((presentation) => presentation.mapped)).toBe(true);
    expect(new Set(presentations.map((presentation) => presentation.color)).size).toBe(types.length);
    expect(new Set(presentations.map((presentation) => presentation.family))).toEqual(new Set(["structure", "coordination", "flow", "provenance"]));
    for (const type of types) expect(relationPresentationStyle(type)).toEqual(relationPresentationStyle(type));
  });

  it("derives a reversible one-hop portal scene without changing graph membership", () => {
    const origin = "CA2-CAP-INSPECT-CYBERALCHEMY-WORKSPACE";
    const scene = derivePortalScene(EXPERIMENT_GRAPH_SOURCE, origin);
    expect(scene.originId).toBe(origin);
    expect(scene.nodeIds.size).toBe(8);
    expect(scene.edgeIds.size).toBe(7);
    expect([...scene.edgeIds].every((id) => EXPERIMENT_GRAPH_SOURCE.relations.some((relation) => relation.id === id && (relation.source === origin || relation.target === origin)))).toBe(true);
    expect(derivePortalScene(EXPERIMENT_GRAPH_SOURCE, null).nodeIds.size).toBe(15);
  });

  it("maps exact local kinds to redundant icons and refines ontology labels to factory", () => {
    expect(semanticIconKey({ kind: "Goal", label: "Build a vertical" })).toBe("goal");
    expect(semanticIconKey({ kind: "Collection", label: "Definitions" })).toBe("collection");
    expect(semanticIconKey({ kind: "Collection", label: "Ontologies" })).toBe("factory");
    expect(semanticIconKey({ kind: "Unmapped", label: "Unknown" })).toBe("unknown");
  });

});
