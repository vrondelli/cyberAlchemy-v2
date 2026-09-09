import type { VerifiedDataset } from "../contracts/bundle";
import type { WorkbenchMode, WorkbenchState } from "./workbenchState";
const MODES: readonly WorkbenchMode[] = ["overview", "focus", "path", "outline", "table"];
export function serializeDeepLink(state: WorkbenchState): string {
  const params = new URLSearchParams({ v: "1", focus: state.focusId, mode: state.mode });
  if (state.selection) params.set("selected", `${state.selection.kind}:${state.selection.id}`);
  if (state.query) params.set("q", state.query);
  Object.entries(state.filters).sort().forEach(([group, values]) => [...values].sort().forEach((value) => params.append(`filter.${group}`, value)));
  return `?${params.toString()}`;
}
export function parseDeepLink(search: string, dataset: VerifiedDataset): Partial<WorkbenchState> & { recovery?: string | null } {
  const params = new URLSearchParams(search); if (!params.size) return {};
  if (params.get("v") !== "1") return { recovery: "The link version was not recognized; the default scene was opened." };
  const focusId = params.get("focus") ?? ""; const mode = params.get("mode") as WorkbenchMode;
  if (!dataset.sidecar.nodes[focusId] || !MODES.includes(mode)) return { recovery: "The link referred to unavailable ontology state; the default scene was opened." };
  const filters: Record<string, string[]> = {};
  params.forEach((value, key) => { if (key.startsWith("filter.")) (filters[key.slice(7)] ??= []).push(value); });
  return { focusId, mode, query: params.get("q") ?? "", filters, recovery: null };
}
