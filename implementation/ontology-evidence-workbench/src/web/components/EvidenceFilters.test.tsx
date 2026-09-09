import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { EvidenceFilters } from "./EvidenceFilters";
it("shows explicit kind filter semantics", () => { const change = vi.fn(); render(<EvidenceFilters kinds={["actor", "policy"]} selected={[]} onChange={change} />); fireEvent.click(screen.getByText(/Filter/)); fireEvent.click(screen.getByRole("checkbox", { name: "actor" })); expect(change).toHaveBeenCalledWith(["actor"]); });
