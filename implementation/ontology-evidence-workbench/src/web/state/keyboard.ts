import type { WorkbenchAction, WorkbenchState } from "./workbenchState";
export interface KeyboardCommand { readonly id: string; readonly label: string; readonly shortcut: string; readonly action: WorkbenchAction; readonly enabled: (state: WorkbenchState) => boolean }
export const keyboardCommands: readonly KeyboardCommand[] = [
  { id: "search", label: "Focus search", shortcut: "/", action: { type: "recover", message: null }, enabled: () => true },
  { id: "overview", label: "Open overview", shortcut: "1", action: { type: "set-mode", mode: "overview" }, enabled: () => true },
  { id: "path", label: "Open path mode", shortcut: "2", action: { type: "set-mode", mode: "path" }, enabled: () => true },
  { id: "back", label: "Previous scene", shortcut: "Alt+ArrowLeft", action: { type: "history-back" }, enabled: (state) => state.historyIndex > 0 },
  { id: "forward", label: "Next scene", shortcut: "Alt+ArrowRight", action: { type: "history-forward" }, enabled: (state) => state.historyIndex < state.history.length - 1 },
];
export function commandForEvent(event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey">, state: WorkbenchState): KeyboardCommand | undefined {
  if (event.ctrlKey || event.metaKey) return undefined;
  const shortcut = event.altKey ? `Alt+${event.key}` : event.key;
  return keyboardCommands.find((command) => command.shortcut.toLowerCase() === shortcut.toLowerCase() && command.enabled(state));
}
