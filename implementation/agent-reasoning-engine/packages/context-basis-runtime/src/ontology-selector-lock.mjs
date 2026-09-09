import {
  canonicalizeJson,
  deepFreeze,
  digestValue,
  fail,
  isRecord,
  nonEmptyString,
  uniqueStrings,
} from "./canonical.mjs";

const SCHEMA_VERSION = "are.ontology-selector-lock/v1";

function sortedObjects(items, field) {
  return [...items].sort((a, b) => a[field].localeCompare(b[field]));
}

export function lockOntologySelectors(input) {
  if (!isRecord(input) || !isRecord(input.snapshot)) {
    return fail("ontology-selector-lock", ["ontology.snapshot-required"]);
  }
  const {snapshot} = input;
  const reasons = [];
  if (!nonEmptyString(snapshot.ontology_id)) reasons.push("ontology.id-required");
  if (!nonEmptyString(snapshot.source_identity)) reasons.push("ontology.source-identity-required");
  if (!Array.isArray(snapshot.nodes)) reasons.push("ontology.nodes-required");
  if (!Array.isArray(snapshot.edges)) reasons.push("ontology.edges-required");
  if (reasons.length > 0) return fail("ontology-selector-lock", reasons);

  const nodes = new Map();
  for (const node of snapshot.nodes) {
    if (!isRecord(node) || !nonEmptyString(node.node_id) || !nonEmptyString(node.source_digest)) {
      reasons.push("ontology.node-identity-incomplete");
      continue;
    }
    const id = node.node_id.trim();
    if (nodes.has(id)) reasons.push("ontology.duplicate-node-id");
    else nodes.set(id, node);
  }
  const edges = new Map();
  for (const edge of snapshot.edges) {
    if (!isRecord(edge)
      || !nonEmptyString(edge.edge_id)
      || !nonEmptyString(edge.edge_type)
      || !nonEmptyString(edge.from_node_id)
      || !nonEmptyString(edge.to_node_id)
      || !nonEmptyString(edge.source_digest)) {
      reasons.push("ontology.edge-identity-incomplete");
      continue;
    }
    const id = edge.edge_id.trim();
    if (edges.has(id)) reasons.push("ontology.duplicate-edge-id");
    else edges.set(id, edge);
  }
  if (reasons.length > 0) return fail("ontology-selector-lock", reasons);

  const selectedNodeIds = new Set();
  const edgeQueue = uniqueStrings(input.required_edge_ids);
  for (const id of uniqueStrings(input.initial_node_ids)) {
    if (!nodes.has(id)) reasons.push("ontology.required-node-missing");
    else selectedNodeIds.add(id);
  }
  const selectedEdgeIds = new Set();

  function includeNode(id) {
    const node = nodes.get(id);
    if (!node) {
      reasons.push("ontology.required-endpoint-missing");
      return;
    }
    if (selectedNodeIds.has(id)) return;
    selectedNodeIds.add(id);
    edgeQueue.push(...uniqueStrings(node.required_edge_ids));
  }
  for (const id of [...selectedNodeIds].sort()) {
    edgeQueue.push(...uniqueStrings(nodes.get(id).required_edge_ids));
  }
  while (edgeQueue.length > 0) {
    edgeQueue.sort();
    const edgeId = edgeQueue.shift();
    if (selectedEdgeIds.has(edgeId)) continue;
    const edge = edges.get(edgeId);
    if (!edge) {
      reasons.push("ontology.required-edge-missing");
      continue;
    }
    selectedEdgeIds.add(edgeId);
    includeNode(edge.from_node_id.trim());
    includeNode(edge.to_node_id.trim());
  }
  if (reasons.length > 0) return fail("ontology-selector-lock", reasons);

  const selectedNodes = sortedObjects([...selectedNodeIds].map((id) => {
    const node = nodes.get(id);
    return {
      node_id: id,
      node_type: nonEmptyString(node.node_type) ? node.node_type.trim() : null,
      source_digest: node.source_digest.trim(),
      source_ref: nonEmptyString(node.source_ref) ? node.source_ref.trim() : null,
      content: node.content ?? null,
      selection_reason: uniqueStrings(input.initial_node_ids).includes(id) ? "declared-initial-node" : "required-edge-endpoint",
    };
  }), "node_id");
  const selectedEdges = sortedObjects([...selectedEdgeIds].map((id) => {
    const edge = edges.get(id);
    return {
      edge_id: id,
      edge_type: edge.edge_type.trim(),
      from_node_id: edge.from_node_id.trim(),
      to_node_id: edge.to_node_id.trim(),
      source_digest: edge.source_digest.trim(),
      source_ref: nonEmptyString(edge.source_ref) ? edge.source_ref.trim() : null,
      content: edge.content ?? null,
      selection_reason: "declared-or-recursively-required-edge",
    };
  }), "edge_id");
  const bindingLock = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    ontology_id: snapshot.ontology_id.trim(),
    source_identity: snapshot.source_identity.trim(),
    initial_node_ids: uniqueStrings(input.initial_node_ids),
    required_edge_ids: uniqueStrings(input.required_edge_ids),
    nodes: selectedNodes,
    edges: selectedEdges,
    authority_effect: "none",
  });
  const omissionCandidates = uniqueStrings(input.omission_candidate_ids).map((id) => ({
    selector_id: id,
    present_in_snapshot: nodes.has(id) || edges.has(id),
    posture: "diagnostic-only-not-selected",
  }));
  const omissionAudit = canonicalizeJson({
    schema_version: "are.ontology-omission-audit/v1",
    candidates: omissionCandidates,
    widened_binding: false,
    snapshot_digest: nonEmptyString(snapshot.snapshot_digest) ? snapshot.snapshot_digest.trim() : null,
    authority_effect: "none",
  });
  const digest = digestValue(bindingLock);
  return deepFreeze(canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    ok: true,
    value: bindingLock,
    binding_lock: bindingLock,
    digest,
    omission_audit: omissionAudit,
    excluded_node_ids: [...nodes.keys()].filter((id) => !selectedNodeIds.has(id)).sort(),
    excluded_edge_ids: [...edges.keys()].filter((id) => !selectedEdgeIds.has(id)).sort(),
    authority_effect: "none",
  }));
}
