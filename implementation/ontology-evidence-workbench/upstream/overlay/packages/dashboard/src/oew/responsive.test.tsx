// @ts-nocheck
import {describe, expect, it} from "vitest";
import css from "./oew.css?raw";

describe("responsive shell contract", () => {
  it("declares tablet, mobile, focus, and reduced-motion behavior", () => {
    expect(css).toContain("@media (max-width: 1050px)");
    expect(css).toContain("@media (max-width: 700px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":focus-visible");
  });
});
