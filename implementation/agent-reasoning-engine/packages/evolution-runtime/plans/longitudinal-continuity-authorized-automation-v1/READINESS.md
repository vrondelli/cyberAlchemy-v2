# Implementation Readiness

Status: candidate planning assessment  
Authority effect: none

## Reused runtime capabilities

- Existing cycle definitions: `interaction-learning/v1` and
  `engine-improvement/v1`.
- Immutable `are.research-work-plan/v1` coordination plans.
- Durable content-addressed kernel and append-only receipts.
- Dependency-derived work frontiers, leases, fencing, bounded accounting, and
  explicit recovery.
- Typed handoff offers and acceptances.
- Construction-only validation path for disabled candidate definitions.

## Required implementation extensions

1. Longitudinal preference-event and derived-projection contracts.
2. Temporal confidence, scope promotion, conflict suspension, and revocation
   projection logic.
3. Typed standing-grant, objective-relation, and environment-class contracts.
4. Closed automation decision and effect-aware recovery records.
5. Cycle-specific validators for every new task validator reference.
6. Fixture runners and metric calculators for the declared cohorts.

These are implementation candidates, not work authorized by this package.

## Product frontier

The current frontier is structural validation of these candidate artifacts.
No cycle is run, no source logs are ingested, and no product behavior changes.

## Operational residue

- Historical data access is needed only when Cycle 1 corpus work begins.
- Provider credentials are not needed for structural validation or offline
  replay preparation.
- A typed standing grant is needed only for an eventual live automation canary.
- Serving activation belongs to a later controlled-upgrade cycle.

## Known blocker

The repository Goals route reports that Goals package validation is blocked.
Consequently this package cannot be registered as admitted execution state.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
