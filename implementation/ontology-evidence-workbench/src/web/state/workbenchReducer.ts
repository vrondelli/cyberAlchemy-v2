import type { VerifiedDataset } from "../contracts/bundle";
import type { SceneDescriptor, Selection, WorkbenchAction, WorkbenchState } from "./workbenchState";

const HISTORY_LIMIT = 40;

function selectionExists(dataset: VerifiedDataset, selection: Selection): boolean {
  if (!selection) return true;
  if (selection.kind === "node") return Boolean(dataset.sidecar.nodes[selection.id]);
  return Boolean(dataset.sidecar.edges[selection.id]);
}

function pushScene(state: WorkbenchState, scene: SceneDescriptor): WorkbenchState {
  const previous = state.history[state.historyIndex];
  if (previous && previous.focusId === scene.focusId && previous.mode === scene.mode && previous.selection?.id === scene.selection?.id) return state;
  const history = [...state.history.slice(0, state.historyIndex + 1), scene].slice(-HISTORY_LIMIT);
  return { ...state, ...scene, history, historyIndex: history.length - 1, recovery: null };
}

export function reduceWorkbench(state: WorkbenchState, action: WorkbenchAction, dataset: VerifiedDataset): WorkbenchState {
  if (state.datasetId !== dataset.manifest.datasetId) return { ...state, recovery: "The dataset handle changed; reload the workbench." };
  switch (action.type) {
    case "select": return selectionExists(dataset, action.selection) ? { ...state, selection: action.selection, recovery: null } : { ...state, recovery: "That evidence item is not present in this dataset." };
    case "set-mode": return pushScene(state, { focusId: state.focusId, mode: action.mode, selection: state.selection });
    case "pivot": return dataset.sidecar.nodes[action.focusId] ? pushScene(state, { focusId: action.focusId, mode: "focus", selection: { kind: "node", id: action.focusId } }) : { ...state, recovery: "That portal target is no longer available." };
    case "set-query": return { ...state, query: action.query, recovery: null };
    case "set-filter": return { ...state, filters: { ...state.filters, [action.group]: [...new Set(action.values)].sort() }, recovery: null };
    case "history-back": {
      const index = Math.max(0, state.historyIndex - 1);
      return index === state.historyIndex ? state : { ...state, ...state.history[index], historyIndex: index, recovery: null };
    }
    case "history-forward": {
      const index = Math.min(state.history.length - 1, state.historyIndex + 1);
      return index === state.historyIndex ? state : { ...state, ...state.history[index], historyIndex: index, recovery: null };
    }
    case "recover": return { ...state, recovery: action.message };
    default: return action satisfies never;
  }
}
