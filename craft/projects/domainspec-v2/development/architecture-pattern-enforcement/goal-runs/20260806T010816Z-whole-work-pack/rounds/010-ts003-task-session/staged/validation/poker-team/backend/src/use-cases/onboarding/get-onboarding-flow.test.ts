import { describe, expect, it } from "vitest";
import { getOnboardingFlowUseCase } from "./get-onboarding-flow";

describe("get-onboarding-flow use-case", () => {
  it("returns default flow payload", async () => {
    const flow = await getOnboardingFlowUseCase();

    expect(flow.regulationVersion).toBeTypeOf("string");
    expect(flow.acceptanceRequired).toBe(true);
    expect(flow.lgpdConsentRequired).toBe(true);
    expect(flow.groups.length).toBeGreaterThan(0);
  });

  it("uses requested regulationVersion when provided", async () => {
    const flow = await getOnboardingFlowUseCase({
      regulationVersion: "2026-06",
    });

    expect(flow.regulationVersion).toBe("2026-06");
  });

  it("supports compact mode by splitting rule screens", async () => {
    const flow = await getOnboardingFlowUseCase({ compactMode: true });

    expect(flow.groups.length).toBeGreaterThan(3);
    expect(flow.groups[0].sections).toHaveLength(1);
  });
});
