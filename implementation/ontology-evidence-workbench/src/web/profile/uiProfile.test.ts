import { describe, expect, it } from "vitest";
import { compileUiProfile } from "./compileUiProfile";

describe("UI responsibility profile", () => {
  it("compiles deterministically as candidate-only", () => {
    const left = compileUiProfile();
    const right = compileUiProfile();
    expect(left.digestInput).toBe(right.digestInput);
    expect(left.provenance).toContain("candidate-only");
  });

  it("rejects dangling ownership", () => {
    expect(() => compileUiProfile({ schemaVersion: "oew.ui-profile.v1", provenance: "candidate-only:domainspec-v2-ui-meta-types", records: [{ id: "hook.keyboard", metaType: "Hook", label: "Keys", owns: ["missing"], inputs: [], outputs: [], evidenceSurface: "test" }] })).toThrow(/Dangling/);
  });

  it("rejects authority inflation", () => {
    expect(() => compileUiProfile({ schemaVersion: "oew.ui-profile.v1", provenance: "candidate-only:domainspec-v2-ui-meta-types", records: [{ id: "hook.keyboard", metaType: "Hook", label: "Production authority", owns: [], inputs: [], outputs: [], evidenceSurface: "test" }] })).toThrow(/Authority/);
  });
});
