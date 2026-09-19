# C04 independent review: BLOCK

The review was performed and joined, but C04 completion criteria are not met: one P2 candidate-blocking finding remains open. C05 is not_evaluable because it depends on a passing C04 review.

Reviewer: `/root/c04_reviewer`, a fresh-context helper who did not build the candidate. Parent `/root` independently reproduced the finding and checked candidate integrity. Exact source: `9832ee36c5332be825ff065fb8cff05b23b2fd81`. Candidate manifest digest: `8a99e676c8b8979686873a55ea35aaec436ed9920b2284885fc7651d90e986a1`.

## C04-F01 — qualification consistency (P2, accepted-open)

The trusted standalone verifier accepts two certificates whose first observation says fail while their aggregate result says pass and their self-digests are stale. Refreshing outer bundle inventories, manifest hash and checksums yields PASS, 28/28. Both reviewer and parent reproduced this in disposable copies with network disabled and selected verifier source mounted read-only. The builder has the same shallow validation in qualificationBinding; builder acceptance was identified by source inspection, not independently executed for this case.

Affected source: `tools/verify-release-candidate.mjs:250-265` and `tools/build-release-candidate.mjs:123-128` under the selected CLI. Existing `src/qualification/execute.ts:280-310` contains relevant consistency checks to reuse or reproduce. Repair certificate shape/self-digest/required observations/aggregate result and plan/profile/receipt/evidence linkage, add regression cases that refresh outer hashes, then build and review a successor candidate.

The original run is not shown invalid. An expected immutable original manifest digest rejects this modified bundle. The defect concerns internal consistency under the documented optional expected-source-commit verifier interface; publisher authentication remains a separate boundary.

## Evidence and limits

Original C03 output manifest (67 files), selected source inputs (206 files), and packed inventory (248 regular files) match. Initial parent inventory comparison incorrectly stripped the declared package/ prefix; corrected comparison passes, and the initial diagnostic is retained. Prior C01-C03 passing observations remain historical evidence for their actual coverage, not evidence that this regression was covered.

`repro.mjs` imports the trusted verifier from `/source`; copy the original bundle to `/review/bundle` in a writable temporary directory and run it with the pinned Node image and network none. `reviewer-reproduction.json` and `parent-reproduction.json` retain both observed results. See `independent-review.json` for scope and limitations and `findings.json` for disposition.

## Construction frontier and operational residue

Product construction: C04 remains BLOCK on C04-F01; the next compiler action is bounded repair and successor-candidate verification. Independent dependency-ready product nodes E00, R00, U00 and L00 remain available under their own exact scopes. This review does not execute successors.

Operational support: O01 hosted-evidence inspection remains deferred to the Repository/release owner (actor unassigned), affecting compiler-release-preparation only. It does not block local prototype repair. No operational effect, product approval, publication, release or deployment is claimed. Frozen candidate, selected source, earlier evidence and original DAG snapshot were not changed.
