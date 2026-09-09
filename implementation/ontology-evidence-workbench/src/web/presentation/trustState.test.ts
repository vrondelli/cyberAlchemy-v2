import { expect, it } from "vitest";
import type { VerifiedDataset } from "../contracts/bundle";
import { deriveTrustState } from "./trustState";
it("derives verified trust only from admitted evidence", () => { const dataset = { graph: { nodes: [1], edges: [1, 2] }, sidecar: { nodes: { n: { mapping_loss: "lossy" } } }, manifest: { runId: "RUN" } } as unknown as VerifiedDataset; expect(deriveTrustState(dataset)).toMatchObject({ level: "verified", source: "RUN" }); });
