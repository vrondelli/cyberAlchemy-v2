import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { RelationRecord } from "../contracts/relation";
import { RelationLegend } from "./RelationLegend";
it("pairs predicate colors with persistent text", () => { const relations = ["owns", "depends_on", "validates"].map((sourcePredicate, index) => ({ id: `r${index}`, sourcePredicate, color: `#00${index}`, label: sourcePredicate, sentence: sourcePredicate, dash: "solid", sourceId: "a", targetId: "b", evidenceRefs: [], mappingLoss: "exact" })) as unknown as RelationRecord[]; render(<RelationLegend relations={relations} />); expect(screen.getByText("owns")).toBeTruthy(); expect(screen.getByText("depends on")).toBeTruthy(); expect(screen.getByText("validates")).toBeTruthy(); });
