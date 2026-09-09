// A focus scene is removable presentation state. It never changes graph or
// ontology meaning.
type FocusRecord = Record<string, unknown>;

export interface KnowledgeFocusPortal {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
  direction: string;
  sourceRef: string | null;
  sourceRelation: string | null;
  presentationRelation: string;
  authorityEffect: string | null;
  evidenceRefs: string[];
}

export interface KnowledgeFocusScene {
  active: boolean;
  mode: "full" | "tour" | "focus";
  graph: FocusRecord;
  nodeIds: string[];
  internalEdges: FocusRecord[];
  portals: KnowledgeFocusPortal[];
}

const isRecord = (value: unknown): value is FocusRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

const sourceId = (presentationId: string): string =>
  presentationId.startsWith("presentation:")
    ? presentationId.slice("presentation:".length)
    : presentationId;

const evidenceRows = (sidecar: unknown): FocusRecord[] => {
  if (!isRecord(sidecar) || !isRecord(sidecar.edges)) return [];
  const rows: FocusRecord[] = [];
  for (const [id, value] of Object.entries(sidecar.edges)) {
    if (isRecord(value)) rows.push({id, ...value});
  }
  return rows;
};

const evidenceForEdge = (
  edge: FocusRecord,
  rows: FocusRecord[],
): FocusRecord | null => {
  const edgeSource = sourceId(asString(edge.source));
  const edgeTarget = sourceId(asString(edge.target));
  const edgeType = asString(edge.type);
  const edgeDescription = asString(edge.description);
  return rows.find((row) =>
    asString(row.source) === edgeSource &&
    asString(row.target) === edgeTarget &&
    asString(row.presentation_relation) === edgeType &&
    (!edgeDescription || asString(row.source_relation) === edgeDescription)
  ) ?? null;
};

const toPortal = (
  edge: FocusRecord,
  rows: FocusRecord[],
): KnowledgeFocusPortal => {
  const evidence = evidenceForEdge(edge, rows);
  const source = asString(edge.source);
  const target = asString(edge.target);
  const type = asString(edge.type) || "related";
  const description = asString(edge.description);
  const direction = asString(edge.direction) || "forward";
  return {
    id: evidence ? asString(evidence.id) : [source, type, description, target].join("|"),
    source,
    target,
    type,
    description,
    direction,
    sourceRef: evidence ? asString(evidence.source_ref) || null : null,
    sourceRelation: evidence ? asString(evidence.source_relation) || null : null,
    presentationRelation:
      evidence ? asString(evidence.presentation_relation) || type : type,
    authorityEffect:
      evidence ? asString(evidence.authority_effect) || null : null,
    evidenceRefs: evidence ? stringArray(evidence.evidence_refs) : [],
  };
};

const portalKey = (portal: KnowledgeFocusPortal): string =>
  [
    portal.source,
    portal.presentationRelation,
    portal.sourceRelation ?? portal.description,
    portal.target,
    portal.direction,
  ].join("\u0000");

export function deriveKnowledgeFocusScene({
  graph,
  tourNodeIds = [],
  focusNodeId = null,
  sidecar = null,
}: {
  graph: unknown;
  tourNodeIds?: unknown;
  focusNodeId?: unknown;
  sidecar?: unknown;
}): KnowledgeFocusScene {
  if (!isRecord(graph)) {
    return {
      active: false,
      mode: "full",
      graph: {},
      nodeIds: [],
      internalEdges: [],
      portals: [],
    };
  }
  const nodes = Array.isArray(graph.nodes) ? graph.nodes.filter(isRecord) : [];
  const edges = Array.isArray(graph.edges) ? graph.edges.filter(isRecord) : [];
  const knownNodeIds = new Set(nodes.map((node) => asString(node.id)).filter(Boolean));
  const admittedTourIds = stringArray(tourNodeIds).filter((id) => knownNodeIds.has(id));
  const focusId =
    typeof focusNodeId === "string" && knownNodeIds.has(focusNodeId)
      ? focusNodeId
      : null;
  const selectedIds = new Set<string>();
  let mode: KnowledgeFocusScene["mode"] = "full";
  if (admittedTourIds.length > 0) {
    mode = "tour";
    for (const id of admittedTourIds) selectedIds.add(id);
  } else if (focusId) {
    mode = "focus";
    selectedIds.add(focusId);
    for (const edge of edges) {
      const source = asString(edge.source);
      const target = asString(edge.target);
      if (source === focusId && knownNodeIds.has(target)) selectedIds.add(target);
      if (target === focusId && knownNodeIds.has(source)) selectedIds.add(source);
    }
  }
  if (mode === "full") {
    return {
      active: false,
      mode,
      graph,
      nodeIds: nodes.map((node) => asString(node.id)).filter(Boolean),
      internalEdges: edges,
      portals: [],
    };
  }
  const nodeById = new Map(nodes.map((node) => [asString(node.id), node]));
  const orderedIds =
    mode === "tour"
      ? admittedTourIds
      : [...selectedIds].sort((left, right) => left.localeCompare(right));
  const sceneNodes = orderedIds
    .map((id) => nodeById.get(id))
    .filter((node): node is FocusRecord => isRecord(node));
  const internalEdges = edges.filter((edge) =>
    selectedIds.has(asString(edge.source)) &&
    selectedIds.has(asString(edge.target))
  );
  const rows = evidenceRows(sidecar);
  const portals = edges
    .filter((edge) =>
      selectedIds.has(asString(edge.source)) !==
      selectedIds.has(asString(edge.target))
    )
    .map((edge) => toPortal(edge, rows))
    .sort((left, right) => portalKey(left).localeCompare(portalKey(right)));
  return {
    active: true,
    mode,
    graph: {...graph, nodes: sceneNodes, edges: internalEdges},
    nodeIds: sceneNodes.map((node) => asString(node.id)),
    internalEdges,
    portals,
  };
}

export function reduceKnowledgeFocusState(
  state: {focusNodeId: string | null; history: string[]},
  event:
    | {type: "activate-portal"; source: string; target: string}
    | {type: "back"},
): {focusNodeId: string | null; history: string[]} {
  if (event.type === "activate-portal") {
    return {
      focusNodeId: event.target,
      history: [...state.history, event.source],
    };
  }
  if (event.type === "back" && state.history.length > 0) {
    return {
      focusNodeId: state.history[state.history.length - 1],
      history: state.history.slice(0, -1),
    };
  }
  return state;
}

export function sameOriginEvidenceSidecarUrl(
  pageUrl: string,
  retainedToken: string | null = null,
): string {
  const page = new URL(pageUrl);
  const target = new URL("/oew-data/evidence-sidecar.json", page);
  const token = page.searchParams.get("token") ?? retainedToken;
  if (token) target.searchParams.set("token", token);
  return target.toString();
}
