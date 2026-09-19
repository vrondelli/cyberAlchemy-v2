import { describe, expect, it } from "vitest";
import {
  calculateMakeupAdjustment,
  isValidMakeupOperation,
  normalizeNonNegativeAmount,
} from "./makeup-adjustment.service";

describe("makeup-adjustment.service", () => {
  it("validates operation set", () => {
    expect(isValidMakeupOperation("increase")).toBe(true);
    expect(isValidMakeupOperation("decrease")).toBe(true);
    expect(isValidMakeupOperation("set")).toBe(true);
    expect(isValidMakeupOperation("invalid")).toBe(false);
  });

  it("normalizes non-negative amounts with half-up rounding", () => {
    expect(normalizeNonNegativeAmount(0.49)).toBe(0);
    expect(normalizeNonNegativeAmount(0.5)).toBe(1);
    expect(normalizeNonNegativeAmount(1.5)).toBe(2);
  });

  it("throws for invalid amount", () => {
    expect(() => normalizeNonNegativeAmount(-1)).toThrow("Invalid amount");
  });

  it("calculates increase/decrease/set with debt floor", () => {
    expect(
      calculateMakeupAdjustment({
        previousMakeup: 10,
        operation: "increase",
        amount: 2,
      }),
    ).toMatchObject({ currentMakeup: 12, signedDelta: 2 });

    expect(
      calculateMakeupAdjustment({
        previousMakeup: 10,
        operation: "decrease",
        amount: 99,
      }),
    ).toMatchObject({ currentMakeup: 0, signedDelta: -10 });

    expect(
      calculateMakeupAdjustment({
        previousMakeup: 10,
        operation: "set",
        amount: 3,
      }),
    ).toMatchObject({ currentMakeup: 3, signedDelta: -7 });
  });

  // PMK-STATE-001: Settled (debt=0) + increase → InDebt (debt>0)
  it("transitions from Settled to InDebt on increase from zero", () => {
    const result = calculateMakeupAdjustment({
      previousMakeup: 0,
      operation: "increase",
      amount: 50,
    });

    expect(result.previousMakeup).toBe(0);
    expect(result.currentMakeup).toBe(50);
    expect(result.signedDelta).toBe(50);
  });

  // PMK-STATE-003: InDebt + exact decrease → Settled (debt=0)
  it("transitions from InDebt to Settled on exact decrease to zero", () => {
    const result = calculateMakeupAdjustment({
      previousMakeup: 75,
      operation: "decrease",
      amount: 75,
    });

    expect(result.previousMakeup).toBe(75);
    expect(result.currentMakeup).toBe(0);
    expect(result.signedDelta).toBe(-75);
  });

  // PMK-NEG-002: Settled + zero-delta increase stays Settled
  it("does not transition from Settled when delta is zero", () => {
    const result = calculateMakeupAdjustment({
      previousMakeup: 0,
      operation: "increase",
      amount: 0,
    });

    expect(result.previousMakeup).toBe(0);
    expect(result.currentMakeup).toBe(0);
    expect(result.signedDelta).toBe(0);
  });
});
