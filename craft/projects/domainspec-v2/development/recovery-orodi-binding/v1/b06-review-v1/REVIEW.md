# B06 independent review

Verdict: **BLOCK**. Candidate `DSV2-ORODI-RECOVERY-B05-001` is not ready for product approval.

Reviewer: `/root/b06_reviewer`. This is the parent-persisted record of the completed independent review, with parent corroboration identified separately.

Reviewed PRODUCT-TEST-MANIFEST.json SHA-256: `073f5a2c3d75786f96ce100fa0b0f5bf2c4a16df0f9cee397cc119574d92bb9a`.

The reviewer independently re-normalized the frozen raw campaign through the adapter. The normalized document and all 60 records exactly match the stored bundle. There are 60 unique raw scenario/repetition slots and 60 distinct producer PIDs. These findings concern evaluator acceptance enforcement; they do not establish fabrication of the recorded campaign.

## B06-F01 — P1: normalized assertions can pass without raw evidence

Location: `projects/domainspec-v2/impl/operational-resilience/src/evaluate-recovery-product-test.ts:116–124,152–178`.

The evaluator checks supplied document digests and binding roles but does not resolve normalized `raw_source`/`raw_pointer`, validate adapter correspondence, or reconcile `original_result` with the normalized facts. The independently pinned binding does not pin the selected raw evidence and normalized assertions.

Reproduction: load frozen bundle.json, retain the original caller-pinned binding digest and recorded evaluation instant, and remove the raw RESULTS.json document. Evaluation still returns passed, 60/60. Separately replace normalized raw references with absent references and original_result with FAIL, rehash only the normalized document, and update record source references. Evaluation again returns passed, 60/60. The reviewer also observed a substituted runtime_outcome in passing receipts.

Correction: independently bind raw evidence and normalized output and verify their correspondence through the trusted adapter or an equally exact bridge. Reject unresolved references and contradictory original facts. Add hostile coverage.

## B06-F02 — P1: one repetition can satisfy both repetitions

Location: `projects/domainspec-v2/impl/operational-resilience/src/evaluate-recovery-product-test.ts:138–154,172–178`.

The evaluator enforces uniqueness of outer record labels but does not match the selected assertion's scenario_id/repetition to its outer slot or require distinct corresponding observations.

Reproduction: for each repetition-two record, use the same scenario's repetition-one pointer. No document or binding digest changes are needed. Evaluation returns passed, 60/60, despite selecting only 30 distinct assertions.

Correction: check selected assertion identity against its slot, bind capture metadata to its raw observation, and reject evidence reuse across repetitions. Add the pointer-reassignment regression test.

## Independently executed checks

- Reviewed manifest hash matches the exact requested candidate.
- Inspected evaluator, contract, adapter, observer, observed-case driver, campaign, assembler, relevant manifests, regression evidence and declared requirements, including the B01/B02 profile bound by the compiled-system source.
- Raw adapter replay exactly reproduces the stored normalized document and 60 records; 18 assertions retain unknown and both F26 runtime outcomes remain null.
- Frozen evaluation replay passes 60/60. All three hostile evaluator probes above incorrectly pass.
- Evaluator controls: missing slot yields missing with 59 passes; duplicate slot yields invalid; historical origin under fresh claim yields inconclusive; binding expiry yields stale.
- Adapter controls: duplicate raw run and missing observer capture yield invalid; raw FAIL yields downstream failed through record_consistent; F26 runtime-observation claim yields downstream failed through formation_satisfied.
- Nine observer-only tests pass: read-only snapshots and connection release, missing file, WAL refusal without new files, outside-root/symlink refusal, parent/field validation, bounded lock failure, denied write SQL, separate stores, and row budget.

The initial direct TypeScript import failed on source import resolution. Corrected in-memory probes used Node native type stripping with a .js-to-.ts resolution hook and completed successfully.

## Observer and claim limits

The inspected observer uses existing-file mode=ro, query_only, a SQL authorizer, pre-connection WAL refusal, bounded row/snapshot sizes, and finally-based connection closure. Controls passed. This is not proof of race-free filesystem confinement or universal wall-clock bounds; SQL work and the observer subprocess have separate bounds. No exhaustive race, resource-exhaustion or concurrency audit was performed.

Observation remains before/after barriers. Intra-test semantics remain authored producer evidence. Pre-COMMIT authorization checks do not prove a physical COMMIT-completion deadline. No runtime admission, deployment, production or universal exactly-once claim follows.

## Legacy regressions

The recorded broad suite remains 162 passed and 2 failed. Both Body War JSON files conflict with the hostile descriptor discriminator asserted at operational-resilience/test/operational-evidence.test.ts:98, before evaluator invocation at line 100. The failures are consistent with fixture-selection defects.

The reviewer did not rerun the broad suite or establish a historical before-change baseline. Type-check and other component results are recorded evidence only. The B05 plan explicitly carries fixture selection as operational-support residue while requiring preservation of C01–C16 and seven-family behavior. This permits continued independent prototype work; it is neither a full-suite PASS nor an owner waiver. The two P1 findings independently block approval readiness.

## Parent corroboration and closeout

The parent separately reproduced baseline PASS and all three hostile false-PASS probes in memory with an unchanged binding digest. The parent checked all 343 allowlisted hashes before dispatch and again at closeout; all match. Those full hash audits are parent checks, not independently repeated reviewer checks.

No frozen files were edited. Neither campaign.py nor assemble.mjs was executed. No fresh full campaign, broad regression rerun, type-check rerun, exhaustive concurrency audit, OS attestation or external effect was performed during this review.

Preserve B05. Repair these boundaries in a successor candidate, add hostile tests, obtain fresh relevant test evidence and independent review, and only then request product approval. Review completion confers no approval or operational authority.
