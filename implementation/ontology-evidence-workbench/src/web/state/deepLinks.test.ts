import { expect, it } from "vitest";
import type { VerifiedDataset } from "../contracts/bundle";
import type { WorkbenchState } from "./workbenchState";
import { parseDeepLink, serializeDeepLink } from "./deepLinks";
const dataset = { sidecar: { nodes: { n: {} } } } as unknown as VerifiedDataset;
it("roundtrips a canonical validated focus", () => { const state = { focusId: "n", mode: "focus", selection: { kind: "node", id: "n" }, query: "runner", filters: {} } as WorkbenchState; expect(parseDeepLink(serializeDeepLink(state), dataset)).toMatchObject({ focusId: "n", mode: "focus", query: "runner" }); });
it("repairs an unknown deep-link ID", () => expect(parseDeepLink("?v=1&focus=ghost&mode=focus", dataset).recovery).toMatch(/unavailable/));
