import {
  computeSourceGraphDigest,
  OEW_COMPILED_SOURCE_GRAPH_SCHEMA,
  OEW_SOURCE_GRAPH_RECEIPT_SCHEMA,
} from "./sourceGraph.ts";
import {
  OEW_COMPILED_VIEW_PACK_SCHEMA,
  OEW_VIEW_PACK_RECEIPT_SCHEMA,
} from "./viewPack.ts";
import {
  admitKnowledgeScene,
  finalizeKnowledgeScene,
  finalizeKnowledgeSceneV13,
  OEW_KNOWLEDGE_SCENE_V12,
  OEW_KNOWLEDGE_SCENE_V13,
} from "./relationReference.ts";

export const OEW_SCENE_MIGRATION_RECEIPT_SCHEMA =
  "oew.scene-migration-receipt.v1";
export const OEW_SCENE_MIGRATION_V13_RECEIPT_SCHEMA =
  "oew.scene-migration-receipt.v1.3";

const LEGACY_SCENE_SCHEMAS = new Set([
  "oew.knowledge-scene.v1",
  "oew.knowledge-scene.v1.1",
]);
const DIGEST = /^[a-f0-9]{64}$/;
const LEGACY_SCENE_KEYS = [
  "clusters",
  "cut_relations",
  "denominators",
  "graph_digest",
  "internal_relations",
  "legend",
  "navigation_frame",
  "nodes",
  "path_result",
  "portals",
  "scene_id",
  "schema_version",
  "scope",
  "view_pack_digest",
  "view_pack_id",
];
const REQUIRED_LEGACY_SCENE_KEYS = LEGACY_SCENE_KEYS.filter(
  (key) => key !== "path_result",
);
const V12_SCENE_KEYS = [
  ...LEGACY_SCENE_KEYS,
  "path",
  "relation_index_receipt",
  "scene_digest",
];
const REQUIRED_V12_SCENE_KEYS = [
  ...REQUIRED_LEGACY_SCENE_KEYS,
  "relation_index_receipt",
  "scene_digest",
];
export const OEW_LEGACY_RELATION_FIELDS = Object.freeze([
  "source_relation_id",
  "source_node_id",
  "target_node_id",
  "exact_predicate",
  "source_direction",
  "presentation_family",
  "color_token",
  "pattern_token",
  "visible_label",
  "direction_label",
  "evidence_refs",
  "mapping_loss",
  "authority_effect",
]);

type JsonRecord = Record<string, unknown>;
type CompiledSourceGraph = JsonRecord & {
  graph_digest: string;
  source_digests: JsonRecord;
  nodes: JsonRecord[];
  relations: JsonRecord[];
  node_by_id: JsonRecord;
  relation_by_id: JsonRecord;
  receipt: JsonRecord;
};
type CompiledViewPack = JsonRecord & {
  graph_digest: string;
  view_pack_id: string;
  view_pack_digest: string;
  clusters: unknown[];
  sequences: unknown[];
  receipt: JsonRecord;
};

export class SceneMigrationError extends Error {
  code: string;
  issues: readonly string[];

  constructor(issues: readonly string[]) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW scene migration rejected: ${stableIssues.join(", ")}`);
    this.name = "SceneMigrationError";
    this.code = "OEW_SCENE_MIGRATION_REJECTED";
    this.issues = Object.freeze(stableIssues);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

/** @param {JsonRecord} value @param {readonly string[]} required @param {readonly string[]} allowed */
const hasDeclaredShape = (
  value: JsonRecord,
  required: readonly string[],
  allowed: readonly string[],
) => {
  const keys = Object.keys(value);
  return (
    required.every((key) => hasOwn(value, key)) &&
    keys.every((key) => allowed.includes(key))
  );
};

const cloneJson = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(cloneJson) as T;
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneJson(child)]),
    ) as T;
  }
  return value;
};

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** @param {unknown} left @param {unknown} right */
const exactValue = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

/** @param {unknown} value */
const hasNonemptyHops = (value: unknown) => {
  if (value === undefined || value === null) return false;
  if (!isRecord(value) || !Array.isArray(value.hops)) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_PATH_INVALID"]);
  }
  return value.hops.length > 0;
};

/** @param {JsonRecord} scene */
const assertReferenceStructuresAreRebuildable = (scene: JsonRecord) => {
  if (!Array.isArray(scene.portals)) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_PORTALS_INVALID"]);
  }
  const selected = isRecord(scene.navigation_frame)
    ? scene.navigation_frame.selected
    : undefined;
  const relationSelected =
    isRecord(selected) &&
    (selected.kind === "relation" ||
      selected.kind === "path-hop" ||
      hasOwn(selected, "relation_ref"));
  if (
    scene.portals.length > 0 ||
    hasNonemptyHops(scene.path) ||
    hasNonemptyHops(scene.path_result) ||
    relationSelected
  ) {
    throw new SceneMigrationError(["LEGACY_SCENE_REBUILD_REQUIRED"]);
  }
};

/** @param {string} left @param {string} right */
const compareCodePoints = (left: string, right: string) => {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0) ?? 0);
  const rightPoints = Array.from(right, (value) => value.codePointAt(0) ?? 0);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) {
      return leftPoints[index] - rightPoints[index];
    }
  }
  return leftPoints.length - rightPoints.length;
};

/** @param {JsonRecord} sourceGraph */
const validateSourceGraph = async (sourceGraph: JsonRecord) => {
  const issues: string[] = [];
  if (
    sourceGraph.schema_version !== OEW_COMPILED_SOURCE_GRAPH_SCHEMA ||
    !DIGEST.test(String(sourceGraph.graph_digest)) ||
    !isRecord(sourceGraph.source_digests) ||
    !Array.isArray(sourceGraph.nodes) ||
    !Array.isArray(sourceGraph.relations) ||
    !isRecord(sourceGraph.node_by_id) ||
    !isRecord(sourceGraph.relation_by_id) ||
    !isRecord(sourceGraph.receipt)
  ) {
    throw new SceneMigrationError(["MIGRATION_SOURCE_GRAPH_INVALID"]);
  }
  const compiled = sourceGraph as CompiledSourceGraph;
  const sourceSchema = sourceGraph.receipt.source_schema_version;
  const actualDigest = await computeSourceGraphDigest({
    schema_version: sourceSchema,
    source_digests: compiled.source_digests,
    nodes: compiled.nodes,
    relations: compiled.relations,
  });
  if (actualDigest !== sourceGraph.graph_digest) {
    issues.push("MIGRATION_SOURCE_GRAPH_DIGEST_MISMATCH");
  }
  if (
    sourceGraph.receipt.schema_version !== OEW_SOURCE_GRAPH_RECEIPT_SCHEMA ||
    sourceGraph.receipt.result !== "pass" ||
    sourceGraph.receipt.graph_digest !== sourceGraph.graph_digest ||
    compiled.receipt.relation_count !== compiled.relations.length
  ) {
    issues.push("MIGRATION_SOURCE_GRAPH_RECEIPT_INVALID");
  }
  const relationIds: string[] = [];
  for (const [index, relation] of compiled.relations.entries()) {
    if (!isRecord(relation) || !isNonemptyString(relation.source_relation_id)) {
      issues.push(`MIGRATION_SOURCE_RELATION_INVALID:${index}`);
      continue;
    }
    const relationId = relation.source_relation_id;
    relationIds.push(relationId);
    if (compiled.relation_by_id[relationId] !== relation) {
      issues.push(`MIGRATION_SOURCE_RELATION_INDEX_MISMATCH:${relationId}`);
    }
  }
  if (new Set(relationIds).size !== relationIds.length) {
    issues.push("MIGRATION_SOURCE_RELATION_IDS_DUPLICATE");
  }
  if (!exactValue(sourceGraph.receipt.relation_ids, relationIds)) {
    issues.push("MIGRATION_SOURCE_GRAPH_RECEIPT_INVALID");
  }
  if (issues.length > 0) throw new SceneMigrationError(issues);
};

/** @param {JsonRecord} viewPack @param {JsonRecord} sourceGraph */
const validateViewPack = async (
  viewPack: JsonRecord,
  sourceGraph: JsonRecord,
) => {
  const issues: string[] = [];
  if (
    viewPack.schema_version !== OEW_COMPILED_VIEW_PACK_SCHEMA ||
    !isNonemptyString(viewPack.source_schema_version) ||
    !DIGEST.test(String(viewPack.view_pack_digest)) ||
    !Array.isArray(viewPack.clusters) ||
    !Array.isArray(viewPack.sequences) ||
    !isRecord(viewPack.receipt)
  ) {
    throw new SceneMigrationError(["MIGRATION_VIEW_PACK_INVALID"]);
  }
  if (viewPack.graph_digest !== sourceGraph.graph_digest) {
    issues.push("MIGRATION_VIEW_PACK_GRAPH_MISMATCH");
  }
  if (!Object.isFrozen(viewPack) || !Object.isFrozen(viewPack.receipt)) {
    issues.push("MIGRATION_VIEW_PACK_NOT_ADMITTED");
  }
  if (
    viewPack.receipt.schema_version !== OEW_VIEW_PACK_RECEIPT_SCHEMA ||
    viewPack.receipt.result !== "pass" ||
    viewPack.receipt.graph_digest !== viewPack.graph_digest ||
    viewPack.receipt.view_pack_id !== viewPack.view_pack_id ||
    viewPack.receipt.view_pack_digest !== viewPack.view_pack_digest
  ) {
    issues.push("MIGRATION_VIEW_PACK_RECEIPT_INVALID");
  }
  if (issues.length > 0) throw new SceneMigrationError(issues);
};

/** @param {JsonRecord} legacyScene @param {JsonRecord} sourceGraph */
const validateLegacyRelations = (
  legacyScene: JsonRecord,
  sourceGraph: CompiledSourceGraph,
) => {
  const issues: string[] = [];
  const visibleNodeIds = new Set<string>();
  if (!Array.isArray(legacyScene.nodes)) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_NODES_INVALID"]);
  }
  for (const [index, node] of legacyScene.nodes.entries()) {
    if (!isRecord(node) || !isNonemptyString(node.source_node_id)) {
      issues.push(`MIGRATION_LEGACY_NODE_INVALID:${index}`);
      continue;
    }
    if (visibleNodeIds.has(node.source_node_id)) {
      issues.push(`MIGRATION_LEGACY_NODE_DUPLICATE:${node.source_node_id}`);
    }
    visibleNodeIds.add(node.source_node_id);
    if (!hasOwn(sourceGraph.node_by_id, node.source_node_id)) {
      issues.push(`MIGRATION_LEGACY_NODE_MISSING:${node.source_node_id}`);
    }
  }

  if (
    !Array.isArray(legacyScene.internal_relations) ||
    !Array.isArray(legacyScene.cut_relations)
  ) {
    throw new SceneMigrationError(["MIGRATION_RELATION_PARTITIONS_INVALID"]);
  }
  const internalIds = new Set<string>();
  const cutIds = new Set<string>();
  const legacyById = new Map<string, JsonRecord>();
  const partitions: Array<["internal" | "cut", unknown[]]> = [
    ["internal", legacyScene.internal_relations],
    ["cut", legacyScene.cut_relations],
  ];
  for (const [partition, relations] of partitions) {
    for (const [index, legacyRelation] of relations.entries()) {
      if (!isRecord(legacyRelation) || !isNonemptyString(legacyRelation.source_relation_id)) {
        issues.push(`MIGRATION_RELATION_INVALID:${partition}:${index}`);
        continue;
      }
      const relationId = legacyRelation.source_relation_id;
      if (legacyById.has(relationId)) {
        issues.push(`MIGRATION_RELATION_DUPLICATE:${relationId}`);
        continue;
      }
      legacyById.set(relationId, legacyRelation);
      (partition === "internal" ? internalIds : cutIds).add(relationId);
      const sourceRelation = sourceGraph.relation_by_id[relationId];
      if (!isRecord(sourceRelation)) {
        issues.push(`MIGRATION_RELATION_MISSING:${relationId}`);
        continue;
      }
      for (const field of OEW_LEGACY_RELATION_FIELDS) {
        if (!hasOwn(legacyRelation, field)) {
          issues.push(`MIGRATION_BINDING_FIELD_MISSING:${relationId}:${field}`);
        } else if (!exactValue(legacyRelation[field], sourceRelation[field])) {
          issues.push(`MIGRATION_BINDING_DRIFT:${relationId}:${field}`);
        }
      }
    }
  }

  const expectedIds = new Set<string>();
  for (const relation of sourceGraph.relations) {
    const sourceNodeId = relation.source_node_id as string;
    const targetNodeId = relation.target_node_id as string;
    const sourceVisible = visibleNodeIds.has(sourceNodeId);
    const targetVisible = visibleNodeIds.has(targetNodeId);
    if (!sourceVisible && !targetVisible) continue;
    const relationId = relation.source_relation_id as string;
    expectedIds.add(relationId);
    const expectedPartition = sourceVisible && targetVisible ? internalIds : cutIds;
    const oppositePartition = sourceVisible && targetVisible ? cutIds : internalIds;
    if (!expectedPartition.has(relationId)) {
      issues.push(`MIGRATION_RELATION_PARTITION_MISSING:${relationId}`);
    }
    if (oppositePartition.has(relationId)) {
      issues.push(`MIGRATION_RELATION_PARTITION_MISMATCH:${relationId}`);
    }
  }
  for (const relationId of legacyById.keys()) {
    if (!expectedIds.has(relationId)) {
      issues.push(`MIGRATION_RELATION_EXTRA:${relationId}`);
    }
  }
  if (issues.length > 0) throw new SceneMigrationError(issues);
  return {
    internalIds: [...internalIds],
    cutIds: [...cutIds],
  };
};

/**
 * Admit a legacy scene only by comparison with its exact SourceGraph and
 * ViewPack, then compile a separate v1.2 scene. The legacy object is never
 * frozen, edited, or relabeled.
 *
 * @param {unknown} legacySceneInput
 * @param {unknown} sourceGraphInput
 * @param {unknown} viewPackInput
 */
export async function migrateKnowledgeScene(
  legacySceneInput: unknown,
  sourceGraphInput: unknown,
  viewPackInput: unknown,
) {
  if (!isRecord(legacySceneInput)) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCENE_INVALID"]);
  }
  if (!isRecord(sourceGraphInput)) {
    throw new SceneMigrationError(["MIGRATION_SOURCE_GRAPH_INVALID"]);
  }
  if (!isRecord(viewPackInput)) {
    throw new SceneMigrationError(["MIGRATION_VIEW_PACK_INVALID"]);
  }
  if (!LEGACY_SCENE_SCHEMAS.has(String(legacySceneInput.schema_version))) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCHEMA_UNSUPPORTED"]);
  }
  if (
    !hasDeclaredShape(
      legacySceneInput,
      REQUIRED_LEGACY_SCENE_KEYS,
      LEGACY_SCENE_KEYS,
    )
  ) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCENE_SHAPE_INVALID"]);
  }

  await validateSourceGraph(sourceGraphInput);
  await validateViewPack(viewPackInput, sourceGraphInput);
  const sourceGraph = sourceGraphInput as CompiledSourceGraph;
  const viewPack = viewPackInput as CompiledViewPack;

  const identityIssues: string[] = [];
  if (legacySceneInput.graph_digest !== sourceGraph.graph_digest) {
    identityIssues.push("MIGRATION_SOURCE_MISMATCH");
  }
  if (legacySceneInput.view_pack_id !== viewPack.view_pack_id) {
    identityIssues.push("MIGRATION_VIEW_PACK_ID_MISMATCH");
  }
  if (legacySceneInput.view_pack_digest !== viewPack.view_pack_digest) {
    identityIssues.push("MIGRATION_VIEW_PACK_MISMATCH");
  }
  if (identityIssues.length > 0) throw new SceneMigrationError(identityIssues);

  const { internalIds, cutIds } = validateLegacyRelations(
    legacySceneInput,
    sourceGraph,
  );
  const legacyScene = cloneJson(legacySceneInput);
  const migratedSceneId = `${legacySceneInput.scene_id}:migration:${legacySceneInput.schema_version}:to-v1.2`;
  const migratedScene = await finalizeKnowledgeScene({
    ...legacyScene,
    schema_version: OEW_KNOWLEDGE_SCENE_V12,
    scene_id: migratedSceneId,
    internal_relations: internalIds.map(
      (relationId) => sourceGraph.relation_by_id[relationId],
    ),
    cut_relations: cutIds.map(
      (relationId) => sourceGraph.relation_by_id[relationId],
    ),
  });
  const relationIds = [...internalIds, ...cutIds].sort(compareCodePoints);
  const receipt = deepFreeze({
    schema_version: OEW_SCENE_MIGRATION_RECEIPT_SCHEMA,
    result: "pass",
    legacy_schema_version: legacySceneInput.schema_version,
    legacy_scene_id: legacySceneInput.scene_id,
    legacy_graph_digest: legacySceneInput.graph_digest,
    legacy_view_pack_id: legacySceneInput.view_pack_id,
    legacy_view_pack_digest: legacySceneInput.view_pack_digest,
    source_graph_digest: sourceGraph.graph_digest,
    view_pack_digest: viewPack.view_pack_digest,
    migrated_schema_version: OEW_KNOWLEDGE_SCENE_V12,
    migrated_scene_id: (migratedScene as JsonRecord).scene_id,
    migrated_scene_digest: migratedScene.scene_digest,
    relation_ids: relationIds,
    relation_count: relationIds.length,
    compared_relation_fields: [...OEW_LEGACY_RELATION_FIELDS],
    legacy_artifact_mutated: false,
    authority_effect: "none",
  });
  return Object.freeze({ scene: migratedScene, receipt });
}

/**
 * Rebuild an admitted v1.2 scene as a distinct v1.3 artifact only when every
 * reference-bearing local structure is empty. Non-empty portals, Path hops,
 * or relation selections require their owning query/derivation pipeline and
 * therefore fail closed instead of copying legacy embedded revision values.
 *
 * @param {unknown} legacySceneInput
 * @param {unknown} sourceGraphInput
 * @param {unknown} viewPackInput
 */
export async function migrateKnowledgeSceneV13(
  legacySceneInput: unknown,
  sourceGraphInput: unknown,
  viewPackInput: unknown,
) {
  if (!isRecord(legacySceneInput)) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCENE_INVALID"]);
  }
  if (!isRecord(sourceGraphInput)) {
    throw new SceneMigrationError(["MIGRATION_SOURCE_GRAPH_INVALID"]);
  }
  if (!isRecord(viewPackInput)) {
    throw new SceneMigrationError(["MIGRATION_VIEW_PACK_INVALID"]);
  }
  if (legacySceneInput.schema_version !== OEW_KNOWLEDGE_SCENE_V12) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCHEMA_UNSUPPORTED"]);
  }
  if (
    !hasDeclaredShape(
      legacySceneInput,
      REQUIRED_V12_SCENE_KEYS,
      V12_SCENE_KEYS,
    )
  ) {
    throw new SceneMigrationError(["MIGRATION_LEGACY_SCENE_SHAPE_INVALID"]);
  }

  await validateSourceGraph(sourceGraphInput);
  await validateViewPack(viewPackInput, sourceGraphInput);
  await admitKnowledgeScene(cloneJson(legacySceneInput));
  const sourceGraph = sourceGraphInput as CompiledSourceGraph;
  const viewPack = viewPackInput as CompiledViewPack;

  const identityIssues: string[] = [];
  if (legacySceneInput.graph_digest !== sourceGraph.graph_digest) {
    identityIssues.push("MIGRATION_SOURCE_MISMATCH");
  }
  if (legacySceneInput.view_pack_id !== viewPack.view_pack_id) {
    identityIssues.push("MIGRATION_VIEW_PACK_ID_MISMATCH");
  }
  if (legacySceneInput.view_pack_digest !== viewPack.view_pack_digest) {
    identityIssues.push("MIGRATION_VIEW_PACK_MISMATCH");
  }
  if (identityIssues.length > 0) throw new SceneMigrationError(identityIssues);

  const { internalIds, cutIds } = validateLegacyRelations(
    legacySceneInput,
    sourceGraph,
  );
  assertReferenceStructuresAreRebuildable(legacySceneInput);

  const draft = cloneJson(legacySceneInput);
  delete draft.scene_digest;
  delete draft.relation_index_receipt;
  delete draft.path_result;
  if (isRecord(draft.navigation_frame)) {
    delete draft.navigation_frame.scene_digest;
  }
  draft.schema_version = OEW_KNOWLEDGE_SCENE_V13;
  draft.scene_id = `${legacySceneInput.scene_id}:migration:v1.2:to-v1.3`;
  draft.internal_relations = internalIds.map(
    (relationId) => sourceGraph.relation_by_id[relationId],
  );
  draft.cut_relations = cutIds.map(
    (relationId) => sourceGraph.relation_by_id[relationId],
  );

  const migratedScene = await finalizeKnowledgeSceneV13(draft);
  const relationIds = [...internalIds, ...cutIds].sort(compareCodePoints);
  const receipt = deepFreeze({
    schema_version: OEW_SCENE_MIGRATION_V13_RECEIPT_SCHEMA,
    result: "pass",
    behavior: "rebuild-empty-reference-structures",
    legacy_schema_version: OEW_KNOWLEDGE_SCENE_V12,
    legacy_scene_id: legacySceneInput.scene_id,
    legacy_scene_digest: legacySceneInput.scene_digest,
    legacy_graph_digest: legacySceneInput.graph_digest,
    legacy_view_pack_id: legacySceneInput.view_pack_id,
    legacy_view_pack_digest: legacySceneInput.view_pack_digest,
    source_graph_digest: sourceGraph.graph_digest,
    view_pack_digest: viewPack.view_pack_digest,
    migrated_schema_version: OEW_KNOWLEDGE_SCENE_V13,
    migrated_scene_id: migratedScene.scene_id,
    migrated_scene_digest: migratedScene.scene_digest,
    relation_ids: relationIds,
    relation_count: relationIds.length,
    reference_structures: {
      portals: "empty-rebuilt",
      path: "empty-or-absent-rebuilt",
      relation_selection: "absent-rebuilt",
    },
    legacy_artifact_mutated: false,
    authority_effect: "none",
  });
  return Object.freeze({ scene: migratedScene, receipt });
}
