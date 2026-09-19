import jwt from "jsonwebtoken";
import type {
  AuthSessionRepository,
  AuthTokenRepository,
} from "../../domain/auth-access-control/auth.repository";
import { resolveIntrospectInactiveReason } from "../../domain/auth-access-control/introspect-reason.policy";
import {
  operationDuration,
  operationInvocation,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type IntrospectTokenInput = {
  token: string;
  includeScopes?: boolean;
};

export type IntrospectTokenResult = {
  active: boolean;
  principalId?: string;
  exp?: number;
  iat?: number;
  scopes?: string[];
  inactiveReason?:
    | "NOT_FOUND"
    | "TOKEN_REVOKED"
    | "TOKEN_EXPIRED"
    | "SESSION_TERMINATED"
    | "SESSION_EXPIRED";
};

  const FEATURE = "auth-access-control";
  const OPERATION = "IntrospectToken";
  const WORKFLOW = "TokenIntrospectionWorkflow";

export const introspectTokenUseCase =
  (sessionRepo: AuthSessionRepository, tokenRepo: AuthTokenRepository) =>
  async (input: IntrospectTokenInput): Promise<IntrospectTokenResult> => {
    const startedAt = performance.now();
    let operationResult: "success" | "error" = "error";
    const includeScopes = input.includeScopes ?? true;

    try {
      // R1: Token lookup must be deterministic — decode to get jti
      const secret = process.env.JWT_SECRET ?? "secretKey";
      let claims: { jti?: string; sid?: string; iat?: number; exp?: number };
      try {
        const decoded = jwt.verify(input.token, secret, {
          ignoreExpiration: true,
        });
        if (!decoded || typeof decoded === "string") {
          operationResult = "success";
          return { active: false, inactiveReason: "NOT_FOUND" };
        }
        claims = decoded as typeof claims;
      } catch {
        operationResult = "success";
        return { active: false, inactiveReason: "NOT_FOUND" };
      }

      const tokenId = typeof claims.jti === "string" ? claims.jti : null;
      const sid = typeof claims.sid === "string" ? claims.sid : null;

      if (!tokenId || !sid) {
        operationResult = "success";
        return { active: false, inactiveReason: "NOT_FOUND" };
      }

      // R1: Find persistent token record
      const tokenRecord = await tokenRepo.findByTokenId(tokenId);
      if (!tokenRecord) {
        operationResult = "success";
        return { active: false, inactiveReason: "NOT_FOUND" };
      }

      // Check session
      const session = await sessionRepo.findById(tokenRecord.sessionId);

      // R3: Inactive reason precedence (domain policy)
      const inactiveReason = resolveIntrospectInactiveReason(
        { revokedAt: tokenRecord.revokedAt, expiresAt: tokenRecord.expiresAt },
        session ? { status: session.status } : null,
      );

      if (inactiveReason) {
        operationResult = "success";
        return {
          active: false,
          principalId: session?.principalId,
          exp: tokenRecord.expiresAt
            ? Math.floor(tokenRecord.expiresAt.getTime() / 1000)
            : undefined,
          iat: tokenRecord.issuedAt
            ? Math.floor(tokenRecord.issuedAt.getTime() / 1000)
            : undefined,
          inactiveReason,
        };
      }

      // R2: active = token not revoked AND not expired AND session ACTIVE
      const result: IntrospectTokenResult = {
        active: true,
        principalId: session!.principalId,
        exp: Math.floor(tokenRecord.expiresAt.getTime() / 1000),
        iat: Math.floor(tokenRecord.issuedAt.getTime() / 1000),
      };

      if (includeScopes) {
        result.scopes = tokenRecord.scope;
      }

      operationResult = "success";
      return result;
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "introspection",
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
