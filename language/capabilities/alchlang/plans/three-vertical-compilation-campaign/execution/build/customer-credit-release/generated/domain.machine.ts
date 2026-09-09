export const states = ["pending","approved","rejected","released"] as const;
export const initialState = "pending" as const;
export const transitions = [
  {
    "id": "approve-credit",
    "from": "pending",
    "to": "approved",
    "rule": null,
    "event": null
  },
  {
    "id": "reject-credit",
    "from": "pending",
    "to": "rejected",
    "rule": null,
    "event": null
  },
  {
    "id": "release-credit",
    "from": "approved",
    "to": "released",
    "rule": "approved-release",
    "event": "credit-released"
  }
] as const;

export function transition(current: string, transitionId: string, guardAccepted = true): { state: string; event: string | null } {
  const selected = transitions.find((candidate) => candidate.id === transitionId);
  if (!selected) throw new Error("UNDECLARED_TRANSITION");
  if (selected.from !== current) throw new Error("SOURCE_MISMATCH");
  if (selected.rule !== null && !guardAccepted) throw new Error("GUARD_REJECTED");
  return { state: selected.to, event: selected.event };
}
