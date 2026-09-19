import { PlayerRepository } from "../../domain/player/player.repository";
import { FinancialWriteUnitOfWork } from "../../domain/shared/financial-write-unit-of-work";
import { TransactionRepository } from "../../domain/transaction/transaction.repository";
import {
  calculateMakeupAdjustment,
  isValidMakeupOperation,
} from "../../domain/makeup/makeup-adjustment.service";
import {
  calculationDrift,
  createCounter,
  createGauge,
  createHistogram,
  eventConsume,
  eventConsumerLag,
  eventEmit,
  exposureAmount,
  idempotencyDedup,
  idempotencyViolation,
  invariantViolation,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  reconciliationMismatch,
  ruleViolation,
  stateInvalidTransition,
  statePopulation,
  stateTransition,
  transactionDuplicate,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type AdjustPlayerMakeupInput = {
  playerId: string;
  operation: "increase" | "decrease" | "set";
  amount: number;
  date?: string;
  actorId?: string;
  requestId?: string;
  reasonCode?: string;
  sourceChannel?: string;
};

export type AdjustPlayerMakeupResult = {
  playerId: string;
  previousMakeup: number;
  currentMakeup: number;
  operation: "increase" | "decrease" | "set";
  amount: number;
};

const FEATURE = "player-makeup";
const OPERATION = "AdjustPlayerMakeup";
const WORKFLOW = "MakeupAdjustmentWorkflow";

const businessAdjustmentsExecuted = createCounter(
  "business.adjustments_executed",
  {
    unit: "{adjustment}",
    description: "Makeup adjustments executed by operation type (O13)",
  },
);

const businessTotalMakeupOutstanding = createHistogram(
  "business.total_makeup_outstanding",
  {
    unit: "{currency_minor}",
    description: "Observed outstanding makeup amount samples (O13)",
  },
);

const businessAvgDebtPerPlayer = createHistogram("business.avg_debt_per_player", {
  unit: "{currency_minor}",
  description: "Observed average debt per player samples (O13)",
});

const businessPlayersInDebt = createHistogram("business.players_in_debt", {
  unit: "{player}",
  description: "Observed players-in-debt samples (O13)",
});

const makeupCycleAdjustments = createCounter("makeup.cycle.adjustments", {
  unit: "{adjustment}",
  description: "Makeup cycle adjustment count (O16)",
});

const makeupCycleTotalIncrease = createCounter("makeup.cycle.total_increase", {
  unit: "{currency_minor}",
  description: "Total makeup increase amount (O16)",
});

const makeupCycleTotalDecrease = createCounter("makeup.cycle.total_decrease", {
  unit: "{currency_minor}",
  description: "Total makeup decrease amount (O16)",
});

const makeupCycleNetChange = createGauge("makeup.cycle.net_change", {
  unit: "{currency_minor}",
  description: "Net makeup change across adjustment cycle (O16)",
});

const makeupCycleErrorRate = createGauge("makeup.cycle.error_rate", {
  unit: "1",
  description: "Makeup cycle error rate samples (0 or 1) (O16)",
});

const makeupRecalculationDrift = createGauge(
  "makeup.recalculation.drift",
  {
    unit: "{currency_minor}",
    description: "Recalculated makeup drift amount (O16)",
  },
);

export const adjustPlayerMakeupUseCase =
  (
    playerRepo: PlayerRepository,
    transactionRepo: TransactionRepository,
    unitOfWork?: FinancialWriteUnitOfWork,
  ) =>
  async (input: AdjustPlayerMakeupInput): Promise<AdjustPlayerMakeupResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";
    let failedAtStep: "validation" | "domain_execution" | "audit_persistence" =
      "validation";

    try {
      if (
        !input.actorId ||
        !input.requestId ||
        !input.reasonCode ||
        !input.sourceChannel
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw new Error("Invalid audit metadata");
      }

      const execute = async (
        activePlayerRepo: PlayerRepository,
        activeTransactionRepo: TransactionRepository,
      ): Promise<AdjustPlayerMakeupResult> => {
        if (!isValidMakeupOperation(input.operation)) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R3",
          });
          throw new Error("Invalid operation");
        }

        const player = await activePlayerRepo.findById(input.playerId);
        if (!player) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R1",
          });
          throw new Error("Player not found");
        }

        const previousState = player.makeup > 0 ? "InDebt" : "Settled";
        const today = input.date ?? new Date().toISOString().slice(0, 10);

        const existing = await activeTransactionRepo.findByPlayerId(player.id);
        const duplicateAdjustments = existing.filter((item) => {
          const requestId =
            typeof item.metadata?.requestId === "string"
              ? item.metadata.requestId
              : null;
          return (
            item.type === "MAKEUP_ADJUSTMENT" &&
            requestId === input.requestId &&
            item.date === today
          );
        }).length;

        const {
          previousMakeup,
          currentMakeup,
          normalizedAmount,
          signedDelta,
        } = calculateMakeupAdjustment({
          previousMakeup: player.makeup,
          operation: input.operation,
          amount: input.amount,
        });

        const expectedRounded = Math.floor(input.amount + 0.5);
        const expectedCurrentMakeup =
          input.operation === "increase"
            ? previousMakeup + normalizedAmount
            : input.operation === "decrease"
              ? Math.max(0, previousMakeup - normalizedAmount)
              : Math.max(0, normalizedAmount);
        const expectedDelta = expectedCurrentMakeup - previousMakeup;

        calculationDrift.record(Math.abs(normalizedAmount - expectedRounded), {
          feature: FEATURE,
          operation: OPERATION,
          calculation_id: "C1",
        });
        calculationDrift.record(
          input.operation === "increase"
            ? Math.abs(currentMakeup - expectedCurrentMakeup)
            : 0,
          {
            feature: FEATURE,
            operation: OPERATION,
            calculation_id: "C2",
          },
        );
        calculationDrift.record(
          input.operation === "decrease"
            ? Math.abs(currentMakeup - expectedCurrentMakeup)
            : 0,
          {
            feature: FEATURE,
            operation: OPERATION,
            calculation_id: "C3",
          },
        );
        calculationDrift.record(
          input.operation === "set"
            ? Math.abs(currentMakeup - expectedCurrentMakeup)
            : 0,
          {
            feature: FEATURE,
            operation: OPERATION,
            calculation_id: "C4",
          },
        );
        calculationDrift.record(Math.abs(signedDelta - expectedDelta), {
          feature: FEATURE,
          operation: OPERATION,
          calculation_id: "C5",
        });

        makeupRecalculationDrift.record(
          Math.max(
            Math.abs(normalizedAmount - expectedRounded),
            Math.abs(currentMakeup - expectedCurrentMakeup),
            Math.abs(signedDelta - expectedDelta),
          ),
          {
            feature: FEATURE,
            calculation_id: "makeup_recalculation",
          },
        );

        await activePlayerRepo.update(player.id, { makeup: currentMakeup });

        const currentState = currentMakeup > 0 ? "InDebt" : "Settled";
        stateTransition.add(1, {
          feature: FEATURE,
          entity: "MakeupDebtState",
          from: previousState,
          to: currentState,
          event: "MakeupAdjusted",
        });

        if (previousState !== currentState) {
          statePopulation.add(-1, {
            feature: FEATURE,
            entity: "MakeupDebtState",
            state: previousState,
          });
          statePopulation.add(1, {
            feature: FEATURE,
            entity: "MakeupDebtState",
            state: currentState,
          });
        }

        let adjustmentPersisted = false;

        if (duplicateAdjustments > 0 && signedDelta !== 0) {
          idempotencyViolation.add(1, {
            feature: FEATURE,
            operation: "SettlementMakeupApplication",
            rule_id: "dedup_identity",
          });
          transactionDuplicate.add(1, {
            feature: FEATURE,
            transaction_type: "MAKEUP_ADJUSTMENT",
          });
          idempotencyDedup.add(1, {
            feature: FEATURE,
            operation: "SettlementMakeupApplication",
          });
          exposureAmount.record(Math.abs(signedDelta), {
            feature: FEATURE,
            operation: OPERATION,
          });
        } else if (signedDelta !== 0) {
          failedAtStep = "audit_persistence";

          await activeTransactionRepo.create({
            playerId: player.id,
            type: "MAKEUP_ADJUSTMENT",
            amount: signedDelta,
            date: today,
            metadata: {
              actorId: input.actorId,
              requestId: input.requestId,
              reasonCode: input.reasonCode,
              sourceChannel: input.sourceChannel,
            },
          });

          adjustmentPersisted = true;

          eventEmit.add(1, {
            feature: FEATURE,
            event_type: "MakeupAdjusted",
          });
          eventConsume.add(1, {
            feature: FEATURE,
            event_type: "MakeupAdjusted",
            consumer: "finance_audit",
          });
          eventConsumerLag.record(0, {
            feature: FEATURE,
            event_type: "MakeupAdjusted",
            consumer: "finance_audit",
          });
        }

        if (previousState === "Settled" && signedDelta === 0) {
          stateInvalidTransition.add(1, {
            feature: FEATURE,
            entity: "MakeupDebtState",
            from: "Settled",
            attempted_event: "MakeupAdjusted",
            error_code: "NOOP_DELTA",
          });
        }

        invariantViolation.add(currentMakeup >= 0 ? 0 : 1, {
          feature: FEATURE,
          entity: "MakeupDebtState",
          invariant_id: "I1",
          expression: "makeup >= 0",
        });
        invariantViolation.add(
          signedDelta === 0 && adjustmentPersisted ? 1 : 0,
          {
            feature: FEATURE,
            entity: "MakeupDebtState",
            invariant_id: "I2",
            expression: "delta == 0 => no MAKEUP_ADJUSTMENT",
          },
        );

        postconditionCheck.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          postcondition_id: "makeup_non_negative",
          result: currentMakeup >= 0 ? "satisfied" : "violated",
        });
        postconditionCheck.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          postcondition_id: "adjustment_event_on_delta",
          result:
            (signedDelta !== 0 && adjustmentPersisted) ||
            (signedDelta === 0 && !adjustmentPersisted)
              ? "satisfied"
              : "violated",
        });

        reconciliationMismatch.record(
          Math.abs(expectedCurrentMakeup - currentMakeup),
          {
            feature: FEATURE,
            entity: "Player",
          },
        );

        makeupCycleAdjustments.add(1, {
          feature: FEATURE,
        });
        if (signedDelta > 0) {
          makeupCycleTotalIncrease.add(signedDelta, {
            feature: FEATURE,
          });
        }
        if (signedDelta < 0) {
          makeupCycleTotalDecrease.add(Math.abs(signedDelta), {
            feature: FEATURE,
          });
        }
        makeupCycleNetChange.add(signedDelta, {
          feature: FEATURE,
        });

        businessAdjustmentsExecuted.add(1, {
          feature: FEATURE,
          capability: OPERATION,
          adjustment_operation: input.operation,
        });
        businessTotalMakeupOutstanding.record(currentMakeup, {
          feature: FEATURE,
        });
        businessAvgDebtPerPlayer.record(currentMakeup, {
          feature: FEATURE,
        });
        businessPlayersInDebt.record(currentMakeup > 0 ? 1 : 0, {
          feature: FEATURE,
        });

        return {
          playerId: player.id,
          previousMakeup,
          currentMakeup,
          operation: input.operation,
          amount: normalizedAmount,
        };
      };

      failedAtStep = "domain_execution";
      const result = unitOfWork
        ? await unitOfWork.runInTransaction(
            ({
              playerRepo: txPlayerRepo,
              transactionRepo: txTransactionRepo,
            }) => execute(txPlayerRepo, txTransactionRepo),
          )
        : await execute(playerRepo, transactionRepo);

      operationResult = "success";
      makeupCycleErrorRate.record(0, {
        feature: FEATURE,
      });
      return result;
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: failedAtStep,
      });
      makeupCycleErrorRate.record(1, {
        feature: FEATURE,
      });
      throw error;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        result: operationResult,
      });
      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: OPERATION,
      });

      workflowInvocation.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        result: operationResult === "success" ? "completed" : "failed",
      });
      workflowDuration.record(durationSec, {
        feature: FEATURE,
        workflow: WORKFLOW,
      });
    }
  };
