import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { NODE_HEIGHT, NODE_WIDTH, computeLayout, type LayoutResult } from "./layout";

export interface OntologyNodeRecord {
  readonly id: string; readonly kind: string; readonly label: string; readonly status: string;
  readonly meaning: string; readonly owner_route: string; readonly source_refs: readonly string[];
  readonly boundary: string; readonly claim_ceiling: string; readonly authority_effect: "none";
}
export interface OntologyRelationRecord {
  readonly id: string; readonly type: string; readonly source: string; readonly target: string;
  readonly claim: string; readonly authority_effect: "none";
  readonly direction?: string;
}
export interface WorkspaceGraphSource {
  readonly graphId: string; readonly sourceEpoch: string;
  readonly sourceDigests: Readonly<{ nodes: string; relations: string }>;
  readonly authorityEffect: "none"; readonly nodes: readonly OntologyNodeRecord[];
  readonly relations: readonly OntologyRelationRecord[];
}
export interface OntologyNodeData extends Record<string, unknown> {
  readonly record: OntologyNodeRecord; readonly incoming: readonly OntologyRelationRecord[];
  readonly outgoing: readonly OntologyRelationRecord[]; readonly onActivate?: (id: string) => void;
}
export interface OntologyEdgeData extends Record<string, unknown> { readonly relation: OntologyRelationRecord; }
export type OntologyCanvasNode = Node<OntologyNodeData, "ontology">;
export type OntologyCanvasEdge = Edge<OntologyEdgeData, "ontology">;
export type SemanticIconKey = "factory" | "product" | "project" | "goal" | "capability" | "participant" | "outcome" | "artifact" | "collection" | "entry" | "external" | "unknown";
export type PresentationFamily = "structure" | "coordination" | "flow" | "provenance" | "unmapped";

const ICON_BY_KIND: Readonly<Record<string, SemanticIconKey>> = { Product: "product", Project: "project", Goal: "goal", "Product Capability": "capability", Participant: "participant", Outcome: "outcome", Artifact: "artifact", Collection: "collection", "Project Entry": "entry", "External Reference": "external" };
export function semanticIconKey(record: Pick<OntologyNodeRecord, "kind" | "label">): SemanticIconKey { return /ontolog(?:y|ies)/i.test(record.label) ? "factory" : ICON_BY_KIND[record.kind] ?? "unknown"; }

export const PRESENTATION_FAMILIES: Readonly<Record<Exclude<PresentationFamily, "unmapped">, readonly string[]>> = Object.freeze({
  structure: ["instance_of", "belongs_to_product", "belongs_to", "contains", "includes_entry"],
  coordination: ["coordinates", "serves", "enables"],
  flow: ["produces"],
  provenance: ["informed_by"],
});
const FAMILY_COLORS: Readonly<Record<PresentationFamily, string>> = { structure: "#b7791f", coordination: "#2f855a", flow: "#267aa3", provenance: "#b83280", unmapped: "#5c6870" };
export function presentationFamily(type: string): PresentationFamily {
  for (const [family, predicates] of Object.entries(PRESENTATION_FAMILIES)) if (predicates.includes(type)) return family as PresentationFamily;
  return "unmapped";
}
export function relationPresentationStyle(type: string) { const family = presentationFamily(type); return { family, color: FAMILY_COLORS[family], token: `relation-${family}`, mapped: family !== "unmapped" } as const; }

export function indexRelations(source: WorkspaceGraphSource) {
  const incoming = new Map<string, OntologyRelationRecord[]>();
  const outgoing = new Map<string, OntologyRelationRecord[]>();
  for (const node of source.nodes) { incoming.set(node.id, []); outgoing.set(node.id, []); }
  for (const relation of source.relations) { incoming.get(relation.target)?.push(relation); outgoing.get(relation.source)?.push(relation); }
  return { incoming, outgoing };
}

export function filterGraphByPredicates(source: WorkspaceGraphSource, predicates: readonly string[] | null): WorkspaceGraphSource {
  if (predicates === null) return source;
  const allowed = new Set(predicates);
  const relations = source.relations.filter((relation) => allowed.has(relation.type));
  const ids = new Set(relations.flatMap((relation) => [relation.source, relation.target]));
  return { ...source, nodes: source.nodes.filter((node) => ids.has(node.id)), relations };
}

export function derivePortalScene(source: WorkspaceGraphSource, originId: string | null) {
  if (!originId || !source.nodes.some((node) => node.id === originId)) return { originId: null, nodeIds: new Set(source.nodes.map((node) => node.id)), edgeIds: new Set(source.relations.map((relation) => relation.id)) };
  const relations = source.relations.filter((relation) => relation.source === originId || relation.target === originId);
  return { originId, nodeIds: new Set([originId, ...relations.flatMap((relation) => [relation.source, relation.target])]), edgeIds: new Set(relations.map((relation) => relation.id)) };
}

export function buildCanvasGraph(source: WorkspaceGraphSource): { nodes: OntologyCanvasNode[]; edges: OntologyCanvasEdge[]; layoutMs: number } {
  return materializeCanvasGraph(source, computeLayout(source));
}

export function materializeCanvasGraph(source: WorkspaceGraphSource, layout: LayoutResult): { nodes: OntologyCanvasNode[]; edges: OntologyCanvasEdge[]; layoutMs: number } {
  const adjacency = indexRelations(source);
  const nodes = source.nodes.map((record): OntologyCanvasNode => { const position = layout.positions[record.id] ?? { x: 0, y: 0 }; return { id: record.id, type: "ontology", position, data: { record, incoming: adjacency.incoming.get(record.id) ?? [], outgoing: adjacency.outgoing.get(record.id) ?? [] }, width: NODE_WIDTH, height: NODE_HEIGHT, draggable: true, connectable: false, deletable: false, selectable: true, focusable: false }; });
  const edges = source.relations.map((relation): OntologyCanvasEdge => { const style = relationPresentationStyle(relation.type); return { id: relation.id, source: relation.source, target: relation.target, type: "ontology", className: style.token, data: { relation }, style: { stroke: style.color }, markerEnd: relation.direction === "symmetric" ? undefined : { type: MarkerType.ArrowClosed, width: 16, height: 16, color: style.color }, reconnectable: false, deletable: false, selectable: true, focusable: true, ariaLabel: `${relation.source} ${relation.type} ${relation.target}` }; });
  return { nodes, edges, layoutMs: layout.layoutMs };
}

export function validateGraph(source: WorkspaceGraphSource): string[] {
  const errors: string[] = []; const nodeIds = new Set(source.nodes.map((node) => node.id)); const relationIds = new Set<string>();
  if (nodeIds.size !== source.nodes.length) errors.push("DUPLICATE_NODE_ID");
  for (const relation of source.relations) { if (relationIds.has(relation.id)) errors.push(`DUPLICATE_RELATION_ID:${relation.id}`); relationIds.add(relation.id); if (!nodeIds.has(relation.source)) errors.push(`MISSING_SOURCE:${relation.id}`); if (!nodeIds.has(relation.target)) errors.push(`MISSING_TARGET:${relation.id}`); }
  for (const node of source.nodes) if (node.authority_effect !== "none") errors.push(`NODE_AUTHORITY_EFFECT:${node.id}`);
  for (const relation of source.relations) if (relation.authority_effect !== "none") errors.push(`RELATION_AUTHORITY_EFFECT:${relation.id}`);
  return errors;
}
