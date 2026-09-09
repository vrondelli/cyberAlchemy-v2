import { expect, it } from "vitest";
import type { PresentationNode } from "../contracts/bundle";
import { rankSearch } from "./searchQuery";
const nodes = [{ id: "runner", name: "Connected Runner", summary: "Authorized Strava athlete", tags: ["business-kind:actor"], type: "claim" }, { id: "policy", name: "Score Policy", summary: "Score rules", tags: ["business-kind:policy"], type: "claim" }] as PresentationNode[];
it("ranks exact and prefix title matches deterministically", () => expect(rankSearch(nodes, "connected runner")[0]).toBe("runner"));
