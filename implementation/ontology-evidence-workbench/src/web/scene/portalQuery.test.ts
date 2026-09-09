import { expect, it } from "vitest";
import type { FocusScene, SourceGraph } from "../contracts/scene";
import { queryGroupedPortals } from "./portalQuery";
const relation = { id: "r", sourceId: "a", targetId: "b", sourcePredicate: "owns", family: "authority" };
const graph = { nodes: new Map([["a", { id: "a", name: "A", tags: [] }], ["b", { id: "b", name: "B", tags: ["business-kind:actor"] }]]) } as unknown as SourceGraph;
const scene = { boundary: [{ relation, visibleId: "a", omittedId: "b", direction: "outgoing" }] } as unknown as FocusScene;
it("conserves each boundary relation in a grouped portal", () => expect(queryGroupedPortals(graph, scene)[0]).toMatchObject({ count: 1, predicates: ["owns"], pivotFocusId: "b" }));
