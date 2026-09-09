import {
  admitKnowledgeSceneV13,
  relationLocator,
  relationRef,
  resolveRelationRef,
  type RelationRef,
} from "./relationReference.ts";

export const OEW_PATH_POLICY_VERSION = "1.0.0";
export const OEW_PATH_LIMITS = Object.freeze({ paths: 8, hops: 8 });

const POLICY_IDS = new Set(["directed-shortest", "undirected-shortest"]);
const SOURCE_DIRECTIONS = new Set(["forward", "reverse", "bidirectional"]);

type JsonRecord = Record<string, unknown>;
type PathPolicyId = "directed-shortest" | "undirected-shortest";
type NormalizedPathQuery = {
  from_node_id: string;
  to_node_id: string;
  policy_id: PathPolicyId;
  policy_version: typeof OEW_PATH_POLICY_VERSION;
  max_paths: number;
  max_hops: number;
};
type RelationLocator = Readonly<{source_relation_id: string}>;
type RelationFacet = Readonly<JsonRecord>;
type AdmittedScene = JsonRecord & {
  scene_digest: string;
  relationFacetsById: ReadonlyMap<string, RelationFacet>;
};
type PathArc = {
  from_node_id: string;
  to_node_id: string;
  relation_ref: RelationLocator;
  traversal_direction: string;
};
type QueueState = {
  node_id: string;
  hops: PathArc[];
  visited: Set<string>;
};
type LocatorResult = JsonRecord & {paths: PathArc[][]};

export class PathQueryError extends Error {
  code: string;
  issues: string[];

  constructor(issues: string[] = []) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW path query rejected: ${stableIssues.join(", ")}`);
    this.name = "PathQueryError";
    this.code = "OEW_PATH_QUERY_REJECTED";
    this.issues = stableIssues;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** @param {string} left @param {string} right */
const compareText = (left: string, right: string) => left.localeCompare(right);

/** @param {unknown} queryInput */
const normalizeQuery = (queryInput: unknown): NormalizedPathQuery => {
  const issues: string[] = [];
  if (!isRecord(queryInput)) throw new PathQueryError(["PATH_QUERY_INVALID"]);
  const fromNodeId = queryInput.from_node_id;
  const toNodeId = queryInput.to_node_id;
  const policyId = queryInput.policy_id;
  const policyVersion = queryInput.policy_version ?? OEW_PATH_POLICY_VERSION;
  const maxPaths = queryInput.max_paths ?? OEW_PATH_LIMITS.paths;
  const maxHops = queryInput.max_hops ?? OEW_PATH_LIMITS.hops;

  if (!isNonemptyString(fromNodeId)) issues.push("PATH_FROM_NODE_INVALID");
  if (!isNonemptyString(toNodeId)) issues.push("PATH_TO_NODE_INVALID");
  if (typeof policyId !== "string" || !POLICY_IDS.has(policyId)) {
    issues.push("PATH_POLICY_INVALID");
  }
  if (policyVersion !== OEW_PATH_POLICY_VERSION) {
    issues.push("PATH_POLICY_VERSION_UNSUPPORTED");
  }
  if (typeof maxPaths !== "number" || !Number.isInteger(maxPaths) || maxPaths < 1 || maxPaths > OEW_PATH_LIMITS.paths) {
    issues.push("PATH_COUNT_CAP_INVALID");
  }
  if (typeof maxHops !== "number" || !Number.isInteger(maxHops) || maxHops < 0 || maxHops > OEW_PATH_LIMITS.hops) {
    issues.push("PATH_HOP_CAP_INVALID");
  }
  if (issues.length) throw new PathQueryError(issues);
  return {
    from_node_id: fromNodeId as string,
    to_node_id: toNodeId as string,
    policy_id: policyId as PathPolicyId,
    policy_version: policyVersion as typeof OEW_PATH_POLICY_VERSION,
    max_paths: maxPaths as number,
    max_hops: maxHops as number,
  };
};

/**
 * Traversal is relative to the relation's declared semantic direction. The
 * relation facet is never rewritten when an undirected query walks backwards.
 *
 * @param {JsonRecord} relation
 * @param {string} fromNodeId
 * @param {string} toNodeId
 */
const traversalDirection = (
  relation: RelationFacet,
  fromNodeId: unknown,
  toNodeId: unknown,
) => {
  if (relation.source_direction === "bidirectional") return "either";
  const declaredForward =
    relation.source_direction === "forward"
      ? [relation.source_node_id, relation.target_node_id]
      : [relation.target_node_id, relation.source_node_id];
  return declaredForward[0] === fromNodeId && declaredForward[1] === toNodeId
    ? "with-source"
    : "against-source";
};

/** @param {JsonRecord} relation @param {string} policyId */
const relationArcs = (
  relation: RelationFacet,
  policyId: PathPolicyId,
): PathArc[] => {
  const sourceNodeId = relation.source_node_id;
  const targetNodeId = relation.target_node_id;
  if (
    !isNonemptyString(relation.source_relation_id) ||
    !isNonemptyString(sourceNodeId) ||
    !isNonemptyString(targetNodeId) ||
    typeof relation.source_direction !== "string" ||
    !SOURCE_DIRECTIONS.has(relation.source_direction)
  ) {
    throw new PathQueryError([
      `PATH_RELATION_INVALID:${String(relation.source_relation_id ?? "unknown")}`,
    ]);
  }

  const pairs: Array<[string, string]> = [];
  if (policyId === "undirected-shortest" || relation.source_direction === "bidirectional") {
    pairs.push([sourceNodeId, targetNodeId], [targetNodeId, sourceNodeId]);
  } else if (relation.source_direction === "forward") {
    pairs.push([sourceNodeId, targetNodeId]);
  } else {
    pairs.push([targetNodeId, sourceNodeId]);
  }
  return pairs.map(([fromNodeId, toNodeId]) => ({
    from_node_id: fromNodeId,
    to_node_id: toNodeId,
    relation_ref: relationLocator(relation.source_relation_id as string),
    traversal_direction: traversalDirection(relation, fromNodeId, toNodeId),
  }));
};

/** @param {JsonRecord} scene @param {string} policyId */
const buildAdjacency = (
  scene: AdmittedScene,
  policyId: PathPolicyId,
): Map<string, PathArc[]> => {
  if (!(scene.relationFacetsById instanceof Map)) {
    throw new PathQueryError(["PATH_SCENE_NOT_ADMITTED"]);
  }
  const adjacency = new Map<string, PathArc[]>();
  for (const relationId of [...scene.relationFacetsById.keys()].sort(compareText)) {
    const ref = relationRef(scene, relationId);
    const resolution = resolveRelationRef(scene, ref);
    if (resolution.status !== "resolved") {
      throw new PathQueryError([
        `PATH_RELATION_${resolution.status.toUpperCase()}:${relationId}`,
      ]);
    }
    for (const arc of relationArcs(resolution.facet, policyId)) {
      const values = adjacency.get(arc.from_node_id) ?? [];
      values.push(arc);
      adjacency.set(arc.from_node_id, values);
    }
  }
  for (const values of adjacency.values()) {
    values.sort(
      (left, right) =>
        compareText(left.relation_ref.source_relation_id, right.relation_ref.source_relation_id) ||
        compareText(left.to_node_id, right.to_node_id),
    );
  }
  return adjacency;
};

/**
 * @param {ReadonlyMap<string, readonly JsonRecord[]>} adjacency
 * @param {string} fromNodeId
 * @param {string} toNodeId
 * @param {number} maxHops
 * @param {number} maxPaths
 */
const shortestPaths = (
  adjacency: ReadonlyMap<string, readonly PathArc[]>,
  fromNodeId: string,
  toNodeId: string,
  maxHops: number,
  maxPaths: number,
) => {
  if (fromNodeId === toNodeId) {
    return { paths: [[]], overflow: null };
  }
  const queue: QueueState[] = [{
    node_id: fromNodeId,
    hops: [],
    visited: new Set([fromNodeId]),
  }];
  const paths: PathArc[][] = [];
  let shortestLength: number | null = null;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (shortestLength !== null && current.hops.length >= shortestLength) continue;
    if (current.hops.length >= maxHops) continue;
    for (const arc of adjacency.get(current.node_id) ?? []) {
      if (current.visited.has(arc.to_node_id)) continue;
      const hops = [...current.hops, arc];
      if (arc.to_node_id === toNodeId) {
        shortestLength ??= hops.length;
        if (hops.length === shortestLength) {
          paths.push(hops);
          if (paths.length > maxPaths) {
            return { paths: paths.slice(0, maxPaths), overflow: "path-cap" };
          }
        }
        continue;
      }
      if (shortestLength === null) {
        queue.push({
          node_id: arc.to_node_id,
          hops,
          visited: new Set([...current.visited, arc.to_node_id]),
        });
      }
    }
  }
  return { paths, overflow: null };
};

/** @param {ReadonlyMap<string, readonly JsonRecord[]>} adjacency @param {string} fromNodeId @param {string} toNodeId */
const reachable = (
  adjacency: ReadonlyMap<string, readonly PathArc[]>,
  fromNodeId: string,
  toNodeId: string,
) => {
  if (fromNodeId === toNodeId) return true;
  const queue = [fromNodeId];
  const visited = new Set(queue);
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (nodeId === undefined) break;
    for (const arc of adjacency.get(nodeId) ?? []) {
      if (arc.to_node_id === toNodeId) return true;
      if (!visited.has(arc.to_node_id)) {
        visited.add(arc.to_node_id);
        queue.push(arc.to_node_id);
      }
    }
  }
  return false;
};

/** @param {ReturnType<typeof normalizeQuery>} query */
const resultBase = (query: NormalizedPathQuery) => ({
  path_result_id: `path:${query.policy_id}:${query.from_node_id}:${query.to_node_id}`,
  from_node_id: query.from_node_id,
  to_node_id: query.to_node_id,
  policy_id: query.policy_id,
  policy_version: query.policy_version,
  max_paths: query.max_paths,
  max_hops: query.max_hops,
});

/** @param {JsonRecord} admittedScene @param {ReturnType<typeof normalizeQuery>} query */
const compileLocatorResult = (
  admittedScene: AdmittedScene,
  query: NormalizedPathQuery,
): LocatorResult => {
  const adjacency = buildAdjacency(admittedScene, query.policy_id);
  const { paths, overflow } = shortestPaths(
    adjacency,
    query.from_node_id,
    query.to_node_id,
    query.max_hops,
    query.max_paths,
  );
  if (overflow !== null) {
    return deepFreeze({
      ...resultBase(query),
      status: "cap-overflow",
      cap: overflow,
      selected_path_index: paths.length > 0 ? 0 : null,
      paths,
    });
  }
  if (paths.length === 0) {
    return deepFreeze({
      ...resultBase(query),
      status: reachable(
        adjacency,
        query.from_node_id,
        query.to_node_id,
      )
        ? "cap-overflow"
        : "no-path",
      cap: reachable(adjacency, query.from_node_id, query.to_node_id)
        ? "hop-cap"
        : null,
      selected_path_index: null,
      paths: [],
    });
  }
  return deepFreeze({
    ...resultBase(query),
    status: "found",
    cap: null,
    selected_path_index: 0,
    paths,
  });
};

/**
 * Compile shortest path alternatives as v1.3 relation locators. No scene
 * digest is copied into the draft result.
 *
 * @param {unknown} sceneInput
 * @param {unknown} queryInput
 */
export async function compilePathLocators(
  sceneInput: unknown,
  queryInput: unknown,
) {
  const admittedScene = await admitKnowledgeSceneV13(sceneInput) as AdmittedScene;
  return compileLocatorResult(admittedScene, normalizeQuery(queryInput));
}

/** @param {JsonRecord} admittedScene @param {JsonRecord} locatorResult */
const bindLocatorResult = (
  admittedScene: AdmittedScene,
  locatorResult: LocatorResult,
) => {
  const paths = locatorResult.paths.map((path) =>
    path.map((hop) => {
      const ref = relationRef(admittedScene, hop.relation_ref.source_relation_id);
      const resolution = resolveRelationRef(admittedScene, ref);
      if (resolution.status !== "resolved") {
        throw new PathQueryError([
          `PATH_RELATION_${resolution.status.toUpperCase()}:${ref.source_relation_id}`,
        ]);
      }
      return {
        from_node_id: hop.from_node_id,
        relation_ref: ref,
        to_node_id: hop.to_node_id,
        traversal_direction: hop.traversal_direction,
      };
    }),
  );
  return deepFreeze({ ...locatorResult, paths });
};

/**
 * Compile and bind bounded paths only after v1.3 scene admission. Every hop is
 * resolved by locator key; endpoint/predicate tuple fallback is absent.
 *
 * @param {unknown} sceneInput
 * @param {unknown} queryInput
 */
export async function compileBoundedPaths(
  sceneInput: unknown,
  queryInput: unknown,
) {
  const admittedScene = await admitKnowledgeSceneV13(sceneInput) as AdmittedScene;
  const locatorResult = compileLocatorResult(
    admittedScene,
    normalizeQuery(queryInput),
  );
  return bindLocatorResult(admittedScene, locatorResult);
}

/**
 * Resolve a previously compiled path result against one admitted scene.
 * Missing and stale references stay typed and never fall back to relation
 * tuples.
 *
 * @param {unknown} sceneInput
 * @param {unknown} resultInput
 */
export async function resolvePathResult(
  sceneInput: unknown,
  resultInput: unknown,
) {
  const admittedScene = await admitKnowledgeSceneV13(sceneInput) as AdmittedScene;
  if (!isRecord(resultInput) || !Array.isArray(resultInput.paths)) {
    throw new PathQueryError(["PATH_RESULT_INVALID"]);
  }
  for (const [pathIndex, path] of resultInput.paths.entries()) {
    if (!Array.isArray(path)) {
      throw new PathQueryError([`PATH_INVALID:${pathIndex}`]);
    }
    for (const [hopIndex, hop] of path.entries()) {
      if (!isRecord(hop) || !isRecord(hop.relation_ref)) {
        throw new PathQueryError([`PATH_HOP_INVALID:${pathIndex}:${hopIndex}`]);
      }
      const resolution = resolveRelationRef(
        admittedScene,
        hop.relation_ref as RelationRef,
      );
      if (resolution.status === "stale-scene") {
        return deepFreeze({
          status: "stale-scene",
          path_index: pathIndex,
          hop_index: hopIndex,
          relation_ref: resolution.ref,
          actual_scene_digest: resolution.actual_scene_digest,
        });
      }
      if (resolution.status === "missing") {
        return deepFreeze({
          status: "missing-reference",
          path_index: pathIndex,
          hop_index: hopIndex,
          relation_ref: resolution.ref,
        });
      }
      const expectedTraversal = traversalDirection(
        resolution.facet,
        hop.from_node_id,
        hop.to_node_id,
      );
      const endpointsMatch =
        (resolution.facet.source_node_id === hop.from_node_id &&
          resolution.facet.target_node_id === hop.to_node_id) ||
        (resolution.facet.target_node_id === hop.from_node_id &&
          resolution.facet.source_node_id === hop.to_node_id);
      if (!endpointsMatch || hop.traversal_direction !== expectedTraversal) {
        throw new PathQueryError([
          `PATH_HOP_FACET_DRIFT:${pathIndex}:${hopIndex}:${resolution.ref.source_relation_id}`,
        ]);
      }
    }
  }
  return deepFreeze({ status: "resolved", result: resultInput });
}
