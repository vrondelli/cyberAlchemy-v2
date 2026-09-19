import { describe, expect, it } from "vitest";
import { evaluateProgressionPolicy } from "./progression-policy.service";

describe("progression-policy.service", () => {
  it("returns no-stats result when period has no records", () => {
    const result = evaluateProgressionPolicy({
      currentLimit: "NL20",
      periodDays: 15,
      now: new Date("2026-04-09T00:00:00.000Z"),
      stats: [],
    });

    expect(result).toEqual({
      eligibleForPromotion: false,
      reason: "No stats in period",
      avgHands: 0,
      winrate: 0,
      period: "BI_WEEKLY",
    });
  });

  it("evaluates bi-weekly and monthly thresholds deterministically", () => {
    const biWeekly = evaluateProgressionPolicy({
      currentLimit: "NL20",
      periodDays: 15,
      now: new Date(),
      stats: [
        {
          date: new Date().toISOString().slice(0, 10),
          hands: 15000,
          profit: 24000,
        },
      ],
    });
    expect(biWeekly.eligibleForPromotion).toBe(true);
    expect(biWeekly.reason).toBe("Met Bi-Weekly criteria");

    const monthly = evaluateProgressionPolicy({
      currentLimit: "NL20",
      periodDays: 30,
      now: new Date(),
      stats: [
        {
          date: new Date().toISOString().slice(0, 10),
          hands: 15000,
          profit: 12000,
        },
      ],
    });
    expect(monthly.eligibleForPromotion).toBe(false);
    expect(monthly.reason).toBe(
      "Missed criteria. Hands: 500/1000, Winrate: 4.00/5",
    );
  });
});
