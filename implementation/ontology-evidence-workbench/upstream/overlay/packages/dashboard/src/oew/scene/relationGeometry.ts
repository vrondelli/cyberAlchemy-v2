type JsonRecord = Record<string, unknown>;

export const OEW_SCENE_GEOMETRY_SCHEMA = "oew.scene-geometry.v1";

export class RelationGeometryError extends Error {
  readonly code = "OEW_RELATION_GEOMETRY_REJECTED";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const stable = [...new Set(issues)].sort();
    super(stable.join(", "));
    this.name = "RelationGeometryError";
    this.issues = Object.freeze(stable);
  }
}

const DIGEST = /^[a-f0-9]{64}$/;
const RELATION_KEYS = new Set([
  "source_relation_id",
  "sections",
  "label_box",
  "marker_endpoint",
]);
const SEMANTIC_KEYS = new Set([
  "predicate",
  "exact_predicate",
  "evidence_refs",
  "mapping_loss",
  "authority_effect",
  "color_token",
  "pattern_token",
  "visible_label",
  "direction_label",
  "source_direction",
  "traversal_direction",
  "source_node_id",
  "target_node_id",
]);

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const semanticIssues = (value: unknown, path: string, issues: string[]) => {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      semanticIssues(child, `${path}[${index}]`, issues),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (SEMANTIC_KEYS.has(key)) issues.push(`GEOMETRY_SEMANTICS_FORBIDDEN:${path}.${key}`);
    semanticIssues(child, `${path}.${key}`, issues);
  }
};

const validPoint = (value: unknown) =>
  isRecord(value) &&
  typeof value.x === "number" &&
  Number.isFinite(value.x) &&
  typeof value.y === "number" &&
  Number.isFinite(value.y);

const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

export type RelationGeometryIndex = Readonly<{
  schema_version: typeof OEW_SCENE_GEOMETRY_SCHEMA;
  scene_digest: string;
  relation_ids: readonly string[];
  by_id: ReadonlyMap<string, Readonly<JsonRecord>>;
}>;

export function createRelationGeometryIndex(
  scene: unknown,
  candidate: unknown,
): RelationGeometryIndex {
  const issues: string[] = [];
  if (!isRecord(scene) || !DIGEST.test(String(scene.scene_digest))) {
    throw new RelationGeometryError(["SCENE_DIGEST_INVALID"]);
  }
  if (
    !isRecord(scene.relation_index_receipt) ||
    !Array.isArray(scene.relation_index_receipt.relation_ids)
  ) {
    throw new RelationGeometryError(["RELATION_INDEX_RECEIPT_REQUIRED"]);
  }
  if (
    !isRecord(candidate) ||
    candidate.schema_version !== OEW_SCENE_GEOMETRY_SCHEMA ||
    !Array.isArray(candidate.relations)
  ) {
    throw new RelationGeometryError(["SCENE_GEOMETRY_INVALID"]);
  }
  if (candidate.scene_digest !== scene.scene_digest) {
    issues.push("GEOMETRY_SCENE_STALE");
  }

  const expectedIds = scene.relation_index_receipt.relation_ids;
  const expected = new Set(expectedIds);
  const rows = new Map<string, Readonly<JsonRecord>>();
  for (const [index, value] of candidate.relations.entries()) {
    if (!isRecord(value) || typeof value.source_relation_id !== "string") {
      issues.push(`GEOMETRY_RELATION_INVALID:${index}`);
      continue;
    }
    const relationId = value.source_relation_id;
    for (const key of Object.keys(value)) {
      if (!RELATION_KEYS.has(key)) {
        issues.push(`GEOMETRY_FIELD_FORBIDDEN:${relationId}:${key}`);
      }
    }
    semanticIssues(value, `relations[${index}]`, issues);
    if (rows.has(relationId)) {
      issues.push(`GEOMETRY_RELATION_DUPLICATE:${relationId}`);
    }
    if (!expected.has(relationId)) {
      issues.push(`GEOMETRY_RELATION_UNKNOWN:${relationId}`);
    }
    if (
      !Array.isArray(value.sections) ||
      value.sections.length === 0 ||
      value.sections.some(
        (section) =>
          !Array.isArray(section) ||
          section.length < 2 ||
          section.some((point) => !validPoint(point)),
      )
    ) {
      issues.push(`GEOMETRY_SECTIONS_INVALID:${relationId}`);
    }
    rows.set(relationId, freeze(structuredClone(value)));
  }
  for (const relationId of expectedIds) {
    if (!rows.has(String(relationId))) {
      issues.push(`GEOMETRY_RELATION_MISSING:${String(relationId)}`);
    }
  }
  if (rows.size !== expected.size) issues.push("GEOMETRY_RELATION_SET_INCOMPLETE");
  if (issues.length > 0) throw new RelationGeometryError(issues);

  const readOnly = new Proxy(rows, {
    get(map, property) {
      if (property === "set" || property === "delete" || property === "clear") {
        return () => {
          throw new RelationGeometryError(["GEOMETRY_INDEX_IMMUTABLE"]);
        };
      }
      const value = Reflect.get(map, property, map);
      return typeof value === "function" ? value.bind(map) : value;
    },
  });
  return Object.freeze({
    schema_version: OEW_SCENE_GEOMETRY_SCHEMA,
    scene_digest: String(scene.scene_digest),
    relation_ids: Object.freeze(expectedIds.map(String)),
    by_id: Object.freeze(readOnly),
  });
}

export function resolveRelationGeometry(
  index: RelationGeometryIndex,
  ref: Readonly<{source_relation_id: string; scene_digest: string}>,
) {
  if (!index || ref.scene_digest !== index.scene_digest) {
    throw new RelationGeometryError(["GEOMETRY_REFERENCE_STALE"]);
  }
  const row = index.by_id.get(ref.source_relation_id);
  if (!row) {
    throw new RelationGeometryError([
      `GEOMETRY_RELATION_MISSING:${ref.source_relation_id}`,
    ]);
  }
  return row;
}
