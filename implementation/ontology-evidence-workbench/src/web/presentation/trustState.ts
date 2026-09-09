import type { VerifiedDataset } from "../contracts/bundle";
export type TrustState = { readonly level: "verified" | "degraded" | "failed"; readonly title: string; readonly message: string; readonly source: string };
export function deriveTrustState(dataset: VerifiedDataset | null, error?: string | null): TrustState {
  if (error) return { level: "failed", title: "Evidence admission failed", message: error, source: "dataset loader" };
  if (!dataset) return { level: "degraded", title: "Verifying evidence", message: "The workbench is checking exact artifact bytes.", source: "dataset loader" };
  const lossy = Object.values(dataset.sidecar.nodes).filter((node) => node.mapping_loss === "lossy").length;
  return { level: "verified", title: "Verified read-only projection", message: `${dataset.graph.nodes.length} nodes and ${dataset.graph.edges.length} relations admitted. ${lossy} nodes declare lossy presentation mapping.`, source: dataset.manifest.runId };
}
