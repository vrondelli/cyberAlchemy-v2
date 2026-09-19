# Invoke Refresh Context Pack

## Envelope

- mode: `refresh`
- mutation mode: `apply-approved`
- target: Saga-removal task choreography
- evidence date: 2026-07-11
- source session: blocked `SWU-SGRM-002`
- next owner: `task-session`

The user's chained instruction to refresh the tasks and then run Task Session is
treated as approval to apply the recommended minimal repair recorded by the
blocked decision gate. It does not approve broader implementation mutation.

## Source Signals

| Signal | Source | Type | Claim | Confidence |
|---|---|---|---|---|
| `SIG-SGRM-REFRESH-001` | `runs/SWU-SGRM-002/TASK-SESSION-RESULT.md` | blocker_opened | Root authority migration fails the required relationship validator while the legacy schema still projects the removed edge. | high |
| `SIG-SGRM-REFRESH-002` | `runs/SWU-SGRM-002/DECISION-GATE.md` | route_changed | The minimal schema-edge bridge is the recommended reversible repair. | high |
| `SIG-SGRM-REFRESH-003` | `impl/spec/meta-types/behavioral/saga.schema.yml` | artifact_drift | `edge_participation.source_of: [orchestrates]` is the exact conflicting field. | high |
| `SIG-SGRM-REFRESH-004` | user instruction, 2026-07-11 | status_changed | Apply the task refresh and return execution to Task Session. | high |

## Target Inventory

| Artifact | Refresh delta |
|---|---|
| `work-pack/tasks/TASK-SGRM-AUTHORITY.md` | Add the one-field bridge to inputs, rules, write scope, done criteria, and handoff. |
| `WORK-PACK.md` | Reconcile the SGRM-002 manifest row and task gate. |
| `work-pack/waves/W1.md` | Name the bridge in the W1 exit condition. |
| `EXECUTION-PACK.md` | Record the revised SGRM-002 boundary. |
| `IMPLEMENTATION-LAYERING.md` | Clarify that L1 owns validator-consistency only, not schema deletion. |
| `saga-removal.dispatch.json` | Reconcile the authority step name, evidence, and stop condition. |
| `runs/SWU-SGRM-002/DECISION-GATE.md` | Record option 1 as selected from the apply-approved refresh instruction. |

## Constraints

- Do not change DS-D1, DS-D8, schemas, fixtures, validators, tests, or generated files during Invoke refresh.
- The refreshed SGRM-002 may mutate only `edge_participation.source_of` in the legacy schema outside its original authority scope.
- Do not alter the schema criterion, meta-type identity, fixtures, or deletion ownership.
- Keep `validate:rels` as a hard acceptance gate.
- Preserve SGRM-004 as owner of schema/card/fixture deletion.
- Revalidate the existing full dispatch document after its targeted delta.

## Strict Coverage

PASS. All proposed target mutations map to a high-confidence signal, have a
bounded validation check, and preserve the original removal target.
