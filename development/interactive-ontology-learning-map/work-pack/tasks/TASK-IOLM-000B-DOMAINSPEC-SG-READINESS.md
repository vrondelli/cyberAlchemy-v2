# TASK-IOLM-000B — Verify DomainSpec `Sg` Readiness

## BTE handoff synchronization

The readiness check must accept the FPR-02B BTE handoff only with explicit
candidate/authoritative posture and matching source/profile/graph/obligation/
receipt digests. It must keep `G-DSV2-SG` blocked when owner receipts, bounded
`Sg`, or independent retraction evidence are missing; a candidate BTE output
cannot waive this gate.

## Objective and mapping

- Slice/layer/wave: S-000B / pre-L0 / W0.
- Objective: verify, without changing upstream state, that the existing DomainSpec owner route has produced the exact prerequisites and bounded semantic graph the learning map may consume.
- Status: blocked pending the live retired-reference guard and existing FPR-01, FPR-02, FPR-03, and FPR-04 owner receipts.
- Mutation exemption: this is a read-only readiness-verification unit, not DomainSpec implementation, lifecycle closure, or prototype implementation.

## Source contracts

- [SPEC — DomainSpec graph boundary](../../SPEC.md#domainspec-graph-consumer-boundary)
- [Engine-gap findings — dogfood handoff](../../../../../projects/domainspec-v2/research/2026-07-14-engine-gap-inventory/findings.md#interactive-ontology-implementer-dogfood-handoff)
- [Engine-gap findings — dependency chain](../../../../../projects/domainspec-v2/research/2026-07-14-engine-gap-inventory/findings.md#authority-safe-dependency-chain)
- [Inventory synthesis — accepted result](../../../../../.arcanum/inventory/entries/domainspec-v2-engine-gap-inventory-dispatch-closeout-synthesis.md#accepted-result)

## SWU-IOLM-000B-A

| Field | Contract |
|---|---|
| Dependencies | live retired-reference guard; exact owner receipts for FPR-01, FPR-02, FPR-03, and bounded FPR-04 |
| Source anchors | source contracts above; `EGI-008`, `EGI-010`, and `EGI-011` |
| Related context | [cross-task gaps](../shared/cross-task-gaps.md) SGRM-006/007, FPR-01..04, and G-DSV2-SG |
| Write scope | `work-pack/session-evidence/SWU-IOLM-000B-A/` only; no writes to `projects/domainspec-v2/` or `prototype/` |
| Done criteria | bind exact FPR/profile/source/graph identities; verify a non-empty schema-valid two-node/one-admitted-edge `Sg`; verify explicit `Sg -> G` quotient and an independent retraction result |
| Acceptance evidence | immutable receipt references plus a `domainspec-sg-readiness-handle` that identifies the exact `Sg` input and prerequisite receipts |
| Validation surface | read-only receipt/schema checks; EGI-008 missing/empty rejection; EGI-010 local-edge collision rejection; EGI-011 retraction mutants |
| Execution owner | Task Session in verify mode; no DomainSpec authority delegation |
| Handoff | if pass, close only G-DSV2-SG; if any input is absent, mismatched, empty, or invalid, remain blocked and route residue to the existing FPR owner |

## Authority exclusions

This task cannot restore the guard, set an FPR state, select a supported profile, decide precedence, approve a relation, define quotient/retraction semantics, certify engine acceptance, or replace an upstream owner receipt. It only verifies and binds evidence already emitted by those owners.

## Recomposition

The readiness handle closes the local consumer gate only. Prototype mutation still requires G-OWNER, and a passing learning-map build cannot be promoted back into DomainSpec authority.
