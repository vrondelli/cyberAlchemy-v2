---
module: artifact-admission-validator
version: current
status: draft
updatedAt: 2026-07-11
docType: implementation-layering
---

# Implementation Layering: Artifact Admission Validator

## Purpose

Stage deterministic enforcement for `CAV2-C18` without freezing unresolved
authority decisions or making the validator an authority source.

## Source Contract

- [CAV2-C18 Artifact Admission Before Mutation](../../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c18-artifact-admission-before-mutation)
- [Artifact Tree Admission discipline](../../../disciplines/cards/artifact-tree-admission.md)
- [CAV2-D42 Governed Artifact Tree](../../../authority/definitions/DEFINITIONS.md#cav2-d42-governed-artifact-tree)
- [CAV2-D51 Canonical Artifact](../../../authority/definitions/DEFINITIONS.md#cav2-d51-canonical-artifact)
- [CAV2-D52 Artifact Durability](../../../authority/definitions/DEFINITIONS.md#cav2-d52-artifact-durability)
- [Canonical Kinds](../../../ontology/canonical-kinds/CANONICAL-KINDS.md)

## Target And Scope

- Target: repository-local artifact admission validator
- Scope: validation workflow and policy adapter
- Current state: constitution rule and discipline exist; deterministic adapter does not
- Implementation language: Python 3 standard library
- Primary input: one JSON admission record plus repository policy sources
- Primary output: deterministic JSON/text receipt with `pass`, `flag`, `block`, or `defer`

## Layer Boundary Rule

Each layer answers one decision before more scope is admitted.

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included Scope | Deferred Scope | Exit Evidence | Promotion Decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 (POC) | After this layer, we know whether the C18 admission classes and verdicts can be represented and evaluated deterministically. | JSON admission schema, example template, verdict engine, and in-memory fixture policy. | `working`/`governed`, required/forbidden fields, path containment, inheritance declaration, verdict/exit-code contract. | Markdown registry parsing, parent-link checks, C7/C14 post-mutation checks, CI. | Schema parses; pass/flag/block/defer fixtures produce exact receipts. | Continue only if policy outcomes match C18 examples and non-examples. |
| L1 | After this layer, we know whether the validator works repeatably against the live repository contracts. | Two-phase CLI with strict Canonical Kinds table loader and pre/post checks. | Canonical-kind membership, process/rollup/durability checks, target existence, parent entrypoint, machine-readable output. | Observability append, CI, rule promotion. | CLI fixture suite and one non-mutating live CAV2 witness pass. | Harden only if malformed policy sources fail closed and live output is stable. |
| L2 | After this layer, we know whether governance composition and degraded behavior are reliable. | C7/C14 selectors, load-bearing tree fields, owner-gated deferrals, receipts, docs, and owner handoffs. | C7/C14 composition, promotion-reference checks, deterministic report schema, review residue, validation README. | Automatic repository-wide scanning and CI blocking. | Full fixture matrix, malformed-input tests, owner-boundary audit, C18 adapter proposal. | Prepare owner review; do not promote C18 automatically. |
| L3 | After this layer, we know whether repository-wide rollout is justified. | Optional CI/pre-commit integration after observed local runs. | Batch discovery, changed-path selection, CI policy, release packaging. | Cross-repository/public generalization. | Low false-positive rate, run receipts, approved rollout decision. | Pilot, narrow, or defer. Current plan defers L3. |

## Non-Regression Guardrails

- The validator consumes constitution and definition contracts; it does not redefine them.
- `working` remains inexpensive and may inherit an admitted parent.
- Canonical classification never implies authority.
- Unknown canonical kinds block a canonical claim but do not forbid explicit non-canonical work.
- Canonical Kinds parse failure is a tool/policy error, never an empty allowed set.
- Durability overrides defer while `CANONICAL-KINDS.md` OQ-3 lacks an approved carrier.
- C7 and C14 remain their own rules; C18 only selects and composes them.
- L3 automation cannot begin from preference; it requires L2 run evidence.

## Recommended Next Layer

- Next layer: L0
- First executable unit: `SWU-AAV-001`
- Key decision unlocked: whether one admission record can encode C18 without semantic invention
- Major deferred scope: CI integration, bulk repository scan, rule promotion, and public reuse
