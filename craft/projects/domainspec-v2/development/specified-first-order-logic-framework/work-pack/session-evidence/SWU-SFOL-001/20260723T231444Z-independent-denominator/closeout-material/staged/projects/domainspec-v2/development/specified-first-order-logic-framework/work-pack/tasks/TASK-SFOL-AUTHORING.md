---
task: TASK-SFOL-AUTHORING
layer: L2
slice: S-04
status: dependency-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-AUTHORING

## Objective

Extract simple formal cells and multi-line `domainspec-logic` blocks from
owning aspect documents without shifting business authority into tooling.

## Source Contracts

- [SPEC source authoring contract](../../SPEC.md#source-authoring-contract)
- [DESIGN workflow process](../../DESIGN.md#view-4-workflow-process)
- [mappings source mapping](../../mappings.md)

## Dependencies and Gaps

SWU-SFOL-009 must be closed. This task uses framework-owned source fixtures;
real adopter source approval is deferred to L3.

## SWU-SFOL-010

- Primary behavior: locate, extract, validate, and round-trip source-owned logic
  fragments with stable identity, anchor, language version, owner, and digest.
- Independent acceptance boundary: table-cell and fenced-block fixtures produce
  deterministic `SourceFragment`s; duplicate IDs, stale anchors/digests,
  unsupported versions, malformed ownership, and partial modules fail.
- Split analysis: extraction and validation were considered separately; an
  unvalidated fragment cannot safely cross the source-authority boundary.
- Dependencies: SWU-SFOL-009.
- Source anchors: `SPEC.md` Source Authoring Contract; `DESIGN.md` Source
  Extractor.
- Related context: current DomainSpec aspect-document layouts selected live by
  Context Builder.
- Write scope: `src/sfol/source/`, source fixtures, extraction/round-trip tests,
  and narrowly scoped CLI integration if required by the approved interface.
- Done criteria: both authoring forms supported, source spans/digests stable,
  owner/profile admission separated, no binding inference, deterministic
  diagnostics.
- Acceptance evidence: source round-trip corpus, stale/duplicate/version
  negative cases, execution receipt.
- Validation surface: source tests, parser/type regression, typecheck, plan
  validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-011 only after
  G-SFOL-01 passes.

## Synchronization

This task cannot edit real adopter aspect documents or admit their clauses. It
implements the transport contract only.
