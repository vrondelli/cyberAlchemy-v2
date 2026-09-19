---
task: TASK-SFOL-ADOPTION
layer: L3
slice: S-05
status: entry-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-ADOPTION

## Objective

Prove the unchanged DS-SFOL core against two materially different DomainSpec
features while keeping all business clauses and adapters consumer-owned.

## Source Contracts

- [SPEC generality proof](../../SPEC.md#generality-proof)
- [DESIGN dependencies](../../DESIGN.md#view-6-dependencies-and-interfaces)
- [cross-task gaps](../shared/cross-task-gaps.md)

## Dependencies and Entry Gates

SWU-SFOL-010 must be closed. Each adopter SWU additionally requires explicit
source-owner approval of its exact admitted clauses and fixture universes plus
a canonical node profile/compiler that preserves `domainspec-node-logic/v1`
through graph, manifest, and build handles. Approval may narrow an adoption
profile but cannot change core semantics.

## SWU-SFOL-011

- Primary behavior: encode and execute an approved Financial Settlement
  profile through consumer-owned canonical node logic, fixtures, exact
  bindings, and effect adapters.
- Independent acceptance boundary: every admitted Financial Settlement clause
  reaches exact-set closure or produces explicit failing residue; no adapter
  stores an expected result.
- Split analysis: clause authoring and adapter implementation were considered;
  only their exact joined outcome proves adoption, and the source owner remains
  a separate approval role within the SWU.
- Dependencies: SWU-SFOL-010, G-SFOL-01 approval, and G-SFOL-06 closure.
- Source anchors: approved Financial Settlement node/module handles selected
  from the canonical proof context at execution time; `SPEC.md` Generality
  Proof.
- Related context: current financial-settlement bindings and generated test
  report as migration evidence, including the current 12 assertions, 1
  property, and 67 explicit gaps snapshot.
- Write scope: consumer-owned Financial Settlement node logic, fixture
  universe, DS-SFOL binding/harness adapters, and adoption tests/reports. Core
  semantic changes are forbidden.
- Done criteria: approved clauses projected from canonical handles, exact-one bindings, pure/effect
  roles observed, no admitted residue, mutations detected, replay passes.
- Acceptance evidence: source approval reference, exact-set report, receipts,
  negative/mutation/replay output, no-core-change diff.
- Validation surface: feature-specific DS-SFOL suite, typecheck, source/digest
  validation, plan validator.
- Execution owner: manual source approval plus local-fallback implementation.
- Handoff: terminal receipt; refresh selects SWU-SFOL-012 only after
  G-SFOL-02 passes.

## SWU-SFOL-012

- Primary behavior: adopt Agent Execution Orchestrator using unchanged core
  language and semantics.
- Independent acceptance boundary: an independently approved AEO profile
  reaches exact-set closure and the compatibility audit finds no core semantic
  change or adopter vocabulary in core.
- Split analysis: adoption and compatibility audit were considered; the audit
  is the acceptance boundary that makes the second adoption evidence of
  generality rather than another feature patch.
- Dependencies: SWU-SFOL-011, G-SFOL-02 approval, and G-SFOL-06 closure.
- Source anchors: approved AEO node/module handles selected at execution time;
  `SPEC.md` Generality Proof.
- Related context: Financial Settlement adoption report for contract
  comparison, never semantic reuse.
- Write scope: consumer-owned AEO node logic, fixture universe,
  binding/harness adapters, and adoption tests/reports. Core semantic changes
  are forbidden.
- Done criteria: exact closure, replay and mutation pass, same core version and
  schemas as SWU-011, no adopter terms/paths in core.
- Acceptance evidence: approval reference, exact-set report, compatibility
  matrix, core diff/vocabulary scan, execution receipt.
- Validation surface: AEO DS-SFOL suite, cross-adopter compatibility check,
  typecheck, plan validator.
- Execution owner: manual source approval plus local-fallback implementation.
- Handoff: terminal receipt; refresh selects TASK-SFOL-VERIFY.

## Synchronization

If either adopter exposes a missing core behavior, stop and open a design gap.
Do not patch adopter-specific semantics into core within an adoption SWU.
