# Invoke refresh report

Date: 2026-09-12. Mutation mode: owner-directed planning refresh.
Authority effect: none.

## Source signal

User decision: “do not run it through task session, it was broken, we should do
the plan like the first 1”.

Interpretation applied: use the completed CRABS replay precedent—exact
owner-directed native execution, frozen inputs, bounded resources, fresh
evidence paths and separate technical replay. This refresh does not authorize
implementation or provider execution.

## Applied deltas

- Excluded Task Session from every successor execution and handoff path.
- Converted B-001 from an unresolved blocker into an attributable resolved
  execution-architecture decision.
- Made removal of the hardcoded legacy gate part of SWU-T0-01.
- Kept source/tool/property/bound preflight and authority checks distinct.
- Changed the work-pack planning gate from block to pass.
- Kept B-002 exact execution authorization, B-003 financial-property ownership
  and B-004 product review as real later gates.
- Updated the DAG, work-pack, tasks, waves, layering, validation, traceability
  and roadmap frontier consistently.

## Validation

The refreshed DAG, SWUs, tasks, links and exclusion language are revalidated in
[VALIDATION.md](VALIDATION.md). The installed Invoke package lacks its declared
`refresh.md` mode file, so the root refresh contract's typed-signal,
delta-summary and proposal/effect boundaries were applied directly.

## Open Questions

See [WORK-PACK.md](WORK-PACK.md#blockers-and-open-questions).

