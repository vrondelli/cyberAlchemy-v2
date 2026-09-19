# N41 complexity examples

Decision effect: none. Every scenario is hypothetical and preserves one invariant: each evaluator invocation consumes one exact sidecar digest, and neither action establishes present-head currentness.

## Low

One consumer owner accidentally writes two sidecars for the same boundary and snapshot after rerunning an authoring tool. Under A both immutable digests coexist and the caller explicitly chooses one. Under B both remain immutable and the owner may add an exact link saying one supersedes the other. Defer leaves the collision rule unresolved; stop ends the route. Demonstrates identity handling, not which attestation is semantically correct.

## Medium

The owner corrects a completeness declaration without changing the graph snapshot, producing a second sidecar with a different digest. Under A both coexist and downstream policy must choose an exact digest. Under B the owner can explicitly link the corrected sidecar to the prior one without rewriting either receipt. Defer blocks lifecycle standardization; stop ends the route. Adds a state correction, but does not prove currentness or invalidate historical evaluation.

## Complex

Two automation pipelines acting for the same consumer owner produce competing sidecars for the same boundary, predicate, and snapshot while separate branches remain active. Under A every digest remains an independent attestation and each evaluation binds one exactly. Under B an authorized consumer-owner process may create explicit digest-bound supersession links, while branch/current-head authority remains external. Defer leaves consumers without a shared collision rule; stop terminates the route. Adds multiple producers and branches, but does not define producer authorization, conflict resolution, or currentness schemas.

Coverage: 3/3 rungs; A/B/defer/stop covered evenly; unsupported claims: 0; decision effect: none.
