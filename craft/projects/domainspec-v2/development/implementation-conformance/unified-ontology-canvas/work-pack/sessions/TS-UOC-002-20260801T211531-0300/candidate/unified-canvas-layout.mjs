import {createHash} from "node:crypto";

const BAND_ORDER = Object.freeze(["meaning", "realization", "expectation", "observation", "explanation"]);
const MATURITY_ORDER = Object.freeze({active: 0, candidate: 1, deferred: 2, superseded: 3});
const CATEGORY_ORDER = Object.freeze({structural: 0, behavioral: 1, connective: 2, lifecycle: 3, ui: 4});
const PROFILE_ORDER = Object.freeze({
  "architecture.base-domain": 0,
  "architecture.typescript-strict": 1,
  "architecture.python-strict": 2,
  "architecture.rust-strict": 3,
});
const SEVERITY_ORDER = Object.freeze({error: 0, warning: 1, info: 2});
const DEFAULT_OPTIONS = Object.freeze({
  margin_x: 80,
  margin_y: 90,
  band_width: 270,
  band_gap: 70,
  node_width: 220,
  node_height: 72,
  node_gap: 28,
  band_padding: 25,
});

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
};
const stableJson = (value) => JSON.stringify(stableValue(value));
const digest = (value) => createHash("sha256").update(stableJson(value)).digest("hex");
const naturalParts = (value) => String(value).split(/(\d+)/).filter(Boolean).map((part) => /^\d+$/.test(part) ? Number(part) : part);
const compareNatural = (left, right) => {
  const leftParts = naturalParts(left);
  const rightParts = naturalParts(right);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    if (leftParts[index] === undefined) return -1;
    if (rightParts[index] === undefined) return 1;
    if (leftParts[index] === rightParts[index]) continue;
    if (typeof leftParts[index] === "number" && typeof rightParts[index] === "number") return leftParts[index] - rightParts[index];
    return String(leftParts[index]).localeCompare(String(rightParts[index]));
  }
  return 0;
};
const compareKeys = (left, right) => {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftValue = left[index] ?? "";
    const rightValue = right[index] ?? "";
    if (leftValue === rightValue) continue;
    if (typeof leftValue === "number" && typeof rightValue === "number") return leftValue - rightValue;
    return compareNatural(leftValue, rightValue);
  }
  return 0;
};
const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};
const layoutError = (diagnostics) => {
  const error = new Error(`Unified canvas node layout rejected with ${diagnostics.length} diagnostic(s).`);
  error.name = "UnifiedCanvasLayoutError";
  error.code = "UOC_LAYOUT_INVALID";
  error.diagnostics = diagnostics.map((item) => Object.freeze({...item}));
  return error;
};
const canonicalMetaNumber = (node) => Number(String(node.source_id).split(".").at(-1)) || Number.MAX_SAFE_INTEGER;
const conceptDepth = (node, graph, diagnostics) => {
  const bySourceId = new Map(graph.nodes.filter((item) => item.family === "architecture-type").map((item) => [item.source_id, item]));
  let depth = 0;
  let current = node;
  const seen = new Set();
  while (current.raw.extends) {
    if (seen.has(current.source_id)) {
      diagnostics.push({code: "inheritance-cycle", id: node.id, message: `Inheritance cycle while ordering ${node.id}.`});
      return Number.MAX_SAFE_INTEGER;
    }
    seen.add(current.source_id);
    current = bySourceId.get(current.raw.extends);
    if (!current) {
      diagnostics.push({code: "unknown-layout-parent", id: node.id, message: `Unknown parent while ordering ${node.id}.`});
      return Number.MAX_SAFE_INTEGER;
    }
    depth += 1;
  }
  return depth;
};
const constraintAppliesKey = (node) => {
  const targets = node.raw.applies_to ?? [...(node.raw.source_types ?? []), ...(node.raw.target_types ?? [])];
  return targets.join("|");
};
const sourcePath = (node) => node.raw.properties?.["source.path"] ?? `~${node.source_id}`;
const sortKeyForNode = (node, graph, diagnostics) => {
  if (node.band === "meaning") return [MATURITY_ORDER[node.statuses.maturity] ?? 99, CATEGORY_ORDER[node.raw.category] ?? 99, canonicalMetaNumber(node), node.id];
  if (node.band === "realization") return [conceptDepth(node, graph, diagnostics), node.raw.canonical_meta_type_ref ?? "~", node.source_id];
  if (node.band === "expectation") {
    if (node.family === "profile") return [PROFILE_ORDER[node.source_id] ?? 99, 0, node.source_id];
    if (node.family === "constraint") return [PROFILE_ORDER[node.statuses.owner_profile_id] ?? 99, 1, constraintAppliesKey(node), node.source_id];
    if (node.family === "property") return [99, 2, node.source_id];
    return [100, 9, node.id];
  }
  if (node.band === "observation") return [sourcePath(node), node.source_id];
  if (node.band === "explanation") return [node.raw.subject_id, node.raw.constraint_id, node.raw.property_id, SEVERITY_ORDER[node.raw.severity] ?? 99, node.id];
  diagnostics.push({code: "unknown-band", id: node.id, band: node.band, message: `Unknown band ${node.band} for ${node.id}.`});
  return [999, node.id];
};
const overlaps = (left, right) => left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;

export const ComputeDeterministicCanvasLayout = (graph, requestedOptions = {}) => {
  const diagnostics = [];
  if (!graph || typeof graph.graph_id !== "string" || !Array.isArray(graph.nodes)) {
    throw layoutError([{code: "invalid-graph", message: "A unified graph with graph_id and nodes is required."}]);
  }
  const options = {...DEFAULT_OPTIONS, ...requestedOptions};
  for (const [key, value] of Object.entries(options)) {
    if (!Number.isFinite(value) || value <= 0) diagnostics.push({code: "invalid-layout-option", option: key, value, message: `Layout option ${key} must be positive.`});
  }
  const nodeIds = graph.nodes.map((node) => node.id);
  if (new Set(nodeIds).size !== nodeIds.length) diagnostics.push({code: "duplicate-layout-node", message: "Graph node IDs must be unique."});
  for (const node of graph.nodes) if (!BAND_ORDER.includes(node.band)) diagnostics.push({code: "unknown-band", id: node.id, band: node.band, message: `Unknown band ${node.band} for ${node.id}.`});
  if (diagnostics.length > 0) throw layoutError(diagnostics);

  const positions = {};
  const bands = [];
  for (const [bandIndex, bandId] of BAND_ORDER.entries()) {
    const ordered = graph.nodes
      .filter((node) => node.band === bandId)
      .map((node) => ({node, sortKey: sortKeyForNode(node, graph, diagnostics)}))
      .sort((left, right) => compareKeys(left.sortKey, right.sortKey));
    const x = options.margin_x + bandIndex * (options.band_width + options.band_gap);
    const contentX = x + (options.band_width - options.node_width) / 2;
    for (const [order, entry] of ordered.entries()) {
      positions[entry.node.id] = {
        x: contentX,
        y: options.margin_y + options.band_padding + order * (options.node_height + options.node_gap),
        width: options.node_width,
        height: options.node_height,
        band: bandId,
        order,
        sort_key: entry.sortKey,
      };
    }
    const contentHeight = ordered.length === 0 ? 0 : ordered.length * options.node_height + (ordered.length - 1) * options.node_gap;
    bands.push({
      id: bandId,
      label: bandId[0].toUpperCase() + bandId.slice(1),
      order: bandIndex,
      x,
      y: options.margin_y,
      width: options.band_width,
      height: contentHeight + options.band_padding * 2,
      node_ids: ordered.map((entry) => entry.node.id),
    });
  }
  if (diagnostics.length > 0) throw layoutError(diagnostics);
  if (Object.keys(positions).length !== graph.nodes.length) diagnostics.push({code: "missing-position", message: "Not every graph node received a position."});
  const rectangles = Object.entries(positions).map(([id, position]) => ({id, ...position}));
  for (let leftIndex = 0; leftIndex < rectangles.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rectangles.length; rightIndex += 1) {
      if (overlaps(rectangles[leftIndex], rectangles[rightIndex])) diagnostics.push({code: "node-overlap", left: rectangles[leftIndex].id, right: rectangles[rightIndex].id, message: `Nodes ${rectangles[leftIndex].id} and ${rectangles[rightIndex].id} overlap.`});
    }
  }
  if (diagnostics.length > 0) throw layoutError(diagnostics);
  const right = Math.max(...bands.map((band) => band.x + band.width)) + options.margin_x;
  const bottom = Math.max(...bands.map((band) => band.y + band.height)) + options.margin_y;
  const layoutCore = {
    graph_id: graph.graph_id,
    graph_digest: graph.graph_digest,
    band_order: BAND_ORDER,
    options,
    bands,
    positions,
    bounds: {x: 0, y: 0, width: right, height: bottom},
  };
  const layoutDigest = digest(layoutCore);
  return deepFreeze({...layoutCore, layout_id: `unified-layout:${layoutDigest.slice(0, 16)}`, layout_digest: layoutDigest});
};
