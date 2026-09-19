import { CreatePlayerInput, Player } from "../../domain/player/player.entity";
import { PlayerRepository } from "../../domain/player/player.repository";
import {
  isAllowedLimit,
  canonicalEmailKey,
  isNonEmptyString,
  normalizeEmail,
} from "../../domain/player/email-normalization";
import type { PlayerManagementEventHandler } from "../../domain/player-management/player-management.events";
import {
  createCounter,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
} from "../../infrastructure/telemetry/instruments";

type UseCaseError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

const withError = (
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
): UseCaseError => {
  const error = new Error(message) as UseCaseError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

const EMAIL_UNIQUE_CONSTRAINTS = new Set([
  "players_canonical_email_key",
  "players_canonical_email_unique",
]);

const PRINCIPAL_UNIQUE_CONSTRAINTS = new Set(["players_principal_id_unique"]);

const FEATURE = "player-management";
const OPERATION = "CreatePlayer";

const businessPlayersCreated = createCounter("business.players_created", {
  unit: "{player}",
  description: "Created players count (O13)",
});

const businessDuplicateEmailAttempts = createCounter(
  "business.duplicate_email_attempts",
  {
    unit: "{attempt}",
    description: "Duplicate email creation attempts blocked (O13)",
  },
);

export const createPlayerUseCase =
  (playerRepo: PlayerRepository, onEvent?: PlayerManagementEventHandler) =>
  async (input: CreatePlayerInput): Promise<Player> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      if (!isNonEmptyString(input.name)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw withError("Name is required", 400, "VALIDATION_ERROR", {
          field: "name",
        });
      }

      if (!isNonEmptyString(input.email)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw withError("Email is required", 400, "VALIDATION_ERROR", {
          field: "email",
        });
      }

      if (!isNonEmptyString(input.currentLimit)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R3",
        });
        throw withError("Current limit is required", 400, "VALIDATION_ERROR", {
          field: "currentLimit",
        });
      }

      if (!isAllowedLimit(input.currentLimit)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R6",
        });
        throw withError("Invalid current limit", 400, "VALIDATION_ERROR", {
          field: "currentLimit",
        });
      }

      const normalizedPrincipalId =
        typeof input.principalId === "string"
          ? input.principalId.trim()
          : undefined;

      if (input.principalId !== undefined && !normalizedPrincipalId) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R3",
        });
        throw withError("Principal id is invalid", 400, "VALIDATION_ERROR", {
          field: "principalId",
        });
      }

      if (
        input.initialBankroll !== undefined &&
        (!Number.isInteger(input.initialBankroll) || input.initialBankroll < 0)
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R5",
        });
        throw withError("Invalid initial bankroll", 400, "VALIDATION_ERROR", {
          field: "initialBankroll",
        });
      }

      const normalizedEmail = normalizeEmail(input.email);

      const createInput: CreatePlayerInput = {
        ...input,
        name: input.name.trim(),
        email: normalizedEmail,
        ...(normalizedPrincipalId
          ? { principalId: normalizedPrincipalId }
          : {}),
      };

      const created = await playerRepo.create(createInput);

      if (onEvent) {
        await onEvent({
          type: "PlayerCreated",
          playerId: created.id,
          emailKey: canonicalEmailKey(created.email),
          currentLimit: created.currentLimit,
          occurredAt: created.createdAt ?? new Date(),
        });
      }

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "player_persisted",
        result: created.id ? "satisfied" : "violated",
      });
      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "player_queryable",
        result: "satisfied",
      });

      businessPlayersCreated.add(1, {
        feature: FEATURE,
        capability: OPERATION,
      });

      operationResult = "success";
      return created;
    } catch (error) {
      const repositoryError = error as {
        code?: string;
        constraint?: string;
        message?: string;
      };

      if (
        repositoryError.code === "23505" &&
        repositoryError.constraint &&
        PRINCIPAL_UNIQUE_CONSTRAINTS.has(repositoryError.constraint)
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R4",
        });
        throw withError(
          "Player principal already linked",
          409,
          "DUPLICATE_PRINCIPAL_ID",
        );
      }

      const isEmailUniqueViolation =
        repositoryError.code === "23505" &&
        (!repositoryError.constraint ||
          EMAIL_UNIQUE_CONSTRAINTS.has(repositoryError.constraint));

      if (isEmailUniqueViolation) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R4",
        });
        businessDuplicateEmailAttempts.add(1, {
          feature: FEATURE,
          capability: OPERATION,
        });
        throw withError("Player email already exists", 409, "DUPLICATE_EMAIL");
      }

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
    }
  };
