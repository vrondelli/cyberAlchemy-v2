import { describe, expect, it } from "vitest";
import {
  applyMakeupPolicy,
  resolveEffectiveMakeupPolicy,
} from "./makeup-policy.service";

describe("makeup-policy.service", () => {
  it("applies profit first, then rakeback", () => {
    const result = applyMakeupPolicy({
      previousDebt: 1000,
      totalProfit: 700,
      totalRakeback: 600,
      dealPlayerShare: 0.5,
    });

    expect(result.appliedFromProfit).toBe(700);
    expect(result.appliedFromRakeback).toBe(300);
    expect(result.newDebt).toBe(0);
    expect(result.remainingRakeback).toBe(300);
    expect(result.playerRakebackShare).toBe(150);
  });

  it("converts negative profit into increased debt", () => {
    const result = applyMakeupPolicy({
      previousDebt: 100,
      totalProfit: -250,
      totalRakeback: 0,
      dealPlayerShare: 0.4,
    });

    expect(result.newDebt).toBe(350);
    expect(result.totalPayout).toBe(0);
  });

  it("rounds monetary values to integer units", () => {
    const result = applyMakeupPolicy({
      previousDebt: 0,
      totalProfit: 101,
      totalRakeback: 0,
      dealPlayerShare: 0.5,
    });

    expect(result.playerProfitShare).toBe(51);
    expect(result.totalPayout).toBe(51);
  });

  it("clamps invalid policy rates to supported range", () => {
    const result = applyMakeupPolicy({
      previousDebt: 0,
      totalProfit: 0,
      totalRakeback: 100,
      dealPlayerShare: 0.5,
      policy: {
        applyProfitFirst: true,
        applyRakebackSecond: true,
        playerRakebackShare: 2,
      },
    });

    expect(result.playerRakebackShare).toBe(100);
  });

  it("uses global default policy when no override is provided", () => {
    const result = applyMakeupPolicy({
      previousDebt: 0,
      totalProfit: 0,
      totalRakeback: 20,
      dealPlayerShare: 0.5,
    });

    expect(result.playerRakebackShare).toBe(10);
  });

  it("resolves effective policy with fallback defaults", () => {
    const result = resolveEffectiveMakeupPolicy({
      applyProfitFirst: false,
      playerRakebackShare: 0.25,
    });

    expect(result).toEqual({
      applyProfitFirst: false,
      applyRakebackSecond: true,
      playerRakebackShare: 0.25,
    });
  });

  // PMK-STATE-004: InDebt + MakeupApplied (applied >= debt) → Settled
  it("clears debt to zero when applied amount covers full debt", () => {
    const result = applyMakeupPolicy({
      previousDebt: 200,
      totalProfit: 250,
      totalRakeback: 0,
      dealPlayerShare: 0.5,
    });

    expect(result.newDebt).toBe(0);
    expect(result.appliedFromProfit).toBe(200);
    expect(result.remainingProfit).toBe(50);
  });

  // PMK-NEG-001: Settled (debt=0) + MakeupApplied → no-op (no amount applied)
  it("does not apply makeup when debt is already zero", () => {
    const result = applyMakeupPolicy({
      previousDebt: 0,
      totalProfit: 500,
      totalRakeback: 200,
      dealPlayerShare: 0.5,
    });

    expect(result.newDebt).toBe(0);
    expect(result.appliedFromProfit).toBe(0);
    expect(result.appliedFromRakeback).toBe(0);
  });

  // PMK-NEG-003: InDebt + partial MakeupApplied → stays InDebt
  it("stays in debt when applied amount is less than previous debt", () => {
    const result = applyMakeupPolicy({
      previousDebt: 500,
      totalProfit: 100,
      totalRakeback: 50,
      dealPlayerShare: 0.5,
    });

    expect(result.newDebt).toBe(350);
    expect(result.appliedFromProfit).toBe(100);
    expect(result.appliedFromRakeback).toBe(50);
  });
});
