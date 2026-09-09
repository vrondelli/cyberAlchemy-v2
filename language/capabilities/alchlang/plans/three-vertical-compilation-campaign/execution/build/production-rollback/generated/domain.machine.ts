export const states = ["healthy","degraded","rollback-pending","rolling-back","restored","rollback-uncertain"] as const;
export const initialState = "healthy" as const;
export const transitions = [
  {
    "id": "mark-degraded",
    "from": "healthy",
    "to": "degraded",
    "rule": null,
    "event": null
  },
  {
    "id": "request-rollback",
    "from": "degraded",
    "to": "rollback-pending",
    "rule": "active-incident",
    "event": null
  },
  {
    "id": "start-rollback",
    "from": "rollback-pending",
    "to": "rolling-back",
    "rule": "current-grant",
    "event": "rollback-started"
  },
  {
    "id": "complete-rollback",
    "from": "rolling-back",
    "to": "restored",
    "rule": null,
    "event": "rollback-completed"
  },
  {
    "id": "record-uncertain",
    "from": "rolling-back",
    "to": "rollback-uncertain",
    "rule": null,
    "event": "rollback-outcome-uncertain"
  }
] as const;

export function transition(current: string, transitionId: string, guardAccepted = true): { state: string; event: string | null } {
  const selected = transitions.find((candidate) => candidate.id === transitionId);
  if (!selected) throw new Error("UNDECLARED_TRANSITION");
  if (selected.from !== current) throw new Error("SOURCE_MISMATCH");
  if (selected.rule !== null && !guardAccepted) throw new Error("GUARD_REJECTED");
  return { state: selected.to, event: selected.event };
}
