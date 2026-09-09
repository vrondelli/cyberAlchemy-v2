import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PathResult } from "../contracts/scene";
import { PathMode } from "./PathMode";
it("keeps path relation names visible", () => { const result = { status: "found", nodeIds: ["a", "b"], relations: [{ label: "depends on" }], alternatives: [] } as unknown as PathResult; render(<PathMode result={result} names={new Map([["a", "A"], ["b", "B"]])} startId="a" endId="b" options={[{ id: "a", name: "A" }, { id: "b", name: "B" }]} onStart={() => {}} onEnd={() => {}} />); expect(screen.getByText(/depends on/)).toBeTruthy(); });
