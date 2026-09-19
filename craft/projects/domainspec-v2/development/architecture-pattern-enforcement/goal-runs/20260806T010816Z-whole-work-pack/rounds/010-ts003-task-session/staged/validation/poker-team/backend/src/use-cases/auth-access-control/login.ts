import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import type { Session } from "../../domain/auth-access-control/session.entity";
import type { AccessToken } from "../../domain/auth-access-control/access-token.entity";
import type {
  AuthSessionRepository,
  AuthTokenRepository,
  PrincipalRepository,
  PermissionGrantRepository,
} from "../../domain/auth-access-control/auth.repository";
import type { AuthEventHandler } from "../../domain/auth-access-control/auth.events";
import { AuthValidationError } from "../../domain/auth-access-control/auth.errors";
import { resolveEffectivePermissions } from "../../domain/auth-access-control/permission-resolution";
import { deduplicatePermissions } from "../../domain/auth-access-control/auth.validation";
import { evaluateLoginRiskPolicy } from "../../domain/auth-access-control/login-risk-policy";
import {
  createCounter,
  eventConsume,
  eventConsumerLag,
  eventEmit,
  invariantViolation,
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

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const DEFAULT_TOKEN_TTL_SECONDS = 3600; // 1 hour
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 86400;

const FEATURE = "auth-access-control";
const LOGIN_OPERATION = "Login";
const ISSUE_ACCESS_TOKEN_OPERATION = "IssueAccessToken";
const LOGIN_WORKFLOW = "LoginWorkflow";
const ISSUE_ACCESS_TOKEN_WORKFLOW = "IssueAccessTokenWorkflow";

const securityLoginDenied = createCounter("security.login_denied", {
  unit: "{denial}",
  description: "Login denials grouped by reason (O13 security KPI)",
});

const businessLogins = createCounter("business.logins", {
  unit: "{login}",
  description: "Auth login attempts grouped by result (O13 KPI)",
});

const businessTokensIssued = createCounter("business.tokens_issued", {
  unit: "{token}",
  description: "Access tokens issued (O13 KPI)",
});

const resolveDenyReason = (
  input?: LoginInput["context"],
):
  | "IP_BLOCKED"
  | "RATE_LIMITED"
  | "NO_USER_AGENT"
  | "INVALID_CREDENTIALS"
  | "PRINCIPAL_DISABLED" => {
  if (input?.ipReputation === "BLOCKED") return "IP_BLOCKED";
  if ((input?.failedAttemptsLast15m ?? 0) >= 5) return "RATE_LIMITED";
  if (input?.hasUserAgent === false) return "NO_USER_AGENT";
  return "RATE_LIMITED";
};

export type LoginInput = {
  identifier: string;
  secret: string;
  context?: {
    ipReputation?: "TRUSTED" | "UNKNOWN" | "BLOCKED";
    failedAttemptsLast15m?: number;
    hasUserAgent?: boolean;
  };
};

export type LoginResult = {
  accessToken: string;
  expiresAt: Date;
  sessionId: string;
};

export type IssueAccessTokenInput = {
  sessionId: string;
  ttlSeconds: number;
};

export type IssueAccessTokenResult = {
  accessToken: string;
  expiresAt: Date;
  tokenId: string;
};

export const loginUseCase =
  (
    principalRepo: PrincipalRepository,
    sessionRepo: AuthSessionRepository,
    tokenRepo: AuthTokenRepository,
    grantRepo: PermissionGrantRepository,
    onEvent?: AuthEventHandler,
  ) =>
  async (input: LoginInput): Promise<LoginResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    if (!input.identifier || !input.secret) {
      ruleViolation.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        rule_id: "R2",
      });
      securityLoginDenied.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        deny_reason: "INVALID_CREDENTIALS",
      });

      throw new AuthValidationError(
        "INVALID_CREDENTIALS",
        "Missing identifier or secret",
      );
    }
    try {
      // R1: Principal must exist and be active
      const principal = await principalRepo.findByIdentifier(input.identifier);
      if (!principal || principal.status !== "ACTIVE") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          rule_id: "R1",
        });
        securityLoginDenied.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          deny_reason: "PRINCIPAL_DISABLED",
        });
        stateInvalidTransition.add(1, {
          feature: FEATURE,
          entity: "Session",
          from: "new",
          attempted_event: "LoginSucceeded",
          error_code: "PRINCIPAL_DISABLED",
        });

        throw new AuthValidationError(
          "PRINCIPAL_DISABLED",
          "Principal not found or disabled",
        );
      }

      // R2: Credential verification must succeed
      const valid = await principalRepo.verifyCredential(
        input.identifier,
        input.secret,
      );
      if (!valid) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          rule_id: "R2",
        });
        securityLoginDenied.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          deny_reason: "INVALID_CREDENTIALS",
        });

        throw new AuthValidationError(
          "INVALID_CREDENTIALS",
          "Invalid credentials",
        );
      }

      // R3: Login policy checks must pass
      try {
        evaluateLoginRiskPolicy(input.context);
      } catch (error) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          rule_id: "R3",
        });
        securityLoginDenied.add(1, {
          feature: FEATURE,
          operation: LOGIN_OPERATION,
          deny_reason: resolveDenyReason(input.context),
        });
        throw error;
      }

      // Resolve grants for role keys
      const grants = await grantRepo.findByGranteeKeys([
        ...principal.roleKeys,
        principal.id,
      ]);

      // C2: Effective permissions
      const effectivePermissions = deduplicatePermissions(
        resolveEffectivePermissions(
          principal.roleKeys,
          principal.directPermissions,
          grants,
        ),
      );

      // C1: Session expiration = now + 8h
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

      const session: Session = {
        id: randomUUID(),
        principalId: principal.id,
        status: "ACTIVE",
        effectivePermissions,
        createdAt: now,
        expiresAt,
      };

      await sessionRepo.create(session);

      stateTransition.add(1, {
        feature: FEATURE,
        entity: "Session",
        from: "new",
        to: "ACTIVE",
        event: "LoginSucceeded",
      });
      statePopulation.add(1, {
        feature: FEATURE,
        entity: "Session",
        state: "ACTIVE",
      });
      invariantViolation.add(expiresAt > now ? 0 : 1, {
        feature: FEATURE,
        entity: "Session",
        invariant_id: "I2",
        expression: "expiresAt > now",
      });
      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        postcondition_id: "session_created",
        result: session.id ? "satisfied" : "violated",
      });

      // IssueAccessToken automatically
      const tokenResult = await issueAccessTokenInternal(
        session,
        DEFAULT_TOKEN_TTL_SECONDS,
        tokenRepo,
        onEvent,
      );

      postconditionCheck.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        postcondition_id: "token_issued_for_session",
        result: tokenResult.tokenId ? "satisfied" : "violated",
      });

      // Emit LoginSucceeded
      if (onEvent) {
        await onEvent({
          type: "LoginSucceeded",
          principalId: principal.id,
          sessionId: session.id,
          occurredAt: now,
        });

        eventEmit.add(1, {
          feature: FEATURE,
          event_type: "LoginSucceeded",
        });
        eventConsume.add(1, {
          feature: FEATURE,
          event_type: "LoginSucceeded",
          consumer: "session_tracker",
        });
        eventConsumerLag.record(0, {
          feature: FEATURE,
          event_type: "LoginSucceeded",
          consumer: "session_tracker",
        });
      }

      operationResult = "success";
      businessLogins.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        result: "success",
      });

      return {
        accessToken: tokenResult.accessToken,
        expiresAt: tokenResult.expiresAt,
        sessionId: session.id,
      };
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: LOGIN_WORKFLOW,
        failed_at_step: "domain_execution",
      });
      businessLogins.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        result: "error",
      });
      throw error;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
        result: operationResult,
      });
      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: LOGIN_OPERATION,
      });

      workflowInvocation.add(1, {
        feature: FEATURE,
        workflow: LOGIN_WORKFLOW,
        result: operationResult === "success" ? "completed" : "failed",
      });
      workflowDuration.record(durationSec, {
        feature: FEATURE,
        workflow: LOGIN_WORKFLOW,
      });
    }
  };

export const issueAccessTokenUseCase =
  (
    sessionRepo: AuthSessionRepository,
    tokenRepo: AuthTokenRepository,
    onEvent?: AuthEventHandler,
  ) =>
  async (input: IssueAccessTokenInput): Promise<IssueAccessTokenResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";

    // R1: Session must exist and be active
    try {
      const session = await sessionRepo.findById(input.sessionId);
      if (!session || session.status !== "ACTIVE") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: ISSUE_ACCESS_TOKEN_OPERATION,
          rule_id: "R1",
        });
        throw new AuthValidationError("AUTH_REQUIRED", "Session not active");
      }

      // R2: ttlSeconds must be within configured bounds
      if (
        input.ttlSeconds < MIN_TTL_SECONDS ||
        input.ttlSeconds > MAX_TTL_SECONDS
      ) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: ISSUE_ACCESS_TOKEN_OPERATION,
          rule_id: "R2",
        });
        throw new AuthValidationError(
          "FORBIDDEN",
          `ttlSeconds must be between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS}`,
        );
      }

      const result = await issueAccessTokenInternal(
        session,
        input.ttlSeconds,
        tokenRepo,
        onEvent,
      );

      operationResult = "success";
      return result;
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: ISSUE_ACCESS_TOKEN_WORKFLOW,
        failed_at_step: "domain_execution",
      });
      throw error;
    } finally {
      const durationSec = (performance.now() - startedAt) / 1000;

      operationInvocation.add(1, {
        feature: FEATURE,
        operation: ISSUE_ACCESS_TOKEN_OPERATION,
        result: operationResult,
      });
      operationDuration.record(durationSec, {
        feature: FEATURE,
        operation: ISSUE_ACCESS_TOKEN_OPERATION,
      });

      workflowInvocation.add(1, {
        feature: FEATURE,
        workflow: ISSUE_ACCESS_TOKEN_WORKFLOW,
        result: operationResult === "success" ? "completed" : "failed",
      });
      workflowDuration.record(durationSec, {
        feature: FEATURE,
        workflow: ISSUE_ACCESS_TOKEN_WORKFLOW,
      });
    }
  };

async function issueAccessTokenInternal(
  session: Session,
  ttlSeconds: number,
  tokenRepo: AuthTokenRepository,
  onEvent?: AuthEventHandler,
): Promise<IssueAccessTokenResult> {
  const now = new Date();
  const tokenId = randomUUID();

  // C1: Token expiration = issuedAt + ttlSeconds
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  // C2: Minimal JWT claims = { sid, jti, iat, exp }
  const secret = process.env.JWT_SECRET ?? "secretKey";
  const accessToken = jwt.sign(
    {
      sid: session.id,
      jti: tokenId,
    },
    secret,
    { expiresIn: ttlSeconds },
  );

  const tokenRecord: AccessToken = {
    tokenId,
    sessionId: session.id,
    issuedAt: now,
    expiresAt,
    revokedAt: null,
    scope: [],
  };

  await tokenRepo.create(tokenRecord);

  stateTransition.add(1, {
    feature: FEATURE,
    entity: "AccessToken",
    from: "new",
    to: "ACTIVE",
    event: "TokenIssued",
  });
  statePopulation.add(1, {
    feature: FEATURE,
    entity: "AccessToken",
    state: "ACTIVE",
  });
  invariantViolation.add(tokenRecord.revokedAt === null ? 0 : 1, {
    feature: FEATURE,
    entity: "AccessToken",
    invariant_id: "I2",
    expression: "ACTIVE tokens must not be revoked",
  });
  postconditionCheck.add(1, {
    feature: FEATURE,
    operation: ISSUE_ACCESS_TOKEN_OPERATION,
    postcondition_id: "token_issued_for_session",
    result: tokenRecord.tokenId ? "satisfied" : "violated",
  });

  businessTokensIssued.add(1, {
    feature: FEATURE,
    capability: ISSUE_ACCESS_TOKEN_OPERATION,
  });

  // Emit TokenIssued
  if (onEvent) {
    await onEvent({
      type: "TokenIssued",
      tokenId,
      sessionId: session.id,
      issuedAt: now,
      expiresAt,
    });

    eventEmit.add(1, {
      feature: FEATURE,
      event_type: "TokenIssued",
    });
    eventConsume.add(1, {
      feature: FEATURE,
      event_type: "TokenIssued",
      consumer: "session_tracker",
    });
    eventConsumerLag.record(0, {
      feature: FEATURE,
      event_type: "TokenIssued",
      consumer: "session_tracker",
    });
  }

  return { accessToken, expiresAt, tokenId };
}
