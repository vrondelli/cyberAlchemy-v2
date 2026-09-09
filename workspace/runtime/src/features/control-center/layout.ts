export type WorkspaceSurface = `frontend:${string}` | "dashboard" | "explore" | "foundation" | "ontology" | "essays" | "chat";

export type LayoutPreset = "balanced" | "writing" | "canvas";
export interface LayoutState { preset: LayoutPreset; pinned: boolean; history: LayoutPreset[] }
export const initialLayout: LayoutState = { preset: "balanced", pinned: false, history: [] };
export function changeLayout(state: LayoutState, action: { type: "apply"; preset: LayoutPreset } | { type: "pin" } | { type: "undo" }): LayoutState {
  if (action.type === "pin") return { ...state, pinned: !state.pinned };
  if (state.pinned) return state;
  if (action.type === "undo") {
    const previous = state.history.at(-1);
    return previous ? { ...state, preset: previous, history: state.history.slice(0, -1) } : state;
  }
  return action.preset === state.preset ? state : { ...state, preset: action.preset, history: [...state.history, state.preset] };
}

/** Layout is presentation only; it never changes conversation intent or authority. */
export function isSurfaceVisible(candidate: WorkspaceSurface, selected: WorkspaceSurface, docked: boolean): boolean {
  return candidate === selected || (docked && candidate === "chat");
}
