import { describe, expect, it } from "vitest";
import { filterFoundationDefinitions, WorkspaceFoundationAdapter } from "./foundation";

describe("Workspace Foundation adapter", () => {
  const adapter = new WorkspaceFoundationAdapter();
  const snapshot = adapter.inspectFoundation();

  it("exposes a deeply frozen source-bound no-authority projection", () => {
    expect(snapshot.authorityEffect).toBe("none");
    expect(snapshot.definitions).toHaveLength(13);
    expect(snapshot.sourceSet).toHaveLength(3);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.definitions[0])).toBe(true);
  });

  it("does not impersonate or bypass the Workspace Agent Control Plane", () => {
    expect(snapshot.integration.workspaceHostId).toBe("cyberalchemy-v2.workspace.runtime");
    expect(snapshot.integration.foundationMayCommitHostState).toBe(false);
    expect(snapshot.integration.invocationAvailable).toBe(false);
    expect(snapshot.integration.status).toBe("projection-current-host-rebind-required");
    expect(snapshot.legacyCandidate.hostControlPlane).toBe("ide-extension.manual-session-bridge/v2");
    expect(Object.getOwnPropertyNames(WorkspaceFoundationAdapter.prototype)).toEqual(["constructor", "inspectFoundation"]);
  });

  it("preserves identity, provenance, currentness, owner, boundary, and claim ceiling", () => {
    for (const definition of snapshot.definitions) {
      expect(definition.definitionId).toMatch(/^CAF-D\d+$/);
      expect(definition.sourceRef).toContain(`#${definition.definitionId}`);
      expect(definition.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(definition.currentness).toBe("current-at-generated-epoch");
      expect(definition.ownerRoute).toBeTruthy();
      expect(definition.boundary).toBeTruthy();
      expect(definition.claimCeiling).toBeTruthy();
    }
  });

  it("filters definitions without changing the projection", () => {
    expect(filterFoundationDefinitions(snapshot.definitions, "effect envelope").map((item) => item.definitionId)).toContain("CAF-D8");
    expect(snapshot.definitions).toHaveLength(13);
  });
});
