// @ts-nocheck

export const KEYBOARD_COMMANDS = Object.freeze([
  {keys: ["/"], command: "open-search", label: "Search evidence"},
  {keys: ["meta", "k"], command: "open-search", label: "Command palette"},
  {keys: ["shift", "i"], command: "toggle-inspector", label: "Inspector"},
  {keys: ["r"], command: "toggle-receipts", label: "Receipt drawer"},
  {keys: ["g"], command: "view-graph", label: "Graph view"},
  {keys: ["o"], command: "view-outline", label: "Outline view"},
  {keys: ["t"], command: "view-table", label: "Table view"},
]);

export function keyboardCommand(event) {
  const key = lowerKey(event.key);
  if ((event.metaKey || event.ctrlKey) && key === "k") return "open-search";
  if (event.shiftKey && key === "i") return "toggle-inspector";
  if (key === "/") return "open-search";
  if (key === "r") return "toggle-receipts";
  if (key === "g") return "view-graph";
  if (key === "o") return "view-outline";
  if (key === "t") return "view-table";
  if (key === "escape") return "dismiss";
  return null;
}

const lowerKey = (value) => String(value ?? "").toLowerCase();

export function buildDeepLink({
  runId,
  selectedSourceRef,
  surface,
  filters,
}) {
  const params = new URLSearchParams();
  params.set("oew", "1");
  params.set("run", runId);
  if (selectedSourceRef) params.set("selected", selectedSourceRef);
  if (["graph", "outline", "table"].includes(surface)) {
    params.set("surface", surface);
  }
  if (filters?.text) params.set("q", filters.text);
  return `?${params.toString()}`;
}

export function parseDeepLink(search, availableSourceRefs) {
  const params = new URLSearchParams(search);
  const requested = params.get("selected");
  const selectedSourceRef = availableSourceRefs.includes(requested)
    ? requested
    : availableSourceRefs.includes("F1")
      ? "F1"
      : availableSourceRefs[0] ?? null;
  const requestedSurface = params.get("surface");
  return {
    runId: params.get("run"),
    selectedSourceRef,
    recoveredInvalidSelection: Boolean(
      requested && requested !== selectedSourceRef,
    ),
    surface: ["graph", "outline", "table"].includes(requestedSurface)
      ? requestedSurface
      : "graph",
    filters: {text: params.get("q") ?? ""},
  };
}
