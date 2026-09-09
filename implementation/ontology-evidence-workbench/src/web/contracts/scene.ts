import type { PresentationNode } from "./bundle";
import type { RelationRecord } from "./relation";

export interface SourceGraph {
  readonly nodes: ReadonlyMap<string, PresentationNode>;
  readonly relations: ReadonlyMap<string, RelationRecord>;
  readonly outgoing: ReadonlyMap<string, readonly RelationRecord[]>;
  readonly incoming: ReadonlyMap<string, readonly RelationRecord[]>;
}
export interface SceneNode { readonly id: string; readonly node: PresentationNode; readonly x: number; readonly y: number; readonly degree: number }
export interface BoundaryRelation { readonly relation: RelationRecord; readonly visibleId: string; readonly omittedId: string; readonly direction: "outgoing" | "incoming" }
export interface FocusScene {
  readonly focusIds: readonly string[];
  readonly nodes: readonly SceneNode[];
  readonly relations: readonly RelationRecord[];
  readonly boundary: readonly BoundaryRelation[];
  readonly omittedNodeIds: readonly string[];
  readonly visibleLimit: number;
}
export interface PortalDescriptor {
  readonly id: string;
  readonly label: string;
  readonly targetKind: string;
  readonly iconKey: string;
  readonly direction: BoundaryRelation["direction"];
  readonly family: string;
  readonly targetIds: readonly string[];
  readonly relationIds: readonly string[];
  readonly predicates: readonly string[];
  readonly count: number;
  readonly sentence: string;
  readonly pivotFocusId: string;
}
export type PathResult =
  | { readonly status: "found"; readonly nodeIds: readonly string[]; readonly relations: readonly RelationRecord[]; readonly alternatives: readonly { readonly viaId: string; readonly label: string }[] }
  | { readonly status: "same-endpoint" | "no-path" | "limit-reached" | "unknown-endpoint"; readonly message: string };
