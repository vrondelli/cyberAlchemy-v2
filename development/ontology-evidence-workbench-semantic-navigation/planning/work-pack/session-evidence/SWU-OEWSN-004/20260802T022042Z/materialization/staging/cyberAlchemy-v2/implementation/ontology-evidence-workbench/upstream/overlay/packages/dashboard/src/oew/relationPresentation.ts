export const RELATION_PRESENTATION_RECORD_SCHEMA =
  "relation-presentation-record.v1";

const DIGEST = /^[a-f0-9]{64}$/;
const SOURCE_RELATION_SCHEMA = "body-war-business-relation/v1";
const SIDECAR_SCHEMA = "oew.evidence-sidecar.v1";

type UnknownRecord = Record<string, any>;

export type RelationEvidence = Readonly<{
  path: string;
  selector: string;
  sha256: string;
}>;

export type RelationPresentationRecord = Readonly<{
  schemaVersion: typeof RELATION_PRESENTATION_RECORD_SCHEMA;
  graphEdgeId: string;
  sourceRelationId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePredicate: string;
  sourceDirection: string;
  projectedDirection: string;
  presentationRelation: string;
  colorToken: string;
  linePatternToken: string;
  provenance: ReadonlyArray<RelationEvidence>;
  sourceAuthorityEffect: string;
  projectionAuthorityEffect: "none";
  traversalDirection?: "forward" | "reverse";
}>;

export type RelationPresentationInput = {
  graphEdgeId: string;
  graph: UnknownRecord;
  sidecar: UnknownRecord;
  sourceRelations: UnknownRecord;
  encoding: UnknownRecord;
  traversalDirection?: "forward" | "reverse" | null;
};

export class RelationPresentationError extends Error {
  issue: string;

  constructor(issue: string, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "RelationPresentationError";
    this.issue = issue;
  }
}

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requiredString = (value: unknown, issue: string): string => {
  if (typeof value !== "string" || !value) {
    throw new RelationPresentationError(issue);
  }
  return value;
};

const exactArray = (left: unknown[], right: unknown[]): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const frozenEvidence = (value: unknown): ReadonlyArray<RelationEvidence> => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new RelationPresentationError("SOURCE_EVIDENCE_REQUIRED");
  }
  return Object.freeze(
    value.map((candidate) => {
      if (!isRecord(candidate)) {
        throw new RelationPresentationError("SOURCE_EVIDENCE_INVALID");
      }
      const path = requiredString(candidate.path, "SOURCE_EVIDENCE_PATH");
      const selector = requiredString(
        candidate.selector,
        "SOURCE_EVIDENCE_SELECTOR",
      );
      const sha256 = requiredString(
        candidate.sha256,
        "SOURCE_EVIDENCE_DIGEST",
      );
      if (!DIGEST.test(sha256)) {
        throw new RelationPresentationError("SOURCE_EVIDENCE_DIGEST");
      }
      return Object.freeze({path, selector, sha256});
    }),
  );
};

/**
 * Derive one complete, non-authoritative presentation record from exact
 * admitted graph, sidecar, source-relation and encoding inputs.
 *
 */
export function deriveRelationPresentationRecord({
  graphEdgeId,
  graph,
  sidecar,
  sourceRelations,
  encoding,
  traversalDirection = null,
}: RelationPresentationInput): RelationPresentationRecord {
  requiredString(graphEdgeId, "GRAPH_EDGE_ID_REQUIRED");
  if (
    !isRecord(graph) ||
    graph.version !== "1.0.0" ||
    graph.kind !== "knowledge" ||
    !Array.isArray(graph.edges)
  ) {
    throw new RelationPresentationError("GRAPH_INVALID");
  }
  if (
    !isRecord(sidecar) ||
    sidecar.schema_version !== SIDECAR_SCHEMA ||
    sidecar.authority_effect !== "none" ||
    !isRecord(sidecar.edges)
  ) {
    throw new RelationPresentationError("SIDECAR_INVALID");
  }
  const sidecarEdge = sidecar.edges[graphEdgeId];
  if (!isRecord(sidecarEdge)) {
    throw new RelationPresentationError("SIDECAR_EDGE_MISSING", graphEdgeId);
  }
  if (sidecarEdge.authority_effect !== "none") {
    throw new RelationPresentationError("PROJECTION_AUTHORITY_INVALID");
  }

  const sourceRelationId = requiredString(
    sidecarEdge.source_ref,
    "SOURCE_RELATION_ID_REQUIRED",
  );
  if (graphEdgeId !== `presentation-edge:${sourceRelationId}`) {
    throw new RelationPresentationError("GRAPH_EDGE_ID_MISMATCH");
  }
  if (!isRecord(sourceRelations) || !Array.isArray(sourceRelations.relations)) {
    throw new RelationPresentationError("SOURCE_RELATION_SET_INVALID");
  }
  const sourceMatches = sourceRelations.relations.filter(
    (candidate) => isRecord(candidate) && candidate.relation_id === sourceRelationId,
  );
  if (sourceMatches.length === 0) {
    throw new RelationPresentationError("SOURCE_RELATION_MISSING");
  }
  if (sourceMatches.length !== 1) {
    throw new RelationPresentationError("SOURCE_RELATION_AMBIGUOUS");
  }
  const sourceRelation = sourceMatches[0];
  if (sourceRelation.schema_version !== SOURCE_RELATION_SCHEMA) {
    throw new RelationPresentationError("SOURCE_RELATION_SCHEMA");
  }

  const sourceNodeId = requiredString(
    sourceRelation.source_concept,
    "SOURCE_NODE_REQUIRED",
  );
  const targetNodeId = requiredString(
    sourceRelation.target_concept,
    "TARGET_NODE_REQUIRED",
  );
  const sourcePredicate = requiredString(
    sourceRelation.predicate,
    "SOURCE_PREDICATE_REQUIRED",
  );
  const sourceDirection = requiredString(
    sourceRelation.direction,
    "SOURCE_DIRECTION_REQUIRED",
  );
  const sourceAuthorityEffect = requiredString(
    sourceRelation.authority_effect,
    "SOURCE_AUTHORITY_REQUIRED",
  );
  const presentationRelation = requiredString(
    sidecarEdge.presentation_relation,
    "PRESENTATION_RELATION_REQUIRED",
  );
  if (
    sidecarEdge.source !== sourceNodeId ||
    sidecarEdge.target !== targetNodeId ||
    sidecarEdge.source_relation !== sourcePredicate
  ) {
    throw new RelationPresentationError("SIDECAR_SOURCE_MISMATCH");
  }

  const provenance = frozenEvidence(sourceRelation.evidence_refs);
  if (
    !Array.isArray(sidecarEdge.evidence_refs) ||
    !exactArray(
      sidecarEdge.evidence_refs,
      provenance.map((entry) => entry.path),
    )
  ) {
    throw new RelationPresentationError("SIDECAR_EVIDENCE_MISMATCH");
  }

  const expectedSource = `presentation:${sourceNodeId}`;
  const expectedTarget = `presentation:${targetNodeId}`;
  const graphMatches = graph.edges.filter(
    (candidate) =>
      isRecord(candidate) &&
      candidate.source === expectedSource &&
      candidate.target === expectedTarget &&
      candidate.description === sourcePredicate &&
      candidate.type === presentationRelation,
  );
  if (graphMatches.length === 0) {
    throw new RelationPresentationError("GRAPH_EDGE_MISSING");
  }
  if (graphMatches.length !== 1) {
    throw new RelationPresentationError("GRAPH_EDGE_AMBIGUOUS");
  }
  const projectedDirection = requiredString(
    graphMatches[0].direction,
    "PROJECTED_DIRECTION_REQUIRED",
  );

  if (
    !isRecord(encoding) ||
    encoding.authority_effect !== "none" ||
    !isRecord(encoding.predicateColorMap) ||
    !isRecord(encoding.colorTokens) ||
    !isRecord(encoding.presentationPatternMap) ||
    !isRecord(encoding.patternTokens)
  ) {
    throw new RelationPresentationError("ENCODING_INVALID");
  }
  const colorToken = requiredString(
    encoding.predicateColorMap[sourcePredicate],
    "PREDICATE_MAPPING_MISSING",
  );
  if (!isRecord(encoding.colorTokens[colorToken])) {
    throw new RelationPresentationError("COLOR_TOKEN_MISSING");
  }
  const linePatternToken = requiredString(
    encoding.presentationPatternMap[presentationRelation],
    "PRESENTATION_MAPPING_MISSING",
  );
  if (!isRecord(encoding.patternTokens[linePatternToken])) {
    throw new RelationPresentationError("PATTERN_TOKEN_MISSING");
  }
  if (
    traversalDirection !== null &&
    traversalDirection !== "forward" &&
    traversalDirection !== "reverse"
  ) {
    throw new RelationPresentationError("TRAVERSAL_DIRECTION_INVALID");
  }

  const record: RelationPresentationRecord = {
    schemaVersion: RELATION_PRESENTATION_RECORD_SCHEMA,
    graphEdgeId,
    sourceRelationId,
    sourceNodeId,
    targetNodeId,
    sourcePredicate,
    sourceDirection,
    projectedDirection,
    presentationRelation,
    colorToken,
    linePatternToken,
    provenance,
    sourceAuthorityEffect,
    projectionAuthorityEffect: "none",
    ...(traversalDirection === null ? {} : {traversalDirection}),
  };
  return Object.freeze(record);
}
