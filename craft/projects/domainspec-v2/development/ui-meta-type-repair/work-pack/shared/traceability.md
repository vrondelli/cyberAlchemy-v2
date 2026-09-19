# Traceability

## Original Repair Baseline

| Research solution | Spec | SWUs | State |
| --- | --- | --- | --- |
| S1 nonempty rule | AC-02 | 002, 003 | complete |
| S2 mutation ledger | AC-03 | 004 | complete |
| S3 reroute receipt | AC-04 | 005 | complete |
| S4 formation dossier | AC-07 | 008 | complete |
| S5 corpus receipt | AC-05 | 006 | complete |
| S6 owner packet | AC-06 | 007 | complete |
| S7 orchestration index | AC-08 | 009 | complete |
| shared authority boundary | AC-09 | 001, 010 | 001 complete; 010 pending |

## Successor Decision Trace

| Decision/gap | Planned evidence | SWUs | Audited by |
| --- | --- | --- | --- |
| DEC-UIR-007 / GAP-UIR-004 | bounded-search receipt and corpus generation 002 | 011-012 | 015, 010 |
| DEC-UIR-008 / GAP-UIR-005 | per-candidate portability policy evaluation | 013 | 015, 010 |
| DEC-UIR-009 / GAP-UIR-006 | independent-positive `missing` classification | 013 | 015, 010 |
| DEC-UIR-010 / GAP-UIR-007 | separate relationship owner-decision generation | 014 | 015, 010 |
| successor recomposition | dossier v2 and index v2 | 015 | 010 |

## Completion Evidence

Original SWU receipts remain under `runs/SWU-UIR-001` through 009. Successor
SWUs must add the same `receipt.json` and `TASK-SESSION-RESULT.md` pattern under
their own run directories before parent task/work-pack state changes.

SWU-UIR-011 is accepted at `runs/SWU-UIR-011/receipt.json`: the bounded-search
contract proves that incomplete and error-bearing searches cannot construct
`observed-absent`. SWU-UIR-012 is the selected successor consumer.

SWU-UIR-012 is accepted at `runs/SWU-UIR-012/receipt.json`: corpus generation
002 is an immutable successor with one bounded absence handle, zero unresolved
observations, and byte-identical generation 001. SWU-UIR-013 is selected next.

SWU-UIR-013 is accepted at `runs/SWU-UIR-013/receipt.json`: nine candidates are
evaluated independently below the fixed threshold and Form/Action are typed
`missing`, with no candidate or authority mutation. SWU-UIR-014 is selected.

SWU-UIR-014 is accepted at `runs/SWU-UIR-014/receipt.json`: DEC-UIR-010 is
persisted 4/4 in a separate no-effect record while DS-D8 and packet generation
001 remain unchanged. SWU-UIR-015 is selected.

SWU-UIR-015 is accepted at `runs/SWU-UIR-015/receipt.json`: dossier v2 remains
DEFER and index v2 composes seven handle-only planes with v1 lineage. SWU-UIR-010
is selected for integrated audit.

SWU-UIR-010 passes at `audit/integrated-001/result.json`. Mechanical evidence
is complete and immutable; the package remains DEFER on GAP-UIR-005/006.
