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

  it("shows one exact v1.3 binding with redundant encoding cues", () => {
    expect(inspectorModel({
      sourceRef: "legacy",
      kind: "edge",
      row: {
        mapping_loss: "exact",
        policy_disposition: "policy-pass",
        diagnostics: [],
        authority_effect: "none",
      },
      relationProjection: {
        ref: {source_relation_id: "relation-a", scene_digest: "a".repeat(64)},
        relation_digest: "b".repeat(64),
        predicate: "confirms",
        endpoints: {source_node_id: "runner", target_node_id: "track"},
        source_direction: "forward",
        evidence_refs: ["evidence:a"],
        mapping_loss: "exact",
        authority_effect: "none",
        display_cues: {presentation_family: "workflow"},
        encoding: {
          color_token: "edge.predicate.confirms",
          color_dark: "#11aa77",
          pattern_label: "solid directed",
          direction_text: "runner confirms track",
        },
      },
    })).toMatchObject({
      sourceRef: "relation-a",
      relationId: "relation-a",
      relation: "confirms",
      endpoints: "runner → track",
      directionText: "runner confirms track",
      colorToken: "edge.predicate.confirms",
      pattern: "solid directed",
    });
  });
});
