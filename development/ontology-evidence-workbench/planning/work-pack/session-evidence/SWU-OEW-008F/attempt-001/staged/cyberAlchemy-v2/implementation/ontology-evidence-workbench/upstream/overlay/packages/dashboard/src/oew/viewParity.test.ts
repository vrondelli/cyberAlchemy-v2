// @ts-nocheck
import {describe, expect, it} from "vitest";
import {assertViewParity, GROUNDING_PATH, paritySnapshot, VISIBLE_RESIDUE} from "./viewParity.ts";

describe("view parity contract", () => {
  it("uses one selection snapshot for all three surfaces", () => {
    const bundle = {
      graph: {nodes: []},
      sidecar: {nodes: {}},
      sourceRefIndex: {},
    };
    const snapshots = paritySnapshot(bundle, {selectedSourceRef: "F1"});
    expect(assertViewParity(snapshots)).toBe(true);
    expect(GROUNDING_PATH).toEqual(["F1", "R1", "D1"]);
    expect(VISIBLE_RESIDUE).toEqual(["D2"]);
  });
});
