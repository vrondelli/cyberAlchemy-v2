import { AuthValidationError } from "./auth.errors";

export type LoginRiskContext = {
  ipReputation?: "TRUSTED" | "UNKNOWN" | "BLOCKED";
  failedAttemptsLast15m?: number;
  hasUserAgent?: boolean;
};

/**
 * R3: Login risk policy.
 * Denies when: IP blocked, ≥5 failed attempts in 15m, or missing user-agent.
 */
export function evaluateLoginRiskPolicy(
  context: LoginRiskContext | undefined,
): void {
  const ip = context?.ipReputation ?? "UNKNOWN";
  const failedAttempts = context?.failedAttemptsLast15m ?? 0;
  const hasUserAgent = context?.hasUserAgent ?? true;

  if (ip === "BLOCKED") {
    throw new AuthValidationError("FORBIDDEN", "Login denied: blocked IP");
  }
  if (failedAttempts >= 5) {
    throw new AuthValidationError(
      "FORBIDDEN",
      "Login denied: too many failed attempts",
    );
  }
  if (!hasUserAgent) {
    throw new AuthValidationError(
      "FORBIDDEN",
      "Login denied: missing user-agent",
    );
  }
}
