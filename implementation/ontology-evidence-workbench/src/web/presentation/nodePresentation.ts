import type { PresentationNode, SidecarNode } from "../contracts/bundle";
import { nodeKind } from "../scene/sourceGraph";

export interface NodeViewModel {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: string;
  readonly category: string;
  readonly iconKey: string;
  readonly sourcePath: string;
  readonly mappingLoss: string;
  readonly tags: readonly string[];
}

export function nodeViewModel(node: PresentationNode, evidence?: SidecarNode): NodeViewModel {
  const category = node.knowledgeMeta?.category ?? "Concept";
  const kind = nodeKind(node.tags, evidence?.source_kind_original ?? category);
  return { id: node.id, title: node.name || node.id.replace(/^presentation:/, ""), summary: node.knowledgeMeta?.content || node.summary || "No definition was supplied.", kind, category, iconKey: kind.toLowerCase(), sourcePath: evidence?.source_path ?? node.filePath ?? "Source unavailable", mappingLoss: evidence?.mapping_loss ?? "unknown", tags: node.tags };
}
