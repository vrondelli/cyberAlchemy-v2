import type { VerifiedDataset } from "../contracts/bundle";
import type { RelationRecord, RelationViewModel } from "../contracts/relation";
import type { Selection } from "../state/workbenchState";
import { nodeViewModel, type NodeViewModel } from "./nodePresentation";
import { relationViewModel } from "./relationViewModels";

export type EvidenceSelectionModel =
  | { readonly kind: "node"; readonly node: NodeViewModel; readonly authorityEffect: string; readonly sourceDigest: string }
  | { readonly kind: "relation"; readonly relation: RelationViewModel; readonly authorityEffect: string; readonly diagnostics: readonly string[] }
  | null;

export function evidenceSelectionModel(dataset: VerifiedDataset, relations: ReadonlyMap<string, RelationRecord>, selection: Selection): EvidenceSelectionModel {
  if (!selection) return null;
  if (selection.kind === "node") {
    const node = dataset.graph.nodes.find((item) => item.id === selection.id); const evidence = dataset.sidecar.nodes[selection.id];
    return node ? { kind: "node", node: nodeViewModel(node, evidence), authorityEffect: evidence?.authority_effect ?? "unknown", sourceDigest: evidence?.source_digest ?? "unavailable" } : null;
  }
  const relation = relations.get(selection.id); const evidence = dataset.sidecar.edges[selection.id];
  return relation ? { kind: "relation", relation: relationViewModel(relation), authorityEffect: evidence?.authority_effect ?? "unknown", diagnostics: evidence?.diagnostics ?? [] } : null;
}
