export const OUTCOMES = Object.freeze({
  INVALID_INPUT: "InvalidInput",
  UNAUTHORIZED_CATALOG: "UnauthorizedCatalog",
  OUT_OF_DOMAIN: "OutOfDomain",
  DEFEATED: "Ineligible.Defeated",
  INSUFFICIENT: "Deferred.Insufficient",
  ESCALATE_OWNER: "EscalateOwner",
  RECOMMENDED: "RecommendedUnderSnapshot",
  INVALIDATED: "Invalidated",
});

export const OUTCOME_VALUES = Object.freeze(Object.values(OUTCOMES));
