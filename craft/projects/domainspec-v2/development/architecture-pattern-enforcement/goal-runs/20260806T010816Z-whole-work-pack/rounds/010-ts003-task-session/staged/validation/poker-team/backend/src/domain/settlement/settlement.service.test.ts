import { describe, expect, it } from "vitest";
import {
  computeSettlement,
  decideSettlementSideEffects,
  filterRecordsByPeriod,
} from "./settlement.service";

describe("settlement.service", () => {
  it("filters records by period and computes settlement totals", () => {
    const filtered = filterRecordsByPeriod(
      [
        { date: "2026-04-01", profit: 100, rakeback: 0 },
        { date: "2026-05-01", profit: 999, rakeback: 0 },
      ],
      "2026-04-01",
      "2026-04-30",
    );

    expect(filtered).toHaveLength(1);

    const settlement = computeSettlement({
      records: [{ date: "2024-01-01", profit: 1000, rakeback: 0 }],
      currentLimit: "NL10",
      previousMakeup: 0,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    });

    expect(settlement.totalProfit).toBe(1000);
    expect(settlement.playerProfitShare).toBe(400);
    expect(settlement.totalPayout).toBe(400);
  });

  it("decides side effects deterministically with idempotency checks", () => {
    const result = decideSettlementSideEffects({
      existingTransactions: [
        { type: "MAKEUP_APPLIED", date: "2026-04-30" },
        { type: "PAYOUT", date: "2026-04-30" },
      ],
      periodEnd: "2026-04-30",
      totalAppliedMakeup: 10,
      totalPayout: 20,
    });

    expect(result).toEqual({
      shouldCreateMakeupAppliedEvent: false,
      shouldCreatePayoutEvent: false,
    });
  });

  // --- RV-5: stats exactly on startDate are included ---
  it("RV-5: includes stats exactly on startDate", () => {
    const filtered = filterRecordsByPeriod(
      [
        { date: "2024-01-01", profit: 100, rakeback: 10 },
        { date: "2024-01-15", profit: 200, rakeback: 20 },
      ],
      "2024-01-01",
      "2024-01-31",
    );
    expect(filtered).toHaveLength(2);
    expect(filtered[0].date).toBe("2024-01-01");
  });

  // --- RV-6: stats exactly on endDate are included ---
  it("RV-6: includes stats exactly on endDate", () => {
    const filtered = filterRecordsByPeriod(
      [
        { date: "2024-01-31", profit: 500, rakeback: 50 },
        { date: "2024-02-01", profit: 999, rakeback: 0 },
      ],
      "2024-01-01",
      "2024-01-31",
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe("2024-01-31");
  });

  // --- RV-7: stats outside range are excluded ---
  it("RV-7: excludes stats outside the date range", () => {
    const filtered = filterRecordsByPeriod(
      [
        { date: "2023-12-31", profit: 100, rakeback: 0 },
        { date: "2024-01-15", profit: 200, rakeback: 0 },
        { date: "2024-02-01", profit: 300, rakeback: 0 },
      ],
      "2024-01-01",
      "2024-01-31",
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].profit).toBe(200);
  });

  // --- PC-3: does not update makeup when unchanged ---
  it("PC-3: newMakeup equals previousMakeup when no debt change", () => {
    const settlement = computeSettlement({
      records: [],
      currentLimit: "NL10",
      previousMakeup: 500,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    });
    // No records = no profit/rakeback, no debt applied
    expect(settlement.newMakeup).toBe(500);
    expect(settlement.appliedFromProfit).toBe(0);
    expect(settlement.appliedFromRakeback).toBe(0);
  });

  // --- PC-6: shouldCreatePayoutEvent is false when payout = 0 ---
  it("PC-6: no PAYOUT event when totalPayout is 0", () => {
    const result = decideSettlementSideEffects({
      existingTransactions: [],
      periodEnd: "2024-01-31",
      totalAppliedMakeup: 100,
      totalPayout: 0,
    });
    expect(result.shouldCreatePayoutEvent).toBe(false);
  });

  // --- PC-7: shouldCreateMakeupAppliedEvent is false when applied = 0 ---
  it("PC-7: no MAKEUP_APPLIED event when totalAppliedMakeup is 0", () => {
    const result = decideSettlementSideEffects({
      existingTransactions: [],
      periodEnd: "2024-01-31",
      totalAppliedMakeup: 0,
      totalPayout: 500,
    });
    expect(result.shouldCreateMakeupAppliedEvent).toBe(false);
    expect(result.shouldCreatePayoutEvent).toBe(true);
  });

  // --- WI-1: makeup debt non-negative after settlement ---
  it("WI-1: newMakeup is never negative", () => {
    const settlement = computeSettlement({
      records: [{ date: "2024-01-01", profit: 10000, rakeback: 5000 }],
      currentLimit: "NL10",
      previousMakeup: 100,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    });
    expect(settlement.newMakeup).toBeGreaterThanOrEqual(0);
  });
});
