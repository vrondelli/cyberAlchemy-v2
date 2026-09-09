import { expect, it } from "vitest";
import type { PresentationNode } from "../contracts/bundle";
import { filterNodes } from "./filterQuery";
const nodes = [{ id: "a", name: "A", tags: ["business-kind:actor"], type: "claim" }, { id: "p", name: "P", tags: ["business-kind:policy"], type: "claim" }] as PresentationNode[];
it("applies OR within kind and AND across groups", () => expect(filterNodes(nodes, { kind: ["actor"] }).map((node) => node.id)).toEqual(["a"]));
