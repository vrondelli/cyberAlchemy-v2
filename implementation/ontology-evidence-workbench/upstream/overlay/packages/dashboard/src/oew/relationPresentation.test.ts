// @ts-nocheck
import {describe, expect, it} from "vitest";
import {
  deriveRelationPresentationRecord,
  RelationPresentationError,
} from "./relationPresentation.ts";
import {createRelationEncodingRegistry} from "./relationEncoding.ts";

const digest = "a".repeat(64);
const evidence = [{path: "docs/mappings.md", selector: "Relation", sha256: digest}];
const sourceRelation = {
  schema_version: "body-war-business-relation/v1",
  relation_id: "body-war.relation.example",
  source_concept: "body-war.business.operation.example",
  target_concept: "body-war.business.entity.result",
  predicate: "produces",
  direction: "directed",
  authority_effect: "blocked",
  evidence_refs: evidence,
};
const graphEdge = {
  source: "presentation:body-war.business.operation.example",
  target: "presentation:body-war.business.entity.result",
  description: "produces",
  type: "related",
  direction: "forward",
};
const graph = {version: "1.0.0", kind: "knowledge", edges: [graphEdge]};
const sidecar = {
  schema_version: "oew.evidence-sidecar.v1",
  authority_effect: "none",
  edges: {
    "presentation-edge:body-war.relation.example": {
      authority_effect: "none",
      source_ref: "body-war.relation.example",
      source: "body-war.business.operation.example",
      target: "body-war.business.entity.result",
      source_relation: "produces",
      presentation_relation: "related",
      evidence_refs: ["docs/mappings.md"],
    },
  },
};
const sourceRelations = {relations: [sourceRelation]};
const encoding = {
  authority_effect: "none",
  predicateColorMap: {produces: "edge.data.produces"},
  colorTokens: {"edge.data.produces": {dark: "#1B84B1", light: "#197EA9"}},
  presentationPatternMap: {related: "edge.pattern.dashed"},
  patternTokens: {"edge.pattern.dashed": {label: "dashed"}},
};
const edgeId = "presentation-edge:body-war.relation.example";
const derive = (changed = {}) =>
  deriveRelationPresentationRecord({
    graphEdgeId: edgeId,
    graph,
    sidecar,
    sourceRelations,
    encoding,
    ...changed,
  });
const expectIssue = (operation, expected) => {
  try {
    operation();
  } catch (error) {
    expect(error).toBeInstanceOf(RelationPresentationError);
    expect(error.issue).toBe(expected);
    return;
  }
  throw new Error(`Expected ${expected}`);
};

describe("relation presentation record", () => {
  it("preserves exact semantics and fails closed on every lossy seam", () => {
    const record = derive();
    expect(record).toEqual({
      schemaVersion: "relation-presentation-record.v1",
      graphEdgeId: edgeId,
      sourceRelationId: "body-war.relation.example",
      sourceNodeId: "body-war.business.operation.example",
      targetNodeId: "body-war.business.entity.result",
      sourcePredicate: "produces",
      sourceDirection: "directed",
      projectedDirection: "forward",
      presentationRelation: "related",
      colorToken: "edge.data.produces",
      linePatternToken: "edge.pattern.dashed",
      provenance: evidence,
      sourceAuthorityEffect: "blocked",
      projectionAuthorityEffect: "none",
    });
    expect(derive({traversalDirection: "reverse"})).toMatchObject({
      sourceDirection: "directed",
      projectedDirection: "forward",
      traversalDirection: "reverse",
    });
    expectIssue(
      () => derive({graph: {...graph, edges: []}}),
      "GRAPH_EDGE_MISSING",
    );
    expectIssue(
      () => derive({graph: {...graph, edges: [graphEdge, graphEdge]}}),
      "GRAPH_EDGE_AMBIGUOUS",
    );
    expectIssue(
      () => derive({encoding: {...encoding, predicateColorMap: {}}}),
      "PREDICATE_MAPPING_MISSING",
    );
    expectIssue(
      () => derive({encoding: {...encoding, patternTokens: {}}}),
      "PATTERN_TOKEN_MISSING",
    );
    expectIssue(
      () => derive({
        sourceRelations: {
          relations: [{...sourceRelation, evidence_refs: []}],
        },
      }),
      "SOURCE_EVIDENCE_REQUIRED",
    );
    expectIssue(
      () => derive({
        sourceRelations: {
          relations: [{...sourceRelation, authority_effect: ""}],
        },
      }),
      "SOURCE_AUTHORITY_REQUIRED",
    );
    expectIssue(
      () => derive({
        sidecar: {
          ...sidecar,
          edges: {
            [edgeId]: {...sidecar.edges[edgeId], target: "wrong"},
          },
        },
      }),
      "SIDECAR_SOURCE_MISMATCH",
    );
  });

  it("admits predicate-owned colors without replacing exact text", () => {
    const registry = createRelationEncodingRegistry({
      ...encoding,
      minimum_graphical_contrast: 4.5,
      colorTokens: {
        "edge.data.produces": {
          predicate: "produces",
          dark: "#1B84B1",
          dark_contrast: 4.6,
          light: "#197EA9",
          light_contrast: 4.7,
        },
      },
      patternTokens: {
        "edge.pattern.dashed": {label: "dashed", stroke_dasharray: "6 4"},
      },
    });
    expect(registry.predicateColorMap.produces).toBe("edge.data.produces");
    expect(registry.patternTokens["edge.pattern.dashed"].label).toBe("dashed");
  });
});
