---
artifact_id: UIP-EXECUTION-PACK-v1
status: ready
complexity: high
output_mode: split
---

# Execution Pack

## One-Stream Choreography

```text
W0: UIP-001
      |
W1: UIP-002 -> UIP-003
      |
W2: UIP-004 -> UIP-005
      |
W3: UIP-006 -> UIP-007
      |
definitions-governance / DS-D8 / profile-owner decision
```

Run one Task Session SWU at a time and automatically select the unique ready
successor after each accepted receipt. This plan intentionally avoids subagent
fan-out so execution needs no parallel-dispatch gate.

## Shared Runtime Contract

At execution time Context Builder emits a strict Markdown plus JSON/index pack
under `runs/<SWU>/`. Every receipt returns:

```yaml
swu_id: SWU-UIP-NNN
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: runs/SWU-UIP-NNN/receipt.json
files_touched: []
validation: []
blockers: []
residue: []
reroute: none | owner
handoff_note: next selected SWU or blocker
```

## Continuation Rule

Continue automatically when:

- the receipt is `pass` or a non-blocking `flag` whose residue has an owner;
- the next SWU is uniquely determined by `WORK-PACK.md`;
- the next write scope does not include canonical authority;
- its source context and validation surface are complete.

Stop only for a contract contradiction, non-unique ready unit, undeclared
authority mutation, failed validation, stale owner digest, or a decision that
changes canonical placement.

## Authority Boundary

SWU-UIP-006 produces a packet; it does not resolve it. SWU-UIP-007 may close the
development work-pack as owner-ready. Applying DS-D1, DS-D8, supported-profile,
or FPR-02 changes is a later owner route.

## Expected Final State

- UI concepts: `required-by-design`.
- Development profile: `mechanically-validated`.
- Empirical confidence: `provisional` or `unmeasured` per concept.
- Canonical/release status: unchanged until owner decisions.
