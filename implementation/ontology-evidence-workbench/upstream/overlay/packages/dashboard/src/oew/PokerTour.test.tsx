// @ts-nocheck
import {describe, expect, it} from "vitest";
import tour from "./tours/poker-o13.json";

describe("Poker O13 tour", () => {
  it("keeps exact lineage, conflict, policy residue, and receipt in order", () => {
    expect(tour.steps.map((step) => step.focus)).toEqual([
      "F1",
      "R1",
      "D1",
      "D2",
      "C-SPECIALIZES-D2-D1",
      "receipt",
    ]);
    expect(tour.authority_effect).toBe("none");
  });
});
