import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { PortalDescriptor } from "../contracts/scene";
import { GroupedPortals } from "./GroupedPortals";
it("discloses destination semantics before pivot", () => { const open = vi.fn(); const portal = { id: "p", label: "Actor · authority", targetKind: "actor", iconKey: "actor", direction: "outgoing", family: "authority", targetIds: ["n"], relationIds: ["r"], predicates: ["owns"], count: 1, sentence: "This area leads to Runner via owns.", pivotFocusId: "n" } as PortalDescriptor; render(<GroupedPortals portals={[portal]} onOpen={open} />); expect(screen.getByText(portal.sentence)).toBeTruthy(); fireEvent.click(screen.getByRole("button", { name: /Actor/ })); expect(open).toHaveBeenCalledWith(portal); });
