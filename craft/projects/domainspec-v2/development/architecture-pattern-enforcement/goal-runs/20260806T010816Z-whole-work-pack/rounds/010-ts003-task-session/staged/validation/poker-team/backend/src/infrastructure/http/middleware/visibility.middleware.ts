import { resolvePlayerVisibility } from "../../../domain/coach/player-visibility.service";
import { drizzleCoachRepository } from "../../repositories/drizzle-coach.repository";
import { drizzleCoachAssignmentRepository } from "../../repositories/drizzle-coach-assignment.repository";
import { drizzlePlayerRepository } from "../../repositories/drizzle-player.repository";

export type AuthenticatedRequest = {
  user?: { sub?: string };
  authUserData?: { permissions?: string[] };
};

export class VisibilityError extends Error {
  constructor() {
    super("FORBIDDEN_VISIBILITY");
  }
}

/**
 * Shared visibility enforcement for route handlers.
 * Resolves which players the authenticated actor may access
 * and throws VisibilityError if the target player is not visible.
 */
export const enforceVisibility = async (
  request: AuthenticatedRequest,
  targetPlayerId: string,
): Promise<void> => {
  const actorId = request.user?.sub as string | undefined;
  const permissions = (request.authUserData?.permissions ?? []) as string[];

  if (!actorId) {
    throw new Error("Missing actor context");
  }

  const getVisibility = resolvePlayerVisibility(
    drizzleCoachRepository,
    drizzleCoachAssignmentRepository,
    drizzlePlayerRepository,
  );

  const visibleIds = await getVisibility({
    actorPrincipalId: actorId,
    actorPermissions: permissions,
  });

  if (!visibleIds.includes(targetPlayerId)) {
    throw new VisibilityError();
  }
};
