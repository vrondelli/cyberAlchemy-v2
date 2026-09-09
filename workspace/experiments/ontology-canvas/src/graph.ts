import dagre from "@dagrejs/dagre";
import { MarkerType, type Edge, type Node } from "@xyflow/react";

export interface OntologyNodeRecord {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly status: string;
  readonly meaning: string;
  readonly owner_route: string;
  readonly source_refs: readonly string[];
  readonly boundary: string;
  readonly claim_ceiling: string;
  readonly authority_effect: "none";
}

export interface OntologyRelationRecord {
  readonly id: string;
  readonly type: string;
  readonly source: string;
  readonly target: string;
  readonly claim: string;
  readonly authority_effect: "none";
}

export interface ExperimentGraphSource {
  readonly experimentId: string;
  readonly generatedAt: string;
  readonly sourceEpoch: string;
  readonly sourceDigests: Readonly<{ nodes: string; relations: string }>;
  readonly authorityEffect: "none";
  readonly nodes: readonly OntologyNodeRecord[];
  readonly relations: readonly OntologyRelationRecord[];
}

export interface OntologyNodeData extends Record<string, unknown> {
  readonly record: OntologyNodeRecord;
  readonly incoming: readonly OntologyRelationRecord[];
  readonly outgoing: readonly OntologyRelationRecord[];
}

export interface OntologyEdgeData extends Record<string, unknown> {
  readonly relation: OntologyRelationRecord;
}

export type OntologyCanvasNode = Node<OntologyNodeData, "ontology">;
export type OntologyCanvasEdge = Edge<OntologyEdgeData, "ontology">;

export type SemanticIconKey = "factory" | "product" | "project" | "goal" | "capability" | "participant" | "outcome" | "artifact" | "collection" | "entry" | "external" | "unknown";

const ICON_BY_KIND: Readonly<Record<string, SemanticIconKey>> = {
  Product: "product",
  Project: "project",
  Goal: "goal",
  "Product Capability": "capability",
  Participant: "participant",
  Outcome: "outcome",
  Artifact: "artifact",
  Collection: "collection",
  "Project Entry": "entry",
  "External Reference": "external",
};

export function semanticIconKey(record: Pick<OntologyNodeRecord, "kind" | "label">): SemanticIconKey {
  if (/ontolog(?:y|ies)/i.test(record.label)) return "factory";
  return ICON_BY_KIND[record.kind] ?? "unknown";
}

export function derivePortalScene(source: ExperimentGraphSource, originId: string | null) {
  if (!originId || !source.nodes.some((node) => node.id === originId)) {
    return {
      originId: null,
      nodeIds: new Set(source.nodes.map((node) => node.id)),
      edgeIds: new Set(source.relations.map((relation) => relation.id)),
    };
  }
  const relations = source.relations.filter((relation) => relation.source === originId || relation.target === originId);
  const nodeIds = new Set([originId]);
  for (const relation of relations) {
    nodeIds.add(relation.source);
    nodeIds.add(relation.target);
  }
  return { originId, nodeIds, edgeIds: new Set(relations.map((relation) => relation.id)) };
}

const NODE_WIDTH = 216;
const NODE_HEIGHT = 92;

type RelationVisualFamily = "structure" | "coordination" | "flow" | "provenance";

const RELATION_PRESENTATION: Readonly<Record<string, Readonly<{ color: string; family: RelationVisualFamily }>>> = {
  instance_of: { color: "#b1611b", family: "structure" },
  belongs_to_product: { color: "#976c17", family: "structure" },
  belongs_to: { color: "#857614", family: "structure" },
  contains: { color: "#757c13", family: "structure" },
  includes_entry: { color: "#598113", family: "structure" },
  coordinates: { color: "#3d8514", family: "coordination" },
  serves: { color: "#14852b", family: "coordination" },
  produces: { color: "#197ea9", family: "flow" },
  enables: { color: "#ac40e2", family: "coordination" },
  informed_by: { color: "#dd2085", family: "provenance" },
};

const UNMAPPED_RELATION = { color: "#5c6870", family: "provenance" } as const;

export function relationPresentationStyle(type: string) {
  const presentation = RELATION_PRESENTATION[type] ?? UNMAPPED_RELATION;
  return {
    ...presentation,
    token: `relation-${presentation.family}`,
    mapped: type in RELATION_PRESENTATION,
  } as const;
}

export function buildCanvasGraph(source: ExperimentGraphSource): { nodes: OntologyCanvasNode[]; edges: OntologyCanvasEdge[] } {
  const layout = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  layout.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 38, edgesep: 22, marginx: 60, marginy: 60 });
  for (const record of source.nodes) layout.setNode(record.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const relation of source.relations) layout.setEdge(relation.source, relation.target);
  dagre.layout(layout);

  const nodes = source.nodes.map((record): OntologyCanvasNode => {
    const point = layout.node(record.id);
    return {
      id: record.id,
      type: "ontology",
      position: { x: point.x - NODE_WIDTH / 2, y: point.y - NODE_HEIGHT / 2 },
      data: {
        record,
        incoming: source.relations.filter((relation) => relation.target === record.id),
        outgoing: source.relations.filter((relation) => relation.source === record.id),
      },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      draggable: true,
      connectable: false,
      deletable: false,
      selectable: true,
      focusable: true,
      ariaLabel: `${record.label}, ${record.kind}, ${record.status}`,
    };
  });

  const edges = source.relations.map((relation): OntologyCanvasEdge => {
    const presentation = relationPresentationStyle(relation.type);
    return {
      id: relation.id,
      source: relation.source,
      target: relation.target,
      type: "ontology",
      className: presentation.token,
      data: { relation },
      label: relation.type.replaceAll("_", " "),
      style: { stroke: presentation.color },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: presentation.color },
      reconnectable: false,
      deletable: false,
      selectable: true,
      focusable: true,
      ariaLabel: `${relation.source} ${relation.type} ${relation.target}`,
    };
  });

  return { nodes, edges };
}

export function validateCanvasGraph(source: ExperimentGraphSource): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(source.nodes.map((node) => node.id));
  if (nodeIds.size !== source.nodes.length) errors.push("DUPLICATE_NODE_ID");
  for (const relation of source.relations) {
    if (!nodeIds.has(relation.source)) errors.push(`MISSING_SOURCE:${relation.id}`);
    if (!nodeIds.has(relation.target)) errors.push(`MISSING_TARGET:${relation.id}`);
  }
  for (const node of source.nodes) if (node.authority_effect !== "none") errors.push(`NODE_AUTHORITY_EFFECT:${node.id}`);
  for (const relation of source.relations) if (relation.authority_effect !== "none") errors.push(`RELATION_AUTHORITY_EFFECT:${relation.id}`);
  return errors;
}
