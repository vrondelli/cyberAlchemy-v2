---
artifact_id: CDSC-EXEC-v0.1
status: complete
work_pack: WORK-PACK.md
---

# Execution Pack

Generation 1 completed all four waves. The final suite verdict is
`CALIBRATION-DEFER`; continuation requires a new bounded F3 evidence-repair
generation and may not rewrite this execution.

## Choreography

```text
W0: SWU-001 -> SWU-002
                    |
                    v
W1: SWU-003 || SWU-004 || SWU-005
                    |
                    v
W2: SWU-006
                    |
                    v
W3: SWU-007
```

W1 is the only parallelizable wave. Each W1 worker owns one fixture receipt and
must not write another receipt, shared contract, evaluator, or source file.

## Wave Gates

| Gate | Condition | Failure route |
| --- | --- | --- |
| `G-CDSC-W0` | schemas, manifest, evaluator, and total outcome vectors pass | repair selected W0 SWU |
| `G-CDSC-W1` | three receipts validate, use frozen contracts, and preserve source read-only boundary | rerun failed fixture SWU or defer generation |
| `G-CDSC-W2` | generation result is deterministic and control rule enforced | block closeout and inspect evaluator/input digest |
| `G-CDSC-W3` | independent replay matches and audit finds no authority leakage | `CALIBRATION-FAIL` or bounded decision-gate |

## Parallelization Boundary

Runtime subagents are recommended only for `SWU-CDSC-003..005`, after explicit
permission. Join policy is parent synthesis: the parent validates each receipt,
checks disjoint write scopes, and records all three handles before 006 begins.

## Required Receipt Shape

```yaml
swu_id: SWU-CDSC-NNN
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

- Any fixture-source mutation.
- Missing or revised post-freeze predicate matrix cells.
- Conflicting source selectors or semantic digests.
- An evaluator that infers evidence or explanation values.
- In-place generation updates.
- Any identity, pattern, DS-D1, DS-D8, or promotion claim.
