import {
  canonicalRelationJson,
  relationLocator,
  resolveRelationRef,
  type RelationRef,
} from "./relationReference.ts";

const SOURCE_DIRECTIONS = new Set(["forward", "reverse", "bidirectional"]);

type JsonRecord = Record<string, unknown>;
type PortalConstituent = JsonRecord & {
  relation_ref: Readonly<{source_relation_id: string}>;
  exact_predicate: string;
};
type DestinationCluster = JsonRecord & {
  label: string;
  purpose: string;
  icon_token: string;
  member_node_ids: unknown[];
};
type PortalGroup = {
  cluster: DestinationCluster;
  constituents: PortalConstituent[];
};
type CompiledViewPack = JsonRecord & {
  cluster_id_by_node_id: Record<string, unknown>;
  cluster_by_id: Record<string, unknown>;
};

export class PortalQueryError extends Error {
  code: string;
  issues: string[];

  constructor(issues: string[] = []) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW portal query rejected: ${stableIssues.join(", ")}`);
    this.name = "PortalQueryError";
    this.code = "OEW_PORTAL_QUERY_REJECTED";
    this.issues = stableIssues;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** @param {string} text */
const sha256Hex = async (text: string) => {
  if (!globalThis.crypto?.subtle) {
    throw new PortalQueryError(["SHA256_UNAVAILABLE"]);
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/** @param {readonly JsonRecord[]} constituents */
const predicateSummary = (constituents: readonly JsonRecord[]) => {
  const counts = new Map<string, number>();
  for (const constituent of constituents) {
    const predicate = constituent.exact_predicate;
    if (!isNonemptyString(predicate)) {
      throw new PortalQueryError(["PORTAL_EXACT_PREDICATE_INVALID"]);
    }
    counts.set(predicate, (counts.get(predicate) ?? 0) + 1);
  }
  return [...counts]
    .sort(([leftPredicate, leftCount], [rightPredicate, rightCount]) =>
      rightCount - leftCount || leftPredicate.localeCompare(rightPredicate),
    )
    .slice(0, 3)
    .map(([exactPredicate, relationCount]) => ({
      exact_predicate: exactPredicate,
      relation_count: relationCount,
    }));
};

/** @param {JsonRecord} portal */
const portalSummaryBasis = (portal: JsonRecord) => {
  if (!Array.isArray(portal.constituents) || portal.constituents.length === 0) {
    throw new PortalQueryError(["PORTAL_CONSTITUENTS_INVALID"]);
  }
  return {
    portal_id: portal.portal_id,
    destination_cluster_id: portal.destination_cluster_id,
    destination_cluster_label: portal.destination_cluster_label,
    destination_cluster_purpose: portal.destination_cluster_purpose,
    destination_cluster_icon_token: portal.destination_cluster_icon_token,
    destination_node_count: portal.destination_node_count,
    constituent_count: portal.constituent_count,
    predicate_summary: portal.predicate_summary,
    constituents: portal.constituents.map((constituent, index) => {
      if (!isRecord(constituent) || !isRecord(constituent.relation_ref)) {
        throw new PortalQueryError([`PORTAL_CONSTITUENT_INVALID:${index}`]);
      }
      return {
        source_relation_id: constituent.relation_ref.source_relation_id,
        inside_endpoint_node_id: constituent.inside_endpoint_node_id,
        outside_endpoint_node_id: constituent.outside_endpoint_node_id,
        exact_predicate: constituent.exact_predicate,
        source_direction: constituent.source_direction,
        traversal_direction: constituent.traversal_direction,
        destination_cluster_id: constituent.destination_cluster_id,
        visible_label: constituent.visible_label,
        direction_label: constituent.direction_label,
        color_token: constituent.color_token,
        pattern_token: constituent.pattern_token,
      };
    }),
  };
};

/** @param {JsonRecord} portal */
export const computePortalSummaryDigest = (portal: JsonRecord) =>
  sha256Hex(
    `oew/portal-summary/v1\0${canonicalRelationJson(portalSummaryBasis(portal))}`,
  );

/**
 * Compile one lossless portal draft per declared destination cluster. Relation
 * locators intentionally carry no scene revision; the v1.3 finalizer binds it.
 *
 * @param {unknown} cutRelationsInput
 * @param {unknown} visibleNodeIdsInput
 * @param {unknown} viewPackInput
 * @param {number} maxPortals
 */
export async function compilePortalDrafts(
  cutRelationsInput: unknown,
  visibleNodeIdsInput: unknown,
  viewPackInput: unknown,
  maxPortals: number,
) {
  const issues: string[] = [];
  if (!Array.isArray(cutRelationsInput)) issues.push("PORTAL_CUT_RELATIONS_INVALID");
  if (!Array.isArray(visibleNodeIdsInput)) issues.push("PORTAL_VISIBLE_NODES_INVALID");
  if (
    !isRecord(viewPackInput) ||
    !isRecord(viewPackInput.cluster_id_by_node_id) ||
    !isRecord(viewPackInput.cluster_by_id)
  ) {
    issues.push("PORTAL_VIEW_PACK_INVALID");
  }
  if (!Number.isInteger(maxPortals) || maxPortals < 0) {
    issues.push("PORTAL_CAP_INVALID");
  }
  if (issues.length) throw new PortalQueryError(issues);

  const cutRelations = cutRelationsInput as unknown[];
  const visible = new Set(visibleNodeIdsInput as string[]);
  const viewPack = viewPackInput as CompiledViewPack;
  const groups = new Map<string, PortalGroup>();
  const seenRelationIds = new Set<string>();

  for (const [index, relation] of cutRelations.entries()) {
    if (
      !isRecord(relation) ||
      !isNonemptyString(relation.source_relation_id) ||
      !isNonemptyString(relation.source_node_id) ||
      !isNonemptyString(relation.target_node_id) ||
      !isNonemptyString(relation.exact_predicate) ||
      typeof relation.source_direction !== "string" ||
      !SOURCE_DIRECTIONS.has(relation.source_direction)
    ) {
      issues.push(`PORTAL_RELATION_INVALID:${index}`);
      continue;
    }
    const relationId = relation.source_relation_id;
    if (seenRelationIds.has(relationId)) {
      issues.push(`PORTAL_RELATION_DUPLICATED:${relationId}`);
      continue;
    }
    seenRelationIds.add(relationId);

    const sourceVisible = visible.has(relation.source_node_id);
    const targetVisible = visible.has(relation.target_node_id);
    if (sourceVisible === targetVisible) {
      issues.push(`PORTAL_RELATION_NOT_CUT:${relationId}`);
      continue;
    }
    const insideNodeId = sourceVisible
      ? relation.source_node_id
      : relation.target_node_id;
    const outsideNodeId = sourceVisible
      ? relation.target_node_id
      : relation.source_node_id;
    const destinationClusterId =
      viewPack.cluster_id_by_node_id[outsideNodeId];
    const destinationCluster =
      isNonemptyString(destinationClusterId)
        ? viewPack.cluster_by_id[destinationClusterId]
        : undefined;
    if (
      !isNonemptyString(destinationClusterId) ||
      !isRecord(destinationCluster) ||
      !isNonemptyString(destinationCluster.label) ||
      !isNonemptyString(destinationCluster.purpose) ||
      !isNonemptyString(destinationCluster.icon_token) ||
      !Array.isArray(destinationCluster.member_node_ids)
    ) {
      issues.push(`PORTAL_DESTINATION_UNRESOLVED:${outsideNodeId}`);
      continue;
    }

    const withSource =
      relation.source_direction === "reverse" ? targetVisible : sourceVisible;
    const traversalDirection =
      relation.source_direction === "bidirectional"
        ? "either"
        : withSource
          ? "with-source"
          : "against-source";
    const constituent: PortalConstituent = {
      relation_ref: relationLocator(relationId),
      inside_endpoint_node_id: insideNodeId,
      outside_endpoint_node_id: outsideNodeId,
      exact_predicate: relation.exact_predicate,
      source_direction: relation.source_direction,
      traversal_direction: traversalDirection,
      destination_cluster_id: destinationClusterId,
      visible_label: relation.visible_label,
      direction_label: relation.direction_label,
      color_token: relation.color_token,
      pattern_token: relation.pattern_token,
    };
    const group = groups.get(destinationClusterId) ?? {
      cluster: destinationCluster as DestinationCluster,
      constituents: [] as PortalConstituent[],
    };
    group.constituents.push(constituent);
    groups.set(destinationClusterId, group);
  }
  if (groups.size > maxPortals) {
    issues.push(`PORTAL_CAP_EXCEEDED:${groups.size}:${maxPortals}`);
  }
  if (issues.length) throw new PortalQueryError(issues);

  const portals: JsonRecord[] = [];
  for (const [destinationClusterId, group] of [...groups].sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const constituents = group.constituents.sort((left, right) =>
      left.relation_ref.source_relation_id.localeCompare(
        right.relation_ref.source_relation_id,
      ),
    );
    const portal = {
      portal_id: `portal:${destinationClusterId}`,
      destination_cluster_id: destinationClusterId,
      destination_cluster_label: group.cluster.label,
      destination_cluster_purpose: group.cluster.purpose,
      destination_cluster_icon_token: group.cluster.icon_token,
      destination_node_count: group.cluster.member_node_ids.length,
      constituent_count: constituents.length,
      predicate_summary: predicateSummary(constituents),
      constituents,
    };
    portals.push({
      ...portal,
      summary_digest: await computePortalSummaryDigest(portal),
    });
  }
  return portals;
}

/**
 * Revalidate portal summaries, cut-relation coverage, and exact resolver
 * identity after v1.3 admission has rebuilt the runtime relation index.
 *
 * @param {unknown} sceneInput
 */
export async function validatePortalSceneV13(sceneInput: unknown) {
  if (!isRecord(sceneInput)) {
    throw new PortalQueryError(["PORTAL_SCENE_INVALID"]);
  }
  if (!Array.isArray(sceneInput.cut_relations) || !Array.isArray(sceneInput.portals)) {
    throw new PortalQueryError(["PORTAL_SCENE_INVALID"]);
  }
  const issues: string[] = [];
  const cutById = new Map<string, JsonRecord>();
  for (const [index, relation] of sceneInput.cut_relations.entries()) {
    if (!isRecord(relation) || !isNonemptyString(relation.source_relation_id)) {
      issues.push(`PORTAL_CUT_RELATION_INVALID:${index}`);
    } else if (cutById.has(relation.source_relation_id)) {
      issues.push(`PORTAL_RELATION_DUPLICATED:${relation.source_relation_id}`);
    } else {
      cutById.set(relation.source_relation_id, relation);
    }
  }

  const portalIds = sceneInput.portals.map((portal) =>
    isRecord(portal) ? String(portal.portal_id) : "",
  );
  if (JSON.stringify(portalIds) !== JSON.stringify([...portalIds].sort())) {
    issues.push("PORTAL_ORDER_INVALID");
  }
  const seen = new Set<string>();
  for (const [portalIndex, portal] of sceneInput.portals.entries()) {
    if (!isRecord(portal) || !Array.isArray(portal.constituents)) {
      issues.push(`PORTAL_INVALID:${portalIndex}`);
      continue;
    }
    const relationIds = portal.constituents.map((constituent) =>
      isRecord(constituent) && isRecord(constituent.relation_ref)
        ? String(constituent.relation_ref.source_relation_id)
        : "",
    );
    if (JSON.stringify(relationIds) !== JSON.stringify([...relationIds].sort())) {
      issues.push(`PORTAL_CONSTITUENT_ORDER_INVALID:${portal.portal_id}`);
    }
    const expectedSummary = predicateSummary(portal.constituents as JsonRecord[]);
    if (canonicalRelationJson(expectedSummary) !== canonicalRelationJson(portal.predicate_summary)) {
      issues.push(`PORTAL_SUMMARY_DRIFT:${portal.portal_id}`);
    }
    const expectedDigest = await computePortalSummaryDigest(portal);
    if (portal.summary_digest !== expectedDigest) {
      issues.push(`PORTAL_SUMMARY_DIGEST_DRIFT:${portal.portal_id}`);
    }
    if (portal.constituent_count !== portal.constituents.length) {
      issues.push(`PORTAL_CONSTITUENT_COUNT_DRIFT:${portal.portal_id}`);
    }

    for (const [constituentIndex, constituent] of portal.constituents.entries()) {
      if (!isRecord(constituent) || !isRecord(constituent.relation_ref)) {
        issues.push(`PORTAL_CONSTITUENT_INVALID:${portalIndex}:${constituentIndex}`);
        continue;
      }
      const relationId = constituent.relation_ref.source_relation_id;
      if (!isNonemptyString(relationId)) {
        issues.push(`PORTAL_CONSTITUENT_INVALID:${portalIndex}:${constituentIndex}`);
        continue;
      }
      if (seen.has(relationId)) issues.push(`PORTAL_RELATION_DUPLICATED:${relationId}`);
      seen.add(relationId);
      if (!cutById.has(relationId)) issues.push(`PORTAL_RELATION_NOT_CUT:${relationId}`);
      if (constituent.destination_cluster_id !== portal.destination_cluster_id) {
        issues.push(`PORTAL_DESTINATION_DRIFT:${relationId}`);
      }
      let resolution;
      try {
        resolution = resolveRelationRef(
          sceneInput as JsonRecord & {scene_digest: string},
          constituent.relation_ref as RelationRef,
        );
      } catch {
        issues.push(`PORTAL_RELATION_REFERENCE_INVALID:${relationId}`);
        continue;
      }
      if (resolution.status !== "resolved") {
        issues.push(`PORTAL_RELATION_${resolution.status.toUpperCase()}:${relationId}`);
        continue;
      }
      const insideIsSource =
        resolution.facet.source_node_id === constituent.inside_endpoint_node_id;
      const endpointsMatch =
        (insideIsSource &&
          resolution.facet.target_node_id === constituent.outside_endpoint_node_id) ||
        (resolution.facet.target_node_id === constituent.inside_endpoint_node_id &&
          resolution.facet.source_node_id === constituent.outside_endpoint_node_id);
      const withSource =
        resolution.facet.source_direction === "reverse"
          ? !insideIsSource
          : insideIsSource;
      const expectedTraversal =
        resolution.facet.source_direction === "bidirectional"
          ? "either"
          : withSource
            ? "with-source"
            : "against-source";
      if (
        resolution.facet.exact_predicate !== constituent.exact_predicate ||
        resolution.facet.source_direction !== constituent.source_direction ||
        constituent.traversal_direction !== expectedTraversal ||
        !endpointsMatch
      ) {
        issues.push(`PORTAL_RELATION_FACET_DRIFT:${relationId}`);
      }
    }
  }
  const cutIds = [...cutById.keys()].sort();
  const portalRelationIds = [...seen].sort();
  if (canonicalRelationJson(cutIds) !== canonicalRelationJson(portalRelationIds)) {
    issues.push("PORTAL_CUT_PARTITION_NOT_TOTAL");
  }
  if (issues.length) throw new PortalQueryError(issues);
  return sceneInput;
}
