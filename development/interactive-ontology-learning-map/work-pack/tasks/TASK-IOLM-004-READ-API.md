# TASK-IOLM-004 — Immutable Read API

## Objective and mapping

- Slice/layer/wave: S-004 / L1 / W2.
- Objective: expose bounded immutable queries over one snapshot without filesystem, source, authority, or publication mutation.
- Dependencies: TASK-IOLM-002.

## Source contracts

- [Queries](../../queries.md)
- [Interfaces](../../interfaces.md)
- [Architecture — Read API](../../ARCHITECTURE-BUNDLE.md#read-api)
- [SPEC AC-09](../../SPEC.md#acceptance-criteria)

## SWU-IOLM-004-A

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-002-A/B pass |
| Source anchors | full queries route table; source-manifest boundary |
| Related context | compiler/layout/search receipts and [traceability](../shared/traceability.md) |
| Write scope | `prototype/src/api/` and `prototype/tests/api/` |
| Done criteria | all seven GET families implemented; ETags/snapshot identity; depth/facet/page caps; source anchors resolve only via manifest; no mutation routes |
| Acceptance evidence | positive route fixtures, unknown snapshot/entity behavior, arbitrary-path rejection, route inventory with no POST/PUT/PATCH/DELETE |
| Validation surface | host-native API tests and static route scan |
| Execution owner | Task Session; API implementer |
| Handoff | return route inventory, query limits, ETag checks, unresolved API residue |

## Completion

The task recomposes into a read model only. It must not introduce user state, challenge adjudication, source editing, promotion, or publication endpoints.
