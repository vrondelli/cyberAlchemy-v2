import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TrustRail } from "./TrustRail";
it("announces evidence-derived status without freshness claims", () => { render(<TrustRail state={{ level: "verified", title: "Verified read-only projection", message: "231 relations admitted.", source: "RUN" }} />); expect(screen.getByText(/Verified read-only/)).toBeTruthy(); expect(document.body.textContent).not.toMatch(/fresh/i); });
