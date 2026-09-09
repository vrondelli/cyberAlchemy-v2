import { describe, expect, it } from "vitest";
import { WORKSPACE_GRAPH_SOURCE } from "./graph.generated";
import { PRESENTATION_FAMILIES, buildCanvasGraph, derivePortalScene, filterGraphByPredicates, presentationFamily, validateGraph } from "./graph";
import { shouldUseLayoutWorker } from "./layout";

describe("current Workspace ontology graph", () => {
  it("binds the exact current source digests and closes every relation endpoint", () => {
    expect(WORKSPACE_GRAPH_SOURCE.sourceDigests).toEqual({ nodes: "4d0619d99b9aab742377c451bb21cd535c36c733e7b98c1f4d876f74bbf52e7c", relations: "d4d9e44b4688833e7514b58d02e110d3156ab4cd7b225f81ee81ac6def27f8d0" });
    expect(WORKSPACE_GRAPH_SOURCE.nodes).toHaveLength(15);
    expect(WORKSPACE_GRAPH_SOURCE.nodes.filter((node) => node.kind === "External Reference")).toHaveLength(3);
    expect(WORKSPACE_GRAPH_SOURCE.relations).toHaveLength(14);
    expect(validateGraph(WORKSPACE_GRAPH_SOURCE)).toEqual([]);
  });

  it("derives the real Essays portal as one exact incoming relationship", () => {
    const portal = derivePortalScene(WORKSPACE_GRAPH_SOURCE, "CA2-PROJECT-ESSAYS");
    expect([...portal.nodeIds].sort()).toEqual(["CA2-PROJECT-ESSAYS", "WORKSPACE-COLLECTION-PROJECTS"]);
    expect([...portal.edgeIds]).toEqual(["WORKSPACE-REL-013"]);
  });

  it("keeps presentation families explicit and predicate-closed", () => {
    const declared = Object.values(PRESENTATION_FAMILIES).flat();
    const observed = [...new Set(WORKSPACE_GRAPH_SOURCE.relations.map((relation) => relation.type))];
    expect(observed.filter((predicate) => !declared.includes(predicate))).toEqual([]);
    const coordination = filterGraphByPredicates(WORKSPACE_GRAPH_SOURCE, PRESENTATION_FAMILIES.coordination);
    expect(coordination.relations.every((relation) => presentationFamily(relation.type) === "coordination")).toBe(true);
    expect(new Set(coordination.relations.map((relation) => relation.type))).toEqual(new Set(PRESENTATION_FAMILIES.coordination));
  });

  it("lays out the bounded current graph within a local interactive budget", () => {
    const graph = buildCanvasGraph(WORKSPACE_GRAPH_SOURCE);
    expect(graph.nodes).toHaveLength(15);
    expect(graph.edges).toHaveLength(14);
    expect(graph.layoutMs).toBeLessThan(250);
  });

  it("keeps small layouts inline and moves larger projections to a worker", () => {
    expect(shouldUseLayoutWorker(15)).toBe(false);
    expect(shouldUseLayoutWorker(80)).toBe(false);
    expect(shouldUseLayoutWorker(81)).toBe(true);
  });
});
