---
artifact_id: CDSC2-EXEC-v0.1
status: ready
work_pack: WORK-PACK.md
---

# Execution Pack

## Choreography

```text
W0: SWU-001 -> SWU-002
                    |
                    v
W1:          SWU-003 || SWU-004
                    |
                    v
W2:          SWU-005 -> SWU-006
                    |
                    v
W3:                  SWU-007
```

## Wave Gates

| Gate | Condition | Failure route |
| --- | --- | --- |
| `G-CDSC2-W0` | parity, predecessor, source pins, and baseline equivalence pass | block mutation execution and repair selected L0 SWU |
| `G-CDSC2-W1` | two disjoint immutable observation receipts exist | rerun failed mutation or preserve indeterminate evidence |
| `G-CDSC2-W2` | F3 v2 validates and exactly one successor index entry appends | block closeout; never rewrite either generation |
| `G-CDSC2-W3` | fresh replay and authority/source audits pass | `CALIBRATION-FAIL` or bounded decision route |

## Parallelization Boundary

Only SWU-CDSC2-003 and SWU-CDSC2-004 may fan out, after explicit permission and
W0 acceptance. Each worker receives the same frozen baseline but writes one
mutation/result subtree. Parent synthesis joins receipts before SWU-CDSC2-005.

## Required Receipt Shape

```yaml
swu_id: SWU-CDSC2-NNN
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <next owner or none>
handoff_note: <next coordinator action>
```

## Stop Conditions

- Any generation-1 or fixture-source mutation.
- Baseline mutation execution before equivalence acceptance.
- Mutation outside its declared edit surface.
- Late vector, observable, or prediction changes.
- Missing predecessor or in-place generation update.
- Any identity, type, pattern, DS-D1, DS-D8, candidate, or promotion claim.
