import { expect, it } from "vitest";
import type { WorkbenchState } from "./workbenchState";
import { commandForEvent } from "./keyboard";
it("scopes navigation commands to enabled history", () => { const state = { historyIndex: 0, history: [{}] } as unknown as WorkbenchState; expect(commandForEvent({ key: "ArrowLeft", altKey: true, ctrlKey: false, metaKey: false }, state)).toBeUndefined(); expect(commandForEvent({ key: "2", altKey: false, ctrlKey: false, metaKey: false }, state)?.id).toBe("path"); });
