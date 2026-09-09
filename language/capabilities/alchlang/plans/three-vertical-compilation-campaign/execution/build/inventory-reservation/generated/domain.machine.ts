export const states = ["requested","reserved","rejected","released"] as const;
export const initialState = "requested" as const;
export const transitions = [
  {
    "id": "reserve",
    "from": "requested",
    "to": "reserved",
    "rule": "quantity-invariant",
    "event": "inventory-reserved"
  },
  {
    "id": "reject",
    "from": "requested",
    "to": "rejected",
    "rule": null,
    "event": null
  },
  {
    "id": "release",
    "from": "reserved",
    "to": "released",
    "rule": "reservation-exists",
    "event": "reservation-released"
  }
] as const;

export function transition(current: string, transitionId: string, guardAccepted = true): { state: string; event: string | null } {
  const selected = transitions.find((candidate) => candidate.id === transitionId);
  if (!selected) throw new Error("UNDECLARED_TRANSITION");
  if (selected.from !== current) throw new Error("SOURCE_MISMATCH");
  if (selected.rule !== null && !guardAccepted) throw new Error("GUARD_REJECTED");
  return { state: selected.to, event: selected.event };
}
