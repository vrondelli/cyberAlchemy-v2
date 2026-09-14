# Offering and qualification

## Candidate engagement

**Name:** Bounded Software Correctness and Repair Assurance.

**Best fit:** a company has a high-value business or state-transition rule, an
accessible implementation, a reproducible build, and an owner able to decide
the rule's intended meaning. Examples include authorization decisions,
financial invariants, workflow transitions, idempotency, distributed-state
convergence, evidence-pipeline truthfulness, and fail-closed behavior.

**Core output:** a property statement, frozen implementation/tool manifest,
counterexample search, typed result, defect explanation if applicable, optional
repair patch, bounded retest, negative-control record, residual-risk statement,
and separate technical replay.

## Qualification gates

A pilot is eligible only when all are true:

- a named property owner can resolve semantic disputes;
- source or executable bytes and required build dependencies are available;
- the implementation can run in an isolated environment without production
  effects;
- test data may be lawfully supplied under an agreed retention boundary;
- the property can be stated with observable inputs and outcomes;
- the customer accepts typed non-success results; and
- repair authority and deployment authority are assigned separately.

The engagement is deferred when the real consumer implementation is absent,
the owner cannot settle the property's meaning, required access is unavailable,
or the only possible evidence would be a synthetic surrogate presented as real.

## Result vocabulary

| Result | Meaning |
| --- | --- |
| Counterexample | One bound input or execution trace violates the frozen property. |
| No counterexample within bounds | All declared rows completed without a violating observation. |
| Inconclusive | The declared search could not produce sufficient evaluable evidence. |
| Conflicting evidence | Bound evidence sources disagree and the conflict remains visible. |

Only a confirmed counterexample opens defect explanation and repair. A repair
passes only when the original counterexample no longer violates the property,
the frozen regression set completes, selected superficial-repair controls are
detected, and the evidence mechanism itself does not falsely report success.

## Exclusions

The candidate does not claim general program correctness, unlimited state-space
coverage, legal compliance, penetration-test coverage, production safety,
independent accreditation, or customer certification. Deployment and runtime
authorization stay with the customer's owners.

## Open Questions

See [DECISION-BRIEF.md](DECISION-BRIEF.md#open-questions).

