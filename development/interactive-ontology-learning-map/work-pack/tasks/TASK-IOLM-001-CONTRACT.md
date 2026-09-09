# TASK-IOLM-001 — Contract and Source Manifest

## Objective and mapping

- Slice/layer/wave: S-001 / L0 / W1.
- Objective: turn the approved candidate posture and exact read-only DomainSpec `Sg` handle into executable import/projection schemas, non-collapse fixtures, and a default-deny source manifest.
- Dependencies: TASK-IOLM-000 and TASK-IOLM-000B pass.
- Status: blocked by G-DSV2-SG; G-OWNER is recorded.

## Source contracts

- [SPEC — record contract and acceptance](../../SPEC.md#candidate-record-contract)
- [Mappings](../../mappings.md)
- [Architecture — validation](../../ARCHITECTURE-BUNDLE.md#validation-architecture)
- [Accepted findings — Candidate projection contract](../../../research/2026-07-14-interactive-ontology-learning-map/findings.md#candidate-projection-contract)
- [CAV2 node model](../../../../ontology/NODE-MODEL.md#node-concept-contract)

## SWU-IOLM-001-A — Schema and non-collapse fixtures

| Field | Contract |
|---|---|
| Dependencies | G-OWNER decision and G-DSV2-SG readiness handle |
| Source anchors | SPEC non-collapse invariants and DomainSpec graph consumer boundary; findings core non-collapse laws; both gate receipts |
| Related context | [traceability](../shared/traceability.md) AC-01/AC-03 |
| Write scope | `prototype/contracts/` and `prototype/fixtures/non-collapse/` |
| Done criteria | versioned import/projection schemas for sources, records, imported/attempted relations, three derived views, layouts, validation receipts; positive fixture and one discriminating negative fixture per law |
| Acceptance evidence | validator accepts the exact minimal `Sg` input and rejects each named invalid collapse, missing/empty graph, profile/source/graph mismatch, and attempted local DomainSpec graph reconstruction |
| Validation surface | host-native schema test command recorded in RESULT; `git diff --check` |
| Execution owner | Task Session; schema/evidence implementer |
| Handoff | selected after both gates; return schema paths, command, law coverage, bound `Sg` identity, residue |

## SWU-IOLM-001-B — Source manifest and privacy fixtures

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-001-A pass |
| Source anchors | CONTEXT E-01 through E-14; architecture privacy/security |
| Related context | [shared context](../shared/context.md) |
| Write scope | `prototype/manifests/` and `prototype/fixtures/sources/` |
| Done criteria | explicit allowed path, revision/hash, owner namespace, selector, privacy/excerpt policy for every L0 source; arbitrary and changed sources fail closed |
| Acceptance evidence | complete manifest coverage plus missing/unallowed/revision-drift negative receipts |
| Validation surface | manifest validator and private-path/channel scan |
| Execution owner | Task Session; source-boundary implementer |
| Handoff | starts only after 001-A; return exact manifest hash and unresolved anchors |

## Synchronization and completion

Execute A then B. Do not parallelize because the manifest shape depends on the schema. The schema is an import/projection contract, never an alternate DomainSpec graph registry. Task completes when both receipts pass and candidate vocabulary remains visibly versioned/non-canonical.
