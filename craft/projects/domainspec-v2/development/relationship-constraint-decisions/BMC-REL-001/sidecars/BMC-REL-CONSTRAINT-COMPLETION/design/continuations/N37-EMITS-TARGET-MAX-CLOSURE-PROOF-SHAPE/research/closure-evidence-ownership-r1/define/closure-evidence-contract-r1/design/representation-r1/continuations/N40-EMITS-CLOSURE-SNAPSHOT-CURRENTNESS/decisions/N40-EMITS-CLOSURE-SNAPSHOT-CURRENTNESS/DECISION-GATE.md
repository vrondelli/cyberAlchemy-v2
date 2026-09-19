# N40 — emits closure snapshot currentness

Status: selected — A.

Question: may the evaluator issue an immutable result for an exact digest-bound snapshot while present-head currentness remains external?

- A — snapshot-relative evaluation, currentness external. Recommended.
- B — defer.
- C — stop.
- Explain — show more context; decision effect none.

Rejected: timestamp/TTL currentness, latest-path currentness, evaluator-owned project head, and rewriting historical receipts.

N39-A did not select N40. The user's later exact `A` selected only N40-A; it does not select a successor decision.
