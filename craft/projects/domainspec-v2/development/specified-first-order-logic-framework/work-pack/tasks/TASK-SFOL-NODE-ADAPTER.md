---
task: TASK-SFOL-NODE-ADAPTER
layer: L2
slice: S-04
status: dependency-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-NODE-ADAPTER

## Objective

Project structured DS-SFOL modules from the canonical node
graph/manifest/build proof context without shifting business authority into
tooling or rebuilding the feature graph.

## Source Contracts

- [SPEC node authoring contract](../../SPEC.md#node-authoring-contract)
- [DESIGN workflow process](../../DESIGN.md#view-4-workflow-process)
- [mappings source mapping](../../mappings.md)

## Dependencies and Gaps

SWU-SFOL-009 must be closed. This task uses framework-owned proof-context
fixtures. Real adopter source approval and a compatible successor node profile
are deferred to L3.

## SWU-SFOL-010

- Primary behavior: validate one canonical graph/manifest/build proof context
  and losslessly project every admitted behavioral node logic payload into a
  deterministic `NodeLogicEnvelope`.
- Independent acceptance boundary: exact proof-context fixtures produce a
  bijective envelope set; missing or extra nodes, stale/incompatible handles,
  unsupported payload versions, malformed ownership, direct node-file input,
  Markdown input, and a second graph fail.
- Split analysis: proof-context validation and logic projection were considered
  separately; an unvalidated or lossy projection cannot safely cross the node
  authority boundary.
- Dependencies: SWU-SFOL-009.
- Source anchors: `SPEC.md` Source Authoring Contract; `DESIGN.md` Source
  Extractor.
- Related context: canonical minted-project node schema and compiler
  graph/manifest/build outputs selected live by Context Builder.
- Write scope: `src/sfol/node-source/`, proof-context fixtures, projection
  tests, and narrowly scoped CLI integration if required by the approved
  interface.
- Done criteria: one canonical input route, exact handle preservation,
  node-to-envelope bijection, owner/profile admission separated, no binding
  inference, deterministic diagnostics, Markdown/direct-node paths absent.
- Acceptance evidence: projection corpus, stale/duplicate/version/bijection
  negatives, forbidden dependency scan, execution receipt.
- Validation surface: node-projection tests, decoder/type regression,
  typecheck, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-011 only after
  G-SFOL-01 passes.

## Synchronization

This task cannot edit real adopter nodes, node schemas, compiler authority, or
admit clauses. It implements the semantic projection adapter only.
