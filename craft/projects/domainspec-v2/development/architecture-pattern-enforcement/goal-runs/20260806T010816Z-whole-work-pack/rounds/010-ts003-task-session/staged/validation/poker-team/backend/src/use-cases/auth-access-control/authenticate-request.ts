import jwt from "jsonwebtoken";
import type { AuthContext } from "../../domain/auth-access-control/auth-context.vo";
import type {
  AuthSessionRepository,
  AuthTokenRepository,
} from "../../domain/auth-access-control/auth.repository";
import { AuthValidationError } from "../../domain/auth-access-control/auth.errors";
import { validateSidClaim } from "../../domain/auth-access-control/auth.validation";
import {
  invariantViolation,
  operationDuration,
  operationInvocation,
  ruleViolation,
  stateInvalidTransition,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type AuthenticateRequestInput = {
  authorizationHeader: string | undefined;
};

export type AuthenticateRequestResult = {
  authContext: AuthContext;
};

const FEATURE = "auth-access-control";
const OPERATION = "AuthenticateRequest";
const WORKFLOW = "AuthenticateRequestWorkflow";

export const authenticateRequestUseCase =
  (sessionRepo: AuthSessionRepository, tokenRepo: AuthTokenRepository) =>
  async (
    input: AuthenticateRequestInput,
  ): Promise<AuthenticateRequestResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    // R1: Bearer token must be present
    try {
      const header = input.authorizationHeader;
      if (!header || !header.startsWith("Bearer ")) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        throw new AuthValidationError("AUTH_REQUIRED", "Missing bearer token");
      }

      const rawToken = header.slice(7);

      // R2: Token signature and claims must verify
      const secret = process.env.JWT_SECRET ?? "secretKey";
      let payload: { sid?: unknown; jti?: unknown; iat?: number; exp?: number };
      try {
        const decoded = jwt.verify(rawToken, secret);
        if (!decoded || typeof decoded === "string") {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R2",
          });
          throw new AuthValidationError("INVALID_TOKEN", "Invalid bearer token");
        }
        payload = decoded as typeof payload;
      } catch (error) {
        // R3: Token must not be expired
        if (error instanceof jwt.TokenExpiredError) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R3",
          });
          stateInvalidTransition.add(1, {
            feature: FEATURE,
            entity: "AccessToken",
            from: "ACTIVE",
            attempted_event: "AuthenticateRequest",
            error_code: "TOKEN_EXPIRED",
          });
          throw new AuthValidationError("TOKEN_EXPIRED", "Token expired");
        }
        if (error instanceof AuthValidationError) throw error;
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        throw new AuthValidationError("INVALID_TOKEN", "Invalid bearer token");
      }

      // R5: Token must include session id claim
      try {
        validateSidClaim(payload.sid);
      } catch (error) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R5",
        });
        throw error;
      }

      const sid = payload.sid;
      const jti = typeof payload.jti === "string" ? payload.jti : "";

      // R4: Token must not be revoked (check persistent record if available)
      if (jti) {
        const tokenRecord = await tokenRepo.findByTokenId(jti);
        if (tokenRecord && tokenRecord.revokedAt !== null) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R4",
          });
          stateInvalidTransition.add(1, {
            feature: FEATURE,
            entity: "AccessToken",
            from: "REVOKED",
            attempted_event: "AuthenticateRequest",
            error_code: "TOKEN_REVOKED",
          });
          throw new AuthValidationError(
            "TOKEN_REVOKED",
            "Token has been revoked",
          );
        }
      }

      // R6: Session identified by sid must exist and be active
      const session = await sessionRepo.findById(sid);
      if (!session) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R6",
        });
        throw new AuthValidationError(
          "AUTH_REQUIRED",
          "Inactive or missing session",
        );
      }

      if (session.status !== "ACTIVE") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R6",
        });
        stateInvalidTransition.add(1, {
          feature: FEATURE,
          entity: "Session",
          from: session.status,
          attempted_event: "AuthenticateRequest",
          error_code: "SESSION_NOT_ACTIVE",
        });
        throw new AuthValidationError("AUTH_REQUIRED", "Session is not active");
      }

      // Check session expiration (SessionLifecycle I2)
      if (new Date() >= session.expiresAt) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R6",
        });
        invariantViolation.add(1, {
          feature: FEATURE,
          entity: "Session",
          invariant_id: "I2",
          expression: "ACTIVE session must have future expiry",
        });
        throw new AuthValidationError("AUTH_REQUIRED", "Session has expired");
      }

      invariantViolation.add(0, {
        feature: FEATURE,
        entity: "Session",
        invariant_id: "I2",
        expression: "ACTIVE session must have future expiry",
      });

      // C1: Auth context = mapClaims(token.claims) + resolveSession(token.sid)
      const authContext: AuthContext = {
        principalId: session.principalId,
        sessionId: session.id,
        permissions: session.effectivePermissions,
        tokenId: jti,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
        expiresAt: payload.exp
          ? new Date(payload.exp * 1000)
          : session.expiresAt,
      };

      operationResult = "success";
      return { authContext };
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "authenticate",
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
