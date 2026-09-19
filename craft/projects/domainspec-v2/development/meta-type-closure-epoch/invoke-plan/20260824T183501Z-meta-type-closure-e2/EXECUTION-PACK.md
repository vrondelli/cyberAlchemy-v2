# Execution Pack — WP-MTC-001

## Planning Control

- Complexity: high
- Baseline wave: W0
- Execution entry: selection-ready, owner acceptance still pending
- Frontier: seven ordered SWUs
- Admission timing: selected-unit-at-task-session
- Risk ceiling: bounded repository-local writes under the execution root

## Waves

| Wave | Units | Goal | Promotion gate |
| --- | --- | --- | --- |
| [W0](waves/W0-BASELINE.md) | SWU-MTC-000, SWU-MTC-001 | freeze preservation baseline | exact 13/13 and source freshness |
| [W1](waves/W1-OPERATION-REBIND.md) | SWU-MTC-002, SWU-MTC-003 | stage two Operation dependency repairs | focused witnesses and declared-delta closure |
| [W2](waves/W2-WORKFLOW-D04.md) | SWU-MTC-004 | prove Workflow D04 | existing representation passes or bounded block |
| [W3](waves/W3-VALIDATE.md) | SWU-MTC-005 | complete staged validation | zero acceptance-critical failures |
| [W4](waves/W4-CANDIDATE.md) | SWU-MTC-006 | freeze candidate and requests | exact digest closure, admission remains false |

## Sequence

`000 → 001 → 002 → 003 → 004 → 005 → 006`. The prose and machine contracts use the same serialized frontier so only one Task Session can be active and every successor consumes the prior Invoke Refresh closeout.

## Stop Rules

Stop at the first real blocker. No retry after an acceptance-critical failure unless a separately accepted same-scope repair candidate exists. Never continue to candidate freeze on a red matrix.

## @4 Route Note

W0 now runs SWU-MTC-000 to materialize the exact Rule normalization overlay, then SWU-MTC-001 freezes the baseline. W3 uses the Operation closure composite and exact staged-product hygiene. The serialized frontier is `000 → 001 → 002 → 003 → 004 → 005 → 006`.

## @4 Resume Frontier

Candidate-local execution evidence is not adopted as standard-route completion. Begin at SWU-MTC-000 only after exact Rondelli Plan acceptance, fresh selection, current Task Session fast-entry, and single-use mutation admission.
