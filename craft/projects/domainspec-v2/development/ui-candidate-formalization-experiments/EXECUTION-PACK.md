---
artifact_id: UCFE-EXECUTION-PACK-v1
status: ready
complexity: high
baseline_wave: W0
active_layer_window: L0
readiness_profile: pilot
---

# Execution Pack

## Choreography

```text
W0: 001 -> 002
W1: 003 -> [covered-existing -> 008]
          [distinct route -> 004 -> 005 -> 006]
W2: 007 -> 008
W3: 009 -> 010
```

SWU-005 and SWU-007 require real external evidence inputs. They are manual or
local Task Session units, not candidates for autonomous evidence invention.

## Receipt Contract

Every SWU returns:

```yaml
swu_id: SWU-UCFE-NNN
result: pass | flag | block | interrupted
capability_ref: task-session | experiment-harness | empirical-review
receipt_kind: native-stage | local-fallback | manual | blocked
receipt_artifact: <path or none>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <owner or none>
handoff_note: <next exact dependency>
```

## Branch Rules

- A complete `covered-existing` result skips SWU-004 through 007 and routes to
  SWU-008; skipped units receive explicit not-applicable receipts.
- An incomplete coverage result is not a collapse result and opens the distinct
  evidence lane.
- Missing corpus B or reviewers returns `BLOCK` with owner and input contract;
  it does not downgrade thresholds.
- `defer-missing` at SWU-008 still permits pilot audit and process learning.
- SWU-009 extracts a reusable profile only when the audit shows the process,
  identity, and boundary contracts worked; candidate success is not required.

## Execution Boundaries

- Local sequential Task Sessions are the default.
- Experiment Harness owns repeatable experiment execution in SWU-003/006.
- Human reviewers own SWU-007 attestations.
- DS-D1 owner review occurs after SWU-008 and is outside mutation authority.
- No subagent dispatch is planned; future parallel evidence collection requires
  a fresh `domainspec-subagents-strategy` proposal and confirmation.
