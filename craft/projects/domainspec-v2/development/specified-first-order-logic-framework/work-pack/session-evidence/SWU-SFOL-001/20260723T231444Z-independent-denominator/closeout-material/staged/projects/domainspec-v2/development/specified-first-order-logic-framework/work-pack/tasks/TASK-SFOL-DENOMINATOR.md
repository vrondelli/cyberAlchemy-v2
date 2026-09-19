---
task: TASK-SFOL-DENOMINATOR
layer: L0
slice: S-01
status: selected
updatedAt: 2026-07-23
---

# TASK-SFOL-DENOMINATOR

## Objective

Create the independent exact clause denominator that every later semantic
coverage claim must match.

## Source Contracts

- [SPEC required invariants](../../SPEC.md#required-invariants)
- [DESIGN proof boundary](../../DESIGN.md#proof-boundary)
- [shared context](../shared/context.md)

## Dependencies and Gaps

No implementation dependency or blocker. The denominator consumes only an
owner manifest and source handles. It must not parse logic or consume generated
records.

## SWU-SFOL-001

- Primary behavior: build a frozen `ClauseDenominator` that validates stable
  admitted clause identities, source anchors, content digests, kinds, and
  profile versions.
- Independent acceptance boundary: an adopter-neutral fixture returns one
  canonical exact set; missing, extra, duplicate, stale, malformed, and
  generator-shaped input each fail with stable diagnostics.
- Split analysis: model-only and validator-only children were considered.
  Neither produces an independently useful trust boundary; construction plus
  negative validation is one behavior.
- Dependencies: none.
- Source anchors: `SPEC.md` invariants 2, 7, and 8; `DESIGN.md` View 2
  denominator component.
- Related context: existing engine formal/generation output schemas are
  negative dependency references only.
- Write scope:
  `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/`
  and denominator-focused tests/fixtures under the engine test roots.
- Done criteria:
  - API and data contracts are typed and documented;
  - ordering and serialization are deterministic;
  - identity/digest duplicates and conflicts fail;
  - a dependency scan proves no imports from language, cases, bindings,
    emitters, runners, evaluator, proof, generated output, or receipts;
  - negative fixtures cannot be mistaken for a passing denominator.
- Acceptance evidence: targeted test output, dependency-scan output, exact
  fixture snapshot, and Task Session execution receipt.
- Validation surface: targeted Node test file(s), engine typecheck, dependency
  scan, and plan validator.
- Execution owner: local-fallback.
- Handoff: emit `task-session-execution-receipt/v1` and stop. Refresh updates
  only declared closeout targets, writes
  `closeouts/SWU-SFOL-001/INVOKE-REFRESH-RECEIPT.json`, and selects
  SWU-SFOL-002.

## Synchronization

Do not edit language, bindings, runners, consumer sources, or structural BTE
catalogues. Completion changes only this task/SWU evidence and route state.
