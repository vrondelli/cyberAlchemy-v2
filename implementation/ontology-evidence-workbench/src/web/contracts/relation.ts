import type { PresentationEdge, SidecarEdge } from "./bundle";

export type RelationFamily = "authority" | "dependency" | "flow" | "membership" | "evidence" | "state" | "competition" | "other";

export interface RelationRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly sourcePredicate: string;
  readonly family: RelationFamily;
  readonly label: string;
  readonly sentence: string;
  readonly color: string;
  readonly dash: "solid" | "dashed" | "dotted";
  readonly direction: "forward" | "reverse" | "both";
  readonly mappingLoss: string;
  readonly evidenceRefs: readonly string[];
  readonly presentation: PresentationEdge;
  readonly evidence?: SidecarEdge;
}

export interface RelationViewModel {
  readonly id: string;
  readonly predicate: string;
  readonly label: string;
  readonly sentence: string;
  readonly color: string;
  readonly dash: RelationRecord["dash"];
  readonly sourceId: string;
  readonly targetId: string;
  readonly evidenceRefs: readonly string[];
  readonly mappingLoss: string;
}
