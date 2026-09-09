import { describe, expect, it } from "vitest";
import type { RelationRecord } from "../contracts/relation";
import { compileRelationSurfacePack, relationSurfacesAgree } from "./viewParity";
it("keeps relation identity equal across surfaces", () => {
  const relation = { id: "r", sourcePredicate: "owns", label: "owns", sentence: "A owns B", color: "#fff", dash: "solid", sourceId: "a", targetId: "b", evidenceRefs: [], mappingLoss: "exact" } as unknown as RelationRecord;
  expect(relationSurfacesAgree(compileRelationSurfacePack(relation))).toBe(true);
});
