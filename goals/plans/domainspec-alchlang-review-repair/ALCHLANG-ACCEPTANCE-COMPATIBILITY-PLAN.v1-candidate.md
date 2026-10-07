# AlchLang FormalClaim acceptance compatibility — candidate repair plan

Status: candidate implementation plan; no owner decision, FormalClaim admission,
or migration is conferred by this document.

## Exact task

Make the BusinessAcceptanceDecision/v1 check explicit and regression-covered
for both BusinessMeaning/v1 and v2 when AlchLang lowers a new FormalClaim/v4.
Preserve the existing version-specific claim identity algorithms. An older
bundled Auth owner decision remains historical evidence; do not reinterpret or
auto-convert it as a BusinessAcceptanceDecision/v1.

## Context and decision

The current lowerer already checks the selected decision's schema, owner,
outcome, subject identity, and digest for both meaning versions. DomainSpec's
`business-acceptance-decision.v1-candidate.schema.json` is independent of
BusinessMeaning version, and the contract set makes it a canonical v4 input.
The clarified accepted Auth v1 meaning uses that decision shape. The older
AF-EXACT-SESSION-ROLE-PERMISSION-001 decision has a distinct bundled schema
and must not become a new v4 acceptance merely because its bytes are current.

Selected interpretation: strict new-claim lowering for both versions, with no
legacy fallback. This is a compatibility boundary for new output, not a rewrite
of historical records. The alternative of silently accepting opaque v1 bytes
would remove exact-subject acceptance verification and is rejected.

## DAG

1. Inventory the actual v1/v2 decision contracts, current lowerer, accepted
   clarified v1 record, and older bundled decision; leave source bytes alone.
2. Add focused v1/v2 adversarial tests for malformed decision shape, nested
   extra fields, wrong owner/outcome/subject/digest, and legacy opaque bytes.
   Include a valid reissued decision control: exact output references change
   for both versions, while v1 exact-meaning claim identity changes and v2
   v3-algorithm semantic claim identity remains stable. Check output schema.
3. Refactor the common decision check only if needed to make the invariant
   clear; do not change the v1 or v3 identity algorithm bytes.
4. Run focused lowering/projection tests, TypeScript typecheck, and relevant
   DomainSpec decision schema tests. Independently review the diff and repair
   any P1/P2 finding.
5. Synchronize implementation status with the exact test count and claim
   ceiling. No new Auth claim is emitted or admitted by this task.

## Write scope and done criteria

Write only this plan, the AlchLang FormalClaim lowerer and its focused test,
and the review-repair implementation status. Existing Auth decision files,
DomainSpec contracts, generated claims, fixtures, and runtime are read-only.
Done means v1/v2 meanings paired with a valid selected
BusinessAcceptanceDecision/v1 still lower; malformed, mismatched, or legacy
opaque selected decisions reject before claim emission; decision reissue
behavior matches the unchanged identity algorithms; the focused checks pass;
and review finds no remaining P1/P2 in this bounded repair. This does not
establish issuance authentication, semantic correspondence, or
`runtime_guarantees_observed`.

## Open Questions

- A historical bundled decision would need its own owner-authorized migration
  if someone later proposes it as an input to new FormalClaim/v4 lowering.
- DomainSpec-wide claim admission remains separate from this local lowerer.
