export type RelationLocator = Readonly<{
  source_relation_id: string;
}>;
export type RelationRef = Readonly<{
  source_relation_id: string;
  scene_digest: string;
}>;
type RelationFacet = Readonly<Record<string, unknown>>;
type RelationFacetIndex = ReadonlyMap<string, RelationFacet>;
type RelationIndexReceipt = Readonly<{
  scene_digest: string;
  source_graph_digest: string;
  relation_ids: readonly string[];
  relation_count: number;
  facet_set_digest: string;
  digest_profile: "oew.relation-digest.v1";
  canonicalization_version: "rfc8785";
  hash_algorithm: "sha256";
}>;
type RelationIndexReceiptBasis = Omit<RelationIndexReceipt, "scene_digest">;
type RelationResolution =
  | Readonly<{ status: "resolved"; ref: RelationRef; facet: RelationFacet }>
  | Readonly<{ status: "missing"; ref: RelationRef }>
  | Readonly<{
      status: "stale-scene";
      ref: RelationRef;
      actual_scene_digest: string;
    }>;

export const OEW_RELATION_DIGEST_PROFILE = "oew.relation-digest.v1";
export const OEW_RELATION_CANONICALIZATION = "rfc8785";
export const OEW_RELATION_HASH_ALGORITHM = "sha256";
export const OEW_KNOWLEDGE_SCENE_V12 = "oew.knowledge-scene.v1.2";

const DIGEST = /^[a-f0-9]{64}$/;
const MUTATING_MAP_METHODS = new Set(["clear", "delete", "set"]);

type JsonRecord = Record<string, unknown>;

export class RelationReferenceError extends Error {
  readonly code = "OEW_RELATION_REFERENCE_REJECTED";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW relation reference rejected: ${stableIssues.join(", ")}`);
    this.name = "RelationReferenceError";
    this.issues = Object.freeze(stableIssues);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

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

const canonicalValue = (value: unknown, ancestors = new Set<object>()): string => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("NON_FINITE_JSON_NUMBER");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError("CIRCULAR_JSON_VALUE");
    ancestors.add(value);
    const result = `[${value.map((item) => canonicalValue(item, ancestors)).join(",")}]`;
    ancestors.delete(value);
    return result;
  }
  if (isRecord(value)) {
    if (ancestors.has(value)) throw new TypeError("CIRCULAR_JSON_VALUE");
    ancestors.add(value);
    const entries = Object.keys(value)
      .sort()
      .map((key) => {
        const child = value[key];
        if (
          child === undefined ||
          typeof child === "function" ||
          typeof child === "symbol" ||
          typeof child === "bigint"
        ) {
          throw new TypeError(`UNSUPPORTED_JSON_VALUE:${key}`);
        }
        return `${JSON.stringify(key)}:${canonicalValue(child, ancestors)}`;
      });
    ancestors.delete(value);
    return `{${entries.join(",")}}`;
  }
  throw new TypeError(`UNSUPPORTED_JSON_VALUE:${typeof value}`);
};

export const canonicalRelationJson = (value: unknown) => canonicalValue(value);

const sha256Domain = async (domain: string, value: unknown) => {
  if (!globalThis.crypto?.subtle) {
    throw new RelationReferenceError(["SHA256_UNAVAILABLE"]);
  }
  const bytes = new TextEncoder().encode(`${domain}\0${canonicalRelationJson(value)}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const computeRelationDigest = (relation: RelationFacet) =>
  sha256Domain("oew/relation-binding/v1", relation);

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

const immutableMap = (entries: readonly (readonly [string, RelationFacet])[]) => {
  const target = new Map<string, RelationFacet>(entries);
  const proxy = new Proxy(target, {
    get(map, property) {
      if (typeof property === "string" && MUTATING_MAP_METHODS.has(property)) {
        return () => {
          throw new RelationReferenceError(["RELATION_INDEX_IMMUTABLE"]);
        };
      }
      const value = Reflect.get(map, property, map);
      return typeof value === "function" ? value.bind(map) : value;
    },
  });
  return Object.freeze(proxy) as RelationFacetIndex;
};

const relationUnion = (scene: JsonRecord) => {
  if (!Array.isArray(scene.internal_relations) || !Array.isArray(scene.cut_relations)) {
    throw new RelationReferenceError(["RELATION_PARTITIONS_INVALID"]);
  }
  return [...scene.internal_relations, ...scene.cut_relations];
};

const buildIndex = async (scene: JsonRecord) => {
  const issues: string[] = [];
  const byId = new Map<string, RelationFacet>();
  for (const [index, candidate] of relationUnion(scene).entries()) {
    if (!isRecord(candidate)) {
      issues.push(`RELATION_INVALID:${index}`);
      continue;
    }
    const relationId = candidate.source_relation_id;
    if (!isNonemptyString(relationId)) {
      issues.push(`RELATION_ID_INVALID:${index}`);
      continue;
    }
    if (byId.has(relationId)) {
      issues.push(`RELATION_ID_COLLISION:${relationId}`);
      continue;
    }
    byId.set(relationId, candidate as RelationFacet);
  }
  if (issues.length > 0) throw new RelationReferenceError(issues);

  const relationIds = [...byId.keys()].sort(compareCodePoints);
  const digestPairs: readonly (readonly [string, string])[] = await Promise.all(
    relationIds.map(async (relationId) => [
      relationId,
      await computeRelationDigest(byId.get(relationId) as RelationFacet),
    ] as const),
  );
  const facetSetDigest = await sha256Domain("oew/facet-set/v1", digestPairs);
  const entries = relationIds.map(
    (relationId) => [relationId, byId.get(relationId) as RelationFacet] as const,
  );
  return {
    index: immutableMap(entries),
    relationIds: Object.freeze(relationIds),
    facetSetDigest,
  };
};

const receiptBasis = (
  sourceGraphDigest: string,
  relationIds: readonly string[],
  facetSetDigest: string,
): RelationIndexReceiptBasis =>
  deepFreeze({
    source_graph_digest: sourceGraphDigest,
    relation_ids: [...relationIds],
    relation_count: relationIds.length,
    facet_set_digest: facetSetDigest,
    digest_profile: OEW_RELATION_DIGEST_PROFILE,
    canonicalization_version: OEW_RELATION_CANONICALIZATION,
    hash_algorithm: OEW_RELATION_HASH_ALGORITHM,
  });

const sceneContent = (scene: JsonRecord, basis: JsonRecord) => {
  const content: JsonRecord = { ...scene };
  delete content.scene_digest;
  delete content.relationFacetsById;
  content.schema_version = OEW_KNOWLEDGE_SCENE_V12;
  content.relation_index_receipt = basis;
  if (isRecord(content.navigation_frame)) {
    const navigationFrame = { ...content.navigation_frame };
    delete navigationFrame.scene_digest;
    content.navigation_frame = navigationFrame;
  }
  return content;
};

const computeSceneDigest = async (scene: JsonRecord, basis: JsonRecord) => {
  const sceneContentDigest = await sha256Domain(
    "oew/scene-content/v1.2",
    sceneContent(scene, basis),
  );
  return sha256Domain("oew/scene/v1.2", {
    scene_content_digest: sceneContentDigest,
    receipt_basis: basis,
  });
};

const exactArray = (actual: unknown, expected: readonly string[]) =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

const validateStoredReceipt = (
  scene: JsonRecord,
  stored: unknown,
  expectedBasis: JsonRecord,
  expectedSceneDigest: string,
) => {
  const issues: string[] = [];
  if (!isRecord(stored)) {
    throw new RelationReferenceError(["RELATION_INDEX_RECEIPT_MISSING"]);
  }
  if (!exactArray(stored.relation_ids, expectedBasis.relation_ids as string[])) {
    issues.push("RELATION_INDEX_ORDER_MISMATCH");
  }
  if (stored.relation_count !== expectedBasis.relation_count) {
    issues.push("RELATION_INDEX_COUNT_MISMATCH");
  }
  if (stored.facet_set_digest !== expectedBasis.facet_set_digest) {
    issues.push("RELATION_INDEX_DIGEST_MISMATCH");
  }
  if (stored.source_graph_digest !== expectedBasis.source_graph_digest) {
    issues.push("RELATION_INDEX_SOURCE_MISMATCH");
  }
  if (stored.digest_profile !== OEW_RELATION_DIGEST_PROFILE) {
    issues.push("RELATION_INDEX_PROFILE_MISMATCH");
  }
  if (stored.canonicalization_version !== OEW_RELATION_CANONICALIZATION) {
    issues.push("RELATION_INDEX_CANONICALIZATION_MISMATCH");
  }
  if (stored.hash_algorithm !== OEW_RELATION_HASH_ALGORITHM) {
    issues.push("RELATION_INDEX_HASH_ALGORITHM_MISMATCH");
  }
  if (stored.scene_digest !== expectedSceneDigest) {
    issues.push("RELATION_INDEX_SCENE_DIGEST_MISMATCH");
  }
  if (scene.scene_digest !== expectedSceneDigest || !DIGEST.test(String(scene.scene_digest))) {
    issues.push("SCENE_DIGEST_MISMATCH");
  }
  if (
    !isRecord(scene.navigation_frame) ||
    scene.navigation_frame.scene_digest !== expectedSceneDigest
  ) {
    issues.push("NAVIGATION_SCENE_DIGEST_MISMATCH");
  }
  if (issues.length > 0) throw new RelationReferenceError(issues);
};

const validateCandidateIndex = (
  expected: RelationFacetIndex,
  candidate: ReadonlyMap<string, RelationFacet>,
) => {
  const issues: string[] = [];
  const expectedIds = [...expected.keys()];
  if (!exactArray([...candidate.keys()], expectedIds) || candidate.size !== expected.size) {
    issues.push("RELATION_INDEX_UNION_MISMATCH");
  }
  for (const relationId of expectedIds) {
    if (candidate.get(relationId) !== expected.get(relationId)) {
      issues.push(`RELATION_INDEX_OBJECT_MISMATCH:${relationId}`);
    }
  }
  if (issues.length > 0) throw new RelationReferenceError(issues);
};

const attachRuntimeIndex = <T extends JsonRecord>(
  scene: T,
  index: RelationFacetIndex,
): T & { readonly relationFacetsById: RelationFacetIndex } => {
  Object.defineProperty(scene, "relationFacetsById", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: index,
  });
  return deepFreeze(scene) as T & {
    readonly relationFacetsById: RelationFacetIndex;
  };
};

export async function finalizeKnowledgeScene(sceneInput: unknown) {
  if (!isRecord(sceneInput)) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_INVALID"]);
  }
  const { index, relationIds, facetSetDigest } = await buildIndex(sceneInput);
  if (!isNonemptyString(sceneInput.graph_digest)) {
    throw new RelationReferenceError(["SOURCE_GRAPH_DIGEST_INVALID"]);
  }
  const basis = receiptBasis(sceneInput.graph_digest, relationIds, facetSetDigest);
  const sceneDigest = await computeSceneDigest(sceneInput, basis);
  const navigationFrame = isRecord(sceneInput.navigation_frame)
    ? { ...sceneInput.navigation_frame, scene_digest: sceneDigest }
    : sceneInput.navigation_frame;
  const scene = {
    ...sceneInput,
    schema_version: OEW_KNOWLEDGE_SCENE_V12,
    scene_digest: sceneDigest,
    navigation_frame: navigationFrame,
    relation_index_receipt: {
      scene_digest: sceneDigest,
      ...basis,
    } satisfies RelationIndexReceipt,
  };
  return attachRuntimeIndex(scene, index);
}

export async function admitKnowledgeScene(
  sceneInput: unknown,
  candidateIndex?: ReadonlyMap<string, RelationFacet>,
) {
  if (!isRecord(sceneInput) || sceneInput.schema_version !== OEW_KNOWLEDGE_SCENE_V12) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_SCHEMA_UNSUPPORTED"]);
  }
  const { index, relationIds, facetSetDigest } = await buildIndex(sceneInput);
  if (!isNonemptyString(sceneInput.graph_digest)) {
    throw new RelationReferenceError(["SOURCE_GRAPH_DIGEST_INVALID"]);
  }
  const basis = receiptBasis(sceneInput.graph_digest, relationIds, facetSetDigest);
  const expectedSceneDigest = await computeSceneDigest(sceneInput, basis);
  validateStoredReceipt(
    sceneInput,
    sceneInput.relation_index_receipt,
    basis,
    expectedSceneDigest,
  );
  if (candidateIndex !== undefined) validateCandidateIndex(index, candidateIndex);
  const scene = { ...sceneInput };
  return attachRuntimeIndex(scene, index);
}

export function relationRef(scene: { readonly scene_digest: string }, relationId: string) {
  if (!DIGEST.test(scene.scene_digest) || !isNonemptyString(relationId)) {
    throw new RelationReferenceError(["RELATION_REFERENCE_INVALID"]);
  }
  return Object.freeze({
    source_relation_id: relationId,
    scene_digest: scene.scene_digest,
  }) satisfies RelationRef;
}

export function resolveRelationRef(
  scene: {
    readonly scene_digest: string;
    readonly relationFacetsById?: RelationFacetIndex;
  },
  ref: RelationRef,
): RelationResolution {
  if (
    !isRecord(ref) ||
    !isNonemptyString(ref.source_relation_id) ||
    !DIGEST.test(ref.scene_digest)
  ) {
    throw new RelationReferenceError(["RELATION_REFERENCE_INVALID"]);
  }
  const stableRef = Object.freeze({
    source_relation_id: ref.source_relation_id,
    scene_digest: ref.scene_digest,
  });
  if (scene.scene_digest !== ref.scene_digest) {
    return Object.freeze({
      status: "stale-scene",
      ref: stableRef,
      actual_scene_digest: scene.scene_digest,
    });
  }
  if (scene.relationFacetsById === undefined) {
    throw new RelationReferenceError(["RELATION_INDEX_NOT_ADMITTED"]);
  }
  const facet = scene.relationFacetsById.get(ref.source_relation_id);
  if (facet === undefined) {
    return Object.freeze({ status: "missing", ref: stableRef });
  }
  return Object.freeze({ status: "resolved", ref: stableRef, facet });
}


export type RelationReferenceSlotV13 = Readonly<{
  path: string;
  ref: RelationLocator | RelationRef;
}>;

export const OEW_KNOWLEDGE_SCENE_V13 = "oew.knowledge-scene.v1.3";
export const OEW_V13_RELATION_REFERENCE_PATHS = Object.freeze([
  "portals.*.constituents.*.relation_ref",
  "path.hops.*.relation_ref",
  "navigation_frame.selected.relation_ref",
] as const);

type MutableReferenceSlotV13 = {
  path: string;
  owner: JsonRecord;
  ref: JsonRecord;
};

type ReferencePhaseV13 = "draft" | "final" | "either";

const cloneJson = <T>(value: T): T =>
  JSON.parse(canonicalRelationJson(value)) as T;

const referenceShapeIssues = (
  ref: unknown,
  path: string,
  phase: ReferencePhaseV13,
) => {
  if (!isRecord(ref) || !isNonemptyString(ref.source_relation_id)) {
    return [`RELATION_REFERENCE_INVALID:${path}`];
  }
  const keys = Object.keys(ref).sort();
  const locatorKeys = ["source_relation_id"];
  const finalKeys = ["scene_digest", "source_relation_id"];
  const locatorValid =
    exactArray(keys, locatorKeys) && !hasOwn(ref, "scene_digest");
  const finalValid =
    exactArray(keys, finalKeys) &&
    typeof ref.scene_digest === "string" &&
    DIGEST.test(ref.scene_digest);
  if (
    (phase === "draft" && !locatorValid) ||
    (phase === "final" && !finalValid) ||
    (phase === "either" && !locatorValid && !finalValid)
  ) {
    return [`RELATION_REFERENCE_INVALID:${path}`];
  }
  return [];
};

const collectUndeclaredReferenceIssues = (
  value: unknown,
  declaredPaths: ReadonlySet<string>,
  path = "",
  issues: string[] = [],
) => {
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      collectUndeclaredReferenceIssues(
        child,
        declaredPaths,
        `${path}[${index}]`,
        issues,
      ),
    );
    return issues;
  }
  if (!isRecord(value)) return issues;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (key === "relation_ref" && !declaredPaths.has(childPath)) {
      issues.push(`RELATION_REFERENCE_UNDECLARED:${childPath}`);
    }
    collectUndeclaredReferenceIssues(child, declaredPaths, childPath, issues);
  }
  return issues;
};

const referenceSlotsV13 = (
  scene: JsonRecord,
  phase: ReferencePhaseV13,
): MutableReferenceSlotV13[] => {
  const issues: string[] = [];
  const slots: MutableReferenceSlotV13[] = [];

  const addSlot = (owner: JsonRecord, path: string) => {
    issues.push(...referenceShapeIssues(owner.relation_ref, path, phase));
    if (isRecord(owner.relation_ref)) {
      slots.push({ path, owner, ref: owner.relation_ref });
    }
  };

  if (scene.portals !== undefined && !Array.isArray(scene.portals)) {
    issues.push("RELATION_REFERENCE_STRUCTURE_INVALID:portals");
  }
  for (const [portalIndex, portal] of (
    Array.isArray(scene.portals) ? scene.portals : []
  ).entries()) {
    const portalPath = `portals[${portalIndex}]`;
    if (!isRecord(portal) || !Array.isArray(portal.constituents)) {
      issues.push(
        `RELATION_REFERENCE_STRUCTURE_INVALID:${portalPath}.constituents`,
      );
      continue;
    }
    for (const [constituentIndex, constituent] of portal.constituents.entries()) {
      const path =
        `${portalPath}.constituents[${constituentIndex}].relation_ref`;
      if (!isRecord(constituent)) {
        issues.push(`RELATION_REFERENCE_STRUCTURE_INVALID:${path}`);
        continue;
      }
      addSlot(constituent, path);
    }
  }

  if (scene.path !== undefined) {
    if (!isRecord(scene.path) || !Array.isArray(scene.path.hops)) {
      issues.push("RELATION_REFERENCE_STRUCTURE_INVALID:path.hops");
    } else {
      for (const [hopIndex, hop] of scene.path.hops.entries()) {
        const path = `path.hops[${hopIndex}].relation_ref`;
        if (!isRecord(hop)) {
          issues.push(`RELATION_REFERENCE_STRUCTURE_INVALID:${path}`);
          continue;
        }
        addSlot(hop, path);
      }
    }
  }

  if (!isRecord(scene.navigation_frame)) {
    issues.push("RELATION_REFERENCE_STRUCTURE_INVALID:navigation_frame");
  } else if (isRecord(scene.navigation_frame.selected)) {
    const selection = scene.navigation_frame.selected;
    const selectionKind = selection.kind;
    const path = "navigation_frame.selected.relation_ref";
    if (selectionKind === "relation" || selectionKind === "path-hop") {
      addSlot(selection, path);
    } else if (hasOwn(selection, "relation_ref")) {
      issues.push(`RELATION_REFERENCE_UNDECLARED:${path}`);
    }
  }

  const declaredPaths = new Set(slots.map(({ path }) => path));
  issues.push(...collectUndeclaredReferenceIssues(scene, declaredPaths));
  if (issues.length > 0) throw new RelationReferenceError(issues);
  return slots;
};

export const enumerateRelationReferenceSlotsV13 = (
  sceneInput: unknown,
): readonly RelationReferenceSlotV13[] => {
  if (!isRecord(sceneInput)) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_INVALID"]);
  }
  return Object.freeze(
    referenceSlotsV13(sceneInput, "either").map(({ path, ref }) =>
      Object.freeze({
        path,
        ref: ref as RelationLocator | RelationRef,
      }),
    ),
  );
};

export const relationLocator = (relationId: string) => {
  if (!isNonemptyString(relationId)) {
    throw new RelationReferenceError(["RELATION_REFERENCE_INVALID"]);
  }
  return Object.freeze({
    source_relation_id: relationId,
  }) satisfies RelationLocator;
};

const replaceReferencesV13 = (
  scene: JsonRecord,
  phase: ReferencePhaseV13,
  replace: (ref: JsonRecord) => RelationLocator | RelationRef,
) => {
  for (const slot of referenceSlotsV13(scene, phase)) {
    slot.owner.relation_ref = replace(slot.ref);
  }
  return scene;
};

const ensureDraftIsUnboundV13 = (scene: JsonRecord) => {
  const issues: string[] = [];
  if (hasOwn(scene, "scene_digest")) {
    issues.push("REFERENCE_ALREADY_BOUND");
  }
  if (
    isRecord(scene.navigation_frame) &&
    hasOwn(scene.navigation_frame, "scene_digest")
  ) {
    issues.push("REFERENCE_ALREADY_BOUND");
  }
  if (
    isRecord(scene.relation_index_receipt) &&
    hasOwn(scene.relation_index_receipt, "scene_digest")
  ) {
    issues.push("REFERENCE_ALREADY_BOUND");
  }
  for (const { ref } of referenceSlotsV13(scene, "either")) {
    if (hasOwn(ref, "scene_digest")) issues.push("REFERENCE_ALREADY_BOUND");
  }
  if (issues.length > 0) throw new RelationReferenceError(issues);
};

export const extractSceneSemanticBasisV13 = (sceneInput: unknown) => {
  if (!isRecord(sceneInput)) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_INVALID"]);
  }
  const basis = cloneJson(sceneInput);
  basis.schema_version = OEW_KNOWLEDGE_SCENE_V13;
  delete basis.scene_digest;
  delete basis.relationFacetsById;
  if (isRecord(basis.relation_index_receipt)) {
    const receipt = { ...basis.relation_index_receipt };
    delete receipt.scene_digest;
    basis.relation_index_receipt = receipt;
  }
  if (isRecord(basis.navigation_frame)) {
    const navigationFrame = { ...basis.navigation_frame };
    delete navigationFrame.scene_digest;
    basis.navigation_frame = navigationFrame;
  }
  replaceReferencesV13(basis, "either", (ref) => ({
    source_relation_id: ref.source_relation_id as string,
  }));
  return deepFreeze(basis);
};

const v13RevisionInput = async (scene: JsonRecord) => {
  const { relationIds, facetSetDigest } = await buildIndex(scene);
  if (!isNonemptyString(scene.graph_digest)) {
    throw new RelationReferenceError(["SOURCE_GRAPH_DIGEST_INVALID"]);
  }
  const basis = receiptBasis(scene.graph_digest, relationIds, facetSetDigest);
  const prepared = cloneJson(scene);
  prepared.schema_version = OEW_KNOWLEDGE_SCENE_V13;
  prepared.relation_index_receipt = basis;
  return {
    semanticBasis: extractSceneSemanticBasisV13(prepared),
    receiptBasis: basis,
  };
};

export const computeKnowledgeSceneRevisionV13 = async (sceneInput: unknown) => {
  if (!isRecord(sceneInput)) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_INVALID"]);
  }
  const { semanticBasis } = await v13RevisionInput(sceneInput);
  return sha256Domain("oew/scene-revision/v1.3", semanticBasis);
};

const validateBoundReferencesV13 = (
  scene: JsonRecord,
  expectedSceneDigest: string,
  index: RelationFacetIndex,
) => {
  const issues: string[] = [];
  for (const { path, ref } of referenceSlotsV13(scene, "final")) {
    if (ref.scene_digest !== expectedSceneDigest) {
      issues.push(`RELATION_REFERENCE_REVISION_MISMATCH:${path}`);
    }
    if (!index.has(ref.source_relation_id as string)) {
      issues.push(
        `RELATION_REFERENCE_MISSING:${path}:${String(
          ref.source_relation_id,
        )}`,
      );
    }
  }
  if (issues.length > 0) throw new RelationReferenceError(issues);
};

export async function finalizeKnowledgeSceneV13(sceneInput: unknown) {
  if (!isRecord(sceneInput)) {
    throw new RelationReferenceError(["KNOWLEDGE_SCENE_INVALID"]);
  }
  if (
    sceneInput.schema_version !== undefined &&
    sceneInput.schema_version !== OEW_KNOWLEDGE_SCENE_V13
  ) {
    throw new RelationReferenceError(["LEGACY_SCENE_REBUILD_REQUIRED"]);
  }
  ensureDraftIsUnboundV13(sceneInput);
  const { index, relationIds, facetSetDigest } = await buildIndex(sceneInput);
  if (!isNonemptyString(sceneInput.graph_digest)) {
    throw new RelationReferenceError(["SOURCE_GRAPH_DIGEST_INVALID"]);
  }
  if (!isRecord(sceneInput.navigation_frame)) {
    throw new RelationReferenceError([
      "RELATION_REFERENCE_STRUCTURE_INVALID:navigation_frame",
    ]);
  }

  const basis = receiptBasis(
    sceneInput.graph_digest,
    relationIds,
    facetSetDigest,
  );
  const scene = cloneJson(sceneInput);
  scene.schema_version = OEW_KNOWLEDGE_SCENE_V13;
  scene.relation_index_receipt = basis;
  const sceneDigest = await sha256Domain(
    "oew/scene-revision/v1.3",
    extractSceneSemanticBasisV13(scene),
  );
  replaceReferencesV13(scene, "draft", (ref) => ({
    source_relation_id: ref.source_relation_id as string,
    scene_digest: sceneDigest,
  }));
  scene.scene_digest = sceneDigest;
  scene.navigation_frame = {
    ...(scene.navigation_frame as JsonRecord),
    scene_digest: sceneDigest,
  };
  scene.relation_index_receipt = {
    scene_digest: sceneDigest,
    ...basis,
  } satisfies RelationIndexReceipt;
  validateBoundReferencesV13(scene, sceneDigest, index);
  return attachRuntimeIndex(scene, index);
}

export async function admitKnowledgeSceneV13(
  sceneInput: unknown,
  candidateIndex?: ReadonlyMap<string, RelationFacet>,
) {
  if (
    !isRecord(sceneInput) ||
    sceneInput.schema_version !== OEW_KNOWLEDGE_SCENE_V13
  ) {
    throw new RelationReferenceError(["LEGACY_SCENE_REBUILD_REQUIRED"]);
  }
  const { index, relationIds, facetSetDigest } = await buildIndex(sceneInput);
  if (!isNonemptyString(sceneInput.graph_digest)) {
    throw new RelationReferenceError(["SOURCE_GRAPH_DIGEST_INVALID"]);
  }
  const basis = receiptBasis(
    sceneInput.graph_digest,
    relationIds,
    facetSetDigest,
  );
  const expectedSceneDigest = await computeKnowledgeSceneRevisionV13(sceneInput);
  if (
    sceneInput.scene_digest !== expectedSceneDigest ||
    !DIGEST.test(String(sceneInput.scene_digest))
  ) {
    throw new RelationReferenceError(["SCENE_REVISION_MISMATCH"]);
  }
  validateStoredReceipt(
    sceneInput,
    sceneInput.relation_index_receipt,
    basis,
    expectedSceneDigest,
  );
  validateBoundReferencesV13(sceneInput, expectedSceneDigest, index);
  if (candidateIndex !== undefined) validateCandidateIndex(index, candidateIndex);
  return attachRuntimeIndex(cloneJson(sceneInput), index);
}
