import { describe, expect, it } from "vitest";
import { isSurfaceVisible, initialLayout, changeLayout, type WorkspaceSurface } from "./layout";

describe("presentation-only layout", () => {
  it("applies and undoes without carrying draft or conversation fields", () => {
    const next = changeLayout(initialLayout, { type: "apply", preset: "canvas" });
    expect(next.preset).toBe("canvas");
    expect(changeLayout(next, { type: "undo" })).toEqual(initialLayout);
    expect(Object.keys(next).sort()).toEqual(["history", "pinned", "preset"]);
  });
  it("pin blocks apply and undo until explicitly unpinned", () => {
    const next = changeLayout(changeLayout(initialLayout, { type: "apply", preset: "writing" }), { type: "pin" });
    expect(changeLayout(next, { type: "apply", preset: "canvas" })).toBe(next);
    expect(changeLayout(next, { type: "undo" })).toBe(next);
    expect(changeLayout(changeLayout(next, { type: "pin" }), { type: "undo" })).toEqual(initialLayout);
  });
  it("does not create history for no-op changes", () => {
    expect(changeLayout(initialLayout, { type: "undo" })).toBe(initialLayout);
    expect(changeLayout(initialLayout, { type: "apply", preset: "balanced" })).toBe(initialLayout);
  });
});

const surfaces: WorkspaceSurface[] = ["frontend:orchestrator", "dashboard", "explore", "foundation", "ontology", "essays", "chat"];
describe("control center visibility", () => {
  for (const selected of surfaces) {
    it(`preserves normal navigation to ${selected}`, () => {
      expect(surfaces.filter(s => isSurfaceVisible(s, selected, false))).toEqual([selected]);
    });
    it(`retains one chat alongside ${selected}`, () => {
      expect(surfaces.filter(s => isSurfaceVisible(s, selected, true))).toEqual(
        surfaces.filter(s => s === selected || s === "chat"),
      );
    });
  }
});
