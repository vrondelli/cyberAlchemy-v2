import { describe, expect, it } from "vitest";
import { WorkspaceRuntime } from "./runtime";
import { filterWorkspaceRecords, toWorkspaceViewModel, WORKSPACE_COLLECTIONS } from "./workspace";

describe("Workspace Snapshot", () => {
  const snapshot = new WorkspaceRuntime().inspectWorkspace();

  it("keeps four non-collapsible populated collections", () => {
    const view = toWorkspaceViewModel(snapshot);
    expect(Object.keys(view.collections)).toEqual([...WORKSPACE_COLLECTIONS]);
    for (const collection of WORKSPACE_COLLECTIONS) expect(view.collections[collection].length).toBeGreaterThan(0);
  });

  it("preserves every required projection field and the bound source epoch", () => {
    for (const collection of WORKSPACE_COLLECTIONS) {
      for (const record of snapshot[collection]) {
        expect(record.collection).toBe(collection);
        expect(record.recordId).toBeTruthy();
        expect(record.label).toBeTruthy();
        expect(record.status).toBeTruthy();
        expect(record.meaning).toBeTruthy();
        expect(record.ownerRoute).toBeTruthy();
        expect(record.sourceRefs.length).toBeGreaterThan(0);
        expect(record.boundary).toBeTruthy();
        expect(record.claimCeiling).toBeTruthy();
        expect(record.sourceEpoch).toBe(snapshot.sourceEpoch);
      }
    }
  });

  it("represents Essays only as a separately owned Project entry", () => {
    const essays = snapshot.projects.find((record) => record.recordId === "CA2-PROJECT-ESSAYS");
    expect(essays?.ownerRoute).toBe("Essays Project owner");
    expect(essays?.projectEntryRef).toBe("#/projects/CA2-PROJECT-ESSAYS");
    expect(essays?.boundary).toContain("does not own Essays");
  });

  it("searches identity and meaning without changing the snapshot", () => {
    const results = filterWorkspaceRecords(snapshot.definitions, "construction invariant");
    expect(results.some((record) => record.recordId === "CAV2-D65")).toBe(true);
    expect(snapshot.definitions.length).toBeGreaterThan(results.length);
  });
});
