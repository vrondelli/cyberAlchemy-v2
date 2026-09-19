import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  evaluateProgressionPolicy,
  filterStatsForPeriod,
  ProgressionPeriod,
} from "../../domain/progression/progression-policy.service";
import { ProgressionEventHandler } from "../../domain/progression/progression.events";
import { computeWinrateBbPer100 } from "../../domain/shared/winrate";
import { getLimitBuyIn } from "../../domain/limit/limit.service";
import {
  calculationDrift,
  createCounter,
  createHistogram,
  operationDuration,
  operationInvocation,
  ruleViolation,
} from "../../infrastructure/telemetry/instruments";

export type ProgressionStatus = {
  eligibleForPromotion: boolean;
  reason: string;
  avgHands: number;
  winrate: number;
  period: "BI_WEEKLY" | "MONTHLY";
};

const FEATURE = "player-progression";
const OPERATION = "CheckProgression";

const businessEligibilityRate = createHistogram("business.eligibility_rate", {
  unit: "1",
  description: "Rolling progression eligibility ratio samples (O13)",
});

const businessChecksPerDay = createCounter("business.checks_per_day", {
  unit: "{check}",
  description: "Progression checks executed (O13)",
});

const businessAvgHandsAtCheck = createHistogram("business.avg_hands_at_check", {
  unit: "{hand}",
  description: "Average hands observed at progression checks (O13)",
});

const businessAvgWinrateAtCheck = createHistogram(
  "business.avg_winrate_at_check",
  {
    unit: "{bb_per_100}",
    description: "Average winrate observed at progression checks (O13)",
  },
);

let totalProgressionChecks = 0;
let eligibleProgressionChecks = 0;

export const checkProgressionUseCase =
  (
    playerStatsRepo: PlayerStatsRepository,
    playerRepo: PlayerRepository,
    onEvent?: ProgressionEventHandler,
  ) =>
  async (
    playerId: string,
    periodDays: ProgressionPeriod = 15,
  ): Promise<ProgressionStatus> => {
    const startedAt = performance.now();
    let operationResult: "eligible" | "not_eligible" | "error" = "error";

    try {
      const player = await playerRepo.findById(playerId);
      if (!player) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw new Error("Player not found");
      }

      if (periodDays !== 15 && periodDays !== 30) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw new Error("Invalid progression period");
      }

      const { entries } = await playerStatsRepo.findByPlayerId(playerId);
      const stats = entries.map((s) => ({
        date: s.statDate,
        hands: s.hands,
        profit: s.profit,
      }));

      const now = new Date();
      const result = evaluateProgressionPolicy({
        currentLimit: player.currentLimit,
        periodDays,
        now,
        stats,
      });

      const relevantStats = filterStatsForPeriod(stats, periodDays, now);
      const totalHands = relevantStats.reduce((sum, item) => sum + item.hands, 0);
      const totalProfit = relevantStats.reduce(
        (sum, item) => sum + item.profit,
        0,
      );
      const expectedAvgHands = relevantStats.length > 0 ? totalHands / periodDays : 0;
      const bbValueCents = getLimitBuyIn(player.currentLimit) / 100;
      const expectedWinrate =
        relevantStats.length > 0
          ? computeWinrateBbPer100(totalProfit, totalHands, bbValueCents)
          : 0;
      const expectedEligibility =
        relevantStats.length > 0
          ? periodDays === 15
            ? expectedAvgHands >= 1000 && expectedWinrate >= 7.5
            : expectedAvgHands >= 1000 && expectedWinrate >= 5
          : false;

      calculationDrift.record(expectedEligibility === result.eligibleForPromotion ? 0 : 1, {
        feature: FEATURE,
        operation: OPERATION,
        calculation_id: "C1",
      });
      calculationDrift.record(Math.abs(expectedAvgHands - result.avgHands), {
        feature: FEATURE,
        operation: OPERATION,
        calculation_id: "C2",
      });
      calculationDrift.record(Math.abs(expectedWinrate - result.winrate), {
        feature: FEATURE,
        operation: OPERATION,
        calculation_id: "C3",
      });

      if (!result.eligibleForPromotion) {
        if (result.avgHands < 1000) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R3",
          });
        }

        if (periodDays === 15 && result.winrate < 7.5) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R4",
          });
        }

        if (periodDays === 30 && result.winrate < 5) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R5",
          });
        }
      }

      if (onEvent) {
        await onEvent({
          type: "ProgressionChecked",
          playerId,
          ...result,
          occurredAt: new Date(),
        });
      }

      totalProgressionChecks += 1;
      if (result.eligibleForPromotion) {
        eligibleProgressionChecks += 1;
      }

      businessChecksPerDay.add(1, {
        feature: FEATURE,
        capability: OPERATION,
        period: result.period,
      });
      businessEligibilityRate.record(
        totalProgressionChecks > 0
          ? eligibleProgressionChecks / totalProgressionChecks
          : 0,
        {
          feature: FEATURE,
          capability: OPERATION,
          period: result.period,
        },
      );
      businessAvgHandsAtCheck.record(result.avgHands, {
        feature: FEATURE,
        capability: OPERATION,
      });
      businessAvgWinrateAtCheck.record(result.winrate, {
        feature: FEATURE,
        capability: OPERATION,
      });

      operationResult = result.eligibleForPromotion ? "eligible" : "not_eligible";
      return result;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        result: operationResult,
        period: periodDays === 15 ? "BI_WEEKLY" : "MONTHLY",
      });
      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: OPERATION,
        period: periodDays === 15 ? "BI_WEEKLY" : "MONTHLY",
      });
    }
  };
