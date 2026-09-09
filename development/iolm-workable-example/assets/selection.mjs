import { DemoSnapshotError, deepFreeze } from "./demo-snapshot-v1.mjs";

export const VIEWER_LENSES = Object.freeze(["graph", "outline", "table"]);

function fail(code, field, message, expected, actual) {
  throw new DemoSnapshotError(code, field, message, { expected, actual });
}

export function selectableIds(slice) {
  return deepFreeze([
    ...slice.nodes.map(({ id }) => id),
    ...slice.relations.map(({ id }) => id),
  ]);
}

export function closestStableIdElement(target) {
  const candidate = typeof target?.closest === "function"
    ? target
    : target?.parentElement;
  if (typeof candidate?.closest !== "function") return null;
  return candidate.closest("[data-stable-id]");
}

function requireLens(lens) {
  if (!VIEWER_LENSES.includes(lens)) {
    fail("VIEWER_LENS_UNRESOLVED", "lens", "Requested lens is not available.", VIEWER_LENSES, lens);
  }
  return lens;
}

function requireSelection(slice, selectedId) {
  const available = selectableIds(slice);
  if (!available.includes(selectedId)) {
    fail(
      "SELECTION_ID_UNRESOLVED",
      "selected_id",
      "Requested stable ID is not present in the active slice.",
      available,
      selectedId,
    );
  }
  return selectedId;
}

export function createViewerState(slice, {
  lens = "graph",
  selectedId = slice.nodes[0]?.id,
} = {}) {
  if (!slice?.slice_id || !slice.nodes?.length) {
    fail("VIEWER_SLICE_INVALID", "slice", "A guarded non-empty projection slice is required.");
  }
  return deepFreeze({
    schema_version: "iolm-viewer-state/v1",
    lens: requireLens(lens),
    slice_id: slice.slice_id,
    selected_id: requireSelection(slice, selectedId),
  });
}

export function selectStableId(state, slice, selectedId) {
  return createViewerState(slice, {
    lens: state.lens,
    selectedId: requireSelection(slice, selectedId),
  });
}

export function changeLens(state, slice, lens) {
  return createViewerState(slice, {
    lens: requireLens(lens),
    selectedId: requireSelection(slice, state.selected_id),
  });
}

export function changeSlice(state, nextSlice, { fallbackId = nextSlice.nodes[0]?.id } = {}) {
  const available = selectableIds(nextSlice);
  const selectedId = available.includes(state.selected_id) ? state.selected_id : fallbackId;
  return createViewerState(nextSlice, { lens: state.lens, selectedId });
}
