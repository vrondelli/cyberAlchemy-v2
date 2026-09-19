import type { SessionStatus } from "./session.entity";
import { AuthValidationError } from "./auth.errors";

type SessionTransitionEvent =
  | "LoginSucceeded"
  | "LogoutCompleted"
  | "SessionExpired";

const VALID_TRANSITIONS: Record<
  string,
  { event: SessionTransitionEvent; to: SessionStatus }[]
> = {
  "[new]": [{ event: "LoginSucceeded", to: "ACTIVE" }],
  ACTIVE: [
    { event: "LogoutCompleted", to: "TERMINATED" },
    { event: "SessionExpired", to: "EXPIRED" },
  ],
  TERMINATED: [],
  EXPIRED: [],
};

export function transitionSession(
  currentStatus: SessionStatus | "[new]",
  event: SessionTransitionEvent,
): SessionStatus {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  const match = allowed.find((t) => t.event === event);

  if (!match) {
    throw new AuthValidationError(
      "AUTH_REQUIRED",
      `Invalid session transition: ${currentStatus} + ${event}`,
    );
  }

  return match.to;
}

export function isTerminalSessionState(status: SessionStatus): boolean {
  return status === "TERMINATED" || status === "EXPIRED";
}
