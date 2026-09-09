import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { VerifiedDataset } from "../contracts/bundle";
import { EvidenceWorkspace } from "./EvidenceWorkspace";
const dataset = { graph: { nodes: [{ id: "n", name: "Runner", type: "claim", tags: ["business-kind:actor"] }] }, sidecar: { nodes: { n: { mapping_loss: "generalized", source_kind_original: "actor", source_path: "actor.json" } } } } as unknown as VerifiedDataset;
it("projects one selection into the non-canvas workspace", () => { render(<EvidenceWorkspace dataset={dataset} ids={["n"]} selection={{ kind: "node", id: "n" }} mode="outline" onMode={() => {}} onSelect={() => {}} />); expect(screen.getByText("Runner")).toBeTruthy(); expect(screen.getByText(/1 projected item/)).toBeTruthy(); });
