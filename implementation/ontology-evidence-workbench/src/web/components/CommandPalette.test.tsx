import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { WorkbenchState } from "../state/workbenchState";
import { CommandPalette } from "./CommandPalette";
it("exposes visible command names and shortcuts", () => { const action = vi.fn(); const state = { historyIndex: 0, history: [{}] } as unknown as WorkbenchState; render(<CommandPalette open state={state} onClose={() => {}} onAction={action} />); fireEvent.click(screen.getByRole("button", { name: /Open path mode/ })); expect(action).toHaveBeenCalledWith({ type: "set-mode", mode: "path" }); });
