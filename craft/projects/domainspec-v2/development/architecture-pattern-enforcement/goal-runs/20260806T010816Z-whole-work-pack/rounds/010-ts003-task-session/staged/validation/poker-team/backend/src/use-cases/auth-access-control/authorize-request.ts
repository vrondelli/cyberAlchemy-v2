import type { AuthContext } from "../../domain/auth-access-control/auth-context.vo";
import { isCanonicalPermissionKey } from "../../domain/auth-access-control/auth-context.vo";
import type { PermissionGrantRepository } from "../../domain/auth-access-control/auth.repository";
import type { AuthEventHandler } from "../../domain/auth-access-control/auth.events";
import { AuthValidationError } from "../../domain/auth-access-control/auth.errors";
import { resolvePermissionDecision } from "../../domain/auth-access-control/permission-resolution";
import {
  createCounter,
  eventConsume,
  eventConsumerLag,
  eventEmit,
  operationDuration,
  operationInvocation,
  ruleViolation,
  workflowDuration,
  workflowFailed,
  workflowInvocation,
} from "../../infrastructure/telemetry/instruments";

export type AuthorizeRequestInput = {
  authContext: AuthContext;
  requiredPermission: string;
};

export type AuthorizeRequestResult = {
  allowed: boolean;
};

const FEATURE = "auth-access-control";
const OPERATION = "AuthorizeRequest";
const WORKFLOW = "AuthorizeRequestWorkflow";

const securityAccessDenied = createCounter("security.access_denied", {
  unit: "{denial}",
  description: "Authorization denials by permission and reason (O13 security)",
});

const businessAuthorizationDecisions = createCounter(
  "business.authorization_decisions",
  {
    unit: "{decision}",
    description: "Authorization decisions by result (O13 KPI)",
  },
);

export const authorizeRequestUseCase =
  (grantRepo: PermissionGrantRepository, onEvent?: AuthEventHandler) =>
  async (input: AuthorizeRequestInput): Promise<AuthorizeRequestResult> => {
    const startedAt = performance.now();
    let operationResult: "ALLOW" | "DENY" | "error" = "error";

    // R1: Required permission must be canonical
    try {
      if (!isCanonicalPermissionKey(input.requiredPermission)) {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R1",
        });
        operationResult = "DENY";
        throw new AuthValidationError(
          "FORBIDDEN",
          `Permission key is not canonical: ${input.requiredPermission}`,
        );
      }

      // Build grants from auth context permissions (already resolved at login)
      // Convert session effective permissions to grant structure for resolution
      const sessionGrants = input.authContext.permissions.map((key) => ({
        permissionKey: key,
        effect: "ALLOW" as const,
      }));

      // Also fetch explicit deny grants from repository
      const principalGrants = await grantRepo.findByGranteeKeys([
        input.authContext.principalId,
      ]);
      const denyGrants = principalGrants
        .filter((g) => g.effect === "DENY")
        .map((g) => ({
          permissionKey: g.permissionKey,
          effect: "DENY" as const,
        }));

      const allGrants = [...sessionGrants, ...denyGrants];

      // R2 + R3: Decision with deny-override policy
      const decision = resolvePermissionDecision(
        allGrants,
        input.requiredPermission,
      );

      if (decision === "DENY") {
        ruleViolation.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          rule_id: "R2",
        });
        if (denyGrants.length > 0) {
          ruleViolation.add(1, {
            feature: FEATURE,
            operation: OPERATION,
            rule_id: "R3",
          });
        }

        operationResult = "DENY";
        securityAccessDenied.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          required_permission: input.requiredPermission,
          reason_code: "FORBIDDEN",
        });
        businessAuthorizationDecisions.add(1, {
          feature: FEATURE,
          operation: OPERATION,
          result: "deny",
        });

        // Emit AccessDenied event
        if (onEvent) {
          await onEvent({
            type: "AccessDenied",
            principalId: input.authContext.principalId,
            requiredPermission: input.requiredPermission,
            reasonCode: "FORBIDDEN",
            occurredAt: new Date(),
          });

          eventEmit.add(1, {
            feature: FEATURE,
            event_type: "AccessDenied",
          });
          eventConsume.add(1, {
            feature: FEATURE,
            event_type: "AccessDenied",
            consumer: "security_analytics",
          });
          eventConsumerLag.record(0, {
            feature: FEATURE,
            event_type: "AccessDenied",
            consumer: "security_analytics",
          });
        }

        throw new AuthValidationError(
          "FORBIDDEN",
          "Missing required permission",
          {
            required: input.requiredPermission,
          },
        );
      }

      operationResult = "ALLOW";
      businessAuthorizationDecisions.add(1, {
        feature: FEATURE,
        operation: OPERATION,
        result: "allow",
      });

      return { allowed: true };
    } catch (error) {
      workflowFailed.add(1, {
        feature: FEATURE,
        workflow: WORKFLOW,
        failed_at_step: "authorize",
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
        result: operationResult === "ALLOW" ? "completed" : "failed",
      });
      workflowDuration.record(durationSec, {
        feature: FEATURE,
        workflow: WORKFLOW,
      });
    }

  };
