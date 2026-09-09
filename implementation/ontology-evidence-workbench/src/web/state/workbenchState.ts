import type { VerifiedDataset } from "../contracts/bundle";

export type WorkbenchMode = "overview" | "focus" | "path" | "outline" | "table";
export type Selection = { readonly kind: "node"; readonly id: string } | { readonly kind: "relation"; readonly id: string } | null;
export interface SceneDescriptor { readonly focusId: string; readonly mode: WorkbenchMode; readonly selection: Selection }
export interface WorkbenchState {
  readonly datasetId: string;
  readonly mode: WorkbenchMode;
  readonly focusId: string;
  readonly selection: Selection;
  readonly query: string;
  readonly filters: Readonly<Record<string, readonly string[]>>;
  readonly history: readonly SceneDescriptor[];
  readonly historyIndex: number;
  readonly recovery: string | null;
}

export type WorkbenchAction =
  | { readonly type: "select"; readonly selection: Selection }
  | { readonly type: "set-mode"; readonly mode: WorkbenchMode }
  | { readonly type: "pivot"; readonly focusId: string }
  | { readonly type: "set-query"; readonly query: string }
  | { readonly type: "set-filter"; readonly group: string; readonly values: readonly string[] }
  | { readonly type: "history-back" }
  | { readonly type: "history-forward" }
  | { readonly type: "recover"; readonly message: string | null };

export function createInitialWorkbenchState(dataset: VerifiedDataset, requestedFocus?: string): WorkbenchState {
  const tourSeed = dataset.graph.tour?.[0]?.nodeIds.find((id) => dataset.sidecar.nodes[id]);
  const fallback = dataset.graph.nodes[0]?.id;
  if (!fallback) throw new Error("A verified dataset cannot initialize an empty workbench.");
  const focusId = requestedFocus && dataset.sidecar.nodes[requestedFocus] ? requestedFocus : tourSeed ?? fallback;
  return { datasetId: dataset.manifest.datasetId, mode: "overview", focusId, selection: { kind: "node", id: focusId }, query: "", filters: {}, history: [{ focusId, mode: "overview", selection: { kind: "node", id: focusId } }], historyIndex: 0, recovery: requestedFocus && requestedFocus !== focusId ? "Unknown focus was replaced with the default scene." : null };
}
