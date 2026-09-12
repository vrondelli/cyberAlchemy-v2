# T4 — Independent L2 replay and promotion decision

Layer/slice: L2/S3. DAG: R, I, J. Complexity: medium.

## Objective and SWUs

- SWU-T4-01: record a reviewer distinct from repair/evidence authors, private
  access boundary, environment and shared-assumption disclosure.
- SWU-T4-02: reviewer inspects the property and package without conversation
  coaching, runs fresh T2 replay and selected independent T3 probes, checks
  hashes/denominators/bounds and reports corrections.
- SWU-T4-03: compare author/reviewer evidence and select promote, remediate,
  narrow or stop.

Write scope: assignment record, fresh reviewer attempt, review and completion
decision. The reviewer may not edit frozen inputs or author evidence.

Failure modes: same assertion label with different semantics, shared-host drift,
missing control, author-only oracle, differing result, or reviewer unable to
obtain private inputs. Preserve the issue and withhold promotion.

Done evidence: attributable reviewer report, raw replay, cost/timing, resolved
corrections and a bounded L2 decision with authority effect none.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).

