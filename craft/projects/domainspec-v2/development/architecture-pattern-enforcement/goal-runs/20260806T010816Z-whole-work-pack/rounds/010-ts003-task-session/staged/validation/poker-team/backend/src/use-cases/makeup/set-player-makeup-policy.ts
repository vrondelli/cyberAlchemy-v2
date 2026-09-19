import {
  resolveEffectiveMakeupPolicy,
  validateMakeupPolicyShape,
} from "../../domain/makeup/makeup-policy.service";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  createCounter,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
} from "../../infrastructure/telemetry/instruments";

type SetPlayerMakeupPolicyInput = {
  playerId: string;
  applyProfitFirst: boolean;
  applyRakebackSecond: boolean;
  playerRakebackShare: number;
};

const FEATURE = "player-makeup";
const OPERATION = "SetPlayerMakeupPolicy";

const businessPolicyChanges = createCounter("business.policy_changes", {
  unit: "{change}",
  description: "Makeup policy changes (O13)",
});

export const setPlayerMakeupPolicyUseCase = (playerRepo: PlayerRepository) => {
  return async (input: SetPlayerMakeupPolicyInput) => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      const player = await playerRepo.findById(input.playerId);
      if (!player) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw new Error("Player not found");
      }

      try {
        validateMakeupPolicyShape(input);
      } catch (error) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw error;
      }

      const policy = resolveEffectiveMakeupPolicy({
        applyProfitFirst: input.applyProfitFirst,
        applyRakebackSecond: input.applyRakebackSecond,
        playerRakebackShare: input.playerRakebackShare,
      });

      await playerRepo.update(input.playerId, { makeupPolicy: policy });

      if (
        policy.playerRakebackShare !== input.playerRakebackShare ||
        policy.applyProfitFirst !== input.applyProfitFirst ||
        policy.applyRakebackSecond !== input.applyRakebackSecond
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R3",
        });
      }

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "policy_persisted",
        result: "satisfied",
      });

      businessPolicyChanges.add(1, {
        feature: FEATURE,
        capability: OPERATION,
      });

      operationResult = "success";
      return policy;
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
    }
  };
};
