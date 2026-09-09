# TASK-IOLM-002 — Deterministic Projection Compiler

## BTE consumer-proof input

The compiler consumes the BTE handoff read-only. It must preserve node/edge IDs,
profile/source/graph/obligation/receipt identity, and explicit posture; generate
semantic/learner/navigation/layout/search projections keyed by the unchanged
semantic hash; and reject stale, unknown-ID, semantically mutating, missing, or
empty inputs. Writes remain bounded to `prototype/src/**` and
`prototype/tests/**` after IOLM-owned gates pass.

## Objective and mapping

- Slice/layer/wave: S-002 / L1 / W2.
- Objective: import the exact owner-generated DomainSpec `Sg` unchanged and compile source-preserving semantic plus separately typed learner, navigation, layout, and search artifacts.
- Dependencies: TASK-IOLM-001.

## Source contracts

- [Architecture — data partitions and identity](../../ARCHITECTURE-BUNDLE.md#data-partitions)
- [Operations](../../operations.md)
- [States](../../states.md)
- [Accepted findings — Deterministic read path](../../../research/2026-07-14-interactive-ontology-learning-map/findings.md#deterministic-read-path)

## SWU-IOLM-002-A — Extraction and canonical semantic build

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-001-A/B pass and the bound G-DSV2-SG handle remains exact |
| Source anchors | approved manifest/import schema; operations VerifyDomainSpecGraphInput/ImportDomainSpecGraph/CompileProjection/BuildSemanticView |
| Related context | [traceability](../shared/traceability.md) AC-02/AC-03 |
| Write scope | `prototype/src/compiler/` and `prototype/tests/compiler/` |
| Done criteria | import `Sg` with unchanged relation identity and provenance; extract other source-local values/anchors; report unresolved refs and unapproved mappings as residue; canonical stable sort; build separate semantic/learner/navigation artifacts; exclude clock/layout/learning data from semantic bytes |
| Acceptance evidence | imported `Sg` edge is byte/identity stable; identical clean builds have equal semantic bytes/hash; learner/nav-only mutation leaves them equal; identity-bearing mutation changes relevant identity |
| Validation surface | unit/schema suite plus clean double-build comparison |
| Execution owner | Task Session; compiler implementer |
| Handoff | return artifact contract, canonicalization rules, hashes, residue |

## SWU-IOLM-002-B — Layout and search artifacts

| Field | Contract |
|---|---|
| Dependencies | SWU-IOLM-002-A pass |
| Source anchors | architecture technology/scale; operations PrecomputeLayout |
| Related context | W2 execution receipt from 002-A |
| Write scope | `prototype/src/layout/`, `prototype/src/search/`, and their tests |
| Done criteria | pin runtime/library versions; precompute stable ELK layout; build deterministic search index; key outputs by snapshot/policy |
| Acceptance evidence | repeated coordinates/index/ETag equality; layout policy change changes layout identity but not semantic hash |
| Validation surface | deterministic double-build and focused unit tests |
| Execution owner | Task Session; layout/search implementer |
| Handoff | return version pins, output hashes, measured corpus counts; no scale claim |

## Synchronization and completion

Execute A then B. Feature tables and local fixtures may provide learner/source anchors, but may not reconstruct DomainSpec admitted relations. Task completes when the full immutable artifact set is reproducible and its identity boundaries are independently tested.
