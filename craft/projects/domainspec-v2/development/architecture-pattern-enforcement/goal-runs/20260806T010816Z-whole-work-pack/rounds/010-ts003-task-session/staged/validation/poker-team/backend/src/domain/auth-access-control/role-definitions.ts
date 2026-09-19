export type RoleDefinition = {
  roleKey: string;
  displayName: string;
  permissions: string[];
};

/**
 * Predefined role → permission mappings.
 * @source auth-access-control.RoleDefinition
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    roleKey: "admin",
    displayName: "Admin",
    permissions: [
      "player-management.*.*",
      "auth-access-control.admin.*",
      "player-makeup.*.*",
      "financial-settlement.*.*",
      "player-onboarding.*.*",
      "player-stats.*.*",
    ],
  },
  {
    roleKey: "manager",
    displayName: "Manager",
    permissions: [
      "player-management.read.*",
      "player-management.write.createPlayer",
      "player-management.write.createCoach",
      "player-management.write.assignCoach",
      "player-management.write.unassignCoach",
      "player-makeup.write.manageMakeup",
      "player-makeup.read.viewMakeup",
      "financial-settlement.*.*",
      "player-onboarding.review.listCandidates",
      "player-onboarding.review.getCandidateDetail",
      "player-onboarding.review.evaluateApplication",
    ],
  },
  {
    roleKey: "coach",
    displayName: "Coach",
    permissions: [
      "player-management.read.getCoachPlayers",
      "player-management.read.getPlayersOverview",
      "player-makeup.read.viewMakeup",
      "player-stats.read.*",
    ],
  },
  {
    roleKey: "player",
    displayName: "Player",
    permissions: [
      "player-makeup.read.viewMakeup",
      "player-stats.read.*",
    ],
  },
];
