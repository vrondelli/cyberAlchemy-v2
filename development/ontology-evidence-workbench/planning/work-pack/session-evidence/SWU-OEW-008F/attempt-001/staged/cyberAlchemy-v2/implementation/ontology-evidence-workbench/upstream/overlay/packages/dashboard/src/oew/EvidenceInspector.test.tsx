// @ts-nocheck
import {describe, expect, it} from "vitest";
import {inspectorModel} from "./EvidenceInspector.tsx";

describe("inspectorModel", () => {
  it("keeps exact relation semantics separate from presentation semantics", () => {
    expect(inspectorModel({
      sourceRef: "C-SPECIALIZES-D2-D1",
      kind: "edge",
      row: {
        source_relation: "specializes",
        presentation_relation: "related",
        mapping_loss: "lossy",
        policy_disposition: "policy-indeterminate",
        diagnostics: ["POLICY_OWNER_UNBOUND"],
        evidence_refs: ["spec", "runtime"],
        grounding_inclusion: "excluded",
        authority_effect: "none",
      },
    })).toMatchObject({
      relation: "specializes",
      presentationRelation: "related",
      mappingLoss: "lossy",
      disposition: "policy-indeterminate",
      authorityEffect: "none",
    });
  });
});
