const RELATION_MAPPING = Object.freeze({
  contradicts: Object.freeze({
    presentationType: "contradicts",
    mappingLoss: "exact",
  }),
  "derives-from": Object.freeze({
    presentationType: "builds_on",
    mappingLoss: "generalized",
  }),
  specializes: Object.freeze({
    presentationType: "related",
    mappingLoss: "lossy",
  }),
});

const POLICY_DISPOSITIONS = new Set([
  "not-applicable",
  "policy-fail",
  "policy-indeterminate",
  "policy-pass",
]);
const GROUNDING_STATES = new Set(["excluded", "included", "not-applicable"]);
const REQUIRED_TEXT_FIELDS = Object.freeze([
  "relation_id",
  "source",
  "exact_relation",
  "target",
  "policy_disposition",
  "grounding_inclusion",
]);

export class EdgeProjectionError extends Error {
  constructor(issues) {
    const stableIssues = [...new Set(issues)].sort();
    super(`edge projection rejected: ${stableIssues.join(",")}`);
    this.name = "EdgeProjectionError";
    this.code = "OEW_EDGE_PROJECTION_REJECTED";
    this.issues = stableIssues;
  }
}

function stableEdgeId(relation) {
  return `presentation-edge:${relation.source}:${relation.exact_relation}:${relation.target}`;
}

function validateRelation(relation, index, sourceNodeIds, seenIds, seenEdges, issues) {
  if (relation === null || typeof relation !== "object" || Array.isArray(relation)) {
    issues.push(`RELATION_INVALID:${index}`);
    return;
  }
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (typeof relation[field] !== "string" || relation[field].length === 0) {
      issues.push(`RELATION_FIELD_INVALID:${index}:${field}`);
    }
  }
  if (typeof relation.relation_id === "string" && relation.relation_id.length > 0) {
    if (seenIds.has(relation.relation_id)) {
      issues.push(`DUPLICATE_RELATION_ID:${relation.relation_id}`);
    }
    seenIds.add(relation.relation_id);
  }
  if (!Object.hasOwn(RELATION_MAPPING, relation.exact_relation)) {
    issues.push(`UNKNOWN_RELATION:${relation.exact_relation ?? "<missing>"}`);
  }
  if (!sourceNodeIds.has(relation.source)) {
    issues.push(`MISSING_ENDPOINT:${relation.relation_id ?? index}:source:${relation.source ?? "<missing>"}`);
  }
  if (!sourceNodeIds.has(relation.target)) {
    issues.push(`MISSING_ENDPOINT:${relation.relation_id ?? index}:target:${relation.target ?? "<missing>"}`);
  }
  if (typeof relation.source === "string" && typeof relation.target === "string" &&
      typeof relation.exact_relation === "string") {
    const edgeId = stableEdgeId(relation);
    if (seenEdges.has(edgeId)) issues.push(`DUPLICATE_PRESENTATION_EDGE:${edgeId}`);
    seenEdges.add(edgeId);
  }
  if (!POLICY_DISPOSITIONS.has(relation.policy_disposition)) {
    issues.push(`POLICY_DISPOSITION_INVALID:${relation.relation_id ?? index}`);
  }
  if (!GROUNDING_STATES.has(relation.grounding_inclusion)) {
    issues.push(`GROUNDING_INCLUSION_INVALID:${relation.relation_id ?? index}`);
  }
  if (!Array.isArray(relation.diagnostics) ||
      relation.diagnostics.some((item) => typeof item !== "string" || item.length === 0)) {
    issues.push(`DIAGNOSTICS_INVALID:${relation.relation_id ?? index}`);
  }
  if (!Array.isArray(relation.evidence_refs) ||
      relation.evidence_refs.some((item) => typeof item !== "string" || item.length === 0)) {
    issues.push(`EVIDENCE_REFS_INVALID:${relation.relation_id ?? index}`);
  }
  if (relation.authority_effect !== "none") {
    issues.push(`AUTHORITY_EFFECT_FORBIDDEN:${relation.relation_id ?? index}`);
  }
  if (relation.exact_relation === "specializes" &&
      (relation.policy_disposition !== "policy-indeterminate" ||
       !relation.diagnostics.includes("POLICY_OWNER_UNBOUND") ||
       relation.grounding_inclusion !== "excluded")) {
    issues.push(`SPECIALIZES_POLICY_STATE_INVALID:${relation.relation_id ?? index}`);
  }
}

function projectRelation(relation) {
  const mapping = RELATION_MAPPING[relation.exact_relation];
  const presentationEdge = {
    source: `presentation:${relation.source}`,
    target: `presentation:${relation.target}`,
    type: mapping.presentationType,
    direction: "forward",
    description: relation.exact_relation,
    weight: 1,
  };
  const sidecar = {
    source_ref: relation.relation_id,
    source: relation.source,
    target: relation.target,
    source_relation: relation.exact_relation,
    presentation_relation: mapping.presentationType,
    mapping_loss: mapping.mappingLoss,
    policy_disposition: relation.policy_disposition,
    diagnostics: [...relation.diagnostics].sort(),
    grounding_inclusion: relation.grounding_inclusion,
    evidence_refs: [...new Set(relation.evidence_refs)].sort(),
    authority_effect: "none",
  };
  return { id: stableEdgeId(relation), presentationEdge, sidecar };
}

export function projectPresentationEdges(sourceSubset) {
  const issues = [];
  if (sourceSubset === null || typeof sourceSubset !== "object" || Array.isArray(sourceSubset)) {
    throw new EdgeProjectionError(["SOURCE_RELATION_SUBSET_INVALID"]);
  }
  if (sourceSubset.schema_version !== "oew-source-relation-subset/v1") {
    issues.push(`SOURCE_RELATION_SUBSET_VERSION_UNSUPPORTED:${sourceSubset.schema_version ?? "<missing>"}`);
  }
  if (sourceSubset.authority_effect !== "none") {
    issues.push("AUTHORITY_EFFECT_FORBIDDEN:source_subset");
  }
  const sourceNodeIds = new Set();
  if (!Array.isArray(sourceSubset.source_node_ids) ||
      sourceSubset.source_node_ids.some((id) => typeof id !== "string" || id.length === 0)) {
    issues.push("SOURCE_NODE_IDS_INVALID");
  } else {
    for (const id of sourceSubset.source_node_ids) {
      if (sourceNodeIds.has(id)) issues.push(`DUPLICATE_SOURCE_NODE_ID:${id}`);
      sourceNodeIds.add(id);
    }
  }
  if (!Array.isArray(sourceSubset.relations)) {
    issues.push("SOURCE_RELATIONS_INVALID");
  } else {
    const seenIds = new Set();
    const seenEdges = new Set();
    sourceSubset.relations.forEach((relation, index) =>
      validateRelation(relation, index, sourceNodeIds, seenIds, seenEdges, issues));
  }
  if (issues.length > 0) throw new EdgeProjectionError(issues);

  const projected = sourceSubset.relations
    .map(projectRelation)
    .sort((left, right) => left.id.localeCompare(right.id));
  const sidecarEdges = Object.fromEntries(
    projected.map(({ id, sidecar }) => [id, sidecar]),
  );
  const byLoss = Object.fromEntries(
    ["exact", "generalized", "lossy"].map((loss) => [
      loss,
      projected.filter(({ sidecar }) => sidecar.mapping_loss === loss).length,
    ]),
  );

  return {
    schema_version: "oew-relation-projection/v1",
    presentation_edges: projected.map(({ presentationEdge }) => presentationEdge),
    sidecar_edges: sidecarEdges,
    counts: {
      source_relations: projected.length,
      presentation_edges: projected.length,
      sidecar_edges: Object.keys(sidecarEdges).length,
      by_mapping_loss: byLoss,
    },
    authority_effect: "none",
  };
}

export const supportedSourceRelations = Object.freeze(
  Object.keys(RELATION_MAPPING).sort(),
);
