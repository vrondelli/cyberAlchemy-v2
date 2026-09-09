import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { NodeCard } from "./NodeCard";
it("exposes kind, title, full definition, and selection action", () => { const onSelect = vi.fn(); render(<NodeCard node={{ id: "n", title: "Connected Runner", summary: "A runner with consent.", kind: "actor", category: "Actor", iconKey: "actor", sourcePath: "actor.json", mappingLoss: "generalized", tags: [] }} onSelect={onSelect} />); const button = screen.getByRole("button", { name: /Connected Runner/ }); expect(button.getAttribute("title")).toBe("A runner with consent."); fireEvent.click(button); expect(onSelect).toHaveBeenCalledOnce(); });
