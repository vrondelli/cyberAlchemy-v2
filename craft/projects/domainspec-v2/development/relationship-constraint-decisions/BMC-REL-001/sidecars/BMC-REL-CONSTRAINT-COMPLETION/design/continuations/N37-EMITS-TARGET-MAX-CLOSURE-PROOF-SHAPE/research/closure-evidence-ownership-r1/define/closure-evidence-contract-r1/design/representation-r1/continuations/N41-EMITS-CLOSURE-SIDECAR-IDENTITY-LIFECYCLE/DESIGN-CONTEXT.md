# N41 Design context: same-snapshot sidecar identity

Status: N41-A selected; N42 payload representation pending.

N39-A selected a dedicated consumer-authored sidecar, and N40-A limited evaluation receipts to the exact bound snapshot while leaving present-head currentness external. The next unresolved collision is narrower: the same consumer owner may author more than one immutable sidecar for the same boundary, predicate, and exact snapshot tuple.

The evaluator already binds one exact path and digest, so multiple attestations can be evaluated without ambiguity. What remains consequential is whether they simply coexist as separate immutable identities or whether the consumer owner may author an explicit digest-bound supersession link.

N41-A selects independent digest-addressed coexistence with no supersession. It does not define currentness, invalidation, a canonical schema, filenames, payload representation, profile admission, packet projection, implementation, runtime Event behavior, or D06 work.
