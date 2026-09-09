import { describe, expect, it } from "vitest";
import type { VerifiedDataset } from "../contracts/bundle";
import { reduceWorkbench } from "./workbenchReducer";
import { createInitialWorkbenchState } from "./workbenchState";

const dataset = { manifest: { datasetId: "toy" }, graph: { nodes: [{ id: "n1" }, { id: "n2" }], edges: [], tour: [{ nodeIds: ["n1"] }] }, sidecar: { nodes: { n1: {}, n2: {} }, edges: {} } } as unknown as VerifiedDataset;

describe("workbench reducer", () => {
  it("pivots and restores bounded history", () => {
    const initial = createInitialWorkbenchState(dataset);
    const pivoted = reduceWorkbench(initial, { type: "pivot", focusId: "n2" }, dataset);
    expect(pivoted.focusId).toBe("n2");
    expect(reduceWorkbench(pivoted, { type: "history-back" }, dataset).focusId).toBe("n1");
  });

  it("rejects ghost selections", () => {
    const state = reduceWorkbench(createInitialWorkbenchState(dataset), { type: "select", selection: { kind: "node", id: "ghost" } }, dataset);
    expect(state.recovery).toMatch(/not present/);
  });

  it("deduplicates filter values", () => {
    const state = reduceWorkbench(createInitialWorkbenchState(dataset), { type: "set-filter", group: "kind", values: ["Actor", "Actor"] }, dataset);
    expect(state.filters.kind).toEqual(["Actor"]);
  });
});
