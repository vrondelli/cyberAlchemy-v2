import { describe, expect, it } from "vitest";
import type { VerifiedDataset } from "../contracts/bundle";
import { projectRelations } from "./relationPresentation";
import { relationColor } from "./relationPalette";

const dataset = { graph: { nodes: [{ id: "presentation:a", name: "A" }, { id: "presentation:b", name: "B" }], edges: [{ source: "presentation:a", target: "presentation:b", type: "builds_on", description: "depends_on" }] }, sidecar: { edges: { "presentation-edge:r1": { source: "a", target: "b", source_relation: "depends_on", mapping_loss: "generalized", evidence_refs: ["proof.md"] } } } } as unknown as VerifiedDataset;
describe("relation projection", () => {
  it("preserves source predicate and evidence", () => {
    const [relation] = projectRelations(dataset);
    expect(relation?.sourcePredicate).toBe("depends_on");
    expect(relation?.evidenceRefs).toEqual(["proof.md"]);
    expect(relation?.color).toBe(relationColor("depends_on"));
  });
  it("gives unknown predicates explicit stable identity", () => expect(relationColor("new_predicate")).toBe(relationColor("new_predicate")));
});
