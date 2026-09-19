import type {
  AuthSessionRepository,
  AuthTokenRepository,
} from "../../domain/auth-access-control/auth.repository";
import type { AuthEventHandler } from "../../domain/auth-access-control/auth.events";
import { AuthValidationError } from "../../domain/auth-access-control/auth.errors";
import {
  eventConsume,
  eventConsumerLag,
  eventEmit,
  operationDuration,
  operationInvocation,
  postconditionCheck,
  ruleViolation,
  stateInvalidTransition,
  statePopulation,
  stateTransition,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type LogoutInput = {
  sessionId: string;
  callerId: string;
  callerPermissions: string[];
  tokenId?: string;
  revokeAllSessionTokens?: boolean;
};

export type LogoutResult = {
  sessionId: string;
  revokedTokenIds: string[];
};

const ADMIN_LOGOUT_PERMISSION = "auth-access-control.admin.logoutAnySession";
const FEATURE = "auth-access-control";
const OPERATION = "Logout";
const WORKFLOW = "LogoutWorkflow";

export const logoutUseCase =
  (
    sessionRepo: AuthSessionRepository,
    tokenRepo: AuthTokenRepository,
    onEvent?: AuthEventHandler,
  ) =>
  async (input: LogoutInput): Promise<LogoutResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    try {
      // R1: Session must exist and be active
      const session = await sessionRepo.findById(input.sessionId);
      if (!session || session.status !== "ACTIVE") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        stateInvalidTransition.add(1, {
          feature: FEATURE,
          entity: "Session",
          from: session?.status ?? "unknown",
          attempted_event: "LogoutCompleted",
          error_code: "AUTH_REQUIRED",
        });
        throw new AuthValidationError(
          "AUTH_REQUIRED",
          "Session not found or not active",
        );
      }

      // R2: Caller must own session or hold admin permission
      const isOwner = input.callerId === session.principalId;
      const isAdmin = input.callerPermissions.some(
        (p) =>
          p === ADMIN_LOGOUT_PERMISSION || p === "auth-access-control.admin.*",
      );

      if (!isOwner && !isAdmin) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw new AuthValidationError(
          "FORBIDDEN",
          "Caller does not own session and lacks admin permission",
        );
      }

      const now = new Date();
      let revokedTokenIds: string[] = [];

      // C1: Revocation set
      if (input.tokenId && !input.revokeAllSessionTokens) {
        // Targeted revocation: single token
        await tokenRepo.revoke(input.tokenId, now, "LOGOUT_TARGETED");
        revokedTokenIds = [input.tokenId];

        stateTransition.add(1, {
          feature: FEATURE,
          entity: "AccessToken",
          from: "ACTIVE",
          to: "REVOKED",
          event: "TokenRevoked",
        });
        statePopulation.add(-1, {
          feature: FEATURE,
          entity: "AccessToken",
          state: "ACTIVE",
        });

        if (onEvent) {
          await onEvent({
            type: "TokenRevoked",
            tokenId: input.tokenId,
            sessionId: input.sessionId,
            revokedAt: now,
            reason: "LOGOUT_TARGETED",
          });

          eventEmit.add(1, {
            feature: FEATURE,
            event_type: "TokenRevoked",
          });
          eventConsume.add(1, {
            feature: FEATURE,
            event_type: "TokenRevoked",
            consumer: "cache_invalidator",
          });
          eventConsumerLag.record(0, {
            feature: FEATURE,
            event_type: "TokenRevoked",
            consumer: "cache_invalidator",
          });
        }
      } else {
        // Revoke all active tokens linked to session
        revokedTokenIds = await tokenRepo.revokeAllBySessionId(
          input.sessionId,
          now,
          "LOGOUT_ALL_SESSION_TOKENS",
        );

        for (const _tokenId of revokedTokenIds) {
          stateTransition.add(1, {
            feature: FEATURE,
            entity: "AccessToken",
            from: "ACTIVE",
            to: "REVOKED",
            event: "TokenRevoked",
          });
          statePopulation.add(-1, {
            feature: FEATURE,
            entity: "AccessToken",
            state: "ACTIVE",
          });
        }

        if (onEvent) {
          for (const tokenId of revokedTokenIds) {
            await onEvent({
              type: "TokenRevoked",
              tokenId,
              sessionId: input.sessionId,
              revokedAt: now,
              reason: "LOGOUT_ALL_SESSION_TOKENS",
            });

            eventEmit.add(1, {
              feature: FEATURE,
              event_type: "TokenRevoked",
            });
            eventConsume.add(1, {
              feature: FEATURE,
              event_type: "TokenRevoked",
              consumer: "cache_invalidator",
            });
            eventConsumerLag.record(0, {
              feature: FEATURE,
              event_type: "TokenRevoked",
              consumer: "cache_invalidator",
            });
          }
        }
      }

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "tokens_revoked",
        result: revokedTokenIds.length > 0 ? "satisfied" : "violated",
      });
      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "revocation_persisted",
        result: "satisfied",
      });

      // R3: Revocation evidence persisted — transitions above handle this
      // State transition: Session ACTIVE -> TERMINATED
      await sessionRepo.updateStatus(input.sessionId, "TERMINATED");

      stateTransition.add(1, {
        feature: FEATURE,
        entity: "Session",
        from: "ACTIVE",
        to: "TERMINATED",
        event: "LogoutCompleted",
      });
      statePopulation.add(-1, {
        feature: FEATURE,
        entity: "Session",
        state: "ACTIVE",
      });
      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        postcondition_id: "session_terminated",
        result: "satisfied",
      });

      // Emit LogoutCompleted event
      if (onEvent) {
        await onEvent({
          type: "LogoutCompleted",
          principalId: session.principalId,
          sessionId: input.sessionId,
          revokedTokenIds,
          occurredAt: now,
        });

        eventEmit.add(1, {
          feature: FEATURE,
          event_type: "LogoutCompleted",
        });
        eventConsume.add(1, {
          feature: FEATURE,
          event_type: "LogoutCompleted",
          consumer: "session_tracker",
        });
        eventConsumerLag.record(0, {
          feature: FEATURE,
          event_type: "LogoutCompleted",
          consumer: "session_tracker",
        });
      }

      operationResult = "success";
      return {
        sessionId: input.sessionId,
        revokedTokenIds,
      };
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "logout",
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
