---
decision_id: DEC-UIP-002-AGGREGATE-GUARD
status: resolved-by-profile
profile: .arcanum/profiles/decision-profile.yml
selected: isolate-and-carry-residue
date: 2026-07-17
---

# Decision Gate: Unrelated Aggregate Guard Failure

## Blocker

`npm run tools:test` produced 116 passing and 2 failing tests. Both failures are
the same retired-orchestration reference audit. It found four files under
`development/first-production-release/backend-type-test-engine-completeness/`
that are absent from its frozen manifest and allowlist. None is in
SWU-UIP-002's source or write scope.

## Options

1. Repair the retired-reference audit manifest/allowlist now. Rejected: it expands mutation
   into an unrelated authority surface and could legitimize references without
   their owning Task Session.
2. Isolate the unrelated failure, run all remaining and UI-focused validators,
   and carry the exact aggregate failure as typed residue. Selected.
3. Stop all UI-profile work immediately. Rejected: the failure is neither
   caused by nor coupled to the UI-profile implementation, and focused evidence
   can still be made complete.

## Profile Application

The decision profile requires reconciliation before action, the smallest
reliable slice, explicit write ownership, and deny-by-default mutation outside
scope. Option 2 is locally testable and preserves the unrelated guard unchanged.

This decision permits the current SWU to close only if all focused formation,
instance, relationship, content, docs, non-collapse, and typecheck validations
pass. The global `tools:test` failure remains visible and must be rechecked at
SWU-UIP-007; it is not relabeled as a pass.
