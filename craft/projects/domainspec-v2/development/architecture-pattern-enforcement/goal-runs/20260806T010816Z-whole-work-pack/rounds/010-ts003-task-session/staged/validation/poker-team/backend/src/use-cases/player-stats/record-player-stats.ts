import {
  PlayerStatsSnapshot,
  RecordPlayerStatsInput,
  StatsRecordStatus,
} from "../../domain/player-stats/player-stats.entity";
import { PlayerStatsRepository } from "../../domain/player-stats/player-stats.repository";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  PlayerStatsValidationError,
  validateStatDate,
  validateHands,
  validateSourceType,
  validateRake,
  validateSessionDuration,
} from "../../domain/player-stats/player-stats.validation";
import { detectEffectiveChange } from "../../domain/player-stats/player-stats.corrections";
import { PlayerStatsEventHandler } from "../../domain/player-stats/player-stats.events";
import {
  businessActivePlayersWithStats,
  businessCorrectionRate,
  businessIngestionLatency,
  businessStatsRecorded,
  calculationDrift,
  eventEmit,
  invariantViolation,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
  stateInvalidTransition,
  stateTransition,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type RecordPlayerStatsResult = {
  snapshot: PlayerStatsSnapshot;
  action: "recorded" | "corrected";
  changedFields?: string[];
};

const FEATURE = "player-stats";
const OPERATION = "RecordPlayerStats";
const WORKFLOW = "RecordStatsWorkflow";

const observedPlayersWithStats = new Set<string>();
let totalRecordedOrCorrected = 0;
let totalCorrections = 0;

type WorkflowStep = "validate" | "persist" | "emit_event";

const parseStatDateStart = (statDate: string): number => {
  const parsed = Date.parse(`${statDate}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const resolveRuleContext = (
  error: unknown,
): {
  ruleId?: string;
  invariantId?: "I1" | "I2";
  expression?: string;
} => {
  const typedError = error as {
    code?: string;
    message?: string;
  };

  if (typedError.code === "PLAYER_NOT_FOUND") {
    return { ruleId: "R1" };
  }

  if (typedError.code === "NO_CHANGES_DETECTED") {
    return { ruleId: "R6" };
  }

  if (typedError.code === "23505") {
    return {
      ruleId: "R5",
      invariantId: "I1",
      expression: "unique(playerId, statDate)",
    };
  }

  if (typedError.code !== "VALIDATION_ERROR") {
    return {};
  }

  if (typedError.message?.includes("statDate")) {
    return { ruleId: "R2" };
  }

  if (typedError.message?.includes("Hands must")) {
    return {
      ruleId: "R3",
      invariantId: "I2",
      expression: "hands >= 0",
    };
  }

  if (typedError.message?.includes("sourceType")) {
    return { ruleId: "R4" };
  }

  if (typedError.message?.includes("Rake must")) {
    return { ruleId: "R7" };
  }

  if (typedError.message?.includes("Session duration")) {
    return { ruleId: "R8" };
  }

  return {};
};

export const recordPlayerStatsUseCase =
  (
    playerStatsRepo: PlayerStatsRepository,
    playerRepo: PlayerRepository,
    onEvent?: PlayerStatsEventHandler,
  ) =>
  async (input: RecordPlayerStatsInput): Promise<RecordPlayerStatsResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";
    let failedAtStep: WorkflowStep = "validate";
    let transitionFrom: StatsRecordStatus | "new" = "new";

    try {
      // R1: Player must exist
      const player = await playerRepo.findById(input.playerId);
      if (!player) {
        throw new PlayerStatsValidationError(
          "PLAYER_NOT_FOUND",
          `Player ${input.playerId} not found.`,
        );
      }

      // R2: Valid statDate
      validateStatDate(input.statDate);

      // R3: Non-negative integer hands
      validateHands(input.hands);

      // R4: Supported sourceType
      validateSourceType(input.sourceType);

      // R7: Non-negative rake
      validateRake(input.rake);

      // R8: Non-negative integer sessionDuration
      validateSessionDuration(input.sessionDuration);

      // R5: Check existing record for player/date
      const existing = await playerStatsRepo.findByPlayerAndDate(
        input.playerId,
        input.statDate,
      );

      let snapshot: PlayerStatsSnapshot;
      let action: "recorded" | "corrected";
      let changedFields: string[] | undefined;
      let status: StatsRecordStatus;

      failedAtStep = "persist";

      if (existing) {
        transitionFrom = existing.status;

        // R6: Correction requires effective change
        changedFields = detectEffectiveChange(existing, input);

        // C2: status = CORRECTED
        status = "CORRECTED";
        snapshot = await playerStatsRepo.update(existing.id, {
          ...input,
          status,
          updatedAt: new Date(),
        });
        action = "corrected";
      } else {
        transitionFrom = "new";

        // C2: status = RECORDED
        status = "RECORDED";
        snapshot = await playerStatsRepo.create({
          ...input,
          status,
        });
        action = "recorded";
      }

      // O1
      stateTransition.add(1, {
        feature: FEATURE,
        entity: "PlayerStatsSnapshot",
        from: transitionFrom,
        to: status,
        event:
          action === "recorded"
            ? "PlayerStatsRecorded"
            : "PlayerStatsCorrected",
      });

      // O6
      const expectedSnapshotKey = `${input.playerId}:${input.statDate}`;
      const actualSnapshotKey = `${snapshot.playerId}:${snapshot.statDate}`;
      calculationDrift.record(
        expectedSnapshotKey === actualSnapshotKey ? 0 : 1,
        {
          feature: FEATURE,
          operation: OPERATION,
          calculation_id: "C1",
        },
      );
      calculationDrift.record(
        status === (existing ? "CORRECTED" : "RECORDED") ? 0 : 1,
        {
          feature: FEATURE,
          operation: OPERATION,
          calculation_id: "C2",
        },
      );

      // O7
      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "snapshot_persisted",
        result: snapshot.id ? "satisfied" : "violated",
      });

      failedAtStep = "emit_event";

      if (onEvent) {
        if (action === "corrected") {
          await onEvent({
            type: "PlayerStatsCorrected",
            snapshotId: snapshot.id,
            playerId: snapshot.playerId,
            statDate: snapshot.statDate,
            changedFields: changedFields ?? [],
            occurredAt: new Date(),
          });

          eventEmit.add(1, {
            feature: FEATURE,
            event_type: "PlayerStatsCorrected",
          });

          postconditionCheck.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            postcondition_id: "corrected_event_emitted",
            result: "satisfied",
          });
        } else {
          await onEvent({
            type: "PlayerStatsRecorded",
            snapshotId: snapshot.id,
            playerId: snapshot.playerId,
            statDate: snapshot.statDate,
            occurredAt: new Date(),
          });

          eventEmit.add(1, {
            feature: FEATURE,
            event_type: "PlayerStatsRecorded",
          });

          postconditionCheck.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            postcondition_id: "recorded_event_emitted",
            result: "satisfied",
          });
        }
      }

      operationResult = "success";

      businessStatsRecorded.add(1, {
        feature: FEATURE,
        capability: OPERATION,
        source_type: input.sourceType,
      });

      totalRecordedOrCorrected += 1;
      if (action === "corrected") {
        totalCorrections += 1;
      }

      businessCorrectionRate.record(
        totalRecordedOrCorrected > 0
          ? totalCorrections / totalRecordedOrCorrected
          : 0,
        {
          feature: FEATURE,
          capability: OPERATION,
        },
      );

      const ingestionLatencySec =
        (Date.now() - parseStatDateStart(input.statDate)) / 1000;
      businessIngestionLatency.record(Math.max(0, ingestionLatencySec), {
        feature: FEATURE,
        capability: OPERATION,
      });

      observedPlayersWithStats.add(input.playerId);
      businessActivePlayersWithStats.record(observedPlayersWithStats.size, {
        feature: FEATURE,
      });

      return { snapshot, action, changedFields };
    } catch (error) {
      const { ruleId, invariantId, expression } = resolveRuleContext(error);

      if (ruleId) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: ruleId,
          source_type: input.sourceType,
        });
      }

      const typedError = error as { code?: string };
      if (typedError.code === "NO_CHANGES_DETECTED") {
        stateInvalidTransition.add(1, {
          feature: FEATURE,
          entity: "PlayerStatsSnapshot",
          from: transitionFrom,
          attempted_event: "PlayerStatsCorrected",
          error_code: "NO_CHANGES_DETECTED",
        });
      }

      if (invariantId) {
        invariantViolation.add(1, {
          feature: FEATURE,
          entity: "PlayerStatsSnapshot",
          invariant_id: invariantId,
          expression: expression ?? "unknown",
        });
      }

      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: failedAtStep,
      });

      throw error;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        result: operationResult,
        source_type: input.sourceType,
      });

      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: OPERATION,
        source_type: input.sourceType,
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
