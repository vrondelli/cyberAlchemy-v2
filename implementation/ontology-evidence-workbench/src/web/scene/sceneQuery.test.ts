import { describe, expect, it } from "vitest";
import type { SourceGraph } from "../contracts/scene";
import { queryFocusScene } from "./focusScene";
const relation = (id: string, sourceId: string, targetId: string) => ({ id, sourceId, targetId, sourcePredicate: "supports", family: "dependency" });
const relations = [relation("r1", "a", "b"), relation("r2", "b", "c"), relation("r3", "c", "d")];
const graph = { nodes: new Map(["a", "b", "c", "d"].map((id) => [id, { id, name: id, tags: [] }])), relations: new Map(relations.map((r) => [r.id, r])), outgoing: new Map(["a", "b", "c", "d"].map((id) => [id, relations.filter((r) => r.sourceId === id)])), incoming: new Map(["a", "b", "c", "d"].map((id) => [id, relations.filter((r) => r.targetId === id)])) } as unknown as SourceGraph;
describe("focus scene", () => {
  it("stays bounded and accounts for the boundary", () => {
    const scene = queryFocusScene(graph, { focusIds: ["a"], radius: 1, visibleLimit: 2 });
    expect(scene.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(scene.boundary.map((b) => b.omittedId)).toEqual(["c"]);
  });
});
