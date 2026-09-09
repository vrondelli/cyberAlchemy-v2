import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AppShell } from "./AppShell";
it("keeps every critical application region mounted", () => { render(<AppShell header={<header>Header</header>} trust={<aside>Trust</aside>} toolbar={<nav>Tools</nav>} main={<main>Graph</main>} portals={<section>Portals</section>} inspector={<aside>Inspector</aside>} workspace={<section>Workspace</section>} />); for (const label of ["Header", "Trust", "Tools", "Graph", "Portals", "Inspector", "Workspace"]) expect(screen.getByText(label)).toBeTruthy(); });
