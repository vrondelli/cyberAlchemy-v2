import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { EvidenceInspector } from "./EvidenceInspector";
it("separates definition, source, mapping loss, and authority", () => { render(<EvidenceInspector model={{ kind: "node", node: { id: "n", title: "Runner", summary: "Definition", kind: "actor", category: "Actor", iconKey: "actor", sourcePath: "nodes/actor.json", mappingLoss: "lossy", tags: [] }, authorityEffect: "none", sourceDigest: "abc" }} />); for (const label of ["Definition", "nodes/actor.json", "lossy", "none"]) expect(screen.getByText(label)).toBeTruthy(); });
