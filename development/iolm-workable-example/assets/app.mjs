import { createDemoSnapshotV1 } from "./demo-snapshot-v1.mjs";
import { loadPinnedMintedFixture } from "./gateway.mjs";
import { projectGraph } from "./graph-view.mjs";
import { projectOutline } from "./outline-view.mjs";
import { inspectProvenance } from "./provenance-inspector.mjs";
import { selectDemoSlice } from "./question-slice.mjs";
import {
  changeLens,
  changeSlice,
  closestStableIdElement,
  createViewerState,
  selectStableId,
} from "./selection.mjs";
import { projectTable } from "./table-view.mjs";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_SELECTED_ID = "key-and-door.UnlockDoor";
const roots = {
  view: document.querySelector("#view-root"),
  inspector: document.querySelector("#inspector-root"),
  status: document.querySelector("#runtime-status"),
  question: document.querySelector("#active-question"),
  nodes: document.querySelector("#node-count"),
  relations: document.querySelector("#relation-count"),
};

let snapshot;
let slice;
let state;

function element(tag, { className, text, attrs = {} } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

function svgElement(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

function appendText(parent, tag, text, attrs = {}) {
  const node = svgElement(tag, attrs);
  node.textContent = text;
  parent.append(node);
  return node;
}

function selectedClass(id, base) {
  return id === state.selected_id ? `${base} is-selected` : base;
}

function selectFromElement(target) {
  const item = closestStableIdElement(target);
  if (!item) return;
  state = selectStableId(state, slice, item.dataset.stableId);
  commit();
}

function graphKeydown(event) {
  if (!["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  selectFromElement(event.target);
}

function renderGraph() {
  const projection = projectGraph(slice);
  const nodeMap = new Map(projection.nodes.map((node) => [node.stable_id, node]));
  const wrap = element("div", { className: "graph-wrap" });
  const svg = svgElement("svg", {
    class: "graph-svg",
    viewBox: `0 0 ${projection.view_box.width} ${projection.view_box.height}`,
    role: "group",
    "aria-label": `${slice.counts.nodes} records and ${slice.counts.relations} directed relations`,
    "data-testid": "graph-view",
  });
  const defs = svgElement("defs");
  const marker = svgElement("marker", { id: "arrow", markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: "auto", markerUnits: "strokeWidth" });
  marker.append(svgElement("path", { d: "M0,0 L8,4 L0,8 z", fill: "currentColor" }));
  defs.append(marker);
  svg.append(defs);

  for (const relation of projection.relations) {
    const source = nodeMap.get(relation.source_id);
    const target = nodeMap.get(relation.target_id);
    const group = svgElement("g", {
      class: selectedClass(relation.stable_id, "graph-edge"),
      tabindex: 0,
      role: "button",
      "aria-label": `${relation.source_label} ${relation.label} ${relation.target_label}`,
      "aria-pressed": relation.stable_id === state.selected_id,
      "data-stable-id": relation.stable_id,
    });
    group.append(svgElement("line", { class: "edge-hit", x1: source.x, y1: source.y, x2: target.x, y2: target.y }));
    group.append(svgElement("line", { class: "edge-line", x1: source.x, y1: source.y, x2: target.x, y2: target.y, "marker-end": "url(#arrow)" }));
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const labelWidth = Math.max(64, relation.label.length * 7 + 20);
    group.append(svgElement("rect", { class: "edge-label-bg", x: midX - labelWidth / 2, y: midY - 13, width: labelWidth, height: 24, rx: 12 }));
    appendText(group, "text", relation.label, { x: midX, y: midY + 4, "text-anchor": "middle" });
    svg.append(group);
  }

  for (const node of projection.nodes) {
    const group = svgElement("g", {
      class: selectedClass(node.stable_id, "graph-node"),
      tabindex: 0,
      role: "button",
      "aria-label": `${node.label}, ${node.kind}`,
      "aria-pressed": node.stable_id === state.selected_id,
      "data-stable-id": node.stable_id,
      "data-kind": node.kind,
    });
    group.append(svgElement("rect", { x: node.x - 84, y: node.y - 36, width: 168, height: 72, rx: 13 }));
    group.append(svgElement("rect", { class: "node-accent", x: node.x - 84, y: node.y - 36, width: 8, height: 72, rx: 4 }));
    appendText(group, "text", node.kind, { class: "node-kind", x: node.x - 61, y: node.y - 8 });
    appendText(group, "text", node.label, { class: "node-label", x: node.x - 61, y: node.y + 16 });
    svg.append(group);
  }
  svg.addEventListener("click", selectFromElement);
  svg.addEventListener("keydown", graphKeydown);
  wrap.append(svg);
  return wrap;
}

function outlineItem(item, type) {
  const button = element("button", {
    className: selectedClass(item.stable_id, "outline-item"),
    attrs: {
      type: "button",
      "data-stable-id": item.stable_id,
      "aria-pressed": item.stable_id === state.selected_id,
    },
  });
  button.append(element("span", { className: "outline-ordinal", text: String(item.ordinal).padStart(2, "0") }));
  const copy = element("span");
  copy.append(element("span", { className: "outline-title", text: item.label }));
  copy.append(element("span", {
    className: "outline-meta",
    text: type === "node" ? `${item.kind} · ${item.feature_id}` : `${item.source_id} → ${item.target_id}`,
  }));
  button.append(copy);
  return button;
}

function outlineGroup(title, items, type) {
  const group = element("section", { className: "outline-group" });
  group.append(element("h3", { text: title }));
  const list = element("ol", { className: "outline-list" });
  for (const item of items) {
    const entry = element("li");
    entry.append(outlineItem(item, type));
    list.append(entry);
  }
  group.append(list);
  return group;
}

function renderOutline() {
  const projection = projectOutline(slice);
  const root = element("div", { attrs: { "data-testid": "outline-view" } });
  root.append(element("p", {
    className: "outline-note",
    text: "Authored navigation projection — sequence for reading, never a semantic containment claim.",
  }));
  const grid = element("div", { className: "outline-grid" });
  grid.append(outlineGroup("Records", projection.nodes, "node"));
  grid.append(outlineGroup("Relations", projection.relations, "relation"));
  grid.addEventListener("click", selectFromElement);
  root.append(grid);
  return root;
}

function tableButton(row, label) {
  return element("button", {
    className: "table-select",
    text: label,
    attrs: { type: "button", "data-stable-id": row.stable_id },
  });
}

function makeTable(title, headers, rows, cells) {
  const group = element("section", { className: "table-group" });
  group.append(element("h3", { text: title }));
  const table = element("table", { className: "data-table" });
  const head = element("thead");
  const headRow = element("tr");
  for (const header of headers) headRow.append(element("th", { text: header, attrs: { scope: "col" } }));
  head.append(headRow);
  const body = element("tbody");
  for (const row of rows) {
    const tr = element("tr", { className: row.stable_id === state.selected_id ? "is-selected" : "" });
    for (const cell of cells(row)) {
      const td = element("td");
      td.append(cell instanceof Node ? cell : document.createTextNode(String(cell)));
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(head, body);
  group.append(table);
  return group;
}

function renderTable() {
  const projection = projectTable(slice);
  const root = element("div", { className: "table-stack", attrs: { "data-testid": "table-view" } });
  root.append(makeTable("Records", ["Stable ID", "Kind", "Feature", "State"], projection.records, (row) => [
    tableButton(row, row.stable_id), row.kind, row.feature_id, row.validation_state,
  ]));
  root.append(makeTable("Relations", ["Stable ID", "Class", "Source", "Target"], projection.relations, (row) => [
    tableButton(row, row.stable_id), row.relation_class, row.source_id, row.target_id,
  ]));
  root.addEventListener("click", selectFromElement);
  return root;
}

function inspectorRow(list, name, value, className) {
  list.append(element("dt", { text: name }));
  list.append(element("dd", { className, text: value }));
}

function renderInspector() {
  const result = inspectProvenance(slice, state.selected_id);
  roots.inspector.replaceChildren();
  roots.inspector.append(element("p", { className: "inspector-kicker", text: result.record_type }));
  roots.inspector.append(element("h3", { className: "inspector-title", text: result.label }));
  roots.inspector.append(element("p", { className: "stable-id", text: result.stable_id }));
  const list = element("dl", { className: "provenance-list" });
  if (result.kind) inspectorRow(list, "Kind", result.kind);
  if (result.feature_id) inspectorRow(list, "Feature", result.feature_id);
  if (result.relation_class) inspectorRow(list, "Relation", result.relation_class);
  if (result.source) inspectorRow(list, "From", `${result.source.feature_id} / ${result.source.node_id}`);
  if (result.target) inspectorRow(list, "To", `${result.target.feature_id} / ${result.target.node_id}`);
  inspectorRow(list, "Artifact role", result.artifact_role);
  inspectorRow(list, "Posture", result.posture);
  inspectorRow(list, "Authority effect", result.authority_effect);
  inspectorRow(list, "Validation", result.validation_state, "proof-chip");
  inspectorRow(list, "Owner route", result.owner_route);
  inspectorRow(list, "Source", result.source_reference);
  inspectorRow(list, "Source digest", result.source_digest);
  inspectorRow(list, "Binding", result.contract_binding.binding_id);
  inspectorRow(list, "Binding schema", result.contract_binding.schema_version);
  inspectorRow(list, "Source set", result.contract_binding.source_set_digest);
  roots.inspector.append(list);
}

function syncControls() {
  for (const button of document.querySelectorAll("[data-lens]")) {
    const active = button.dataset.lens === state.lens;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  }
  for (const button of document.querySelectorAll("[data-slice-id]")) {
    button.setAttribute("aria-pressed", String(button.dataset.sliceId === slice.slice_id));
  }
  roots.nodes.textContent = slice.counts.nodes;
  roots.relations.textContent = slice.counts.relations;
  roots.question.textContent = slice.question ?? "The complete Key & Door model";
}

function syncUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lens", state.lens);
  url.searchParams.set("selected", state.selected_id);
  if (slice.slice_id === "default") url.searchParams.delete("slice");
  else url.searchParams.set("slice", slice.slice_id);
  history.replaceState(null, "", url);
}

function commit() {
  const renderers = { graph: renderGraph, outline: renderOutline, table: renderTable };
  roots.view.replaceChildren(renderers[state.lens]());
  renderInspector();
  syncControls();
  syncUrl();
  roots.status.textContent = `${state.lens} lens · ${slice.slice_id} · selected ${state.selected_id}`;
}

function errorValue(value) {
  if (value === undefined) return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 240 ? `${text.slice(0, 237)}…` : text;
}

function renderBlocked(error) {
  const detail = typeof error?.toJSON === "function" ? error.toJSON() : {
    code: "VIEWER_STARTUP_BLOCKED",
    field: "runtime",
    message: error?.message ?? "Unknown startup error.",
    owner_route: "private-learning-map-product-owner",
    recovery: "Restore the pinned fixture boundary and reload. No stale data was used.",
  };
  const fragment = document.querySelector("#blocked-template").content.cloneNode(true);
  fragment.querySelector("[data-error-code]").textContent = detail.code;
  fragment.querySelector("[data-error-message]").textContent = detail.message;
  const list = fragment.querySelector("[data-error-details]");
  for (const [label, value] of [
    ["Failed field", detail.field],
    ["Expected", detail.expected],
    ["Actual", detail.actual],
    ["Owner route", detail.owner_route],
    ["Recovery", detail.recovery],
  ]) {
    list.append(element("dt", { text: label }), element("dd", { text: errorValue(value) }));
  }
  roots.view.replaceChildren(fragment);
  roots.inspector.replaceChildren(element("p", { className: "muted", text: "Selection unavailable while the model is blocked." }));
  roots.status.textContent = `${detail.code}: blocked without fallback`;
}

function bindControls() {
  document.querySelector(".lens-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lens]");
    if (!button) return;
    state = changeLens(state, slice, button.dataset.lens);
    commit();
  });
  document.querySelector(".question-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-slice-id]");
    if (!button) return;
    const nextSlice = selectDemoSlice(snapshot, button.dataset.sliceId);
    state = changeSlice(state, nextSlice);
    slice = nextSlice;
    commit();
  });
}

async function start() {
  try {
    const params = new URLSearchParams(window.location.search);
    const boundary = await loadPinnedMintedFixture();
    snapshot = createDemoSnapshotV1(boundary);
    slice = selectDemoSlice(snapshot, params.get("slice") ?? "default");
    state = createViewerState(slice, {
      lens: params.get("lens") ?? "graph",
      selectedId: params.get("selected") ?? (slice.node_ids.includes(DEFAULT_SELECTED_ID) ? DEFAULT_SELECTED_ID : slice.node_ids[0]),
    });
    bindControls();
    commit();
  } catch (error) {
    renderBlocked(error);
  }
}

start();
