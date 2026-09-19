# TASK-MNP-ADMISSION — Owner Ratification and Fixture Disposition

Layer: L3  
Status: deferred by operator; implementation stream ends at passing SWU-MNP-006

## Purpose and Decision Owned

Bind exact production artifacts, supported profile, and existing fixture disposition to owner receipts. This is the only task that may make an admission/migration recommendation, and only owners can approve it.

## SWU-MNP-007

- Goal: produce the owner-reviewed admission and migration packet.
- Dependencies: SWU-MNP-006 conformance receipt; FPR-01/FPR-04 decisions; current guard receipt; exact artifact paths/digests.
- Write scope: a later owner-selected private admission evidence folder plus the disposition/migration packet; no source fixture may move unless a consumer-example destination and dedicated migration task are separately approved.
- Procedure:
  1. inventory schemas, compiler, generator, minter, fixtures, and receipts by exact path/digest;
  2. verify the dispositions already bound by `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE`, and record whether each effective condition has become true without silently reclassifying a row;
  3. confirm no fixture is labeled consumer authority while it remains in DomainSpec;
  4. bind the supported kind/profile and relationship-state policy separately from registry counts;
  5. bind FPR source-home and projection posture without rewriting historical decisions;
  6. run guard, conformance replay, leakage scan, and deliberate receipt/artifact mutation;
  7. obtain definitions, validation, layering, FPR, and independent verification approvals required by the live owner model;
  8. emit ratification or explicit rejection/defer receipt.
- Edge cases: missing owner, multiple authoritative homes, stale digest, favorable-count selection, generated view admitted as source, fixture migrated without provenance, private/public boundary leak.
- Done criteria: every artifact/fixture has one disposition; all required owners are bound; mutation invalidates receipt; no release claim exceeds approval.
- Acceptance evidence: disposition matrix, signed/reviewed digest receipt, replay result, negative mutation, rollback/retraction route.
- Verification: `npm --prefix projects/domainspec-v2/impl run validate`, manual owner review, deterministic receipt verification, and the current guard command named by the later admission context pack.
- Execution owner: manual.
- Handoff: only an approved verified receipt may open release/rollout work. Rejection returns to the named task or Decision Gate.
