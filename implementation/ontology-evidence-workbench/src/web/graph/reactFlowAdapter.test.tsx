import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ReactFlowAdapter } from "./reactFlowAdapter";
it("renders an empty renderer-neutral scene without mounting dataset cards", () => { render(<div style={{ width: 800, height: 600 }}><ReactFlowAdapter scene={{ nodes: [], relations: [] }} callbacks={{ onSelectNode() {}, onSelectRelation() {} }} /></div>); expect(screen.getByLabelText("Bounded ontology graph")).toBeTruthy(); });
