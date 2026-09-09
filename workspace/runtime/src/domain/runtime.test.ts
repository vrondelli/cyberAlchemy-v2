import { describe, expect, it } from "vitest";
import { WorkspaceRuntime } from "./runtime";

describe("InspectWorkspace", () => {
  it("exposes one stable deeply frozen no-effect snapshot", () => {
    const runtime = new WorkspaceRuntime();
    const first = runtime.inspectWorkspace();
    const second = runtime.inspectWorkspace();
    expect(first).toBe(second);
    expect(first.authorityEffect).toBe("none");
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.projects)).toBe(true);
    expect(Object.isFrozen(first.projects[0])).toBe(true);
  });

  it("has no mutating public runtime operations", () => {
    const prototype = Object.getOwnPropertyNames(WorkspaceRuntime.prototype).filter((name) => name !== "constructor");
    expect(prototype).toEqual(["inspectWorkspace"]);
  });
});
