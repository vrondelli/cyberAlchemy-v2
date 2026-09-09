# Risks and Decisions

| Risk | Severity | Control | Residue |
| --- | --- | --- | --- |
| facet becomes second semantic copy | critical | index exact existing objects; validate facet-set digest | implementation must prove pointer/object reuse or canonical serialization equality |
| recursive scene digest | major | normative non-recursive two-phase algorithm with excluded back-reference | implementation witness pending |
| v1/v1.1 evidence rewritten | critical | v1.2 successor plus compatibility witness | no prior receipt may be relabeled |
| summary/view-model cache drift | major | carry relation digest and reject mismatch | cache invalidation implementation pending |
| static snapshot bloats output | minor | minimum self-contained text fields and measured full fixture | size budget unmeasured |
| encoding migration changes cues | major | compare registry derivation to current values | owner decision required on mismatch |
| Body War denominator contradiction | major | one explicit source baseline and migration receipt | current 237/231 versus planned 276/301/577 unresolved |
| bare-Node test failure repeated | major | Plan must bind repository-owned loader/runner | command not yet selected |

Decision status: ADR-RR-01 through ADR-RR-06 are candidate design decisions for a later UOVA owner refresh, not amendments to the completed design.
