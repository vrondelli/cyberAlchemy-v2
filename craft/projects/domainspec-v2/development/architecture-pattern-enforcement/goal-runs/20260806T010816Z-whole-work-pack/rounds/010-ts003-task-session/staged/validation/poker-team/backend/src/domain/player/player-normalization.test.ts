import { describe, expect, it } from "vitest";
import {
  ALLOWED_LIMITS,
  canonicalEmailKey,
  isAllowedLimit,
  isNonEmptyString,
  normalizeEmail,
} from "./email-normalization";

describe("player email normalization", () => {
  it("normalizes email by trimming and lowercasing", () => {
    expect(normalizeEmail("  JOHN.DOE@Example.COM ")).toBe(
      "john.doe@example.com",
    );
  });

  it("builds canonical key by removing special chars", () => {
    expect(canonicalEmailKey("john.doe+alias@example.com")).toBe(
      "johndoealiasexamplecom",
    );
  });

  it("detects non-empty strings", () => {
    expect(isNonEmptyString("x")).toBe(true);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it("validates allowed limits", () => {
    expect(ALLOWED_LIMITS).toEqual(["NL20", "NL40", "NL60", "NL80", "NL100"]);
    expect(isAllowedLimit("NL20")).toBe(true);
    expect(isAllowedLimit("NL10")).toBe(false);
  });
});
