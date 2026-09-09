import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SearchBox } from "./SearchBox";
it("emits a truthful text query", () => { const change = vi.fn(); render(<SearchBox value="" count={237} onChange={change} />); fireEvent.change(screen.getByRole("searchbox"), { target: { value: "runner" } }); expect(change).toHaveBeenCalledWith("runner"); });
