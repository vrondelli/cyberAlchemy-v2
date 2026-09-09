import { expect, it } from "vitest";
import type { SourceGraph } from "../contracts/scene";
import { queryBoundedPath } from "./pathQuery";
const edge = { id: "r", sourceId: "a", targetId: "b" };
const graph = { nodes: new Map([["a", {}], ["b", {}]]), relations: new Map([["r", edge]]), outgoing: new Map([["a", [edge]], ["b", []]]), incoming: new Map([["a", []], ["b", [edge]]]) } as unknown as SourceGraph;
it("finds a deterministic admitted path", () => expect(queryBoundedPath(graph, "a", "b")).toMatchObject({ status: "found", nodeIds: ["a", "b"] }));
it("returns typed no-path and unknown endpoint states", () => expect(queryBoundedPath(graph, "a", "missing").status).toBe("unknown-endpoint"));
