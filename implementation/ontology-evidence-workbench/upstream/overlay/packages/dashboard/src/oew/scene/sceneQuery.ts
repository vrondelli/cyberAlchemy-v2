import {
  admitKnowledgeSceneV13,
  finalizeKnowledgeScene,
  finalizeKnowledgeSceneV13,
  OEW_KNOWLEDGE_SCENE_V12,
  OEW_KNOWLEDGE_SCENE_V13,
} from "./relationReference.ts";
import {
  compilePortalDrafts,
  validatePortalSceneV13,
} from "./portalQuery.ts";

export const OEW_KNOWLEDGE_SCENE_SCHEMA = OEW_KNOWLEDGE_SCENE_V12;
export const OEW_KNOWLEDGE_SCENE_SCHEMA_V13 = OEW_KNOWLEDGE_SCENE_V13;

const SOURCE_GRAPH_SCHEMA = "oew.compiled-source-graph.v1";
const VIEW_PACK_SCHEMA = "oew.compiled-view-pack.v1";
const SCOPE_CAPS = {
  home: { nodes: 24, internal_relations: 48, portals: 12 },
  focus: { nodes: 32, internal_relations: 64, portals: 16 },
};

type JsonRecord = Record<string, unknown>;
type Scope = keyof typeof SCOPE_CAPS;
type SceneNode = JsonRecord & {source_node_id: string};
type SceneRelation = JsonRecord & {
  source_relation_id: string;
  source_node_id: string;
  target_node_id: string;
};
type CompiledSourceGraph = JsonRecord & {
  graph_digest: string;
  nodes: JsonRecord[];
  relations: JsonRecord[];
  node_by_id: Record<string, unknown>;
};
type CompiledViewPack = JsonRecord & {
  view_pack_id: string;
  view_pack_digest: string;
  graph_digest: string;
  clusters: JsonRecord[];
  cluster_by_id: Record<string, unknown>;
  cluster_id_by_node_id: Record<string, string>;
  default_cluster_id: string;
};
type NavigationFrame = JsonRecord & {focus_node_id?: string};

export class SceneQueryError extends Error {
  code: string;
  issues: string[];

  constructor(issues: string[] = []) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW scene query rejected: ${stableIssues.join(", ")}`);
    this.name = "SceneQueryError";
    this.code = "OEW_SCENE_QUERY_REJECTED";
    this.issues = stableIssues;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

const sceneNode = (node: JsonRecord): SceneNode => {
  const result: SceneNode = {
    source_node_id: node.source_node_id as string,
    label: node.label,
    node_kind: node.node_kind,
    role: node.role,
    icon_token: node.icon_token,
    evidence_refs: [...(node.evidence_refs as unknown[])],
    authority_effect: node.authority_effect,
  };
  if (hasOwn(node, "summary")) result.summary = node.summary;
  return result;
};

const sceneRelation = (relation: JsonRecord): SceneRelation => ({
  source_relation_id: relation.source_relation_id as string,
  source_node_id: relation.source_node_id as string,
  target_node_id: relation.target_node_id as string,
  exact_predicate: relation.exact_predicate,
  source_direction: relation.source_direction,
  presentation_family: relation.presentation_family,
  color_token: relation.color_token,
  pattern_token: relation.pattern_token,
  visible_label: relation.visible_label,
  direction_label: relation.direction_label,
  evidence_refs: [...(relation.evidence_refs as unknown[])],
  source_refs: [...(relation.source_refs as unknown[])],
  mapping_loss: relation.mapping_loss,
  authority_effect: relation.authority_effect,
  source_digest: relation.source_digest,
});

/** @param {JsonRecord} sourceGraph @param {JsonRecord} viewPack */
const validateCompiledInputs = (
  sourceGraph: JsonRecord,
  viewPack: JsonRecord,
) => {
  const issues: string[] = [];
  if (
    sourceGraph.schema_version !== SOURCE_GRAPH_SCHEMA ||
    !isNonemptyString(sourceGraph.graph_digest) ||
    !Array.isArray(sourceGraph.nodes) ||
    !Array.isArray(sourceGraph.relations) ||
    !isRecord(sourceGraph.node_by_id)
  ) {
    issues.push("SCENE_SOURCE_GRAPH_INVALID");
  }
  if (
    viewPack.schema_version !== VIEW_PACK_SCHEMA ||
    !isNonemptyString(viewPack.view_pack_id) ||
    !isNonemptyString(viewPack.view_pack_digest) ||
    !Array.isArray(viewPack.clusters) ||
    !isRecord(viewPack.cluster_by_id) ||
    !isRecord(viewPack.cluster_id_by_node_id) ||
    !isNonemptyString(viewPack.default_cluster_id)
  ) {
    issues.push("SCENE_VIEW_PACK_INVALID");
  }
  if (sourceGraph.graph_digest !== viewPack.graph_digest) {
    issues.push("SCENE_REVISION_MISMATCH");
  }
  return issues;
};

/** @param {JsonRecord} viewPack @param {JsonRecord} query @param {string[]} issues */
const resolveCluster = (
  viewPack: CompiledViewPack,
  query: JsonRecord,
  issues: string[],
) => {
  if (typeof query.scope !== "string" || !hasOwn(SCOPE_CAPS, query.scope)) {
    issues.push("SCENE_SCOPE_UNSUPPORTED");
    return null;
  }
  if (query.scope === "home") {
    const clusterId = query.cluster_id ?? viewPack.default_cluster_id;
    if (!isNonemptyString(clusterId) || !viewPack.cluster_by_id[clusterId]) {
      issues.push(`SCENE_CLUSTER_UNKNOWN:${String(clusterId)}`);
      return null;
    }
    return clusterId;
  }
  if (!isNonemptyString(query.focus_node_id)) {
    issues.push("SCENE_FOCUS_REQUIRED");
    return null;
  }
  const clusterId = viewPack.cluster_id_by_node_id[query.focus_node_id];
  if (!clusterId) {
    issues.push(`SCENE_FOCUS_UNKNOWN:${query.focus_node_id}`);
    return null;
  }
  if (query.cluster_id !== undefined && query.cluster_id !== clusterId) {
    issues.push(`SCENE_FOCUS_CLUSTER_MISMATCH:${query.focus_node_id}:${query.cluster_id}`);
    return null;
  }
  return clusterId;
};

/**
 * Compile the common semantic scene draft without selecting a scene schema or
 * manufacturing a revision. v1.2 and v1.3 wrappers own their finalization.
 *
 * @param {unknown} sourceGraphInput
 * @param {unknown} viewPackInput
 * @param {unknown} queryInput
 */
const compileSceneDraft = async (
  sourceGraphInput: unknown,
  viewPackInput: unknown,
  queryInput: unknown,
) => {
  if (!isRecord(sourceGraphInput)) {
    throw new SceneQueryError(["SCENE_SOURCE_GRAPH_INVALID"]);
  }
  if (!isRecord(viewPackInput)) {
    throw new SceneQueryError(["SCENE_VIEW_PACK_INVALID"]);
  }
  if (!isRecord(queryInput)) throw new SceneQueryError(["SCENE_QUERY_INVALID"]);

  const sourceGraph = sourceGraphInput as CompiledSourceGraph;
  const viewPack = viewPackInput as CompiledViewPack;
  const query = queryInput;
  const issues = validateCompiledInputs(sourceGraph, viewPack);
  const clusterId = resolveCluster(viewPack, query, issues);
  if (issues.length) throw new SceneQueryError(issues);
  if (clusterId === null) throw new SceneQueryError(["SCENE_CLUSTER_INVALID"]);
  const scope = query.scope as Scope;

  const cluster = viewPack.cluster_by_id[clusterId];
  if (!isRecord(cluster) || !Array.isArray(cluster.member_node_ids)) {
    throw new SceneQueryError([`SCENE_CLUSTER_INVALID:${clusterId}`]);
  }
  const visibleNodeIds = [...(cluster.member_node_ids as string[])].sort((left, right) =>
    left.localeCompare(right),
  );
  if (visibleNodeIds.length === 0) {
    throw new SceneQueryError([`SCENE_EMPTY:${clusterId}`]);
  }
  const caps = SCOPE_CAPS[scope];
  if (visibleNodeIds.length > caps.nodes) {
    issues.push(`SCENE_NODE_CAP_EXCEEDED:${visibleNodeIds.length}:${caps.nodes}`);
  }

  const visible = new Set(visibleNodeIds);
  const nodes: SceneNode[] = [];
  for (const nodeId of visibleNodeIds) {
    const node = sourceGraph.node_by_id[nodeId];
    if (!isRecord(node)) {
      issues.push(`SCENE_NODE_UNRESOLVED:${nodeId}`);
    } else {
      nodes.push(sceneNode(node));
    }
  }

  const internalRelations: SceneRelation[] = [];
  const cutRelations: SceneRelation[] = [];
  const relevantRelationIds: string[] = [];
  const destinationClusterIds = new Set<string>();
  for (const relation of sourceGraph.relations) {
    if (!isRecord(relation) || !isNonemptyString(relation.source_relation_id)) {
      issues.push("SCENE_RELATION_INVALID");
      continue;
    }
    const sourceNodeId = relation.source_node_id as string;
    const targetNodeId = relation.target_node_id as string;
    const sourceVisible = visible.has(sourceNodeId);
    const targetVisible = visible.has(targetNodeId);
    if (!sourceVisible && !targetVisible) continue;
    relevantRelationIds.push(relation.source_relation_id);
    if (sourceVisible && targetVisible) {
      internalRelations.push(sceneRelation(relation));
      continue;
    }
    cutRelations.push(sceneRelation(relation));
    const outsideNodeId = sourceVisible
      ? targetNodeId
      : sourceNodeId;
    const destinationClusterId = viewPack.cluster_id_by_node_id[outsideNodeId];
    if (!destinationClusterId) {
      issues.push(`SCENE_BOUNDARY_CLUSTER_UNRESOLVED:${outsideNodeId}`);
    } else {
      destinationClusterIds.add(destinationClusterId);
    }
  }

  internalRelations.sort((left, right) =>
    left.source_relation_id.localeCompare(right.source_relation_id),
  );
  cutRelations.sort((left, right) =>
    left.source_relation_id.localeCompare(right.source_relation_id),
  );
  relevantRelationIds.sort((left, right) => left.localeCompare(right));
  if (internalRelations.length > caps.internal_relations) {
    issues.push(
      `SCENE_INTERNAL_RELATION_CAP_EXCEEDED:${internalRelations.length}:${caps.internal_relations}`,
    );
  }
  if (destinationClusterIds.size > caps.portals) {
    issues.push(`SCENE_PORTAL_CAP_EXCEEDED:${destinationClusterIds.size}:${caps.portals}`);
  }

  const internalIds = new Set(
    internalRelations.map((relation) => relation.source_relation_id),
  );
  const cutIds = new Set(cutRelations.map((relation) => relation.source_relation_id));
  const partitionIds = [...internalIds, ...cutIds].sort((left, right) =>
    left.localeCompare(right),
  );
  if ([...internalIds].some((relationId) => cutIds.has(relationId))) {
    issues.push("SCENE_PARTITION_OVERLAP");
  }
  if (JSON.stringify(partitionIds) !== JSON.stringify(relevantRelationIds)) {
    issues.push("SCENE_PARTITION_NOT_TOTAL");
  }
  if (issues.length) throw new SceneQueryError(issues);

  const scopeToken =
    scope === "focus" ? `${clusterId}:${query.focus_node_id}` : clusterId;
  const frameId = `frame:${viewPack.view_pack_id}:${scope}:${scopeToken}`;
  const sceneId = `scene:${viewPack.view_pack_id}:${scope}:${scopeToken}`;
  const navigationFrame: NavigationFrame = {
    frame_id: frameId,
    graph_digest: sourceGraph.graph_digest,
    view_pack_id: viewPack.view_pack_id,
    view_pack_digest: viewPack.view_pack_digest,
    scope,
    selected: { kind: "none" },
    filters: {},
    index_state: {
      query: "",
      sort_key: "source-id",
      sort_direction: "ascending",
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    panel: { id: "none", modal: false },
    expanded_portal_ids: [] as string[],
    focus_fallback_order: [
      "initiating-control",
      "selected-entity",
      "scene-heading",
      "workbench-heading",
    ],
  };
  if (scope === "focus") {
    navigationFrame.focus_node_id = query.focus_node_id as string;
  }

  const completeIndexRows = sourceGraph.nodes.length + sourceGraph.relations.length;
  return {
    caps,
    visibleNodeIds,
    viewPack,
    draft: {
      scene_id: sceneId,
      graph_digest: sourceGraph.graph_digest,
      view_pack_id: viewPack.view_pack_id,
      view_pack_digest: viewPack.view_pack_digest,
      scope,
      nodes,
      internal_relations: internalRelations,
      cut_relations: cutRelations,
      clusters: [
        { cluster_id: clusterId, visible_member_node_ids: visibleNodeIds },
      ],
      legend: [],
      navigation_frame: navigationFrame,
      denominators: {
        source_nodes: sourceGraph.nodes.length,
        source_relations: sourceGraph.relations.length,
        scene_nodes: nodes.length,
        internal_relations: internalRelations.length,
        cut_relations: cutRelations.length,
        complete_index_rows: completeIndexRows,
        filtered_index_rows: completeIndexRows,
      },
    },
  };
};

/**
 * Preserve the existing v1.2 scene API and receipts unchanged.
 *
 * @param {unknown} sourceGraphInput
 * @param {unknown} viewPackInput
 * @param {unknown} queryInput
 */
export async function deriveScene(
  sourceGraphInput: unknown,
  viewPackInput: unknown,
  queryInput: unknown,
) {
  const { draft } = await compileSceneDraft(
    sourceGraphInput,
    viewPackInput,
    queryInput,
  );
  return finalizeKnowledgeScene({
    ...draft,
    schema_version: OEW_KNOWLEDGE_SCENE_SCHEMA,
    portals: [],
  });
}

/** @param {unknown} sceneInput */
export async function admitPortalSceneV13(sceneInput: unknown) {
  const admitted = await admitKnowledgeSceneV13(sceneInput);
  await validatePortalSceneV13(admitted);
  return admitted;
}

/**
 * Derive one reference-first v1.3 scene. Portal drafts are complete before the
 * sole finalization pass, then serialized and admitted before return.
 *
 * @param {unknown} sourceGraphInput
 * @param {unknown} viewPackInput
 * @param {unknown} queryInput
 */
export async function deriveSceneV13(
  sourceGraphInput: unknown,
  viewPackInput: unknown,
  queryInput: unknown,
) {
  const { caps, draft, viewPack, visibleNodeIds } = await compileSceneDraft(
    sourceGraphInput,
    viewPackInput,
    queryInput,
  );
  const portals = await compilePortalDrafts(
    draft.cut_relations,
    visibleNodeIds,
    viewPack,
    caps.portals,
  );
  const finalized = await finalizeKnowledgeSceneV13({
    ...draft,
    schema_version: OEW_KNOWLEDGE_SCENE_SCHEMA_V13,
    portals,
  });
  return admitPortalSceneV13(JSON.parse(JSON.stringify(finalized)));
}
