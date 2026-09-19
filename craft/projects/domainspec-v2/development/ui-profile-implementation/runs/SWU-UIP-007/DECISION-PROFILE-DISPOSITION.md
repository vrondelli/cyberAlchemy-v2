---
decision_id: DEC-UIP-007-AGGREGATE-RESIDUE
profile: .arcanum/profiles/decision-profile.yml
status: resolved
selected_action: isolate-and-carry
---

# Decision Profile Disposition: Aggregate Residue

## Trigger

The integrated `npm run validate` gate stops in `tools:test`: 134 of 136 tests
pass, while two assertions report the same retired-reference guard result. The
guard identifies four files in
`development/first-production-release/backend-type-test-engine-completeness/`.

## Decision Profile Application

- Smallest reliable slice: finish and verify the UI-profile work-pack only.
- Default deny: do not edit another work-pack, the frozen reference manifest,
  or its exception policy through SWU-UIP-007.
- Explicit authority: this SWU may write only its run evidence and synchronize
  this work-pack.
- Evidence preservation: record the exact four-file residue and the 134/136
  aggregate result.
- No false green: status is `complete-with-external-residue`, not unqualified
  `complete` and not repository-wide green.

## Selected Action

Isolate and carry the external failure. All UI-owned focused tests, compilation,
traversal, packet, engine, type, document, content, relationship, and lint gates
pass. The guard repair remains separately owned by the backend completeness or
retired-reference maintenance route.

This applies the same facts and scope policy as
`DEC-UIP-002-AGGREGATE-GUARD`; it does not widen the exception list or classify
the four files.
